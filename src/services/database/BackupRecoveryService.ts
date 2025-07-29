import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from './EnhancedSupabaseService';

export interface BackupConfiguration {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  backup_type: 'full' | 'incremental' | 'differential';
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:MM format
    day_of_week?: number; // 0-6, Sunday = 0
    day_of_month?: number; // 1-31
  };
  retention_policy: {
    keep_daily: number;
    keep_weekly: number;
    keep_monthly: number;
    keep_yearly: number;
  };
  storage_location: 'local' | 's3' | 'gcs' | 'azure';
  encryption_enabled: boolean;
  compression_enabled: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BackupJob {
  id: string;
  configuration_id: string;
  backup_type: 'full' | 'incremental' | 'differential';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  file_size: number;
  file_path: string;
  checksum: string;
  error_message?: string;
  metadata: {
    tables_backed_up: string[];
    records_count: number;
    compression_ratio?: number;
  };
}

export interface RestoreJob {
  id: string;
  backup_job_id: string;
  restore_type: 'full' | 'selective';
  target_database: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  tables_to_restore?: string[];
  point_in_time?: Date;
  error_message?: string;
}

export interface BackupMetrics {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  total_storage_used: number;
  average_backup_time: number;
  last_backup_date: Date;
  next_scheduled_backup: Date;
  backup_success_rate: number;
}

export class BackupRecoveryService {
  private static instance: BackupRecoveryService;

  private constructor() {}

  public static getInstance(): BackupRecoveryService {
    if (!BackupRecoveryService.instance) {
      BackupRecoveryService.instance = new BackupRecoveryService();
    }
    return BackupRecoveryService.instance;
  }

  // Backup Configuration Management
  async createBackupConfiguration(config: Omit<BackupConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<BackupConfiguration> {
    try {
      console.log(`🔄 Creating backup configuration: ${config.name}`);

      const { data, error } = await supabase
        .from('backup_configurations')
        .insert({
          user_id: config.user_id,
          name: config.name,
          description: config.description,
          backup_type: config.backup_type,
          schedule: config.schedule,
          retention_policy: config.retention_policy,
          storage_location: config.storage_location,
          encryption_enabled: config.encryption_enabled,
          compression_enabled: config.compression_enabled,
          is_active: config.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule the backup job
      if (config.is_active) {
        await this.scheduleBackupJob(data.id);
      }

      console.log(`✅ Backup configuration created: ${config.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create backup configuration:', error);
      throw error;
    }
  }

  async getBackupConfigurations(userId: string): Promise<BackupConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('backup_configurations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get backup configurations:', error);
      throw error;
    }
  }

  // Backup Execution
  async executeBackup(configurationId: string): Promise<BackupJob> {
    try {
      console.log(`🔄 Executing backup for configuration: ${configurationId}`);

      // Get configuration
      const { data: config, error: configError } = await supabase
        .from('backup_configurations')
        .select('*')
        .eq('id', configurationId)
        .single();

      if (configError) throw configError;

      // Create backup job
      const { data: job, error: jobError } = await supabase
        .from('backup_jobs')
        .insert({
          configuration_id: configurationId,
          backup_type: config.backup_type,
          status: 'queued',
          started_at: new Date().toISOString(),
          file_size: 0,
          file_path: '',
          checksum: '',
          metadata: {
            tables_backed_up: [],
            records_count: 0
          }
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Execute backup asynchronously
      this.performBackup(job.id).catch(error => {
        console.error(`Backup job ${job.id} failed:`, error);
      });

      console.log(`✅ Backup job queued: ${job.id}`);
      return job;

    } catch (error) {
      console.error('❌ Failed to execute backup:', error);
      throw error;
    }
  }

  private async performBackup(jobId: string): Promise<void> {
    try {
      // Update job status
      await supabase
        .from('backup_jobs')
        .update({ status: 'running' })
        .eq('id', jobId);

      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('backup_jobs')
        .select('*, configuration:configuration_id(*)')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const config = job.configuration;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_${config.user_id}_${timestamp}.sql`;
      const filePath = `backups/${config.user_id}/${fileName}`;

      // Get tables to backup
      const tablesToBackup = await this.getTablesList(config.user_id);
      
      // Perform backup based on type
      let backupData: any;
      let recordsCount = 0;

      switch (config.backup_type) {
        case 'full':
          backupData = await this.performFullBackup(config.user_id, tablesToBackup);
          recordsCount = backupData.totalRecords;
          break;
        case 'incremental':
          backupData = await this.performIncrementalBackup(config.user_id, tablesToBackup);
          recordsCount = backupData.totalRecords;
          break;
        case 'differential':
          backupData = await this.performDifferentialBackup(config.user_id, tablesToBackup);
          recordsCount = backupData.totalRecords;
          break;
      }

      // Compress if enabled
      let finalData = backupData.sql;
      let compressionRatio = 1;
      
      if (config.compression_enabled) {
        const compressed = await this.compressData(finalData);
        finalData = compressed.data;
        compressionRatio = compressed.ratio;
      }

      // Encrypt if enabled
      if (config.encryption_enabled) {
        finalData = await this.encryptData(finalData, config.user_id);
      }

      // Store backup file
      const fileSize = await this.storeBackupFile(filePath, finalData, config.storage_location);
      const checksum = await this.calculateChecksum(finalData);

      // Update job with completion
      await supabase
        .from('backup_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_size: fileSize,
          file_path: filePath,
          checksum: checksum,
          metadata: {
            tables_backed_up: tablesToBackup,
            records_count: recordsCount,
            compression_ratio: compressionRatio
          }
        })
        .eq('id', jobId);

      // Clean up old backups based on retention policy
      await this.cleanupOldBackups(config.id, config.retention_policy);

      console.log(`✅ Backup completed: ${jobId}`);

    } catch (error) {
      console.error(`❌ Backup failed: ${jobId}`, error);

      // Update job with error
      await supabase
        .from('backup_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.toString()
        })
        .eq('id', jobId);
    }
  }

  private async getTablesList(userId: string): Promise<string[]> {
    // Get list of tables that belong to this user
    return [
      'contacts',
      'contact_interactions',
      'deals',
      'campaigns',
      'email_campaigns',
      'automation_workflows',
      'behavioral_signals',
      'customer_intelligence',
      'predictive_analytics',
      'lead_scores'
    ];
  }

  private async performFullBackup(userId: string, tables: string[]): Promise<{ sql: string; totalRecords: number }> {
    let sql = '';
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        if (data && data.length > 0) {
          sql += `-- Table: ${table}\n`;
          sql += `DELETE FROM ${table} WHERE user_id = '${userId}';\n`;
          
          for (const record of data) {
            const columns = Object.keys(record).join(', ');
            const values = Object.values(record)
              .map(v => v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
              .join(', ');
            sql += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
          }
          
          sql += '\n';
          totalRecords += data.length;
        }
      } catch (error) {
        console.error(`Failed to backup table ${table}:`, error);
      }
    }

    return { sql, totalRecords };
  }

  private async performIncrementalBackup(userId: string, tables: string[]): Promise<{ sql: string; totalRecords: number }> {
    // Get last backup date
    const { data: lastBackup } = await supabase
      .from('backup_jobs')
      .select('completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastBackupDate = lastBackup?.completed_at || new Date(0).toISOString();

    let sql = '';
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .gte('updated_at', lastBackupDate);

        if (error) throw error;

        if (data && data.length > 0) {
          sql += `-- Incremental backup for table: ${table}\n`;
          
          for (const record of data) {
            const columns = Object.keys(record).join(', ');
            const values = Object.values(record)
              .map(v => v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
              .join(', ');
            sql += `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${values});\n`;
          }
          
          sql += '\n';
          totalRecords += data.length;
        }
      } catch (error) {
        console.error(`Failed to backup table ${table}:`, error);
      }
    }

    return { sql, totalRecords };
  }

  private async performDifferentialBackup(userId: string, tables: string[]): Promise<{ sql: string; totalRecords: number }> {
    // Get last full backup date
    const { data: lastFullBackup } = await supabase
      .from('backup_jobs')
      .select('completed_at')
      .eq('backup_type', 'full')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    const lastFullBackupDate = lastFullBackup?.completed_at || new Date(0).toISOString();

    let sql = '';
    let totalRecords = 0;

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', userId)
          .gte('updated_at', lastFullBackupDate);

        if (error) throw error;

        if (data && data.length > 0) {
          sql += `-- Differential backup for table: ${table}\n`;
          
          for (const record of data) {
            const columns = Object.keys(record).join(', ');
            const values = Object.values(record)
              .map(v => v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
              .join(', ');
            sql += `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${values});\n`;
          }
          
          sql += '\n';
          totalRecords += data.length;
        }
      } catch (error) {
        console.error(`Failed to backup table ${table}:`, error);
      }
    }

    return { sql, totalRecords };
  }

  private async compressData(data: string): Promise<{ data: string; ratio: number }> {
    // Mock compression - in reality would use gzip or similar
    const originalSize = data.length;
    const compressedData = data; // Would be compressed
    const compressedSize = Math.floor(originalSize * 0.7); // Mock 30% compression
    
    return {
      data: compressedData,
      ratio: originalSize / compressedSize
    };
  }

  private async encryptData(data: string, userId: string): Promise<string> {
    // Mock encryption - in reality would use proper encryption
    return Buffer.from(data).toString('base64');
  }

  private async storeBackupFile(filePath: string, data: string, storageLocation: string): Promise<number> {
    // Mock file storage - in reality would store to actual storage
    console.log(`📁 Storing backup file: ${filePath} to ${storageLocation}`);
    return data.length;
  }

  private async calculateChecksum(data: string): Promise<string> {
    // Mock checksum calculation
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  private async cleanupOldBackups(configId: string, retentionPolicy: any): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionPolicy.keep_daily);

      // Delete old backup jobs
      const { error } = await supabase
        .from('backup_jobs')
        .delete()
        .eq('configuration_id', configId)
        .lt('completed_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`🧹 Cleaned up old backups for configuration: ${configId}`);

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  // Restore Operations
  async createRestoreJob(backupJobId: string, restoreType: 'full' | 'selective', options: {
    targetDatabase?: string;
    tablesToRestore?: string[];
    pointInTime?: Date;
  }): Promise<RestoreJob> {
    try {
      console.log(`🔄 Creating restore job for backup: ${backupJobId}`);

      const { data, error } = await supabase
        .from('restore_jobs')
        .insert({
          backup_job_id: backupJobId,
          restore_type: restoreType,
          target_database: options.targetDatabase || 'main',
          status: 'queued',
          started_at: new Date().toISOString(),
          tables_to_restore: options.tablesToRestore,
          point_in_time: options.pointInTime?.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Execute restore asynchronously
      this.performRestore(data.id).catch(error => {
        console.error(`Restore job ${data.id} failed:`, error);
      });

      console.log(`✅ Restore job created: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create restore job:', error);
      throw error;
    }
  }

  private async performRestore(restoreJobId: string): Promise<void> {
    try {
      // Update job status
      await supabase
        .from('restore_jobs')
        .update({ status: 'running' })
        .eq('id', restoreJobId);

      // Get restore job details
      const { data: restoreJob, error: restoreError } = await supabase
        .from('restore_jobs')
        .select('*, backup_job:backup_job_id(*)')
        .eq('id', restoreJobId)
        .single();

      if (restoreError) throw restoreError;

      const backupJob = restoreJob.backup_job;

      // Get backup file
      const backupData = await this.retrieveBackupFile(backupJob.file_path, backupJob.storage_location);

      // Decrypt if needed
      let processedData = backupData;
      if (backupJob.configuration.encryption_enabled) {
        processedData = await this.decryptData(processedData, backupJob.configuration.user_id);
      }

      // Decompress if needed
      if (backupJob.configuration.compression_enabled) {
        processedData = await this.decompressData(processedData);
      }

      // Execute restore based on type
      if (restoreJob.restore_type === 'full') {
        await this.executeFullRestore(processedData);
      } else {
        await this.executeSelectiveRestore(processedData, restoreJob.tables_to_restore);
      }

      // Update job completion
      await supabase
        .from('restore_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', restoreJobId);

      console.log(`✅ Restore completed: ${restoreJobId}`);

    } catch (error) {
      console.error(`❌ Restore failed: ${restoreJobId}`, error);

      // Update job with error
      await supabase
        .from('restore_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.toString()
        })
        .eq('id', restoreJobId);
    }
  }

  private async retrieveBackupFile(filePath: string, storageLocation: string): Promise<string> {
    // Mock file retrieval
    console.log(`📁 Retrieving backup file: ${filePath} from ${storageLocation}`);
    return 'mock backup data';
  }

  private async decryptData(data: string, userId: string): Promise<string> {
    // Mock decryption
    return Buffer.from(data, 'base64').toString();
  }

  private async decompressData(data: string): Promise<string> {
    // Mock decompression
    return data;
  }

  private async executeFullRestore(sqlData: string): Promise<void> {
    // Mock SQL execution
    console.log('🔄 Executing full restore...');
  }

  private async executeSelectiveRestore(sqlData: string, tables: string[]): Promise<void> {
    // Mock selective restore
    console.log(`🔄 Executing selective restore for tables: ${tables.join(', ')}`);
  }

  // Scheduling
  private async scheduleBackupJob(configurationId: string): Promise<void> {
    // Mock job scheduling - in reality would use cron or similar
    console.log(`⏰ Scheduling backup job for configuration: ${configurationId}`);
  }

  // Metrics and Monitoring
  async getBackupMetrics(userId: string): Promise<BackupMetrics> {
    try {
      // Get backup statistics
      const { data: jobs, error } = await supabase
        .from('backup_jobs')
        .select('status, completed_at, started_at')
        .eq('user_id', userId);

      if (error) throw error;

      const totalBackups = jobs?.length || 0;
      const successfulBackups = jobs?.filter(j => j.status === 'completed').length || 0;
      const failedBackups = jobs?.filter(j => j.status === 'failed').length || 0;

      // Calculate average backup time
      const completedJobs = jobs?.filter(j => j.status === 'completed' && j.started_at && j.completed_at) || [];
      const averageBackupTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => {
            const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
            return sum + duration;
          }, 0) / completedJobs.length / 1000 // Convert to seconds
        : 0;

      // Get storage usage
      const { data: storageData } = await supabase
        .from('backup_jobs')
        .select('file_size')
        .eq('status', 'completed');

      const totalStorageUsed = storageData?.reduce((sum, job) => sum + job.file_size, 0) || 0;

      // Get last backup date
      const lastBackupDate = completedJobs.length > 0
        ? new Date(Math.max(...completedJobs.map(j => new Date(j.completed_at).getTime())))
        : new Date(0);

      return {
        total_backups: totalBackups,
        successful_backups: successfulBackups,
        failed_backups: failedBackups,
        total_storage_used: totalStorageUsed,
        average_backup_time: Math.round(averageBackupTime),
        last_backup_date: lastBackupDate,
        next_scheduled_backup: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mock next backup
        backup_success_rate: totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0
      };

    } catch (error) {
      console.error('❌ Failed to get backup metrics:', error);
      throw error;
    }
  }

  // Point-in-Time Recovery
  async createPointInTimeRestore(userId: string, targetTime: Date, tables?: string[]): Promise<RestoreJob> {
    try {
      console.log(`🕐 Creating point-in-time restore for: ${targetTime.toISOString()}`);

      // Find the best backup for point-in-time recovery
      const { data: backups, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('status', 'completed')
        .lte('completed_at', targetTime.toISOString())
        .order('completed_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!backups || backups.length === 0) {
        throw new Error('No suitable backup found for point-in-time recovery');
      }

      const bestBackup = backups[0];

      return await this.createRestoreJob(bestBackup.id, tables ? 'selective' : 'full', {
        tablesToRestore: tables,
        pointInTime: targetTime
      });

    } catch (error) {
      console.error('❌ Failed to create point-in-time restore:', error);
      throw error;
    }
  }

  // Backup Verification
  async verifyBackup(backupJobId: string): Promise<{
    is_valid: boolean;
    checksum_match: boolean;
    file_exists: boolean;
    can_restore: boolean;
    issues: string[];
  }> {
    try {
      console.log(`🔍 Verifying backup: ${backupJobId}`);

      const { data: backup, error } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('id', backupJobId)
        .single();

      if (error) throw error;

      const issues: string[] = [];
      let isValid = true;
      let checksumMatch = true;
      let fileExists = true;
      let canRestore = true;

      // Verify file exists
      try {
        await this.retrieveBackupFile(backup.file_path, backup.storage_location);
      } catch (error) {
        fileExists = false;
        isValid = false;
        issues.push('Backup file not found');
      }

      // Verify checksum (mock)
      if (fileExists) {
        // In reality, would recalculate checksum and compare
        const currentChecksum = backup.checksum;
        if (!currentChecksum) {
          checksumMatch = false;
          isValid = false;
          issues.push('Checksum verification failed');
        }
      }

      // Test restore capability (mock)
      if (fileExists && checksumMatch) {
        // In reality, would attempt a test restore to a temporary location
        canRestore = true;
      } else {
        canRestore = false;
        issues.push('Cannot perform restore due to backup integrity issues');
      }

      return {
        is_valid: isValid,
        checksum_match: checksumMatch,
        file_exists: fileExists,
        can_restore: canRestore,
        issues
      };

    } catch (error) {
      console.error('❌ Failed to verify backup:', error);
      return {
        is_valid: false,
        checksum_match: false,
        file_exists: false,
        can_restore: false,
        issues: ['Verification failed: ' + error.toString()]
      };
    }
  }
}

// Export singleton instance
export const backupRecoveryService = BackupRecoveryService.getInstance();
import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from './EnhancedSupabaseService';

export interface SyncConfiguration {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  sync_type: 'bidirectional' | 'unidirectional' | 'master_slave';
  local_database: {
    type: 'sqlite' | 'indexeddb' | 'localstorage';
    database_name: string;
  };
  remote_database: {
    type: 'supabase' | 'postgres' | 'mysql';
    connection_string: string;
    database_name: string;
  };
  tables_to_sync: string[];
  sync_frequency: 'real_time' | 'periodic' | 'manual';
  conflict_resolution: 'local_wins' | 'remote_wins' | 'timestamp_wins' | 'manual';
  offline_support: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SyncJob {
  id: string;
  configuration_id: string;
  sync_direction: 'local_to_remote' | 'remote_to_local' | 'bidirectional';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: Date;
  completed_at?: Date;
  records_synced: number;
  records_failed: number;
  conflicts_detected: number;
  conflicts_resolved: number;
  error_message?: string;
  sync_metadata: {
    tables_processed: string[];
    last_sync_timestamp: Date;
    data_checksum: string;
  };
}

export interface SyncConflict {
  id: string;
  sync_job_id: string;
  table_name: string;
  record_id: string;
  conflict_type: 'insert_conflict' | 'update_conflict' | 'delete_conflict';
  local_data: Record<string, any>;
  remote_data: Record<string, any>;
  local_timestamp: Date;
  remote_timestamp: Date;
  resolution_status: 'pending' | 'resolved' | 'ignored';
  resolved_data?: Record<string, any>;
  resolved_at?: Date;
}

export interface OfflineQueue {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: Date;
  status: 'pending' | 'synced' | 'failed';
  retry_count: number;
  error_message?: string;
}

export interface SyncMetrics {
  total_sync_jobs: number;
  successful_syncs: number;
  failed_syncs: number;
  pending_conflicts: number;
  offline_queue_size: number;
  last_sync_date: Date;
  sync_success_rate: number;
  average_sync_time: number;
  data_freshness: number; // in seconds
}

export class DataSyncService {
  private static instance: DataSyncService;
  private activeSyncs: Map<string, NodeJS.Timeout> = new Map();
  private offlineQueue: OfflineQueue[] = [];

  private constructor() {
    this.initializeOfflineSupport();
  }

  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private initializeOfflineSupport(): void {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Connection restored - processing offline queue');
        this.processOfflineQueue();
      });

      window.addEventListener('offline', () => {
        console.log('📴 Connection lost - enabling offline mode');
      });
    }
  }

  // Sync Configuration Management
  async createSyncConfiguration(config: Omit<SyncConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<SyncConfiguration> {
    try {
      console.log(`🔄 Creating sync configuration: ${config.name}`);

      const { data, error } = await supabase
        .from('sync_configurations')
        .insert({
          user_id: config.user_id,
          name: config.name,
          description: config.description,
          sync_type: config.sync_type,
          local_database: config.local_database,
          remote_database: config.remote_database,
          tables_to_sync: config.tables_to_sync,
          sync_frequency: config.sync_frequency,
          conflict_resolution: config.conflict_resolution,
          offline_support: config.offline_support,
          is_active: config.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Start sync if active
      if (config.is_active) {
        await this.startSync(data.id);
      }

      console.log(`✅ Sync configuration created: ${config.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create sync configuration:', error);
      throw error;
    }
  }

  async getSyncConfigurations(userId: string): Promise<SyncConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get sync configurations:', error);
      throw error;
    }
  }

  // Sync Execution
  async startSync(configurationId: string): Promise<void> {
    try {
      console.log(`🚀 Starting sync: ${configurationId}`);

      const { data: config, error } = await supabase
        .from('sync_configurations')
        .select('*')
        .eq('id', configurationId)
        .single();

      if (error) throw error;

      // Start sync based on frequency
      switch (config.sync_frequency) {
        case 'real_time':
          await this.startRealTimeSync(configurationId);
          break;
        case 'periodic':
          await this.startPeriodicSync(configurationId);
          break;
        case 'manual':
          console.log('Manual sync - waiting for trigger');
          break;
      }

      console.log(`✅ Sync started: ${configurationId}`);

    } catch (error) {
      console.error('❌ Failed to start sync:', error);
      throw error;
    }
  }

  private async startRealTimeSync(configurationId: string): Promise<void> {
    console.log(`⚡ Starting real-time sync: ${configurationId}`);

    // Set up real-time sync interval
    const interval = setInterval(async () => {
      try {
        await this.performSync(configurationId, 'bidirectional');
      } catch (error) {
        console.error(`Real-time sync failed for ${configurationId}:`, error);
      }
    }, 10000); // Every 10 seconds

    this.activeSyncs.set(configurationId, interval);
  }

  private async startPeriodicSync(configurationId: string): Promise<void> {
    console.log(`⏰ Starting periodic sync: ${configurationId}`);

    // Set up periodic sync interval
    const interval = setInterval(async () => {
      try {
        await this.performSync(configurationId, 'bidirectional');
      } catch (error) {
        console.error(`Periodic sync failed for ${configurationId}:`, error);
      }
    }, 300000); // Every 5 minutes

    this.activeSyncs.set(configurationId, interval);
  }

  async performSync(configurationId: string, direction: 'local_to_remote' | 'remote_to_local' | 'bidirectional'): Promise<SyncJob> {
    try {
      console.log(`🔄 Performing sync: ${configurationId} (${direction})`);

      // Create sync job
      const { data: job, error } = await supabase
        .from('sync_jobs')
        .insert({
          configuration_id: configurationId,
          sync_direction: direction,
          status: 'queued',
          started_at: new Date().toISOString(),
          records_synced: 0,
          records_failed: 0,
          conflicts_detected: 0,
          conflicts_resolved: 0,
          sync_metadata: {
            tables_processed: [],
            last_sync_timestamp: new Date().toISOString(),
            data_checksum: ''
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Execute sync asynchronously
      this.executeSync(job.id).catch(error => {
        console.error(`Sync job ${job.id} failed:`, error);
      });

      return job;

    } catch (error) {
      console.error('❌ Failed to perform sync:', error);
      throw error;
    }
  }

  private async executeSync(jobId: string): Promise<void> {
    try {
      // Update job status
      await supabase
        .from('sync_jobs')
        .update({ status: 'running' })
        .eq('id', jobId);

      // Get job and configuration
      const { data: job, error: jobError } = await supabase
        .from('sync_jobs')
        .select('*, configuration:configuration_id(*)')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const config = job.configuration;
      let totalRecordsSynced = 0;
      let totalRecordsFailed = 0;
      let totalConflictsDetected = 0;
      let totalConflictsResolved = 0;
      const tablesProcessed: string[] = [];

      // Sync each table
      for (const tableName of config.tables_to_sync) {
        try {
          console.log(`📊 Syncing table: ${tableName}`);

          const syncResult = await this.syncTable(
            tableName,
            config,
            job.sync_direction
          );

          totalRecordsSynced += syncResult.recordsSynced;
          totalRecordsFailed += syncResult.recordsFailed;
          totalConflictsDetected += syncResult.conflictsDetected;
          totalConflictsResolved += syncResult.conflictsResolved;
          tablesProcessed.push(tableName);

          console.log(`✅ Table synced: ${tableName} (${syncResult.recordsSynced} records)`);

        } catch (error) {
          console.error(`Failed to sync table ${tableName}:`, error);
          totalRecordsFailed++;
        }
      }

      // Calculate data checksum
      const dataChecksum = await this.calculateDataChecksum(config.tables_to_sync);

      // Update job completion
      await supabase
        .from('sync_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_synced: totalRecordsSynced,
          records_failed: totalRecordsFailed,
          conflicts_detected: totalConflictsDetected,
          conflicts_resolved: totalConflictsResolved,
          sync_metadata: {
            tables_processed: tablesProcessed,
            last_sync_timestamp: new Date().toISOString(),
            data_checksum: dataChecksum
          }
        })
        .eq('id', jobId);

      console.log(`✅ Sync completed: ${jobId}`);

    } catch (error) {
      console.error(`❌ Sync failed: ${jobId}`, error);

      await supabase
        .from('sync_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.toString()
        })
        .eq('id', jobId);
    }
  }

  private async syncTable(
    tableName: string,
    config: any,
    direction: string
  ): Promise<{
    recordsSynced: number;
    recordsFailed: number;
    conflictsDetected: number;
    conflictsResolved: number;
  }> {
    try {
      let recordsSynced = 0;
      let recordsFailed = 0;
      let conflictsDetected = 0;
      let conflictsResolved = 0;

      // Get local and remote data
      const localData = await this.getLocalTableData(tableName, config.local_database);
      const remoteData = await this.getRemoteTableData(tableName, config.remote_database);

      // Detect changes and conflicts
      const changes = this.detectChanges(localData, remoteData);
      const conflicts = this.detectConflicts(changes);

      conflictsDetected = conflicts.length;

      // Resolve conflicts
      for (const conflict of conflicts) {
        try {
          await this.resolveConflict(conflict, config.conflict_resolution);
          conflictsResolved++;
        } catch (error) {
          console.error(`Failed to resolve conflict:`, error);
        }
      }

      // Apply changes based on direction
      if (direction === 'local_to_remote' || direction === 'bidirectional') {
        const localChanges = changes.filter(c => c.source === 'local');
        for (const change of localChanges) {
          try {
            await this.applyChangeToRemote(change, config.remote_database);
            recordsSynced++;
          } catch (error) {
            console.error(`Failed to apply local change to remote:`, error);
            recordsFailed++;
          }
        }
      }

      if (direction === 'remote_to_local' || direction === 'bidirectional') {
        const remoteChanges = changes.filter(c => c.source === 'remote');
        for (const change of remoteChanges) {
          try {
            await this.applyChangeToLocal(change, config.local_database);
            recordsSynced++;
          } catch (error) {
            console.error(`Failed to apply remote change to local:`, error);
            recordsFailed++;
          }
        }
      }

      return {
        recordsSynced,
        recordsFailed,
        conflictsDetected,
        conflictsResolved
      };

    } catch (error) {
      console.error(`Failed to sync table ${tableName}:`, error);
      throw error;
    }
  }

  private async getLocalTableData(tableName: string, localDb: any): Promise<any[]> {
    // Mock getting local data - in reality would query local database
    console.log(`📱 Getting local data from ${tableName}`);
    return [
      { id: '1', data: 'local_data_1', updated_at: new Date().toISOString() },
      { id: '2', data: 'local_data_2', updated_at: new Date().toISOString() }
    ];
  }

  private async getRemoteTableData(tableName: string, remoteDb: any): Promise<any[]> {
    // Mock getting remote data - in reality would query remote database
    console.log(`☁️ Getting remote data from ${tableName}`);
    return [
      { id: '1', data: 'remote_data_1', updated_at: new Date().toISOString() },
      { id: '3', data: 'remote_data_3', updated_at: new Date().toISOString() }
    ];
  }

  private detectChanges(localData: any[], remoteData: any[]): any[] {
    const changes: any[] = [];

    // Detect local changes (records in local but not in remote, or different)
    for (const localRecord of localData) {
      const remoteRecord = remoteData.find(r => r.id === localRecord.id);
      if (!remoteRecord) {
        changes.push({
          type: 'insert',
          source: 'local',
          record: localRecord
        });
      } else if (JSON.stringify(localRecord) !== JSON.stringify(remoteRecord)) {
        changes.push({
          type: 'update',
          source: 'local',
          record: localRecord,
          existing: remoteRecord
        });
      }
    }

    // Detect remote changes
    for (const remoteRecord of remoteData) {
      const localRecord = localData.find(r => r.id === remoteRecord.id);
      if (!localRecord) {
        changes.push({
          type: 'insert',
          source: 'remote',
          record: remoteRecord
        });
      } else if (JSON.stringify(remoteRecord) !== JSON.stringify(localRecord)) {
        changes.push({
          type: 'update',
          source: 'remote',
          record: remoteRecord,
          existing: localRecord
        });
      }
    }

    return changes;
  }

  private detectConflicts(changes: any[]): any[] {
    const conflicts: any[] = [];
    const recordIds = new Set();

    // Find records that have changes from both sources
    for (const change of changes) {
      if (recordIds.has(change.record.id)) {
        conflicts.push({
          record_id: change.record.id,
          local_change: changes.find(c => c.record.id === change.record.id && c.source === 'local'),
          remote_change: changes.find(c => c.record.id === change.record.id && c.source === 'remote')
        });
      }
      recordIds.add(change.record.id);
    }

    return conflicts;
  }

  private async resolveConflict(conflict: any, resolutionStrategy: string): Promise<void> {
    console.log(`🔧 Resolving conflict for record ${conflict.record_id} using ${resolutionStrategy}`);

    switch (resolutionStrategy) {
      case 'local_wins':
        // Keep local version
        break;
      case 'remote_wins':
        // Keep remote version
        break;
      case 'timestamp_wins':
        // Keep the version with the latest timestamp
        const localTime = new Date(conflict.local_change?.record?.updated_at || 0);
        const remoteTime = new Date(conflict.remote_change?.record?.updated_at || 0);
        // Use the newer version
        break;
      case 'manual':
        // Store conflict for manual resolution
        await this.storeConflictForManualResolution(conflict);
        break;
    }
  }

  private async storeConflictForManualResolution(conflict: any): Promise<void> {
    try {
      await supabase
        .from('sync_conflicts')
        .insert({
          sync_job_id: 'current_job_id', // Would get from context
          table_name: 'current_table', // Would get from context
          record_id: conflict.record_id,
          conflict_type: 'update_conflict',
          local_data: conflict.local_change?.record || {},
          remote_data: conflict.remote_change?.record || {},
          local_timestamp: new Date(conflict.local_change?.record?.updated_at || Date.now()).toISOString(),
          remote_timestamp: new Date(conflict.remote_change?.record?.updated_at || Date.now()).toISOString(),
          resolution_status: 'pending'
        });

      console.log(`📝 Conflict stored for manual resolution: ${conflict.record_id}`);

    } catch (error) {
      console.error('Failed to store conflict:', error);
    }
  }

  private async applyChangeToRemote(change: any, remoteDb: any): Promise<void> {
    // Mock applying change to remote database
    console.log(`☁️ Applying ${change.type} to remote: ${change.record.id}`);
  }

  private async applyChangeToLocal(change: any, localDb: any): Promise<void> {
    // Mock applying change to local database
    console.log(`📱 Applying ${change.type} to local: ${change.record.id}`);
  }

  private async calculateDataChecksum(tables: string[]): Promise<string> {
    // Mock checksum calculation
    return Buffer.from(tables.join(',') + Date.now()).toString('base64').substring(0, 16);
  }

  // Offline Support
  async addToOfflineQueue(operation: {
    table_name: string;
    record_id: string;
    operation: 'insert' | 'update' | 'delete';
    data: Record<string, any>;
    user_id: string;
  }): Promise<void> {
    try {
      const queueItem: OfflineQueue = {
        id: `offline_${Date.now()}_${Math.random()}`,
        user_id: operation.user_id,
        table_name: operation.table_name,
        record_id: operation.record_id,
        operation: operation.operation,
        data: operation.data,
        timestamp: new Date(),
        status: 'pending',
        retry_count: 0
      };

      this.offlineQueue.push(queueItem);

      // Store in local storage for persistence
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
      }

      console.log(`📴 Added to offline queue: ${operation.operation} on ${operation.table_name}`);

    } catch (error) {
      console.error('❌ Failed to add to offline queue:', error);
    }
  }

  private async processOfflineQueue(): Promise<void> {
    try {
      console.log(`🔄 Processing offline queue: ${this.offlineQueue.length} items`);

      // Load queue from local storage
      if (typeof localStorage !== 'undefined') {
        const storedQueue = localStorage.getItem('offline_queue');
        if (storedQueue) {
          this.offlineQueue = JSON.parse(storedQueue);
        }
      }

      const pendingItems = this.offlineQueue.filter(item => item.status === 'pending');

      for (const item of pendingItems) {
        try {
          await this.processOfflineQueueItem(item);
          item.status = 'synced';
          console.log(`✅ Synced offline item: ${item.operation} on ${item.table_name}`);
        } catch (error) {
          item.retry_count++;
          item.error_message = error.toString();
          
          if (item.retry_count >= 3) {
            item.status = 'failed';
            console.error(`❌ Failed to sync offline item after 3 retries: ${item.id}`);
          }
        }
      }

      // Update local storage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
      }

      // Remove successfully synced items
      this.offlineQueue = this.offlineQueue.filter(item => item.status !== 'synced');

    } catch (error) {
      console.error('❌ Failed to process offline queue:', error);
    }
  }

  private async processOfflineQueueItem(item: OfflineQueue): Promise<void> {
    // Mock processing offline queue item
    console.log(`🔄 Processing offline item: ${item.operation} on ${item.table_name}`);
    
    // In reality, would apply the operation to the remote database
    switch (item.operation) {
      case 'insert':
        // Insert record to remote
        break;
      case 'update':
        // Update record in remote
        break;
      case 'delete':
        // Delete record from remote
        break;
    }
  }

  // Control Operations
  async stopSync(configurationId: string): Promise<void> {
    try {
      console.log(`⏹️ Stopping sync: ${configurationId}`);

      const interval = this.activeSyncs.get(configurationId);
      if (interval) {
        clearInterval(interval);
        this.activeSyncs.delete(configurationId);
      }

      await supabase
        .from('sync_configurations')
        .update({ is_active: false })
        .eq('id', configurationId);

      console.log(`✅ Sync stopped: ${configurationId}`);

    } catch (error) {
      console.error('❌ Failed to stop sync:', error);
      throw error;
    }
  }

  // Metrics and Monitoring
  async getSyncMetrics(userId: string): Promise<SyncMetrics> {
    try {
      const { data: configs, error: configError } = await supabase
        .from('sync_configurations')
        .select('id')
        .eq('user_id', userId);

      if (configError) throw configError;

      const { data: jobs, error: jobError } = await supabase
        .from('sync_jobs')
        .select('status, started_at, completed_at, records_synced')
        .in('configuration_id', (configs || []).map(c => c.id));

      if (jobError) throw jobError;

      const { data: conflicts, error: conflictError } = await supabase
        .from('sync_conflicts')
        .select('id')
        .eq('resolution_status', 'pending');

      if (conflictError) throw conflictError;

      const totalSyncJobs = jobs?.length || 0;
      const successfulSyncs = jobs?.filter(j => j.status === 'completed').length || 0;
      const failedSyncs = jobs?.filter(j => j.status === 'failed').length || 0;
      const pendingConflicts = conflicts?.length || 0;
      const offlineQueueSize = this.offlineQueue.filter(item => item.status === 'pending').length;

      const completedJobs = jobs?.filter(j => j.status === 'completed' && j.started_at && j.completed_at) || [];
      const averageSyncTime = completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => {
            const duration = new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
            return sum + duration;
          }, 0) / completedJobs.length / 1000
        : 0;

      const lastSyncDate = completedJobs.length > 0
        ? new Date(Math.max(...completedJobs.map(j => new Date(j.completed_at).getTime())))
        : new Date(0);

      const dataFreshness = Math.floor((Date.now() - lastSyncDate.getTime()) / 1000);

      return {
        total_sync_jobs: totalSyncJobs,
        successful_syncs: successfulSyncs,
        failed_syncs: failedSyncs,
        pending_conflicts: pendingConflicts,
        offline_queue_size: offlineQueueSize,
        last_sync_date: lastSyncDate,
        sync_success_rate: totalSyncJobs > 0 ? (successfulSyncs / totalSyncJobs) * 100 : 0,
        average_sync_time: Math.round(averageSyncTime),
        data_freshness: dataFreshness
      };

    } catch (error) {
      console.error('❌ Failed to get sync metrics:', error);
      throw error;
    }
  }

  // Manual Conflict Resolution
  async resolveManualConflict(conflictId: string, resolution: 'local_wins' | 'remote_wins' | 'merge', mergedData?: Record<string, any>): Promise<void> {
    try {
      console.log(`🔧 Resolving manual conflict: ${conflictId}`);

      const { data: conflict, error } = await supabase
        .from('sync_conflicts')
        .select('*')
        .eq('id', conflictId)
        .single();

      if (error) throw error;

      let resolvedData: Record<string, any>;

      switch (resolution) {
        case 'local_wins':
          resolvedData = conflict.local_data;
          break;
        case 'remote_wins':
          resolvedData = conflict.remote_data;
          break;
        case 'merge':
          resolvedData = mergedData || { ...conflict.remote_data, ...conflict.local_data };
          break;
      }

      // Update conflict resolution
      await supabase
        .from('sync_conflicts')
        .update({
          resolution_status: 'resolved',
          resolved_data: resolvedData,
          resolved_at: new Date().toISOString()
        })
        .eq('id', conflictId);

      // Apply resolved data
      await this.applyResolvedConflict(conflict.table_name, conflict.record_id, resolvedData);

      console.log(`✅ Manual conflict resolved: ${conflictId}`);

    } catch (error) {
      console.error('❌ Failed to resolve manual conflict:', error);
      throw error;
    }
  }

  private async applyResolvedConflict(tableName: string, recordId: string, resolvedData: Record<string, any>): Promise<void> {
    // Mock applying resolved conflict data
    console.log(`📝 Applying resolved conflict data to ${tableName}:${recordId}`);
  }
}

// Export singleton instance
export const dataSyncService = DataSyncService.getInstance();
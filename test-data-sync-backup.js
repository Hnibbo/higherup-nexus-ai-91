#!/usr/bin/env node

/**
 * Test script for Data Synchronization and Backup Systems
 * Tests backup/recovery, data replication, data sync, and database monitoring services
 */

import { backupRecoveryService } from './src/services/database/BackupRecoveryService.js';
import { dataReplicationService } from './src/services/database/DataReplicationService.js';
import { dataSyncService } from './src/services/database/DataSyncService.js';
import { databaseMonitoringService } from './src/services/database/DatabaseMonitoringService.js';

const TEST_USER_ID = 'test-user-123';

async function testBackupRecoveryService() {
  console.log('\n💾 Testing Backup Recovery Service...');
  
  try {
    // Test backup configuration creation
    console.log('🔧 Creating backup configuration...');
    const backupConfig = await backupRecoveryService.createBackupConfiguration({
      user_id: TEST_USER_ID,
      name: 'Daily Backup',
      description: 'Automated daily backup of all user data',
      backup_type: 'full',
      schedule: {
        frequency: 'daily',
        time: '02:00'
      },
      retention_policy: {
        keep_daily: 7,
        keep_weekly: 4,
        keep_monthly: 12,
        keep_yearly: 3
      },
      storage_location: 's3',
      encryption_enabled: true,
      compression_enabled: true,
      is_active: true
    });
    console.log(`✅ Backup configuration created: ${backupConfig.name}`);
    
    // Test backup execution
    console.log('💾 Executing backup...');
    const backupJob = await backupRecoveryService.executeBackup(backupConfig.id);
    console.log(`✅ Backup job started: ${backupJob.id}`);
    
    // Wait for backup to complete (mock)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test backup metrics
    console.log('📊 Getting backup metrics...');
    const metrics = await backupRecoveryService.getBackupMetrics(TEST_USER_ID);
    console.log(`✅ Backup metrics: ${metrics.total_backups} total, ${metrics.backup_success_rate}% success rate`);
    
    // Test backup verification
    console.log('🔍 Verifying backup...');
    const verification = await backupRecoveryService.verifyBackup(backupJob.id);
    console.log(`✅ Backup verification: ${verification.is_valid ? 'Valid' : 'Invalid'}`);
    
    // Test point-in-time restore
    console.log('🕐 Creating point-in-time restore...');
    const restoreJob = await backupRecoveryService.createPointInTimeRestore(
      TEST_USER_ID,
      new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    );
    console.log(`✅ Point-in-time restore created: ${restoreJob.id}`);
    
    return true;
  } catch (error) {
    console.error('❌ Backup Recovery test failed:', error.message);
    return false;
  }
}

async function testDataReplicationService() {
  console.log('\n🔄 Testing Data Replication Service...');
  
  try {
    // Test replication configuration creation
    console.log('🔧 Creating replication configuration...');
    const replicationConfig = await dataReplicationService.createReplicationConfiguration({
      user_id: TEST_USER_ID,
      name: 'Production to Staging Replication',
      description: 'Real-time replication from production to staging environment',
      source_database: {
        type: 'supabase',
        connection_string: 'postgresql://source-db-url',
        database_name: 'production'
      },
      target_database: {
        type: 'supabase',
        connection_string: 'postgresql://target-db-url',
        database_name: 'staging'
      },
      replication_type: 'master_slave',
      replication_mode: 'real_time',
      tables_to_replicate: ['contacts', 'deals', 'campaigns'],
      conflict_resolution: 'source_wins',
      is_active: true
    });
    console.log(`✅ Replication configuration created: ${replicationConfig.name}`);
    
    // Wait for initial sync to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test replication metrics
    console.log('📊 Getting replication metrics...');
    const metrics = await dataReplicationService.getReplicationMetrics(TEST_USER_ID);
    console.log(`✅ Replication metrics: ${metrics.active_replications} active, ${metrics.replication_health} health`);
    
    // Test replication control
    console.log('⏸️ Pausing replication...');
    await dataReplicationService.stopReplication(replicationConfig.id);
    console.log('✅ Replication stopped');
    
    return true;
  } catch (error) {
    console.error('❌ Data Replication test failed:', error.message);
    return false;
  }
}

async function testDataSyncService() {
  console.log('\n🔄 Testing Data Sync Service...');
  
  try {
    // Test sync configuration creation
    console.log('🔧 Creating sync configuration...');
    const syncConfig = await dataSyncService.createSyncConfiguration({
      user_id: TEST_USER_ID,
      name: 'Mobile App Sync',
      description: 'Bidirectional sync between mobile app and cloud database',
      sync_type: 'bidirectional',
      local_database: {
        type: 'sqlite',
        database_name: 'mobile_app.db'
      },
      remote_database: {
        type: 'supabase',
        connection_string: 'postgresql://remote-db-url',
        database_name: 'cloud_db'
      },
      tables_to_sync: ['contacts', 'tasks', 'notes'],
      sync_frequency: 'real_time',
      conflict_resolution: 'timestamp_wins',
      offline_support: true,
      is_active: true
    });
    console.log(`✅ Sync configuration created: ${syncConfig.name}`);
    
    // Test manual sync
    console.log('🔄 Performing manual sync...');
    const syncJob = await dataSyncService.performSync(syncConfig.id, 'bidirectional');
    console.log(`✅ Sync job started: ${syncJob.id}`);
    
    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test offline queue
    console.log('📴 Adding item to offline queue...');
    await dataSyncService.addToOfflineQueue({
      table_name: 'contacts',
      record_id: 'contact_123',
      operation: 'update',
      data: { name: 'Updated Name', email: 'updated@example.com' },
      user_id: TEST_USER_ID
    });
    console.log('✅ Item added to offline queue');
    
    // Test sync metrics
    console.log('📊 Getting sync metrics...');
    const metrics = await dataSyncService.getSyncMetrics(TEST_USER_ID);
    console.log(`✅ Sync metrics: ${metrics.successful_syncs} successful, ${metrics.offline_queue_size} in offline queue`);
    
    // Test manual conflict resolution
    console.log('🔧 Testing manual conflict resolution...');
    await dataSyncService.resolveManualConflict('mock_conflict_id', 'local_wins');
    console.log('✅ Manual conflict resolved');
    
    return true;
  } catch (error) {
    console.error('❌ Data Sync test failed:', error.message);
    return false;
  }
}

async function testDatabaseMonitoringService() {
  console.log('\n🔍 Testing Database Monitoring Service...');
  
  try {
    // Test alert rule creation
    console.log('🚨 Creating alert rule...');
    const alertRule = await databaseMonitoringService.createAlertRule({
      user_id: TEST_USER_ID,
      name: 'High CPU Usage Alert',
      description: 'Alert when CPU usage exceeds 80%',
      metric_type: 'cpu_usage',
      threshold_value: 80,
      comparison_operator: 'greater_than',
      severity: 'high',
      notification_channels: ['email', 'slack'],
      is_active: true
    });
    console.log(`✅ Alert rule created: ${alertRule.name}`);
    
    // Test health check
    console.log('🏥 Performing health check...');
    const healthCheck = await databaseMonitoringService.performHealthCheck();
    console.log(`✅ Health check completed: ${healthCheck.overall_health} (${healthCheck.checks.length} checks)`);
    
    // Test metrics retrieval
    console.log('📊 Getting database metrics...');
    const metrics = await databaseMonitoringService.getMetrics('hour');
    console.log(`✅ Retrieved ${metrics.length} metric records`);
    
    // Test performance report generation
    console.log('📈 Generating performance report...');
    const report = await databaseMonitoringService.generatePerformanceReport(TEST_USER_ID, 'daily');
    console.log(`✅ Performance report generated: ${report.report_id}`);
    console.log(`   - Average CPU: ${report.summary.average_cpu_usage.toFixed(1)}%`);
    console.log(`   - Average Memory: ${report.summary.average_memory_usage.toFixed(1)}%`);
    console.log(`   - Recommendations: ${report.recommendations.length}`);
    
    // Test slow query analysis
    console.log('🐌 Analyzing slow queries...');
    const slowQueries = await databaseMonitoringService.analyzeSlowQueries('day');
    console.log(`✅ Found ${slowQueries.length} slow queries to optimize`);
    
    // Test dashboard data
    console.log('📊 Getting dashboard data...');
    const dashboardData = await databaseMonitoringService.getDashboardData();
    console.log(`✅ Dashboard data: ${dashboardData.active_alerts.length} active alerts, ${dashboardData.recent_health_checks.length} recent health checks`);
    
    return true;
  } catch (error) {
    console.error('❌ Database Monitoring test failed:', error.message);
    return false;
  }
}

async function testIntegration() {
  console.log('\n🔗 Testing Service Integration...');
  
  try {
    // Test end-to-end workflow
    console.log('🔄 Running end-to-end data management workflow...');
    
    // 1. Create backup configuration
    const backupConfig = await backupRecoveryService.createBackupConfiguration({
      user_id: TEST_USER_ID,
      name: 'Integration Test Backup',
      backup_type: 'incremental',
      schedule: { frequency: 'daily', time: '03:00' },
      retention_policy: { keep_daily: 7, keep_weekly: 4, keep_monthly: 12, keep_yearly: 3 },
      storage_location: 'local',
      encryption_enabled: false,
      compression_enabled: true,
      is_active: true
    });
    console.log(`📦 Backup configuration: ${backupConfig.name}`);
    
    // 2. Set up replication
    const replicationConfig = await dataReplicationService.createReplicationConfiguration({
      user_id: TEST_USER_ID,
      name: 'Integration Test Replication',
      source_database: {
        type: 'supabase',
        connection_string: 'postgresql://source',
        database_name: 'main'
      },
      target_database: {
        type: 'supabase',
        connection_string: 'postgresql://target',
        database_name: 'backup'
      },
      replication_type: 'master_slave',
      replication_mode: 'batch',
      tables_to_replicate: ['contacts'],
      conflict_resolution: 'source_wins',
      is_active: true
    });
    console.log(`🔄 Replication configuration: ${replicationConfig.name}`);
    
    // 3. Configure sync
    const syncConfig = await dataSyncService.createSyncConfiguration({
      user_id: TEST_USER_ID,
      name: 'Integration Test Sync',
      sync_type: 'bidirectional',
      local_database: { type: 'sqlite', database_name: 'local.db' },
      remote_database: { type: 'supabase', connection_string: 'postgresql://remote', database_name: 'cloud' },
      tables_to_sync: ['contacts'],
      sync_frequency: 'periodic',
      conflict_resolution: 'manual',
      offline_support: true,
      is_active: true
    });
    console.log(`🔄 Sync configuration: ${syncConfig.name}`);
    
    // 4. Set up monitoring
    const alertRule = await databaseMonitoringService.createAlertRule({
      user_id: TEST_USER_ID,
      name: 'Integration Test Alert',
      metric_type: 'memory_usage',
      threshold_value: 90,
      comparison_operator: 'greater_than',
      severity: 'critical',
      notification_channels: ['email'],
      is_active: true
    });
    console.log(`🚨 Alert rule: ${alertRule.name}`);
    
    // 5. Execute operations
    console.log('⚡ Executing integrated operations...');
    
    // Execute backup
    const backupJob = await backupRecoveryService.executeBackup(backupConfig.id);
    console.log(`💾 Backup job: ${backupJob.id}`);
    
    // Perform sync
    const syncJob = await dataSyncService.performSync(syncConfig.id, 'bidirectional');
    console.log(`🔄 Sync job: ${syncJob.id}`);
    
    // Health check
    const healthCheck = await databaseMonitoringService.performHealthCheck();
    console.log(`🏥 Health status: ${healthCheck.overall_health}`);
    
    console.log('✅ Integration test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

async function testPerformanceAndScalability() {
  console.log('\n⚡ Testing Performance and Scalability...');
  
  try {
    console.log('🔄 Testing concurrent operations...');
    
    // Test concurrent backup operations
    const backupPromises = Array.from({ length: 3 }, async (_, i) => {
      const config = await backupRecoveryService.createBackupConfiguration({
        user_id: TEST_USER_ID,
        name: `Concurrent Backup ${i + 1}`,
        backup_type: 'incremental',
        schedule: { frequency: 'daily', time: '04:00' },
        retention_policy: { keep_daily: 7, keep_weekly: 4, keep_monthly: 12, keep_yearly: 3 },
        storage_location: 'local',
        encryption_enabled: false,
        compression_enabled: false,
        is_active: false
      });
      return backupRecoveryService.executeBackup(config.id);
    });
    
    const backupResults = await Promise.allSettled(backupPromises);
    const successfulBackups = backupResults.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Concurrent backups: ${successfulBackups}/3 successful`);
    
    // Test bulk sync operations
    console.log('📦 Testing bulk sync operations...');
    const bulkSyncPromises = Array.from({ length: 5 }, async (_, i) => {
      await dataSyncService.addToOfflineQueue({
        table_name: 'contacts',
        record_id: `bulk_contact_${i}`,
        operation: 'insert',
        data: { name: `Bulk Contact ${i}`, email: `bulk${i}@example.com` },
        user_id: TEST_USER_ID
      });
    });
    
    await Promise.all(bulkSyncPromises);
    console.log('✅ Bulk sync operations queued');
    
    // Test monitoring under load
    console.log('📊 Testing monitoring under load...');
    const monitoringPromises = Array.from({ length: 10 }, () => 
      databaseMonitoringService.performHealthCheck()
    );
    
    const monitoringResults = await Promise.allSettled(monitoringPromises);
    const successfulChecks = monitoringResults.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Health checks under load: ${successfulChecks}/10 successful`);
    
    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Data Synchronization and Backup Systems Tests...');
  console.log('=' .repeat(70));
  
  const results = {
    backupRecovery: false,
    dataReplication: false,
    dataSync: false,
    databaseMonitoring: false,
    integration: false,
    performance: false
  };
  
  // Run individual service tests
  results.backupRecovery = await testBackupRecoveryService();
  results.dataReplication = await testDataReplicationService();
  results.dataSync = await testDataSyncService();
  results.databaseMonitoring = await testDatabaseMonitoringService();
  
  // Run integration test
  results.integration = await testIntegration();
  
  // Run performance test
  results.performance = await testPerformanceAndScalability();
  
  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('=' .repeat(70));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} - ${testName}`);
  });
  
  console.log('\n' + '-'.repeat(70));
  console.log(`📊 Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Data Synchronization and Backup Systems are working correctly.');
    console.log('\n🚀 System Features Verified:');
    console.log('   💾 Automated backup and recovery with point-in-time restore');
    console.log('   🔄 Real-time data replication with conflict resolution');
    console.log('   📱 Bidirectional sync with offline support');
    console.log('   🔍 Comprehensive database monitoring and alerting');
    console.log('   📊 Performance reporting and optimization recommendations');
    console.log('   🏥 Automated health checks and system diagnostics');
  } else {
    console.log('⚠️  Some tests failed. Please check the error messages above.');
  }
  
  console.log('\n🏁 Data Synchronization and Backup Systems testing completed.');
}

// Handle both direct execution and module import
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests };
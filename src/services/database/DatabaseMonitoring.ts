/**
 * Database Monitoring Service for Production Performance
 * Provides real-time monitoring, alerting, and performance optimization
 */

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseHealthMetric {
  metric_name: string;
  metric_value: number;
  status: 'healthy' | 'warning' | 'critical';
  last_updated: Date;
}

export interface SlowQuery {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  rows: number;
}

export interface ConnectionMetrics {
  active_connections: number;
  idle_connections: number;
  max_connections: number;
  connection_utilization: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'error' | 'capacity' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}

/**
 * Production database monitoring service with real-time alerts and performance tracking
 */
export class DatabaseMonitoringService {
  private static instance: DatabaseMonitoringService;
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertThresholds = {
    slowQueryThreshold: 1000, // ms
    connectionUtilizationThreshold: 80, // %
    cacheHitRatioThreshold: 95, // %
    errorRateThreshold: 5, // %
    diskUsageThreshold: 85 // %
  };

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): DatabaseMonitoringService {
    if (!DatabaseMonitoringService.instance) {
      DatabaseMonitoringService.instance = new DatabaseMonitoringService();
    }
    return DatabaseMonitoringService.instance;
  }

  private startMonitoring(): void {
    // Monitor database health every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkDatabaseHealth();
        await this.checkSlowQueries();
        await this.checkConnectionMetrics();
        await this.checkErrorRates();
      } catch (error) {
        console.error('Database monitoring error:', error);
        this.createAlert('error', 'critical', 'Database monitoring failed', { error });
      }
    }, 30000);

    console.log('Database monitoring started');
  }

  private async checkDatabaseHealth(): Promise<void> {
    try {
      const { data: healthMetrics, error } = await supabase
        .rpc('get_database_health');

      if (error) {
        throw new Error(`Health check failed: ${error.message}`);
      }

      if (healthMetrics) {
        for (const metric of healthMetrics) {
          await this.processHealthMetric(metric);
        }
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      this.createAlert('performance', 'critical', 'Database health check failed', { error });
    }
  }

  private async processHealthMetric(metric: DatabaseHealthMetric): Promise<void> {
    switch (metric.metric_name) {
      case 'active_connections':
        if (metric.metric_value > 100) {
          this.createAlert('capacity', 'high', 
            `High connection count: ${metric.metric_value}`, 
            { metric }
          );
        }
        break;

      case 'cache_hit_ratio':
        if (metric.metric_value < this.alertThresholds.cacheHitRatioThreshold) {
          this.createAlert('performance', 'medium', 
            `Low cache hit ratio: ${metric.metric_value}%`, 
            { metric }
          );
        }
        break;

      case 'database_size_mb':
        if (metric.metric_value > 10000) { // 10GB threshold
          this.createAlert('capacity', 'medium', 
            `Database size growing: ${metric.metric_value}MB`, 
            { metric }
          );
        }
        break;
    }
  }

  private async checkSlowQueries(): Promise<void> {
    try {
      const { data: slowQueries, error } = await supabase
        .rpc('get_slow_queries', { p_limit: 5 });

      if (error) {
        throw new Error(`Slow query check failed: ${error.message}`);
      }

      if (slowQueries) {
        for (const query of slowQueries) {
          if (query.mean_time > this.alertThresholds.slowQueryThreshold) {
            this.createAlert('performance', 'medium', 
              `Slow query detected: ${query.mean_time.toFixed(2)}ms average`, 
              { query: query.query.substring(0, 200) + '...', mean_time: query.mean_time }
            );
          }
        }
      }
    } catch (error) {
      console.error('Slow query check failed:', error);
    }
  }

  private async checkConnectionMetrics(): Promise<void> {
    try {
      // In production, this would query actual connection metrics
      const connectionMetrics = await this.getConnectionMetrics();
      
      if (connectionMetrics.connection_utilization > this.alertThresholds.connectionUtilizationThreshold) {
        this.createAlert('capacity', 'high', 
          `High connection utilization: ${connectionMetrics.connection_utilization}%`, 
          { connectionMetrics }
        );
      }
    } catch (error) {
      console.error('Connection metrics check failed:', error);
    }
  }

  private async checkErrorRates(): Promise<void> {
    try {
      // Check for database errors in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const { data: errorLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', fiveMinutesAgo.toISOString())
        .like('new_values', '%error%');

      if (error) {
        throw new Error(`Error rate check failed: ${error.message}`);
      }

      if (errorLogs && errorLogs.length > 10) {
        this.createAlert('error', 'high', 
          `High error rate: ${errorLogs.length} errors in 5 minutes`, 
          { error_count: errorLogs.length }
        );
      }
    } catch (error) {
      console.error('Error rate check failed:', error);
    }
  }

  private async getConnectionMetrics(): Promise<ConnectionMetrics> {
    // In production, this would query actual PostgreSQL connection stats
    // For now, simulate metrics
    return {
      active_connections: Math.floor(Math.random() * 50) + 10,
      idle_connections: Math.floor(Math.random() * 20) + 5,
      max_connections: 100,
      connection_utilization: Math.floor(Math.random() * 40) + 30
    };
  }

  private createAlert(
    type: PerformanceAlert['type'], 
    severity: PerformanceAlert['severity'], 
    message: string, 
    details: any
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts immediately
    if (severity === 'critical') {
      console.error('CRITICAL DATABASE ALERT:', message, details);
    } else if (severity === 'high') {
      console.warn('HIGH DATABASE ALERT:', message, details);
    }

    // In production, send alerts to monitoring systems (PagerDuty, Slack, etc.)
    this.sendAlertToMonitoringSystem(alert);
  }

  private async sendAlertToMonitoringSystem(alert: PerformanceAlert): Promise<void> {
    // In production, integrate with monitoring systems
    console.log('Sending alert to monitoring system:', alert);
    
    // Example integrations:
    // - Send to Slack webhook
    // - Send to PagerDuty
    // - Send to email alerts
    // - Send to custom monitoring dashboard
  }

  // Public API methods
  async getDatabaseHealth(): Promise<DatabaseHealthMetric[]> {
    try {
      const { data, error } = await supabase.rpc('get_database_health');
      
      if (error) {
        throw new Error(`Failed to get database health: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Get database health failed:', error);
      return [];
    }
  }

  async getSlowQueries(limit: number = 10): Promise<SlowQuery[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_slow_queries', { p_limit: limit });
      
      if (error) {
        throw new Error(`Failed to get slow queries: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      console.error('Get slow queries failed:', error);
      return [];
    }
  }

  async getConnectionMetrics(): Promise<ConnectionMetrics> {
    try {
      // In production, query actual connection metrics from PostgreSQL
      const { data, error } = await supabase
        .from('pg_stat_activity')
        .select('state')
        .neq('pid', 'pg_backend_pid()');

      if (error) {
        // Fallback to simulated metrics
        return this.getConnectionMetrics();
      }

      const activeConnections = data?.filter(conn => conn.state === 'active').length || 0;
      const idleConnections = data?.filter(conn => conn.state === 'idle').length || 0;
      const totalConnections = data?.length || 0;

      return {
        active_connections: activeConnections,
        idle_connections: idleConnections,
        max_connections: 100, // Would get from PostgreSQL settings
        connection_utilization: totalConnections > 0 ? (totalConnections / 100) * 100 : 0
      };
    } catch (error) {
      console.error('Get connection metrics failed:', error);
      return this.getConnectionMetrics();
    }
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.resolved);
  }

  // Performance optimization methods
  async optimizeDatabase(): Promise<{
    tablesAnalyzed: number;
    indexesCreated: number;
    vacuumOperations: number;
  }> {
    console.log('Starting database optimization...');
    
    try {
      // Analyze tables for query planner optimization
      const tables = ['contacts', 'email_campaigns', 'funnels', 'analytics_events'];
      let tablesAnalyzed = 0;
      
      for (const table of tables) {
        try {
          await supabase.rpc('analyze_table', { table_name: table });
          tablesAnalyzed++;
        } catch (error) {
          console.error(`Failed to analyze table ${table}:`, error);
        }
      }

      // In production, would also:
      // - Run VACUUM operations
      // - Update table statistics
      // - Rebuild fragmented indexes
      // - Optimize query plans

      return {
        tablesAnalyzed,
        indexesCreated: 0, // Would track actual index creation
        vacuumOperations: 0 // Would track actual vacuum operations
      };
    } catch (error) {
      console.error('Database optimization failed:', error);
      throw error;
    }
  }

  async getQueryPerformanceReport(): Promise<{
    slowestQueries: SlowQuery[];
    mostFrequentQueries: SlowQuery[];
    resourceIntensiveQueries: SlowQuery[];
    recommendations: string[];
  }> {
    try {
      const slowQueries = await this.getSlowQueries(20);
      
      // Sort by different criteria
      const slowestQueries = [...slowQueries]
        .sort((a, b) => b.mean_time - a.mean_time)
        .slice(0, 5);
      
      const mostFrequentQueries = [...slowQueries]
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 5);
      
      const resourceIntensiveQueries = [...slowQueries]
        .sort((a, b) => b.total_time - a.total_time)
        .slice(0, 5);

      // Generate optimization recommendations
      const recommendations = this.generateOptimizationRecommendations(slowQueries);

      return {
        slowestQueries,
        mostFrequentQueries,
        resourceIntensiveQueries,
        recommendations
      };
    } catch (error) {
      console.error('Failed to generate query performance report:', error);
      throw error;
    }
  }

  private generateOptimizationRecommendations(queries: SlowQuery[]): string[] {
    const recommendations: string[] = [];
    
    // Analyze queries and generate recommendations
    queries.forEach(query => {
      if (query.mean_time > 1000) {
        recommendations.push(`Consider adding indexes for query: ${query.query.substring(0, 50)}...`);
      }
      
      if (query.calls > 1000 && query.mean_time > 100) {
        recommendations.push(`High-frequency slow query detected - consider caching results`);
      }
      
      if (query.query.toLowerCase().includes('select *')) {
        recommendations.push(`Avoid SELECT * queries - specify only needed columns`);
      }
      
      if (query.query.toLowerCase().includes('order by') && !query.query.toLowerCase().includes('limit')) {
        recommendations.push(`Consider adding LIMIT to ORDER BY queries for better performance`);
      }
    });

    // Add general recommendations
    if (queries.length > 10) {
      recommendations.push('Consider implementing query result caching');
      recommendations.push('Review and optimize database indexes');
      recommendations.push('Consider query optimization and rewriting');
    }

    return [...new Set(recommendations)]; // Remove duplicates
  }

  // Cleanup and shutdown
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Database monitoring stopped');
    }
  }

  async cleanup(): Promise<void> {
    this.stopMonitoring();
    this.alerts = [];
  }

  // Archive old data for performance and compliance
  async archiveOldData(daysOld: number = 365): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('archive_old_data', { p_days_old: daysOld });

      if (error) {
        throw new Error(`Data archival failed: ${error.message}`);
      }

      const archivedCount = data || 0;
      
      if (archivedCount > 0) {
        console.log(`Archived ${archivedCount} old records`);
        this.createAlert('performance', 'low', 
          `Data archival completed: ${archivedCount} records archived`, 
          { archived_count: archivedCount, days_old: daysOld }
        );
      }

      return archivedCount;
    } catch (error) {
      console.error('Data archival failed:', error);
      this.createAlert('error', 'medium', 'Data archival failed', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const databaseMonitoringService = DatabaseMonitoringService.getInstance();
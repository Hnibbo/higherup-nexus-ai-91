import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from './EnhancedSupabaseService';

export interface DatabaseMetrics {
  database_name: string;
  timestamp: Date;
  connection_count: number;
  active_queries: number;
  slow_queries: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: {
    bytes_sent: number;
    bytes_received: number;
  };
  query_performance: {
    average_query_time: number;
    queries_per_second: number;
    cache_hit_ratio: number;
  };
  table_statistics: Array<{
    table_name: string;
    row_count: number;
    size_mb: number;
    index_size_mb: number;
  }>;
}

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  metric_type: 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'connection_count' | 'query_time' | 'error_rate';
  threshold_value: number;
  comparison_operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  severity: 'low' | 'medium' | 'high' | 'critical';
  notification_channels: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Alert {
  id: string;
  rule_id: string;
  metric_type: string;
  current_value: number;
  threshold_value: number;
  severity: string;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  acknowledged_by?: string;
  resolved_by?: string;
}

export interface PerformanceReport {
  report_id: string;
  user_id: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  generated_at: Date;
  time_period: {
    start_date: Date;
    end_date: Date;
  };
  summary: {
    average_cpu_usage: number;
    average_memory_usage: number;
    average_disk_usage: number;
    total_queries: number;
    slow_queries: number;
    error_count: number;
    uptime_percentage: number;
  };
  recommendations: string[];
  charts_data: {
    cpu_usage_trend: Array<{ timestamp: Date; value: number }>;
    memory_usage_trend: Array<{ timestamp: Date; value: number }>;
    query_performance_trend: Array<{ timestamp: Date; queries_per_second: number; avg_time: number }>;
  };
}

export interface HealthCheck {
  check_id: string;
  database_name: string;
  timestamp: Date;
  overall_health: 'healthy' | 'warning' | 'critical' | 'down';
  checks: Array<{
    check_name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    value?: number;
    threshold?: number;
  }>;
  response_time: number;
  recommendations: string[];
}

export class DatabaseMonitoringService {
  private static instance: DatabaseMonitoringService;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];

  private constructor() {
    this.startMonitoring();
  }

  public static getInstance(): DatabaseMonitoringService {
    if (!DatabaseMonitoringService.instance) {
      DatabaseMonitoringService.instance = new DatabaseMonitoringService();
    }
    return DatabaseMonitoringService.instance;
  }

  // Monitoring Control
  private startMonitoring(): void {
    console.log('🔍 Starting database monitoring...');
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
      } catch (error) {
        console.error('Monitoring cycle failed:', error);
      }
    }, 60000); // Every minute
  }

  async stopMonitoring(): Promise<void> {
    console.log('⏹️ Stopping database monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Metrics Collection
  private async collectMetrics(): Promise<void> {
    try {
      const metrics = await this.gatherDatabaseMetrics();
      await this.storeMetrics(metrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private async gatherDatabaseMetrics(): Promise<DatabaseMetrics> {
    // Mock metrics collection - in reality would query actual database metrics
    const metrics: DatabaseMetrics = {
      database_name: 'supabase_main',
      timestamp: new Date(),
      connection_count: Math.floor(Math.random() * 100) + 10,
      active_queries: Math.floor(Math.random() * 50) + 1,
      slow_queries: Math.floor(Math.random() * 5),
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      disk_usage: Math.random() * 100,
      network_io: {
        bytes_sent: Math.floor(Math.random() * 1000000),
        bytes_received: Math.floor(Math.random() * 1000000)
      },
      query_performance: {
        average_query_time: Math.random() * 1000,
        queries_per_second: Math.random() * 100,
        cache_hit_ratio: Math.random() * 100
      },
      table_statistics: [
        {
          table_name: 'contacts',
          row_count: Math.floor(Math.random() * 10000),
          size_mb: Math.random() * 100,
          index_size_mb: Math.random() * 20
        },
        {
          table_name: 'deals',
          row_count: Math.floor(Math.random() * 5000),
          size_mb: Math.random() * 50,
          index_size_mb: Math.random() * 10
        }
      ]
    };

    return metrics;
  }

  private async storeMetrics(metrics: DatabaseMetrics): Promise<void> {
    try {
      await supabase
        .from('database_metrics')
        .insert({
          database_name: metrics.database_name,
          timestamp: metrics.timestamp.toISOString(),
          connection_count: metrics.connection_count,
          active_queries: metrics.active_queries,
          slow_queries: metrics.slow_queries,
          cpu_usage: metrics.cpu_usage,
          memory_usage: metrics.memory_usage,
          disk_usage: metrics.disk_usage,
          network_io: metrics.network_io,
          query_performance: metrics.query_performance,
          table_statistics: metrics.table_statistics
        });

    } catch (error) {
      console.error('Failed to store metrics:', error);
    }
  }

  async getMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<DatabaseMetrics[]> {
    try {
      const timeRangeHours = {
        hour: 1,
        day: 24,
        week: 168,
        month: 720
      };

      const startTime = new Date(Date.now() - timeRangeHours[timeRange] * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('database_metrics')
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get metrics:', error);
      throw error;
    }
  }

  // Alert Management
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<AlertRule> {
    try {
      console.log(`🚨 Creating alert rule: ${rule.name}`);

      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: rule.user_id,
          name: rule.name,
          description: rule.description,
          metric_type: rule.metric_type,
          threshold_value: rule.threshold_value,
          comparison_operator: rule.comparison_operator,
          severity: rule.severity,
          notification_channels: rule.notification_channels,
          is_active: rule.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local cache
      this.alertRules.push(data);

      console.log(`✅ Alert rule created: ${rule.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create alert rule:', error);
      throw error;
    }
  }

  async getAlertRules(userId: string): Promise<AlertRule[]> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.alertRules = data || [];
      return this.alertRules;

    } catch (error) {
      console.error('❌ Failed to get alert rules:', error);
      throw error;
    }
  }

  private async checkAlerts(): Promise<void> {
    try {
      const latestMetrics = await this.getLatestMetrics();
      if (!latestMetrics) return;

      for (const rule of this.alertRules.filter(r => r.is_active)) {
        const currentValue = this.extractMetricValue(latestMetrics, rule.metric_type);
        const shouldAlert = this.evaluateAlertCondition(currentValue, rule.threshold_value, rule.comparison_operator);

        if (shouldAlert) {
          await this.triggerAlert(rule, currentValue);
        }
      }

    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  }

  private async getLatestMetrics(): Promise<DatabaseMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('database_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      return null;
    }
  }

  private extractMetricValue(metrics: DatabaseMetrics, metricType: string): number {
    switch (metricType) {
      case 'cpu_usage':
        return metrics.cpu_usage;
      case 'memory_usage':
        return metrics.memory_usage;
      case 'disk_usage':
        return metrics.disk_usage;
      case 'connection_count':
        return metrics.connection_count;
      case 'query_time':
        return metrics.query_performance.average_query_time;
      case 'error_rate':
        return metrics.slow_queries; // Mock error rate
      default:
        return 0;
    }
  }

  private evaluateAlertCondition(currentValue: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'greater_than':
        return currentValue > threshold;
      case 'less_than':
        return currentValue < threshold;
      case 'equals':
        return currentValue === threshold;
      case 'not_equals':
        return currentValue !== threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, currentValue: number): Promise<void> {
    try {
      // Check if alert is already active
      const existingAlert = this.activeAlerts.find(a => a.rule_id === rule.id && a.status === 'active');
      if (existingAlert) return;

      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random()}`,
        rule_id: rule.id,
        metric_type: rule.metric_type,
        current_value: currentValue,
        threshold_value: rule.threshold_value,
        severity: rule.severity,
        message: `${rule.name}: ${rule.metric_type} is ${currentValue} (threshold: ${rule.threshold_value})`,
        status: 'active',
        triggered_at: new Date()
      };

      // Store alert
      await supabase
        .from('alerts')
        .insert({
          rule_id: alert.rule_id,
          metric_type: alert.metric_type,
          current_value: alert.current_value,
          threshold_value: alert.threshold_value,
          severity: alert.severity,
          message: alert.message,
          status: alert.status,
          triggered_at: alert.triggered_at.toISOString()
        });

      this.activeAlerts.push(alert);

      // Send notifications
      await this.sendAlertNotifications(alert, rule.notification_channels);

      console.log(`🚨 Alert triggered: ${alert.message}`);

    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  }

  private async sendAlertNotifications(alert: Alert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'slack':
            await this.sendSlackNotification(alert);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Mock email notification
    console.log(`📧 Sending email notification for alert: ${alert.message}`);
  }

  private async sendSlackNotification(alert: Alert): Promise<void> {
    // Mock Slack notification
    console.log(`💬 Sending Slack notification for alert: ${alert.message}`);
  }

  private async sendWebhookNotification(alert: Alert): Promise<void> {
    // Mock webhook notification
    console.log(`🔗 Sending webhook notification for alert: ${alert.message}`);
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: acknowledgedBy
        })
        .eq('id', alertId);

      // Update local cache
      const alert = this.activeAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'acknowledged';
        alert.acknowledged_at = new Date();
        alert.acknowledged_by = acknowledgedBy;
      }

      console.log(`✅ Alert acknowledged: ${alertId}`);

    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
      throw error;
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', alertId);

      // Remove from active alerts
      this.activeAlerts = this.activeAlerts.filter(a => a.id !== alertId);

      console.log(`✅ Alert resolved: ${alertId}`);

    } catch (error) {
      console.error('❌ Failed to resolve alert:', error);
      throw error;
    }
  }

  // Health Checks
  async performHealthCheck(): Promise<HealthCheck> {
    try {
      console.log('🏥 Performing database health check...');

      const startTime = Date.now();
      const checks: HealthCheck['checks'] = [];
      
      // Connection check
      try {
        const { data, error } = await supabase.from('contacts').select('id').limit(1);
        checks.push({
          check_name: 'Database Connection',
          status: error ? 'fail' : 'pass',
          message: error ? error.message : 'Connection successful'
        });
      } catch (error) {
        checks.push({
          check_name: 'Database Connection',
          status: 'fail',
          message: 'Connection failed'
        });
      }

      // Performance check
      const latestMetrics = await this.getLatestMetrics();
      if (latestMetrics) {
        // CPU usage check
        checks.push({
          check_name: 'CPU Usage',
          status: latestMetrics.cpu_usage > 80 ? 'warning' : latestMetrics.cpu_usage > 95 ? 'fail' : 'pass',
          message: `CPU usage: ${latestMetrics.cpu_usage.toFixed(1)}%`,
          value: latestMetrics.cpu_usage,
          threshold: 80
        });

        // Memory usage check
        checks.push({
          check_name: 'Memory Usage',
          status: latestMetrics.memory_usage > 85 ? 'warning' : latestMetrics.memory_usage > 95 ? 'fail' : 'pass',
          message: `Memory usage: ${latestMetrics.memory_usage.toFixed(1)}%`,
          value: latestMetrics.memory_usage,
          threshold: 85
        });

        // Disk usage check
        checks.push({
          check_name: 'Disk Usage',
          status: latestMetrics.disk_usage > 90 ? 'warning' : latestMetrics.disk_usage > 98 ? 'fail' : 'pass',
          message: `Disk usage: ${latestMetrics.disk_usage.toFixed(1)}%`,
          value: latestMetrics.disk_usage,
          threshold: 90
        });

        // Query performance check
        checks.push({
          check_name: 'Query Performance',
          status: latestMetrics.query_performance.average_query_time > 1000 ? 'warning' : 
                 latestMetrics.query_performance.average_query_time > 5000 ? 'fail' : 'pass',
          message: `Average query time: ${latestMetrics.query_performance.average_query_time.toFixed(0)}ms`,
          value: latestMetrics.query_performance.average_query_time,
          threshold: 1000
        });
      }

      const responseTime = Date.now() - startTime;
      
      // Determine overall health
      const failedChecks = checks.filter(c => c.status === 'fail').length;
      const warningChecks = checks.filter(c => c.status === 'warning').length;
      
      let overallHealth: HealthCheck['overall_health'] = 'healthy';
      if (failedChecks > 0) {
        overallHealth = 'critical';
      } else if (warningChecks > 2) {
        overallHealth = 'warning';
      } else if (warningChecks > 0) {
        overallHealth = 'warning';
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (latestMetrics) {
        if (latestMetrics.cpu_usage > 80) {
          recommendations.push('Consider optimizing queries or scaling CPU resources');
        }
        if (latestMetrics.memory_usage > 85) {
          recommendations.push('Monitor memory usage and consider increasing memory allocation');
        }
        if (latestMetrics.disk_usage > 90) {
          recommendations.push('Clean up old data or increase disk space');
        }
        if (latestMetrics.query_performance.average_query_time > 1000) {
          recommendations.push('Review and optimize slow queries');
        }
      }

      const healthCheck: HealthCheck = {
        check_id: `health_${Date.now()}`,
        database_name: 'supabase_main',
        timestamp: new Date(),
        overall_health: overallHealth,
        checks,
        response_time: responseTime,
        recommendations
      };

      // Store health check result
      await supabase
        .from('health_checks')
        .insert({
          check_id: healthCheck.check_id,
          database_name: healthCheck.database_name,
          timestamp: healthCheck.timestamp.toISOString(),
          overall_health: healthCheck.overall_health,
          checks: healthCheck.checks,
          response_time: healthCheck.response_time,
          recommendations: healthCheck.recommendations
        });

      console.log(`✅ Health check completed: ${overallHealth}`);
      return healthCheck;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      
      return {
        check_id: `health_${Date.now()}`,
        database_name: 'supabase_main',
        timestamp: new Date(),
        overall_health: 'down',
        checks: [{
          check_name: 'Health Check',
          status: 'fail',
          message: 'Health check failed: ' + error.toString()
        }],
        response_time: 0,
        recommendations: ['Contact system administrator']
      };
    }
  }

  // Performance Reports
  async generatePerformanceReport(userId: string, reportType: 'daily' | 'weekly' | 'monthly'): Promise<PerformanceReport> {
    try {
      console.log(`📊 Generating ${reportType} performance report...`);

      const timeRanges = {
        daily: { days: 1, hours: 24 },
        weekly: { days: 7, hours: 168 },
        monthly: { days: 30, hours: 720 }
      };

      const range = timeRanges[reportType];
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - range.days * 24 * 60 * 60 * 1000);

      // Get metrics for the time period
      const { data: metrics, error } = await supabase
        .from('database_metrics')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (!metrics || metrics.length === 0) {
        throw new Error('No metrics data available for the specified period');
      }

      // Calculate summary statistics
      const summary = {
        average_cpu_usage: metrics.reduce((sum, m) => sum + m.cpu_usage, 0) / metrics.length,
        average_memory_usage: metrics.reduce((sum, m) => sum + m.memory_usage, 0) / metrics.length,
        average_disk_usage: metrics.reduce((sum, m) => sum + m.disk_usage, 0) / metrics.length,
        total_queries: metrics.reduce((sum, m) => sum + m.active_queries, 0),
        slow_queries: metrics.reduce((sum, m) => sum + m.slow_queries, 0),
        error_count: metrics.reduce((sum, m) => sum + m.slow_queries, 0), // Mock error count
        uptime_percentage: 99.9 // Mock uptime
      };

      // Generate recommendations
      const recommendations: string[] = [];
      if (summary.average_cpu_usage > 70) {
        recommendations.push('CPU usage is consistently high. Consider query optimization or scaling.');
      }
      if (summary.average_memory_usage > 80) {
        recommendations.push('Memory usage is high. Monitor for memory leaks or increase allocation.');
      }
      if (summary.slow_queries > summary.total_queries * 0.1) {
        recommendations.push('High number of slow queries detected. Review query performance.');
      }

      // Prepare chart data
      const chartsData = {
        cpu_usage_trend: metrics.map(m => ({
          timestamp: new Date(m.timestamp),
          value: m.cpu_usage
        })),
        memory_usage_trend: metrics.map(m => ({
          timestamp: new Date(m.timestamp),
          value: m.memory_usage
        })),
        query_performance_trend: metrics.map(m => ({
          timestamp: new Date(m.timestamp),
          queries_per_second: m.query_performance.queries_per_second,
          avg_time: m.query_performance.average_query_time
        }))
      };

      const report: PerformanceReport = {
        report_id: `report_${Date.now()}`,
        user_id: userId,
        report_type: reportType,
        generated_at: new Date(),
        time_period: {
          start_date: startDate,
          end_date: endDate
        },
        summary,
        recommendations,
        charts_data: chartsData
      };

      // Store report
      await supabase
        .from('performance_reports')
        .insert({
          report_id: report.report_id,
          user_id: report.user_id,
          report_type: report.report_type,
          generated_at: report.generated_at.toISOString(),
          time_period: report.time_period,
          summary: report.summary,
          recommendations: report.recommendations,
          charts_data: report.charts_data
        });

      console.log(`✅ Performance report generated: ${report.report_id}`);
      return report;

    } catch (error) {
      console.error('❌ Failed to generate performance report:', error);
      throw error;
    }
  }

  // Query Analysis
  async analyzeSlowQueries(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<Array<{
    query: string;
    execution_time: number;
    frequency: number;
    table_scans: number;
    recommendations: string[];
  }>> {
    try {
      console.log(`🔍 Analyzing slow queries for the past ${timeRange}...`);

      // Mock slow query analysis - in reality would query actual slow query logs
      const slowQueries = [
        {
          query: 'SELECT * FROM contacts WHERE email LIKE %@gmail.com%',
          execution_time: 2500,
          frequency: 15,
          table_scans: 1,
          recommendations: [
            'Add index on email column',
            'Use more specific WHERE conditions',
            'Consider query rewriting'
          ]
        },
        {
          query: 'SELECT COUNT(*) FROM deals JOIN contacts ON deals.contact_id = contacts.id',
          execution_time: 1800,
          frequency: 8,
          table_scans: 2,
          recommendations: [
            'Add composite index on join columns',
            'Consider using EXISTS instead of JOIN for count queries'
          ]
        }
      ];

      return slowQueries;

    } catch (error) {
      console.error('❌ Failed to analyze slow queries:', error);
      throw error;
    }
  }

  // Cleanup and Maintenance
  async cleanupOldMetrics(retentionDays: number = 30): Promise<void> {
    try {
      console.log(`🧹 Cleaning up metrics older than ${retentionDays} days...`);

      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('database_metrics')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`✅ Old metrics cleaned up`);

    } catch (error) {
      console.error('❌ Failed to cleanup old metrics:', error);
      throw error;
    }
  }

  // Dashboard Data
  async getDashboardData(): Promise<{
    current_metrics: DatabaseMetrics;
    active_alerts: Alert[];
    recent_health_checks: HealthCheck[];
    performance_summary: {
      cpu_trend: 'up' | 'down' | 'stable';
      memory_trend: 'up' | 'down' | 'stable';
      query_performance_trend: 'improving' | 'degrading' | 'stable';
    };
  }> {
    try {
      // Get current metrics
      const currentMetrics = await this.getLatestMetrics();
      
      // Get active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Get recent health checks
      const { data: healthChecks, error: healthError } = await supabase
        .from('health_checks')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (healthError) throw healthError;

      // Calculate performance trends (mock)
      const performanceSummary = {
        cpu_trend: 'stable' as const,
        memory_trend: 'up' as const,
        query_performance_trend: 'improving' as const
      };

      return {
        current_metrics: currentMetrics || {} as DatabaseMetrics,
        active_alerts: alerts || [],
        recent_health_checks: healthChecks || [],
        performance_summary: performanceSummary
      };

    } catch (error) {
      console.error('❌ Failed to get dashboard data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseMonitoringService = DatabaseMonitoringService.getInstance();
import { supabase } from '@/integrations/supabase/client';

export interface SystemMetrics {
  id: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
}

export interface ApplicationMetrics {
  id: string;
  timestamp: Date;
  requestCount: number;
  responseTime: number;
  errorCount: number;
  activeUsers: number;
  databaseConnections: number;
  cacheHitRate: number;
  queueLength: number;
  backgroundJobs: number;
  memoryLeaks: number;
  gcPressure: number;
}

export interface Alert {
  id: string;
  type: 'system' | 'application' | 'business' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  assignee?: string;
  resolvedAt?: Date;
  escalated: boolean;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  details: {
    database: boolean;
    cache: boolean;
    externalAPIs: boolean;
    storage: boolean;
  };
  dependencies: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
  }>;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;
  message: string;
  context: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stackTrace?: string;
  tags: string[];
}

export interface Trace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'ok' | 'error' | 'timeout';
  tags: Record<string, any>;
  logs: Array<{
    timestamp: Date;
    message: string;
    level: string;
  }>;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: string;
  refreshInterval: number;
  permissions: string[];
  createdBy: string;
  createdAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'alert' | 'log';
  title: string;
  query: string;
  visualization: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
}

export class MonitoringService {
  private metricsCollectionActive = false;
  private alertRules: Array<{
    metric: string;
    condition: string;
    threshold: number;
    severity: Alert['severity'];
  }> = [];

  async initializeMonitoring(): Promise<void> {
    await this.setupMetricsCollection();
    await this.setupAlertRules();
    await this.setupHealthChecks();
    await this.setupLogging();
    await this.setupTracing();
    await this.setupDashboards();
    
    this.metricsCollectionActive = true;
    await this.startMonitoring();
  }

  async collectSystemMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      cpuUsage: await this.getCPUUsage(),
      memoryUsage: await this.getMemoryUsage(),
      diskUsage: await this.getDiskUsage(),
      networkIn: await this.getNetworkIn(),
      networkOut: await this.getNetworkOut(),
      activeConnections: await this.getActiveConnections(),
      responseTime: await this.getAverageResponseTime(),
      throughput: await this.getThroughput(),
      errorRate: await this.getErrorRate(),
      availability: await this.getAvailability()
    };

    await this.storeSystemMetrics(metrics);
    await this.checkAlerts(metrics);

    return metrics;
  }

  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    const metrics: ApplicationMetrics = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      requestCount: await this.getRequestCount(),
      responseTime: await this.getApplicationResponseTime(),
      errorCount: await this.getErrorCount(),
      activeUsers: await this.getActiveUsers(),
      databaseConnections: await this.getDatabaseConnections(),
      cacheHitRate: await this.getCacheHitRate(),
      queueLength: await this.getQueueLength(),
      backgroundJobs: await this.getBackgroundJobs(),
      memoryLeaks: await this.getMemoryLeaks(),
      gcPressure: await this.getGCPressure()
    };

    await this.storeApplicationMetrics(metrics);
    await this.checkApplicationAlerts(metrics);

    return metrics;
  }

  async performHealthCheck(): Promise<HealthCheck> {
    const healthCheck: HealthCheck = {
      service: 'higherup-nexus-ai',
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
      details: {
        database: await this.checkDatabase(),
        cache: await this.checkCache(),
        externalAPIs: await this.checkExternalAPIs(),
        storage: await this.checkStorage()
      },
      dependencies: await this.checkDependencies()
    };

    // Determine overall status
    const allHealthy = Object.values(healthCheck.details).every(status => status);
    const dependenciesHealthy = healthCheck.dependencies.every(dep => dep.status === 'up');

    if (!allHealthy || !dependenciesHealthy) {
      healthCheck.status = 'degraded';
    }

    // Check for critical failures
    if (!healthCheck.details.database) {
      healthCheck.status = 'unhealthy';
    }

    await this.storeHealthCheck(healthCheck);

    return healthCheck;
  }

  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'status' | 'escalated'>): Promise<Alert> {
    const newAlert: Alert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      status: 'active',
      escalated: false,
      ...alert
    };

    await this.storeAlert(newAlert);
    await this.notifyAlert(newAlert);

    return newAlert;
  }

  async getAlerts(status?: Alert['status'], severity?: Alert['severity']): Promise<Alert[]> {
    let query = supabase
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  async acknowledgeAlert(alertId: string, assignee: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'acknowledged', assignee })
      .eq('id', alertId);

    if (error) throw error;
  }

  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'resolved', resolvedAt: new Date() })
      .eq('id', alertId);

    if (error) throw error;
  }

  async logEvent(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<LogEntry> {
    const logEntry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...entry
    };

    await this.storeLogEntry(logEntry);

    // Check for error patterns
    if (entry.level === 'error' || entry.level === 'fatal') {
      await this.analyzeErrorPatterns(logEntry);
    }

    return logEntry;
  }

  async searchLogs(query: {
    level?: LogEntry['level'];
    service?: string;
    message?: string;
    userId?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }): Promise<LogEntry[]> {
    let dbQuery = supabase
      .from('log_entries')
      .select('*')
      .order('timestamp', { ascending: false });

    if (query.level) {
      dbQuery = dbQuery.eq('level', query.level);
    }

    if (query.service) {
      dbQuery = dbQuery.eq('service', query.service);
    }

    if (query.message) {
      dbQuery = dbQuery.ilike('message', `%${query.message}%`);
    }

    if (query.userId) {
      dbQuery = dbQuery.eq('userId', query.userId);
    }

    if (query.timeRange) {
      dbQuery = dbQuery
        .gte('timestamp', query.timeRange.start.toISOString())
        .lte('timestamp', query.timeRange.end.toISOString());
    }

    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return data || [];
  }

  async startTrace(operationName: string, parentSpanId?: string): Promise<Trace> {
    const trace: Trace = {
      id: crypto.randomUUID(),
      traceId: parentSpanId ? this.getTraceId(parentSpanId) : crypto.randomUUID(),
      spanId: crypto.randomUUID(),
      parentSpanId,
      operationName,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      status: 'ok',
      tags: {},
      logs: []
    };

    return trace;
  }

  async finishTrace(trace: Trace, status: Trace['status'] = 'ok', tags: Record<string, any> = {}): Promise<void> {
    trace.endTime = new Date();
    trace.duration = trace.endTime.getTime() - trace.startTime.getTime();
    trace.status = status;
    trace.tags = { ...trace.tags, ...tags };

    await this.storeTrace(trace);

    // Analyze trace for performance issues
    if (trace.duration > 5000) { // 5 seconds
      await this.createAlert({
        type: 'application',
        severity: 'warning',
        title: 'Slow Operation Detected',
        description: `Operation ${trace.operationName} took ${trace.duration}ms`,
        metric: 'operation_duration',
        threshold: 5000,
        currentValue: trace.duration
      });
    }
  }

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt'>): Promise<Dashboard> {
    const newDashboard: Dashboard = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...dashboard
    };

    const { error } = await supabase
      .from('dashboards')
      .insert(newDashboard);

    if (error) throw error;

    return newDashboard;
  }

  async getDashboards(): Promise<Dashboard[]> {
    const { data, error } = await supabase
      .from('dashboards')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getMetricsReport(timeRange: { start: Date; end: Date }): Promise<{
    systemMetrics: SystemMetrics[];
    applicationMetrics: ApplicationMetrics[];
    alerts: Alert[];
    healthChecks: HealthCheck[];
    summary: {
      averageResponseTime: number;
      errorRate: number;
      availability: number;
      alertCount: number;
    };
  }> {
    const [systemMetrics, applicationMetrics, alerts, healthChecks] = await Promise.all([
      this.getSystemMetrics(timeRange),
      this.getApplicationMetrics(timeRange),
      this.getAlertsInRange(timeRange),
      this.getHealthChecks(timeRange)
    ]);

    const summary = {
      averageResponseTime: this.calculateAverageResponseTime(systemMetrics),
      errorRate: this.calculateAverageErrorRate(systemMetrics),
      availability: this.calculateAverageAvailability(systemMetrics),
      alertCount: alerts.length
    };

    return {
      systemMetrics,
      applicationMetrics,
      alerts,
      healthChecks,
      summary
    };
  }

  private async setupMetricsCollection(): Promise<void> {
    // Setup metrics collection infrastructure
    console.log('Setting up metrics collection');
  }

  private async setupAlertRules(): Promise<void> {
    this.alertRules = [
      { metric: 'cpuUsage', condition: '>', threshold: 80, severity: 'warning' },
      { metric: 'memoryUsage', condition: '>', threshold: 90, severity: 'error' },
      { metric: 'errorRate', condition: '>', threshold: 5, severity: 'warning' },
      { metric: 'responseTime', condition: '>', threshold: 2000, severity: 'warning' },
      { metric: 'availability', condition: '<', threshold: 99, severity: 'critical' }
    ];
  }

  private async setupHealthChecks(): Promise<void> {
    // Setup health check endpoints
    console.log('Setting up health checks');
  }

  private async setupLogging(): Promise<void> {
    // Setup centralized logging
    console.log('Setting up logging');
  }

  private async setupTracing(): Promise<void> {
    // Setup distributed tracing
    console.log('Setting up tracing');
  }

  private async setupDashboards(): Promise<void> {
    // Setup default dashboards
    await this.createDefaultDashboards();
  }

  private async startMonitoring(): Promise<void> {
    // Start continuous monitoring
    setInterval(async () => {
      if (this.metricsCollectionActive) {
        await this.collectSystemMetrics();
        await this.collectApplicationMetrics();
        await this.performHealthCheck();
      }
    }, 60000); // Every minute
  }

  private async getCPUUsage(): Promise<number> {
    // Mock CPU usage
    return Math.random() * 100;
  }

  private async getMemoryUsage(): Promise<number> {
    // Mock memory usage
    return Math.random() * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // Mock disk usage
    return Math.random() * 100;
  }

  private async getNetworkIn(): Promise<number> {
    // Mock network in
    return Math.random() * 1000000;
  }

  private async getNetworkOut(): Promise<number> {
    // Mock network out
    return Math.random() * 1000000;
  }

  private async getActiveConnections(): Promise<number> {
    // Mock active connections
    return Math.floor(Math.random() * 1000);
  }

  private async getAverageResponseTime(): Promise<number> {
    // Mock response time
    return Math.random() * 2000;
  }

  private async getThroughput(): Promise<number> {
    // Mock throughput
    return Math.random() * 10000;
  }

  private async getErrorRate(): Promise<number> {
    // Mock error rate
    return Math.random() * 10;
  }

  private async getAvailability(): Promise<number> {
    // Mock availability
    return 95 + Math.random() * 5;
  }

  private async getRequestCount(): Promise<number> {
    // Mock request count
    return Math.floor(Math.random() * 10000);
  }

  private async getApplicationResponseTime(): Promise<number> {
    // Mock application response time
    return Math.random() * 1000;
  }

  private async getErrorCount(): Promise<number> {
    // Mock error count
    return Math.floor(Math.random() * 100);
  }

  private async getActiveUsers(): Promise<number> {
    // Mock active users
    return Math.floor(Math.random() * 1000);
  }

  private async getDatabaseConnections(): Promise<number> {
    // Mock database connections
    return Math.floor(Math.random() * 100);
  }

  private async getCacheHitRate(): Promise<number> {
    // Mock cache hit rate
    return 80 + Math.random() * 20;
  }

  private async getQueueLength(): Promise<number> {
    // Mock queue length
    return Math.floor(Math.random() * 50);
  }

  private async getBackgroundJobs(): Promise<number> {
    // Mock background jobs
    return Math.floor(Math.random() * 20);
  }

  private async getMemoryLeaks(): Promise<number> {
    // Mock memory leaks
    return Math.floor(Math.random() * 5);
  }

  private async getGCPressure(): Promise<number> {
    // Mock GC pressure
    return Math.random() * 100;
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      const { error } = await supabase.from('health_check').select('1').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  private async checkCache(): Promise<boolean> {
    // Mock cache check
    return Math.random() > 0.1;
  }

  private async checkExternalAPIs(): Promise<boolean> {
    // Mock external API check
    return Math.random() > 0.05;
  }

  private async checkStorage(): Promise<boolean> {
    // Mock storage check
    return Math.random() > 0.02;
  }

  private async checkDependencies(): Promise<HealthCheck['dependencies']> {
    return [
      { name: 'Database', status: 'up', responseTime: 50 },
      { name: 'Redis', status: 'up', responseTime: 10 },
      { name: 'External API', status: 'up', responseTime: 200 }
    ];
  }

  private async storeSystemMetrics(metrics: SystemMetrics): Promise<void> {
    const { error } = await supabase
      .from('system_metrics')
      .insert(metrics);

    if (error) {
      console.error('Failed to store system metrics:', error);
    }
  }

  private async storeApplicationMetrics(metrics: ApplicationMetrics): Promise<void> {
    const { error } = await supabase
      .from('application_metrics')
      .insert(metrics);

    if (error) {
      console.error('Failed to store application metrics:', error);
    }
  }

  private async storeHealthCheck(healthCheck: HealthCheck): Promise<void> {
    const { error } = await supabase
      .from('health_checks')
      .insert(healthCheck);

    if (error) {
      console.error('Failed to store health check:', error);
    }
  }

  private async storeAlert(alert: Alert): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .insert(alert);

    if (error) {
      console.error('Failed to store alert:', error);
    }
  }

  private async storeLogEntry(entry: LogEntry): Promise<void> {
    const { error } = await supabase
      .from('log_entries')
      .insert(entry);

    if (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  private async storeTrace(trace: Trace): Promise<void> {
    const { error } = await supabase
      .from('traces')
      .insert(trace);

    if (error) {
      console.error('Failed to store trace:', error);
    }
  }

  private async checkAlerts(metrics: SystemMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      const value = (metrics as any)[rule.metric];
      if (this.evaluateCondition(value, rule.condition, rule.threshold)) {
        await this.createAlert({
          type: 'system',
          severity: rule.severity,
          title: `${rule.metric} threshold exceeded`,
          description: `${rule.metric} is ${value}, threshold is ${rule.threshold}`,
          metric: rule.metric,
          threshold: rule.threshold,
          currentValue: value
        });
      }
    }
  }

  private async checkApplicationAlerts(metrics: ApplicationMetrics): Promise<void> {
    // Check application-specific alerts
    if (metrics.errorCount > 50) {
      await this.createAlert({
        type: 'application',
        severity: 'error',
        title: 'High Error Count',
        description: `Error count is ${metrics.errorCount}`,
        metric: 'errorCount',
        threshold: 50,
        currentValue: metrics.errorCount
      });
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      default: return false;
    }
  }

  private async notifyAlert(alert: Alert): Promise<void> {
    // Send alert notifications
    console.log(`Alert: ${alert.title} - ${alert.description}`);
  }

  private async analyzeErrorPatterns(entry: LogEntry): Promise<void> {
    // Analyze error patterns for anomalies
    console.log('Analyzing error patterns for:', entry.message);
  }

  private getTraceId(spanId: string): string {
    // Extract trace ID from span ID
    return spanId.split('-')[0];
  }

  private async createDefaultDashboards(): Promise<void> {
    const systemDashboard: Omit<Dashboard, 'id' | 'createdAt'> = {
      name: 'System Overview',
      description: 'System performance metrics',
      widgets: [
        {
          id: '1',
          type: 'metric',
          title: 'CPU Usage',
          query: 'system_metrics.cpuUsage',
          visualization: 'gauge',
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: { max: 100, unit: '%' }
        },
        {
          id: '2',
          type: 'chart',
          title: 'Response Time',
          query: 'system_metrics.responseTime',
          visualization: 'line',
          position: { x: 6, y: 0, width: 6, height: 4 },
          config: { timeRange: '1h' }
        }
      ],
      layout: 'grid',
      refreshInterval: 30000,
      permissions: ['admin', 'operator'],
      createdBy: 'system'
    };

    await this.createDashboard(systemDashboard);
  }

  private async getSystemMetrics(timeRange: { start: Date; end: Date }): Promise<SystemMetrics[]> {
    const { data, error } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getApplicationMetrics(timeRange: { start: Date; end: Date }): Promise<ApplicationMetrics[]> {
    const { data, error } = await supabase
      .from('application_metrics')
      .select('*')
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getAlertsInRange(timeRange: { start: Date; end: Date }): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .gte('timestamp', timeRange.start.toISOString())
      .lte('timestamp', timeRange.end.toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getHealthChecks(timeRange: { start: Date; end: Date }): Promise<HealthCheck[]> {
    const { data, error } = await supabase
      .from('health_checks')
      .select('*')
      .gte('lastCheck', timeRange.start.toISOString())
      .lte('lastCheck', timeRange.end.toISOString())
      .order('lastCheck', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private calculateAverageResponseTime(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / metrics.length;
  }

  private calculateAverageErrorRate(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.errorRate, 0);
    return sum / metrics.length;
  }

  private calculateAverageAvailability(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.availability, 0);
    return sum / metrics.length;
  }
}

export const monitoringService = new MonitoringService();
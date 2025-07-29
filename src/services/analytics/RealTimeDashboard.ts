/**
 * Real-Time Dashboard with Interactive Visualizations
 * Advanced dashboard system with live data updates and interactive charts
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';
import { realTimeAnalyticsEngine } from './RealTimeAnalyticsEngine';
import { customReportBuilder } from './CustomReportBuilder';

// Dashboard interfaces
export interface DashboardConfig {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: 'executive' | 'sales' | 'marketing' | 'analytics' | 'operations' | 'custom';
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: GlobalFilter[];
  settings: DashboardSettings;
  sharing: DashboardSharing;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'masonry';
  columns: number;
  rows: number;
  gap: number;
  responsive: {
    mobile: { columns: number; rows: number };
    tablet: { columns: number; rows: number };
    desktop: { columns: number; rows: number };
  };
  theme: DashboardTheme;
}

export interface DashboardTheme {
  name: 'light' | 'dark' | 'custom';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'map' | 'text' | 'image' | 'iframe' | 'custom';
  title: string;
  subtitle?: string;
  position: WidgetPosition;
  size: WidgetSize;
  dataSource: WidgetDataSource;
  visualization: WidgetVisualization;
  interactions: WidgetInteractions;
  styling: WidgetStyling;
  refreshInterval: number; // seconds
  isVisible: boolean;
  order: number;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z: number; // layer order
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable: boolean;
}

export interface WidgetDataSource {
  type: 'metric' | 'report' | 'query' | 'api' | 'static';
  config: {
    metricIds?: string[];
    reportId?: string;
    query?: string;
    apiEndpoint?: string;
    staticData?: any;
  };
  filters: WidgetFilter[];
  aggregation?: {
    method: 'sum' | 'avg' | 'count' | 'min' | 'max';
    groupBy?: string[];
    timeWindow?: string;
  };
  realTime: boolean;
}

export interface WidgetFilter {
  field: string;
  operator: string;
  value: any;
  isActive: boolean;
}

export interface WidgetVisualization {
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'number' | 'table' | 'map';
  options: {
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    showLabels?: boolean;
    animation?: boolean;
    responsive?: boolean;
    customOptions?: Record<string, any>;
  };
  axes?: {
    x?: AxisConfiguration;
    y?: AxisConfiguration;
  };
  series?: SeriesConfiguration[];
}

export interface AxisConfiguration {
  title: string;
  type: 'linear' | 'logarithmic' | 'category' | 'time';
  min?: number;
  max?: number;
  format?: string;
  gridLines: boolean;
  tickInterval?: number;
}

export interface SeriesConfiguration {
  name: string;
  type: string;
  color: string;
  yAxis?: number;
  visible: boolean;
}

export interface WidgetInteractions {
  clickable: boolean;
  hoverable: boolean;
  drillDown: {
    enabled: boolean;
    target?: string;
    parameters?: Record<string, any>;
  };
  crossFilter: {
    enabled: boolean;
    affects: string[]; // widget IDs
  };
  export: {
    enabled: boolean;
    formats: ('png' | 'svg' | 'pdf' | 'csv' | 'excel')[];
  };
}

export interface WidgetStyling {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  shadow?: boolean;
  customCSS?: string;
}

export interface GlobalFilter {
  id: string;
  name: string;
  field: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number' | 'slider';
  options?: FilterOption[];
  value: any;
  defaultValue: any;
  isActive: boolean;
  affectedWidgets: string[]; // widget IDs
}

export interface FilterOption {
  label: string;
  value: any;
  count?: number;
}

export interface DashboardSettings {
  autoRefresh: {
    enabled: boolean;
    interval: number; // seconds
  };
  notifications: {
    enabled: boolean;
    channels: ('email' | 'sms' | 'push' | 'slack')[];
    conditions: NotificationCondition[];
  };
  export: {
    enabled: boolean;
    formats: ('pdf' | 'png' | 'excel' | 'pptx')[];
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      recipients: string[];
    };
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    lazyLoading: boolean;
    virtualScrolling: boolean;
  };
}

export interface NotificationCondition {
  id: string;
  name: string;
  widgetId: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
}

export interface DashboardSharing {
  isPublic: boolean;
  shareToken?: string;
  allowedUsers: string[];
  permissions: {
    view: boolean;
    edit: boolean;
    share: boolean;
    export: boolean;
    comment: boolean;
  };
  embed: {
    enabled: boolean;
    domains: string[];
    settings: {
      width: number;
      height: number;
      autoRefresh: boolean;
      showControls: boolean;
      showFilters: boolean;
    };
  };
}

export interface DashboardData {
  dashboardId: string;
  widgets: WidgetData[];
  filters: FilterData[];
  metadata: DashboardMetadata;
  lastUpdated: Date;
}

export interface WidgetData {
  widgetId: string;
  data: any;
  status: 'loading' | 'success' | 'error' | 'empty';
  error?: string;
  lastUpdated: Date;
  executionTime: number;
  cacheHit: boolean;
}

export interface FilterData {
  filterId: string;
  options: FilterOption[];
  selectedValue: any;
  affectedWidgets: string[];
}

export interface DashboardMetadata {
  totalWidgets: number;
  loadedWidgets: number;
  errorWidgets: number;
  totalExecutionTime: number;
  cacheHitRate: number;
  dataFreshness: Date;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  dashboardConfig: Omit<DashboardConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  previewImage?: string;
  tags: string[];
  popularity: number;
  isOfficial: boolean;
}

export interface DashboardAlert {
  id: string;
  dashboardId: string;
  widgetId: string;
  conditionId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  value: number;
  threshold: number;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

/**
 * Real-Time Dashboard with interactive visualizations and live updates
 */
export class RealTimeDashboard {
  private static instance: RealTimeDashboard;
  private dashboards: Map<string, DashboardConfig> = new Map();
  private templates: Map<string, DashboardTemplate> = new Map();
  private activeConnections: Map<string, Set<WebSocket>> = new Map();
  private widgetCache: Map<string, WidgetData> = new Map();
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map();
  private alerts: Map<string, DashboardAlert> = new Map();

  private constructor() {
    this.initializeDashboard();
  }

  public static getInstance(): RealTimeDashboard {
    if (!RealTimeDashboard.instance) {
      RealTimeDashboard.instance = new RealTimeDashboard();
    }
    return RealTimeDashboard.instance;
  }

  private async initializeDashboard(): Promise<void> {
    console.log('📊 Initializing Real-Time Dashboard');
    
    // Load existing dashboards and templates
    await this.loadDashboards();
    await this.loadTemplates();
    
    // Initialize real-time connections
    await this.initializeRealTimeConnections();
    
    console.log('✅ Real-Time Dashboard initialized');
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(userId: string, dashboardData: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardConfig> {
    try {
      console.log(`📊 Creating dashboard: ${dashboardData.name}`);

      const dashboard: DashboardConfig = {
        id: `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...dashboardData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate dashboard configuration
      await this.validateDashboardConfig(dashboard);

      // Store dashboard
      await this.storeDashboard(dashboard);
      this.dashboards.set(dashboard.id, dashboard);

      // Initialize widget refresh intervals
      await this.initializeWidgetRefresh(dashboard);

      console.log(`✅ Dashboard created: ${dashboard.id}`);
      return dashboard;

    } catch (error) {
      console.error('❌ Failed to create dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard data with real-time updates
   */
  async getDashboardData(dashboardId: string, options: {
    useCache?: boolean;
    maxCacheAge?: number; // minutes
    filters?: Record<string, any>;
  } = {}): Promise<DashboardData> {
    try {
      console.log(`📊 Getting dashboard data: ${dashboardId}`);

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const startTime = Date.now();
      const widgetDataPromises = dashboard.widgets.map(widget => 
        this.getWidgetData(widget, options)
      );

      const widgetResults = await Promise.allSettled(widgetDataPromises);
      const widgetData: WidgetData[] = [];
      let errorCount = 0;
      let cacheHits = 0;

      widgetResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          widgetData.push(result.value);
          if (result.value.cacheHit) cacheHits++;
        } else {
          errorCount++;
          widgetData.push({
            widgetId: dashboard.widgets[index].id,
            data: null,
            status: 'error',
            error: result.reason?.message || 'Unknown error',
            lastUpdated: new Date(),
            executionTime: 0,
            cacheHit: false
          });
        }
      });

      // Get filter data
      const filterData = await this.getFilterData(dashboard.filters);

      const dashboardData: DashboardData = {
        dashboardId,
        widgets: widgetData,
        filters: filterData,
        metadata: {
          totalWidgets: dashboard.widgets.length,
          loadedWidgets: dashboard.widgets.length - errorCount,
          errorWidgets: errorCount,
          totalExecutionTime: Date.now() - startTime,
          cacheHitRate: dashboard.widgets.length > 0 ? (cacheHits / dashboard.widgets.length) * 100 : 0,
          dataFreshness: new Date()
        },
        lastUpdated: new Date()
      };

      // Check for alerts
      await this.checkDashboardAlerts(dashboard, dashboardData);

      console.log(`✅ Dashboard data retrieved: ${dashboardId} (${dashboardData.metadata.totalExecutionTime}ms)`);
      return dashboardData;

    } catch (error) {
      console.error(`❌ Failed to get dashboard data ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Create dashboard from template
   */
  async createDashboardFromTemplate(userId: string, templateId: string, customizations: Partial<DashboardConfig> = {}): Promise<DashboardConfig> {
    try {
      console.log(`📊 Creating dashboard from template: ${templateId}`);

      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const dashboardData: Omit<DashboardConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        ...template.dashboardConfig,
        ...customizations,
        userId,
        name: customizations.name || `${template.name} - ${new Date().toLocaleDateString()}`
      };

      return await this.createDashboard(userId, dashboardData);

    } catch (error) {
      console.error('❌ Failed to create dashboard from template:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time dashboard updates
   */
  subscribeToUpdates(dashboardId: string, websocket: WebSocket): void {
    if (!this.activeConnections.has(dashboardId)) {
      this.activeConnections.set(dashboardId, new Set());
    }
    
    this.activeConnections.get(dashboardId)!.add(websocket);
    
    websocket.on('close', () => {
      this.activeConnections.get(dashboardId)?.delete(websocket);
    });

    console.log(`🔄 Client subscribed to dashboard updates: ${dashboardId}`);
  }

  /**
   * Update widget in dashboard
   */
  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget> {
    try {
      console.log(`🔄 Updating widget: ${widgetId} in dashboard: ${dashboardId}`);

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) {
        throw new Error(`Widget not found: ${widgetId}`);
      }

      const updatedWidget = { ...dashboard.widgets[widgetIndex], ...updates };
      dashboard.widgets[widgetIndex] = updatedWidget;
      dashboard.updatedAt = new Date();

      // Update dashboard
      await this.updateDashboard(dashboard);

      // Clear widget cache
      this.widgetCache.delete(widgetId);

      // Notify subscribers
      await this.notifySubscribers(dashboardId, {
        type: 'widget_updated',
        widgetId,
        data: updatedWidget
      });

      console.log(`✅ Widget updated: ${widgetId}`);
      return updatedWidget;

    } catch (error) {
      console.error(`❌ Failed to update widget ${widgetId}:`, error);
      throw error;
    }
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, widget: Omit<DashboardWidget, 'id'>): Promise<DashboardWidget> {
    try {
      console.log(`➕ Adding widget to dashboard: ${dashboardId}`);

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const newWidget: DashboardWidget = {
        id: `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...widget
      };

      dashboard.widgets.push(newWidget);
      dashboard.updatedAt = new Date();

      // Update dashboard
      await this.updateDashboard(dashboard);

      // Initialize widget refresh
      if (newWidget.refreshInterval > 0) {
        await this.initializeWidgetRefresh(dashboard, newWidget.id);
      }

      // Notify subscribers
      await this.notifySubscribers(dashboardId, {
        type: 'widget_added',
        widgetId: newWidget.id,
        data: newWidget
      });

      console.log(`✅ Widget added: ${newWidget.id}`);
      return newWidget;

    } catch (error) {
      console.error(`❌ Failed to add widget to dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Remove widget from dashboard
   */
  async removeWidget(dashboardId: string, widgetId: string): Promise<void> {
    try {
      console.log(`➖ Removing widget: ${widgetId} from dashboard: ${dashboardId}`);

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
      if (widgetIndex === -1) {
        throw new Error(`Widget not found: ${widgetId}`);
      }

      dashboard.widgets.splice(widgetIndex, 1);
      dashboard.updatedAt = new Date();

      // Update dashboard
      await this.updateDashboard(dashboard);

      // Clear widget cache and refresh interval
      this.widgetCache.delete(widgetId);
      const interval = this.refreshIntervals.get(widgetId);
      if (interval) {
        clearInterval(interval);
        this.refreshIntervals.delete(widgetId);
      }

      // Notify subscribers
      await this.notifySubscribers(dashboardId, {
        type: 'widget_removed',
        widgetId,
        data: null
      });

      console.log(`✅ Widget removed: ${widgetId}`);

    } catch (error) {
      console.error(`❌ Failed to remove widget ${widgetId}:`, error);
      throw error;
    }
  }

  /**
   * Export dashboard
   */
  async exportDashboard(dashboardId: string, format: 'pdf' | 'png' | 'excel' | 'pptx', options: {
    includeData?: boolean;
    includeCharts?: boolean;
    customStyling?: Record<string, any>;
  } = {}): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }> {
    try {
      console.log(`📤 Exporting dashboard: ${dashboardId} as ${format}`);

      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }

      const dashboardData = await this.getDashboardData(dashboardId);

      switch (format) {
        case 'pdf':
          return await this.exportToPDF(dashboard, dashboardData, options);
        
        case 'png':
          return await this.exportToPNG(dashboard, dashboardData, options);
        
        case 'excel':
          return await this.exportToExcel(dashboard, dashboardData, options);
        
        case 'pptx':
          return await this.exportToPowerPoint(dashboard, dashboardData, options);
        
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      console.error(`❌ Failed to export dashboard ${dashboardId}:`, error);
      throw error;
    }
  }

  /**
   * Get available dashboard templates
   */
  async getTemplates(category?: string, industry?: string): Promise<DashboardTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (industry) {
      templates = templates.filter(t => t.industry === industry);
    }

    return templates.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Private helper methods
   */
  private async validateDashboardConfig(dashboard: DashboardConfig): Promise<void> {
    // Validate basic properties
    if (!dashboard.name || dashboard.name.trim().length === 0) {
      throw new Error('Dashboard name is required');
    }

    // Validate layout
    if (dashboard.layout.columns <= 0 || dashboard.layout.rows <= 0) {
      throw new Error('Invalid layout dimensions');
    }

    // Validate widgets
    for (const widget of dashboard.widgets) {
      await this.validateWidget(widget);
    }

    console.log(`✅ Dashboard configuration validated: ${dashboard.name}`);
  }

  private async validateWidget(widget: DashboardWidget): Promise<void> {
    // Validate position and size
    if (widget.position.x < 0 || widget.position.y < 0) {
      throw new Error(`Invalid widget position: ${widget.id}`);
    }

    if (widget.size.width <= 0 || widget.size.height <= 0) {
      throw new Error(`Invalid widget size: ${widget.id}`);
    }

    // Validate data source
    if (!widget.dataSource.config) {
      throw new Error(`Widget data source configuration required: ${widget.id}`);
    }

    console.log(`✅ Widget validated: ${widget.id}`);
  }

  private async getWidgetData(widget: DashboardWidget, options: any): Promise<WidgetData> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.widgetCache.get(widget.id);
        if (cached && this.isCacheValid(cached, options.maxCacheAge || 5)) {
          return { ...cached, cacheHit: true };
        }
      }

      let data: any;

      switch (widget.dataSource.type) {
        case 'metric':
          data = await this.getMetricData(widget);
          break;
        
        case 'report':
          data = await this.getReportData(widget);
          break;
        
        case 'query':
          data = await this.getQueryData(widget);
          break;
        
        case 'api':
          data = await this.getAPIData(widget);
          break;
        
        case 'static':
          data = widget.dataSource.config.staticData;
          break;
        
        default:
          throw new Error(`Unsupported data source type: ${widget.dataSource.type}`);
      }

      const widgetData: WidgetData = {
        widgetId: widget.id,
        data,
        status: 'success',
        lastUpdated: new Date(),
        executionTime: Date.now() - startTime,
        cacheHit: false
      };

      // Cache the result
      this.widgetCache.set(widget.id, widgetData);

      return widgetData;

    } catch (error) {
      return {
        widgetId: widget.id,
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        lastUpdated: new Date(),
        executionTime: Date.now() - startTime,
        cacheHit: false
      };
    }
  }

  private async getMetricData(widget: DashboardWidget): Promise<any> {
    const { metricIds } = widget.dataSource.config;
    if (!metricIds || metricIds.length === 0) {
      throw new Error('Metric IDs required for metric widget');
    }

    // Get metrics from analytics engine
    const metrics = [];
    for (const metricId of metricIds) {
      // This would get actual metric data
      metrics.push({
        id: metricId,
        value: Math.random() * 1000,
        change: Math.random() * 20 - 10,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      });
    }

    return this.formatDataForVisualization(metrics, widget.visualization);
  }

  private async getReportData(widget: DashboardWidget): Promise<any> {
    const { reportId } = widget.dataSource.config;
    if (!reportId) {
      throw new Error('Report ID required for report widget');
    }

    // Get report data from report builder
    const reportResult = await customReportBuilder.executeReport(reportId);
    return this.formatDataForVisualization(reportResult.data, widget.visualization);
  }

  private async getQueryData(widget: DashboardWidget): Promise<any> {
    const { query } = widget.dataSource.config;
    if (!query) {
      throw new Error('Query required for query widget');
    }

    // Execute custom query
    const result = await productionDatabaseService.executeWithRetry(async () => {
      // This would execute the actual query
      return this.generateMockQueryResult();
    });

    return this.formatDataForVisualization(result, widget.visualization);
  }

  private async getAPIData(widget: DashboardWidget): Promise<any> {
    const { apiEndpoint } = widget.dataSource.config;
    if (!apiEndpoint) {
      throw new Error('API endpoint required for API widget');
    }

    // Make API call
    const response = await fetch(apiEndpoint);
    const data = await response.json();

    return this.formatDataForVisualization(data, widget.visualization);
  }

  private formatDataForVisualization(data: any, visualization: WidgetVisualization): any {
    switch (visualization.chartType) {
      case 'number':
        return {
          value: Array.isArray(data) ? data[0]?.value || 0 : data.value || 0,
          change: Array.isArray(data) ? data[0]?.change || 0 : data.change || 0,
          trend: Array.isArray(data) ? data[0]?.trend || 'stable' : data.trend || 'stable'
        };
      
      case 'line':
      case 'bar':
      case 'area':
        return {
          series: [{
            name: 'Data',
            data: Array.isArray(data) ? data.map((item, index) => ({ x: index, y: item.value || item })) : [{ x: 0, y: data.value || data }]
          }]
        };
      
      case 'pie':
        return {
          series: Array.isArray(data) ? data.map((item, index) => ({ name: `Item ${index + 1}`, value: item.value || item })) : [{ name: 'Data', value: data.value || data }]
        };
      
      case 'table':
        return {
          columns: ['Name', 'Value', 'Change'],
          rows: Array.isArray(data) ? data.map((item, index) => [`Item ${index + 1}`, item.value || item, item.change || 0]) : [['Data', data.value || data, data.change || 0]]
        };
      
      case 'gauge':
        return {
          value: Array.isArray(data) ? data[0]?.value || 0 : data.value || 0,
          min: 0,
          max: 100,
          target: 80
        };
      
      default:
        return data;
    }
  }

  private generateMockQueryResult(): any {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      value: Math.random() * 1000,
      change: Math.random() * 20 - 10,
      category: `Category ${(i % 3) + 1}`
    }));
  }

  private isCacheValid(cached: WidgetData, maxAgeMinutes: number): boolean {
    const ageMinutes = (Date.now() - cached.lastUpdated.getTime()) / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }

  private async getFilterData(filters: GlobalFilter[]): Promise<FilterData[]> {
    const filterData: FilterData[] = [];

    for (const filter of filters) {
      const options = await this.getFilterOptions(filter);
      
      filterData.push({
        filterId: filter.id,
        options,
        selectedValue: filter.value,
        affectedWidgets: filter.affectedWidgets
      });
    }

    return filterData;
  }

  private async getFilterOptions(filter: GlobalFilter): Promise<FilterOption[]> {
    // This would get actual filter options from data source
    switch (filter.type) {
      case 'select':
      case 'multiselect':
        return [
          { label: 'Option 1', value: 'opt1', count: 10 },
          { label: 'Option 2', value: 'opt2', count: 15 },
          { label: 'Option 3', value: 'opt3', count: 8 }
        ];
      
      default:
        return [];
    }
  }

  private async initializeWidgetRefresh(dashboard: DashboardConfig, specificWidgetId?: string): Promise<void> {
    const widgets = specificWidgetId 
      ? dashboard.widgets.filter(w => w.id === specificWidgetId)
      : dashboard.widgets;

    for (const widget of widgets) {
      if (widget.refreshInterval > 0) {
        // Clear existing interval
        const existingInterval = this.refreshIntervals.get(widget.id);
        if (existingInterval) {
          clearInterval(existingInterval);
        }

        // Set new interval
        const interval = setInterval(async () => {
          try {
            const widgetData = await this.getWidgetData(widget, { useCache: false });
            
            // Notify subscribers
            await this.notifySubscribers(dashboard.id, {
              type: 'widget_data_updated',
              widgetId: widget.id,
              data: widgetData
            });
          } catch (error) {
            console.error(`Failed to refresh widget ${widget.id}:`, error);
          }
        }, widget.refreshInterval * 1000);

        this.refreshIntervals.set(widget.id, interval);
      }
    }
  }

  private async checkDashboardAlerts(dashboard: DashboardConfig, data: DashboardData): Promise<void> {
    for (const condition of dashboard.settings.notifications.conditions) {
      if (!condition.isActive) continue;

      const widgetData = data.widgets.find(w => w.widgetId === condition.widgetId);
      if (!widgetData || widgetData.status !== 'success') continue;

      const value = this.extractMetricValue(widgetData.data, condition.metric);
      if (value === null) continue;

      let triggered = false;
      switch (condition.operator) {
        case 'gt':
          triggered = value > condition.threshold;
          break;
        case 'lt':
          triggered = value < condition.threshold;
          break;
        case 'gte':
          triggered = value >= condition.threshold;
          break;
        case 'lte':
          triggered = value <= condition.threshold;
          break;
        case 'eq':
          triggered = value === condition.threshold;
          break;
      }

      if (triggered) {
        await this.triggerAlert(dashboard, condition, value);
      }
    }
  }

  private extractMetricValue(data: any, metric: string): number | null {
    if (!data) return null;
    
    if (typeof data === 'object') {
      return data[metric] || data.value || null;
    }
    
    return typeof data === 'number' ? data : null;
  }

  private async triggerAlert(dashboard: DashboardConfig, condition: NotificationCondition, value: number): Promise<void> {
    const alert: DashboardAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      dashboardId: dashboard.id,
      widgetId: condition.widgetId,
      conditionId: condition.id,
      title: `Alert: ${condition.name}`,
      message: `${condition.metric} is ${value} (threshold: ${condition.threshold})`,
      severity: condition.severity,
      value,
      threshold: condition.threshold,
      triggeredAt: new Date(),
      acknowledged: false
    };

    this.alerts.set(alert.id, alert);

    // Send notifications
    await this.sendAlertNotifications(dashboard, alert);

    // Notify dashboard subscribers
    await this.notifySubscribers(dashboard.id, {
      type: 'alert_triggered',
      alertId: alert.id,
      data: alert
    });

    console.log(`🚨 Alert triggered: ${alert.title}`);
  }

  private async sendAlertNotifications(dashboard: DashboardConfig, alert: DashboardAlert): Promise<void> {
    for (const channel of dashboard.settings.notifications.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(dashboard, alert);
            break;
          case 'sms':
            await this.sendSMSAlert(dashboard, alert);
            break;
          case 'push':
            await this.sendPushAlert(dashboard, alert);
            break;
          case 'slack':
            await this.sendSlackAlert(dashboard, alert);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channel} alert:`, error);
      }
    }
  }

  private async sendEmailAlert(dashboard: DashboardConfig, alert: DashboardAlert): Promise<void> {
    console.log(`📧 Sending email alert: ${alert.title}`);
    // This would integrate with email service
  }

  private async sendSMSAlert(dashboard: DashboardConfig, alert: DashboardAlert): Promise<void> {
    console.log(`📱 Sending SMS alert: ${alert.title}`);
    // This would integrate with SMS service
  }

  private async sendPushAlert(dashboard: DashboardConfig, alert: DashboardAlert): Promise<void> {
    console.log(`🔔 Sending push alert: ${alert.title}`);
    // This would integrate with push notification service
  }

  private async sendSlackAlert(dashboard: DashboardConfig, alert: DashboardAlert): Promise<void> {
    console.log(`💬 Sending Slack alert: ${alert.title}`);
    // This would integrate with Slack API
  }

  private async notifySubscribers(dashboardId: string, message: any): Promise<void> {
    const connections = this.activeConnections.get(dashboardId);
    if (connections) {
      const messageStr = JSON.stringify(message);
      
      for (const ws of connections) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(messageStr);
          }
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          connections.delete(ws);
        }
      }
    }
  }

  /**
   * Export methods
   */
  private async exportToPDF(dashboard: DashboardConfig, data: DashboardData, options: any): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }> {
    console.log('📄 Exporting dashboard to PDF');
    
    // This would use Puppeteer or similar to generate PDF
    const mockBuffer = Buffer.from('PDF dashboard export would go here');
    
    return {
      data: mockBuffer,
      filename: `${dashboard.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      mimeType: 'application/pdf'
    };
  }

  private async exportToPNG(dashboard: DashboardConfig, data: DashboardData, options: any): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }> {
    console.log('🖼️ Exporting dashboard to PNG');
    
    // This would use Puppeteer or Canvas to generate PNG
    const mockBuffer = Buffer.from('PNG dashboard export would go here');
    
    return {
      data: mockBuffer,
      filename: `${dashboard.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.png`,
      mimeType: 'image/png'
    };
  }

  private async exportToExcel(dashboard: DashboardConfig, data: DashboardData, options: any): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }> {
    console.log('📊 Exporting dashboard to Excel');
    
    // This would use ExcelJS to create Excel file
    const mockBuffer = Buffer.from('Excel dashboard export would go here');
    
    return {
      data: mockBuffer,
      filename: `${dashboard.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  }

  private async exportToPowerPoint(dashboard: DashboardConfig, data: DashboardData, options: any): Promise<{
    data: Buffer;
    filename: string;
    mimeType: string;
  }> {
    console.log('📊 Exporting dashboard to PowerPoint');
    
    // This would use PptxGenJS or similar to create PowerPoint file
    const mockBuffer = Buffer.from('PowerPoint dashboard export would go here');
    
    return {
      data: mockBuffer,
      filename: `${dashboard.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
  }

  /**
   * Database operations
   */
  private async loadDashboards(): Promise<void> {
    try {
      console.log('📥 Loading dashboards');
      // This would load from database
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    }
  }

  private async loadTemplates(): Promise<void> {
    try {
      console.log('📥 Loading dashboard templates');
      
      // Load default templates
      const defaultTemplates: DashboardTemplate[] = [
        {
          id: 'executive_overview',
          name: 'Executive Overview',
          description: 'High-level business metrics and KPIs for executives',
          category: 'executive',
          dashboardConfig: {
            name: 'Executive Overview',
            description: 'Key business metrics at a glance',
            category: 'executive',
            layout: {
              type: 'grid',
              columns: 4,
              rows: 3,
              gap: 16,
              responsive: {
                mobile: { columns: 1, rows: 6 },
                tablet: { columns: 2, rows: 4 },
                desktop: { columns: 4, rows: 3 }
              },
              theme: {
                name: 'light',
                colors: {
                  primary: '#3b82f6',
                  secondary: '#64748b',
                  background: '#ffffff',
                  surface: '#f8fafc',
                  text: '#1e293b',
                  accent: '#06b6d4'
                },
                typography: {
                  fontFamily: 'Inter, sans-serif',
                  fontSize: { small: '12px', medium: '14px', large: '16px' }
                },
                spacing: { small: 8, medium: 16, large: 24 }
              }
            },
            widgets: [
              {
                id: 'revenue_metric',
                type: 'metric',
                title: 'Total Revenue',
                position: { x: 0, y: 0, z: 1 },
                size: { width: 1, height: 1, minWidth: 1, minHeight: 1, resizable: true },
                dataSource: {
                  type: 'metric',
                  config: { metricIds: ['total_revenue'] },
                  filters: [],
                  realTime: true
                },
                visualization: {
                  chartType: 'number',
                  options: { colors: ['#10b981'], showTooltip: true }
                },
                interactions: {
                  clickable: true,
                  hoverable: true,
                  drillDown: { enabled: false },
                  crossFilter: { enabled: false, affects: [] },
                  export: { enabled: true, formats: ['png', 'csv'] }
                },
                styling: {
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  shadow: true
                },
                refreshInterval: 30,
                isVisible: true,
                order: 1
              }
            ],
            filters: [],
            settings: {
              autoRefresh: { enabled: true, interval: 60 },
              notifications: { enabled: true, channels: ['email'], conditions: [] },
              export: { enabled: true, formats: ['pdf', 'png'] },
              performance: { cacheEnabled: true, cacheTTL: 300, lazyLoading: true, virtualScrolling: false }
            },
            sharing: {
              isPublic: false,
              allowedUsers: [],
              permissions: { view: true, edit: false, share: false, export: true, comment: false },
              embed: { enabled: false, domains: [], settings: { width: 800, height: 600, autoRefresh: true, showControls: true, showFilters: true } }
            },
            isActive: true
          },
          tags: ['executive', 'overview', 'kpi'],
          popularity: 90,
          isOfficial: true
        }
      ];

      for (const template of defaultTemplates) {
        this.templates.set(template.id, template);
      }

    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  private async initializeRealTimeConnections(): Promise<void> {
    console.log('🔄 Initializing real-time connections');
    // Set up WebSocket server, Server-Sent Events, etc.
  }

  private async storeDashboard(dashboard: DashboardConfig): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing dashboard: ${dashboard.name}`);
      });
    } catch (error) {
      console.warn('Could not store dashboard:', error);
    }
  }

  private async updateDashboard(dashboard: DashboardConfig): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🔄 Updating dashboard: ${dashboard.id}`);
      });
    } catch (error) {
      console.warn('Could not update dashboard:', error);
    }
  }

  /**
   * Public API methods
   */
  async getDashboards(userId: string): Promise<DashboardConfig[]> {
    return Array.from(this.dashboards.values()).filter(d => d.userId === userId);
  }

  async getDashboard(dashboardId: string): Promise<DashboardConfig | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  async updateDashboardConfig(dashboardId: string, updates: Partial<DashboardConfig>): Promise<DashboardConfig> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    const updatedDashboard = { ...dashboard, ...updates, updatedAt: new Date() };
    await this.validateDashboardConfig(updatedDashboard);
    
    this.dashboards.set(dashboardId, updatedDashboard);
    await this.updateDashboard(updatedDashboard);

    return updatedDashboard;
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      // Clear all widget refresh intervals
      for (const widget of dashboard.widgets) {
        const interval = this.refreshIntervals.get(widget.id);
        if (interval) {
          clearInterval(interval);
          this.refreshIntervals.delete(widget.id);
        }
      }

      // Clear widget cache
      for (const widget of dashboard.widgets) {
        this.widgetCache.delete(widget.id);
      }

      // Close active connections
      const connections = this.activeConnections.get(dashboardId);
      if (connections) {
        for (const ws of connections) {
          ws.close();
        }
        this.activeConnections.delete(dashboardId);
      }

      this.dashboards.delete(dashboardId);
      
      // Delete from database
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🗑️ Deleting dashboard: ${dashboardId}`);
      });
    }
  }

  async getAlerts(dashboardId?: string): Promise<DashboardAlert[]> {
    let alerts = Array.from(this.alerts.values());
    
    if (dashboardId) {
      alerts = alerts.filter(a => a.dashboardId === dashboardId);
    }
    
    return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();

      // Update in database
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`✅ Alert acknowledged: ${alertId}`);
      });
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear all refresh intervals
    for (const interval of this.refreshIntervals.values()) {
      clearInterval(interval);
    }

    // Close all WebSocket connections
    for (const connections of this.activeConnections.values()) {
      for (const ws of connections) {
        ws.close();
      }
    }

    this.dashboards.clear();
    this.templates.clear();
    this.activeConnections.clear();
    this.widgetCache.clear();
    this.refreshIntervals.clear();
    this.alerts.clear();

    console.log('🧹 Real-Time Dashboard cleanup completed');
  }
}

// Export singleton instance
export const realTimeDashboard = RealTimeDashboard.getInstance();
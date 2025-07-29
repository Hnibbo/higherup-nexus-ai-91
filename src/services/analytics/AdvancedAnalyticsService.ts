import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsDashboard {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  sharing_settings: {
    is_public: boolean;
    shared_with: string[];
    access_level: 'view' | 'edit';
  };
  created_at: Date;
  updated_at: Date;
}

export interface DashboardLayout {
  grid_size: { columns: number; rows: number };
  responsive_breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'heatmap' | 'goal' | 'text' | 'image';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  data_source: {
    type: 'campaigns' | 'funnels' | 'contacts' | 'revenue' | 'custom';
    query: Record<string, any>;
    refresh_interval: number; // minutes
  };
  visualization: {
    chart_type?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge';
    colors: string[];
    options: Record<string, any>;
  };
  filters: WidgetFilter[];
  is_visible: boolean;
}

export interface WidgetFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between' | 'in';
  value: any;
  label: string;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date_range' | 'select' | 'multi_select' | 'text' | 'number';
  field: string;
  default_value: any;
  options?: Array<{ value: any; label: string }>;
  applies_to: string[]; // widget IDs
}

export interface CustomReport {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  report_type: 'performance' | 'attribution' | 'cohort' | 'funnel' | 'custom';
  data_sources: string[];
  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  schedule: {
    frequency: 'none' | 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
  };
  created_at: Date;
  updated_at: Date;
}

export interface ReportMetric {
  name: string;
  field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct';
  format: 'number' | 'currency' | 'percentage' | 'duration';
  goal?: number;
}

export interface ReportDimension {
  name: string;
  field: string;
  type: 'date' | 'string' | 'number' | 'boolean';
  grouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: any;
  condition: 'and' | 'or';
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  data: Record<string, any>;
  recommendations: string[];
  created_at: Date;
  is_read: boolean;
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;

  private constructor() {}

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  // Dashboard Management
  async createDashboard(dashboard: Omit<AnalyticsDashboard, 'id' | 'created_at' | 'updated_at'>): Promise<AnalyticsDashboard> {
    try {
      console.log(`📊 Creating analytics dashboard: ${dashboard.name}`);

      const { data, error } = await supabase
        .from('analytics_dashboards')
        .insert({
          user_id: dashboard.user_id,
          name: dashboard.name,
          description: dashboard.description,
          layout: dashboard.layout,
          widgets: dashboard.widgets,
          filters: dashboard.filters,
          sharing_settings: dashboard.sharing_settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Analytics dashboard created: ${dashboard.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create analytics dashboard:', error);
      throw error;
    }
  }

  async getDashboards(userId: string): Promise<AnalyticsDashboard[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_dashboards')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get analytics dashboards:', error);
      throw error;
    }
  }

  async updateDashboard(dashboardId: string, updates: Partial<AnalyticsDashboard>): Promise<AnalyticsDashboard> {
    try {
      const { data, error } = await supabase
        .from('analytics_dashboards')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dashboardId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Analytics dashboard updated: ${dashboardId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update analytics dashboard:', error);
      throw error;
    }
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_dashboards')
        .delete()
        .eq('id', dashboardId);

      if (error) throw error;

      console.log(`✅ Analytics dashboard deleted: ${dashboardId}`);

    } catch (error) {
      console.error('❌ Failed to delete analytics dashboard:', error);
      throw error;
    }
  }

  // Widget Data
  async getWidgetData(widget: DashboardWidget, filters?: Record<string, any>): Promise<{
    data: any[];
    metadata: {
      total_records: number;
      last_updated: Date;
      query_time: number;
    };
  }> {
    try {
      console.log(`📈 Getting widget data: ${widget.title}`);

      const startTime = Date.now();
      let data: any[] = [];

      // Generate data based on widget type and data source
      switch (widget.data_source.type) {
        case 'campaigns':
          data = await this.getCampaignData(widget, filters);
          break;
        case 'funnels':
          data = await this.getFunnelData(widget, filters);
          break;
        case 'contacts':
          data = await this.getContactData(widget, filters);
          break;
        case 'revenue':
          data = await this.getRevenueData(widget, filters);
          break;
        default:
          data = await this.getCustomData(widget, filters);
      }

      const queryTime = Date.now() - startTime;

      return {
        data,
        metadata: {
          total_records: data.length,
          last_updated: new Date(),
          query_time: queryTime
        }
      };

    } catch (error) {
      console.error('❌ Failed to get widget data:', error);
      throw error;
    }
  }

  private async getCampaignData(widget: DashboardWidget, filters?: Record<string, any>): Promise<any[]> {
    // Mock campaign data
    const campaigns = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      campaigns.push({
        date: date.toISOString().split('T')[0],
        campaigns_sent: Math.floor(Math.random() * 10) + 1,
        emails_sent: Math.floor(Math.random() * 5000) + 1000,
        open_rate: Math.random() * 30 + 15,
        click_rate: Math.random() * 8 + 2,
        conversion_rate: Math.random() * 5 + 1,
        revenue: Math.random() * 10000 + 2000
      });
    }

    return campaigns.reverse();
  }

  private async getFunnelData(widget: DashboardWidget, filters?: Record<string, any>): Promise<any[]> {
    // Mock funnel data
    return [
      { step: 'Landing Page', visitors: 1000, conversions: 650, conversion_rate: 65 },
      { step: 'Opt-in Form', visitors: 650, conversions: 420, conversion_rate: 64.6 },
      { step: 'Sales Page', visitors: 420, conversions: 210, conversion_rate: 50 },
      { step: 'Checkout', visitors: 210, conversions: 126, conversion_rate: 60 },
      { step: 'Thank You', visitors: 126, conversions: 126, conversion_rate: 100 }
    ];
  }

  private async getContactData(widget: DashboardWidget, filters?: Record<string, any>): Promise<any[]> {
    // Mock contact data
    const contacts = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      contacts.push({
        date: date.toISOString().split('T')[0],
        new_contacts: Math.floor(Math.random() * 50) + 10,
        total_contacts: 5000 + i * 30,
        active_contacts: Math.floor(Math.random() * 200) + 100,
        engagement_rate: Math.random() * 40 + 30
      });
    }

    return contacts.reverse();
  }

  private async getRevenueData(widget: DashboardWidget, filters?: Record<string, any>): Promise<any[]> {
    // Mock revenue data
    const revenue = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      revenue.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 5000 + 1000,
        orders: Math.floor(Math.random() * 20) + 5,
        average_order_value: Math.random() * 200 + 100,
        refunds: Math.random() * 200,
        net_revenue: Math.random() * 4800 + 800
      });
    }

    return revenue.reverse();
  }

  private async getCustomData(widget: DashboardWidget, filters?: Record<string, any>): Promise<any[]> {
    // Mock custom data
    return [
      { category: 'Category A', value: 150, percentage: 30 },
      { category: 'Category B', value: 200, percentage: 40 },
      { category: 'Category C', value: 100, percentage: 20 },
      { category: 'Category D', value: 50, percentage: 10 }
    ];
  }

  // Custom Reports
  async createCustomReport(report: Omit<CustomReport, 'id' | 'created_at' | 'updated_at'>): Promise<CustomReport> {
    try {
      console.log(`📋 Creating custom report: ${report.name}`);

      const { data, error } = await supabase
        .from('custom_reports')
        .insert({
          user_id: report.user_id,
          name: report.name,
          description: report.description,
          report_type: report.report_type,
          data_sources: report.data_sources,
          metrics: report.metrics,
          dimensions: report.dimensions,
          filters: report.filters,
          schedule: report.schedule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Custom report created: ${report.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create custom report:', error);
      throw error;
    }
  }

  async generateReport(reportId: string, dateRange?: { start: Date; end: Date }): Promise<{
    report_data: any[];
    summary: Record<string, any>;
    generated_at: Date;
  }> {
    try {
      console.log(`📊 Generating report: ${reportId}`);

      // Get report configuration
      const { data: report, error } = await supabase
        .from('custom_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;

      // Generate report data based on configuration
      const reportData = await this.executeReportQuery(report, dateRange);
      const summary = this.calculateReportSummary(reportData, report.metrics);

      // Store generated report
      await supabase
        .from('generated_reports')
        .insert({
          report_id: reportId,
          report_data: reportData,
          summary: summary,
          date_range: dateRange,
          generated_at: new Date().toISOString()
        });

      console.log(`✅ Report generated: ${reportId}`);
      return {
        report_data: reportData,
        summary: summary,
        generated_at: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  }

  private async executeReportQuery(report: CustomReport, dateRange?: { start: Date; end: Date }): Promise<any[]> {
    // Mock report data generation
    const data = [];
    const days = dateRange ? 
      Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) : 
      30;

    for (let i = 0; i < days; i++) {
      const date = dateRange ? 
        new Date(dateRange.start.getTime() + i * 24 * 60 * 60 * 1000) :
        new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000);

      const row: any = {
        date: date.toISOString().split('T')[0]
      };

      // Add metric values
      for (const metric of report.metrics) {
        switch (metric.name) {
          case 'revenue':
            row[metric.name] = Math.random() * 5000 + 1000;
            break;
          case 'conversions':
            row[metric.name] = Math.floor(Math.random() * 50) + 10;
            break;
          case 'visitors':
            row[metric.name] = Math.floor(Math.random() * 1000) + 200;
            break;
          default:
            row[metric.name] = Math.random() * 100;
        }
      }

      data.push(row);
    }

    return data;
  }

  private calculateReportSummary(data: any[], metrics: ReportMetric[]): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const metric of metrics) {
      const values = data.map(row => row[metric.name]).filter(v => v !== undefined);
      
      switch (metric.aggregation) {
        case 'sum':
          summary[metric.name] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          summary[metric.name] = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'count':
          summary[metric.name] = values.length;
          break;
        case 'min':
          summary[metric.name] = Math.min(...values);
          break;
        case 'max':
          summary[metric.name] = Math.max(...values);
          break;
        default:
          summary[metric.name] = values.reduce((sum, val) => sum + val, 0);
      }

      // Format based on metric format
      if (metric.format === 'currency') {
        summary[metric.name] = `$${summary[metric.name].toFixed(2)}`;
      } else if (metric.format === 'percentage') {
        summary[metric.name] = `${summary[metric.name].toFixed(2)}%`;
      } else if (metric.format === 'number') {
        summary[metric.name] = Math.round(summary[metric.name]);
      }
    }

    return summary;
  }  // 
Analytics Insights
  async generateInsights(userId: string): Promise<AnalyticsInsight[]> {
    try {
      console.log(`🔍 Generating analytics insights for user: ${userId}`);

      const insights: AnalyticsInsight[] = [];

      // Get recent performance data
      const performanceData = await this.getPerformanceData(userId);

      // Trend analysis
      const trendInsights = this.analyzeTrends(performanceData);
      insights.push(...trendInsights);

      // Anomaly detection
      const anomalyInsights = this.detectAnomalies(performanceData);
      insights.push(...anomalyInsights);

      // Opportunity identification
      const opportunityInsights = this.identifyOpportunities(performanceData);
      insights.push(...opportunityInsights);

      // Store insights
      for (const insight of insights) {
        await supabase
          .from('analytics_insights')
          .insert({
            id: insight.id,
            user_id: userId,
            type: insight.type,
            priority: insight.priority,
            title: insight.title,
            description: insight.description,
            data: insight.data,
            recommendations: insight.recommendations,
            is_read: false,
            created_at: insight.created_at.toISOString()
          });
      }

      console.log(`✅ Generated ${insights.length} analytics insights`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to generate analytics insights:', error);
      throw error;
    }
  }

  private async getPerformanceData(userId: string): Promise<any> {
    // Mock performance data
    return {
      revenue: {
        current: 45000,
        previous: 38000,
        trend: 'up'
      },
      conversions: {
        current: 250,
        previous: 220,
        trend: 'up'
      },
      traffic: {
        current: 12000,
        previous: 15000,
        trend: 'down'
      },
      engagement: {
        current: 65,
        previous: 62,
        trend: 'up'
      }
    };
  }

  private analyzeTrends(data: any): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // Revenue trend
    if (data.revenue.trend === 'up') {
      const growth = ((data.revenue.current - data.revenue.previous) / data.revenue.previous) * 100;
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'trend',
        priority: 'high',
        title: 'Revenue Growth Acceleration',
        description: `Revenue has increased by ${growth.toFixed(1)}% compared to the previous period, indicating strong business momentum.`,
        data: {
          current_revenue: data.revenue.current,
          previous_revenue: data.revenue.previous,
          growth_rate: growth
        },
        recommendations: [
          'Scale successful campaigns to maximize growth',
          'Analyze top-performing channels for expansion opportunities',
          'Consider increasing marketing budget for high-ROI activities'
        ],
        created_at: new Date(),
        is_read: false
      });
    }

    // Traffic trend
    if (data.traffic.trend === 'down') {
      const decline = ((data.traffic.previous - data.traffic.current) / data.traffic.previous) * 100;
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'alert',
        priority: 'medium',
        title: 'Traffic Decline Detected',
        description: `Website traffic has decreased by ${decline.toFixed(1)}% compared to the previous period.`,
        data: {
          current_traffic: data.traffic.current,
          previous_traffic: data.traffic.previous,
          decline_rate: decline
        },
        recommendations: [
          'Review and optimize SEO strategy',
          'Increase content marketing efforts',
          'Analyze traffic sources to identify declining channels',
          'Consider paid advertising to compensate for organic decline'
        ],
        created_at: new Date(),
        is_read: false
      });
    }

    return insights;
  }

  private detectAnomalies(data: any): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // Conversion rate anomaly
    const conversionRate = (data.conversions.current / data.traffic.current) * 100;
    const previousConversionRate = (data.conversions.previous / data.traffic.previous) * 100;

    if (conversionRate > previousConversionRate * 1.5) {
      insights.push({
        id: `insight_${Date.now()}_3`,
        type: 'anomaly',
        priority: 'high',
        title: 'Unusual Conversion Rate Spike',
        description: `Conversion rate has increased significantly to ${conversionRate.toFixed(2)}%, which is unusually high.`,
        data: {
          current_conversion_rate: conversionRate,
          previous_conversion_rate: previousConversionRate,
          spike_factor: conversionRate / previousConversionRate
        },
        recommendations: [
          'Investigate what caused the spike to replicate success',
          'Monitor for data accuracy and potential tracking issues',
          'Document successful strategies for future campaigns'
        ],
        created_at: new Date(),
        is_read: false
      });
    }

    return insights;
  }

  private identifyOpportunities(data: any): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = [];

    // High engagement, low conversion opportunity
    if (data.engagement.current > 60 && (data.conversions.current / data.traffic.current) < 0.05) {
      insights.push({
        id: `insight_${Date.now()}_4`,
        type: 'opportunity',
        priority: 'medium',
        title: 'High Engagement, Low Conversion Opportunity',
        description: 'Users are highly engaged but conversion rates are low, indicating optimization potential.',
        data: {
          engagement_rate: data.engagement.current,
          conversion_rate: (data.conversions.current / data.traffic.current) * 100
        },
        recommendations: [
          'Optimize call-to-action placement and messaging',
          'Simplify conversion process and reduce friction',
          'A/B test different offers and value propositions',
          'Implement exit-intent popups to capture leaving visitors'
        ],
        created_at: new Date(),
        is_read: false
      });
    }

    return insights;
  }

  // Real-time Analytics
  async getRealTimeMetrics(userId: string): Promise<{
    current_visitors: number;
    page_views_last_hour: number;
    conversions_today: number;
    revenue_today: number;
    top_pages: Array<{ page: string; views: number }>;
    traffic_sources: Array<{ source: string; visitors: number; percentage: number }>;
    device_breakdown: { desktop: number; mobile: number; tablet: number };
    geo_data: Array<{ country: string; visitors: number }>;
    recent_events: Array<{
      timestamp: Date;
      event_type: string;
      description: string;
      value?: number;
    }>;
  }> {
    try {
      console.log(`⚡ Getting real-time metrics for user: ${userId}`);

      // Mock real-time data
      const metrics = {
        current_visitors: Math.floor(Math.random() * 100) + 20,
        page_views_last_hour: Math.floor(Math.random() * 500) + 100,
        conversions_today: Math.floor(Math.random() * 50) + 10,
        revenue_today: Math.random() * 10000 + 2000,
        top_pages: [
          { page: '/landing-page', views: 245 },
          { page: '/product-page', views: 189 },
          { page: '/pricing', views: 156 },
          { page: '/about', views: 134 },
          { page: '/contact', views: 98 }
        ],
        traffic_sources: [
          { source: 'Google', visitors: 45, percentage: 35 },
          { source: 'Direct', visitors: 32, percentage: 25 },
          { source: 'Facebook', visitors: 28, percentage: 22 },
          { source: 'Twitter', visitors: 15, percentage: 12 },
          { source: 'LinkedIn', visitors: 8, percentage: 6 }
        ],
        device_breakdown: {
          desktop: 60,
          mobile: 35,
          tablet: 5
        },
        geo_data: [
          { country: 'United States', visitors: 45 },
          { country: 'United Kingdom', visitors: 18 },
          { country: 'Canada', visitors: 12 },
          { country: 'Germany', visitors: 8 },
          { country: 'Australia', visitors: 6 }
        ],
        recent_events: [
          {
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            event_type: 'conversion',
            description: 'New purchase completed',
            value: 97
          },
          {
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            event_type: 'signup',
            description: 'New user registration'
          },
          {
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
            event_type: 'high_value_visitor',
            description: 'Visitor from premium segment'
          }
        ]
      };

      return metrics;

    } catch (error) {
      console.error('❌ Failed to get real-time metrics:', error);
      throw error;
    }
  }

  // Goal Tracking
  async createGoal(goal: {
    user_id: string;
    name: string;
    description?: string;
    type: 'revenue' | 'conversions' | 'traffic' | 'engagement' | 'custom';
    target_value: number;
    target_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    start_date: Date;
    end_date: Date;
    tracking_config: Record<string, any>;
  }): Promise<{
    goal_id: string;
    success: boolean;
  }> {
    try {
      console.log(`🎯 Creating goal: ${goal.name}`);

      const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('analytics_goals')
        .insert({
          id: goalId,
          user_id: goal.user_id,
          name: goal.name,
          description: goal.description,
          type: goal.type,
          target_value: goal.target_value,
          target_period: goal.target_period,
          start_date: goal.start_date.toISOString(),
          end_date: goal.end_date.toISOString(),
          tracking_config: goal.tracking_config,
          current_value: 0,
          progress_percentage: 0,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Goal created: ${goal.name}`);
      return {
        goal_id: goalId,
        success: true
      };

    } catch (error) {
      console.error('❌ Failed to create goal:', error);
      return {
        goal_id: '',
        success: false
      };
    }
  }

  async getGoalProgress(goalId: string): Promise<{
    goal: any;
    progress: {
      current_value: number;
      target_value: number;
      percentage: number;
      days_remaining: number;
      on_track: boolean;
      projected_value: number;
    };
    timeline: Array<{
      date: string;
      value: number;
      cumulative: number;
    }>;
  }> {
    try {
      const { data: goal, error } = await supabase
        .from('analytics_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (error) throw error;

      // Calculate progress
      const currentValue = Math.random() * goal.target_value * 0.8; // Mock current value
      const percentage = (currentValue / goal.target_value) * 100;
      const startDate = new Date(goal.start_date);
      const endDate = new Date(goal.end_date);
      const now = new Date();
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - elapsedDays);
      const expectedProgress = (elapsedDays / totalDays) * 100;
      const onTrack = percentage >= expectedProgress * 0.9; // Within 10% of expected
      const projectedValue = totalDays > 0 ? (currentValue / elapsedDays) * totalDays : currentValue;

      // Generate timeline data
      const timeline = [];
      for (let i = 0; i <= elapsedDays && i <= 30; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dailyValue = Math.random() * (goal.target_value / totalDays) * 2;
        const cumulative = timeline.length > 0 ? timeline[timeline.length - 1].cumulative + dailyValue : dailyValue;
        
        timeline.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(dailyValue),
          cumulative: Math.round(cumulative)
        });
      }

      return {
        goal,
        progress: {
          current_value: Math.round(currentValue),
          target_value: goal.target_value,
          percentage: Math.round(percentage * 100) / 100,
          days_remaining: daysRemaining,
          on_track: onTrack,
          projected_value: Math.round(projectedValue)
        },
        timeline
      };

    } catch (error) {
      console.error('❌ Failed to get goal progress:', error);
      throw error;
    }
  }

  // Data Export
  async exportData(userId: string, exportConfig: {
    data_type: 'dashboard' | 'report' | 'raw_data';
    format: 'csv' | 'excel' | 'json' | 'pdf';
    date_range?: { start: Date; end: Date };
    filters?: Record<string, any>;
    include_charts?: boolean;
  }): Promise<{
    download_url: string;
    file_size: number;
    expires_at: Date;
  }> {
    try {
      console.log(`📤 Exporting data for user: ${userId}`);

      // Mock export process
      const fileName = `export_${Date.now()}.${exportConfig.format}`;
      const fileSize = Math.floor(Math.random() * 5000000) + 100000; // 100KB - 5MB
      const downloadUrl = `/api/exports/${fileName}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store export record
      await supabase
        .from('data_exports')
        .insert({
          user_id: userId,
          file_name: fileName,
          data_type: exportConfig.data_type,
          format: exportConfig.format,
          file_size: fileSize,
          download_url: downloadUrl,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        });

      console.log(`✅ Data export created: ${fileName}`);
      return {
        download_url: downloadUrl,
        file_size: fileSize,
        expires_at: expiresAt
      };

    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw error;
    }
  }

  // Scheduled Reports
  async scheduleReport(reportId: string, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM format
    timezone: string;
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    is_active: boolean;
  }): Promise<{
    schedule_id: string;
    success: boolean;
  }> {
    try {
      console.log(`📅 Scheduling report: ${reportId}`);

      const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from('report_schedules')
        .insert({
          id: scheduleId,
          report_id: reportId,
          frequency: schedule.frequency,
          time: schedule.time,
          timezone: schedule.timezone,
          recipients: schedule.recipients,
          format: schedule.format,
          is_active: schedule.is_active,
          next_run: this.calculateNextRun(schedule.frequency, schedule.time, schedule.timezone),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log(`✅ Report scheduled: ${reportId}`);
      return {
        schedule_id: scheduleId,
        success: true
      };

    } catch (error) {
      console.error('❌ Failed to schedule report:', error);
      return {
        schedule_id: '',
        success: false
      };
    }
  }

  private calculateNextRun(frequency: string, time: string, timezone: string): string {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    let nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    // If time has passed today, move to next occurrence
    if (nextRun <= now) {
      switch (frequency) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          break;
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          break;
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          break;
      }
    }

    return nextRun.toISOString();
  }
}

// Export singleton instance
export const advancedAnalyticsService = AdvancedAnalyticsService.getInstance();
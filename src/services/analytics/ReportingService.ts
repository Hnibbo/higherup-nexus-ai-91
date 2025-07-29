import { supabase } from '@/integrations/supabase/client';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'sales' | 'finance' | 'operations' | 'custom';
  template_config: {
    sections: ReportSection[];
    styling: ReportStyling;
    default_filters: Record<string, any>;
  };
  is_public: boolean;
  created_by: string;
  created_at: Date;
}

export interface ReportSection {
  id: string;
  type: 'header' | 'summary' | 'chart' | 'table' | 'text' | 'kpi' | 'comparison';
  title: string;
  content: Record<string, any>;
  position: { order: number; page?: number };
  styling: Record<string, any>;
}

export interface ReportStyling {
  theme: 'light' | 'dark' | 'corporate' | 'modern';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
    size_scale: number;
  };
  layout: {
    page_size: 'A4' | 'Letter' | 'A3';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
  };
  branding: {
    logo_url?: string;
    company_name?: string;
    show_watermark: boolean;
  };
}

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_id: string;
  name: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    day_of_week?: number; // 0-6 for weekly
    day_of_month?: number; // 1-31 for monthly
    time: string; // HH:MM
    timezone: string;
  };
  recipients: Array<{
    email: string;
    name?: string;
    role?: string;
  }>;
  delivery_options: {
    format: 'pdf' | 'excel' | 'csv' | 'html';
    include_raw_data: boolean;
    password_protect: boolean;
    embed_charts: boolean;
  };
  filters: Record<string, any>;
  is_active: boolean;
  last_sent?: Date;
  next_send: Date;
  created_at: Date;
}

export interface ReportDelivery {
  id: string;
  scheduled_report_id: string;
  status: 'pending' | 'generating' | 'sent' | 'failed';
  generated_at?: Date;
  sent_at?: Date;
  file_url?: string;
  file_size?: number;
  recipients_sent: string[];
  error_message?: string;
  delivery_stats: {
    generation_time: number;
    file_size: number;
    email_delivery_time: number;
  };
}

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  // Report Templates
  async createReportTemplate(template: Omit<ReportTemplate, 'id' | 'created_at'>): Promise<ReportTemplate> {
    try {
      console.log(`📋 Creating report template: ${template.name}`);

      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          template_config: template.template_config,
          is_public: template.is_public,
          created_by: template.created_by,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Report template created: ${template.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create report template:', error);
      throw error;
    }
  }

  async getReportTemplates(category?: string, isPublic?: boolean): Promise<ReportTemplate[]> {
    try {
      let query = supabase
        .from('report_templates')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      if (isPublic !== undefined) {
        query = query.eq('is_public', isPublic);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get report templates:', error);
      throw error;
    }
  }

  // Report Generation
  async generateReport(reportConfig: {
    template_id?: string;
    user_id: string;
    title: string;
    date_range: { start: Date; end: Date };
    filters?: Record<string, any>;
    sections?: ReportSection[];
    styling?: Partial<ReportStyling>;
    format: 'pdf' | 'excel' | 'html' | 'csv';
  }): Promise<{
    report_id: string;
    file_url: string;
    file_size: number;
    generation_time: number;
  }> {
    try {
      console.log(`📊 Generating report: ${reportConfig.title}`);

      const startTime = Date.now();
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get template if specified
      let template: ReportTemplate | null = null;
      if (reportConfig.template_id) {
        const { data } = await supabase
          .from('report_templates')
          .select('*')
          .eq('id', reportConfig.template_id)
          .single();
        template = data;
      }

      // Collect data for report sections
      const reportData = await this.collectReportData(reportConfig, template);

      // Generate report file
      const fileResult = await this.generateReportFile(reportConfig, reportData, template);

      const generationTime = Date.now() - startTime;

      // Store report record
      await supabase
        .from('generated_reports')
        .insert({
          id: reportId,
          user_id: reportConfig.user_id,
          title: reportConfig.title,
          template_id: reportConfig.template_id,
          date_range: reportConfig.date_range,
          filters: reportConfig.filters || {},
          format: reportConfig.format,
          file_url: fileResult.file_url,
          file_size: fileResult.file_size,
          generation_time: generationTime,
          status: 'completed',
          generated_at: new Date().toISOString()
        });

      console.log(`✅ Report generated: ${reportConfig.title} (${generationTime}ms)`);
      return {
        report_id: reportId,
        file_url: fileResult.file_url,
        file_size: fileResult.file_size,
        generation_time: generationTime
      };

    } catch (error) {
      console.error('❌ Failed to generate report:', error);
      throw error;
    }
  }

  private async collectReportData(reportConfig: any, template: ReportTemplate | null): Promise<any> {
    const data: any = {
      metadata: {
        title: reportConfig.title,
        generated_at: new Date(),
        date_range: reportConfig.date_range,
        filters: reportConfig.filters || {}
      },
      sections: {}
    };

    const sections = reportConfig.sections || template?.template_config.sections || [];

    for (const section of sections) {
      try {
        switch (section.type) {
          case 'summary':
            data.sections[section.id] = await this.getSummaryData(reportConfig);
            break;
          case 'chart':
            data.sections[section.id] = await this.getChartData(section, reportConfig);
            break;
          case 'table':
            data.sections[section.id] = await this.getTableData(section, reportConfig);
            break;
          case 'kpi':
            data.sections[section.id] = await this.getKPIData(section, reportConfig);
            break;
          case 'comparison':
            data.sections[section.id] = await this.getComparisonData(section, reportConfig);
            break;
          default:
            data.sections[section.id] = section.content;
        }
      } catch (error) {
        console.error(`Failed to collect data for section ${section.id}:`, error);
        data.sections[section.id] = { error: 'Data collection failed' };
      }
    }

    return data;
  }

  private async getSummaryData(reportConfig: any): Promise<any> {
    // Mock summary data
    return {
      total_revenue: Math.random() * 100000 + 50000,
      total_conversions: Math.floor(Math.random() * 1000) + 500,
      total_visitors: Math.floor(Math.random() * 10000) + 5000,
      conversion_rate: Math.random() * 10 + 5,
      average_order_value: Math.random() * 200 + 100,
      growth_metrics: {
        revenue_growth: Math.random() * 30 + 10,
        conversion_growth: Math.random() * 20 + 5,
        traffic_growth: Math.random() * 25 + 8
      }
    };
  }

  private async getChartData(section: ReportSection, reportConfig: any): Promise<any> {
    // Mock chart data based on chart type
    const chartType = section.content.chart_type || 'line';
    const dataPoints = 30;
    const data = [];

    for (let i = 0; i < dataPoints; i++) {
      const date = new Date(reportConfig.date_range.start);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.random() * 1000 + 100,
        secondary_value: Math.random() * 500 + 50
      });
    }

    return {
      chart_type: chartType,
      data: data,
      labels: data.map(d => d.date),
      datasets: [
        {
          label: section.content.primary_metric || 'Primary Metric',
          data: data.map(d => d.value),
          color: '#3b82f6'
        },
        {
          label: section.content.secondary_metric || 'Secondary Metric',
          data: data.map(d => d.secondary_value),
          color: '#ef4444'
        }
      ]
    };
  }

  private async getTableData(section: ReportSection, reportConfig: any): Promise<any> {
    // Mock table data
    const rows = [];
    const rowCount = section.content.max_rows || 20;

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.random() * 1000 + 100,
        percentage: Math.random() * 100,
        status: Math.random() > 0.5 ? 'Active' : 'Inactive',
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }

    return {
      columns: [
        { key: 'name', label: 'Name', type: 'string' },
        { key: 'value', label: 'Value', type: 'currency' },
        { key: 'percentage', label: 'Percentage', type: 'percentage' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'date', label: 'Date', type: 'date' }
      ],
      rows: rows,
      total_rows: rowCount,
      summary: {
        total_value: rows.reduce((sum, row) => sum + row.value, 0),
        average_percentage: rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length
      }
    };
  }

  private async getKPIData(section: ReportSection, reportConfig: any): Promise<any> {
    // Mock KPI data
    return {
      kpis: [
        {
          name: 'Revenue',
          value: Math.random() * 100000 + 50000,
          format: 'currency',
          change: Math.random() * 30 - 10,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          target: 75000,
          status: 'on_track'
        },
        {
          name: 'Conversions',
          value: Math.floor(Math.random() * 1000) + 500,
          format: 'number',
          change: Math.random() * 20 - 5,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          target: 800,
          status: 'above_target'
        },
        {
          name: 'Conversion Rate',
          value: Math.random() * 10 + 5,
          format: 'percentage',
          change: Math.random() * 5 - 2,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          target: 8,
          status: 'below_target'
        }
      ]
    };
  }

  private async getComparisonData(section: ReportSection, reportConfig: any): Promise<any> {
    // Mock comparison data
    return {
      periods: [
        {
          name: 'Current Period',
          start_date: reportConfig.date_range.start,
          end_date: reportConfig.date_range.end,
          metrics: {
            revenue: Math.random() * 50000 + 25000,
            conversions: Math.floor(Math.random() * 500) + 250,
            visitors: Math.floor(Math.random() * 5000) + 2500
          }
        },
        {
          name: 'Previous Period',
          start_date: new Date(reportConfig.date_range.start.getTime() - 30 * 24 * 60 * 60 * 1000),
          end_date: new Date(reportConfig.date_range.end.getTime() - 30 * 24 * 60 * 60 * 1000),
          metrics: {
            revenue: Math.random() * 45000 + 20000,
            conversions: Math.floor(Math.random() * 450) + 200,
            visitors: Math.floor(Math.random() * 4500) + 2000
          }
        }
      ],
      changes: {
        revenue: Math.random() * 30 - 10,
        conversions: Math.random() * 25 - 8,
        visitors: Math.random() * 20 - 5
      }
    };
  }

  private async generateReportFile(reportConfig: any, reportData: any, template: ReportTemplate | null): Promise<{
    file_url: string;
    file_size: number;
  }> {
    // Mock file generation
    const fileName = `report_${Date.now()}.${reportConfig.format}`;
    const fileSize = Math.floor(Math.random() * 5000000) + 500000; // 500KB - 5MB
    const fileUrl = `/api/reports/${fileName}`;

    // In reality, would generate actual file based on format
    switch (reportConfig.format) {
      case 'pdf':
        // Generate PDF using library like puppeteer or jsPDF
        break;
      case 'excel':
        // Generate Excel using library like exceljs
        break;
      case 'html':
        // Generate HTML report
        break;
      case 'csv':
        // Generate CSV data
        break;
    }

    return {
      file_url: fileUrl,
      file_size: fileSize
    };
  }

  // Scheduled Reports
  async createScheduledReport(scheduledReport: Omit<ScheduledReport, 'id' | 'created_at' | 'next_send'>): Promise<ScheduledReport> {
    try {
      console.log(`📅 Creating scheduled report: ${scheduledReport.name}`);

      const nextSend = this.calculateNextSendTime(scheduledReport.schedule);

      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          user_id: scheduledReport.user_id,
          report_id: scheduledReport.report_id,
          name: scheduledReport.name,
          schedule: scheduledReport.schedule,
          recipients: scheduledReport.recipients,
          delivery_options: scheduledReport.delivery_options,
          filters: scheduledReport.filters,
          is_active: scheduledReport.is_active,
          next_send: nextSend.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Scheduled report created: ${scheduledReport.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create scheduled report:', error);
      throw error;
    }
  }

  private calculateNextSendTime(schedule: ScheduledReport['schedule']): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextSend = new Date(now);
    nextSend.setHours(hours, minutes, 0, 0);

    // If time has passed today, calculate next occurrence
    if (nextSend <= now) {
      switch (schedule.frequency) {
        case 'daily':
          nextSend.setDate(nextSend.getDate() + 1);
          break;
        case 'weekly':
          const daysUntilTarget = (schedule.day_of_week! - nextSend.getDay() + 7) % 7;
          nextSend.setDate(nextSend.getDate() + (daysUntilTarget || 7));
          break;
        case 'monthly':
          if (schedule.day_of_month) {
            nextSend.setMonth(nextSend.getMonth() + 1);
            nextSend.setDate(Math.min(schedule.day_of_month, new Date(nextSend.getFullYear(), nextSend.getMonth() + 1, 0).getDate()));
          }
          break;
        case 'quarterly':
          nextSend.setMonth(nextSend.getMonth() + 3);
          break;
      }
    }

    return nextSend;
  }

  async getScheduledReports(userId: string): Promise<ScheduledReport[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get scheduled reports:', error);
      throw error;
    }
  }

  async processScheduledReports(): Promise<void> {
    try {
      console.log('🔄 Processing scheduled reports...');

      // Get reports due for sending
      const { data: dueReports, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('is_active', true)
        .lte('next_send', new Date().toISOString());

      if (error) throw error;

      for (const scheduledReport of dueReports || []) {
        try {
          await this.sendScheduledReport(scheduledReport);
        } catch (error) {
          console.error(`Failed to send scheduled report ${scheduledReport.id}:`, error);
        }
      }

      console.log(`✅ Processed ${dueReports?.length || 0} scheduled reports`);

    } catch (error) {
      console.error('❌ Failed to process scheduled reports:', error);
    }
  }

  private async sendScheduledReport(scheduledReport: ScheduledReport): Promise<void> {
    try {
      console.log(`📤 Sending scheduled report: ${scheduledReport.name}`);

      const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create delivery record
      await supabase
        .from('report_deliveries')
        .insert({
          id: deliveryId,
          scheduled_report_id: scheduledReport.id,
          status: 'generating',
          generated_at: new Date().toISOString()
        });

      // Generate report
      const reportResult = await this.generateReport({
        user_id: scheduledReport.user_id,
        title: scheduledReport.name,
        date_range: this.getDateRangeForSchedule(scheduledReport.schedule),
        filters: scheduledReport.filters,
        format: scheduledReport.delivery_options.format
      });

      // Send to recipients
      const emailResults = await this.sendReportEmails(
        scheduledReport.recipients,
        scheduledReport.name,
        reportResult.file_url,
        scheduledReport.delivery_options
      );

      // Update delivery record
      await supabase
        .from('report_deliveries')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          file_url: reportResult.file_url,
          file_size: reportResult.file_size,
          recipients_sent: emailResults.successful_recipients,
          delivery_stats: {
            generation_time: reportResult.generation_time,
            file_size: reportResult.file_size,
            email_delivery_time: emailResults.delivery_time
          }
        })
        .eq('id', deliveryId);

      // Update next send time
      const nextSend = this.calculateNextSendTime(scheduledReport.schedule);
      await supabase
        .from('scheduled_reports')
        .update({
          last_sent: new Date().toISOString(),
          next_send: nextSend.toISOString()
        })
        .eq('id', scheduledReport.id);

      console.log(`✅ Scheduled report sent: ${scheduledReport.name}`);

    } catch (error) {
      console.error(`❌ Failed to send scheduled report: ${scheduledReport.name}`, error);

      // Update delivery record with error
      await supabase
        .from('report_deliveries')
        .update({
          status: 'failed',
          error_message: error.toString()
        })
        .eq('scheduled_report_id', scheduledReport.id)
        .eq('status', 'generating');
    }
  }

  private getDateRangeForSchedule(schedule: ScheduledReport['schedule']): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end = new Date(now);

    switch (schedule.frequency) {
      case 'daily':
        start = new Date(now);
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarterly':
        start = new Date(now);
        start.setMonth(start.getMonth() - 3);
        break;
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  private async sendReportEmails(
    recipients: ScheduledReport['recipients'],
    reportName: string,
    fileUrl: string,
    deliveryOptions: ScheduledReport['delivery_options']
  ): Promise<{
    successful_recipients: string[];
    failed_recipients: string[];
    delivery_time: number;
  }> {
    const startTime = Date.now();
    const successfulRecipients: string[] = [];
    const failedRecipients: string[] = [];

    // Mock email sending
    for (const recipient of recipients) {
      try {
        // In reality, would use email service like SendGrid, AWS SES, etc.
        console.log(`📧 Sending report to ${recipient.email}`);
        
        // Mock success/failure
        if (Math.random() > 0.1) { // 90% success rate
          successfulRecipients.push(recipient.email);
        } else {
          failedRecipients.push(recipient.email);
        }
      } catch (error) {
        failedRecipients.push(recipient.email);
      }
    }

    const deliveryTime = Date.now() - startTime;

    return {
      successful_recipients: successfulRecipients,
      failed_recipients: failedRecipients,
      delivery_time: deliveryTime
    };
  }

  // Report Analytics
  async getReportAnalytics(userId: string, timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    total_reports_generated: number;
    scheduled_reports_active: number;
    most_popular_templates: Array<{ template_name: string; usage_count: number }>;
    delivery_success_rate: number;
    average_generation_time: number;
    format_breakdown: Record<string, number>;
    recipient_engagement: {
      total_recipients: number;
      unique_recipients: number;
      average_recipients_per_report: number;
    };
  }> {
    try {
      console.log(`📈 Getting report analytics for user: ${userId}`);

      // Mock analytics data
      const analytics = {
        total_reports_generated: Math.floor(Math.random() * 100) + 50,
        scheduled_reports_active: Math.floor(Math.random() * 20) + 5,
        most_popular_templates: [
          { template_name: 'Marketing Performance', usage_count: 25 },
          { template_name: 'Sales Summary', usage_count: 18 },
          { template_name: 'Financial Overview', usage_count: 12 },
          { template_name: 'Custom Analytics', usage_count: 8 }
        ],
        delivery_success_rate: Math.random() * 10 + 90,
        average_generation_time: Math.random() * 5000 + 2000,
        format_breakdown: {
          pdf: 45,
          excel: 30,
          html: 15,
          csv: 10
        },
        recipient_engagement: {
          total_recipients: Math.floor(Math.random() * 500) + 100,
          unique_recipients: Math.floor(Math.random() * 200) + 50,
          average_recipients_per_report: Math.random() * 5 + 2
        }
      };

      return analytics;

    } catch (error) {
      console.error('❌ Failed to get report analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reportingService = ReportingService.getInstance();
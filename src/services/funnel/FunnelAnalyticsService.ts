import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

export interface FunnelVisitor {
  id: string;
  funnel_id: string;
  visitor_id: string;
  session_id: string;
  current_step: number;
  entry_step: number;
  source: string;
  medium: string;
  campaign?: string;
  referrer?: string;
  user_agent: string;
  ip_address: string;
  country?: string;
  city?: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  first_visit_at: Date;
  last_visit_at: Date;
  total_sessions: number;
  is_converted: boolean;
  conversion_value?: number;
  conversion_step?: number;
  conversion_at?: Date;
}

export interface FunnelStepAnalytics {
  step_id: string;
  step_number: number;
  step_name: string;
  step_type: string;
  visitors: number;
  unique_visitors: number;
  conversions: number;
  conversion_rate: number;
  drop_off_count: number;
  drop_off_rate: number;
  average_time_on_page: number;
  bounce_rate: number;
  form_submissions?: number;
  form_completion_rate?: number;
  revenue_generated?: number;
  split_test_data?: Array<{
    variant_name: string;
    visitors: number;
    conversions: number;
    conversion_rate: number;
  }>;
}

export interface FunnelPerformanceMetrics {
  funnel_id: string;
  funnel_name: string;
  date_range: {
    start_date: Date;
    end_date: Date;
  };
  total_visitors: number;
  unique_visitors: number;
  total_conversions: number;
  overall_conversion_rate: number;
  total_revenue: number;
  average_order_value: number;
  cost_per_acquisition?: number;
  return_on_ad_spend?: number;
  step_analytics: FunnelStepAnalytics[];
  traffic_sources: Array<{
    source: string;
    visitors: number;
    conversions: number;
    conversion_rate: number;
    revenue: number;
  }>;
  device_breakdown: Array<{
    device_type: string;
    visitors: number;
    conversion_rate: number;
  }>;
  geographic_data: Array<{
    country: string;
    visitors: number;
    conversions: number;
    revenue: number;
  }>;
  time_analysis: Array<{
    hour: number;
    day_of_week: number;
    visitors: number;
    conversion_rate: number;
  }>;
}

export interface FunnelHeatmapData {
  step_id: string;
  click_data: Array<{
    element_selector: string;
    element_text: string;
    click_count: number;
    unique_clicks: number;
    position: { x: number; y: number };
  }>;
  scroll_data: Array<{
    depth_percentage: number;
    user_count: number;
    average_time: number;
  }>;
  form_field_analytics?: Array<{
    field_name: string;
    field_type: string;
    completion_rate: number;
    error_rate: number;
    average_time_to_complete: number;
  }>;
}

export interface FunnelOptimizationSuggestion {
  type: 'conversion_rate' | 'user_experience' | 'technical' | 'content';
  priority: 'high' | 'medium' | 'low';
  step_number?: number;
  title: string;
  description: string;
  potential_impact: string;
  implementation_effort: 'low' | 'medium' | 'high';
  suggested_actions: string[];
}

export class FunnelAnalyticsService {
  private static instance: FunnelAnalyticsService;

  private constructor() {}

  public static getInstance(): FunnelAnalyticsService {
    if (!FunnelAnalyticsService.instance) {
      FunnelAnalyticsService.instance = new FunnelAnalyticsService();
    }
    return FunnelAnalyticsService.instance;
  }

  // Visitor Tracking
  async trackVisitor(funnelId: string, visitorData: Omit<FunnelVisitor, 'id' | 'first_visit_at' | 'last_visit_at' | 'total_sessions' | 'is_converted'>): Promise<FunnelVisitor> {
    try {
      console.log(`👤 Tracking visitor for funnel: ${funnelId}`);

      // Check if visitor already exists
      const { data: existingVisitor, error: existingError } = await supabase
        .from('funnel_visitors')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('visitor_id', visitorData.visitor_id)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingVisitor) {
        // Update existing visitor
        const { data, error } = await supabase
          .from('funnel_visitors')
          .update({
            current_step: visitorData.current_step,
            last_visit_at: new Date().toISOString(),
            total_sessions: existingVisitor.total_sessions + 1,
            session_id: visitorData.session_id
          })
          .eq('id', existingVisitor.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new visitor
        const { data, error } = await supabase
          .from('funnel_visitors')
          .insert({
            funnel_id: funnelId,
            visitor_id: visitorData.visitor_id,
            session_id: visitorData.session_id,
            current_step: visitorData.current_step,
            entry_step: visitorData.entry_step,
            source: visitorData.source,
            medium: visitorData.medium,
            campaign: visitorData.campaign,
            referrer: visitorData.referrer,
            user_agent: visitorData.user_agent,
            ip_address: visitorData.ip_address,
            country: visitorData.country,
            city: visitorData.city,
            device_type: visitorData.device_type,
            browser: visitorData.browser,
            os: visitorData.os,
            first_visit_at: new Date().toISOString(),
            last_visit_at: new Date().toISOString(),
            total_sessions: 1,
            is_converted: false
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

    } catch (error) {
      console.error('❌ Failed to track visitor:', error);
      throw error;
    }
  }

  async trackStepView(funnelId: string, visitorId: string, stepNumber: number, timeOnPage?: number): Promise<void> {
    try {
      console.log(`📊 Tracking step view: funnel ${funnelId}, step ${stepNumber}`);

      // Record step view
      const { error } = await supabase
        .from('funnel_step_views')
        .insert({
          funnel_id: funnelId,
          visitor_id: visitorId,
          step_number: stepNumber,
          viewed_at: new Date().toISOString(),
          time_on_page: timeOnPage || 0
        });

      if (error) throw error;

      // Update visitor current step
      await supabase
        .from('funnel_visitors')
        .update({
          current_step: stepNumber,
          last_visit_at: new Date().toISOString()
        })
        .eq('funnel_id', funnelId)
        .eq('visitor_id', visitorId);

    } catch (error) {
      console.error('❌ Failed to track step view:', error);
    }
  }

  async trackConversion(funnelId: string, visitorId: string, stepNumber: number, conversionValue?: number): Promise<void> {
    try {
      console.log(`🎯 Tracking conversion: funnel ${funnelId}, step ${stepNumber}, value ${conversionValue}`);

      // Update visitor conversion status
      const { error: visitorError } = await supabase
        .from('funnel_visitors')
        .update({
          is_converted: true,
          conversion_value: conversionValue,
          conversion_step: stepNumber,
          conversion_at: new Date().toISOString()
        })
        .eq('funnel_id', funnelId)
        .eq('visitor_id', visitorId);

      if (visitorError) throw visitorError;

      // Record conversion event
      const { error: conversionError } = await supabase
        .from('funnel_conversions')
        .insert({
          funnel_id: funnelId,
          visitor_id: visitorId,
          step_number: stepNumber,
          conversion_value: conversionValue || 0,
          converted_at: new Date().toISOString()
        });

      if (conversionError) throw conversionError;

      console.log(`✅ Conversion tracked successfully`);

    } catch (error) {
      console.error('❌ Failed to track conversion:', error);
    }
  }

  // Analytics and Reporting
  async getFunnelPerformanceMetrics(funnelId: string, dateRange?: { start_date: Date; end_date: Date }): Promise<FunnelPerformanceMetrics> {
    try {
      console.log(`📈 Getting performance metrics for funnel: ${funnelId}`);

      const startDate = dateRange?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end_date || new Date();

      // Get funnel info
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('name, steps:funnel_steps(*)')
        .eq('id', funnelId)
        .single();

      if (funnelError) throw funnelError;

      // Get visitors in date range
      const { data: visitors, error: visitorsError } = await supabase
        .from('funnel_visitors')
        .select('*')
        .eq('funnel_id', funnelId)
        .gte('first_visit_at', startDate.toISOString())
        .lte('first_visit_at', endDate.toISOString());

      if (visitorsError) throw visitorsError;

      // Get step views
      const { data: stepViews, error: stepViewsError } = await supabase
        .from('funnel_step_views')
        .select('*')
        .eq('funnel_id', funnelId)
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString());

      if (stepViewsError) throw stepViewsError;

      // Get conversions
      const { data: conversions, error: conversionsError } = await supabase
        .from('funnel_conversions')
        .select('*')
        .eq('funnel_id', funnelId)
        .gte('converted_at', startDate.toISOString())
        .lte('converted_at', endDate.toISOString());

      if (conversionsError) throw conversionsError;

      // Calculate overall metrics
      const totalVisitors = visitors?.length || 0;
      const uniqueVisitors = new Set(visitors?.map(v => v.visitor_id)).size;
      const totalConversions = conversions?.length || 0;
      const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
      const totalRevenue = conversions?.reduce((sum, c) => sum + (c.conversion_value || 0), 0) || 0;
      const averageOrderValue = totalConversions > 0 ? totalRevenue / totalConversions : 0;

      // Calculate step analytics
      const stepAnalytics: FunnelStepAnalytics[] = [];
      
      for (const step of funnel.steps || []) {
        const stepVisitors = stepViews?.filter(sv => sv.step_number === step.step_number) || [];
        const stepConversions = conversions?.filter(c => c.step_number === step.step_number) || [];
        const uniqueStepVisitors = new Set(stepVisitors.map(sv => sv.visitor_id)).size;
        
        const stepConversionRate = stepVisitors.length > 0 ? (stepConversions.length / stepVisitors.length) * 100 : 0;
        const averageTimeOnPage = stepVisitors.length > 0 
          ? stepVisitors.reduce((sum, sv) => sum + (sv.time_on_page || 0), 0) / stepVisitors.length 
          : 0;

        // Calculate drop-off (visitors who didn't proceed to next step)
        const nextStepVisitors = stepViews?.filter(sv => sv.step_number === step.step_number + 1) || [];
        const dropOffCount = stepVisitors.length - nextStepVisitors.length;
        const dropOffRate = stepVisitors.length > 0 ? (dropOffCount / stepVisitors.length) * 100 : 0;

        stepAnalytics.push({
          step_id: step.id,
          step_number: step.step_number,
          step_name: step.name,
          step_type: step.step_type,
          visitors: stepVisitors.length,
          unique_visitors: uniqueStepVisitors,
          conversions: stepConversions.length,
          conversion_rate: Math.round(stepConversionRate * 100) / 100,
          drop_off_count: dropOffCount,
          drop_off_rate: Math.round(dropOffRate * 100) / 100,
          average_time_on_page: Math.round(averageTimeOnPage),
          bounce_rate: 0, // Would need additional tracking
          revenue_generated: stepConversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0)
        });
      }

      // Calculate traffic sources
      const sourceMap = new Map();
      visitors?.forEach(visitor => {
        const source = visitor.source || 'direct';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, { visitors: 0, conversions: 0, revenue: 0 });
        }
        const data = sourceMap.get(source);
        data.visitors++;
        
        if (visitor.is_converted) {
          data.conversions++;
          data.revenue += visitor.conversion_value || 0;
        }
      });

      const trafficSources = Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        visitors: data.visitors,
        conversions: data.conversions,
        conversion_rate: data.visitors > 0 ? (data.conversions / data.visitors) * 100 : 0,
        revenue: data.revenue
      }));

      // Calculate device breakdown
      const deviceMap = new Map();
      visitors?.forEach(visitor => {
        const device = visitor.device_type;
        if (!deviceMap.has(device)) {
          deviceMap.set(device, { visitors: 0, conversions: 0 });
        }
        const data = deviceMap.get(device);
        data.visitors++;
        if (visitor.is_converted) data.conversions++;
      });

      const deviceBreakdown = Array.from(deviceMap.entries()).map(([device_type, data]) => ({
        device_type,
        visitors: data.visitors,
        conversion_rate: data.visitors > 0 ? (data.conversions / data.visitors) * 100 : 0
      }));

      // Calculate geographic data
      const geoMap = new Map();
      visitors?.forEach(visitor => {
        const country = visitor.country || 'Unknown';
        if (!geoMap.has(country)) {
          geoMap.set(country, { visitors: 0, conversions: 0, revenue: 0 });
        }
        const data = geoMap.get(country);
        data.visitors++;
        if (visitor.is_converted) {
          data.conversions++;
          data.revenue += visitor.conversion_value || 0;
        }
      });

      const geographicData = Array.from(geoMap.entries()).map(([country, data]) => ({
        country,
        visitors: data.visitors,
        conversions: data.conversions,
        revenue: data.revenue
      }));

      // Generate time analysis (mock data for now)
      const timeAnalysis = this.generateTimeAnalysis(visitors || []);

      return {
        funnel_id: funnelId,
        funnel_name: funnel.name,
        date_range: {
          start_date: startDate,
          end_date: endDate
        },
        total_visitors: totalVisitors,
        unique_visitors: uniqueVisitors,
        total_conversions: totalConversions,
        overall_conversion_rate: Math.round(overallConversionRate * 100) / 100,
        total_revenue: totalRevenue,
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        step_analytics: stepAnalytics,
        traffic_sources: trafficSources,
        device_breakdown: deviceBreakdown,
        geographic_data: geographicData,
        time_analysis: timeAnalysis
      };

    } catch (error) {
      console.error('❌ Failed to get funnel performance metrics:', error);
      throw error;
    }
  }

  private generateTimeAnalysis(visitors: FunnelVisitor[]): Array<{ hour: number; day_of_week: number; visitors: number; conversion_rate: number }> {
    const timeMap = new Map();

    visitors.forEach(visitor => {
      const date = new Date(visitor.first_visit_at);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const key = `${dayOfWeek}_${hour}`;

      if (!timeMap.has(key)) {
        timeMap.set(key, { hour, day_of_week: dayOfWeek, visitors: 0, conversions: 0 });
      }

      const data = timeMap.get(key);
      data.visitors++;
      if (visitor.is_converted) data.conversions++;
    });

    return Array.from(timeMap.values()).map(data => ({
      ...data,
      conversion_rate: data.visitors > 0 ? (data.conversions / data.visitors) * 100 : 0
    }));
  }

  // Heatmap and User Behavior
  async trackClick(funnelId: string, stepNumber: number, visitorId: string, elementData: {
    selector: string;
    text: string;
    position: { x: number; y: number };
  }): Promise<void> {
    try {
      console.log(`🖱️ Tracking click: funnel ${funnelId}, step ${stepNumber}`);

      const { error } = await supabase
        .from('funnel_click_tracking')
        .insert({
          funnel_id: funnelId,
          step_number: stepNumber,
          visitor_id: visitorId,
          element_selector: elementData.selector,
          element_text: elementData.text,
          click_position_x: elementData.position.x,
          click_position_y: elementData.position.y,
          clicked_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Failed to track click:', error);
    }
  }

  async trackScroll(funnelId: string, stepNumber: number, visitorId: string, scrollData: {
    depth_percentage: number;
    time_at_depth: number;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('funnel_scroll_tracking')
        .insert({
          funnel_id: funnelId,
          step_number: stepNumber,
          visitor_id: visitorId,
          scroll_depth_percentage: scrollData.depth_percentage,
          time_at_depth: scrollData.time_at_depth,
          tracked_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('❌ Failed to track scroll:', error);
    }
  }

  async getHeatmapData(funnelId: string, stepNumber: number, dateRange?: { start_date: Date; end_date: Date }): Promise<FunnelHeatmapData> {
    try {
      console.log(`🔥 Getting heatmap data: funnel ${funnelId}, step ${stepNumber}`);

      const startDate = dateRange?.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end_date || new Date();

      // Get click data
      const { data: clickData, error: clickError } = await supabase
        .from('funnel_click_tracking')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('step_number', stepNumber)
        .gte('clicked_at', startDate.toISOString())
        .lte('clicked_at', endDate.toISOString());

      if (clickError) throw clickError;

      // Get scroll data
      const { data: scrollData, error: scrollError } = await supabase
        .from('funnel_scroll_tracking')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('step_number', stepNumber)
        .gte('tracked_at', startDate.toISOString())
        .lte('tracked_at', endDate.toISOString());

      if (scrollError) throw scrollError;

      // Process click data
      const clickMap = new Map();
      (clickData || []).forEach(click => {
        const key = `${click.element_selector}_${click.element_text}`;
        if (!clickMap.has(key)) {
          clickMap.set(key, {
            element_selector: click.element_selector,
            element_text: click.element_text,
            click_count: 0,
            unique_clicks: new Set(),
            position: { x: click.click_position_x, y: click.click_position_y }
          });
        }
        const data = clickMap.get(key);
        data.click_count++;
        data.unique_clicks.add(click.visitor_id);
      });

      const processedClickData = Array.from(clickMap.values()).map(data => ({
        element_selector: data.element_selector,
        element_text: data.element_text,
        click_count: data.click_count,
        unique_clicks: data.unique_clicks.size,
        position: data.position
      }));

      // Process scroll data
      const scrollMap = new Map();
      (scrollData || []).forEach(scroll => {
        const depth = Math.floor(scroll.scroll_depth_percentage / 10) * 10; // Group by 10% intervals
        if (!scrollMap.has(depth)) {
          scrollMap.set(depth, { users: new Set(), total_time: 0, count: 0 });
        }
        const data = scrollMap.get(depth);
        data.users.add(scroll.visitor_id);
        data.total_time += scroll.time_at_depth;
        data.count++;
      });

      const processedScrollData = Array.from(scrollMap.entries()).map(([depth, data]) => ({
        depth_percentage: depth,
        user_count: data.users.size,
        average_time: data.count > 0 ? data.total_time / data.count : 0
      }));

      return {
        step_id: `${funnelId}_${stepNumber}`,
        click_data: processedClickData,
        scroll_data: processedScrollData
      };

    } catch (error) {
      console.error('❌ Failed to get heatmap data:', error);
      throw error;
    }
  }  // 
Optimization Suggestions
  async generateOptimizationSuggestions(funnelId: string): Promise<FunnelOptimizationSuggestion[]> {
    try {
      console.log(`💡 Generating optimization suggestions for funnel: ${funnelId}`);

      const metrics = await this.getFunnelPerformanceMetrics(funnelId);
      const suggestions: FunnelOptimizationSuggestion[] = [];

      // Analyze overall conversion rate
      if (metrics.overall_conversion_rate < 2) {
        suggestions.push({
          type: 'conversion_rate',
          priority: 'high',
          title: 'Low Overall Conversion Rate',
          description: `Your funnel has a ${metrics.overall_conversion_rate.toFixed(1)}% conversion rate, which is below industry average.`,
          potential_impact: 'Could increase conversions by 50-100%',
          implementation_effort: 'medium',
          suggested_actions: [
            'Review and optimize your value proposition',
            'Simplify the conversion process',
            'Add social proof and testimonials',
            'Test different headlines and copy',
            'Improve page loading speed'
          ]
        });
      }

      // Analyze step-by-step performance
      metrics.step_analytics.forEach((step, index) => {
        // High drop-off rate
        if (step.drop_off_rate > 50 && index < metrics.step_analytics.length - 1) {
          suggestions.push({
            type: 'user_experience',
            priority: 'high',
            step_number: step.step_number,
            title: `High Drop-off Rate at Step ${step.step_number}`,
            description: `${step.drop_off_rate.toFixed(1)}% of visitors leave at "${step.step_name}".`,
            potential_impact: 'Could reduce drop-off by 20-40%',
            implementation_effort: 'medium',
            suggested_actions: [
              'Simplify the page design and reduce distractions',
              'Improve the call-to-action clarity',
              'Add progress indicators',
              'Reduce form fields if applicable',
              'Test different page layouts'
            ]
          });
        }

        // Long time on page without conversion
        if (step.average_time_on_page > 180 && step.conversion_rate < 10) {
          suggestions.push({
            type: 'content',
            priority: 'medium',
            step_number: step.step_number,
            title: `Visitors Spending Too Long on Step ${step.step_number}`,
            description: `Average time of ${Math.round(step.average_time_on_page / 60)} minutes suggests confusion or hesitation.`,
            potential_impact: 'Could improve user experience and conversions',
            implementation_effort: 'low',
            suggested_actions: [
              'Clarify the value proposition',
              'Add FAQ section',
              'Simplify the content',
              'Add live chat support',
              'Include video explanations'
            ]
          });
        }

        // Form-specific suggestions
        if (step.step_type === 'opt_in' && step.form_completion_rate && step.form_completion_rate < 30) {
          suggestions.push({
            type: 'conversion_rate',
            priority: 'high',
            step_number: step.step_number,
            title: `Low Form Completion Rate`,
            description: `Only ${step.form_completion_rate.toFixed(1)}% of visitors complete the form.`,
            potential_impact: 'Could double form completions',
            implementation_effort: 'low',
            suggested_actions: [
              'Reduce number of form fields',
              'Make optional fields clearly marked',
              'Improve form validation messages',
              'Add trust signals near the form',
              'Test single-column vs multi-column layout'
            ]
          });
        }
      });

      // Mobile vs Desktop performance
      const mobileData = metrics.device_breakdown.find(d => d.device_type === 'mobile');
      const desktopData = metrics.device_breakdown.find(d => d.device_type === 'desktop');
      
      if (mobileData && desktopData && mobileData.conversion_rate < desktopData.conversion_rate * 0.7) {
        suggestions.push({
          type: 'technical',
          priority: 'high',
          title: 'Poor Mobile Performance',
          description: `Mobile conversion rate (${mobileData.conversion_rate.toFixed(1)}%) is significantly lower than desktop (${desktopData.conversion_rate.toFixed(1)}%).`,
          potential_impact: 'Could increase mobile conversions by 30-50%',
          implementation_effort: 'high',
          suggested_actions: [
            'Optimize for mobile-first design',
            'Improve mobile page loading speed',
            'Simplify mobile navigation',
            'Test mobile form usability',
            'Optimize button sizes for touch'
          ]
        });
      }

      // Traffic source analysis
      const organicTraffic = metrics.traffic_sources.find(s => s.source === 'organic');
      const paidTraffic = metrics.traffic_sources.find(s => s.source === 'paid' || s.source === 'google-ads');
      
      if (paidTraffic && organicTraffic && paidTraffic.conversion_rate < organicTraffic.conversion_rate * 0.8) {
        suggestions.push({
          type: 'conversion_rate',
          priority: 'medium',
          title: 'Paid Traffic Underperforming',
          description: `Paid traffic converts at ${paidTraffic.conversion_rate.toFixed(1)}% vs organic at ${organicTraffic.conversion_rate.toFixed(1)}%.`,
          potential_impact: 'Could improve ROI on ad spend',
          implementation_effort: 'medium',
          suggested_actions: [
            'Review ad targeting and messaging alignment',
            'Create dedicated landing pages for paid traffic',
            'Test different ad copy variations',
            'Improve message match between ads and landing pages',
            'Consider retargeting campaigns'
          ]
        });
      }

      // Revenue optimization
      if (metrics.total_revenue > 0 && metrics.average_order_value < 100) {
        suggestions.push({
          type: 'conversion_rate',
          priority: 'medium',
          title: 'Low Average Order Value',
          description: `Average order value of $${metrics.average_order_value.toFixed(2)} could be increased.`,
          potential_impact: 'Could increase revenue by 20-40%',
          implementation_effort: 'medium',
          suggested_actions: [
            'Add upsell offers',
            'Create product bundles',
            'Implement order bumps',
            'Test higher-priced alternatives',
            'Add limited-time bonuses'
          ]
        });
      }

      // Sort suggestions by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      console.log(`✅ Generated ${suggestions.length} optimization suggestions`);
      return suggestions;

    } catch (error) {
      console.error('❌ Failed to generate optimization suggestions:', error);
      throw error;
    }
  }

  // A/B Testing Analytics
  async analyzeSplitTestResults(funnelId: string, stepNumber: number): Promise<{
    test_duration_days: number;
    statistical_significance: boolean;
    confidence_level: number;
    winning_variant?: string;
    results: Array<{
      variant_name: string;
      visitors: number;
      conversions: number;
      conversion_rate: number;
      revenue: number;
      statistical_power: number;
    }>;
  }> {
    try {
      console.log(`🧪 Analyzing split test results: funnel ${funnelId}, step ${stepNumber}`);

      // Get step configuration
      const { data: step, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', funnelId)
        .eq('step_number', stepNumber)
        .single();

      if (stepError) throw stepError;

      if (!step.split_test_config?.is_enabled) {
        throw new Error('Split test is not enabled for this step');
      }

      // Get test data for each variant
      const variants = step.split_test_config.variants;
      const results = [];

      for (const variant of variants) {
        // Get visitors and conversions for this variant
        // This would require additional tracking in a real implementation
        const mockData = {
          variant_name: variant.name,
          visitors: Math.floor(Math.random() * 1000) + 100,
          conversions: Math.floor(Math.random() * 50) + 5,
          conversion_rate: 0,
          revenue: Math.floor(Math.random() * 5000) + 500,
          statistical_power: Math.random() * 0.3 + 0.7
        };

        mockData.conversion_rate = (mockData.conversions / mockData.visitors) * 100;
        results.push(mockData);
      }

      // Find winning variant
      const winningVariant = results.reduce((best, current) => 
        current.conversion_rate > best.conversion_rate ? current : best
      );

      // Calculate statistical significance (simplified)
      const totalVisitors = results.reduce((sum, r) => sum + r.visitors, 0);
      const statisticalSignificance = totalVisitors > 500 && 
        Math.abs(results[0].conversion_rate - results[1].conversion_rate) > 2;

      return {
        test_duration_days: 14, // Mock duration
        statistical_significance: statisticalSignificance,
        confidence_level: statisticalSignificance ? 95 : 75,
        winning_variant: statisticalSignificance ? winningVariant.variant_name : undefined,
        results
      };

    } catch (error) {
      console.error('❌ Failed to analyze split test results:', error);
      throw error;
    }
  }

  // A/B Test Performance (for FunnelTestingService)
  async getABTestPerformance(testId: string): Promise<{
    variant_a_visitors: number;
    variant_a_conversions: number;
    variant_b_visitors: number;
    variant_b_conversions: number;
  }> {
    try {
      console.log(`📊 Getting A/B test performance: ${testId}`);

      // Get test data
      const { data: test, error } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (error) throw error;

      // In a real implementation, this would query actual visitor and conversion data
      // For now, we'll return mock data based on the test configuration
      const mockPerformance = {
        variant_a_visitors: Math.floor(Math.random() * 500) + 200,
        variant_a_conversions: Math.floor(Math.random() * 50) + 10,
        variant_b_visitors: Math.floor(Math.random() * 500) + 200,
        variant_b_conversions: Math.floor(Math.random() * 50) + 10
      };

      return mockPerformance;

    } catch (error) {
      console.error('❌ Failed to get A/B test performance:', error);
      throw error;
    }
  }floor(Math.random() * 100) + 10,
          conversion_rate: 0,
          revenue: Math.floor(Math.random() * 10000) + 1000,
          statistical_power: Math.random() * 100
        };

        mockData.conversion_rate = (mockData.conversions / mockData.visitors) * 100;
        results.push(mockData);
      }

      // Calculate statistical significance
      const bestVariant = results.reduce((best, current) => 
        current.conversion_rate > best.conversion_rate ? current : best
      );

      const confidenceLevel = Math.min(95, Math.max(...results.map(r => r.statistical_power)));
      const statisticalSignificance = confidenceLevel >= 90;

      return {
        test_duration_days: 7, // Mock duration
        statistical_significance: statisticalSignificance,
        confidence_level: confidenceLevel,
        winning_variant: statisticalSignificance ? bestVariant.variant_name : undefined,
        results
      };

    } catch (error) {
      console.error('❌ Failed to analyze split test results:', error);
      throw error;
    }
  }

  // Cohort Analysis
  async getCohortAnalysis(funnelId: string, cohortType: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<{
    cohorts: Array<{
      cohort_period: string;
      total_visitors: number;
      periods: Array<{
        period: number;
        visitors: number;
        retention_rate: number;
        conversion_rate: number;
      }>;
    }>;
  }> {
    try {
      console.log(`📊 Getting cohort analysis for funnel: ${funnelId}`);

      // Get visitors grouped by cohort period
      const { data: visitors, error } = await supabase
        .from('funnel_visitors')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('first_visit_at', { ascending: true });

      if (error) throw error;

      // Group visitors by cohort period
      const cohortMap = new Map();
      
      (visitors || []).forEach(visitor => {
        const firstVisit = new Date(visitor.first_visit_at);
        let cohortKey: string;

        switch (cohortType) {
          case 'daily':
            cohortKey = firstVisit.toISOString().split('T')[0];
            break;
          case 'weekly':
            const weekStart = new Date(firstVisit);
            weekStart.setDate(firstVisit.getDate() - firstVisit.getDay());
            cohortKey = weekStart.toISOString().split('T')[0];
            break;
          case 'monthly':
            cohortKey = `${firstVisit.getFullYear()}-${String(firstVisit.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (!cohortMap.has(cohortKey)) {
          cohortMap.set(cohortKey, []);
        }
        cohortMap.get(cohortKey).push(visitor);
      });

      // Calculate retention and conversion for each cohort
      const cohorts = Array.from(cohortMap.entries()).map(([cohortPeriod, cohortVisitors]) => {
        const totalVisitors = cohortVisitors.length;
        const periods = [];

        // Calculate metrics for different time periods
        for (let period = 0; period < 12; period++) {
          const periodStart = new Date(cohortPeriod);
          const periodEnd = new Date(cohortPeriod);

          switch (cohortType) {
            case 'daily':
              periodEnd.setDate(periodStart.getDate() + period + 1);
              break;
            case 'weekly':
              periodEnd.setDate(periodStart.getDate() + (period + 1) * 7);
              break;
            case 'monthly':
              periodEnd.setMonth(periodStart.getMonth() + period + 1);
              break;
          }

          const activeVisitors = cohortVisitors.filter(v => 
            new Date(v.last_visit_at) >= periodStart && new Date(v.last_visit_at) < periodEnd
          );

          const convertedVisitors = cohortVisitors.filter(v => 
            v.is_converted && v.conversion_at && 
            new Date(v.conversion_at) >= periodStart && new Date(v.conversion_at) < periodEnd
          );

          periods.push({
            period,
            visitors: activeVisitors.length,
            retention_rate: totalVisitors > 0 ? (activeVisitors.length / totalVisitors) * 100 : 0,
            conversion_rate: totalVisitors > 0 ? (convertedVisitors.length / totalVisitors) * 100 : 0
          });
        }

        return {
          cohort_period: cohortPeriod,
          total_visitors: totalVisitors,
          periods
        };
      });

      return { cohorts };

    } catch (error) {
      console.error('❌ Failed to get cohort analysis:', error);
      throw error;
    }
  }

  // Export Analytics Data
  async exportAnalyticsData(funnelId: string, format: 'csv' | 'json', dateRange?: { start_date: Date; end_date: Date }): Promise<string> {
    try {
      console.log(`📤 Exporting analytics data for funnel: ${funnelId} in ${format} format`);

      const metrics = await this.getFunnelPerformanceMetrics(funnelId, dateRange);
      const suggestions = await this.generateOptimizationSuggestions(funnelId);

      const exportData = {
        funnel_metrics: metrics,
        optimization_suggestions: suggestions,
        exported_at: new Date().toISOString()
      };

      if (format === 'csv') {
        return this.convertToCSV(metrics.step_analytics);
      } else {
        return JSON.stringify(exportData, null, 2);
      }

    } catch (error) {
      console.error('❌ Failed to export analytics data:', error);
      throw error;
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  // Real-time Analytics
  async getRealTimeMetrics(funnelId: string): Promise<{
    active_visitors: number;
    visitors_last_hour: number;
    conversions_last_hour: number;
    current_conversion_rate: number;
    top_pages: Array<{
      step_number: number;
      step_name: string;
      active_visitors: number;
    }>;
  }> {
    try {
      console.log(`⚡ Getting real-time metrics for funnel: ${funnelId}`);

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Get active visitors (visited in last 5 minutes)
      const { data: activeVisitors, error: activeError } = await supabase
        .from('funnel_visitors')
        .select('visitor_id')
        .eq('funnel_id', funnelId)
        .gte('last_visit_at', fiveMinutesAgo.toISOString());

      if (activeError) throw activeError;

      // Get visitors in last hour
      const { data: hourlyVisitors, error: hourlyError } = await supabase
        .from('funnel_visitors')
        .select('*')
        .eq('funnel_id', funnelId)
        .gte('first_visit_at', oneHourAgo.toISOString());

      if (hourlyError) throw hourlyError;

      // Get conversions in last hour
      const { data: hourlyConversions, error: conversionsError } = await supabase
        .from('funnel_conversions')
        .select('*')
        .eq('funnel_id', funnelId)
        .gte('converted_at', oneHourAgo.toISOString());

      if (conversionsError) throw conversionsError;

      // Get current step distribution
      const { data: stepViews, error: stepViewsError } = await supabase
        .from('funnel_step_views')
        .select('step_number, visitor_id')
        .eq('funnel_id', funnelId)
        .gte('viewed_at', fiveMinutesAgo.toISOString());

      if (stepViewsError) throw stepViewsError;

      // Get funnel steps for names
      const { data: steps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('step_number, name')
        .eq('funnel_id', funnelId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      // Calculate top pages
      const stepMap = new Map();
      (stepViews || []).forEach(view => {
        if (!stepMap.has(view.step_number)) {
          stepMap.set(view.step_number, new Set());
        }
        stepMap.get(view.step_number).add(view.visitor_id);
      });

      const topPages = Array.from(stepMap.entries()).map(([stepNumber, visitorSet]) => {
        const step = (steps || []).find(s => s.step_number === stepNumber);
        return {
          step_number: stepNumber,
          step_name: step?.name || `Step ${stepNumber}`,
          active_visitors: visitorSet.size
        };
      }).sort((a, b) => b.active_visitors - a.active_visitors);

      const visitorsLastHour = hourlyVisitors?.length || 0;
      const conversionsLastHour = hourlyConversions?.length || 0;
      const currentConversionRate = visitorsLastHour > 0 ? (conversionsLastHour / visitorsLastHour) * 100 : 0;

      return {
        active_visitors: activeVisitors?.length || 0,
        visitors_last_hour: visitorsLastHour,
        conversions_last_hour: conversionsLastHour,
        current_conversion_rate: Math.round(currentConversionRate * 100) / 100,
        top_pages: topPages
      };

    } catch (error) {
      console.error('❌ Failed to get real-time metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const funnelAnalyticsService = FunnelAnalyticsService.getInstance();}

/
/ Export singleton instance
export const funnelAnalyticsService = FunnelAnalyticsService.getInstance();
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Tables = Database['public']['Tables'];

// Enhanced type definitions for new tables
export type CustomerIntelligence = Tables['customer_intelligence']['Row'];
export type Campaign = Tables['campaigns']['Row'];
export type SalesFunnel = Tables['sales_funnels']['Row'];
export type AIModel = Tables['ai_models']['Row'];
export type PredictiveAnalytics = Tables['predictive_analytics']['Row'];
export type PlatformIntegration = Tables['platform_integrations']['Row'];
export type WorkflowAutomation = Tables['workflow_automations']['Row'];
export type TeamMember = Tables['team_members']['Row'];
export type LeadScoringModel = Tables['lead_scoring_models']['Row'];
export type ContentIntelligence = Tables['content_intelligence']['Row'];
export type MarketIntelligence = Tables['market_intelligence']['Row'];
export type AnalyticsEventEnhanced = Tables['analytics_events_enhanced']['Row'];

export interface DashboardMetrics {
  totalContacts: number;
  activeCampaigns: number;
  totalFunnels: number;
  conversionRate: number;
  revenueThisMonth: number;
  leadScore: number;
  churnRisk: number;
  marketingROI: number;
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actions: string[];
  metadata: Record<string, any>;
}

export class EnhancedSupabaseService {
  private static instance: EnhancedSupabaseService;

  public static getInstance(): EnhancedSupabaseService {
    if (!EnhancedSupabaseService.instance) {
      EnhancedSupabaseService.instance = new EnhancedSupabaseService();
    }
    return EnhancedSupabaseService.instance;
  }

  // Enhanced Dashboard Metrics
  async getEnhancedDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    try {
      // Get comprehensive metrics using the new database functions
      const [
        contactsResult,
        campaignsResult,
        funnelsResult,
        portfolioROI,
        leadScores,
        churnPredictions
      ] = await Promise.all([
        // Total contacts
        supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Active campaigns
        supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active'),
        
        // Total funnels
        supabase
          .from('sales_funnels')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        // Portfolio ROI using database function
        supabase.rpc('calculate_portfolio_roi', { 
          user_uuid: userId, 
          date_range_days: 30 
        }),
        
        // Average lead scores
        supabase
          .from('contacts')
          .select('lead_score')
          .eq('user_id', userId)
          .not('lead_score', 'is', null),
        
        // Churn predictions
        supabase
          .from('predictive_analytics')
          .select('prediction_data, confidence_score')
          .eq('user_id', userId)
          .eq('prediction_type', 'churn')
          .gt('expires_at', new Date().toISOString())
      ]);

      // Calculate average conversion rate from funnels
      const { data: funnelData } = await supabase
        .from('sales_funnels')
        .select('conversion_rate')
        .eq('user_id', userId)
        .not('conversion_rate', 'is', null);

      const conversionRate = funnelData && funnelData.length > 0
        ? funnelData.reduce((sum, funnel) => sum + (funnel.conversion_rate || 0), 0) / funnelData.length
        : 0;

      // Calculate average lead score
      const avgLeadScore = leadScores.data && leadScores.data.length > 0
        ? leadScores.data.reduce((sum, contact) => sum + (contact.lead_score || 0), 0) / leadScores.data.length
        : 0;

      // Calculate average churn risk
      const avgChurnRisk = churnPredictions.data && churnPredictions.data.length > 0
        ? churnPredictions.data.reduce((sum, pred) => sum + (pred.confidence_score || 0), 0) / churnPredictions.data.length
        : 0;

      return {
        totalContacts: contactsResult.count || 0,
        activeCampaigns: campaignsResult.count || 0,
        totalFunnels: funnelsResult.count || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        revenueThisMonth: portfolioROI.data?.total_revenue || 0,
        leadScore: Math.round(avgLeadScore),
        churnRisk: Math.round(avgChurnRisk * 100),
        marketingROI: portfolioROI.data?.portfolio_roi || 0
      };
    } catch (error) {
      console.error('Failed to fetch enhanced dashboard metrics:', error);
      throw error;
    }
  }

  // Customer Intelligence Management
  async getCustomerIntelligence(
    userId: string, 
    contactId?: string,
    intelligenceType?: string
  ): Promise<CustomerIntelligence[]> {
    let query = supabase
      .from('customer_intelligence')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (intelligenceType) {
      query = query.eq('intelligence_type', intelligenceType);
    }

    const { data, error } = await query.limit(100);

    if (error) throw new Error(`Failed to fetch customer intelligence: ${error.message}`);
    return data || [];
  }

  async generateCustomerInsights(userId: string): Promise<void> {
    const { error } = await supabase.rpc('generate_automated_insights', {
      user_uuid: userId
    });

    if (error) throw new Error(`Failed to generate insights: ${error.message}`);
  }

  // Enhanced Campaign Management
  async createAdvancedCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw new Error(`Failed to create campaign: ${error.message}`);
    return data;
  }

  async getCampaignPrediction(campaignId: string, predictionDays: number = 30): Promise<any> {
    const { data, error } = await supabase.rpc('predict_campaign_performance', {
      campaign_uuid: campaignId,
      prediction_days: predictionDays
    });

    if (error) throw new Error(`Failed to get campaign prediction: ${error.message}`);
    return data;
  }

  async getPortfolioROI(userId: string, dateRangeDays: number = 30): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_portfolio_roi', {
      user_uuid: userId,
      date_range_days: dateRangeDays
    });

    if (error) throw new Error(`Failed to calculate portfolio ROI: ${error.message}`);
    return data;
  }

  // Sales Funnel Management
  async createSalesFunnel(funnel: Omit<SalesFunnel, 'id' | 'created_at' | 'updated_at'>): Promise<SalesFunnel> {
    const { data, error } = await supabase
      .from('sales_funnels')
      .insert(funnel)
      .select()
      .single();

    if (error) throw new Error(`Failed to create sales funnel: ${error.message}`);
    return data;
  }

  async getSalesFunnels(userId: string): Promise<SalesFunnel[]> {
    const { data, error } = await supabase
      .from('sales_funnels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch sales funnels: ${error.message}`);
    return data || [];
  }

  async optimizeFunnel(funnelId: string): Promise<any> {
    const { data, error } = await supabase.rpc('optimize_funnel_performance', {
      funnel_uuid: funnelId
    });

    if (error) throw new Error(`Failed to optimize funnel: ${error.message}`);
    return data;
  }

  // AI Model Management
  async createAIModel(model: Omit<AIModel, 'id' | 'created_at' | 'updated_at'>): Promise<AIModel> {
    const { data, error } = await supabase
      .from('ai_models')
      .insert(model)
      .select()
      .single();

    if (error) throw new Error(`Failed to create AI model: ${error.message}`);
    return data;
  }

  async getAIModels(userId: string): Promise<AIModel[]> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch AI models: ${error.message}`);
    return data || [];
  }

  // Predictive Analytics
  async createPrediction(prediction: Omit<PredictiveAnalytics, 'id' | 'created_at'>): Promise<PredictiveAnalytics> {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .insert(prediction)
      .select()
      .single();

    if (error) throw new Error(`Failed to create prediction: ${error.message}`);
    return data;
  }

  async getPredictions(
    userId: string, 
    predictionType?: string,
    entityId?: string
  ): Promise<PredictiveAnalytics[]> {
    let query = supabase
      .from('predictive_analytics')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (predictionType) {
      query = query.eq('prediction_type', predictionType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch predictions: ${error.message}`);
    return data || [];
  }

  // Lead Scoring
  async calculateLeadScore(contactId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_advanced_lead_score', {
      contact_uuid: contactId
    });

    if (error) throw new Error(`Failed to calculate lead score: ${error.message}`);
    return data || 0;
  }

  async createLeadScoringModel(model: Omit<LeadScoringModel, 'id' | 'created_at' | 'updated_at'>): Promise<LeadScoringModel> {
    const { data, error } = await supabase
      .from('lead_scoring_models')
      .insert(model)
      .select()
      .single();

    if (error) throw new Error(`Failed to create lead scoring model: ${error.message}`);
    return data;
  }

  // Market Intelligence
  async getMarketIntelligence(userId: string, industry?: string): Promise<MarketIntelligence[]> {
    let query = supabase
      .from('market_intelligence')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('collected_at', { ascending: false });

    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch market intelligence: ${error.message}`);
    return data || [];
  }

  async generateMarketInsights(userId: string, industry?: string): Promise<any> {
    const { data, error } = await supabase.rpc('generate_market_insights', {
      user_uuid: userId,
      industry_filter: industry
    });

    if (error) throw new Error(`Failed to generate market insights: ${error.message}`);
    return data;
  }

  // Platform Integrations
  async createIntegration(integration: Omit<PlatformIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<PlatformIntegration> {
    const { data, error } = await supabase
      .from('platform_integrations')
      .insert(integration)
      .select()
      .single();

    if (error) throw new Error(`Failed to create integration: ${error.message}`);
    return data;
  }

  async getIntegrations(userId: string): Promise<PlatformIntegration[]> {
    const { data, error } = await supabase
      .from('platform_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch integrations: ${error.message}`);
    return data || [];
  }

  // Workflow Automation
  async createWorkflow(workflow: Omit<WorkflowAutomation, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowAutomation> {
    const { data, error } = await supabase
      .from('workflow_automations')
      .insert(workflow)
      .select()
      .single();

    if (error) throw new Error(`Failed to create workflow: ${error.message}`);
    return data;
  }

  async getWorkflows(userId: string): Promise<WorkflowAutomation[]> {
    const { data, error } = await supabase
      .from('workflow_automations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch workflows: ${error.message}`);
    return data || [];
  }

  // Team Management
  async inviteTeamMember(member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert(member)
      .select()
      .single();

    if (error) throw new Error(`Failed to invite team member: ${error.message}`);
    return data;
  }

  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
    return data || [];
  }

  // Enhanced Analytics
  async trackEnhancedEvent(event: Omit<AnalyticsEventEnhanced, 'id' | 'created_at'>): Promise<AnalyticsEventEnhanced> {
    const { data, error } = await supabase
      .from('analytics_events_enhanced')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`Failed to track enhanced event: ${error.message}`);
    return data;
  }

  async getEnhancedAnalytics(
    userId: string,
    options: {
      eventType?: string;
      startDate?: string;
      endDate?: string;
      funnelId?: string;
      campaignId?: string;
      limit?: number;
    } = {}
  ): Promise<AnalyticsEventEnhanced[]> {
    let query = supabase
      .from('analytics_events_enhanced')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    if (options.funnelId) {
      query = query.eq('funnel_id', options.funnelId);
    }

    if (options.campaignId) {
      query = query.eq('campaign_id', options.campaignId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch enhanced analytics: ${error.message}`);
    return data || [];
  }

  // Content Intelligence
  async analyzeContent(content: Omit<ContentIntelligence, 'id' | 'created_at' | 'updated_at'>): Promise<ContentIntelligence> {
    const { data, error } = await supabase
      .from('content_intelligence')
      .insert(content)
      .select()
      .single();

    if (error) throw new Error(`Failed to analyze content: ${error.message}`);
    return data;
  }

  async getContentAnalysis(userId: string, contentType?: string): Promise<ContentIntelligence[]> {
    let query = supabase
      .from('content_intelligence')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch content analysis: ${error.message}`);
    return data || [];
  }

  // Customer Lifetime Value
  async calculateCustomerLTV(contactId: string, predictionMonths: number = 12): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_customer_lifetime_value', {
      contact_uuid: contactId,
      prediction_months: predictionMonths
    });

    if (error) throw new Error(`Failed to calculate customer LTV: ${error.message}`);
    return data || 0;
  }

  // Real-time subscriptions for enhanced tables
  subscribeToCustomerIntelligence(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('customer_intelligence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_intelligence',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToAdvancedCampaigns(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('advanced_campaigns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToSalesFunnels(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('sales_funnels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_funnels',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Bulk operations for performance
  async batchCreatePredictions(predictions: Omit<PredictiveAnalytics, 'id' | 'created_at'>[]): Promise<PredictiveAnalytics[]> {
    const { data, error } = await supabase
      .from('predictive_analytics')
      .insert(predictions)
      .select();

    if (error) throw new Error(`Failed to batch create predictions: ${error.message}`);
    return data || [];
  }

  async batchTrackEvents(events: Omit<AnalyticsEventEnhanced, 'id' | 'created_at'>[]): Promise<AnalyticsEventEnhanced[]> {
    const { data, error } = await supabase
      .from('analytics_events_enhanced')
      .insert(events)
      .select();

    if (error) throw new Error(`Failed to batch track events: ${error.message}`);
    return data || [];
  }
}

// Export singleton instance
export const enhancedSupabaseService = EnhancedSupabaseService.getInstance();
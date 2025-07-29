import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { supabase } from '@/integrations/supabase/client';
import { customerIntelligenceService } from './CustomerIntelligenceService';
import { predictiveAnalyticsService } from './PredictiveAnalyticsService';
import { customerAnalyticsService } from './CustomerAnalyticsService';
import { leadScoringService } from './LeadScoringService';

export interface CRMDashboardData {
  overview: {
    total_contacts: number;
    total_leads: number;
    total_customers: number;
    conversion_rate: number;
    average_deal_size: number;
    pipeline_value: number;
  };
  lead_metrics: {
    hot_leads: number;
    warm_leads: number;
    cold_leads: number;
    average_lead_score: number;
    top_scoring_leads: Array<{
      id: string;
      name: string;
      score: number;
      grade: string;
    }>;
  };
  customer_metrics: {
    churn_rate: number;
    average_ltv: number;
    health_score_distribution: Record<string, number>;
    at_risk_customers: number;
    high_value_customers: number;
  };
  recent_activities: Array<{
    id: string;
    type: string;
    description: string;
    contact_name: string;
    timestamp: Date;
    priority: 'low' | 'medium' | 'high';
  }>;
  insights: Array<{
    type: 'opportunity' | 'risk' | 'trend';
    title: string;
    description: string;
    action_required: boolean;
    recommended_actions: string[];
  }>;
}

export interface ContactEnrichmentData {
  contact_id: string;
  enrichment_source: string;
  company_info: {
    name?: string;
    industry?: string;
    size?: string;
    revenue?: string;
    website?: string;
    location?: string;
  };
  social_profiles: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  technologies: string[];
  intent_signals: Array<{
    signal: string;
    strength: number;
    source: string;
  }>;
  enriched_at: Date;
}

export interface DealPipeline {
  id: string;
  user_id: string;
  name: string;
  stages: Array<{
    id: string;
    name: string;
    order: number;
    probability: number;
    is_closed_won: boolean;
    is_closed_lost: boolean;
  }>;
  deals: Array<{
    id: string;
    title: string;
    value: number;
    stage_id: string;
    contact_id: string;
    probability: number;
    expected_close_date: Date;
    created_at: Date;
  }>;
}

export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: 'lead_score_change' | 'stage_change' | 'time_based' | 'behavior' | 'custom';
  trigger_conditions: Record<string, any>;
  actions: Array<{
    type: 'send_email' | 'create_task' | 'update_field' | 'assign_owner' | 'add_tag' | 'webhook';
    parameters: Record<string, any>;
  }>;
  is_active: boolean;
  created_at: Date;
  last_executed: Date;
  execution_count: number;
}

export class AdvancedCRMService {
  
  async createContact(contactData: {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    jobTitle?: string;
    phone?: string;
  }): Promise<{ id: string; email: string; firstName?: string; lastName?: string; company?: string }> {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        email: contactData.email,
        first_name: contactData.firstName,
        last_name: contactData.lastName,
        company: contactData.company,
        job_title: contactData.jobTitle,
        phone: contactData.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      company: data.company
    };
  }
  private static instance: AdvancedCRMService;

  private constructor() {}

  public static getInstance(): AdvancedCRMService {
    if (!AdvancedCRMService.instance) {
      AdvancedCRMService.instance = new AdvancedCRMService();
    }
    return AdvancedCRMService.instance;
  }

  // Dashboard and Overview
  async getCRMDashboard(userId: string): Promise<CRMDashboardData> {
    try {
      console.log('📊 Building CRM dashboard...');

      // Get overview metrics
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, status, lead_score, lead_grade')
        .eq('user_id', userId);

      if (contactsError) throw contactsError;

      const totalContacts = contacts?.length || 0;
      const totalLeads = contacts?.filter(c => c.status !== 'customer').length || 0;
      const totalCustomers = contacts?.filter(c => c.status === 'customer').length || 0;
      const conversionRate = totalLeads > 0 ? (totalCustomers / (totalLeads + totalCustomers)) * 100 : 0;

      // Get deal metrics
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('value, stage')
        .eq('user_id', userId);

      if (dealsError) throw dealsError;

      const averageDealSize = deals?.length ? deals.reduce((sum, deal) => sum + deal.value, 0) / deals.length : 0;
      const pipelineValue = deals?.reduce((sum, deal) => sum + deal.value, 0) || 0;

      // Get lead metrics
      const hotLeads = contacts?.filter(c => c.lead_score >= 80).length || 0;
      const warmLeads = contacts?.filter(c => c.lead_score >= 60 && c.lead_score < 80).length || 0;
      const coldLeads = contacts?.filter(c => c.lead_score >= 40 && c.lead_score < 60).length || 0;
      const averageLeadScore = contacts?.length 
        ? contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length 
        : 0;

      const topScoringLeads = contacts
        ?.filter(c => c.lead_score > 0)
        .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          name: 'Contact Name', // Would get from contact details
          score: c.lead_score || 0,
          grade: c.lead_grade || 'F'
        })) || [];

      // Get customer metrics
      const customerMetrics = await customerAnalyticsService.getCustomerMetrics(userId);

      // Mock health score distribution
      const healthScoreDistribution = {
        'Excellent (80-100)': Math.floor(totalCustomers * 0.3),
        'Good (60-79)': Math.floor(totalCustomers * 0.4),
        'Fair (40-59)': Math.floor(totalCustomers * 0.2),
        'Poor (0-39)': Math.floor(totalCustomers * 0.1)
      };

      const atRiskCustomers = Math.floor(totalCustomers * 0.15);
      const highValueCustomers = Math.floor(totalCustomers * 0.25);

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('contact_interactions')
        .select('id, interaction_type, description, contact_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      const recentActivities = (activities || []).map(activity => ({
        id: activity.id,
        type: activity.interaction_type,
        description: activity.description,
        contact_name: 'Contact Name', // Would get from contact details
        timestamp: new Date(activity.created_at),
        priority: 'medium' as const
      }));

      // Generate insights
      const insights = await this.generateCRMInsights(userId, {
        totalContacts,
        totalLeads,
        totalCustomers,
        conversionRate,
        hotLeads,
        atRiskCustomers
      });

      return {
        overview: {
          total_contacts: totalContacts,
          total_leads: totalLeads,
          total_customers: totalCustomers,
          conversion_rate: Math.round(conversionRate * 100) / 100,
          average_deal_size: Math.round(averageDealSize),
          pipeline_value: Math.round(pipelineValue)
        },
        lead_metrics: {
          hot_leads: hotLeads,
          warm_leads: warmLeads,
          cold_leads: coldLeads,
          average_lead_score: Math.round(averageLeadScore),
          top_scoring_leads: topScoringLeads
        },
        customer_metrics: {
          churn_rate: customerMetrics.churn_rate,
          average_ltv: customerMetrics.average_ltv,
          health_score_distribution: healthScoreDistribution,
          at_risk_customers: atRiskCustomers,
          high_value_customers: highValueCustomers
        },
        recent_activities: recentActivities,
        insights
      };

    } catch (error) {
      console.error('❌ Failed to get CRM dashboard:', error);
      throw error;
    }
  }

  private async generateCRMInsights(userId: string, metrics: any): Promise<Array<{
    type: 'opportunity' | 'risk' | 'trend';
    title: string;
    description: string;
    action_required: boolean;
    recommended_actions: string[];
  }>> {
    const insights = [];

    // Conversion rate insights
    if (metrics.conversionRate < 10) {
      insights.push({
        type: 'opportunity' as const,
        title: 'Low Conversion Rate Detected',
        description: `Your current conversion rate is ${metrics.conversionRate}%, which is below industry average.`,
        action_required: true,
        recommended_actions: [
          'Review lead qualification criteria',
          'Improve lead nurturing campaigns',
          'Analyze top-performing leads for patterns'
        ]
      });
    }

    // Hot leads opportunity
    if (metrics.hotLeads > 5) {
      insights.push({
        type: 'opportunity' as const,
        title: 'High-Quality Leads Ready for Outreach',
        description: `You have ${metrics.hotLeads} hot leads with scores above 80.`,
        action_required: true,
        recommended_actions: [
          'Prioritize outreach to hot leads',
          'Schedule demos or consultations',
          'Assign dedicated sales rep'
        ]
      });
    }

    // At-risk customers
    if (metrics.atRiskCustomers > 0) {
      insights.push({
        type: 'risk' as const,
        title: 'Customers at Risk of Churning',
        description: `${metrics.atRiskCustomers} customers show signs of churn risk.`,
        action_required: true,
        recommended_actions: [
          'Implement retention campaigns',
          'Schedule check-in calls',
          'Offer additional support or training'
        ]
      });
    }

    // Growth trend
    if (metrics.totalContacts > 100) {
      insights.push({
        type: 'trend' as const,
        title: 'Steady Contact Growth',
        description: 'Your contact database is growing steadily, indicating good lead generation.',
        action_required: false,
        recommended_actions: [
          'Continue current lead generation efforts',
          'Consider scaling successful campaigns'
        ]
      });
    }

    return insights;
  }

  // Contact Management
  async enrichContact(contactId: string): Promise<ContactEnrichmentData> {
    try {
      console.log(`🔍 Enriching contact: ${contactId}`);

      // Get contact data
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;

      // Mock enrichment data (in reality, this would call external APIs)
      const enrichmentData: ContactEnrichmentData = {
        contact_id: contactId,
        enrichment_source: 'clearbit',
        company_info: {
          name: contact.company || 'Unknown Company',
          industry: 'Technology',
          size: '50-200 employees',
          revenue: '$10M-$50M',
          website: 'https://example.com',
          location: 'San Francisco, CA'
        },
        social_profiles: {
          linkedin: 'https://linkedin.com/in/example',
          twitter: 'https://twitter.com/example'
        },
        technologies: ['React', 'Node.js', 'AWS', 'Stripe'],
        intent_signals: [
          {
            signal: 'Visited pricing page',
            strength: 8,
            source: 'website'
          },
          {
            signal: 'Downloaded whitepaper',
            strength: 6,
            source: 'content'
          }
        ],
        enriched_at: new Date()
      };

      // Store enrichment data
      await supabase
        .from('contact_enrichment')
        .upsert({
          contact_id: contactId,
          enrichment_source: enrichmentData.enrichment_source,
          company_info: enrichmentData.company_info,
          social_profiles: enrichmentData.social_profiles,
          technologies: enrichmentData.technologies,
          intent_signals: enrichmentData.intent_signals,
          enriched_at: enrichmentData.enriched_at.toISOString()
        });

      // Update contact with enriched data
      await supabase
        .from('contacts')
        .update({
          custom_fields: {
            ...contact.custom_fields,
            company_size: enrichmentData.company_info.size,
            industry: enrichmentData.company_info.industry,
            technologies: enrichmentData.technologies
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      console.log(`✅ Contact enriched: ${contactId}`);
      return enrichmentData;

    } catch (error) {
      console.error('❌ Failed to enrich contact:', error);
      throw error;
    }
  }

  async bulkEnrichContacts(userId: string): Promise<void> {
    try {
      console.log('🔍 Bulk enriching contacts...');

      // Get contacts that need enrichment
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .is('enriched_at', null)
        .limit(50); // Limit to avoid rate limits

      if (error) throw error;

      if (!contacts || contacts.length === 0) {
        console.log('No contacts found for enrichment');
        return;
      }

      let processed = 0;
      const batchSize = 5;

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(contact => this.enrichContact(contact.id))
        );

        processed += batch.length;
        console.log(`📊 Progress: ${processed}/${contacts.length} contacts enriched`);

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Bulk enrichment completed for ${contacts.length} contacts`);

    } catch (error) {
      console.error('❌ Failed to bulk enrich contacts:', error);
      throw error;
    }
  }

  // Deal Pipeline Management
  async createDealPipeline(userId: string, name: string, stages: Array<{
    name: string;
    probability: number;
    is_closed_won?: boolean;
    is_closed_lost?: boolean;
  }>): Promise<DealPipeline> {
    try {
      console.log(`🔄 Creating deal pipeline: ${name}`);

      // Create pipeline
      const { data: pipeline, error: pipelineError } = await supabase
        .from('deal_pipelines')
        .insert({
          user_id: userId,
          name,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (pipelineError) throw pipelineError;

      // Create stages
      const stagePromises = stages.map((stage, index) => 
        supabase
          .from('deal_stages')
          .insert({
            pipeline_id: pipeline.id,
            name: stage.name,
            order: index + 1,
            probability: stage.probability,
            is_closed_won: stage.is_closed_won || false,
            is_closed_lost: stage.is_closed_lost || false,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
      );

      const stageResults = await Promise.all(stagePromises);
      const createdStages = stageResults.map(result => result.data).filter(Boolean);

      const dealPipeline: DealPipeline = {
        id: pipeline.id,
        user_id: userId,
        name,
        stages: createdStages.map(stage => ({
          id: stage.id,
          name: stage.name,
          order: stage.order,
          probability: stage.probability,
          is_closed_won: stage.is_closed_won,
          is_closed_lost: stage.is_closed_lost
        })),
        deals: []
      };

      console.log(`✅ Deal pipeline created: ${name}`);
      return dealPipeline;

    } catch (error) {
      console.error('❌ Failed to create deal pipeline:', error);
      throw error;
    }
  }

  async createDeal(userId: string, deal: {
    title: string;
    value: number;
    contact_id: string;
    pipeline_id: string;
    stage_id: string;
    expected_close_date: Date;
  }): Promise<any> {
    try {
      console.log(`💰 Creating deal: ${deal.title}`);

      const { data, error } = await supabase
        .from('deals')
        .insert({
          user_id: userId,
          title: deal.title,
          value: deal.value,
          contact_id: deal.contact_id,
          pipeline_id: deal.pipeline_id,
          stage_id: deal.stage_id,
          expected_close_date: deal.expected_close_date.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create activity record
      await supabase
        .from('contact_interactions')
        .insert({
          user_id: userId,
          contact_id: deal.contact_id,
          interaction_type: 'deal_created',
          description: `Deal created: ${deal.title} ($${deal.value})`,
          created_at: new Date().toISOString()
        });

      console.log(`✅ Deal created: ${deal.title}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create deal:', error);
      throw error;
    }
  }

  // Automation Rules
  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'last_executed' | 'execution_count'>): Promise<AutomationRule> {
    try {
      console.log(`🤖 Creating automation rule: ${rule.name}`);

      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          user_id: rule.user_id,
          name: rule.name,
          description: rule.description,
          trigger_type: rule.trigger_type,
          trigger_conditions: rule.trigger_conditions,
          actions: rule.actions,
          is_active: rule.is_active,
          created_at: new Date().toISOString(),
          execution_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Automation rule created: ${rule.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create automation rule:', error);
      throw error;
    }
  }

  async executeAutomationRules(userId: string, trigger: string, context: Record<string, any>): Promise<void> {
    try {
      console.log(`🤖 Executing automation rules for trigger: ${trigger}`);

      // Get active automation rules for this trigger
      const { data: rules, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('trigger_type', trigger)
        .eq('is_active', true);

      if (error) throw error;

      if (!rules || rules.length === 0) {
        console.log('No automation rules found for trigger');
        return;
      }

      // Execute each rule
      for (const rule of rules) {
        try {
          // Check if trigger conditions are met
          const conditionsMet = this.evaluateConditions(rule.trigger_conditions, context);
          
          if (conditionsMet) {
            // Execute actions
            await this.executeActions(rule.actions, context);
            
            // Update execution count
            await supabase
              .from('automation_rules')
              .update({
                last_executed: new Date().toISOString(),
                execution_count: rule.execution_count + 1
              })
              .eq('id', rule.id);

            console.log(`✅ Executed automation rule: ${rule.name}`);
          }
        } catch (error) {
          console.error(`Failed to execute rule ${rule.name}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Failed to execute automation rules:', error);
    }
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    // Simple condition evaluation - would be more sophisticated in reality
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (context[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  private async executeActions(actions: Array<{ type: string; parameters: Record<string, any> }>, context: Record<string, any>): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_email':
            await this.sendAutomationEmail(action.parameters, context);
            break;
          case 'create_task':
            await this.createAutomationTask(action.parameters, context);
            break;
          case 'update_field':
            await this.updateContactField(action.parameters, context);
            break;
          case 'add_tag':
            await this.addContactTag(action.parameters, context);
            break;
          default:
            console.log(`Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private async sendAutomationEmail(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    // Implementation would integrate with email service
    console.log('📧 Sending automation email:', parameters);
  }

  private async createAutomationTask(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    // Implementation would create a task
    console.log('📋 Creating automation task:', parameters);
  }

  private async updateContactField(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    if (context.contact_id && parameters.field && parameters.value) {
      await supabase
        .from('contacts')
        .update({
          [parameters.field]: parameters.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', context.contact_id);
    }
  }

  private async addContactTag(parameters: Record<string, any>, context: Record<string, any>): Promise<void> {
    if (context.contact_id && parameters.tag) {
      // Implementation would add tag to contact
      console.log('🏷️ Adding tag to contact:', parameters.tag);
    }
  }

  // Comprehensive CRM Operations
  async initializeCRMForUser(userId: string): Promise<void> {
    try {
      console.log(`🚀 Initializing CRM for user: ${userId}`);

      // Setup default lead scoring rules
      await leadScoringService.setupDefaultScoringRules(userId);

      // Create default deal pipeline
      await this.createDealPipeline(userId, 'Sales Pipeline', [
        { name: 'Lead', probability: 10 },
        { name: 'Qualified', probability: 25 },
        { name: 'Proposal', probability: 50 },
        { name: 'Negotiation', probability: 75 },
        { name: 'Closed Won', probability: 100, is_closed_won: true },
        { name: 'Closed Lost', probability: 0, is_closed_lost: true }
      ]);

      // Create default automation rules
      await this.createAutomationRule({
        user_id: userId,
        name: 'Hot Lead Alert',
        description: 'Send alert when lead score reaches 80+',
        trigger_type: 'lead_score_change',
        trigger_conditions: { score_threshold: 80 },
        actions: [
          {
            type: 'send_email',
            parameters: {
              template: 'hot_lead_alert',
              recipient: 'sales_team'
            }
          }
        ],
        is_active: true
      });

      console.log(`✅ CRM initialization completed for user: ${userId}`);

    } catch (error) {
      console.error('❌ Failed to initialize CRM:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  async generateCRMReport(userId: string, reportType: 'leads' | 'customers' | 'deals' | 'activities', timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<any> {
    try {
      console.log(`📊 Generating ${reportType} report for ${timeframe}`);

      switch (reportType) {
        case 'leads':
          return await leadScoringService.getLeadScoringInsights(userId, timeframe);
        case 'customers':
          return await customerAnalyticsService.getCustomerMetrics(userId, timeframe);
        case 'deals':
          return await this.getDealAnalytics(userId, timeframe);
        case 'activities':
          return await this.getActivityAnalytics(userId, timeframe);
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

    } catch (error) {
      console.error('❌ Failed to generate CRM report:', error);
      throw error;
    }
  }

  private async getDealAnalytics(userId: string, timeframe: string): Promise<any> {
    // Implementation for deal analytics
    return {
      total_deals: 0,
      won_deals: 0,
      lost_deals: 0,
      win_rate: 0,
      average_deal_size: 0,
      pipeline_velocity: 0
    };
  }

  private async getActivityAnalytics(userId: string, timeframe: string): Promise<any> {
    // Implementation for activity analytics
    return {
      total_activities: 0,
      activity_types: {},
      most_active_contacts: [],
      activity_trends: []
    };
  }
}

// Export singleton instance
export const advancedCRMService = AdvancedCRMService.getInstance();
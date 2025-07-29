import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerInsight {
  id: string;
  contact_id: string;
  insight_type: 'behavior_change' | 'engagement_drop' | 'purchase_intent' | 'churn_risk' | 'upsell_opportunity' | 'lifecycle_stage';
  title: string;
  description: string;
  confidence_score: number;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  recommended_actions: string[];
  metadata: Record<string, any>;
  generated_at: Date;
  expires_at?: Date;
  acted_upon: boolean;
}

export interface CustomerSegmentAnalysis {
  segment_id: string;
  segment_name: string;
  total_contacts: number;
  avg_lead_score: number;
  conversion_rate: number;
  avg_deal_size: number;
  avg_sales_cycle: number;
  top_sources: Array<{ source: string; count: number; percentage: number }>;
  behavioral_patterns: Array<{ pattern: string; frequency: number }>;
  recommendations: string[];
}

export interface ChurnPrediction {
  contact_id: string;
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  contributing_factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommended_interventions: string[];
  predicted_churn_date?: Date;
  confidence_interval: { lower: number; upper: number };
}

export interface CustomerLifetimeValue {
  contact_id: string;
  current_value: number;
  predicted_ltv: number;
  ltv_segments: 'low' | 'medium' | 'high' | 'premium';
  value_drivers: Array<{
    driver: string;
    contribution: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
  optimization_opportunities: string[];
  confidence_score: number;
}

export interface BehavioralAnalysis {
  contact_id: string;
  engagement_score: number;
  activity_patterns: Array<{
    activity_type: string;
    frequency: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    last_occurrence: Date;
  }>;
  preferred_channels: Array<{
    channel: string;
    engagement_rate: number;
    response_rate: number;
  }>;
  optimal_contact_times: Array<{
    day_of_week: string;
    hour_of_day: number;
    engagement_probability: number;
  }>;
  content_preferences: Array<{
    content_type: string;
    engagement_score: number;
  }>;
}

export class CustomerIntelligenceService {
  private static instance: CustomerIntelligenceService;

  public static getInstance(): CustomerIntelligenceService {
    if (!CustomerIntelligenceService.instance) {
      CustomerIntelligenceService.instance = new CustomerIntelligenceService();
    }
    return CustomerIntelligenceService.instance;
  }

  // Customer Insights Generation
  async generateCustomerInsights(contactId: string): Promise<CustomerInsight[]> {
    try {
      const insights: CustomerInsight[] = [];

      // Get contact data and behavioral history
      const [contact, behavioralSignals, interactions] = await Promise.all([
        this.getContactData(contactId),
        this.getBehavioralSignals(contactId),
        this.getContactInteractions(contactId)
      ]);

      // Generate different types of insights
      const [
        behaviorInsights,
        engagementInsights,
        purchaseIntentInsights,
        churnRiskInsights,
        upsellInsights
      ] = await Promise.all([
        this.analyzeBehaviorChanges(contact, behavioralSignals),
        this.analyzeEngagementPatterns(contact, interactions),
        this.analyzePurchaseIntent(contact, behavioralSignals),
        this.analyzeChurnRisk(contact, behavioralSignals, interactions),
        this.analyzeUpsellOpportunities(contact, behavioralSignals)
      ]);

      insights.push(
        ...behaviorInsights,
        ...engagementInsights,
        ...purchaseIntentInsights,
        ...churnRiskInsights,
        ...upsellInsights
      );

      // Store insights in database
      for (const insight of insights) {
        await this.storeInsight(insight);
      }

      console.log(`✅ Generated ${insights.length} insights for contact ${contactId}`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to generate customer insights:', error);
      throw error;
    }
  }

  private async analyzeBehaviorChanges(contact: any, signals: any[]): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    // Analyze recent vs historical behavior
    const recentSignals = signals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );
    const historicalSignals = signals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() >= 7 * 24 * 60 * 60 * 1000
    );

    const recentActivity = recentSignals.length;
    const historicalAverage = historicalSignals.length / Math.max(1, historicalSignals.length / 7);

    if (recentActivity > historicalAverage * 1.5) {
      insights.push({
        id: `behavior_increase_${contact.id}`,
        contact_id: contact.id,
        insight_type: 'behavior_change',
        title: 'Increased Activity Detected',
        description: `Contact has shown ${Math.round((recentActivity / historicalAverage - 1) * 100)}% increase in activity over the past week`,
        confidence_score: 0.85,
        impact_level: 'high',
        recommended_actions: [
          'Reach out with personalized content',
          'Schedule a follow-up call',
          'Send relevant product information'
        ],
        metadata: {
          recent_activity: recentActivity,
          historical_average: historicalAverage,
          increase_percentage: Math.round((recentActivity / historicalAverage - 1) * 100)
        },
        generated_at: new Date(),
        acted_upon: false
      });
    }

    return insights;
  }

  private async analyzeEngagementPatterns(contact: any, interactions: any[]): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    const recentInteractions = interactions.filter(i => 
      Date.now() - new Date(i.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
    );

    if (recentInteractions.length === 0 && interactions.length > 0) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - new Date(interactions[0].created_at).getTime()) / (24 * 60 * 60 * 1000)
      );

      insights.push({
        id: `engagement_drop_${contact.id}`,
        contact_id: contact.id,
        insight_type: 'engagement_drop',
        title: 'Engagement Drop Detected',
        description: `No interactions in the past ${daysSinceLastInteraction} days`,
        confidence_score: 0.9,
        impact_level: daysSinceLastInteraction > 60 ? 'critical' : 'high',
        recommended_actions: [
          'Send re-engagement campaign',
          'Offer valuable content or incentive',
          'Check contact preferences'
        ],
        metadata: {
          days_since_last_interaction: daysSinceLastInteraction,
          total_historical_interactions: interactions.length
        },
        generated_at: new Date(),
        acted_upon: false
      });
    }

    return insights;
  }

  private async analyzePurchaseIntent(contact: any, signals: any[]): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    const purchaseSignals = signals.filter(s => 
      ['pricing_page_visit', 'demo_request', 'product_comparison'].includes(s.signal_type)
    );

    const recentPurchaseSignals = purchaseSignals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentPurchaseSignals.length >= 2) {
      insights.push({
        id: `purchase_intent_${contact.id}`,
        contact_id: contact.id,
        insight_type: 'purchase_intent',
        title: 'High Purchase Intent Detected',
        description: `Contact has shown ${recentPurchaseSignals.length} purchase-related behaviors in the past week`,
        confidence_score: 0.88,
        impact_level: 'critical',
        recommended_actions: [
          'Schedule immediate sales call',
          'Send personalized proposal',
          'Offer limited-time incentive'
        ],
        metadata: {
          purchase_signals: recentPurchaseSignals.map(s => s.signal_type),
          signal_count: recentPurchaseSignals.length
        },
        generated_at: new Date(),
        acted_upon: false
      });
    }

    return insights;
  }

  private async analyzeChurnRisk(contact: any, signals: any[], interactions: any[]): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    // Calculate churn risk based on multiple factors
    let riskScore = 0;
    const riskFactors: string[] = [];

    // Factor 1: Declining engagement
    const recentEngagement = signals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
    ).length;
    
    const historicalEngagement = signals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() >= 30 * 24 * 60 * 60 * 1000 &&
      Date.now() - new Date(s.timestamp).getTime() < 60 * 24 * 60 * 60 * 1000
    ).length;

    if (recentEngagement < historicalEngagement * 0.5) {
      riskScore += 30;
      riskFactors.push('Significant decline in engagement');
    }

    // Factor 2: No recent interactions
    const daysSinceLastInteraction = interactions.length > 0 
      ? Math.floor((Date.now() - new Date(interactions[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    if (daysSinceLastInteraction > 45) {
      riskScore += 25;
      riskFactors.push('No recent interactions');
    }

    // Factor 3: Low lead score
    if (contact.lead_score < 30) {
      riskScore += 20;
      riskFactors.push('Low lead score');
    }

    if (riskScore >= 50) {
      const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 60 ? 'high' : 'medium';
      
      insights.push({
        id: `churn_risk_${contact.id}`,
        contact_id: contact.id,
        insight_type: 'churn_risk',
        title: `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Churn Risk`,
        description: `Contact has ${riskScore}% churn risk based on recent behavior patterns`,
        confidence_score: 0.82,
        impact_level: riskLevel as 'medium' | 'high' | 'critical',
        recommended_actions: [
          'Immediate outreach to understand concerns',
          'Offer value-added services',
          'Schedule retention call'
        ],
        metadata: {
          risk_score: riskScore,
          risk_factors: riskFactors,
          days_since_last_interaction: daysSinceLastInteraction
        },
        generated_at: new Date(),
        acted_upon: false
      });
    }

    return insights;
  }

  private async analyzeUpsellOpportunities(contact: any, signals: any[]): Promise<CustomerInsight[]> {
    const insights: CustomerInsight[] = [];

    // Look for signals indicating readiness for upsell
    const engagementSignals = signals.filter(s => 
      ['feature_usage', 'advanced_content_view', 'integration_setup'].includes(s.signal_type)
    );

    const recentEngagement = engagementSignals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() < 14 * 24 * 60 * 60 * 1000
    );

    if (recentEngagement.length >= 3 && contact.lead_score > 70) {
      insights.push({
        id: `upsell_opportunity_${contact.id}`,
        contact_id: contact.id,
        insight_type: 'upsell_opportunity',
        title: 'Upsell Opportunity Identified',
        description: 'Contact shows high engagement and readiness for advanced features',
        confidence_score: 0.75,
        impact_level: 'high',
        recommended_actions: [
          'Present premium feature benefits',
          'Schedule product demo for advanced features',
          'Offer trial of premium tier'
        ],
        metadata: {
          engagement_signals: recentEngagement.length,
          lead_score: contact.lead_score,
          signal_types: recentEngagement.map(s => s.signal_type)
        },
        generated_at: new Date(),
        acted_upon: false
      });
    }

    return insights;
  }

  // Churn Prediction
  async predictChurn(contactId: string): Promise<ChurnPrediction> {
    try {
      const [contact, signals, interactions] = await Promise.all([
        this.getContactData(contactId),
        this.getBehavioralSignals(contactId),
        this.getContactInteractions(contactId)
      ]);

      // Calculate churn probability using multiple factors
      const factors = await this.calculateChurnFactors(contact, signals, interactions);
      const churnProbability = this.calculateChurnProbability(factors);
      
      const riskLevel = this.determineRiskLevel(churnProbability);
      const interventions = this.getChurnInterventions(riskLevel, factors);

      const prediction: ChurnPrediction = {
        contact_id: contactId,
        churn_probability,
        risk_level: riskLevel,
        contributing_factors: factors,
        recommended_interventions: interventions,
        predicted_churn_date: this.predictChurnDate(churnProbability),
        confidence_interval: this.calculateConfidenceInterval(churnProbability)
      };

      // Store prediction
      await enhancedSupabaseService.createPrediction({
        user_id: contact.user_id,
        prediction_type: 'churn',
        entity_type: 'contact',
        entity_id: contactId,
        prediction_data: prediction,
        confidence_score: 0.85,
        prediction_horizon: '90_days',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });

      return prediction;

    } catch (error) {
      console.error('❌ Failed to predict churn:', error);
      throw error;
    }
  }

  private async calculateChurnFactors(contact: any, signals: any[], interactions: any[]): Promise<Array<{
    factor: string;
    impact: number;
    description: string;
  }>> {
    const factors = [];

    // Engagement decline
    const recentEngagement = signals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
    ).length;
    
    const historicalEngagement = signals.filter(s => 
      Date.now() - new Date(s.timestamp).getTime() >= 30 * 24 * 60 * 60 * 1000 &&
      Date.now() - new Date(s.timestamp).getTime() < 60 * 24 * 60 * 60 * 1000
    ).length;

    if (historicalEngagement > 0) {
      const engagementChange = (recentEngagement - historicalEngagement) / historicalEngagement;
      if (engagementChange < -0.3) {
        factors.push({
          factor: 'engagement_decline',
          impact: Math.abs(engagementChange) * 40,
          description: `${Math.round(Math.abs(engagementChange) * 100)}% decrease in engagement over past 30 days`
        });
      }
    }

    // Interaction recency
    const daysSinceLastInteraction = interactions.length > 0 
      ? Math.floor((Date.now() - new Date(interactions[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    if (daysSinceLastInteraction > 30) {
      factors.push({
        factor: 'interaction_recency',
        impact: Math.min(daysSinceLastInteraction / 2, 35),
        description: `${daysSinceLastInteraction} days since last interaction`
      });
    }

    // Lead score
    if (contact.lead_score < 40) {
      factors.push({
        factor: 'low_lead_score',
        impact: (40 - contact.lead_score) / 2,
        description: `Low lead score of ${contact.lead_score}`
      });
    }

    return factors;
  }

  private calculateChurnProbability(factors: Array<{ factor: string; impact: number; description: string }>): number {
    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    return Math.min(totalImpact / 100, 0.95); // Cap at 95%
  }

  private determineRiskLevel(probability: number): 'low' | 'medium' | 'high' | 'critical' {
    if (probability >= 0.8) return 'critical';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  }

  private getChurnInterventions(riskLevel: string, factors: any[]): string[] {
    const interventions = [];

    switch (riskLevel) {
      case 'critical':
        interventions.push('Immediate personal outreach from account manager');
        interventions.push('Offer significant value or discount');
        interventions.push('Schedule emergency retention call');
        break;
      case 'high':
        interventions.push('Proactive outreach within 24 hours');
        interventions.push('Provide additional value or training');
        interventions.push('Address specific concerns');
        break;
      case 'medium':
        interventions.push('Send re-engagement campaign');
        interventions.push('Offer helpful resources');
        interventions.push('Check in via email');
        break;
      case 'low':
        interventions.push('Continue regular nurturing');
        interventions.push('Monitor for changes');
        break;
    }

    // Add factor-specific interventions
    factors.forEach(factor => {
      switch (factor.factor) {
        case 'engagement_decline':
          interventions.push('Send personalized content based on interests');
          break;
        case 'interaction_recency':
          interventions.push('Reach out through preferred communication channel');
          break;
        case 'low_lead_score':
          interventions.push('Provide educational content to increase engagement');
          break;
      }
    });

    return [...new Set(interventions)]; // Remove duplicates
  }

  private predictChurnDate(probability: number): Date | undefined {
    if (probability < 0.3) return undefined;
    
    // Estimate churn date based on probability
    const daysToChurn = Math.round((1 - probability) * 180); // 0-180 days
    return new Date(Date.now() + daysToChurn * 24 * 60 * 60 * 1000);
  }

  private calculateConfidenceInterval(probability: number): { lower: number; upper: number } {
    const margin = 0.1; // 10% margin of error
    return {
      lower: Math.max(0, probability - margin),
      upper: Math.min(1, probability + margin)
    };
  }

  // Customer Lifetime Value Calculation
  async calculateCustomerLTV(contactId: string): Promise<CustomerLifetimeValue> {
    try {
      const ltv = await enhancedSupabaseService.calculateCustomerLTV(contactId);
      
      const [contact, deals] = await Promise.all([
        this.getContactData(contactId),
        this.getContactDeals(contactId)
      ]);

      const currentValue = deals.reduce((sum, deal) => 
        deal.status === 'won' ? sum + deal.value : sum, 0
      );

      const ltvSegment = this.determineLTVSegment(ltv);
      const valueDrivers = await this.analyzeValueDrivers(contact, deals);
      const optimizationOpportunities = this.getOptimizationOpportunities(ltvSegment, valueDrivers);

      return {
        contact_id: contactId,
        current_value: currentValue,
        predicted_ltv: ltv,
        ltv_segments: ltvSegment,
        value_drivers: valueDrivers,
        optimization_opportunities: optimizationOpportunities,
        confidence_score: 0.82
      };

    } catch (error) {
      console.error('❌ Failed to calculate customer LTV:', error);
      throw error;
    }
  }

  private determineLTVSegment(ltv: number): 'low' | 'medium' | 'high' | 'premium' {
    if (ltv >= 50000) return 'premium';
    if (ltv >= 20000) return 'high';
    if (ltv >= 5000) return 'medium';
    return 'low';
  }

  private async analyzeValueDrivers(contact: any, deals: any[]): Promise<Array<{
    driver: string;
    contribution: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>> {
    // Analyze what drives value for this customer
    return [
      {
        driver: 'Deal Size',
        contribution: 0.4,
        trend: 'stable'
      },
      {
        driver: 'Purchase Frequency',
        contribution: 0.3,
        trend: 'increasing'
      },
      {
        driver: 'Engagement Level',
        contribution: 0.3,
        trend: 'stable'
      }
    ];
  }

  private getOptimizationOpportunities(segment: string, drivers: any[]): string[] {
    const opportunities = [];

    switch (segment) {
      case 'premium':
        opportunities.push('Offer VIP services and exclusive features');
        opportunities.push('Provide dedicated account management');
        break;
      case 'high':
        opportunities.push('Upsell to premium tier');
        opportunities.push('Increase engagement with advanced features');
        break;
      case 'medium':
        opportunities.push('Focus on increasing purchase frequency');
        opportunities.push('Provide value-added services');
        break;
      case 'low':
        opportunities.push('Improve engagement through education');
        opportunities.push('Identify expansion opportunities');
        break;
    }

    return opportunities;
  }

  // Helper methods
  private async getContactData(contactId: string): Promise<any> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getBehavioralSignals(contactId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('behavioral_signals')
      .select('*')
      .eq('contact_id', contactId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  private async getContactInteractions(contactId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  private async getContactDeals(contactId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async storeInsight(insight: CustomerInsight): Promise<void> {
    try {
      await supabase
        .from('customer_intelligence')
        .insert({
          contact_id: insight.contact_id,
          intelligence_type: insight.insight_type,
          data: {
            title: insight.title,
            description: insight.description,
            recommended_actions: insight.recommended_actions,
            metadata: insight.metadata
          },
          confidence_score: insight.confidence_score,
          source: 'automated_analysis',
          expires_at: insight.expires_at?.toISOString()
        });
    } catch (error) {
      console.error('Failed to store insight:', error);
    }
  }

  // Bulk Operations
  async generateInsightsForAllContacts(userId: string): Promise<void> {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      let processed = 0;
      for (const contact of contacts || []) {
        try {
          await this.generateCustomerInsights(contact.id);
          processed++;
        } catch (error) {
          console.error(`Failed to generate insights for contact ${contact.id}:`, error);
        }
      }

      console.log(`✅ Generated insights for ${processed}/${contacts?.length || 0} contacts`);

    } catch (error) {
      console.error('❌ Failed to generate insights for all contacts:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const customerIntelligenceService = CustomerIntelligenceService.getInstance();
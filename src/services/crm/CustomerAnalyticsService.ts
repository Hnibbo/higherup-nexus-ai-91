import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { supabase } from '@/integrations/supabase/client';
import { customerIntelligenceService } from './CustomerIntelligenceService';
import { predictiveAnalyticsService } from './PredictiveAnalyticsService';

export interface CustomerMetrics {
  total_customers: number;
  new_customers_this_month: number;
  churn_rate: number;
  average_ltv: number;
  customer_acquisition_cost: number;
  monthly_recurring_revenue: number;
  customer_satisfaction_score: number;
  net_promoter_score: number;
}

export interface CustomerSegmentMetrics {
  segment_id: string;
  segment_name: string;
  customer_count: number;
  percentage_of_total: number;
  average_ltv: number;
  churn_rate: number;
  conversion_rate: number;
  engagement_score: number;
  revenue_contribution: number;
}

export interface CustomerJourneyAnalytics {
  stage: string;
  customer_count: number;
  average_time_in_stage: number;
  conversion_rate_to_next: number;
  drop_off_rate: number;
  common_actions: string[];
  optimization_opportunities: string[];
}

export interface CustomerBehaviorInsights {
  most_engaged_segments: string[];
  at_risk_customers: Array<{
    contact_id: string;
    name: string;
    churn_probability: number;
    risk_factors: string[];
  }>;
  high_value_opportunities: Array<{
    contact_id: string;
    name: string;
    predicted_ltv: number;
    recommended_actions: string[];
  }>;
  engagement_trends: Array<{
    date: string;
    email_engagement: number;
    website_engagement: number;
    overall_engagement: number;
  }>;
}

export interface CustomerHealthScore {
  contact_id: string;
  overall_score: number;
  engagement_score: number;
  satisfaction_score: number;
  usage_score: number;
  support_score: number;
  payment_score: number;
  trend: 'improving' | 'stable' | 'declining';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_updated: Date;
}

export interface CustomerCohortAnalysis {
  cohort_month: string;
  customer_count: number;
  retention_rates: Record<string, number>; // month_1, month_2, etc.
  revenue_per_cohort: Record<string, number>;
  ltv_by_cohort: number;
}

export class CustomerAnalyticsService {
  private static instance: CustomerAnalyticsService;

  private constructor() {}

  public static getInstance(): CustomerAnalyticsService {
    if (!CustomerAnalyticsService.instance) {
      CustomerAnalyticsService.instance = new CustomerAnalyticsService();
    }
    return CustomerAnalyticsService.instance;
  }

  // Customer Metrics
  async getCustomerMetrics(userId: string, timeframe: 'month' | 'quarter' | 'year' = 'month'): Promise<CustomerMetrics> {
    try {
      console.log(`📊 Calculating customer metrics for timeframe: ${timeframe}`);

      const timeframeDays = timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

      // Get total customers
      const { data: totalCustomers, error: totalError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'customer');

      if (totalError) throw totalError;

      // Get new customers this period
      const { data: newCustomers, error: newError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'customer')
        .gte('created_at', startDate.toISOString());

      if (newError) throw newError;

      // Calculate churn rate
      const churnRate = await this.calculateChurnRate(userId, timeframeDays);

      // Calculate average LTV
      const averageLTV = await this.calculateAverageLTV(userId);

      // Get customer acquisition cost (mock for now)
      const customerAcquisitionCost = 150; // This would be calculated from marketing spend

      // Calculate MRR (mock for now)
      const monthlyRecurringRevenue = (totalCustomers?.length || 0) * 99; // Assuming $99/month average

      // Get satisfaction scores (mock for now)
      const customerSatisfactionScore = 4.2;
      const netPromoterScore = 42;

      return {
        total_customers: totalCustomers?.length || 0,
        new_customers_this_month: newCustomers?.length || 0,
        churn_rate: churnRate,
        average_ltv: averageLTV,
        customer_acquisition_cost: customerAcquisitionCost,
        monthly_recurring_revenue: monthlyRecurringRevenue,
        customer_satisfaction_score: customerSatisfactionScore,
        net_promoter_score: netPromoterScore
      };

    } catch (error) {
      console.error('❌ Failed to get customer metrics:', error);
      throw error;
    }
  }

  private async calculateChurnRate(userId: string, days: number): Promise<number> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get customers who churned in the period
      const { data: churnedCustomers, error: churnError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'churned')
        .gte('updated_at', startDate.toISOString());

      if (churnError) throw churnError;

      // Get total customers at start of period
      const { data: totalCustomers, error: totalError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'customer');

      if (totalError) throw totalError;

      const churnedCount = churnedCustomers?.length || 0;
      const totalCount = totalCustomers?.length || 1; // Avoid division by zero

      return (churnedCount / totalCount) * 100;

    } catch (error) {
      console.error('Failed to calculate churn rate:', error);
      return 0;
    }
  }

  private async calculateAverageLTV(userId: string): Promise<number> {
    try {
      // Get LTV predictions for all customers
      const { data: ltvPredictions, error } = await supabase
        .from('predictive_analytics')
        .select('prediction_data')
        .eq('prediction_type', 'lifetime_value')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      if (!ltvPredictions || ltvPredictions.length === 0) {
        return 2500; // Default LTV estimate
      }

      const totalLTV = ltvPredictions.reduce((sum, prediction) => {
        return sum + (prediction.prediction_data?.value || 0);
      }, 0);

      return totalLTV / ltvPredictions.length;

    } catch (error) {
      console.error('Failed to calculate average LTV:', error);
      return 2500; // Default fallback
    }
  }

  // Customer Segmentation Analytics
  async getCustomerSegmentMetrics(userId: string): Promise<CustomerSegmentMetrics[]> {
    try {
      console.log('📊 Analyzing customer segment metrics');

      // Get all segments
      const { data: segments, error: segmentsError } = await supabase
        .from('contact_segments')
        .select('*')
        .eq('user_id', userId);

      if (segmentsError) throw segmentsError;

      const segmentMetrics: CustomerSegmentMetrics[] = [];

      for (const segment of segments || []) {
        // Get contacts in segment
        const contacts = await enhancedSupabaseService.getContactsInSegment(segment.id, userId);
        const customerContacts = contacts.filter(c => c.status === 'customer');

        // Calculate metrics for this segment
        const segmentAnalysis = await customerIntelligenceService.analyzeCustomerSegment(segment.id);

        segmentMetrics.push({
          segment_id: segment.id,
          segment_name: segment.name,
          customer_count: customerContacts.length,
          percentage_of_total: 0, // Will be calculated after all segments
          average_ltv: segmentAnalysis.average_lifetime_value,
          churn_rate: segmentAnalysis.average_churn_risk * 100,
          conversion_rate: segmentAnalysis.conversion_rate,
          engagement_score: segmentAnalysis.engagement_level,
          revenue_contribution: customerContacts.length * segmentAnalysis.average_lifetime_value
        });
      }

      // Calculate percentages
      const totalCustomers = segmentMetrics.reduce((sum, segment) => sum + segment.customer_count, 0);
      segmentMetrics.forEach(segment => {
        segment.percentage_of_total = totalCustomers > 0 ? (segment.customer_count / totalCustomers) * 100 : 0;
      });

      return segmentMetrics.sort((a, b) => b.customer_count - a.customer_count);

    } catch (error) {
      console.error('❌ Failed to get customer segment metrics:', error);
      throw error;
    }
  }

  // Customer Journey Analytics
  async getCustomerJourneyAnalytics(userId: string): Promise<CustomerJourneyAnalytics[]> {
    try {
      console.log('📊 Analyzing customer journey');

      const journeyStages = [
        'discovery',
        'awareness', 
        'consideration',
        'decision',
        'onboarding',
        'adoption',
        'growth',
        'mature'
      ];

      const journeyAnalytics: CustomerJourneyAnalytics[] = [];

      for (let i = 0; i < journeyStages.length; i++) {
        const stage = journeyStages[i];
        const nextStage = journeyStages[i + 1];

        // Get contacts in current stage
        const { data: stageContacts, error: stageError } = await supabase
          .from('contacts')
          .select('id, created_at, updated_at')
          .eq('user_id', userId)
          .eq('journey_stage', stage);

        if (stageError) throw stageError;

        // Calculate average time in stage
        const averageTimeInStage = this.calculateAverageTimeInStage(stageContacts || []);

        // Calculate conversion rate to next stage
        let conversionRate = 0;
        if (nextStage) {
          const { data: nextStageContacts, error: nextError } = await supabase
            .from('contacts')
            .select('id')
            .eq('user_id', userId)
            .eq('journey_stage', nextStage);

          if (!nextError && nextStageContacts) {
            const currentCount = stageContacts?.length || 0;
            const nextCount = nextStageContacts.length;
            conversionRate = currentCount > 0 ? (nextCount / (currentCount + nextCount)) * 100 : 0;
          }
        }

        // Get common actions for this stage
        const commonActions = await this.getCommonActionsForStage(userId, stage);

        // Generate optimization opportunities
        const optimizationOpportunities = this.generateOptimizationOpportunities(stage, conversionRate, averageTimeInStage);

        journeyAnalytics.push({
          stage,
          customer_count: stageContacts?.length || 0,
          average_time_in_stage: averageTimeInStage,
          conversion_rate_to_next: conversionRate,
          drop_off_rate: 100 - conversionRate,
          common_actions: commonActions,
          optimization_opportunities: optimizationOpportunities
        });
      }

      return journeyAnalytics;

    } catch (error) {
      console.error('❌ Failed to get customer journey analytics:', error);
      throw error;
    }
  }

  private calculateAverageTimeInStage(contacts: any[]): number {
    if (contacts.length === 0) return 0;

    const totalTime = contacts.reduce((sum, contact) => {
      const created = new Date(contact.created_at);
      const updated = new Date(contact.updated_at);
      return sum + (updated.getTime() - created.getTime());
    }, 0);

    return Math.floor(totalTime / contacts.length / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private async getCommonActionsForStage(userId: string, stage: string): Promise<string[]> {
    // This would analyze interaction data to find common actions
    // For now, returning stage-appropriate mock data
    const stageActions: Record<string, string[]> = {
      discovery: ['Website visit', 'Blog read', 'Social media interaction'],
      awareness: ['Content download', 'Newsletter signup', 'Webinar attendance'],
      consideration: ['Demo request', 'Pricing page visit', 'Feature comparison'],
      decision: ['Trial signup', 'Sales call', 'Proposal review'],
      onboarding: ['Account setup', 'Initial training', 'First use'],
      adoption: ['Feature exploration', 'Integration setup', 'Team invitation'],
      growth: ['Advanced feature use', 'Workflow automation', 'API usage'],
      mature: ['Regular usage', 'Support interaction', 'Renewal discussion']
    };

    return stageActions[stage] || [];
  }

  private generateOptimizationOpportunities(stage: string, conversionRate: number, averageTime: number): string[] {
    const opportunities: string[] = [];

    if (conversionRate < 20) {
      opportunities.push(`Low conversion rate from ${stage} - review messaging and offers`);
    }

    if (averageTime > 30) {
      opportunities.push(`Long time in ${stage} - consider more proactive outreach`);
    }

    if (stage === 'consideration' && conversionRate < 30) {
      opportunities.push('Add social proof and testimonials to consideration stage');
    }

    if (stage === 'decision' && averageTime > 14) {
      opportunities.push('Streamline decision process with clearer next steps');
    }

    return opportunities;
  }

  // Customer Behavior Insights
  async getCustomerBehaviorInsights(userId: string): Promise<CustomerBehaviorInsights> {
    try {
      console.log('🔍 Analyzing customer behavior insights');

      // Get most engaged segments
      const segmentMetrics = await this.getCustomerSegmentMetrics(userId);
      const mostEngagedSegments = segmentMetrics
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 3)
        .map(s => s.segment_name);

      // Get at-risk customers
      const { data: churnPredictions, error: churnError } = await supabase
        .from('predictive_analytics')
        .select('entity_id, prediction_data, confidence_score')
        .eq('prediction_type', 'churn')
        .gt('prediction_data->value', 0.5)
        .gt('expires_at', new Date().toISOString())
        .order('prediction_data->value', { ascending: false })
        .limit(10);

      if (churnError) throw churnError;

      const atRiskCustomers = await Promise.all(
        (churnPredictions || []).map(async prediction => {
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('id', prediction.entity_id)
            .single();

          return {
            contact_id: prediction.entity_id,
            name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
            churn_probability: prediction.prediction_data.value,
            risk_factors: prediction.prediction_data.explanation || []
          };
        })
      );

      // Get high-value opportunities
      const { data: ltvPredictions, error: ltvError } = await supabase
        .from('predictive_analytics')
        .select('entity_id, prediction_data')
        .eq('prediction_type', 'lifetime_value')
        .gt('prediction_data->value', 5000)
        .gt('expires_at', new Date().toISOString())
        .order('prediction_data->value', { ascending: false })
        .limit(10);

      if (ltvError) throw ltvError;

      const highValueOpportunities = await Promise.all(
        (ltvPredictions || []).map(async prediction => {
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email')
            .eq('id', prediction.entity_id)
            .single();

          return {
            contact_id: prediction.entity_id,
            name: contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown',
            predicted_ltv: prediction.prediction_data.value,
            recommended_actions: [
              'Assign dedicated account manager',
              'Offer premium support',
              'Explore upsell opportunities'
            ]
          };
        })
      );

      // Generate engagement trends (mock data for now)
      const engagementTrends = this.generateEngagementTrends();

      return {
        most_engaged_segments: mostEngagedSegments,
        at_risk_customers: atRiskCustomers,
        high_value_opportunities: highValueOpportunities,
        engagement_trends: engagementTrends
      };

    } catch (error) {
      console.error('❌ Failed to get customer behavior insights:', error);
      throw error;
    }
  }

  private generateEngagementTrends(): Array<{
    date: string;
    email_engagement: number;
    website_engagement: number;
    overall_engagement: number;
  }> {
    const trends = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic trending data
      const baseEmail = 0.35;
      const baseWebsite = 0.45;
      const variation = (Math.random() - 0.5) * 0.1;
      
      const emailEngagement = Math.max(0, Math.min(1, baseEmail + variation));
      const websiteEngagement = Math.max(0, Math.min(1, baseWebsite + variation));
      const overallEngagement = (emailEngagement + websiteEngagement) / 2;

      trends.push({
        date: date.toISOString().split('T')[0],
        email_engagement: Math.round(emailEngagement * 100) / 100,
        website_engagement: Math.round(websiteEngagement * 100) / 100,
        overall_engagement: Math.round(overallEngagement * 100) / 100
      });
    }

    return trends;
  }

  // Customer Health Scoring
  async calculateCustomerHealthScore(contactId: string): Promise<CustomerHealthScore> {
    try {
      console.log(`💊 Calculating health score for contact: ${contactId}`);

      // Get contact data
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;

      // Calculate individual scores
      const engagementScore = await this.calculateEngagementHealthScore(contactId);
      const satisfactionScore = await this.calculateSatisfactionHealthScore(contactId);
      const usageScore = await this.calculateUsageHealthScore(contactId);
      const supportScore = await this.calculateSupportHealthScore(contactId);
      const paymentScore = await this.calculatePaymentHealthScore(contactId);

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (engagementScore * 0.3) +
        (satisfactionScore * 0.2) +
        (usageScore * 0.25) +
        (supportScore * 0.15) +
        (paymentScore * 0.1)
      );

      // Determine trend and risk level
      const trend = this.determineTrend(overallScore, contactId);
      const riskLevel = this.determineRiskLevel(overallScore);

      return {
        contact_id: contactId,
        overall_score: overallScore,
        engagement_score: engagementScore,
        satisfaction_score: satisfactionScore,
        usage_score: usageScore,
        support_score: supportScore,
        payment_score: paymentScore,
        trend,
        risk_level: riskLevel,
        last_updated: new Date()
      };

    } catch (error) {
      console.error('❌ Failed to calculate customer health score:', error);
      throw error;
    }
  }

  private async calculateEngagementHealthScore(contactId: string): Promise<number> {
    // Get recent engagement data
    const { data: signals, error } = await supabase
      .from('behavioral_signals')
      .select('signal_type, timestamp')
      .eq('contact_id', contactId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) return 50; // Default score

    const signalCounts = {
      email_open: 0,
      email_click: 0,
      website_visit: 0,
      content_download: 0
    };

    signals?.forEach(signal => {
      if (signalCounts.hasOwnProperty(signal.signal_type)) {
        signalCounts[signal.signal_type as keyof typeof signalCounts]++;
      }
    });

    // Calculate score based on engagement levels
    let score = 0;
    score += Math.min(signalCounts.email_open * 2, 20);
    score += Math.min(signalCounts.email_click * 5, 25);
    score += Math.min(signalCounts.website_visit * 3, 30);
    score += Math.min(signalCounts.content_download * 8, 25);

    return Math.min(score, 100);
  }

  private async calculateSatisfactionHealthScore(contactId: string): Promise<number> {
    // This would typically come from surveys, NPS scores, etc.
    // For now, returning a score based on sentiment analysis
    const { data: insights, error } = await supabase
      .from('customer_intelligence')
      .select('data')
      .eq('contact_id', contactId)
      .eq('intelligence_type', 'sentiment_analysis')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !insights) return 75; // Default score

    const sentimentScore = insights.data?.sentiment_score || 0;
    return Math.max(0, Math.min(100, Math.round((sentimentScore + 1) * 50)));
  }

  private async calculateUsageHealthScore(contactId: string): Promise<number> {
    // This would analyze product usage data
    // For now, returning score based on interaction frequency
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('interaction_count, last_interaction_at')
      .eq('id', contactId)
      .single();

    if (error) return 50;

    const interactionCount = contact.interaction_count || 0;
    const lastInteraction = contact.last_interaction_at 
      ? new Date(contact.last_interaction_at)
      : null;

    let score = Math.min(interactionCount * 2, 60);

    if (lastInteraction) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastInteraction <= 7) score += 40;
      else if (daysSinceLastInteraction <= 14) score += 30;
      else if (daysSinceLastInteraction <= 30) score += 20;
      else score += 10;
    }

    return Math.min(score, 100);
  }

  private async calculateSupportHealthScore(contactId: string): Promise<number> {
    // This would analyze support ticket data
    // For now, returning a default good score
    return 85;
  }

  private async calculatePaymentHealthScore(contactId: string): Promise<number> {
    // This would analyze payment history, late payments, etc.
    // For now, returning a default good score
    return 90;
  }

  private determineTrend(currentScore: number, contactId: string): 'improving' | 'stable' | 'declining' {
    // This would compare with historical scores
    // For now, returning based on current score
    if (currentScore >= 80) return 'stable';
    if (currentScore >= 60) return 'stable';
    return 'declining';
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  // Cohort Analysis
  async getCohortAnalysis(userId: string, months: number = 12): Promise<CustomerCohortAnalysis[]> {
    try {
      console.log(`📊 Performing cohort analysis for ${months} months`);

      const cohorts: CustomerCohortAnalysis[] = [];
      const today = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const cohortDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextCohortDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        // Get customers who joined in this cohort month
        const { data: cohortCustomers, error } = await supabase
          .from('contacts')
          .select('id, created_at')
          .eq('user_id', userId)
          .eq('status', 'customer')
          .gte('created_at', cohortDate.toISOString())
          .lt('created_at', nextCohortDate.toISOString());

        if (error) throw error;

        const customerCount = cohortCustomers?.length || 0;
        
        if (customerCount === 0) {
          cohorts.push({
            cohort_month: cohortDate.toISOString().substring(0, 7),
            customer_count: 0,
            retention_rates: {},
            revenue_per_cohort: {},
            ltv_by_cohort: 0
          });
          continue;
        }

        // Calculate retention rates for each subsequent month
        const retentionRates: Record<string, number> = {};
        const revenuePerCohort: Record<string, number> = {};

        for (let month = 1; month <= Math.min(12, months - i); month++) {
          const checkDate = new Date(cohortDate);
          checkDate.setMonth(checkDate.getMonth() + month);

          // For now, using mock retention data
          // In reality, this would check actual customer status at each month
          const retentionRate = Math.max(0.2, 1 - (month * 0.1) - Math.random() * 0.1);
          retentionRates[`month_${month}`] = Math.round(retentionRate * 100) / 100;
          
          const monthlyRevenue = customerCount * retentionRate * 99; // $99 average monthly
          revenuePerCohort[`month_${month}`] = Math.round(monthlyRevenue);
        }

        // Calculate LTV for this cohort
        const ltvByCohort = Object.values(revenuePerCohort).reduce((sum, revenue) => sum + revenue, 0) / customerCount;

        cohorts.push({
          cohort_month: cohortDate.toISOString().substring(0, 7),
          customer_count: customerCount,
          retention_rates: retentionRates,
          revenue_per_cohort: revenuePerCohort,
          ltv_by_cohort: Math.round(ltvByCohort)
        });
      }

      return cohorts;

    } catch (error) {
      console.error('❌ Failed to get cohort analysis:', error);
      throw error;
    }
  }

  // Bulk Health Score Calculation
  async bulkCalculateHealthScores(userId: string): Promise<void> {
    try {
      console.log('💊 Bulk calculating customer health scores...');

      // Get all customers
      const { data: customers, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'customer');

      if (error) throw error;

      if (!customers || customers.length === 0) {
        console.log('No customers found for health score calculation');
        return;
      }

      let processed = 0;
      const batchSize = 10;

      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async customer => {
            try {
              const healthScore = await this.calculateCustomerHealthScore(customer.id);
              
              // Store health score
              await supabase
                .from('customer_health_scores')
                .upsert({
                  contact_id: customer.id,
                  overall_score: healthScore.overall_score,
                  engagement_score: healthScore.engagement_score,
                  satisfaction_score: healthScore.satisfaction_score,
                  usage_score: healthScore.usage_score,
                  support_score: healthScore.support_score,
                  payment_score: healthScore.payment_score,
                  trend: healthScore.trend,
                  risk_level: healthScore.risk_level,
                  calculated_at: new Date().toISOString()
                });
                
            } catch (error) {
              console.error(`Failed to calculate health score for customer ${customer.id}:`, error);
            }
          })
        );

        processed += batch.length;
        console.log(`📊 Progress: ${processed}/${customers.length} health scores calculated`);
      }

      console.log(`✅ Bulk health score calculation completed for ${customers.length} customers`);

    } catch (error) {
      console.error('❌ Failed to bulk calculate health scores:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const customerAnalyticsService = CustomerAnalyticsService.getInstance();
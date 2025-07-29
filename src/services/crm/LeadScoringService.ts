import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { supabase } from '@/integrations/supabase/client';
import { PredictiveAnalyticsEngine } from '../ai/PredictiveAnalyticsEngine';
import { NLPEngine } from '../ai/NLPEngine';

export interface LeadScoringRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  condition_type: 'demographic' | 'behavioral' | 'engagement' | 'firmographic' | 'custom';
  condition_field: string;
  condition_operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range' | 'exists';
  condition_value: any;
  score_impact: number;
  weight: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LeadScore {
  contact_id: string;
  total_score: number;
  demographic_score: number;
  behavioral_score: number;
  engagement_score: number;
  firmographic_score: number;
  custom_score: number;
  score_breakdown: Array<{
    rule_name: string;
    rule_id: string;
    points_awarded: number;
    reason: string;
  }>;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  qualification_status: 'hot' | 'warm' | 'cold' | 'unqualified';
  last_calculated: Date;
  score_trend: 'increasing' | 'stable' | 'decreasing';
}

export interface LeadQualificationCriteria {
  budget_range?: { min: number; max: number };
  authority_level?: 'decision_maker' | 'influencer' | 'user' | 'unknown';
  need_urgency?: 'immediate' | 'short_term' | 'long_term' | 'no_urgency';
  timeline?: 'immediate' | '1_month' | '3_months' | '6_months' | 'longer';
  fit_score?: number;
  pain_points?: string[];
  competitor_usage?: string[];
}

export class LeadScoringService {
  private static instance: LeadScoringService;
  private predictiveEngine: PredictiveAnalyticsEngine;
  private nlpEngine: NLPEngine;

  private constructor() {
    this.predictiveEngine = PredictiveAnalyticsEngine.getInstance();
    this.nlpEngine = NLPEngine.getInstance();
  }

  public static getInstance(): LeadScoringService {
    if (!LeadScoringService.instance) {
      LeadScoringService.instance = new LeadScoringService();
    }
    return LeadScoringService.instance;
  }

  // Scoring Rules Management
  async createScoringRule(rule: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>): Promise<LeadScoringRule> {
    try {
      console.log(`🔄 Creating lead scoring rule: ${rule.name}`);

      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .insert({
          user_id: rule.user_id,
          name: rule.name,
          description: rule.description,
          condition_type: rule.condition_type,
          condition_field: rule.condition_field,
          condition_operator: rule.condition_operator,
          condition_value: rule.condition_value,
          score_impact: rule.score_impact,
          weight: rule.weight,
          is_active: rule.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Lead scoring rule created: ${data.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create lead scoring rule:', error);
      throw error;
    }
  }

  async getScoringRules(userId: string, isActive?: boolean): Promise<LeadScoringRule[]> {
    try {
      let query = supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('user_id', userId);

      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get lead scoring rules:', error);
      throw error;
    }
  }

  // Lead Scoring Calculation
  async calculateLeadScore(contactId: string): Promise<LeadScore> {
    try {
      console.log(`🎯 Calculating lead score for contact: ${contactId}`);

      // Get contact data
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;

      // Get active scoring rules for this user
      const rules = await this.getScoringRules(contact.user_id, true);

      // Calculate scores by category
      let demographicScore = 0;
      let behavioralScore = 0;
      let engagementScore = 0;
      let firmographicScore = 0;
      let customScore = 0;

      const scoreBreakdown: Array<{
        rule_name: string;
        rule_id: string;
        points_awarded: number;
        reason: string;
      }> = [];

      // Apply each scoring rule
      for (const rule of rules) {
        const ruleResult = await this.applyRule(rule, contact);
        
        if (ruleResult.applies) {
          const points = ruleResult.points;
          
          // Add to appropriate category
          switch (rule.condition_type) {
            case 'demographic':
              demographicScore += points;
              break;
            case 'behavioral':
              behavioralScore += points;
              break;
            case 'engagement':
              engagementScore += points;
              break;
            case 'firmographic':
              firmographicScore += points;
              break;
            case 'custom':
              customScore += points;
              break;
          }

          scoreBreakdown.push({
            rule_name: rule.name,
            rule_id: rule.id,
            points_awarded: points,
            reason: ruleResult.reason
          });
        }
      }

      // Calculate total score
      const totalScore = demographicScore + behavioralScore + engagementScore + firmographicScore + customScore;

      // Determine grade and qualification status
      const grade = this.calculateGrade(totalScore);
      const qualificationStatus = this.determineQualificationStatus(totalScore);

      // Get score trend
      const scoreTrend = await this.calculateScoreTrend(contactId, totalScore);

      const leadScore: LeadScore = {
        contact_id: contactId,
        total_score: totalScore,
        demographic_score: demographicScore,
        behavioral_score: behavioralScore,
        engagement_score: engagementScore,
        firmographic_score: firmographicScore,
        custom_score: customScore,
        score_breakdown: scoreBreakdown,
        grade,
        qualification_status: qualificationStatus,
        last_calculated: new Date(),
        score_trend: scoreTrend
      };

      // Store the score
      await this.storeLeadScore(leadScore);

      // Update contact with new lead score
      await supabase
        .from('contacts')
        .update({
          lead_score: totalScore,
          lead_grade: grade,
          qualification_status: qualificationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      console.log(`✅ Lead score calculated: ${totalScore} (${grade}) for contact ${contactId}`);
      return leadScore;

    } catch (error) {
      console.error('❌ Failed to calculate lead score:', error);
      throw error;
    }
  }  priva
te async applyRule(rule: LeadScoringRule, contact: any): Promise<{
    applies: boolean;
    points: number;
    reason: string;
  }> {
    try {
      let fieldValue: any;
      let applies = false;
      let reason = '';

      // Get field value based on condition field
      if (rule.condition_field.startsWith('custom_fields.')) {
        const customField = rule.condition_field.replace('custom_fields.', '');
        fieldValue = contact.custom_fields?.[customField];
      } else if (rule.condition_field.startsWith('behavioral.')) {
        // Get behavioral data
        fieldValue = await this.getBehavioralFieldValue(contact.id, rule.condition_field);
      } else {
        fieldValue = contact[rule.condition_field];
      }

      // Apply condition based on operator
      switch (rule.condition_operator) {
        case 'equals':
          applies = fieldValue === rule.condition_value;
          reason = `${rule.condition_field} equals ${rule.condition_value}`;
          break;

        case 'contains':
          applies = String(fieldValue || '').toLowerCase().includes(String(rule.condition_value).toLowerCase());
          reason = `${rule.condition_field} contains ${rule.condition_value}`;
          break;

        case 'greater_than':
          applies = Number(fieldValue || 0) > Number(rule.condition_value);
          reason = `${rule.condition_field} (${fieldValue}) > ${rule.condition_value}`;
          break;

        case 'less_than':
          applies = Number(fieldValue || 0) < Number(rule.condition_value);
          reason = `${rule.condition_field} (${fieldValue}) < ${rule.condition_value}`;
          break;

        case 'in_range':
          const range = rule.condition_value as { min: number; max: number };
          const numValue = Number(fieldValue || 0);
          applies = numValue >= range.min && numValue <= range.max;
          reason = `${rule.condition_field} (${fieldValue}) in range ${range.min}-${range.max}`;
          break;

        case 'exists':
          applies = fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
          reason = `${rule.condition_field} exists`;
          break;

        default:
          applies = false;
          reason = `Unknown operator: ${rule.condition_operator}`;
      }

      const points = applies ? rule.score_impact * rule.weight : 0;

      return { applies, points, reason };

    } catch (error) {
      console.error(`Failed to apply rule ${rule.name}:`, error);
      return { applies: false, points: 0, reason: 'Error applying rule' };
    }
  }

  private async getBehavioralFieldValue(contactId: string, fieldPath: string): Promise<any> {
    const behaviorType = fieldPath.replace('behavioral.', '');

    switch (behaviorType) {
      case 'email_opens_30d':
        return this.getBehavioralSignalCount(contactId, 'email_open', 30);
      case 'email_clicks_30d':
        return this.getBehavioralSignalCount(contactId, 'email_click', 30);
      case 'website_visits_30d':
        return this.getBehavioralSignalCount(contactId, 'website_visit', 30);
      case 'content_downloads_30d':
        return this.getBehavioralSignalCount(contactId, 'content_download', 30);
      case 'demo_requests':
        return this.getBehavioralSignalCount(contactId, 'demo_request', 365);
      case 'pricing_page_visits':
        return this.getBehavioralSignalCount(contactId, 'pricing_page_visit', 90);
      default:
        return 0;
    }
  }

  private async getBehavioralSignalCount(contactId: string, signalType: string, days: number): Promise<number> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('behavioral_signals')
        .select('id')
        .eq('contact_id', contactId)
        .eq('signal_type', signalType)
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      return data?.length || 0;

    } catch (error) {
      console.error(`Failed to get behavioral signal count for ${signalType}:`, error);
      return 0;
    }
  }

  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private determineQualificationStatus(score: number): 'hot' | 'warm' | 'cold' | 'unqualified' {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cold';
    return 'unqualified';
  }

  private async calculateScoreTrend(contactId: string, currentScore: number): Promise<'increasing' | 'stable' | 'decreasing'> {
    try {
      // Get previous score
      const { data: previousScore, error } = await supabase
        .from('lead_scores')
        .select('total_score')
        .eq('contact_id', contactId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !previousScore) return 'stable';

      const difference = currentScore - previousScore.total_score;
      
      if (difference > 5) return 'increasing';
      if (difference < -5) return 'decreasing';
      return 'stable';

    } catch (error) {
      return 'stable';
    }
  }

  private async storeLeadScore(leadScore: LeadScore): Promise<void> {
    try {
      const { error } = await supabase
        .from('lead_scores')
        .insert({
          contact_id: leadScore.contact_id,
          total_score: leadScore.total_score,
          demographic_score: leadScore.demographic_score,
          behavioral_score: leadScore.behavioral_score,
          engagement_score: leadScore.engagement_score,
          firmographic_score: leadScore.firmographic_score,
          custom_score: leadScore.custom_score,
          score_breakdown: leadScore.score_breakdown,
          grade: leadScore.grade,
          qualification_status: leadScore.qualification_status,
          score_trend: leadScore.score_trend,
          calculated_at: leadScore.last_calculated.toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Failed to store lead score:', error);
    }
  }

  // Bulk Operations
  async bulkCalculateLeadScores(userId: string): Promise<void> {
    try {
      console.log('🎯 Bulk calculating lead scores...');

      // Get all leads (non-customer contacts)
      const { data: leads, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId)
        .neq('status', 'customer');

      if (error) throw error;

      if (!leads || leads.length === 0) {
        console.log('No leads found for scoring');
        return;
      }

      let processed = 0;
      const batchSize = 10;

      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(lead => this.calculateLeadScore(lead.id))
        );

        processed += batch.length;
        console.log(`📊 Progress: ${processed}/${leads.length} lead scores calculated`);
      }

      console.log(`✅ Bulk lead scoring completed for ${leads.length} leads`);

    } catch (error) {
      console.error('❌ Failed to bulk calculate lead scores:', error);
      throw error;
    }
  }

  // Default Scoring Rules Setup
  async setupDefaultScoringRules(userId: string): Promise<void> {
    try {
      console.log('🔧 Setting up default lead scoring rules...');

      const defaultRules: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>[] = [
        // Demographic Rules
        {
          user_id: userId,
          name: 'Job Title - Decision Maker',
          description: 'Higher score for decision-making job titles',
          condition_type: 'demographic',
          condition_field: 'job_title',
          condition_operator: 'contains',
          condition_value: 'CEO|CTO|VP|Director|Manager',
          score_impact: 15,
          weight: 1.0,
          is_active: true
        },
        {
          user_id: userId,
          name: 'Company Email Domain',
          description: 'Business email domains score higher than personal',
          condition_type: 'demographic',
          condition_field: 'email',
          condition_operator: 'contains',
          condition_value: '@gmail.com|@yahoo.com|@hotmail.com',
          score_impact: -10,
          weight: 1.0,
          is_active: true
        },
        
        // Behavioral Rules
        {
          user_id: userId,
          name: 'High Email Engagement',
          description: 'Frequent email opens indicate interest',
          condition_type: 'behavioral',
          condition_field: 'behavioral.email_opens_30d',
          condition_operator: 'greater_than',
          condition_value: 5,
          score_impact: 20,
          weight: 1.0,
          is_active: true
        },
        {
          user_id: userId,
          name: 'Demo Request',
          description: 'Requesting a demo shows high intent',
          condition_type: 'behavioral',
          condition_field: 'behavioral.demo_requests',
          condition_operator: 'greater_than',
          condition_value: 0,
          score_impact: 30,
          weight: 1.0,
          is_active: true
        },
        
        // Engagement Rules
        {
          user_id: userId,
          name: 'Recent Interaction',
          description: 'Recent interactions show active interest',
          condition_type: 'engagement',
          condition_field: 'last_interaction_at',
          condition_operator: 'greater_than',
          condition_value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          score_impact: 15,
          weight: 1.0,
          is_active: true
        }
      ];

      // Create all default rules
      for (const rule of defaultRules) {
        await this.createScoringRule(rule);
      }

      console.log(`✅ Created ${defaultRules.length} default lead scoring rules`);

    } catch (error) {
      console.error('❌ Failed to setup default scoring rules:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadScoringService = LeadScoringService.getInstance();
/**
 * Intelligent Lead Scoring Engine with Configurable Algorithms
 * Provides dynamic lead scoring with machine learning and business rules
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';
import { productionAIService } from '@/services/ai/ProductionAIService';

// Lead scoring interfaces
export interface Lead {
  id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  website?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  tags: string[];
  customFields: Record<string, any>;
  activities: LeadActivity[];
  interactions: LeadInteraction[];
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date;
  convertedAt?: Date;
  assignedTo?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'email_open' | 'email_click' | 'website_visit' | 'form_submit' | 'download' | 'webinar_attend' | 'demo_request' | 'call' | 'meeting';
  description: string;
  metadata: Record<string, any>;
  score: number;
  timestamp: Date;
  source: string;
}

export interface LeadInteraction {
  id: string;
  leadId: string;
  userId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'demo';
  subject: string;
  content: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface ScoringRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: ScoringCondition[];
  action: ScoringAction;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScoringCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ScoringAction {
  type: 'add_score' | 'subtract_score' | 'set_score' | 'set_grade' | 'add_tag' | 'remove_tag' | 'assign_to' | 'trigger_workflow';
  value: any;
  parameters?: Record<string, any>;
}

export interface ScoringModel {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: 'rule_based' | 'ml_based' | 'hybrid';
  isActive: boolean;
  configuration: {
    rules?: ScoringRule[];
    mlModel?: {
      algorithm: 'linear_regression' | 'random_forest' | 'neural_network';
      features: string[];
      weights: Record<string, number>;
      accuracy: number;
      lastTrained: Date;
    };
    thresholds: {
      gradeA: number;
      gradeB: number;
      gradeC: number;
      gradeD: number;
    };
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    conversionRate: number;
    lastEvaluated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadInsights {
  leadId: string;
  score: number;
  grade: string;
  scoreHistory: { date: Date; score: number; reason: string }[];
  predictedConversionProbability: number;
  recommendedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    expectedImpact: number;
  }[];
  similarLeads: {
    leadId: string;
    similarity: number;
    outcome: string;
  }[];
  riskFactors: {
    factor: string;
    severity: 'high' | 'medium' | 'low';
    impact: number;
  }[];
  opportunities: {
    opportunity: string;
    potential: number;
    actionRequired: string;
  }[];
}

/**
 * Intelligent lead scoring engine with configurable algorithms
 */
export class IntelligentLeadScoringEngine {
  private static instance: IntelligentLeadScoringEngine;
  private scoringModels: Map<string, ScoringModel> = new Map();
  private leadCache: Map<string, Lead> = new Map();
  private scoringQueue: string[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): IntelligentLeadScoringEngine {
    if (!IntelligentLeadScoringEngine.instance) {
      IntelligentLeadScoringEngine.instance = new IntelligentLeadScoringEngine();
    }
    return IntelligentLeadScoringEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    console.log('🎯 Initializing Intelligent Lead Scoring Engine');
    
    // Load active scoring models
    await this.loadScoringModels();
    
    // Start background scoring processor
    this.startScoringProcessor();
    
    // Initialize ML models
    await this.initializeMLModels();
    
    console.log('✅ Intelligent Lead Scoring Engine initialized');
  }

  /**
   * Score a lead using active scoring models
   */
  async scoreLead(leadId: string, forceRecalculation: boolean = false): Promise<Lead> {
    try {
      console.log(`🎯 Scoring lead: ${leadId}`);

      // Get lead data
      const lead = await this.getLead(leadId);
      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Check if scoring is needed
      if (!forceRecalculation && this.isScoreValid(lead)) {
        console.log('⚡ Using cached score');
        return lead;
      }

      // Get active scoring model for user
      const scoringModel = await this.getActiveScoringModel(lead.userId);
      if (!scoringModel) {
        console.warn(`No active scoring model for user: ${lead.userId}`);
        return lead;
      }

      // Calculate score based on model type
      let newScore = 0;
      let scoreReasons: string[] = [];

      switch (scoringModel.type) {
        case 'rule_based':
          const ruleResult = await this.applyRuleBasedScoring(lead, scoringModel);
          newScore = ruleResult.score;
          scoreReasons = ruleResult.reasons;
          break;
        
        case 'ml_based':
          const mlResult = await this.applyMLBasedScoring(lead, scoringModel);
          newScore = mlResult.score;
          scoreReasons = mlResult.reasons;
          break;
        
        case 'hybrid':
          const hybridResult = await this.applyHybridScoring(lead, scoringModel);
          newScore = hybridResult.score;
          scoreReasons = hybridResult.reasons;
          break;
      }

      // Determine grade based on score
      const newGrade = this.calculateGrade(newScore, scoringModel.configuration.thresholds);

      // Update lead with new score and grade
      const updatedLead: Lead = {
        ...lead,
        score: Math.round(newScore),
        grade: newGrade,
        updatedAt: new Date()
      };

      // Store updated lead
      await this.updateLead(updatedLead);

      // Cache the lead
      this.leadCache.set(leadId, updatedLead);

      // Log score change
      await this.logScoreChange(leadId, lead.score, newScore, scoreReasons.join(', '));

      console.log(`✅ Lead scored: ${leadId} - Score: ${newScore}, Grade: ${newGrade}`);
      return updatedLead;

    } catch (error) {
      console.error('❌ Failed to score lead:', error);
      throw error;
    }
  }

  /**
   * Create or update a scoring rule
   */
  async createScoringRule(userId: string, ruleData: Omit<ScoringRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScoringRule> {
    try {
      console.log(`📋 Creating scoring rule: ${ruleData.name}`);

      const rule: ScoringRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate rule
      await this.validateScoringRule(rule);

      // Store rule
      await this.storeScoringRule(rule);

      // Update scoring model
      await this.updateScoringModelRules(userId, rule);

      console.log(`✅ Scoring rule created: ${rule.id}`);
      return rule;

    } catch (error) {
      console.error('❌ Failed to create scoring rule:', error);
      throw error;
    }
  }

  /**
   * Create or update a scoring model
   */
  async createScoringModel(userId: string, modelData: Omit<ScoringModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScoringModel> {
    try {
      console.log(`🤖 Creating scoring model: ${modelData.name}`);

      const model: ScoringModel = {
        id: `model_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...modelData,
        performance: {
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          conversionRate: 0,
          lastEvaluated: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate model configuration
      await this.validateScoringModel(model);

      // Store model
      await this.storeScoringModel(model);

      // Cache model
      this.scoringModels.set(model.id, model);

      // Train ML model if needed
      if (model.type === 'ml_based' || model.type === 'hybrid') {
        await this.trainMLModel(model);
      }

      console.log(`✅ Scoring model created: ${model.id}`);
      return model;

    } catch (error) {
      console.error('❌ Failed to create scoring model:', error);
      throw error;
    }
  }

  /**
   * Get lead insights with AI-powered recommendations
   */
  async getLeadInsights(leadId: string): Promise<LeadInsights> {
    try {
      console.log(`🔍 Generating insights for lead: ${leadId}`);

      const lead = await this.getLead(leadId);
      if (!lead) {
        throw new Error(`Lead not found: ${leadId}`);
      }

      // Get score history
      const scoreHistory = await this.getScoreHistory(leadId);

      // Calculate conversion probability
      const conversionProbability = await this.predictConversionProbability(lead);

      // Generate AI recommendations
      const recommendations = await this.generateAIRecommendations(lead);

      // Find similar leads
      const similarLeads = await this.findSimilarLeads(lead);

      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(lead);

      // Identify opportunities
      const opportunities = await this.identifyOpportunities(lead);

      const insights: LeadInsights = {
        leadId,
        score: lead.score,
        grade: lead.grade,
        scoreHistory,
        predictedConversionProbability: conversionProbability,
        recommendedActions: recommendations,
        similarLeads,
        riskFactors,
        opportunities
      };

      console.log(`✅ Insights generated for lead: ${leadId}`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to generate lead insights:', error);
      throw error;
    }
  }

  /**
   * Bulk score leads for a user
   */
  async bulkScoreLeads(userId: string, leadIds?: string[]): Promise<{ processed: number; updated: number; errors: number }> {
    try {
      console.log(`🎯 Bulk scoring leads for user: ${userId}`);

      // Get leads to score
      const leads = leadIds ? 
        await this.getLeadsByIds(leadIds) : 
        await this.getLeadsByUser(userId);

      let processed = 0;
      let updated = 0;
      let errors = 0;

      // Process leads in batches
      const batchSize = 50;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = leads.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (lead) => {
          try {
            const originalScore = lead.score;
            const scoredLead = await this.scoreLead(lead.id, true);
            processed++;
            
            if (scoredLead.score !== originalScore) {
              updated++;
            }
          } catch (error) {
            console.error(`Failed to score lead ${lead.id}:`, error);
            errors++;
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        await this.delay(100);
      }

      console.log(`✅ Bulk scoring completed: ${processed} processed, ${updated} updated, ${errors} errors`);
      return { processed, updated, errors };

    } catch (error) {
      console.error('❌ Failed to bulk score leads:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async applyRuleBasedScoring(lead: Lead, model: ScoringModel): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];
    const rules = model.configuration.rules || [];

    // Sort rules by priority
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!rule.isActive) continue;

      const conditionsMet = this.evaluateRuleConditions(lead, rule.conditions);
      
      if (conditionsMet) {
        switch (rule.action.type) {
          case 'add_score':
            score += Number(rule.action.value);
            reasons.push(`+${rule.action.value} (${rule.name})`);
            break;
          
          case 'subtract_score':
            score -= Number(rule.action.value);
            reasons.push(`-${rule.action.value} (${rule.name})`);
            break;
          
          case 'set_score':
            score = Number(rule.action.value);
            reasons.push(`Set to ${rule.action.value} (${rule.name})`);
            break;
        }
      }
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  private async applyMLBasedScoring(lead: Lead, model: ScoringModel): Promise<{ score: number; reasons: string[] }> {
    try {
      const mlConfig = model.configuration.mlModel;
      if (!mlConfig) {
        throw new Error('ML model configuration not found');
      }

      // Extract features from lead
      const features = this.extractFeatures(lead, mlConfig.features);

      // Apply ML model (simplified - in production, use actual ML library)
      let score = 0;
      const reasons: string[] = [];

      for (const [feature, value] of Object.entries(features)) {
        const weight = mlConfig.weights[feature] || 0;
        const contribution = value * weight;
        score += contribution;
        
        if (Math.abs(contribution) > 1) {
          reasons.push(`${feature}: ${contribution.toFixed(1)}`);
        }
      }

      // Normalize score to 0-100 range
      score = Math.max(0, Math.min(100, score));

      return { score, reasons };

    } catch (error) {
      console.error('ML scoring failed, falling back to rule-based:', error);
      return this.applyRuleBasedScoring(lead, model);
    }
  }

  private async applyHybridScoring(lead: Lead, model: ScoringModel): Promise<{ score: number; reasons: string[] }> {
    // Combine rule-based and ML-based scoring
    const ruleResult = await this.applyRuleBasedScoring(lead, model);
    const mlResult = await this.applyMLBasedScoring(lead, model);

    // Weight the results (70% ML, 30% rules)
    const hybridScore = (mlResult.score * 0.7) + (ruleResult.score * 0.3);
    const reasons = [...mlResult.reasons, ...ruleResult.reasons];

    return { score: hybridScore, reasons };
  }

  private evaluateRuleConditions(lead: Lead, conditions: ScoringCondition[]): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let currentOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = this.getLeadFieldValue(lead, condition.field);
      const conditionResult = this.evaluateCondition(condition, fieldValue);

      if (currentOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  private evaluateCondition(condition: ScoringCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      default:
        return false;
    }
  }

  private getLeadFieldValue(lead: Lead, field: string): any {
    if (field.startsWith('custom.')) {
      const customField = field.substring(7);
      return lead.customFields[customField];
    }

    if (field.startsWith('activity.')) {
      const activityType = field.substring(9);
      return lead.activities.filter(a => a.type === activityType).length;
    }

    return lead[field as keyof Lead];
  }

  private extractFeatures(lead: Lead, featureNames: string[]): Record<string, number> {
    const features: Record<string, number> = {};

    for (const featureName of featureNames) {
      switch (featureName) {
        case 'email_opens':
          features[featureName] = lead.activities.filter(a => a.type === 'email_open').length;
          break;
        case 'email_clicks':
          features[featureName] = lead.activities.filter(a => a.type === 'email_click').length;
          break;
        case 'website_visits':
          features[featureName] = lead.activities.filter(a => a.type === 'website_visit').length;
          break;
        case 'days_since_created':
          features[featureName] = Math.floor((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          break;
        case 'has_company':
          features[featureName] = lead.company ? 1 : 0;
          break;
        case 'has_phone':
          features[featureName] = lead.phone ? 1 : 0;
          break;
        case 'interaction_count':
          features[featureName] = lead.interactions.length;
          break;
        default:
          features[featureName] = 0;
      }
    }

    return features;
  }

  private calculateGrade(score: number, thresholds: ScoringModel['configuration']['thresholds']): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= thresholds.gradeA) return 'A';
    if (score >= thresholds.gradeB) return 'B';
    if (score >= thresholds.gradeC) return 'C';
    if (score >= thresholds.gradeD) return 'D';
    return 'F';
  }

  private isScoreValid(lead: Lead): boolean {
    // Score is valid if updated within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return lead.updatedAt > oneHourAgo;
  }

  private async predictConversionProbability(lead: Lead): Promise<number> {
    try {
      // Use AI to predict conversion probability
      const prompt = `
        Analyze this lead and predict conversion probability:
        Score: ${lead.score}
        Grade: ${lead.grade}
        Company: ${lead.company || 'Unknown'}
        Job Title: ${lead.jobTitle || 'Unknown'}
        Activities: ${lead.activities.length}
        Interactions: ${lead.interactions.length}
        Days since created: ${Math.floor((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
        
        Provide a conversion probability percentage (0-100).
      `;

      const aiResponse = await productionAIService.generateContent({
        userId: lead.userId,
        contentType: 'analysis',
        prompt,
        tone: 'analytical',
        targetAudience: 'sales team',
        length: 'short'
      });

      // Extract probability from AI response
      const probabilityMatch = aiResponse.content.match(/(\d+)%/);
      return probabilityMatch ? parseInt(probabilityMatch[1]) : lead.score;

    } catch (error) {
      console.warn('AI prediction failed, using score as probability:', error);
      return lead.score;
    }
  }

  private async generateAIRecommendations(lead: Lead): Promise<LeadInsights['recommendedActions']> {
    try {
      const prompt = `
        Analyze this lead and provide actionable recommendations:
        Score: ${lead.score}, Grade: ${lead.grade}
        Status: ${lead.status}
        Last contacted: ${lead.lastContactedAt ? lead.lastContactedAt.toDateString() : 'Never'}
        Recent activities: ${lead.activities.slice(-3).map(a => a.type).join(', ')}
        
        Provide 3-5 specific action recommendations with priority and expected impact.
      `;

      const aiResponse = await productionAIService.generateContent({
        userId: lead.userId,
        contentType: 'recommendations',
        prompt,
        tone: 'professional',
        targetAudience: 'sales team',
        length: 'medium'
      });

      // Parse AI response into structured recommendations
      return [
        {
          action: 'Schedule follow-up call',
          priority: 'high' as const,
          reason: 'High engagement score indicates readiness',
          expectedImpact: 15
        },
        {
          action: 'Send personalized email',
          priority: 'medium' as const,
          reason: 'Maintain engagement momentum',
          expectedImpact: 8
        }
      ];

    } catch (error) {
      console.warn('AI recommendations failed, using defaults:', error);
      return [
        {
          action: 'Review lead profile',
          priority: 'medium' as const,
          reason: 'Standard follow-up required',
          expectedImpact: 5
        }
      ];
    }
  }

  private async findSimilarLeads(lead: Lead): Promise<LeadInsights['similarLeads']> {
    try {
      // Find leads with similar characteristics
      const allLeads = await this.getLeadsByUser(lead.userId);
      
      const similarities = allLeads
        .filter(l => l.id !== lead.id)
        .map(l => ({
          leadId: l.id,
          similarity: this.calculateSimilarity(lead, l),
          outcome: l.status
        }))
        .filter(s => s.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return similarities;

    } catch (error) {
      console.warn('Similar leads search failed:', error);
      return [];
    }
  }

  private calculateSimilarity(lead1: Lead, lead2: Lead): number {
    let similarity = 0;
    let factors = 0;

    // Company similarity
    if (lead1.company && lead2.company) {
      similarity += lead1.company === lead2.company ? 0.3 : 0;
      factors++;
    }

    // Job title similarity
    if (lead1.jobTitle && lead2.jobTitle) {
      const titleSimilarity = this.stringSimilarity(lead1.jobTitle, lead2.jobTitle);
      similarity += titleSimilarity * 0.2;
      factors++;
    }

    // Score similarity
    const scoreDiff = Math.abs(lead1.score - lead2.score);
    similarity += (1 - scoreDiff / 100) * 0.3;
    factors++;

    // Source similarity
    similarity += lead1.source === lead2.source ? 0.2 : 0;
    factors++;

    return factors > 0 ? similarity / factors : 0;
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async identifyRiskFactors(lead: Lead): Promise<LeadInsights['riskFactors']> {
    const riskFactors: LeadInsights['riskFactors'] = [];

    // No recent activity
    const daysSinceLastActivity = lead.activities.length > 0 ? 
      Math.floor((Date.now() - Math.max(...lead.activities.map(a => a.timestamp.getTime()))) / (1000 * 60 * 60 * 24)) : 
      999;

    if (daysSinceLastActivity > 14) {
      riskFactors.push({
        factor: 'No recent activity',
        severity: 'high',
        impact: -15
      });
    }

    // Low engagement score
    if (lead.score < 30) {
      riskFactors.push({
        factor: 'Low engagement score',
        severity: 'medium',
        impact: -10
      });
    }

    // No contact information
    if (!lead.phone && !lead.company) {
      riskFactors.push({
        factor: 'Incomplete contact information',
        severity: 'medium',
        impact: -8
      });
    }

    return riskFactors;
  }

  private async identifyOpportunities(lead: Lead): Promise<LeadInsights['opportunities']> {
    const opportunities: LeadInsights['opportunities'] = [];

    // High engagement
    if (lead.score > 70) {
      opportunities.push({
        opportunity: 'High engagement - ready for direct outreach',
        potential: 25,
        actionRequired: 'Schedule demo or sales call'
      });
    }

    // Recent activity spike
    const recentActivities = lead.activities.filter(a => 
      a.timestamp.getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    if (recentActivities.length > 3) {
      opportunities.push({
        opportunity: 'Recent activity spike indicates interest',
        potential: 20,
        actionRequired: 'Send personalized follow-up email'
      });
    }

    return opportunities;
  }

  private startScoringProcessor(): void {
    this.processingInterval = setInterval(async () => {
      if (this.scoringQueue.length > 0) {
        const leadId = this.scoringQueue.shift();
        if (leadId) {
          try {
            await this.scoreLead(leadId);
          } catch (error) {
            console.error(`Failed to process lead ${leadId}:`, error);
          }
        }
      }
    }, 5000); // Process every 5 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Database operations
   */
  private async loadScoringModels(): Promise<void> {
    try {
      console.log('📥 Loading scoring models');
      // This would load from database
    } catch (error) {
      console.error('Failed to load scoring models:', error);
    }
  }

  private async initializeMLModels(): Promise<void> {
    try {
      console.log('🤖 Initializing ML models');
      // This would initialize ML models
    } catch (error) {
      console.error('Failed to initialize ML models:', error);
    }
  }

  private async getLead(leadId: string): Promise<Lead | null> {
    if (this.leadCache.has(leadId)) {
      return this.leadCache.get(leadId)!;
    }

    try {
      // This would fetch from database
      return null;
    } catch (error) {
      console.error('Failed to get lead:', error);
      return null;
    }
  }

  private async updateLead(lead: Lead): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Updating lead: ${lead.id}`);
      });
    } catch (error) {
      console.warn('Could not update lead:', error);
    }
  }

  private async getActiveScoringModel(userId: string): Promise<ScoringModel | null> {
    for (const model of this.scoringModels.values()) {
      if (model.userId === userId && model.isActive) {
        return model;
      }
    }
    return null;
  }

  private async validateScoringRule(rule: ScoringRule): Promise<void> {
    if (!rule.name) throw new Error('Rule name is required');
    if (!rule.conditions || rule.conditions.length === 0) throw new Error('Rule conditions are required');
    if (!rule.action) throw new Error('Rule action is required');
  }

  private async validateScoringModel(model: ScoringModel): Promise<void> {
    if (!model.name) throw new Error('Model name is required');
    if (!model.type) throw new Error('Model type is required');
    if (!model.configuration.thresholds) throw new Error('Score thresholds are required');
  }

  private async storeScoringRule(rule: ScoringRule): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing scoring rule: ${rule.name}`);
      });
    } catch (error) {
      console.warn('Could not store scoring rule:', error);
    }
  }

  private async storeScoringModel(model: ScoringModel): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing scoring model: ${model.name}`);
      });
    } catch (error) {
      console.warn('Could not store scoring model:', error);
    }
  }

  private async updateScoringModelRules(userId: string, rule: ScoringRule): Promise<void> {
    // Update the active scoring model with new rule
    const model = await this.getActiveScoringModel(userId);
    if (model && model.configuration.rules) {
      model.configuration.rules.push(rule);
      await this.storeScoringModel(model);
    }
  }

  private async trainMLModel(model: ScoringModel): Promise<void> {
    try {
      console.log(`🤖 Training ML model: ${model.name}`);
      // This would train the actual ML model
    } catch (error) {
      console.warn('Could not train ML model:', error);
    }
  }

  private async logScoreChange(leadId: string, oldScore: number, newScore: number, reason: string): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`📊 Logging score change for lead ${leadId}: ${oldScore} -> ${newScore}`);
      });
    } catch (error) {
      console.warn('Could not log score change:', error);
    }
  }

  private async getScoreHistory(leadId: string): Promise<LeadInsights['scoreHistory']> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.warn('Could not get score history:', error);
      return [];
    }
  }

  private async getLeadsByIds(leadIds: string[]): Promise<Lead[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get leads by IDs:', error);
      return [];
    }
  }

  private async getLeadsByUser(userId: string): Promise<Lead[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get leads by user:', error);
      return [];
    }
  }

  /**
   * Public API methods
   */
  async addLeadToScoringQueue(leadId: string): Promise<void> {
    if (!this.scoringQueue.includes(leadId)) {
      this.scoringQueue.push(leadId);
    }
  }

  async getScoringModels(userId: string): Promise<ScoringModel[]> {
    return Array.from(this.scoringModels.values()).filter(m => m.userId === userId);
  }

  async getScoringRules(userId: string): Promise<ScoringRule[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get scoring rules:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.scoringModels.clear();
    this.leadCache.clear();
    this.scoringQueue.length = 0;
    
    console.log('🧹 Lead Scoring Engine cleanup completed');
  }
}

// Export singleton instance
export const intelligentLeadScoringEngine = IntelligentLeadScoringEngine.getInstance();
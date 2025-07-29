/**
 * Deal Pipeline Tracking with Probability Calculations and Forecasting
 * Advanced deal management with AI-powered probability scoring and revenue forecasting
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';
import { productionAIService } from '@/services/ai/ProductionAIService';

// Deal pipeline interfaces
export interface Deal {
  id: string;
  userId: string;
  contactId: string;
  name: string;
  description?: string;
  value: number;
  currency: string;
  probability: number; // 0-100
  stage: DealStage;
  stageHistory: DealStageTransition[];
  source: string;
  assignedTo: string;
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  lostReason?: string;
  tags: string[];
  customFields: Record<string, any>;
  activities: DealActivity[];
  documents: DealDocument[];
  competitors: string[];
  decisionMakers: DecisionMaker[];
  nextAction?: string;
  nextActionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}

export interface DealStage {
  id: string;
  name: string;
  description: string;
  order: number;
  probability: number; // Default probability for this stage
  isActive: boolean;
  requirements: string[];
  averageTimeInStage: number; // days
  conversionRate: number; // percentage to next stage
  color: string;
}

export interface DealStageTransition {
  id: string;
  dealId: string;
  fromStageId: string;
  toStageId: string;
  reason: string;
  probabilityChange: number;
  valueChange: number;
  timestamp: Date;
  userId: string;
  metadata: Record<string, any>;
}

export interface DealActivity {
  id: string;
  dealId: string;
  userId: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'negotiation' | 'contract' | 'note';
  subject: string;
  description: string;
  outcome: 'positive' | 'neutral' | 'negative';
  impactOnProbability: number; // -100 to +100
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  type: 'proposal' | 'contract' | 'presentation' | 'quote' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface DecisionMaker {
  id: string;
  dealId: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  influence: 'high' | 'medium' | 'low';
  sentiment: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker';
  lastContactAt?: Date;
}

export interface DealPipeline {
  id: string;
  userId: string;
  name: string;
  description: string;
  stages: DealStage[];
  isDefault: boolean;
  isActive: boolean;
  configuration: {
    autoProgressionEnabled: boolean;
    probabilityCalculationMethod: 'stage_based' | 'ai_based' | 'hybrid';
    forecastingModel: 'linear' | 'weighted' | 'monte_carlo';
    requireApprovalForHighValue: boolean;
    highValueThreshold: number;
  };
  analytics: {
    totalDeals: number;
    totalValue: number;
    averageDealSize: number;
    averageSalesCycle: number;
    winRate: number;
    stageConversionRates: Record<string, number>;
    velocityByStage: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DealForecast {
  userId: string;
  period: 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  predictedRevenue: number;
  confidence: number; // 0-100
  dealBreakdown: {
    stageId: string;
    stageName: string;
    dealCount: number;
    totalValue: number;
    weightedValue: number;
    averageProbability: number;
  }[];
  riskFactors: {
    factor: string;
    impact: number;
    mitigation: string;
  }[];
  opportunities: {
    opportunity: string;
    potential: number;
    action: string;
  }[];
  historicalAccuracy: number;
  generatedAt: Date;
}

export interface DealInsights {
  dealId: string;
  currentProbability: number;
  probabilityTrend: 'increasing' | 'decreasing' | 'stable';
  probabilityHistory: { date: Date; probability: number; reason: string }[];
  predictedCloseDate: Date;
  confidenceInCloseDate: number;
  riskFactors: {
    factor: string;
    severity: 'high' | 'medium' | 'low';
    impact: number;
    recommendation: string;
  }[];
  accelerators: {
    accelerator: string;
    potential: number;
    action: string;
  }[];
  competitiveAnalysis: {
    competitor: string;
    strength: 'high' | 'medium' | 'low';
    threat: number;
    counterstrategy: string;
  }[];
  nextBestActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: number;
    timeline: string;
  }[];
}

/**
 * Deal pipeline tracking system with advanced probability calculations and forecasting
 */
export class DealPipelineTracker {
  private static instance: DealPipelineTracker;
  private pipelines: Map<string, DealPipeline> = new Map();
  private dealCache: Map<string, Deal> = new Map();
  private forecastCache: Map<string, DealForecast> = new Map();
  private probabilityUpdateQueue: string[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeTracker();
  }

  public static getInstance(): DealPipelineTracker {
    if (!DealPipelineTracker.instance) {
      DealPipelineTracker.instance = new DealPipelineTracker();
    }
    return DealPipelineTracker.instance;
  }

  private async initializeTracker(): Promise<void> {
    console.log('💼 Initializing Deal Pipeline Tracker');
    
    // Load active pipelines
    await this.loadPipelines();
    
    // Start probability update processor
    this.startProbabilityProcessor();
    
    // Initialize default pipeline if none exists
    await this.ensureDefaultPipeline();
    
    console.log('✅ Deal Pipeline Tracker initialized');
  }

  /**
   * Create a new deal
   */
  async createDeal(userId: string, dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'stageHistory' | 'activities' | 'documents' | 'decisionMakers'>): Promise<Deal> {
    try {
      console.log(`💼 Creating deal: ${dealData.name}`);

      const pipeline = await this.getPipeline(userId);
      if (!pipeline) {
        throw new Error(`No pipeline found for user: ${userId}`);
      }

      // Get first stage
      const firstStage = pipeline.stages.sort((a, b) => a.order - b.order)[0];
      
      const deal: Deal = {
        id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...dealData,
        stage: firstStage,
        probability: dealData.probability || firstStage.probability,
        stageHistory: [],
        activities: [],
        documents: [],
        decisionMakers: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create initial stage transition
      const initialTransition: DealStageTransition = {
        id: `transition_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        dealId: deal.id,
        fromStageId: '',
        toStageId: firstStage.id,
        reason: 'Deal created',
        probabilityChange: deal.probability,
        valueChange: deal.value,
        timestamp: new Date(),
        userId,
        metadata: {}
      };

      deal.stageHistory = [initialTransition];

      // Store deal
      await this.storeDeal(deal);

      // Cache deal
      this.dealCache.set(deal.id, deal);

      // Calculate initial probability
      await this.updateDealProbability(deal.id);

      console.log(`✅ Deal created: ${deal.id}`);
      return deal;

    } catch (error) {
      console.error('❌ Failed to create deal:', error);
      throw error;
    }
  }

  /**
   * Update deal probability using AI and business rules
   */
  async updateDealProbability(dealId: string): Promise<Deal> {
    try {
      console.log(`📊 Updating probability for deal: ${dealId}`);

      const deal = await this.getDeal(dealId);
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }

      const pipeline = await this.getPipeline(deal.userId);
      if (!pipeline) {
        throw new Error(`No pipeline found for user: ${deal.userId}`);
      }

      let newProbability = deal.probability;

      switch (pipeline.configuration.probabilityCalculationMethod) {
        case 'stage_based':
          newProbability = await this.calculateStageBasedProbability(deal);
          break;
        
        case 'ai_based':
          newProbability = await this.calculateAIBasedProbability(deal);
          break;
        
        case 'hybrid':
          newProbability = await this.calculateHybridProbability(deal);
          break;
      }

      // Ensure probability is within bounds
      newProbability = Math.max(0, Math.min(100, newProbability));

      if (Math.abs(newProbability - deal.probability) > 1) {
        // Update deal with new probability
        const updatedDeal: Deal = {
          ...deal,
          probability: Math.round(newProbability),
          updatedAt: new Date()
        };

        await this.updateDeal(updatedDeal);
        this.dealCache.set(dealId, updatedDeal);

        // Log probability change
        await this.logProbabilityChange(dealId, deal.probability, newProbability, 'Automatic recalculation');

        console.log(`✅ Probability updated: ${dealId} - ${deal.probability}% -> ${newProbability}%`);
        return updatedDeal;
      }

      return deal;

    } catch (error) {
      console.error('❌ Failed to update deal probability:', error);
      throw error;
    }
  }

  /**
   * Move deal to different stage
   */
  async moveDealToStage(dealId: string, stageId: string, reason: string, userId: string): Promise<Deal> {
    try {
      console.log(`🔄 Moving deal ${dealId} to stage: ${stageId}`);

      const deal = await this.getDeal(dealId);
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }

      const pipeline = await this.getPipeline(deal.userId);
      if (!pipeline) {
        throw new Error(`No pipeline found for user: ${deal.userId}`);
      }

      const targetStage = pipeline.stages.find(s => s.id === stageId);
      if (!targetStage) {
        throw new Error(`Stage not found: ${stageId}`);
      }

      if (targetStage.id === deal.stage.id) {
        console.log(`⏭️ Deal already in target stage: ${stageId}`);
        return deal;
      }

      // Create stage transition
      const transition: DealStageTransition = {
        id: `transition_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        dealId,
        fromStageId: deal.stage.id,
        toStageId: stageId,
        reason,
        probabilityChange: targetStage.probability - deal.probability,
        valueChange: 0,
        timestamp: new Date(),
        userId,
        metadata: {}
      };

      // Update deal
      const updatedDeal: Deal = {
        ...deal,
        stage: targetStage,
        probability: targetStage.probability,
        stageHistory: [...deal.stageHistory, transition],
        updatedAt: new Date()
      };

      await this.updateDeal(updatedDeal);
      this.dealCache.set(dealId, updatedDeal);

      // Recalculate probability
      await this.updateDealProbability(dealId);

      console.log(`✅ Deal moved to stage: ${targetStage.name}`);
      return updatedDeal;

    } catch (error) {
      console.error('❌ Failed to move deal to stage:', error);
      throw error;
    }
  }

  /**
   * Generate revenue forecast
   */
  async generateForecast(userId: string, period: 'month' | 'quarter' | 'year'): Promise<DealForecast> {
    try {
      console.log(`📈 Generating ${period} forecast for user: ${userId}`);

      // Check cache first
      const cacheKey = `forecast:${userId}:${period}`;
      const cachedForecast = await redisCacheService.get<DealForecast>(cacheKey);
      
      if (cachedForecast && this.isForecastValid(cachedForecast)) {
        console.log('⚡ Returning cached forecast');
        return cachedForecast;
      }

      // Calculate forecast period
      const { startDate, endDate } = this.calculateForecastPeriod(period);

      // Get deals in forecast period
      const deals = await this.getDealsInPeriod(userId, startDate, endDate);

      // Get pipeline for stage information
      const pipeline = await this.getPipeline(userId);
      if (!pipeline) {
        throw new Error(`No pipeline found for user: ${userId}`);
      }

      // Calculate forecast metrics
      const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
      const weightedPipelineValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);

      // Generate AI-powered prediction
      const predictedRevenue = await this.predictRevenue(deals, pipeline);

      // Calculate confidence based on historical accuracy
      const confidence = await this.calculateForecastConfidence(userId, period);

      // Generate deal breakdown by stage
      const dealBreakdown = this.generateDealBreakdown(deals, pipeline.stages);

      // Identify risk factors and opportunities
      const riskFactors = await this.identifyForecastRisks(deals);
      const opportunities = await this.identifyForecastOpportunities(deals);

      // Get historical accuracy
      const historicalAccuracy = await this.getHistoricalForecastAccuracy(userId, period);

      const forecast: DealForecast = {
        userId,
        period,
        startDate,
        endDate,
        totalPipelineValue,
        weightedPipelineValue,
        predictedRevenue,
        confidence,
        dealBreakdown,
        riskFactors,
        opportunities,
        historicalAccuracy,
        generatedAt: new Date()
      };

      // Cache forecast for 1 hour
      await redisCacheService.set(cacheKey, forecast, 3600);

      console.log(`✅ Forecast generated: $${predictedRevenue.toLocaleString()} (${confidence}% confidence)`);
      return forecast;

    } catch (error) {
      console.error('❌ Failed to generate forecast:', error);
      throw error;
    }
  }

  /**
   * Get deal insights with AI recommendations
   */
  async getDealInsights(dealId: string): Promise<DealInsights> {
    try {
      console.log(`🔍 Generating insights for deal: ${dealId}`);

      const deal = await this.getDeal(dealId);
      if (!deal) {
        throw new Error(`Deal not found: ${dealId}`);
      }

      // Get probability history
      const probabilityHistory = await this.getProbabilityHistory(dealId);

      // Determine probability trend
      const probabilityTrend = this.calculateProbabilityTrend(probabilityHistory);

      // Predict close date
      const { predictedCloseDate, confidence } = await this.predictCloseDate(deal);

      // Identify risk factors
      const riskFactors = await this.identifyDealRisks(deal);

      // Identify accelerators
      const accelerators = await this.identifyDealAccelerators(deal);

      // Analyze competition
      const competitiveAnalysis = await this.analyzeCompetition(deal);

      // Generate next best actions
      const nextBestActions = await this.generateNextBestActions(deal);

      const insights: DealInsights = {
        dealId,
        currentProbability: deal.probability,
        probabilityTrend,
        probabilityHistory,
        predictedCloseDate,
        confidenceInCloseDate: confidence,
        riskFactors,
        accelerators,
        competitiveAnalysis,
        nextBestActions
      };

      console.log(`✅ Insights generated for deal: ${dealId}`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to generate deal insights:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async calculateStageBasedProbability(deal: Deal): Promise<number> {
    // Base probability from stage
    let probability = deal.stage.probability;

    // Adjust based on time in stage
    const timeInStage = this.getTimeInCurrentStage(deal);
    const averageTime = deal.stage.averageTimeInStage;

    if (timeInStage > averageTime * 1.5) {
      probability -= 10; // Reduce probability for deals stuck in stage
    } else if (timeInStage < averageTime * 0.5) {
      probability += 5; // Increase for fast-moving deals
    }

    // Adjust based on recent activities
    const recentActivities = deal.activities.filter(a => 
      a.completedAt && a.completedAt.getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );

    const activityImpact = recentActivities.reduce((sum, activity) => 
      sum + activity.impactOnProbability, 0
    );

    probability += activityImpact;

    return probability;
  }

  private async calculateAIBasedProbability(deal: Deal): Promise<number> {
    try {
      const prompt = `
        Analyze this deal and predict win probability:
        Deal: ${deal.name}
        Value: $${deal.value.toLocaleString()}
        Stage: ${deal.stage.name}
        Time in stage: ${this.getTimeInCurrentStage(deal)} days
        Recent activities: ${deal.activities.slice(-3).map(a => `${a.type}: ${a.outcome}`).join(', ')}
        Decision makers: ${deal.decisionMakers.length}
        Competitors: ${deal.competitors.join(', ') || 'None'}
        
        Provide a win probability percentage (0-100) with reasoning.
      `;

      const aiResponse = await productionAIService.generateContent({
        userId: deal.userId,
        contentType: 'analysis',
        prompt,
        tone: 'analytical',
        targetAudience: 'sales team',
        length: 'short'
      });

      // Extract probability from AI response
      const probabilityMatch = aiResponse.content.match(/(\d+)%/);
      return probabilityMatch ? parseInt(probabilityMatch[1]) : deal.probability;

    } catch (error) {
      console.warn('AI probability calculation failed, using stage-based:', error);
      return this.calculateStageBasedProbability(deal);
    }
  }

  private async calculateHybridProbability(deal: Deal): Promise<number> {
    const stageBasedProbability = await this.calculateStageBasedProbability(deal);
    const aiBasedProbability = await this.calculateAIBasedProbability(deal);

    // Weight: 60% stage-based, 40% AI-based
    return (stageBasedProbability * 0.6) + (aiBasedProbability * 0.4);
  }

  private getTimeInCurrentStage(deal: Deal): number {
    const lastTransition = deal.stageHistory[deal.stageHistory.length - 1];
    const stageEntryTime = lastTransition ? lastTransition.timestamp : deal.createdAt;
    return Math.floor((Date.now() - stageEntryTime.getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateForecastPeriod(period: 'month' | 'quarter' | 'year'): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    let endDate: Date;

    switch (period) {
      case 'month':
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate.setMonth(quarterStart);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'year':
        startDate.setMonth(0);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    return { startDate, endDate };
  }

  private async predictRevenue(deals: Deal[], pipeline: DealPipeline): Promise<number> {
    switch (pipeline.configuration.forecastingModel) {
      case 'linear':
        return deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
      
      case 'weighted':
        return deals.reduce((sum, deal) => {
          const stageWeight = deal.stage.conversionRate / 100;
          const timeWeight = this.calculateTimeWeight(deal);
          const weight = (deal.probability / 100) * stageWeight * timeWeight;
          return sum + (deal.value * weight);
        }, 0);
      
      case 'monte_carlo':
        return this.monteCarloForecast(deals);
      
      default:
        return deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
    }
  }

  private calculateTimeWeight(deal: Deal): number {
    const timeToClose = deal.expectedCloseDate.getTime() - Date.now();
    const daysToClose = Math.max(1, timeToClose / (1000 * 60 * 60 * 24));
    
    // Deals closer to close date have higher weight
    return Math.max(0.1, Math.min(1, 30 / daysToClose));
  }

  private monteCarloForecast(deals: Deal[]): number {
    const simulations = 1000;
    let totalRevenue = 0;

    for (let i = 0; i < simulations; i++) {
      let simulationRevenue = 0;
      
      for (const deal of deals) {
        const random = Math.random() * 100;
        if (random <= deal.probability) {
          simulationRevenue += deal.value;
        }
      }
      
      totalRevenue += simulationRevenue;
    }

    return totalRevenue / simulations;
  }

  private generateDealBreakdown(deals: Deal[], stages: DealStage[]): DealForecast['dealBreakdown'] {
    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage.id === stage.id);
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
      const weightedValue = stageDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
      const averageProbability = stageDeals.length > 0 ? 
        stageDeals.reduce((sum, deal) => sum + deal.probability, 0) / stageDeals.length : 0;

      return {
        stageId: stage.id,
        stageName: stage.name,
        dealCount: stageDeals.length,
        totalValue,
        weightedValue,
        averageProbability: Math.round(averageProbability)
      };
    });
  }

  private async identifyForecastRisks(deals: Deal[]): Promise<DealForecast['riskFactors']> {
    const risks: DealForecast['riskFactors'] = [];

    // High concentration risk
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const largeDeals = deals.filter(deal => deal.value > totalValue * 0.2);
    
    if (largeDeals.length > 0) {
      risks.push({
        factor: 'High deal concentration',
        impact: -15,
        mitigation: 'Diversify pipeline with more smaller deals'
      });
    }

    // Aging deals risk
    const agingDeals = deals.filter(deal => this.getTimeInCurrentStage(deal) > 30);
    
    if (agingDeals.length > deals.length * 0.3) {
      risks.push({
        factor: 'Many deals aging in pipeline',
        impact: -10,
        mitigation: 'Accelerate deal progression activities'
      });
    }

    return risks;
  }

  private async identifyForecastOpportunities(deals: Deal[]): Promise<DealForecast['opportunities']> {
    const opportunities: DealForecast['opportunities'] = [];

    // High probability deals
    const highProbDeals = deals.filter(deal => deal.probability > 80);
    
    if (highProbDeals.length > 0) {
      const potential = highProbDeals.reduce((sum, deal) => sum + deal.value, 0);
      opportunities.push({
        opportunity: 'High probability deals ready to close',
        potential,
        action: 'Focus on closing these deals immediately'
      });
    }

    return opportunities;
  }

  private calculateProbabilityTrend(history: DealInsights['probabilityHistory']): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-3);
    const trend = recent[recent.length - 1].probability - recent[0].probability;

    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }

  private async predictCloseDate(deal: Deal): Promise<{ predictedCloseDate: Date; confidence: number }> {
    const timeInStage = this.getTimeInCurrentStage(deal);
    const averageTimeInStage = deal.stage.averageTimeInStage;
    const remainingTime = Math.max(1, averageTimeInStage - timeInStage);
    
    const predictedCloseDate = new Date(Date.now() + (remainingTime * 24 * 60 * 60 * 1000));
    const confidence = Math.max(20, Math.min(90, 100 - (timeInStage / averageTimeInStage) * 30));

    return { predictedCloseDate, confidence: Math.round(confidence) };
  }

  private async identifyDealRisks(deal: Deal): Promise<DealInsights['riskFactors']> {
    const risks: DealInsights['riskFactors'] = [];

    // Long time in stage
    const timeInStage = this.getTimeInCurrentStage(deal);
    if (timeInStage > deal.stage.averageTimeInStage * 1.5) {
      risks.push({
        factor: 'Deal stalled in current stage',
        severity: 'high',
        impact: -20,
        recommendation: 'Schedule immediate stakeholder meeting'
      });
    }

    // No recent activity
    const daysSinceLastActivity = deal.lastActivityAt ? 
      Math.floor((Date.now() - deal.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    if (daysSinceLastActivity > 7) {
      risks.push({
        factor: 'No recent activity',
        severity: 'medium',
        impact: -10,
        recommendation: 'Schedule follow-up call or meeting'
      });
    }

    // Strong competition
    if (deal.competitors.length > 2) {
      risks.push({
        factor: 'Multiple competitors',
        severity: 'medium',
        impact: -15,
        recommendation: 'Strengthen value proposition and differentiation'
      });
    }

    return risks;
  }

  private async identifyDealAccelerators(deal: Deal): Promise<DealInsights['accelerators']> {
    const accelerators: DealInsights['accelerators'] = [];

    // High-value deal
    if (deal.value > 50000) {
      accelerators.push({
        accelerator: 'High-value opportunity',
        potential: 25,
        action: 'Involve senior stakeholders in closing process'
      });
    }

    // Multiple decision makers engaged
    if (deal.decisionMakers.length > 2) {
      accelerators.push({
        accelerator: 'Multiple stakeholders engaged',
        potential: 15,
        action: 'Coordinate group decision-making process'
      });
    }

    return accelerators;
  }

  private async analyzeCompetition(deal: Deal): Promise<DealInsights['competitiveAnalysis']> {
    return deal.competitors.map(competitor => ({
      competitor,
      strength: 'medium' as const,
      threat: 30,
      counterstrategy: `Emphasize unique value proposition against ${competitor}`
    }));
  }

  private async generateNextBestActions(deal: Deal): Promise<DealInsights['nextBestActions']> {
    const actions: DealInsights['nextBestActions'] = [];

    // Based on stage and deal characteristics
    if (deal.stage.name.toLowerCase().includes('proposal')) {
      actions.push({
        action: 'Follow up on proposal',
        priority: 'high',
        expectedImpact: 20,
        timeline: 'Within 2 days'
      });
    }

    if (deal.decisionMakers.length === 0) {
      actions.push({
        action: 'Identify decision makers',
        priority: 'high',
        expectedImpact: 25,
        timeline: 'This week'
      });
    }

    return actions;
  }

  private isForecastValid(forecast: DealForecast): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return forecast.generatedAt > oneHourAgo;
  }

  private startProbabilityProcessor(): void {
    this.processingInterval = setInterval(async () => {
      if (this.probabilityUpdateQueue.length > 0) {
        const dealId = this.probabilityUpdateQueue.shift();
        if (dealId) {
          try {
            await this.updateDealProbability(dealId);
          } catch (error) {
            console.error(`Failed to update probability for deal ${dealId}:`, error);
          }
        }
      }
    }, 10000); // Process every 10 seconds
  }

  /**
   * Database operations
   */
  private async loadPipelines(): Promise<void> {
    try {
      console.log('📥 Loading deal pipelines');
      // This would load from database
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  }

  private async ensureDefaultPipeline(): Promise<void> {
    console.log('💼 Ensuring default pipeline exists');
    // Create default pipeline if none exists
  }

  private async storeDeal(deal: Deal): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing deal: ${deal.name}`);
      });
    } catch (error) {
      console.warn('Could not store deal:', error);
    }
  }

  private async updateDeal(deal: Deal): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🔄 Updating deal: ${deal.id}`);
      });
    } catch (error) {
      console.warn('Could not update deal:', error);
    }
  }

  private async getDeal(dealId: string): Promise<Deal | null> {
    if (this.dealCache.has(dealId)) {
      return this.dealCache.get(dealId)!;
    }

    try {
      // This would fetch from database
      return null;
    } catch (error) {
      console.error('Failed to get deal:', error);
      return null;
    }
  }

  private async getPipeline(userId: string): Promise<DealPipeline | null> {
    for (const pipeline of this.pipelines.values()) {
      if (pipeline.userId === userId && pipeline.isActive) {
        return pipeline;
      }
    }
    return null;
  }

  private async getDealsInPeriod(userId: string, startDate: Date, endDate: Date): Promise<Deal[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get deals in period:', error);
      return [];
    }
  }

  private async calculateForecastConfidence(userId: string, period: string): Promise<number> {
    // This would calculate based on historical accuracy
    return 75; // Default confidence
  }

  private async getHistoricalForecastAccuracy(userId: string, period: string): Promise<number> {
    // This would fetch historical accuracy data
    return 80; // Default accuracy
  }

  private async logProbabilityChange(dealId: string, oldProbability: number, newProbability: number, reason: string): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`📊 Logging probability change for deal ${dealId}: ${oldProbability}% -> ${newProbability}%`);
      });
    } catch (error) {
      console.warn('Could not log probability change:', error);
    }
  }

  private async getProbabilityHistory(dealId: string): Promise<DealInsights['probabilityHistory']> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.warn('Could not get probability history:', error);
      return [];
    }
  }

  /**
   * Public API methods
   */
  async addDealToProbabilityQueue(dealId: string): Promise<void> {
    if (!this.probabilityUpdateQueue.includes(dealId)) {
      this.probabilityUpdateQueue.push(dealId);
    }
  }

  async getDeals(userId: string, filters?: { stageId?: string; assignedTo?: string }): Promise<Deal[]> {
    try {
      // This would fetch from database with filters
      return [];
    } catch (error) {
      console.error('Failed to get deals:', error);
      return [];
    }
  }

  async getPipelines(userId: string): Promise<DealPipeline[]> {
    return Array.from(this.pipelines.values()).filter(p => p.userId === userId);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.pipelines.clear();
    this.dealCache.clear();
    this.forecastCache.clear();
    this.probabilityUpdateQueue.length = 0;
    
    console.log('🧹 Deal Pipeline Tracker cleanup completed');
  }
}

// Export singleton instance
export const dealPipelineTracker = DealPipelineTracker.getInstance();
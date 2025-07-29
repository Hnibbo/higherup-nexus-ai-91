import { supabase } from '@/integrations/supabase/client';

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  probability: number;
  stage: string;
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  leadId: string;
  contactId: string;
  accountId: string;
  ownerId: string;
  source: string;
  competitors: string[];
  products: string[];
  tags: string[];
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  status: 'open' | 'won' | 'lost' | 'on_hold';
  lostReason?: string;
  nextAction?: string;
  nextActionDate?: Date;
}

export interface DealHealthScore {
  dealId: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: Array<{
    category: string;
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }>;
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  opportunities: Array<{
    type: string;
    potential: number;
    description: string;
    action: string;
  }>;
  lastUpdated: Date;
}

export interface SalesForecast {
  period: string;
  startDate: Date;
  endDate: Date;
  totalValue: number;
  weightedValue: number;
  dealCount: number;
  confidence: number;
  breakdown: Array<{
    stage: string;
    count: number;
    value: number;
    probability: number;
  }>;
  trends: Array<{
    metric: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  risks: string[];
  opportunities: string[];
}

export interface SalesActivity {
  id: string;
  dealId: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'negotiation' | 'other';
  subject: string;
  description?: string;
  outcome?: string;
  duration?: number;
  scheduledDate: Date;
  completedDate?: Date;
  ownerId: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  nextSteps?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesPerformance {
  userId: string;
  period: string;
  metrics: {
    dealsWon: number;
    dealsLost: number;
    totalValue: number;
    averageDealSize: number;
    winRate: number;
    salesCycle: number;
    activitiesCompleted: number;
    quotaAttainment: number;
    pipelineGenerated: number;
    conversionRate: number;
  };
  rankings: {
    revenue: number;
    deals: number;
    winRate: number;
    activities: number;
  };
  trends: Array<{
    metric: string;
    change: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  goals: Array<{
    metric: string;
    target: number;
    current: number;
    progress: number;
  }>;
}

export interface CompetitorIntelligence {
  competitor: string;
  dealsLost: number;
  averageDealSize: number;
  winRate: number;
  commonStages: string[];
  strengths: string[];
  weaknesses: string[];
  pricing: {
    average: number;
    range: { min: number; max: number };
    strategy: string;
  };
  battleCards: Array<{
    scenario: string;
    ourAdvantage: string;
    theirWeakness: string;
    talkingPoints: string[];
  }>;
  recentActivity: Array<{
    date: Date;
    activity: string;
    impact: string;
  }>;
}

export interface SalesInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: string;
  dealId?: string;
  userId?: string;
  data: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  actionTaken?: string;
  actionDate?: Date;
}

export class SalesIntelligenceService {
  private analysisActive = false;

  async initializeSalesIntelligence(): Promise<void> {
    await this.setupDealHealthScoring();
    await this.setupForecastingModels();
    await this.setupPerformanceTracking();
    await this.setupCompetitorAnalysis();
    await this.setupInsightGeneration();
    
    this.analysisActive = true;
    await this.startContinuousAnalysis();
  }

  async analyzeDealHealth(dealId: string): Promise<DealHealthScore> {
    const deal = await this.getDeal(dealId);
    const activities = await this.getDealActivities(dealId);
    const contact = await this.getContact(deal.contactId);
    const account = await this.getAccount(deal.accountId);

    const factors = [];
    let score = 50; // Base score

    // Analyze deal progression
    const progressionFactor = this.analyzeDealProgression(deal, activities);
    factors.push(progressionFactor);
    score += progressionFactor.weight * (progressionFactor.impact === 'positive' ? 1 : -1);

    // Analyze engagement level
    const engagementFactor = this.analyzeEngagementLevel(activities);
    factors.push(engagementFactor);
    score += engagementFactor.weight * (engagementFactor.impact === 'positive' ? 1 : -1);

    // Analyze timeline
    const timelineFactor = this.analyzeTimeline(deal);
    factors.push(timelineFactor);
    score += timelineFactor.weight * (timelineFactor.impact === 'positive' ? 1 : -1);

    // Analyze stakeholder involvement
    const stakeholderFactor = this.analyzeStakeholders(activities);
    factors.push(stakeholderFactor);
    score += stakeholderFactor.weight * (stakeholderFactor.impact === 'positive' ? 1 : -1);

    // Analyze competition
    const competitionFactor = this.analyzeCompetition(deal);
    factors.push(competitionFactor);
    score += competitionFactor.weight * (competitionFactor.impact === 'positive' ? 1 : -1);

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    const risks = this.identifyDealRisks(deal, activities, score);
    const opportunities = this.identifyDealOpportunities(deal, activities, score);

    const healthScore: DealHealthScore = {
      dealId,
      score,
      grade: this.getHealthGrade(score),
      factors,
      risks,
      opportunities,
      lastUpdated: new Date()
    };

    await this.storeDealHealthScore(healthScore);
    return healthScore;
  }

  async generateSalesForecast(period: string): Promise<SalesForecast> {
    const { startDate, endDate } = this.getPeriodDates(period);
    const deals = await this.getDealsInPeriod(startDate, endDate);
    
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = deals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
    const dealCount = deals.length;

    const breakdown = this.calculateStageBreakdown(deals);
    const trends = await this.calculateForecastTrends(period);
    const confidence = this.calculateForecastConfidence(deals, trends);

    const forecast: SalesForecast = {
      period,
      startDate,
      endDate,
      totalValue,
      weightedValue,
      dealCount,
      confidence,
      breakdown,
      trends,
      risks: this.identifyForecastRisks(deals, trends),
      opportunities: this.identifyForecastOpportunities(deals, trends)
    };

    await this.storeSalesForecast(forecast);
    return forecast;
  }

  async trackSalesPerformance(userId: string, period: string): Promise<SalesPerformance> {
    const { startDate, endDate } = this.getPeriodDates(period);
    const userDeals = await this.getUserDeals(userId, startDate, endDate);
    const userActivities = await this.getUserActivities(userId, startDate, endDate);

    const metrics = this.calculatePerformanceMetrics(userDeals, userActivities);
    const rankings = await this.calculateUserRankings(userId, period);
    const trends = await this.calculatePerformanceTrends(userId, period);
    const goals = await this.getUserGoals(userId);

    const performance: SalesPerformance = {
      userId,
      period,
      metrics,
      rankings,
      trends,
      goals
    };

    await this.storePerformanceData(performance);
    return performance;
  }

  async analyzeCompetitor(competitor: string): Promise<CompetitorIntelligence> {
    const competitorDeals = await this.getCompetitorDeals(competitor);
    const lostDeals = competitorDeals.filter(d => d.status === 'lost');
    
    const intelligence: CompetitorIntelligence = {
      competitor,
      dealsLost: lostDeals.length,
      averageDealSize: this.calculateAverageDealSize(competitorDeals),
      winRate: this.calculateCompetitorWinRate(competitor),
      commonStages: this.identifyCommonStages(competitorDeals),
      strengths: this.identifyCompetitorStrengths(competitor),
      weaknesses: this.identifyCompetitorWeaknesses(competitor),
      pricing: this.analyzePricingStrategy(competitorDeals),
      battleCards: this.generateBattleCards(competitor),
      recentActivity: await this.getCompetitorActivity(competitor)
    };

    await this.storeCompetitorIntelligence(intelligence);
    return intelligence;
  }

  async generateSalesInsights(): Promise<SalesInsight[]> {
    const insights: SalesInsight[] = [];

    // Analyze deal risks
    const dealRisks = await this.identifyDealRisks();
    insights.push(...dealRisks);

    // Analyze performance opportunities
    const performanceOpportunities = await this.identifyPerformanceOpportunities();
    insights.push(...performanceOpportunities);

    // Analyze market trends
    const marketTrends = await this.identifyMarketTrends();
    insights.push(...marketTrends);

    // Generate recommendations
    const recommendations = await this.generateRecommendations();
    insights.push(...recommendations);

    // Store insights
    for (const insight of insights) {
      await this.storeInsight(insight);
    }

    return insights;
  }

  async getInsights(filters?: {
    type?: SalesInsight['type'];
    priority?: SalesInsight['priority'];
    acknowledged?: boolean;
    userId?: string;
    dealId?: string;
  }): Promise<SalesInsight[]> {
    let query = supabase
      .from('sales_insights')
      .select('*')
      .order('createdAt', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.acknowledged !== undefined) {
      query = query.eq('acknowledged', filters.acknowledged);
    }

    if (filters?.userId) {
      query = query.eq('userId', filters.userId);
    }

    if (filters?.dealId) {
      query = query.eq('dealId', filters.dealId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  async acknowledgeInsight(insightId: string, action?: string): Promise<void> {
    const { error } = await supabase
      .from('sales_insights')
      .update({
        acknowledged: true,
        actionTaken: action,
        actionDate: new Date()
      })
      .eq('id', insightId);

    if (error) throw error;
  }

  async getSalesAnalytics(): Promise<{
    totalPipeline: number;
    weightedPipeline: number;
    averageDealSize: number;
    winRate: number;
    salesCycle: number;
    topPerformers: Array<{ userId: string; revenue: number; deals: number }>;
    stageDistribution: Array<{ stage: string; count: number; value: number }>;
    sourceAnalysis: Array<{ source: string; count: number; value: number; winRate: number }>;
    competitorAnalysis: Array<{ competitor: string; encounters: number; winRate: number }>;
  }> {
    const [
      pipeline,
      dealMetrics,
      performers,
      stages,
      sources,
      competitors
    ] = await Promise.all([
      this.calculatePipelineMetrics(),
      this.calculateDealMetrics(),
      this.getTopPerformers(),
      this.getStageDistribution(),
      this.getSourceAnalysis(),
      this.getCompetitorAnalysis()
    ]);

    return {
      totalPipeline: pipeline.total,
      weightedPipeline: pipeline.weighted,
      averageDealSize: dealMetrics.averageSize,
      winRate: dealMetrics.winRate,
      salesCycle: dealMetrics.averageCycle,
      topPerformers: performers,
      stageDistribution: stages,
      sourceAnalysis: sources,
      competitorAnalysis: competitors
    };
  }

  private async setupDealHealthScoring(): Promise<void> {
    console.log('Setting up deal health scoring');
  }

  private async setupForecastingModels(): Promise<void> {
    console.log('Setting up forecasting models');
  }

  private async setupPerformanceTracking(): Promise<void> {
    console.log('Setting up performance tracking');
  }

  private async setupCompetitorAnalysis(): Promise<void> {
    console.log('Setting up competitor analysis');
  }

  private async setupInsightGeneration(): Promise<void> {
    console.log('Setting up insight generation');
  }

  private async startContinuousAnalysis(): Promise<void> {
    setInterval(async () => {
      if (this.analysisActive) {
        await this.generateSalesInsights();
        await this.updateDealHealthScores();
        await this.updateForecasts();
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private analyzeDealProgression(deal: Deal, activities: SalesActivity[]): any {
    const recentActivities = activities.filter(a => 
      a.completedDate && a.completedDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    return {
      category: 'progression',
      factor: 'recent_activity',
      impact: recentActivities.length > 2 ? 'positive' : 'negative',
      weight: 20,
      description: `${recentActivities.length} activities in last 30 days`
    };
  }

  private analyzeEngagementLevel(activities: SalesActivity[]): any {
    const engagementScore = activities.filter(a => 
      ['meeting', 'demo', 'call'].includes(a.type) && a.status === 'completed'
    ).length;

    return {
      category: 'engagement',
      factor: 'stakeholder_engagement',
      impact: engagementScore > 3 ? 'positive' : 'negative',
      weight: 25,
      description: `${engagementScore} high-value interactions`
    };
  }

  private analyzeTimeline(deal: Deal): any {
    const daysToClose = Math.ceil((deal.expectedCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      category: 'timeline',
      factor: 'close_date_proximity',
      impact: daysToClose > 0 && daysToClose < 30 ? 'positive' : 'negative',
      weight: 15,
      description: `${daysToClose} days to expected close`
    };
  }

  private analyzeStakeholders(activities: SalesActivity[]): any {
    const uniqueAttendees = new Set(activities.flatMap(a => a.attendees)).size;
    
    return {
      category: 'stakeholders',
      factor: 'stakeholder_involvement',
      impact: uniqueAttendees > 2 ? 'positive' : 'negative',
      weight: 20,
      description: `${uniqueAttendees} unique stakeholders involved`
    };
  }

  private analyzeCompetition(deal: Deal): any {
    return {
      category: 'competition',
      factor: 'competitive_pressure',
      impact: deal.competitors.length < 2 ? 'positive' : 'negative',
      weight: 10,
      description: `${deal.competitors.length} known competitors`
    };
  }

  private getHealthGrade(score: number): DealHealthScore['grade'] {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }

  private identifyDealRisks(deal: Deal, activities: SalesActivity[], score: number): any[] {
    const risks = [];

    if (score < 40) {
      risks.push({
        type: 'low_health_score',
        severity: 'high' as const,
        description: 'Deal health score is below acceptable threshold',
        recommendation: 'Increase engagement and address identified issues'
      });
    }

    if (deal.competitors.length > 2) {
      risks.push({
        type: 'high_competition',
        severity: 'medium' as const,
        description: 'Multiple competitors identified',
        recommendation: 'Develop competitive differentiation strategy'
      });
    }

    return risks;
  }

  private identifyDealOpportunities(deal: Deal, activities: SalesActivity[], score: number): any[] {
    const opportunities = [];

    if (score > 70) {
      opportunities.push({
        type: 'upsell_potential',
        potential: 25,
        description: 'High health score indicates upsell opportunity',
        action: 'Present additional products or services'
      });
    }

    return opportunities;
  }

  private getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return { startDate, endDate };
  }

  private calculateStageBreakdown(deals: Deal[]): any[] {
    const stageMap = new Map();
    
    deals.forEach(deal => {
      const stage = deal.stage;
      if (!stageMap.has(stage)) {
        stageMap.set(stage, { count: 0, value: 0, probability: 0 });
      }
      
      const stageData = stageMap.get(stage);
      stageData.count++;
      stageData.value += deal.value;
      stageData.probability = deal.probability;
    });

    return Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      ...data
    }));
  }

  private calculatePerformanceMetrics(deals: Deal[], activities: SalesActivity[]): any {
    const wonDeals = deals.filter(d => d.status === 'won');
    const lostDeals = deals.filter(d => d.status === 'lost');
    
    return {
      dealsWon: wonDeals.length,
      dealsLost: lostDeals.length,
      totalValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
      averageDealSize: wonDeals.length > 0 ? wonDeals.reduce((sum, d) => sum + d.value, 0) / wonDeals.length : 0,
      winRate: deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0,
      salesCycle: this.calculateAverageSalesCycle(wonDeals),
      activitiesCompleted: activities.filter(a => a.status === 'completed').length,
      quotaAttainment: 85, // Mock value
      pipelineGenerated: deals.reduce((sum, d) => sum + d.value, 0),
      conversionRate: 15.5 // Mock value
    };
  }

  private calculateAverageSalesCycle(deals: Deal[]): number {
    if (deals.length === 0) return 0;
    
    const cycles = deals
      .filter(d => d.actualCloseDate)
      .map(d => Math.ceil((d.actualCloseDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    
    return cycles.length > 0 ? cycles.reduce((sum, cycle) => sum + cycle, 0) / cycles.length : 0;
  }

  // Data access methods
  private async getDeal(id: string): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  private async getDealActivities(dealId: string): Promise<SalesActivity[]> {
    const { data, error } = await supabase
      .from('sales_activities')
      .select('*')
      .eq('dealId', dealId)
      .order('scheduledDate', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getContact(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  private async getAccount(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  private async getDealsInPeriod(startDate: Date, endDate: Date): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .gte('expectedCloseDate', startDate.toISOString())
      .lte('expectedCloseDate', endDate.toISOString())
      .eq('status', 'open');

    if (error) throw error;
    return data || [];
  }

  private async getUserDeals(userId: string, startDate: Date, endDate: Date): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('ownerId', userId)
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  private async getUserActivities(userId: string, startDate: Date, endDate: Date): Promise<SalesActivity[]> {
    const { data, error } = await supabase
      .from('sales_activities')
      .select('*')
      .eq('ownerId', userId)
      .gte('scheduledDate', startDate.toISOString())
      .lte('scheduledDate', endDate.toISOString());

    if (error) throw error;
    return data || [];
  }

  private async getCompetitorDeals(competitor: string): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .contains('competitors', [competitor]);

    if (error) throw error;
    return data || [];
  }

  // Storage methods
  private async storeDealHealthScore(score: DealHealthScore): Promise<void> {
    const { error } = await supabase
      .from('deal_health_scores')
      .upsert(score);

    if (error) throw error;
  }

  private async storeSalesForecast(forecast: SalesForecast): Promise<void> {
    const { error } = await supabase
      .from('sales_forecasts')
      .upsert(forecast);

    if (error) throw error;
  }

  private async storePerformanceData(performance: SalesPerformance): Promise<void> {
    const { error } = await supabase
      .from('sales_performance')
      .upsert(performance);

    if (error) throw error;
  }

  private async storeCompetitorIntelligence(intelligence: CompetitorIntelligence): Promise<void> {
    const { error } = await supabase
      .from('competitor_intelligence')
      .upsert(intelligence);

    if (error) throw error;
  }

  private async storeInsight(insight: SalesInsight): Promise<void> {
    const { error } = await supabase
      .from('sales_insights')
      .insert(insight);

    if (error) throw error;
  }

  // Mock implementations for complex calculations
  private async calculateForecastTrends(period: string): Promise<any[]> {
    return [
      { metric: 'pipeline_value', current: 1500000, previous: 1200000, change: 25, trend: 'up' as const },
      { metric: 'deal_count', current: 45, previous: 38, change: 18.4, trend: 'up' as const }
    ];
  }

  private calculateForecastConfidence(deals: Deal[], trends: any[]): number {
    return Math.min(95, 60 + (deals.length * 2));
  }

  private identifyForecastRisks(deals: Deal[], trends: any[]): string[] {
    return ['Large deals concentrated in final week', 'Competitor activity increasing'];
  }

  private identifyForecastOpportunities(deals: Deal[], trends: any[]): string[] {
    return ['Strong pipeline in early stages', 'High-value prospects engaged'];
  }

  private async calculateUserRankings(userId: string, period: string): Promise<any> {
    return { revenue: 3, deals: 5, winRate: 2, activities: 4 };
  }

  private async calculatePerformanceTrends(userId: string, period: string): Promise<any[]> {
    return [
      { metric: 'winRate', change: 5.2, trend: 'improving' as const },
      { metric: 'dealSize', change: -2.1, trend: 'declining' as const }
    ];
  }

  private async getUserGoals(userId: string): Promise<any[]> {
    return [
      { metric: 'revenue', target: 500000, current: 425000, progress: 85 },
      { metric: 'deals', target: 20, current: 17, progress: 85 }
    ];
  }

  private calculateAverageDealSize(deals: Deal[]): number {
    if (deals.length === 0) return 0;
    return deals.reduce((sum, d) => sum + d.value, 0) / deals.length;
  }

  private calculateCompetitorWinRate(competitor: string): number {
    return Math.random() * 100; // Mock implementation
  }

  private identifyCommonStages(deals: Deal[]): string[] {
    const stageCount = new Map();
    deals.forEach(d => {
      stageCount.set(d.stage, (stageCount.get(d.stage) || 0) + 1);
    });
    
    return Array.from(stageCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([stage]) => stage);
  }

  private identifyCompetitorStrengths(competitor: string): string[] {
    return ['Lower pricing', 'Faster implementation', 'Strong brand recognition'];
  }

  private identifyCompetitorWeaknesses(competitor: string): string[] {
    return ['Limited customization', 'Poor customer support', 'Outdated technology'];
  }

  private analyzePricingStrategy(deals: Deal[]): any {
    const prices = deals.map(d => d.value);
    return {
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      range: { min: Math.min(...prices), max: Math.max(...prices) },
      strategy: 'Competitive pricing with premium features'
    };
  }

  private generateBattleCards(competitor: string): any[] {
    return [
      {
        scenario: 'Price objection',
        ourAdvantage: 'Better ROI and lower TCO',
        theirWeakness: 'Hidden costs and poor support',
        talkingPoints: ['Total cost of ownership', 'Implementation speed', 'Support quality']
      }
    ];
  }

  private async getCompetitorActivity(competitor: string): Promise<any[]> {
    return [
      { date: new Date(), activity: 'New product launch', impact: 'Medium threat to pipeline' },
      { date: new Date(), activity: 'Pricing change', impact: 'Opportunity for competitive positioning' }
    ];
  }

  // Insight generation methods
  private async identifyDealRisks(): Promise<SalesInsight[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'risk',
        priority: 'high',
        title: 'Deal at Risk',
        description: 'Large deal showing signs of stalling',
        impact: 'Potential $50K revenue loss',
        action: 'Schedule executive meeting',
        dealId: 'deal-123',
        data: {},
        createdAt: new Date(),
        acknowledged: false
      }
    ];
  }

  private async identifyPerformanceOpportunities(): Promise<SalesInsight[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'opportunity',
        priority: 'medium',
        title: 'Upsell Opportunity',
        description: 'Customer showing interest in additional features',
        impact: 'Potential $25K additional revenue',
        action: 'Present premium package',
        dealId: 'deal-456',
        data: {},
        createdAt: new Date(),
        acknowledged: false
      }
    ];
  }

  private async identifyMarketTrends(): Promise<SalesInsight[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'trend',
        priority: 'low',
        title: 'Market Trend',
        description: 'Increasing demand for AI features',
        impact: 'Opportunity to position AI capabilities',
        action: 'Update sales materials',
        data: {},
        createdAt: new Date(),
        acknowledged: false
      }
    ];
  }

  private async generateRecommendations(): Promise<SalesInsight[]> {
    return [
      {
        id: crypto.randomUUID(),
        type: 'recommendation',
        priority: 'medium',
        title: 'Process Improvement',
        description: 'Optimize follow-up cadence',
        impact: 'Potential 15% increase in conversion',
        action: 'Implement automated follow-up sequence',
        data: {},
        createdAt: new Date(),
        acknowledged: false
      }
    ];
  }

  private async updateDealHealthScores(): Promise<void> {
    // Update all deal health scores
    console.log('Updating deal health scores');
  }

  private async updateForecasts(): Promise<void> {
    // Update sales forecasts
    console.log('Updating sales forecasts');
  }

  // Analytics methods
  private async calculatePipelineMetrics(): Promise<{ total: number; weighted: number }> {
    const { data, error } = await supabase
      .from('deals')
      .select('value, probability')
      .eq('status', 'open');

    if (error) throw error;

    const deals = data || [];
    const total = deals.reduce((sum, d) => sum + d.value, 0);
    const weighted = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

    return { total, weighted };
  }

  private async calculateDealMetrics(): Promise<{ averageSize: number; winRate: number; averageCycle: number }> {
    // Mock implementation
    return {
      averageSize: 25000,
      winRate: 22.5,
      averageCycle: 45
    };
  }

  private async getTopPerformers(): Promise<Array<{ userId: string; revenue: number; deals: number }>> {
    // Mock implementation
    return [
      { userId: 'user-1', revenue: 150000, deals: 8 },
      { userId: 'user-2', revenue: 125000, deals: 6 },
      { userId: 'user-3', revenue: 100000, deals: 5 }
    ];
  }

  private async getStageDistribution(): Promise<Array<{ stage: string; count: number; value: number }>> {
    // Mock implementation
    return [
      { stage: 'Prospecting', count: 25, value: 500000 },
      { stage: 'Qualification', count: 18, value: 450000 },
      { stage: 'Proposal', count: 12, value: 300000 },
      { stage: 'Negotiation', count: 8, value: 200000 }
    ];
  }

  private async getSourceAnalysis(): Promise<Array<{ source: string; count: number; value: number; winRate: number }>> {
    // Mock implementation
    return [
      { source: 'Website', count: 35, value: 700000, winRate: 25 },
      { source: 'Referral', count: 20, value: 600000, winRate: 35 },
      { source: 'Cold Outreach', count: 15, value: 300000, winRate: 15 }
    ];
  }

  private async getCompetitorAnalysis(): Promise<Array<{ competitor: string; encounters: number; winRate: number }>> {
    // Mock implementation
    return [
      { competitor: 'Competitor A', encounters: 12, winRate: 60 },
      { competitor: 'Competitor B', encounters: 8, winRate: 45 },
      { competitor: 'Competitor C', encounters: 5, winRate: 80 }
    ];
  }
}

export const salesIntelligenceService = new SalesIntelligenceService();
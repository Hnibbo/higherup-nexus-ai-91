import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { predictiveAnalyticsService } from '../analytics/PredictiveAnalyticsService';
import { nlpEngine } from './NLPEngine';

export interface AIQuery {
  id: string;
  user_id: string;
  query_text: string;
  query_type: 'data_analysis' | 'recommendation' | 'prediction' | 'optimization' | 'general';
  intent: string;
  entities: Array<{
    entity: string;
    value: string;
    confidence: number;
  }>;
  context: Record<string, any>;
  response: AIResponse;
  created_at: Date;
}

export interface AIResponse {
  response_text: string;
  response_type: 'text' | 'chart' | 'table' | 'action' | 'mixed';
  data: any;
  confidence: number;
  suggestions: string[];
  follow_up_questions: string[];
  actions: Array<{
    action_type: string;
    action_label: string;
    action_data: any;
  }>;
}

export interface AIInsight {
  id: string;
  user_id: string;
  insight_type: 'performance' | 'opportunity' | 'risk' | 'trend' | 'anomaly';
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  data_source: string;
  supporting_data: any;
  recommended_actions: string[];
  created_at: Date;
  acknowledged: boolean;
}

export interface WorkflowSuggestion {
  id: string;
  user_id: string;
  suggestion_type: 'automation' | 'optimization' | 'integration' | 'process_improvement';
  title: string;
  description: string;
  current_process: string;
  suggested_process: string;
  benefits: string[];
  implementation_steps: string[];
  effort_estimate: 'low' | 'medium' | 'high';
  impact_estimate: 'low' | 'medium' | 'high';
  created_at: Date;
  status: 'suggested' | 'accepted' | 'implemented' | 'rejected';
}

export interface VoiceCommand {
  command: string;
  intent: string;
  parameters: Record<string, any>;
  response: string;
  action?: () => Promise<any>;
}

export interface ContextualHelp {
  page: string;
  section: string;
  help_content: {
    title: string;
    description: string;
    steps: string[];
    tips: string[];
    related_features: string[];
    video_url?: string;
  };
  user_level: 'beginner' | 'intermediate' | 'advanced';
}

export class AIAssistantService {
  private static instance: AIAssistantService;
  private conversationHistory: Map<string, AIQuery[]> = new Map();

  private constructor() {}

  public static getInstance(): AIAssistantService {
    if (!AIAssistantService.instance) {
      AIAssistantService.instance = new AIAssistantService();
    }
    return AIAssistantService.instance;
  }

  // Natural Language Query Processing
  async processNaturalLanguageQuery(userId: string, queryText: string, context?: Record<string, any>): Promise<AIQuery> {
    try {
      console.log(`🤖 Processing natural language query: "${queryText}"`);

      // Analyze query intent and entities
      const analysis = await this.analyzeQuery(queryText);
      
      // Get conversation history for context
      const history = this.conversationHistory.get(userId) || [];
      
      // Generate response based on query type
      const response = await this.generateResponse(userId, analysis, context, history);
      
      // Create query record
      const query: AIQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        query_text: queryText,
        query_type: analysis.query_type,
        intent: analysis.intent,
        entities: analysis.entities,
        context: context || {},
        response,
        created_at: new Date()
      };

      // Store query and update conversation history
      await this.storeQuery(query);
      this.updateConversationHistory(userId, query);

      console.log(`✅ Query processed with ${response.confidence}% confidence`);
      return query;

    } catch (error) {
      console.error('❌ Failed to process natural language query:', error);
      throw error;
    }
  }

  private async analyzeQuery(queryText: string): Promise<{
    query_type: AIQuery['query_type'];
    intent: string;
    entities: AIQuery['entities'];
  }> {
    // Use NLP engine to analyze the query
    const nlpResult = await nlpEngine.analyzeText(queryText);
    
    // Determine query type based on keywords and intent
    const queryType = this.determineQueryType(queryText, nlpResult.intent);
    
    // Extract entities
    const entities = this.extractEntities(queryText, nlpResult);

    return {
      query_type: queryType,
      intent: nlpResult.intent,
      entities
    };
  }

  private determineQueryType(queryText: string, intent: string): AIQuery['query_type'] {
    const text = queryText.toLowerCase();
    
    // Data analysis queries
    if (text.includes('show') || text.includes('what') || text.includes('how many') || 
        text.includes('analyze') || text.includes('report') || text.includes('dashboard')) {
      return 'data_analysis';
    }
    
    // Prediction queries
    if (text.includes('predict') || text.includes('forecast') || text.includes('will') || 
        text.includes('expect') || text.includes('future')) {
      return 'prediction';
    }
    
    // Recommendation queries
    if (text.includes('recommend') || text.includes('suggest') || text.includes('should') || 
        text.includes('best') || text.includes('optimize')) {
      return 'recommendation';
    }
    
    // Optimization queries
    if (text.includes('improve') || text.includes('increase') || text.includes('boost') || 
        text.includes('enhance') || text.includes('fix')) {
      return 'optimization';
    }
    
    return 'general';
  }

  private extractEntities(queryText: string, nlpResult: any): AIQuery['entities'] {
    const entities: AIQuery['entities'] = [];
    
    // Extract common business entities
    const entityPatterns = {
      'metric': /\b(revenue|conversion|clicks|opens|sales|customers|leads|traffic)\b/gi,
      'time_period': /\b(today|yesterday|week|month|quarter|year|last|this|next)\b/gi,
      'channel': /\b(email|funnel|social|web|mobile|desktop)\b/gi,
      'action': /\b(create|send|optimize|analyze|report|export)\b/gi
    };

    for (const [entityType, pattern] of Object.entries(entityPatterns)) {
      const matches = queryText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          entities.push({
            entity: entityType,
            value: match.toLowerCase(),
            confidence: 0.8
          });
        });
      }
    }

    return entities;
  }

  private async generateResponse(userId: string, analysis: any, context: any, history: AIQuery[]): Promise<AIResponse> {
    switch (analysis.query_type) {
      case 'data_analysis':
        return await this.generateDataAnalysisResponse(userId, analysis, context);
      case 'prediction':
        return await this.generatePredictionResponse(userId, analysis, context);
      case 'recommendation':
        return await this.generateRecommendationResponse(userId, analysis, context);
      case 'optimization':
        return await this.generateOptimizationResponse(userId, analysis, context);
      default:
        return await this.generateGeneralResponse(userId, analysis, context);
    }
  }

  private async generateDataAnalysisResponse(userId: string, analysis: any, context: any): Promise<AIResponse> {
    // Extract what data the user wants to see
    const metricEntity = analysis.entities.find((e: any) => e.entity === 'metric');
    const timeEntity = analysis.entities.find((e: any) => e.entity === 'time_period');
    
    let responseText = "Here's your data analysis:";
    let data = {};
    
    if (metricEntity) {
      // Get relevant metrics
      switch (metricEntity.value) {
        case 'revenue':
          data = await this.getRevenueData(userId, timeEntity?.value);
          responseText = `Your revenue ${timeEntity?.value || 'recently'} shows the following trends:`;
          break;
        case 'conversion':
          data = await this.getConversionData(userId, timeEntity?.value);
          responseText = `Your conversion rates ${timeEntity?.value || 'recently'} are performing as follows:`;
          break;
        case 'email':
          data = await this.getEmailData(userId, timeEntity?.value);
          responseText = `Your email performance ${timeEntity?.value || 'recently'} shows:`;
          break;
        default:
          data = await this.getOverviewData(userId);
          responseText = "Here's an overview of your key metrics:";
      }
    }

    return {
      response_text: responseText,
      response_type: 'mixed',
      data,
      confidence: 85,
      suggestions: [
        "Would you like me to create a detailed report?",
        "Should I set up alerts for these metrics?",
        "Want to see a comparison with previous periods?"
      ],
      follow_up_questions: [
        "What specific time period would you like to analyze?",
        "Which metrics are most important to you?",
        "Would you like to see this data broken down by channel?"
      ],
      actions: [
        {
          action_type: 'create_report',
          action_label: 'Generate Detailed Report',
          action_data: { metrics: [metricEntity?.value], period: timeEntity?.value }
        },
        {
          action_type: 'create_alert',
          action_label: 'Set Up Alert',
          action_data: { metric: metricEntity?.value }
        }
      ]
    };
  }

  private async generatePredictionResponse(userId: string, analysis: any, context: any): Promise<AIResponse> {
    const metricEntity = analysis.entities.find((e: any) => e.entity === 'metric');
    const timeEntity = analysis.entities.find((e: any) => e.entity === 'time_period');
    
    let responseText = "Based on your historical data, here are my predictions:";
    let data = {};
    
    if (metricEntity?.value === 'revenue') {
      // Generate revenue forecast
      const forecast = await predictiveAnalyticsService.generateRevenueForecast(userId, 'monthly', 30);
      data = forecast;
      responseText = `Based on your revenue patterns, I predict the following for the next ${timeEntity?.value || 'month'}:`;
    } else {
      // General prediction
      data = {
        prediction: "Growth trend expected",
        confidence: 78,
        factors: ["Historical performance", "Market trends", "Seasonal patterns"]
      };
    }

    return {
      response_text: responseText,
      response_type: 'mixed',
      data,
      confidence: 78,
      suggestions: [
        "Would you like me to explain the factors behind this prediction?",
        "Should I create a detailed forecast report?",
        "Want to see different scenarios?"
      ],
      follow_up_questions: [
        "What actions would you like to take based on this prediction?",
        "Which factors are you most concerned about?",
        "Would you like alerts when predictions change significantly?"
      ],
      actions: [
        {
          action_type: 'create_forecast',
          action_label: 'Generate Detailed Forecast',
          action_data: { metric: metricEntity?.value, period: timeEntity?.value }
        }
      ]
    };
  }

  private async generateRecommendationResponse(userId: string, analysis: any, context: any): Promise<AIResponse> {
    // Get optimization recommendations
    const recommendations = await predictiveAnalyticsService.generateOptimizationRecommendations(userId);
    
    const topRecommendation = recommendations[0];
    
    return {
      response_text: `Based on your current performance, here's my top recommendation: ${topRecommendation?.title || 'Focus on improving your key metrics'}`,
      response_type: 'mixed',
      data: {
        recommendations: recommendations.slice(0, 3),
        priority_actions: recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')
      },
      confidence: 82,
      suggestions: [
        "Would you like me to create an implementation plan?",
        "Should I prioritize these recommendations?",
        "Want to see the expected impact of each recommendation?"
      ],
      follow_up_questions: [
        "Which recommendation would you like to implement first?",
        "Do you need help with any specific implementation steps?",
        "Would you like me to track the progress of these improvements?"
      ],
      actions: [
        {
          action_type: 'create_plan',
          action_label: 'Create Implementation Plan',
          action_data: { recommendations: recommendations.slice(0, 3) }
        },
        {
          action_type: 'schedule_review',
          action_label: 'Schedule Progress Review',
          action_data: { frequency: 'weekly' }
        }
      ]
    };
  }

  private async generateOptimizationResponse(userId: string, analysis: any, context: any): Promise<AIResponse> {
    const metricEntity = analysis.entities.find((e: any) => e.entity === 'metric');
    
    let optimizationTips = [];
    
    if (metricEntity) {
      switch (metricEntity.value) {
        case 'conversion':
          optimizationTips = [
            "Test different headlines and value propositions",
            "Optimize your call-to-action buttons",
            "Reduce form fields to minimize friction",
            "Add social proof and testimonials",
            "Improve page loading speed"
          ];
          break;
        case 'email':
          optimizationTips = [
            "Personalize subject lines with recipient names",
            "Optimize send times based on audience behavior",
            "Segment your audience for targeted messaging",
            "A/B test different email templates",
            "Clean your email list regularly"
          ];
          break;
        default:
          optimizationTips = [
            "Focus on your highest-impact metrics first",
            "Use A/B testing to validate changes",
            "Monitor performance closely after changes",
            "Get customer feedback on improvements",
            "Document what works for future reference"
          ];
      }
    }

    return {
      response_text: `Here are specific ways to optimize your ${metricEntity?.value || 'performance'}:`,
      response_type: 'text',
      data: {
        optimization_tips: optimizationTips,
        priority_level: 'high',
        estimated_impact: '15-30% improvement'
      },
      confidence: 88,
      suggestions: [
        "Would you like me to help you implement any of these optimizations?",
        "Should I create A/B tests for these changes?",
        "Want me to track the results of these optimizations?"
      ],
      follow_up_questions: [
        "Which optimization would you like to start with?",
        "Do you need help setting up tracking for these changes?",
        "Would you like me to create a testing schedule?"
      ],
      actions: [
        {
          action_type: 'create_test',
          action_label: 'Set Up A/B Test',
          action_data: { metric: metricEntity?.value, optimizations: optimizationTips }
        },
        {
          action_type: 'create_checklist',
          action_label: 'Create Optimization Checklist',
          action_data: { tips: optimizationTips }
        }
      ]
    };
  }

  private async generateGeneralResponse(userId: string, analysis: any, context: any): Promise<AIResponse> {
    return {
      response_text: "I'm here to help you with your marketing and business analytics. You can ask me about your performance data, get recommendations for improvements, or request predictions about your business metrics.",
      response_type: 'text',
      data: {
        capabilities: [
          "Analyze your performance data",
          "Provide optimization recommendations",
          "Generate forecasts and predictions",
          "Create reports and dashboards",
          "Set up alerts and monitoring"
        ]
      },
      confidence: 95,
      suggestions: [
        "Try asking: 'How is my email performance this month?'",
        "Or: 'What should I optimize to increase conversions?'",
        "Or: 'Predict my revenue for next quarter'"
      ],
      follow_up_questions: [
        "What specific aspect of your business would you like to analyze?",
        "Are there any particular metrics you're concerned about?",
        "Would you like me to create a dashboard for you?"
      ],
      actions: [
        {
          action_type: 'create_dashboard',
          action_label: 'Create Overview Dashboard',
          action_data: {}
        },
        {
          action_type: 'schedule_report',
          action_label: 'Schedule Regular Reports',
          action_data: { frequency: 'weekly' }
        }
      ]
    };
  }

  // Data retrieval methods
  private async getRevenueData(userId: string, timePeriod?: string): Promise<any> {
    // Mock revenue data - in reality would fetch from database
    return {
      current_revenue: 15420.50,
      previous_period: 12350.75,
      growth_rate: 24.8,
      trend: 'increasing',
      breakdown: {
        email_campaigns: 8500.25,
        funnel_conversions: 6920.25
      }
    };
  }

  private async getConversionData(userId: string, timePeriod?: string): Promise<any> {
    return {
      overall_conversion_rate: 3.2,
      email_conversion_rate: 2.8,
      funnel_conversion_rate: 4.1,
      trend: 'stable',
      top_converting_campaigns: [
        { name: 'Summer Sale', rate: 5.2 },
        { name: 'Product Launch', rate: 4.8 }
      ]
    };
  }

  private async getEmailData(userId: string, timePeriod?: string): Promise<any> {
    return {
      total_sent: 25000,
      open_rate: 22.5,
      click_rate: 3.2,
      unsubscribe_rate: 0.8,
      top_performing_subject: "Don't miss out - 50% off today only!"
    };
  }

  private async getOverviewData(userId: string): Promise<any> {
    return {
      total_contacts: 5420,
      active_campaigns: 8,
      monthly_revenue: 15420.50,
      conversion_rate: 3.2,
      growth_rate: 24.8
    };
  }

  private updateConversationHistory(userId: string, query: AIQuery): void {
    const history = this.conversationHistory.get(userId) || [];
    history.push(query);
    
    // Keep only last 10 queries for context
    if (history.length > 10) {
      history.shift();
    }
    
    this.conversationHistory.set(userId, history);
  }

  private async storeQuery(query: AIQuery): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_queries')
        .insert({
          user_id: query.user_id,
          query_text: query.query_text,
          query_type: query.query_type,
          intent: query.intent,
          entities: query.entities,
          context: query.context,
          response: query.response,
          created_at: query.created_at.toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store AI query:', error);
    }
  } 
 // Intelligent Insights Generation
  async generateIntelligentInsights(userId: string): Promise<AIInsight[]> {
    try {
      console.log(`💡 Generating intelligent insights for user: ${userId}`);

      const insights: AIInsight[] = [];

      // Performance insights
      const performanceInsights = await this.analyzePerformanceInsights(userId);
      insights.push(...performanceInsights);

      // Opportunity insights
      const opportunityInsights = await this.identifyOpportunities(userId);
      insights.push(...opportunityInsights);

      // Risk insights
      const riskInsights = await this.identifyRisks(userId);
      insights.push(...riskInsights);

      // Trend insights
      const trendInsights = await this.analyzeTrends(userId);
      insights.push(...trendInsights);

      // Anomaly detection
      const anomalyInsights = await this.detectAnomalies(userId);
      insights.push(...anomalyInsights);

      // Store insights
      await this.storeInsights(insights);

      // Sort by importance
      const sortedInsights = insights.sort((a, b) => {
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      });

      console.log(`✅ Generated ${insights.length} intelligent insights`);
      return sortedInsights;

    } catch (error) {
      console.error('❌ Failed to generate intelligent insights:', error);
      throw error;
    }
  }

  private async analyzePerformanceInsights(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Mock performance analysis - in reality would analyze actual data
    const mockPerformanceData = {
      email_open_rate: 18.5,
      email_click_rate: 2.1,
      funnel_conversion_rate: 2.8,
      revenue_growth: -5.2
    };

    // Low email performance
    if (mockPerformanceData.email_open_rate < 20) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        user_id: userId,
        insight_type: 'performance',
        title: 'Email Open Rates Below Industry Average',
        description: `Your email open rate of ${mockPerformanceData.email_open_rate}% is below the industry average of 21.3%. This indicates potential issues with subject lines, sender reputation, or audience engagement.`,
        importance: 'high',
        data_source: 'email_campaigns',
        supporting_data: {
          current_rate: mockPerformanceData.email_open_rate,
          industry_average: 21.3,
          difference: -2.8
        },
        recommended_actions: [
          'A/B test different subject line styles',
          'Segment your audience for more targeted messaging',
          'Clean your email list to remove inactive subscribers',
          'Optimize send times based on audience behavior'
        ],
        created_at: new Date(),
        acknowledged: false
      });
    }

    // Revenue decline
    if (mockPerformanceData.revenue_growth < 0) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        user_id: userId,
        insight_type: 'performance',
        title: 'Revenue Decline Detected',
        description: `Revenue has decreased by ${Math.abs(mockPerformanceData.revenue_growth)}% compared to the previous period. This requires immediate attention to identify and address the root causes.`,
        importance: 'critical',
        data_source: 'revenue_tracking',
        supporting_data: {
          growth_rate: mockPerformanceData.revenue_growth,
          trend: 'declining'
        },
        recommended_actions: [
          'Analyze customer churn rates and reasons',
          'Review and optimize pricing strategy',
          'Increase marketing efforts and budget',
          'Improve customer retention programs',
          'Conduct customer satisfaction surveys'
        ],
        created_at: new Date(),
        acknowledged: false
      });
    }

    return insights;
  }

  private async identifyOpportunities(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Mock opportunity analysis
    insights.push({
      id: `insight_${Date.now()}_3`,
      user_id: userId,
      insight_type: 'opportunity',
      title: 'High-Value Customer Segment Identified',
      description: 'Analysis shows that customers from the "Enterprise" segment have 3x higher lifetime value but represent only 15% of your current focus. Increasing efforts in this segment could significantly boost revenue.',
      importance: 'high',
      data_source: 'customer_segmentation',
      supporting_data: {
        segment: 'Enterprise',
        ltv_multiplier: 3,
        current_focus: 15,
        potential_revenue_increase: '40-60%'
      },
      recommended_actions: [
        'Create targeted campaigns for enterprise customers',
        'Develop enterprise-specific content and offers',
        'Allocate more sales resources to this segment',
        'Implement account-based marketing strategies'
      ],
      created_at: new Date(),
      acknowledged: false
    });

    insights.push({
      id: `insight_${Date.now()}_4`,
      user_id: userId,
      insight_type: 'opportunity',
      title: 'Mobile Optimization Opportunity',
      description: 'Mobile traffic accounts for 65% of your visitors but has a 40% lower conversion rate than desktop. Optimizing for mobile could increase overall conversions by 25-30%.',
      importance: 'medium',
      data_source: 'funnel_analytics',
      supporting_data: {
        mobile_traffic_percentage: 65,
        mobile_conversion_gap: 40,
        potential_improvement: '25-30%'
      },
      recommended_actions: [
        'Implement mobile-first design principles',
        'Optimize form layouts for mobile devices',
        'Improve mobile page loading speeds',
        'Test mobile-specific call-to-action buttons'
      ],
      created_at: new Date(),
      acknowledged: false
    });

    return insights;
  }

  private async identifyRisks(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Mock risk analysis
    insights.push({
      id: `insight_${Date.now()}_5`,
      user_id: userId,
      insight_type: 'risk',
      title: 'High Customer Churn Risk Detected',
      description: 'Predictive analysis indicates that 23% of your high-value customers show signs of potential churn within the next 30 days. Immediate retention efforts are recommended.',
      importance: 'critical',
      data_source: 'churn_prediction',
      supporting_data: {
        at_risk_customers: 23,
        time_frame: '30 days',
        customer_value: 'high'
      },
      recommended_actions: [
        'Launch immediate retention campaigns for at-risk customers',
        'Conduct customer satisfaction surveys',
        'Offer personalized incentives or discounts',
        'Implement proactive customer success outreach',
        'Analyze common churn indicators and address root causes'
      ],
      created_at: new Date(),
      acknowledged: false
    });

    return insights;
  }

  private async analyzeTrends(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Mock trend analysis
    insights.push({
      id: `insight_${Date.now()}_6`,
      user_id: userId,
      insight_type: 'trend',
      title: 'Seasonal Performance Pattern Identified',
      description: 'Your campaigns show a consistent 35% performance boost during the first two weeks of each month. This pattern can be leveraged for better campaign timing.',
      importance: 'medium',
      data_source: 'campaign_performance',
      supporting_data: {
        performance_boost: 35,
        pattern: 'first_two_weeks_monthly',
        consistency: 'high'
      },
      recommended_actions: [
        'Schedule high-priority campaigns for early month periods',
        'Increase ad spend during peak performance windows',
        'Prepare special offers for these high-conversion periods',
        'Analyze what drives this seasonal pattern'
      ],
      created_at: new Date(),
      acknowledged: false
    });

    return insights;
  }

  private async detectAnomalies(userId: string): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // Mock anomaly detection
    insights.push({
      id: `insight_${Date.now()}_7`,
      user_id: userId,
      insight_type: 'anomaly',
      title: 'Unusual Traffic Spike Detected',
      description: 'Website traffic increased by 340% yesterday compared to the daily average. This appears to be from a viral social media post. Consider capitalizing on this increased attention.',
      importance: 'high',
      data_source: 'traffic_analytics',
      supporting_data: {
        traffic_increase: 340,
        source: 'social_media',
        type: 'viral_content'
      },
      recommended_actions: [
        'Create follow-up content to maintain engagement',
        'Launch targeted campaigns to convert new visitors',
        'Optimize landing pages for the increased traffic',
        'Analyze what made the content go viral for future reference'
      ],
      created_at: new Date(),
      acknowledged: false
    });

    return insights;
  }

  private async storeInsights(insights: AIInsight[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .insert(insights.map(insight => ({
          user_id: insight.user_id,
          insight_type: insight.insight_type,
          title: insight.title,
          description: insight.description,
          importance: insight.importance,
          data_source: insight.data_source,
          supporting_data: insight.supporting_data,
          recommended_actions: insight.recommended_actions,
          created_at: insight.created_at.toISOString(),
          acknowledged: insight.acknowledged
        })));

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store AI insights:', error);
    }
  }

  // Voice Command Processing
  async processVoiceCommand(userId: string, audioData: Blob): Promise<VoiceCommand> {
    try {
      console.log(`🎤 Processing voice command for user: ${userId}`);

      // Convert audio to text (mock implementation)
      const transcription = await this.transcribeAudio(audioData);
      
      // Process the transcribed text as a natural language query
      const query = await this.processNaturalLanguageQuery(userId, transcription);
      
      // Convert response to voice command format
      const voiceCommand: VoiceCommand = {
        command: transcription,
        intent: query.intent,
        parameters: this.extractCommandParameters(query),
        response: this.formatVoiceResponse(query.response),
        action: async () => {
          return await this.executeVoiceAction(query);
        }
      };

      console.log(`✅ Voice command processed: "${transcription}"`);
      return voiceCommand;

    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      throw error;
    }
  }

  private async transcribeAudio(audioData: Blob): Promise<string> {
    // Mock implementation - in reality would use speech-to-text service
    const mockTranscriptions = [
      "Show me my revenue for this month",
      "What are my top performing campaigns",
      "Create a new email campaign",
      "How many leads did I get yesterday",
      "Optimize my conversion rates",
      "Send me a weekly report",
      "What should I focus on today"
    ];
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  private extractCommandParameters(query: AIQuery): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    query.entities.forEach(entity => {
      parameters[entity.entity] = entity.value;
    });
    
    return parameters;
  }

  private formatVoiceResponse(response: AIResponse): string {
    // Format response for voice output
    let voiceResponse = response.response_text;
    
    // Add suggestions if available
    if (response.suggestions.length > 0) {
      voiceResponse += ` You can also ask me to: ${response.suggestions.slice(0, 2).join(', or ')}.`;
    }
    
    return voiceResponse;
  }

  private async executeVoiceAction(query: AIQuery): Promise<any> {
    // Execute actions based on the query
    if (query.response.actions.length > 0) {
      const action = query.response.actions[0];
      
      switch (action.action_type) {
        case 'create_report':
          return await this.createReport(action.action_data);
        case 'create_alert':
          return await this.createAlert(action.action_data);
        case 'create_dashboard':
          return await this.createDashboard(action.action_data);
        default:
          return { success: true, message: 'Action noted' };
      }
    }
    
    return { success: true, message: 'Query processed' };
  }

  // Contextual Help System
  async getContextualHelp(userId: string, page: string, section?: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ContextualHelp> {
    try {
      console.log(`📚 Getting contextual help for ${page}${section ? `/${section}` : ''}`);

      const helpContent = await this.generateHelpContent(page, section, userLevel);
      
      const contextualHelp: ContextualHelp = {
        page,
        section: section || 'general',
        help_content: helpContent,
        user_level: userLevel
      };

      // Store help request for analytics
      await this.trackHelpRequest(userId, contextualHelp);

      console.log(`✅ Contextual help provided for ${page}`);
      return contextualHelp;

    } catch (error) {
      console.error('❌ Failed to get contextual help:', error);
      throw error;
    }
  }

  private async generateHelpContent(page: string, section?: string, userLevel: string = 'intermediate'): Promise<ContextualHelp['help_content']> {
    const helpDatabase: Record<string, Record<string, ContextualHelp['help_content']>> = {
      dashboard: {
        general: {
          title: 'Dashboard Overview',
          description: 'Your dashboard provides a comprehensive view of your marketing performance and key metrics.',
          steps: [
            'Review your key performance indicators (KPIs) in the top cards',
            'Analyze trends using the interactive charts',
            'Check recent activities in the activity feed',
            'Use filters to customize your view'
          ],
          tips: [
            'Pin your most important metrics to the top',
            'Set up alerts for metrics that need monitoring',
            'Use the date range selector to compare different periods',
            'Export data for external analysis when needed'
          ],
          related_features: ['Reports', 'Analytics', 'Alerts'],
          video_url: 'https://example.com/dashboard-tutorial'
        },
        metrics: {
          title: 'Understanding Your Metrics',
          description: 'Learn how to interpret and act on your key performance metrics.',
          steps: [
            'Identify your primary KPIs based on business goals',
            'Monitor trends rather than just current values',
            'Set benchmarks and targets for each metric',
            'Create alerts for significant changes'
          ],
          tips: [
            'Focus on metrics that directly impact revenue',
            'Compare performance across different time periods',
            'Look for correlations between different metrics',
            'Use predictive analytics for forward-looking insights'
          ],
          related_features: ['Predictive Analytics', 'Reports', 'Alerts']
        }
      },
      campaigns: {
        general: {
          title: 'Campaign Management',
          description: 'Create, manage, and optimize your marketing campaigns for maximum impact.',
          steps: [
            'Define your campaign objectives and target audience',
            'Choose the appropriate campaign type and channels',
            'Create compelling content and messaging',
            'Set up tracking and analytics',
            'Launch and monitor performance',
            'Optimize based on results'
          ],
          tips: [
            'Start with clear, measurable goals',
            'Test different variations to find what works best',
            'Monitor performance regularly and adjust as needed',
            'Use automation to scale successful campaigns'
          ],
          related_features: ['Email Marketing', 'Funnels', 'Analytics'],
          video_url: 'https://example.com/campaign-tutorial'
        },
        email: {
          title: 'Email Campaign Best Practices',
          description: 'Create effective email campaigns that engage your audience and drive conversions.',
          steps: [
            'Segment your audience for targeted messaging',
            'Craft compelling subject lines',
            'Design mobile-friendly email templates',
            'Include clear call-to-action buttons',
            'Test and optimize send times',
            'Analyze performance and iterate'
          ],
          tips: [
            'Personalize emails with recipient names and preferences',
            'Keep subject lines under 50 characters',
            'Use A/B testing for continuous improvement',
            'Maintain a consistent sending schedule'
          ],
          related_features: ['Automation', 'Segmentation', 'A/B Testing']
        }
      },
      funnels: {
        general: {
          title: 'Funnel Builder Guide',
          description: 'Build high-converting sales funnels that guide prospects through your customer journey.',
          steps: [
            'Map out your customer journey',
            'Create landing pages for each funnel step',
            'Set up forms and lead capture mechanisms',
            'Configure follow-up sequences',
            'Add tracking and analytics',
            'Test and optimize conversion rates'
          ],
          tips: [
            'Keep forms short and only ask for essential information',
            'Use compelling headlines and value propositions',
            'Include social proof and testimonials',
            'Optimize for mobile devices'
          ],
          related_features: ['Landing Pages', 'Forms', 'Analytics'],
          video_url: 'https://example.com/funnel-tutorial'
        }
      },
      analytics: {
        general: {
          title: 'Analytics and Reporting',
          description: 'Understand your data and make informed decisions with comprehensive analytics.',
          steps: [
            'Set up tracking for all important events',
            'Create custom reports for your specific needs',
            'Schedule regular report delivery',
            'Analyze trends and patterns',
            'Share insights with your team',
            'Take action based on data insights'
          ],
          tips: [
            'Focus on actionable metrics rather than vanity metrics',
            'Use cohort analysis to understand customer behavior',
            'Set up automated alerts for important changes',
            'Compare performance across different segments'
          ],
          related_features: ['Dashboard', 'Predictive Analytics', 'Alerts']
        }
      }
    };

    const pageHelp = helpDatabase[page];
    if (!pageHelp) {
      return {
        title: 'Help Not Available',
        description: 'Help content for this page is not yet available.',
        steps: ['Contact support for assistance'],
        tips: ['Check our documentation for more information'],
        related_features: []
      };
    }

    const sectionHelp = pageHelp[section || 'general'];
    if (!sectionHelp) {
      return pageHelp.general || pageHelp[Object.keys(pageHelp)[0]];
    }

    // Adjust content based on user level
    if (userLevel === 'beginner') {
      return {
        ...sectionHelp,
        steps: sectionHelp.steps.slice(0, 3), // Fewer steps for beginners
        tips: sectionHelp.tips.slice(0, 2)   // Fewer tips for beginners
      };
    } else if (userLevel === 'advanced') {
      return {
        ...sectionHelp,
        tips: [
          ...sectionHelp.tips,
          'Use API integrations for advanced customization',
          'Set up custom tracking events for detailed analytics',
          'Implement advanced segmentation strategies'
        ]
      };
    }

    return sectionHelp;
  }

  private async trackHelpRequest(userId: string, help: ContextualHelp): Promise<void> {
    try {
      await supabase
        .from('help_requests')
        .insert({
          user_id: userId,
          page: help.page,
          section: help.section,
          user_level: help.user_level,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to track help request:', error);
    }
  }

  // Helper methods for voice actions
  private async createReport(data: any): Promise<any> {
    console.log('Creating report with data:', data);
    return { success: true, reportId: `report_${Date.now()}` };
  }

  private async createAlert(data: any): Promise<any> {
    console.log('Creating alert with data:', data);
    return { success: true, alertId: `alert_${Date.now()}` };
  }

  private async createDashboard(data: any): Promise<any> {
    console.log('Creating dashboard with data:', data);
    return { success: true, dashboardId: `dashboard_${Date.now()}` };
  }

  // Workflow Suggestions
  async generateWorkflowSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    try:
      console.log(`🔄 Generating workflow suggestions for user: ${userId}`);

      const suggestions: WorkflowSuggestion[] = [];

      // Automation suggestions
      const automationSuggestions = await this.generateAutomationSuggestions(userId);
      suggestions.push(...automationSuggestions);

      // Optimization suggestions
      const optimizationSuggestions = await this.generateOptimizationSuggestions(userId);
      suggestions.push(...optimizationSuggestions);

      // Integration suggestions
      const integrationSuggestions = await this.generateIntegrationSuggestions(userId);
      suggestions.push(...integrationSuggestions);

      // Process improvement suggestions
      const processImprovementSuggestions = await this.generateProcessImprovementSuggestions(userId);
      suggestions.push(...processImprovementSuggestions);

      // Store suggestions
      await this.storeWorkflowSuggestions(suggestions);

      // Sort by impact and effort
      const sortedSuggestions = suggestions.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        const effortOrder = { low: 3, medium: 2, high: 1 };
        
        const aScore = impactOrder[a.impact_estimate] + effortOrder[a.effort_estimate];
        const bScore = impactOrder[b.impact_estimate] + effortOrder[b.effort_estimate];
        
        return bScore - aScore;
      });

      console.log(`✅ Generated ${suggestions.length} workflow suggestions`);
      return sortedSuggestions;

    } catch (error) {
      console.error('❌ Failed to generate workflow suggestions:', error);
      throw error;
    }
  }

  private async generateAutomationSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_1`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automate Lead Scoring and Qualification',
      description: 'Automatically score and qualify leads based on their behavior, demographics, and engagement patterns to prioritize sales efforts.',
      current_process: 'Manual lead review and qualification by sales team',
      suggested_process: 'Automated lead scoring with AI-powered qualification and automatic routing to appropriate sales representatives',
      benefits: [
        'Reduce manual work by 70%',
        'Improve lead response time by 80%',
        'Increase conversion rates by 25%',
        'Better sales team productivity'
      ],
      implementation_steps: [
        'Define lead scoring criteria and weights',
        'Set up automated scoring rules',
        'Create qualification workflows',
        'Configure automatic lead routing',
        'Train sales team on new process',
        'Monitor and optimize scoring accuracy'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    suggestions.push({
      id: `suggestion_${Date.now()}_2`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automated Email Nurture Sequences',
      description: 'Create intelligent email sequences that adapt based on recipient behavior and engagement levels.',
      current_process: 'Manual email sending and follow-up scheduling',
      suggested_process: 'Automated, behavior-triggered email sequences with dynamic content personalization',
      benefits: [
        'Increase email engagement by 40%',
        'Save 15 hours per week on manual email tasks',
        'Improve lead nurturing consistency',
        'Better conversion tracking and optimization'
      ],
      implementation_steps: [
        'Map customer journey stages',
        'Create email templates for each stage',
        'Set up behavioral triggers',
        'Configure dynamic content rules',
        'Test and optimize sequences',
        'Monitor performance metrics'
      ],
      effort_estimate: 'low',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async generateOptimizationSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_3`,
      user_id: userId,
      suggestion_type: 'optimization',
      title: 'Optimize Campaign Performance with A/B Testing',
      description: 'Implement systematic A/B testing across all campaigns to continuously improve performance.',
      current_process: 'Ad-hoc testing with manual result analysis',
      suggested_process: 'Automated A/B testing with statistical significance tracking and automatic winner selection',
      benefits: [
        'Increase campaign ROI by 30%',
        'Reduce testing time by 60%',
        'More reliable test results',
        'Continuous performance improvement'
      ],
      implementation_steps: [
        'Identify key metrics to test',
        'Set up automated testing framework',
        'Create test variation templates',
        'Configure statistical significance thresholds',
        'Implement automatic winner selection',
        'Set up performance monitoring'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async generateIntegrationSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_4`,
      user_id: userId,
      suggestion_type: 'integration',
      title: 'Integrate CRM with Email Marketing Platform',
      description: 'Connect your CRM data with email marketing to enable better segmentation and personalization.',
      current_process: 'Manual data export/import between systems',
      suggested_process: 'Real-time data synchronization with automated segmentation and personalization',
      benefits: [
        'Eliminate manual data entry',
        'Improve email personalization',
        'Better customer segmentation',
        'Real-time campaign optimization'
      ],
      implementation_steps: [
        'Map data fields between systems',
        'Set up API connections',
        'Configure data synchronization rules',
        'Create automated segmentation workflows',
        'Test data accuracy and sync',
        'Train team on integrated workflows'
      ],
      effort_estimate: 'low',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async generateProcessImprovementSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_5`,
      user_id: userId,
      suggestion_type: 'process_improvement',
      title: 'Streamline Content Creation Workflow',
      description: 'Optimize content creation process with templates, approval workflows, and automated publishing.',
      current_process: 'Manual content creation with email-based approvals and manual publishing',
      suggested_process: 'Template-based creation with automated approval workflows and scheduled publishing',
      benefits: [
        'Reduce content creation time by 50%',
        'Improve content consistency',
        'Faster approval process',
        'Better content calendar management'
      ],
      implementation_steps: [
        'Create content templates and guidelines',
        'Set up approval workflow system',
        'Configure automated publishing schedules',
        'Implement content calendar integration',
        'Train team on new workflow',
        'Monitor and optimize process efficiency'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async storeWorkflowSuggestions(suggestions: WorkflowSuggestion[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .insert(suggestions.map(suggestion => ({
          user_id: suggestion.user_id,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          description: suggestion.description,
          current_process: suggestion.current_process,
          suggested_process: suggestion.suggested_process,
          benefits: suggestion.benefits,
          implementation_steps: suggestion.implementation_steps,
          effort_estimate: suggestion.effort_estimate,
          impact_estimate: suggestion.impact_estimate,
          created_at: suggestion.created_at.toISOString(),
          status: suggestion.status
        })));

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store workflow suggestions:', error);
    }
  }

  // Voice Command Processing
  async processVoiceCommand(userId: string, audioData: Blob): Promise<VoiceCommand> {
    try {
      console.log(`🎤 Processing voice command for user: ${userId}`);

      // Convert audio to text (mock implementation)
      const transcription = await this.transcribeAudio(audioData);
      
      // Process the transcribed text as a natural language query
      const query = await this.processNaturalLanguageQuery(userId, transcription);
      
      // Convert response to voice-friendly format
      const voiceResponse = this.convertToVoiceResponse(query.response);
      
      const voiceCommand: VoiceCommand = {
        command: transcription,
        intent: query.intent,
        parameters: this.extractVoiceParameters(query),
        response: voiceResponse,
        action: async () => {
          // Execute any actions suggested by the AI response
          if (query.response.actions.length > 0) {
            return await this.executeVoiceAction(query.response.actions[0]);
          }
          return null;
        }
      };

      console.log(`✅ Voice command processed: "${transcription}"`);
      return voiceCommand;

    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      throw error;
    }
  }

  private async transcribeAudio(audioData: Blob): Promise<string> {
    // Mock transcription - in reality would use speech-to-text service
    const mockTranscriptions = [
      "Show me my email performance this month",
      "What's my conversion rate for the summer campaign",
      "Create a report for last week's revenue",
      "How many leads did I get yesterday",
      "Optimize my funnel conversion rate"
    ];
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  private convertToVoiceResponse(response: AIResponse): string {
    // Convert technical response to natural speech
    let voiceResponse = response.response_text;
    
    // Add conversational elements
    if (response.confidence > 80) {
      voiceResponse = `I'm confident that ${voiceResponse.toLowerCase()}`;
    } else if (response.confidence > 60) {
      voiceResponse = `Based on the data, ${voiceResponse.toLowerCase()}`;
    } else {
      voiceResponse = `It appears that ${voiceResponse.toLowerCase()}`;
    }
    
    // Add suggestions in natural language
    if (response.suggestions.length > 0) {
      voiceResponse += ` Would you like me to ${response.suggestions[0].toLowerCase()}?`;
    }
    
    return voiceResponse;
  }

  private extractVoiceParameters(query: AIQuery): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    query.entities.forEach(entity => {
      parameters[entity.entity] = entity.value;
    });
    
    return parameters;
  }

  private async executeVoiceAction(action: AIResponse['actions'][0]): Promise<any> {
    // Execute the suggested action
    switch (action.action_type) {
      case 'create_report':
        return await this.createReport(action.action_data);
      case 'create_alert':
        return await this.createAlert(action.action_data);
      case 'create_dashboard':
        return await this.createDashboard(action.action_data);
      default:
        console.log(`Action ${action.action_type} executed with data:`, action.action_data);
        return { success: true, action: action.action_type };
    }
  }

  // Contextual Help System
  async getContextualHelp(page: string, section: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ContextualHelp> {
    try {
      console.log(`❓ Getting contextual help for ${page}/${section} (${userLevel})`);

      const helpContent = await this.generateContextualHelp(page, section, userLevel);
      
      console.log(`✅ Contextual help generated for ${page}/${section}`);
      return helpContent;

    } catch (error) {
      console.error('❌ Failed to get contextual help:', error);
      throw error;
    }
  }

  private async generateContextualHelp(page: string, section: string, userLevel: string): Promise<ContextualHelp> {
    // Mock contextual help - in reality would be from a knowledge base
    const helpDatabase: Record<string, Record<string, any>> = {
      'dashboard': {
        'overview': {
          title: 'Dashboard Overview',
          description: 'Your dashboard provides a comprehensive view of your marketing performance and key metrics.',
          steps: [
            'Review your key performance indicators (KPIs) in the top cards',
            'Check the revenue trend chart for growth patterns',
            'Monitor campaign performance in the middle section',
            'Review recent activities and alerts in the sidebar'
          ],
          tips: [
            'Customize your dashboard by clicking the settings icon',
            'Set up alerts for important metrics to stay informed',
            'Use the date picker to analyze different time periods',
            'Export reports by clicking the download button'
          ],
          related_features: ['Reports', 'Analytics', 'Campaigns', 'Alerts']
        },
        'analytics': {
          title: 'Analytics Section',
          description: 'Deep dive into your marketing analytics with detailed charts and insights.',
          steps: [
            'Select the metric you want to analyze from the dropdown',
            'Choose your preferred time range',
            'Use filters to segment your data',
            'Click on chart elements for detailed breakdowns'
          ],
          tips: [
            'Compare multiple metrics using the comparison feature',
            'Save frequently used filter combinations',
            'Schedule automated reports for regular insights',
            'Use the AI assistant for natural language queries'
          ],
          related_features: ['Reports', 'Campaigns', 'Funnels', 'Email Marketing']
        }
      },
      'campaigns': {
        'creation': {
          title: 'Creating Campaigns',
          description: 'Learn how to create effective marketing campaigns that drive results.',
          steps: [
            'Click the "New Campaign" button',
            'Choose your campaign type (Email, Funnel, Social)',
            'Set your campaign objectives and target audience',
            'Design your campaign content and messaging',
            'Configure tracking and analytics',
            'Review and launch your campaign'
          ],
          tips: [
            'Start with proven templates to save time',
            'Always define clear success metrics before launching',
            'Test your campaigns with a small audience first',
            'Use A/B testing to optimize performance'
          ],
          related_features: ['Email Marketing', 'Funnels', 'Analytics', 'Automation']
        }
      }
    };

    const pageHelp = helpDatabase[page] || {};
    const sectionHelp = pageHelp[section] || {
      title: 'Help',
      description: 'General help information for this section.',
      steps: ['Navigate through the interface', 'Use the available tools', 'Check the documentation'],
      tips: ['Take your time to explore', 'Use keyboard shortcuts', 'Contact support if needed'],
      related_features: ['Dashboard', 'Settings']
    };

    // Adjust content based on user level
    if (userLevel === 'beginner') {
      sectionHelp.steps = sectionHelp.steps.map((step: string) => `📝 ${step}`);
      sectionHelp.tips.unshift('💡 Don\'t worry if this seems complex at first - you\'ll get the hang of it!');
    } else if (userLevel === 'advanced') {
      sectionHelp.tips.push('⚡ Use keyboard shortcuts for faster navigation');
      sectionHelp.tips.push('🔧 Customize your workflow in the settings');
    }

    return {
      page,
      section,
      help_content: sectionHelp,
      user_level: userLevel as any
    };
  }

  // Helper methods for voice actions
  private async createReport(data: any): Promise<any> {
    console.log('Creating report with data:', data);
    return { success: true, reportId: `report_${Date.now()}` };
  }

  private async createAlert(data: any): Promise<any> {
    console.log('Creating alert with data:', data);
    return { success: true, alertId: `alert_${Date.now()}` };
  }

  private async createDashboard(data: any): Promise<any> {
    console.log('Creating dashboard with data:', data);
    return { success: true, dashboardId: `dashboard_${Date.now()}` };
  }

  // Public methods for getting stored data
  async getInsights(userId: string, limit: number = 10): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get insights:', error);
      return [];
    }
  }

  async getWorkflowSuggestions(userId: string, status?: string): Promise<WorkflowSuggestion[]> {
    try {
      let query = supabase
        .from('workflow_suggestions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get workflow suggestions:', error);
      return [];
    }
  }

  async acknowledgeInsight(insightId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ acknowledged: true })
        .eq('id', insightId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to acknowledge insight:', error);
      throw error;
    }
  }

  async updateSuggestionStatus(suggestionId: string, status: WorkflowSuggestion['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update suggestion status:', error);
      throw error;
    }
  }
}

export const aiAssistantService = AIAssistantService.getInstance();
      console.log(`🔄 Generating workflow suggestions for user: ${userId}`);

      const suggestions: WorkflowSuggestion[] = [];

      // Analyze current workflows and processes
      const currentProcesses = await this.analyzeCurrentProcesses(userId);
      
      // Generate automation suggestions
      const automationSuggestions = await this.generateAutomationSuggestions(userId, currentProcesses);
      suggestions.push(...automationSuggestions);

      // Generate optimization suggestions
      const optimizationSuggestions = await this.generateOptimizationSuggestions(userId, currentProcesses);
      suggestions.push(...optimizationSuggestions);

      // Generate integration suggestions
      const integrationSuggestions = await this.generateIntegrationSuggestions(userId);
      suggestions.push(...integrationSuggestions);

      // Store suggestions
      await this.storeWorkflowSuggestions(suggestions);

      console.log(`✅ Generated ${suggestions.length} workflow suggestions`);
      return suggestions;

    } catch (error) {
      console.error('❌ Failed to generate workflow suggestions:', error);
      throw error;
    }
  }

  private async analyzeCurrentProcesses(userId: string): Promise<any> {
    // Mock current process analysis
    return {
      manual_tasks: [
        'Lead qualification',
        'Email follow-ups',
        'Report generation',
        'Customer segmentation'
      ],
      repetitive_actions: [
        'Daily performance checks',
        'Weekly report compilation',
        'Monthly customer outreach'
      ],
      inefficiencies: [
        'Manual data entry',
        'Duplicate email sends',
        'Inconsistent follow-up timing'
      ]
    };
  }

  private async generateAutomationSuggestions(userId: string, processes: any): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_1`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automate Lead Qualification Process',
      description: 'Create an automated workflow that scores and qualifies leads based on their behavior and demographics, reducing manual review time by 70%.',
      current_process: 'Manual review of each lead by sales team members',
      suggested_process: 'Automated lead scoring with AI-powered qualification and automatic routing to appropriate team members',
      benefits: [
        'Reduce manual work by 70%',
        'Improve lead response time',
        'Ensure consistent qualification criteria',
        'Free up sales team for high-value activities'
      ],
      implementation_steps: [
        'Set up lead scoring criteria',
        'Create automated qualification workflow',
        'Configure team routing rules',
        'Test and refine the automation',
        'Train team on new process'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    suggestions.push({
      id: `suggestion_${Date.now()}_2`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automated Email Follow-up Sequences',
      description: 'Set up intelligent email sequences that automatically follow up with prospects based on their engagement level and behavior.',
      current_process: 'Manual email follow-ups scheduled by team members',
      suggested_process: 'Automated, behavior-triggered email sequences with personalized content',
      benefits: [
        'Ensure no leads fall through cracks',
        'Improve response rates with timely follow-ups',
        'Personalize communication at scale',
        'Reduce manual email management'
      ],
      implementation_steps: [
        'Design email sequence templates',
        'Set up behavioral triggers',
        'Configure personalization rules',
        'Test email deliverability',
        'Monitor and optimize performance'
      ],
      effort_estimate: 'low',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async generateOptimizationSuggestions(userId: string, processes: any): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_3`,
      user_id: userId,
      suggestion_type: 'optimization',
      title: 'Optimize Report Generation Process',
      description: 'Streamline report creation with automated data collection and template-based generation, reducing time from 2 hours to 15 minutes.',
      current_process: 'Manual data collection from multiple sources and manual report compilation',
      suggested_process: 'Automated data aggregation with one-click report generation using predefined templates',
      benefits: [
        'Reduce report creation time by 85%',
        'Improve data accuracy',
        'Enable more frequent reporting',
        'Standardize report formats'
      ],
      implementation_steps: [
        'Create report templates',
        'Set up automated data connections',
        'Configure scheduling options',
        'Test report accuracy',
        'Train team on new system'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async generateIntegrationSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_4`,
      user_id: userId,
      suggestion_type: 'integration',
      title: 'Integrate CRM with Email Marketing Platform',
      description: 'Connect your CRM data with email campaigns for better segmentation and personalization, potentially increasing email engagement by 40%.',
      current_process: 'Manual export/import of contact data between systems',
      suggested_process: 'Real-time data synchronization between CRM and email platform with automated segmentation',
      benefits: [
        'Eliminate manual data transfers',
        'Improve email targeting accuracy',
        'Enable real-time personalization',
        'Increase email engagement rates'
      ],
      implementation_steps: [
        'Set up API connections',
        'Configure data mapping',
        'Create automated sync rules',
        'Test data accuracy',
        'Monitor integration health'
      ],
      effort_estimate: 'low',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async storeWorkflowSuggestions(suggestions: WorkflowSuggestion[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .insert(suggestions.map(suggestion => ({
          user_id: suggestion.user_id,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          description: suggestion.description,
          current_process: suggestion.current_process,
          suggested_process: suggestion.suggested_process,
          benefits: suggestion.benefits,
          implementation_steps: suggestion.implementation_steps,
          effort_estimate: suggestion.effort_estimate,
          impact_estimate: suggestion.impact_estimate,
          created_at: suggestion.created_at.toISOString(),
          status: suggestion.status
        })));

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store workflow suggestions:', error);
    }
  }

  // Voice Command Processing
  async processVoiceCommand(audioData: ArrayBuffer): Promise<VoiceCommand> {
    try {
      console.log('🎤 Processing voice command...');

      // Convert audio to text (mock implementation)
      const transcription = await this.transcribeAudio(audioData);
      
      // Parse command and extract intent
      const command = await this.parseVoiceCommand(transcription);
      
      // Execute command if applicable
      if (command.action) {
        await command.action();
      }

      console.log(`✅ Voice command processed: "${command.command}"`);
      return command;

    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      throw error;
    }
  }

  private async transcribeAudio(audioData: ArrayBuffer): Promise<string> {
    // Mock audio transcription - in reality would use speech-to-text service
    const mockTranscriptions = [
      "Show me my email performance this month",
      "Create a new campaign for summer sale",
      "What's my conversion rate today",
      "Generate a revenue report",
      "Schedule a follow-up email"
    ];
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  private async parseVoiceCommand(transcription: string): Promise<VoiceCommand> {
    const text = transcription.toLowerCase();
    
    // Command patterns
    if (text.includes('show') || text.includes('display')) {
      return {
        command: transcription,
        intent: 'display_data',
        parameters: { query: transcription },
        response: "I'll show you that information right away.",
        action: async () => {
          // Would trigger data display
          console.log('Displaying requested data...');
        }
      };
    }
    
    if (text.includes('create') || text.includes('make')) {
      return {
        command: transcription,
        intent: 'create_item',
        parameters: { type: 'campaign', query: transcription },
        response: "I'll help you create that right now.",
        action: async () => {
          // Would trigger creation workflow
          console.log('Starting creation process...');
        }
      };
    }
    
    if (text.includes('schedule') || text.includes('plan')) {
      return {
        command: transcription,
        intent: 'schedule_action',
        parameters: { action: 'schedule', query: transcription },
        response: "I'll schedule that for you.",
        action: async () => {
          // Would trigger scheduling
          console.log('Scheduling action...');
        }
      };
    }
    
    // Default response
    return {
      command: transcription,
      intent: 'general_query',
      parameters: { query: transcription },
      response: "I understand. Let me help you with that.",
      action: async () => {
        // Would process general query
        console.log('Processing general query...');
      }
    };
  }

  // Contextual Help System
  async getContextualHelp(page: string, section: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ContextualHelp> {
    try {
      console.log(`📚 Getting contextual help for ${page}/${section}`);

      const helpContent = await this.generateHelpContent(page, section, userLevel);
      
      return {
        page,
        section,
        help_content: helpContent,
        user_level: userLevel
      };

    } catch (error) {
      console.error('❌ Failed to get contextual help:', error);
      throw error;
    }
  }

  private async generateHelpContent(page: string, section: string, userLevel: string): Promise<ContextualHelp['help_content']> {
    // Mock help content generation - in reality would fetch from knowledge base
    const helpDatabase: Record<string, any> = {
      'dashboard/overview': {
        title: 'Dashboard Overview',
        description: 'Your dashboard provides a comprehensive view of your marketing performance and key metrics.',
        steps: [
          'Review your key performance indicators in the top cards',
          'Check the performance trends in the charts below',
          'Use the date picker to change the time period',
          'Click on any metric to drill down for more details'
        ],
        tips: [
          'Set up custom alerts for important metrics',
          'Use the comparison feature to track progress',
          'Export data for external analysis if needed'
        ],
        related_features: ['Reports', 'Analytics', 'Alerts'],
        video_url: 'https://help.higherup.ai/videos/dashboard-overview'
      },
      'campaigns/email': {
        title: 'Email Campaign Management',
        description: 'Create, manage, and optimize your email marketing campaigns for maximum engagement.',
        steps: [
          'Click "Create Campaign" to start a new email campaign',
          'Choose your template or create from scratch',
          'Select your audience segments',
          'Customize your content and subject line',
          'Schedule or send your campaign'
        ],
        tips: [
          'A/B test your subject lines for better open rates',
          'Segment your audience for more targeted messaging',
          'Monitor deliverability and engagement metrics',
          'Use automation to nurture leads over time'
        ],
        related_features: ['Automation', 'Segmentation', 'Analytics'],
        video_url: 'https://help.higherup.ai/videos/email-campaigns'
      },
      'funnels/builder': {
        title: 'Funnel Builder',
        description: 'Design and optimize conversion funnels to guide prospects through your sales process.',
        steps: [
          'Start with a funnel template or create from scratch',
          'Add pages using the drag-and-drop editor',
          'Configure forms and payment processing',
          'Set up tracking and analytics',
          'Publish and test your funnel'
        ],
        tips: [
          'Keep your funnel simple and focused',
          'Test different page layouts and copy',
          'Monitor drop-off points and optimize',
          'Use social proof to increase conversions'
        ],
        related_features: ['A/B Testing', 'Analytics', 'Payments'],
        video_url: 'https://help.higherup.ai/videos/funnel-builder'
      }
    };

    const key = `${page}/${section}`;
    const baseContent = helpDatabase[key] || {
      title: 'Help Content',
      description: 'This section provides guidance on using this feature effectively.',
      steps: ['Explore the available options', 'Configure settings as needed', 'Monitor results and optimize'],
      tips: ['Take your time to understand the feature', 'Don\'t hesitate to experiment', 'Check the documentation for advanced features'],
      related_features: ['Dashboard', 'Reports', 'Settings']
    };

    // Adjust content based on user level
    if (userLevel === 'beginner') {
      baseContent.steps = ['Start with the basics', ...baseContent.steps, 'Ask for help if needed'];
      baseContent.tips = ['Take it step by step', ...baseContent.tips];
    } else if (userLevel === 'advanced') {
      baseContent.tips = [...baseContent.tips, 'Explore API integrations', 'Set up advanced automation'];
    }

    return baseContent;
  }

  // Utility Methods
  async acknowledgeInsight(userId: string, insightId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ acknowledged: true })
        .eq('id', insightId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`✅ Insight ${insightId} acknowledged`);

    } catch (error) {
      console.error('❌ Failed to acknowledge insight:', error);
      throw error;
    }
  }

  async updateSuggestionStatus(userId: string, suggestionId: string, status: WorkflowSuggestion['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .update({ status })
        .eq('id', suggestionId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`✅ Suggestion ${suggestionId} status updated to ${status}`);

    } catch (error) {
      console.error('❌ Failed to update suggestion status:', error);
      throw error;
    }
  }

  async getConversationHistory(userId: string): Promise<AIQuery[]> {
    return this.conversationHistory.get(userId) || [];
  }

  async clearConversationHistory(userId: string): Promise<void> {
    this.conversationHistory.delete(userId);
    console.log(`🗑️ Conversation history cleared for user ${userId}`);
  }
}

export const aiAssistantService = AIAssistantService.getInstance();
      console.log(`⚙️ Generating workflow suggestions for user: ${userId}`);

      const suggestions: WorkflowSuggestion[] = [];

      // Analyze current workflows and suggest improvements
      const automationSuggestions = await this.suggestAutomationOpportunities(userId);
      suggestions.push(...automationSuggestions);

      const optimizationSuggestions = await this.suggestProcessOptimizations(userId);
      suggestions.push(...optimizationSuggestions);

      const integrationSuggestions = await this.suggestIntegrationOpportunities(userId);
      suggestions.push(...integrationSuggestions);

      // Store suggestions
      await this.storeWorkflowSuggestions(suggestions);

      console.log(`✅ Generated ${suggestions.length} workflow suggestions`);
      return suggestions;

    } catch (error) {
      console.error('❌ Failed to generate workflow suggestions:', error);
      throw error;
    }
  }

  private async suggestAutomationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    // Mock automation opportunities
    suggestions.push({
      id: `suggestion_${Date.now()}_1`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automate Lead Scoring and Qualification',
      description: 'Implement automated lead scoring based on behavior, demographics, and engagement to prioritize sales efforts and improve conversion rates.',
      current_process: 'Manual review of leads by sales team, inconsistent qualification criteria, delayed follow-up',
      suggested_process: 'Automated scoring algorithm assigns points based on predefined criteria, automatic routing to appropriate sales rep, triggered follow-up sequences',
      benefits: [
        'Reduce lead qualification time by 70%',
        'Increase lead-to-customer conversion by 25%',
        'Ensure consistent qualification criteria',
        'Free up sales team for high-value activities'
      ],
      implementation_steps: [
        'Define lead scoring criteria and point values',
        'Set up automated scoring rules in CRM',
        'Create lead routing workflows',
        'Design automated follow-up sequences',
        'Train sales team on new process',
        'Monitor and optimize scoring algorithm'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    suggestions.push({
      id: `suggestion_${Date.now()}_2`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Implement Customer Onboarding Automation',
      description: 'Create an automated onboarding sequence that guides new customers through product setup and initial usage to improve activation rates.',
      current_process: 'Manual welcome emails, inconsistent onboarding experience, high early churn',
      suggested_process: 'Triggered email sequences, in-app guidance, progress tracking, personalized recommendations',
      benefits: [
        'Improve customer activation rate by 40%',
        'Reduce early churn by 30%',
        'Standardize onboarding experience',
        'Reduce support ticket volume'
      ],
      implementation_steps: [
        'Map customer onboarding journey',
        'Create email sequence templates',
        'Set up behavioral triggers',
        'Design in-app guidance system',
        'Implement progress tracking',
        'Test and optimize sequences'
      ],
      effort_estimate: 'high',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async suggestProcessOptimizations(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_3`,
      user_id: userId,
      suggestion_type: 'process_improvement',
      title: 'Streamline Campaign Creation Process',
      description: 'Optimize the campaign creation workflow by implementing templates, approval workflows, and automated asset generation.',
      current_process: 'Manual campaign setup, inconsistent branding, lengthy approval cycles, repeated work',
      suggested_process: 'Template-based creation, automated brand compliance, streamlined approval workflow, asset reuse',
      benefits: [
        'Reduce campaign creation time by 60%',
        'Improve brand consistency',
        'Faster time-to-market',
        'Reduce errors and rework'
      ],
      implementation_steps: [
        'Create campaign templates library',
        'Implement approval workflow system',
        'Set up automated brand compliance checks',
        'Create asset management system',
        'Train team on new process'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async suggestIntegrationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_4`,
      user_id: userId,
      suggestion_type: 'integration',
      title: 'Integrate CRM with Email Marketing Platform',
      description: 'Connect your CRM data with email marketing to enable better segmentation, personalization, and automated campaigns.',
      current_process: 'Manual data export/import, outdated contact information, generic email campaigns',
      suggested_process: 'Real-time data sync, automated segmentation, personalized campaigns based on CRM data',
      benefits: [
        'Improve email relevance and engagement',
        'Reduce manual data management',
        'Enable behavior-based campaigns',
        'Better ROI tracking'
      ],
      implementation_steps: [
        'Set up API connections between systems',
        'Map data fields and sync rules',
        'Create automated segmentation rules',
        'Design personalized email templates',
        'Test data flow and campaigns'
      ],
      effort_estimate: 'low',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async storeWorkflowSuggestions(suggestions: WorkflowSuggestion[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .insert(suggestions.map(suggestion => ({
          user_id: suggestion.user_id,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          description: suggestion.description,
          current_process: suggestion.current_process,
          suggested_process: suggestion.suggested_process,
          benefits: suggestion.benefits,
          implementation_steps: suggestion.implementation_steps,
          effort_estimate: suggestion.effort_estimate,
          impact_estimate: suggestion.impact_estimate,
          created_at: suggestion.created_at.toISOString(),
          status: suggestion.status
        })));

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store workflow suggestions:', error);
    }
  }

  // Voice Command Processing
  async processVoiceCommand(userId: string, audioData: string): Promise<VoiceCommand> {
    try {
      console.log(`🎤 Processing voice command for user: ${userId}`);

      // Convert speech to text (mock implementation)
      const transcription = await this.speechToText(audioData);
      
      // Process the transcribed text as a natural language query
      const query = await this.processNaturalLanguageQuery(userId, transcription);
      
      // Convert response to voice command format
      const voiceCommand: VoiceCommand = {
        command: transcription,
        intent: query.intent,
        parameters: this.extractParameters(query.entities),
        response: query.response.response_text,
        action: query.response.actions.length > 0 ? 
          async () => await this.executeVoiceAction(query.response.actions[0]) : 
          undefined
      };

      console.log(`✅ Voice command processed: "${transcription}"`);
      return voiceCommand;

    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      throw error;
    }
  }

  private async speechToText(audioData: string): Promise<string> {
    // Mock speech-to-text conversion
    // In reality, would use services like Google Speech-to-Text, Azure Speech, etc.
    const mockTranscriptions = [
      "Show me my email performance this month",
      "What's my conversion rate for the summer campaign",
      "Create a report for last quarter's revenue",
      "How many leads did I get yesterday",
      "Predict my sales for next month"
    ];
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  private extractParameters(entities: AIQuery['entities']): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    entities.forEach(entity => {
      parameters[entity.entity] = entity.value;
    });
    
    return parameters;
  }

  private async executeVoiceAction(action: AIResponse['actions'][0]): Promise<any> {
    console.log(`🎯 Executing voice action: ${action.action_type}`);
    
    switch (action.action_type) {
      case 'create_report':
        return { success: true, message: 'Report creation initiated' };
      case 'create_alert':
        return { success: true, message: 'Alert has been set up' };
      case 'create_dashboard':
        return { success: true, message: 'Dashboard is being created' };
      default:
        return { success: false, message: 'Action not supported' };
    }
  }

  // Contextual Help System
  async getContextualHelp(page: string, section: string, userLevel: ContextualHelp['user_level'] = 'intermediate'): Promise<ContextualHelp> {
    try {
      console.log(`❓ Getting contextual help for: ${page}/${section}`);

      const helpContent = this.generateHelpContent(page, section, userLevel);
      
      const contextualHelp: ContextualHelp = {
        page,
        section,
        help_content: helpContent,
        user_level: userLevel
      };

      console.log(`✅ Contextual help generated for ${page}/${section}`);
      return contextualHelp;

    } catch (error) {
      console.error('❌ Failed to get contextual help:', error);
      throw error;
    }
  }

  private generateHelpContent(page: string, section: string, userLevel: string): ContextualHelp['help_content'] {
    // Mock help content generation
    const helpDatabase: Record<string, Record<string, any>> = {
      'dashboard': {
        'overview': {
          title: 'Dashboard Overview',
          description: 'Your dashboard provides a comprehensive view of your key marketing metrics and performance indicators.',
          steps: [
            'Review your key metrics in the top cards',
            'Analyze trends in the charts below',
            'Use filters to adjust time periods',
            'Click on any metric for detailed analysis'
          ],
          tips: [
            'Set up custom alerts for important metrics',
            'Use the comparison feature to track progress',
            'Export data for external analysis'
          ],
          related_features: ['Reports', 'Analytics', 'Alerts']
        }
      },
      'campaigns': {
        'email': {
          title: 'Email Campaign Management',
          description: 'Create, manage, and optimize your email marketing campaigns for maximum engagement and conversions.',
          steps: [
            'Click "Create Campaign" to start',
            'Choose your audience segment',
            'Design your email using templates',
            'Set up A/B testing if needed',
            'Schedule or send immediately'
          ],
          tips: [
            'Test subject lines for better open rates',
            'Segment your audience for relevance',
            'Monitor performance and optimize'
          ],
          related_features: ['Templates', 'Segmentation', 'Analytics'],
          video_url: 'https://example.com/email-campaign-tutorial'
        }
      },
      'funnels': {
        'builder': {
          title: 'Funnel Builder',
          description: 'Create high-converting sales funnels with our drag-and-drop builder.',
          steps: [
            'Start with a template or blank funnel',
            'Add and configure funnel steps',
            'Customize page designs and content',
            'Set up payment processing',
            'Publish and start driving traffic'
          ],
          tips: [
            'Keep forms short for better conversion',
            'Add trust signals and testimonials',
            'Test different page layouts'
          ],
          related_features: ['Templates', 'Analytics', 'A/B Testing']
        }
      }
    };

    const defaultContent = {
      title: 'Help',
      description: 'Get help with this feature.',
      steps: ['Explore the interface', 'Try different options', 'Contact support if needed'],
      tips: ['Take your time to learn', 'Use keyboard shortcuts', 'Check documentation'],
      related_features: ['Dashboard', 'Reports', 'Settings']
    };

    return helpDatabase[page]?.[section] || defaultContent;
  }

  // Task and Workflow Suggestions
  async suggestNextActions(userId: string, context?: Record<string, any>): Promise<Array<{
    action_type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimated_time: string;
    category: string;
  }>> {
    try {
      console.log(`📋 Suggesting next actions for user: ${userId}`);

      const suggestions = [];

      // Analyze current state and suggest actions
      const performanceActions = await this.suggestPerformanceActions(userId);
      suggestions.push(...performanceActions);

      const optimizationActions = await this.suggestOptimizationActions(userId);
      suggestions.push(...optimizationActions);

      const maintenanceActions = await this.suggestMaintenanceActions(userId);
      suggestions.push(...maintenanceActions);

      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      console.log(`✅ Generated ${suggestions.length} action suggestions`);
      return suggestions.slice(0, 10); // Return top 10 suggestions

    } catch (error) {
      console.error('❌ Failed to suggest next actions:', error);
      throw error;
    }
  }

  private async suggestPerformanceActions(userId: string): Promise<any[]> {
    return [
      {
        action_type: 'review_metrics',
        title: 'Review This Week\'s Performance',
        description: 'Check your key metrics and identify any significant changes or trends',
        priority: 'high',
        estimated_time: '10 minutes',
        category: 'Analysis'
      },
      {
        action_type: 'optimize_campaign',
        title: 'Optimize Underperforming Campaign',
        description: 'Your "Summer Sale" campaign has a low click rate - consider updating the content',
        priority: 'medium',
        estimated_time: '30 minutes',
        category: 'Optimization'
      }
    ];
  }

  private async suggestOptimizationActions(userId: string): Promise<any[]> {
    return [
      {
        action_type: 'ab_test',
        title: 'Set Up A/B Test for Email Subject Lines',
        description: 'Test different subject line approaches to improve open rates',
        priority: 'medium',
        estimated_time: '20 minutes',
        category: 'Testing'
      },
      {
        action_type: 'segment_audience',
        title: 'Create New Audience Segment',
        description: 'Segment high-value customers for targeted campaigns',
        priority: 'medium',
        estimated_time: '15 minutes',
        category: 'Segmentation'
      }
    ];
  }

  private async suggestMaintenanceActions(userId: string): Promise<any[]> {
    return [
      {
        action_type: 'clean_contacts',
        title: 'Clean Contact List',
        description: 'Remove inactive subscribers to improve deliverability',
        priority: 'low',
        estimated_time: '25 minutes',
        category: 'Maintenance'
      },
      {
        action_type: 'update_templates',
        title: 'Update Email Templates',
        description: 'Refresh your email templates with current branding',
        priority: 'low',
        estimated_time: '45 minutes',
        category: 'Maintenance'
      }
    ];
  }
}

// Export singleton instance
export const aiAssistantService = AIAssistantService.getInstance();    
  console.log(`🔄 Generating workflow suggestions for user: ${userId}`);

      const suggestions: WorkflowSuggestion[] = [];

      // Automation suggestions
      const automationSuggestions = await this.identifyAutomationOpportunities(userId);
      suggestions.push(...automationSuggestions);

      // Process optimization suggestions
      const optimizationSuggestions = await this.identifyProcessOptimizations(userId);
      suggestions.push(...optimizationSuggestions);

      // Integration suggestions
      const integrationSuggestions = await this.identifyIntegrationOpportunities(userId);
      suggestions.push(...integrationSuggestions);

      // Store suggestions
      await this.storeWorkflowSuggestions(suggestions);

      // Sort by impact and effort
      const sortedSuggestions = suggestions.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        const effortOrder = { low: 3, medium: 2, high: 1 };
        
        const aScore = impactOrder[a.impact_estimate] + effortOrder[a.effort_estimate];
        const bScore = impactOrder[b.impact_estimate] + effortOrder[b.effort_estimate];
        
        return bScore - aScore;
      });

      console.log(`✅ Generated ${suggestions.length} workflow suggestions`);
      return sortedSuggestions;

    } catch (error) {
      console.error('❌ Failed to generate workflow suggestions:', error);
      throw error;
    }
  }

  private async identifyAutomationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    // Email automation suggestion
    suggestions.push({
      id: `workflow_${Date.now()}_1`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automate Lead Nurturing Sequence',
      description: 'Set up automated email sequences based on lead behavior and engagement levels to improve conversion rates and reduce manual follow-up work.',
      current_process: 'Manual follow-up emails sent individually to leads based on sales team availability',
      suggested_process: 'Automated email sequences triggered by lead actions (form submission, email opens, website visits) with personalized content based on lead scoring',
      benefits: [
        'Reduce manual work by 70%',
        'Improve lead response time from hours to minutes',
        'Increase conversion rates by 25-40%',
        'Ensure consistent follow-up for all leads',
        'Free up sales team for high-value activities'
      ],
      implementation_steps: [
        'Define lead scoring criteria and thresholds',
        'Create email templates for different lead stages',
        'Set up automation triggers and conditions',
        'Test the automation workflow with sample leads',
        'Monitor performance and optimize based on results'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    // Customer onboarding automation
    suggestions.push({
      id: `workflow_${Date.now()}_2`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automate Customer Onboarding Process',
      description: 'Create an automated onboarding sequence that guides new customers through product setup and initial usage to improve activation rates.',
      current_process: 'Manual onboarding calls and emails sent by customer success team',
      suggested_process: 'Automated onboarding sequence with progressive disclosure of features, interactive tutorials, and milestone celebrations',
      benefits: [
        'Improve customer activation rate by 35%',
        'Reduce onboarding time from weeks to days',
        'Scale onboarding without additional staff',
        'Provide consistent experience for all customers',
        'Identify and address common onboarding issues'
      ],
      implementation_steps: [
        'Map current onboarding journey and pain points',
        'Create interactive tutorials and help content',
        'Set up automated email sequences for each onboarding stage',
        'Implement progress tracking and milestone notifications',
        'A/B test different onboarding approaches'
      ],
      effort_estimate: 'high',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async identifyProcessOptimizations(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    // Campaign creation optimization
    suggestions.push({
      id: `workflow_${Date.now()}_3`,
      user_id: userId,
      suggestion_type: 'process_improvement',
      title: 'Streamline Campaign Creation Process',
      description: 'Optimize the campaign creation workflow by using templates, automation, and batch operations to reduce time and improve consistency.',
      current_process: 'Each campaign created from scratch with manual setup of targeting, content, and scheduling',
      suggested_process: 'Template-based campaign creation with pre-configured targeting options, content libraries, and bulk scheduling capabilities',
      benefits: [
        'Reduce campaign creation time by 60%',
        'Improve campaign consistency and quality',
        'Reduce human errors in campaign setup',
        'Enable faster response to market opportunities',
        'Allow team to focus on strategy rather than execution'
      ],
      implementation_steps: [
        'Analyze current campaign creation workflow',
        'Create campaign templates for common use cases',
        'Build content library with approved assets',
        'Implement bulk operations for campaign management',
        'Train team on new streamlined process'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async identifyIntegrationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    // CRM integration suggestion
    suggestions.push({
      id: `workflow_${Date.now()}_4`,
      user_id: userId,
      suggestion_type: 'integration',
      title: 'Integrate Marketing and Sales Data',
      description: 'Connect marketing automation with CRM system to provide seamless lead handoff and comprehensive customer journey tracking.',
      current_process: 'Manual data entry and lead handoff between marketing and sales teams',
      suggested_process: 'Automated data synchronization between marketing automation and CRM with real-time lead scoring and handoff triggers',
      benefits: [
        'Eliminate manual data entry and reduce errors',
        'Improve lead handoff speed and quality',
        'Provide complete customer journey visibility',
        'Enable better sales and marketing alignment',
        'Increase conversion rates through better lead qualification'
      ],
      implementation_steps: [
        'Map data fields between marketing and CRM systems',
        'Set up API connections and data synchronization',
        'Define lead scoring and handoff criteria',
        'Create automated workflows for lead routing',
        'Train teams on integrated processes'
      ],
      effort_estimate: 'high',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async storeWorkflowSuggestions(suggestions: WorkflowSuggestion[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .insert(suggestions.map(suggestion => ({
          user_id: suggestion.user_id,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          description: suggestion.description,
          current_process: suggestion.current_process,
          suggested_process: suggestion.suggested_process,
          benefits: suggestion.benefits,
          implementation_steps: suggestion.implementation_steps,
          effort_estimate: suggestion.effort_estimate,
          impact_estimate: suggestion.impact_estimate,
          created_at: suggestion.created_at.toISOString(),
          status: suggestion.status
        })));

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store workflow suggestions:', error);
    }
  }

  // Voice Command Processing
  async processVoiceCommand(userId: string, audioData: string | ArrayBuffer): Promise<VoiceCommand> {
    try {
      console.log(`🎤 Processing voice command for user: ${userId}`);

      // Convert audio to text (mock implementation)
      const transcription = await this.transcribeAudio(audioData);
      
      // Process the transcribed text as a natural language query
      const query = await this.processNaturalLanguageQuery(userId, transcription);
      
      // Convert response to voice-friendly format
      const voiceResponse = this.formatForVoice(query.response);
      
      const voiceCommand: VoiceCommand = {
        command: transcription,
        intent: query.intent,
        parameters: this.extractVoiceParameters(query),
        response: voiceResponse,
        action: async () => {
          return await this.executeVoiceAction(query);
        }
      };

      console.log(`✅ Voice command processed: "${transcription}"`);
      return voiceCommand;

    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      throw error;
    }
  }

  private async transcribeAudio(audioData: string | ArrayBuffer): Promise<string> {
    // Mock transcription - in reality would use speech-to-text service
    const mockTranscriptions = [
      "Show me my email performance this month",
      "What's my conversion rate for the landing page campaign",
      "Create a report for last week's revenue",
      "How many leads did we get yesterday",
      "Predict my sales for next quarter",
      "What should I optimize to increase conversions"
    ];
    
    return mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
  }

  private formatForVoice(response: AIResponse): string {
    // Convert response to voice-friendly format
    let voiceText = response.response_text;
    
    // Add natural pauses and emphasis
    voiceText = voiceText.replace(/(\d+\.?\d*%)/g, '$1 percent');
    voiceText = voiceText.replace(/(\$\d+)/g, '$1 dollars');
    voiceText = voiceText.replace(/:/g, '.');
    
    // Add suggestions in voice format
    if (response.suggestions.length > 0) {
      voiceText += ` Would you like me to ${response.suggestions[0].toLowerCase()}?`;
    }
    
    return voiceText;
  }

  private extractVoiceParameters(query: AIQuery): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    query.entities.forEach(entity => {
      parameters[entity.entity] = entity.value;
    });
    
    parameters.query_type = query.query_type;
    parameters.confidence = query.response.confidence;
    
    return parameters;
  }

  private async executeVoiceAction(query: AIQuery): Promise<any> {
    // Execute the action based on the query type
    switch (query.query_type) {
      case 'data_analysis':
        return await this.generateDataReport(query.user_id, query.entities);
      case 'prediction':
        return await this.generatePrediction(query.user_id, query.entities);
      case 'recommendation':
        return await this.generateRecommendations(query.user_id);
      default:
        return { message: 'Action completed successfully' };
    }
  }

  // Contextual Help System
  async getContextualHelp(userId: string, page: string, section?: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ContextualHelp> {
    try {
      console.log(`❓ Getting contextual help for ${page}${section ? `/${section}` : ''}`);

      const helpContent = await this.generateHelpContent(page, section, userLevel);
      
      const contextualHelp: ContextualHelp = {
        page,
        section: section || 'general',
        help_content: helpContent,
        user_level: userLevel
      };

      // Store help request for analytics
      await this.trackHelpRequest(userId, contextualHelp);

      console.log(`✅ Contextual help provided for ${page}`);
      return contextualHelp;

    } catch (error) {
      console.error('❌ Failed to get contextual help:', error);
      throw error;
    }
  }

  private async generateHelpContent(page: string, section?: string, userLevel: string = 'intermediate'): Promise<ContextualHelp['help_content']> {
    // Help content database - in reality would be stored in database
    const helpDatabase: Record<string, Record<string, any>> = {
      dashboard: {
        general: {
          title: 'Dashboard Overview',
          description: 'Your dashboard provides a comprehensive view of your marketing performance and key metrics.',
          steps: [
            'Review your key performance indicators (KPIs) in the top section',
            'Check recent campaign performance in the middle section',
            'Monitor alerts and recommendations in the sidebar',
            'Use the date picker to view different time periods'
          ],
          tips: [
            'Set up custom alerts for metrics that matter most to you',
            'Use the comparison feature to track progress over time',
            'Export data for detailed analysis in external tools'
          ],
          related_features: ['Reports', 'Analytics', 'Alerts']
        },
        metrics: {
          title: 'Understanding Your Metrics',
          description: 'Learn how to interpret and act on your key performance metrics.',
          steps: [
            'Focus on conversion rate as your primary success indicator',
            'Monitor email open rates to gauge audience engagement',
            'Track revenue growth to measure business impact',
            'Watch for trends rather than daily fluctuations'
          ],
          tips: [
            'Industry benchmarks: 20-25% email open rate, 2-5% conversion rate',
            'Set realistic goals based on your historical performance',
            'Use A/B testing to improve underperforming metrics'
          ],
          related_features: ['A/B Testing', 'Benchmarking', 'Goal Setting']
        }
      },
      campaigns: {
        general: {
          title: 'Campaign Management',
          description: 'Create, manage, and optimize your marketing campaigns for maximum impact.',
          steps: [
            'Click "Create Campaign" to start a new campaign',
            'Choose your campaign type (email, funnel, social)',
            'Set up targeting and audience segmentation',
            'Create compelling content and calls-to-action',
            'Schedule and launch your campaign'
          ],
          tips: [
            'Start with a clear goal and success metrics',
            'Test different subject lines and content variations',
            'Monitor performance closely in the first 24 hours'
          ],
          related_features: ['Email Builder', 'Audience Segmentation', 'A/B Testing']
        },
        email: {
          title: 'Email Campaign Best Practices',
          description: 'Create effective email campaigns that engage your audience and drive conversions.',
          steps: [
            'Write compelling subject lines that create curiosity',
            'Personalize content based on recipient data',
            'Include clear and prominent call-to-action buttons',
            'Optimize for mobile devices',
            'Test send times for your audience'
          ],
          tips: [
            'Keep subject lines under 50 characters for mobile',
            'Use the recipient\'s name in the subject line or greeting',
            'Include social proof and testimonials when relevant'
          ],
          related_features: ['Email Templates', 'Personalization', 'Send Time Optimization']
        }
      },
      analytics: {
        general: {
          title: 'Analytics and Reporting',
          description: 'Understand your data and make informed decisions based on performance insights.',
          steps: [
            'Select the metrics you want to analyze',
            'Choose your date range and comparison periods',
            'Apply filters to segment your data',
            'Export reports for sharing with your team'
          ],
          tips: [
            'Focus on trends rather than individual data points',
            'Compare performance across different time periods',
            'Use segmentation to identify your best-performing audiences'
          ],
          related_features: ['Custom Reports', 'Data Export', 'Automated Insights']
        }
      }
    };

    const pageHelp = helpDatabase[page];
    if (!pageHelp) {
      return {
        title: 'Help Not Available',
        description: 'Help content for this page is not yet available.',
        steps: ['Contact support for assistance'],
        tips: [],
        related_features: []
      };
    }

    const sectionHelp = pageHelp[section || 'general'];
    if (!sectionHelp) {
      return pageHelp.general || {
        title: 'General Help',
        description: 'General help for this section.',
        steps: [],
        tips: [],
        related_features: []
      };
    }

    // Adjust content based on user level
    if (userLevel === 'beginner') {
      sectionHelp.steps = sectionHelp.steps.map((step: string) => `📝 ${step}`);
      sectionHelp.tips.unshift('💡 Take your time to explore each feature');
    } else if (userLevel === 'advanced') {
      sectionHelp.tips.push('⚡ Use keyboard shortcuts to work more efficiently');
      sectionHelp.tips.push('🔧 Customize your workspace for optimal workflow');
    }

    return sectionHelp;
  }

  private async trackHelpRequest(userId: string, help: ContextualHelp): Promise<void> {
    try {
      const { error } = await supabase
        .from('help_requests')
        .insert({
          user_id: userId,
          page: help.page,
          section: help.section,
          user_level: help.user_level,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to track help request:', error);
    }
  }

  // Utility methods for voice actions
  private async generateDataReport(userId: string, entities: AIQuery['entities']): Promise<any> {
    const metricEntity = entities.find(e => e.entity === 'metric');
    const timeEntity = entities.find(e => e.entity === 'time_period');
    
    return {
      report_type: 'data_analysis',
      metric: metricEntity?.value || 'overview',
      time_period: timeEntity?.value || 'current',
      generated_at: new Date().toISOString()
    };
  }

  private async generatePrediction(userId: string, entities: AIQuery['entities']): Promise<any> {
    const metricEntity = entities.find(e => e.entity === 'metric');
    
    return {
      prediction_type: metricEntity?.value || 'revenue',
      forecast_period: '30_days',
      confidence: 85,
      generated_at: new Date().toISOString()
    };
  }

  private async generateRecommendations(userId: string): Promise<any> {
    return {
      recommendation_count: 5,
      priority_level: 'high',
      generated_at: new Date().toISOString()
    };
  }

  // Public methods for getting insights and suggestions
  async getActiveInsights(userId: string): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Failed to get active insights:', error);
      return [];
    }
  }

  async getWorkflowSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'suggested')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Failed to get workflow suggestions:', error);
      return [];
    }
  }

  async acknowledgeInsight(userId: string, insightId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ acknowledged: true })
        .eq('id', insightId)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to acknowledge insight:', error);
      throw error;
    }
  }

  async updateSuggestionStatus(userId: string, suggestionId: string, status: WorkflowSuggestion['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .update({ status })
        .eq('id', suggestionId)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update suggestion status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiAssistantService = AIAssistantService.getInstance();      
console.log(`🎤 Processing voice command for user: ${userId}`);

      // Convert audio to text using speech recognition
      const transcript = await this.speechToText(audioData);
      
      // Process the transcript as a natural language query
      const query = await this.processNaturalLanguageQuery(userId, transcript);
      
      // Convert response to voice command format
      const voiceCommand: VoiceCommand = {
        command: transcript,
        intent: query.intent,
        parameters: this.extractCommandParameters(query),
        response: this.formatVoiceResponse(query.response),
        action: async () => {
          return await this.executeVoiceAction(query);
        }
      };

      console.log(`✅ Voice command processed: "${transcript}"`);
      return voiceCommand;

    } catch (error) {
      console.error('❌ Failed to process voice command:', error);
      return {
        command: 'unknown',
        intent: 'error',
        parameters: {},
        response: "I'm sorry, I couldn't understand that command. Please try again."
      };
    }
  }

  private async speechToText(audioData: Blob): Promise<string> {
    // Mock speech-to-text conversion
    // In a real implementation, this would use a service like Google Speech-to-Text or Azure Speech
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate different voice commands
        const mockCommands = [
          "Show me my revenue for this month",
          "What are my top performing campaigns",
          "Create a new email campaign",
          "How many leads did I get yesterday",
          "Optimize my conversion funnel",
          "Send me a weekly report",
          "What should I focus on today"
        ];
        
        const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
        resolve(randomCommand);
      }, 1000);
    });
  }

  private extractCommandParameters(query: AIQuery): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    query.entities.forEach(entity => {
      parameters[entity.entity] = entity.value;
    });
    
    return parameters;
  }

  private formatVoiceResponse(response: AIResponse): string {
    // Format response for voice output
    let voiceResponse = response.response_text;
    
    // Add data summary for voice
    if (response.data && typeof response.data === 'object') {
      if (response.data.current_revenue) {
        voiceResponse += ` Your current revenue is $${response.data.current_revenue.toLocaleString()}.`;
      }
      if (response.data.growth_rate) {
        voiceResponse += ` That's a ${response.data.growth_rate}% change from the previous period.`;
      }
    }
    
    // Add top suggestion
    if (response.suggestions && response.suggestions.length > 0) {
      voiceResponse += ` ${response.suggestions[0]}`;
    }
    
    return voiceResponse;
  }

  private async executeVoiceAction(query: AIQuery): Promise<any> {
    // Execute actions based on the query
    if (query.response.actions && query.response.actions.length > 0) {
      const action = query.response.actions[0];
      
      switch (action.action_type) {
        case 'create_report':
          return await this.createReport(action.action_data);
        case 'create_alert':
          return await this.createAlert(action.action_data);
        case 'create_dashboard':
          return await this.createDashboard(action.action_data);
        default:
          return { success: true, message: 'Action noted' };
      }
    }
    
    return { success: true, message: 'Command processed' };
  }

  // Contextual Help System
  async getContextualHelp(userId: string, page: string, section?: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): Promise<ContextualHelp> {
    try {
      console.log(`📚 Getting contextual help for ${page}/${section} (${userLevel} level)`);

      const helpContent = await this.generateHelpContent(page, section, userLevel);
      
      const contextualHelp: ContextualHelp = {
        page,
        section: section || 'general',
        help_content: helpContent,
        user_level: userLevel
      };

      // Store help request for analytics
      await this.trackHelpRequest(userId, contextualHelp);

      console.log(`✅ Contextual help provided for ${page}/${section}`);
      return contextualHelp;

    } catch (error) {
      console.error('❌ Failed to get contextual help:', error);
      throw error;
    }
  }

  private async generateHelpContent(page: string, section?: string, userLevel: string = 'intermediate'): Promise<ContextualHelp['help_content']> {
    // Generate help content based on page and section
    const helpDatabase: Record<string, Record<string, any>> = {
      dashboard: {
        general: {
          title: 'Dashboard Overview',
          description: 'Your dashboard provides a comprehensive view of your marketing performance and key metrics.',
          steps: [
            'Review your key performance indicators (KPIs) in the top cards',
            'Analyze trends using the interactive charts',
            'Check recent activities in the activity feed',
            'Use filters to focus on specific time periods or campaigns'
          ],
          tips: [
            'Customize your dashboard by clicking the settings icon',
            'Set up alerts for important metrics',
            'Export data for external analysis',
            'Use the search function to quickly find specific information'
          ],
          related_features: ['Reports', 'Analytics', 'Alerts', 'Campaigns']
        },
        metrics: {
          title: 'Understanding Your Metrics',
          description: 'Learn how to interpret and act on your key performance metrics.',
          steps: [
            'Focus on metrics that align with your business goals',
            'Compare current performance to previous periods',
            'Look for trends and patterns in your data',
            'Identify metrics that need immediate attention'
          ],
          tips: [
            'Green indicators show positive trends',
            'Red indicators require attention',
            'Click on any metric for detailed breakdown',
            'Set benchmarks to track progress over time'
          ],
          related_features: ['Analytics', 'Reports', 'Goals', 'Benchmarks']
        }
      },
      campaigns: {
        general: {
          title: 'Campaign Management',
          description: 'Create, manage, and optimize your marketing campaigns for maximum impact.',
          steps: [
            'Click "Create Campaign" to start a new campaign',
            'Choose your campaign type and objectives',
            'Set up targeting and audience parameters',
            'Design your campaign content and messaging',
            'Review and launch your campaign'
          ],
          tips: [
            'Start with clear, measurable objectives',
            'Test different variations to optimize performance',
            'Monitor campaign performance regularly',
            'Use automation to scale successful campaigns'
          ],
          related_features: ['Email Marketing', 'Funnels', 'Analytics', 'Automation']
        },
        email: {
          title: 'Email Campaign Setup',
          description: 'Create effective email campaigns that engage your audience and drive conversions.',
          steps: [
            'Select your email template or create from scratch',
            'Write compelling subject lines and content',
            'Set up your audience segmentation',
            'Schedule or send your campaign',
            'Monitor performance and optimize'
          ],
          tips: [
            'Personalize emails with recipient names and data',
            'Test subject lines to improve open rates',
            'Keep content concise and action-oriented',
            'Include clear call-to-action buttons'
          ],
          related_features: ['Templates', 'Segmentation', 'A/B Testing', 'Analytics']
        }
      },
      funnels: {
        general: {
          title: 'Funnel Builder',
          description: 'Create high-converting sales funnels that guide prospects through your customer journey.',
          steps: [
            'Choose a funnel template or start from scratch',
            'Add and customize funnel pages',
            'Set up conversion tracking',
            'Configure payment and form integrations',
            'Test and publish your funnel'
          ],
          tips: [
            'Keep your funnel simple and focused',
            'Use compelling headlines and value propositions',
            'Minimize form fields to reduce friction',
            'Test different variations to optimize conversions'
          ],
          related_features: ['Landing Pages', 'Forms', 'Payments', 'Analytics']
        }
      },
      analytics: {
        general: {
          title: 'Analytics & Reporting',
          description: 'Gain deep insights into your marketing performance with comprehensive analytics.',
          steps: [
            'Select the metrics and time period you want to analyze',
            'Use filters to segment your data',
            'Create custom reports for specific insights',
            'Set up automated report delivery',
            'Export data for further analysis'
          ],
          tips: [
            'Focus on metrics that drive business outcomes',
            'Look for trends and patterns over time',
            'Compare performance across different channels',
            'Use insights to inform future strategy'
          ],
          related_features: ['Dashboard', 'Reports', 'Alerts', 'Forecasting']
        }
      }
    };

    const pageHelp = helpDatabase[page];
    if (!pageHelp) {
      return {
        title: 'Help Not Available',
        description: 'Help content for this page is not yet available.',
        steps: ['Contact support for assistance'],
        tips: ['Check our documentation for more information'],
        related_features: []
      };
    }

    const sectionHelp = pageHelp[section || 'general'] || pageHelp.general;
    
    // Adjust content based on user level
    if (userLevel === 'beginner') {
      return {
        ...sectionHelp,
        steps: sectionHelp.steps.map((step: string) => `📝 ${step}`),
        tips: sectionHelp.tips.slice(0, 2), // Show fewer tips for beginners
        video_url: `https://help.higherup.ai/videos/${page}-basics`
      };
    } else if (userLevel === 'advanced') {
      return {
        ...sectionHelp,
        tips: [
          ...sectionHelp.tips,
          'Use keyboard shortcuts for faster navigation',
          'Set up custom integrations via API',
          'Create advanced automation workflows'
        ],
        video_url: `https://help.higherup.ai/videos/${page}-advanced`
      };
    }

    return {
      ...sectionHelp,
      video_url: `https://help.higherup.ai/videos/${page}-overview`
    };
  }

  private async trackHelpRequest(userId: string, help: ContextualHelp): Promise<void> {
    try {
      const { error } = await supabase
        .from('help_requests')
        .insert({
          user_id: userId,
          page: help.page,
          section: help.section,
          user_level: help.user_level,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to track help request:', error);
    }
  }

  // Workflow and Task Suggestions
  async generateWorkflowSuggestions(userId: string): Promise<WorkflowSuggestion[]> {
    try {
      console.log(`🔄 Generating workflow suggestions for user: ${userId}`);

      const suggestions: WorkflowSuggestion[] = [];

      // Analyze user's current workflows and identify improvements
      const automationSuggestions = await this.analyzeAutomationOpportunities(userId);
      suggestions.push(...automationSuggestions);

      const optimizationSuggestions = await this.analyzeOptimizationOpportunities(userId);
      suggestions.push(...optimizationSuggestions);

      const integrationSuggestions = await this.analyzeIntegrationOpportunities(userId);
      suggestions.push(...integrationSuggestions);

      const processSuggestions = await this.analyzeProcessImprovements(userId);
      suggestions.push(...processSuggestions);

      // Store suggestions
      await this.storeSuggestions(suggestions);

      // Sort by impact and effort
      const sortedSuggestions = suggestions.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        const effortOrder = { low: 3, medium: 2, high: 1 };
        
        const aScore = impactOrder[a.impact_estimate] + effortOrder[a.effort_estimate];
        const bScore = impactOrder[b.impact_estimate] + effortOrder[b.effort_estimate];
        
        return bScore - aScore;
      });

      console.log(`✅ Generated ${suggestions.length} workflow suggestions`);
      return sortedSuggestions;

    } catch (error) {
      console.error('❌ Failed to generate workflow suggestions:', error);
      throw error;
    }
  }

  private async analyzeAutomationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    // Mock automation analysis
    suggestions.push({
      id: `suggestion_${Date.now()}_1`,
      user_id: userId,
      suggestion_type: 'automation',
      title: 'Automate Lead Follow-up Sequences',
      description: 'Set up automated email sequences for new leads to improve conversion rates and reduce manual work.',
      current_process: 'Manual follow-up emails sent individually to each new lead',
      suggested_process: 'Automated email sequence triggered when new lead is added to CRM',
      benefits: [
        'Reduce manual work by 80%',
        'Improve response time to new leads',
        'Increase lead conversion rates by 25-30%',
        'Ensure consistent follow-up process'
      ],
      implementation_steps: [
        'Create email templates for follow-up sequence',
        'Set up automation triggers in CRM',
        'Define timing and conditions for each email',
        'Test the automation with sample leads',
        'Monitor performance and optimize'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async analyzeOptimizationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_2`,
      user_id: userId,
      suggestion_type: 'optimization',
      title: 'Optimize Email Send Times',
      description: 'Use AI to determine the best send times for each contact based on their engagement patterns.',
      current_process: 'Emails sent at fixed times for all contacts',
      suggested_process: 'AI-optimized send times based on individual contact behavior',
      benefits: [
        'Increase email open rates by 15-20%',
        'Improve click-through rates',
        'Better engagement with your audience',
        'Maximize email campaign ROI'
      ],
      implementation_steps: [
        'Enable AI send time optimization',
        'Allow system to collect engagement data',
        'Review and approve suggested send times',
        'Monitor performance improvements',
        'Fine-tune settings based on results'
      ],
      effort_estimate: 'low',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async analyzeIntegrationOpportunities(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_3`,
      user_id: userId,
      suggestion_type: 'integration',
      title: 'Connect Social Media Accounts',
      description: 'Integrate your social media accounts to streamline content publishing and track social ROI.',
      current_process: 'Manual posting to each social media platform separately',
      suggested_process: 'Centralized social media management with automated posting',
      benefits: [
        'Save 5+ hours per week on social media management',
        'Maintain consistent posting schedule',
        'Track social media ROI more effectively',
        'Coordinate campaigns across all channels'
      ],
      implementation_steps: [
        'Connect your social media accounts',
        'Set up content calendar and posting schedule',
        'Create content templates for different platforms',
        'Configure analytics and tracking',
        'Train team on new workflow'
      ],
      effort_estimate: 'medium',
      impact_estimate: 'medium',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async analyzeProcessImprovements(userId: string): Promise<WorkflowSuggestion[]> {
    const suggestions: WorkflowSuggestion[] = [];

    suggestions.push({
      id: `suggestion_${Date.now()}_4`,
      user_id: userId,
      suggestion_type: 'process_improvement',
      title: 'Implement Lead Scoring System',
      description: 'Set up automated lead scoring to prioritize sales efforts on the most qualified prospects.',
      current_process: 'Manual review of each lead to determine priority',
      suggested_process: 'Automated lead scoring based on behavior and demographics',
      benefits: [
        'Focus sales efforts on highest-quality leads',
        'Increase conversion rates by 30-40%',
        'Reduce time spent on unqualified leads',
        'Improve sales team efficiency'
      ],
      implementation_steps: [
        'Define lead scoring criteria and point values',
        'Set up automated scoring rules',
        'Train sales team on new lead prioritization',
        'Monitor scoring accuracy and adjust',
        'Integrate with CRM and sales processes'
      ],
      effort_estimate: 'high',
      impact_estimate: 'high',
      created_at: new Date(),
      status: 'suggested'
    });

    return suggestions;
  }

  private async storeSuggestions(suggestions: WorkflowSuggestion[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .insert(suggestions.map(suggestion => ({
          user_id: suggestion.user_id,
          suggestion_type: suggestion.suggestion_type,
          title: suggestion.title,
          description: suggestion.description,
          current_process: suggestion.current_process,
          suggested_process: suggestion.suggested_process,
          benefits: suggestion.benefits,
          implementation_steps: suggestion.implementation_steps,
          effort_estimate: suggestion.effort_estimate,
          impact_estimate: suggestion.impact_estimate,
          created_at: suggestion.created_at.toISOString(),
          status: suggestion.status
        })));

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store workflow suggestions:', error);
    }
  }

  // Helper methods for actions
  private async createReport(data: any): Promise<any> {
    console.log('Creating report with data:', data);
    return { success: true, reportId: `report_${Date.now()}` };
  }

  private async createAlert(data: any): Promise<any> {
    console.log('Creating alert with data:', data);
    return { success: true, alertId: `alert_${Date.now()}` };
  }

  private async createDashboard(data: any): Promise<any> {
    console.log('Creating dashboard with data:', data);
    return { success: true, dashboardId: `dashboard_${Date.now()}` };
  }

  // Public methods for getting stored data
  async getInsights(userId: string, limit: number = 10): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get insights:', error);
      return [];
    }
  }

  async getWorkflowSuggestions(userId: string, status?: string): Promise<WorkflowSuggestion[]> {
    try {
      let query = supabase
        .from('workflow_suggestions')
        .select('*')
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get workflow suggestions:', error);
      return [];
    }
  }

  async acknowledgeInsight(insightId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ acknowledged: true })
        .eq('id', insightId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to acknowledge insight:', error);
      throw error;
    }
  }

  async updateSuggestionStatus(suggestionId: string, status: WorkflowSuggestion['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_suggestions')
        .update({ status })
        .eq('id', suggestionId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update suggestion status:', error);
      throw error;
    }
  }
}

export const aiAssistantService = AIAssistantService.getInstance();
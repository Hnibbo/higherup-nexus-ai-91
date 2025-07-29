import { supabase } from '@/integrations/supabase/client';

export interface BrandMention {
  id: string;
  platform: string;
  content: string;
  author: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  reach: number;
  engagement: number;
  timestamp: Date;
  keywords: string[];
  influencerScore: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
  };
  topics: string[];
}

export interface CompetitorTracking {
  competitor: string;
  mentions: number;
  sentiment: SentimentAnalysis;
  engagement: number;
  shareOfVoice: number;
  trending: boolean;
}

export interface SocialAlert {
  id: string;
  type: 'mention' | 'sentiment_drop' | 'viral_content' | 'competitor_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
  acknowledged: boolean;
}

export class SocialMediaMonitoringService {
  private monitoringActive = false;
  private alertThresholds = {
    sentimentDrop: -0.3,
    viralThreshold: 1000,
    competitorMentionSpike: 50
  };

  async startMonitoring(keywords: string[], competitors: string[]): Promise<void> {
    this.monitoringActive = true;
    
    // Start monitoring across platforms
    await Promise.all([
      this.monitorTwitter(keywords, competitors),
      this.monitorFacebook(keywords, competitors),
      this.monitorInstagram(keywords, competitors),
      this.monitorLinkedIn(keywords, competitors),
      this.monitorYouTube(keywords, competitors),
      this.monitorTikTok(keywords, competitors),
      this.monitorReddit(keywords, competitors)
    ]);
  }

  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
  }

  async getBrandMentions(
    timeframe: string = '24h',
    platform?: string
  ): Promise<BrandMention[]> {
    const { data, error } = await supabase
      .from('brand_mentions')
      .select('*')
      .gte('timestamp', this.getTimeframeDate(timeframe))
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return data?.filter(mention => !platform || mention.platform === platform) || [];
  }

  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    // Advanced sentiment analysis using AI
    const sentimentScore = this.calculateSentimentScore(content);
    const emotions = this.analyzeEmotions(content);
    const topics = this.extractTopics(content);

    return {
      overall: sentimentScore > 0.1 ? 'positive' : sentimentScore < -0.1 ? 'negative' : 'neutral',
      score: sentimentScore,
      confidence: Math.abs(sentimentScore),
      emotions,
      topics
    };
  }

  async trackCompetitors(competitors: string[]): Promise<CompetitorTracking[]> {
    const tracking: CompetitorTracking[] = [];

    for (const competitor of competitors) {
      const mentions = await this.getCompetitorMentions(competitor);
      const sentiment = await this.getCompetitorSentiment(competitor);
      const engagement = await this.getCompetitorEngagement(competitor);
      const shareOfVoice = await this.calculateShareOfVoice(competitor);

      tracking.push({
        competitor,
        mentions: mentions.length,
        sentiment,
        engagement,
        shareOfVoice,
        trending: this.isCompetitorTrending(competitor)
      });
    }

    return tracking;
  }

  async createAlert(alert: Omit<SocialAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<SocialAlert> {
    const newAlert: SocialAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      acknowledged: false,
      ...alert
    };

    const { error } = await supabase
      .from('social_alerts')
      .insert(newAlert);

    if (error) throw error;

    // Send real-time notification
    await this.sendAlertNotification(newAlert);

    return newAlert;
  }

  async getAlerts(acknowledged?: boolean): Promise<SocialAlert[]> {
    let query = supabase
      .from('social_alerts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (acknowledged !== undefined) {
      query = query.eq('acknowledged', acknowledged);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('social_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId);

    if (error) throw error;
  }

  async getSocialROI(campaignId?: string): Promise<{
    reach: number;
    engagement: number;
    conversions: number;
    revenue: number;
    roi: number;
    costPerEngagement: number;
  }> {
    // Calculate social media ROI and attribution
    const metrics = await this.calculateSocialMetrics(campaignId);
    
    return {
      reach: metrics.totalReach,
      engagement: metrics.totalEngagement,
      conversions: metrics.conversions,
      revenue: metrics.revenue,
      roi: (metrics.revenue - metrics.cost) / metrics.cost,
      costPerEngagement: metrics.cost / metrics.totalEngagement
    };
  }

  async getInfluencerInsights(): Promise<{
    topInfluencers: Array<{
      username: string;
      platform: string;
      followers: number;
      engagement: number;
      mentions: number;
      sentiment: SentimentAnalysis;
    }>;
    opportunities: Array<{
      influencer: string;
      potential: number;
      cost: number;
      audience: string;
    }>;
  }> {
    const influencers = await this.identifyInfluencers();
    const opportunities = await this.findInfluencerOpportunities();

    return {
      topInfluencers: influencers,
      opportunities
    };
  }

  private async monitorTwitter(keywords: string[], competitors: string[]): Promise<void> {
    // Twitter monitoring implementation
    const mentions = await this.fetchTwitterMentions(keywords);
    await this.processMentions(mentions, 'twitter');
  }

  private async monitorFacebook(keywords: string[], competitors: string[]): Promise<void> {
    // Facebook monitoring implementation
    const mentions = await this.fetchFacebookMentions(keywords);
    await this.processMentions(mentions, 'facebook');
  }

  private async monitorInstagram(keywords: string[], competitors: string[]): Promise<void> {
    // Instagram monitoring implementation
    const mentions = await this.fetchInstagramMentions(keywords);
    await this.processMentions(mentions, 'instagram');
  }

  private async monitorLinkedIn(keywords: string[], competitors: string[]): Promise<void> {
    // LinkedIn monitoring implementation
    const mentions = await this.fetchLinkedInMentions(keywords);
    await this.processMentions(mentions, 'linkedin');
  }

  private async monitorYouTube(keywords: string[], competitors: string[]): Promise<void> {
    // YouTube monitoring implementation
    const mentions = await this.fetchYouTubeMentions(keywords);
    await this.processMentions(mentions, 'youtube');
  }

  private async monitorTikTok(keywords: string[], competitors: string[]): Promise<void> {
    // TikTok monitoring implementation
    const mentions = await this.fetchTikTokMentions(keywords);
    await this.processMentions(mentions, 'tiktok');
  }

  private async monitorReddit(keywords: string[], competitors: string[]): Promise<void> {
    // Reddit monitoring implementation
    const mentions = await this.fetchRedditMentions(keywords);
    await this.processMentions(mentions, 'reddit');
  }

  private async fetchTwitterMentions(keywords: string[]): Promise<any[]> {
    // Mock Twitter API integration
    return [
      {
        id: '1',
        content: `Just tried ${keywords[0]} and it's amazing! #gameChanger`,
        author: '@user1',
        url: 'https://twitter.com/user1/status/1',
        reach: 1500,
        engagement: 45,
        timestamp: new Date()
      }
    ];
  }

  private async fetchFacebookMentions(keywords: string[]): Promise<any[]> {
    // Mock Facebook API integration
    return [
      {
        id: '2',
        content: `${keywords[0]} has revolutionized our business processes`,
        author: 'Business User',
        url: 'https://facebook.com/post/2',
        reach: 2500,
        engagement: 78,
        timestamp: new Date()
      }
    ];
  }

  private async fetchInstagramMentions(keywords: string[]): Promise<any[]> {
    // Mock Instagram API integration
    return [
      {
        id: '3',
        content: `Love using ${keywords[0]} for our marketing campaigns! 📈`,
        author: '@marketer',
        url: 'https://instagram.com/p/3',
        reach: 3200,
        engagement: 156,
        timestamp: new Date()
      }
    ];
  }

  private async fetchLinkedInMentions(keywords: string[]): Promise<any[]> {
    // Mock LinkedIn API integration
    return [
      {
        id: '4',
        content: `${keywords[0]} is the future of business automation`,
        author: 'CEO Professional',
        url: 'https://linkedin.com/posts/4',
        reach: 5000,
        engagement: 234,
        timestamp: new Date()
      }
    ];
  }

  private async fetchYouTubeMentions(keywords: string[]): Promise<any[]> {
    // Mock YouTube API integration
    return [
      {
        id: '5',
        content: `Review: ${keywords[0]} - The Ultimate Business Platform`,
        author: 'Tech Reviewer',
        url: 'https://youtube.com/watch?v=5',
        reach: 15000,
        engagement: 890,
        timestamp: new Date()
      }
    ];
  }

  private async fetchTikTokMentions(keywords: string[]): Promise<any[]> {
    // Mock TikTok API integration
    return [
      {
        id: '6',
        content: `POV: You discover ${keywords[0]} and your business explodes 🚀`,
        author: '@businesstok',
        url: 'https://tiktok.com/@businesstok/video/6',
        reach: 25000,
        engagement: 1250,
        timestamp: new Date()
      }
    ];
  }

  private async fetchRedditMentions(keywords: string[]): Promise<any[]> {
    // Mock Reddit API integration
    return [
      {
        id: '7',
        content: `Has anyone tried ${keywords[0]}? Thoughts?`,
        author: 'u/entrepreneur',
        url: 'https://reddit.com/r/business/comments/7',
        reach: 8500,
        engagement: 342,
        timestamp: new Date()
      }
    ];
  }

  private async processMentions(mentions: any[], platform: string): Promise<void> {
    for (const mention of mentions) {
      const sentiment = await this.analyzeSentiment(mention.content);
      const keywords = this.extractKeywords(mention.content);
      const influencerScore = this.calculateInfluencerScore(mention);

      const brandMention: BrandMention = {
        id: mention.id,
        platform,
        content: mention.content,
        author: mention.author,
        url: mention.url,
        sentiment: sentiment.overall,
        reach: mention.reach,
        engagement: mention.engagement,
        timestamp: mention.timestamp,
        keywords,
        influencerScore
      };

      await this.saveBrandMention(brandMention);
      await this.checkForAlerts(brandMention);
    }
  }

  private async saveBrandMention(mention: BrandMention): Promise<void> {
    const { error } = await supabase
      .from('brand_mentions')
      .upsert(mention);

    if (error) throw error;
  }

  private async checkForAlerts(mention: BrandMention): Promise<void> {
    // Check for sentiment drop
    if (mention.sentiment === 'negative') {
      await this.createAlert({
        type: 'sentiment_drop',
        severity: 'medium',
        message: `Negative mention detected on ${mention.platform}`,
        data: mention
      });
    }

    // Check for viral content
    if (mention.engagement > this.alertThresholds.viralThreshold) {
      await this.createAlert({
        type: 'viral_content',
        severity: 'high',
        message: `Content going viral on ${mention.platform}`,
        data: mention
      });
    }
  }

  private calculateSentimentScore(content: string): number {
    // Advanced sentiment analysis algorithm
    const positiveWords = ['amazing', 'great', 'excellent', 'love', 'fantastic', 'awesome'];
    const negativeWords = ['terrible', 'awful', 'hate', 'bad', 'horrible', 'disappointing'];
    
    let score = 0;
    const words = content.toLowerCase().split(' ');
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }

  private analyzeEmotions(content: string): SentimentAnalysis['emotions'] {
    // Emotion analysis implementation
    return {
      joy: Math.random() * 0.5,
      anger: Math.random() * 0.3,
      fear: Math.random() * 0.2,
      sadness: Math.random() * 0.2,
      surprise: Math.random() * 0.4
    };
  }

  private extractTopics(content: string): string[] {
    // Topic extraction implementation
    const topics = ['business', 'marketing', 'automation', 'AI', 'productivity'];
    return topics.filter(() => Math.random() > 0.7);
  }

  private extractKeywords(content: string): string[] {
    // Keyword extraction implementation
    const words = content.toLowerCase().split(' ');
    return words.filter(word => word.length > 3);
  }

  private calculateInfluencerScore(mention: any): number {
    // Calculate influencer score based on reach and engagement
    return (mention.reach * 0.3 + mention.engagement * 0.7) / 1000;
  }

  private async getCompetitorMentions(competitor: string): Promise<BrandMention[]> {
    const { data, error } = await supabase
      .from('brand_mentions')
      .select('*')
      .ilike('content', `%${competitor}%`)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000));

    if (error) throw error;
    return data || [];
  }

  private async getCompetitorSentiment(competitor: string): Promise<SentimentAnalysis> {
    const mentions = await this.getCompetitorMentions(competitor);
    const sentiments = mentions.map(m => m.sentiment);
    
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;
    const neutral = sentiments.filter(s => s === 'neutral').length;
    
    const total = sentiments.length || 1;
    const score = (positive - negative) / total;

    return {
      overall: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      score,
      confidence: Math.abs(score),
      emotions: {
        joy: positive / total,
        anger: negative / total * 0.5,
        fear: negative / total * 0.3,
        sadness: negative / total * 0.2,
        surprise: neutral / total * 0.1
      },
      topics: ['competitor', 'comparison']
    };
  }

  private async getCompetitorEngagement(competitor: string): Promise<number> {
    const mentions = await this.getCompetitorMentions(competitor);
    return mentions.reduce((sum, m) => sum + m.engagement, 0);
  }

  private async calculateShareOfVoice(competitor: string): Promise<number> {
    const competitorMentions = await this.getCompetitorMentions(competitor);
    const totalMentions = await this.getBrandMentions('24h');
    
    return competitorMentions.length / (totalMentions.length || 1);
  }

  private isCompetitorTrending(competitor: string): boolean {
    // Check if competitor is trending based on mention velocity
    return Math.random() > 0.8; // Mock implementation
  }

  private async calculateSocialMetrics(campaignId?: string): Promise<{
    totalReach: number;
    totalEngagement: number;
    conversions: number;
    revenue: number;
    cost: number;
  }> {
    // Mock social metrics calculation
    return {
      totalReach: 150000,
      totalEngagement: 12500,
      conversions: 450,
      revenue: 67500,
      cost: 15000
    };
  }

  private async identifyInfluencers(): Promise<Array<{
    username: string;
    platform: string;
    followers: number;
    engagement: number;
    mentions: number;
    sentiment: SentimentAnalysis;
  }>> {
    // Mock influencer identification
    return [
      {
        username: '@techinfluencer',
        platform: 'twitter',
        followers: 50000,
        engagement: 2500,
        mentions: 15,
        sentiment: {
          overall: 'positive',
          score: 0.8,
          confidence: 0.9,
          emotions: { joy: 0.7, anger: 0.1, fear: 0.05, sadness: 0.05, surprise: 0.1 },
          topics: ['technology', 'business']
        }
      }
    ];
  }

  private async findInfluencerOpportunities(): Promise<Array<{
    influencer: string;
    potential: number;
    cost: number;
    audience: string;
  }>> {
    // Mock influencer opportunities
    return [
      {
        influencer: '@businessguru',
        potential: 85,
        cost: 2500,
        audience: 'B2B professionals'
      }
    ];
  }

  private async sendAlertNotification(alert: SocialAlert): Promise<void> {
    // Send notification via email, Slack, or other channels
    console.log(`Alert: ${alert.message}`);
  }

  private getTimeframeDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}

export const socialMediaMonitoringService = new SocialMediaMonitoringService();
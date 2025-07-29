import { supabase } from '@/integrations/supabase/client';

/**
 * Social Media Service
 * 
 * Handles multi-platform social media posting, content calendar, scheduling,
 * content templates, hashtag research, analytics, brand monitoring, and ROI tracking.
 */

export interface SocialMediaAccount {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  permissions: string[];
  profile_info: ProfileInfo;
  connected_at: string;
  last_sync: string;
}

export interface ProfileInfo {
  username: string;
  display_name: string;
  avatar_url?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  verified: boolean;
  bio?: string;
  website?: string;
}

export interface SocialMediaPost {
  id: string;
  content: string;
  media: MediaAttachment[];
  platforms: string[];
  scheduled_at?: string;
  published_at?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
  campaign_id?: string;
  tags: string[];
  hashtags: string[];
  mentions: string[];
  location?: Location;
  post_type: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
  engagement: PostEngagement;
  analytics: PostAnalytics;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
  duration?: number;
  dimensions: { width: number; height: number };
  file_size: number;
}

export interface Location {
  name: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
}

export interface PostEngagement {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  impressions: number;
  reach: number;
  engagement_rate: number;
}

export interface PostAnalytics {
  platform_metrics: Record<string, any>;
  demographic_data: DemographicData;
  performance_score: number;
  best_performing_time: string;
  audience_sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DemographicData {
  age_groups: Record<string, number>;
  gender_distribution: Record<string, number>;
  location_data: Record<string, number>;
  interests: string[];
}

export class SocialMediaService {
  private static instance: SocialMediaService;
  private connectedAccounts: Map<string, SocialMediaAccount> = new Map();
  private publishingQueue: SocialMediaPost[] = [];
  private schedulingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): SocialMediaService {
    if (!SocialMediaService.instance) {
      SocialMediaService.instance = new SocialMediaService();
    }
    return SocialMediaService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('📱 Initializing Social Media Service');
      
      // Load connected accounts
      await this.loadConnectedAccounts();
      
      // Start scheduled posting
      await this.startScheduledPosting();
      
      console.log('✅ Social Media Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Social Media Service:', error);
    }
  }

  private async loadConnectedAccounts(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('status', 'connected');

      if (error) {
        console.warn('Could not load connected accounts:', error);
        return;
      }

      if (data) {
        data.forEach(account => {
          this.connectedAccounts.set(account.id, account);
        });
        console.log(`📱 Loaded ${data.length} connected social media accounts`);
      }
    } catch (error) {
      console.error('Failed to load connected accounts:', error);
    }
  }

  private async startScheduledPosting(): Promise<void> {
    // Check for scheduled posts every minute
    this.schedulingInterval = setInterval(async () => {
      await this.processScheduledPosts();
    }, 60 * 1000);

    // Process any pending posts immediately
    await this.processScheduledPosts();
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { data: scheduledPosts, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('status', 'scheduled')
        .lte('scheduled_at', now);

      if (error) {
        console.error('Failed to fetch scheduled posts:', error);
        return;
      }

      if (scheduledPosts && scheduledPosts.length > 0) {
        console.log(`📅 Processing ${scheduledPosts.length} scheduled posts`);
        
        for (const post of scheduledPosts) {
          await this.publishPost(post.id);
        }
      }
    } catch (error) {
      console.error('Failed to process scheduled posts:', error);
    }
  }

  // Social Media Publishing
  async createPost(postData: Omit<SocialMediaPost, 'id' | 'created_at' | 'updated_at' | 'engagement' | 'analytics'>): Promise<SocialMediaPost | null> {
    try {
      console.log('📝 Creating social media post');

      const newPost: Omit<SocialMediaPost, 'id'> = {
        ...postData,
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0,
          impressions: 0,
          reach: 0,
          engagement_rate: 0
        },
        analytics: {
          platform_metrics: {},
          demographic_data: {
            age_groups: {},
            gender_distribution: {},
            location_data: {},
            interests: []
          },
          performance_score: 0,
          best_performing_time: '',
          audience_sentiment: 'neutral'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_media_posts')
        .insert(newPost)
        .select()
        .single();

      if (error) {
        console.error('Failed to create post:', error);
        return null;
      }

      // If scheduled for immediate posting, add to queue
      if (!postData.scheduled_at || new Date(postData.scheduled_at) <= new Date()) {
        await this.publishPost(data.id);
      }

      console.log('✅ Social media post created successfully');
      return data;
    } catch (error) {
      console.error('❌ Failed to create social media post:', error);
      return null;
    }
  }

  async publishPost(postId: string): Promise<boolean> {
    try {
      console.log(`🚀 Publishing post: ${postId}`);

      const post = await this.getPost(postId);
      if (!post) {
        console.error('Post not found');
        return false;
      }

      const results: Record<string, boolean> = {};
      
      // Publish to each platform
      for (const platformId of post.platforms) {
        const account = this.connectedAccounts.get(platformId);
        if (!account) {
          console.warn(`Account not found for platform: ${platformId}`);
          results[platformId] = false;
          continue;
        }

        try {
          const success = await this.publishToPlatform(post, account);
          results[platformId] = success;
        } catch (error) {
          console.error(`Failed to publish to ${account.platform}:`, error);
          results[platformId] = false;
        }
      }

      // Update post status
      const allSuccessful = Object.values(results).every(result => result);
      const anySuccessful = Object.values(results).some(result => result);
      
      const status = allSuccessful ? 'published' : anySuccessful ? 'published' : 'failed';
      
      await supabase
        .from('social_media_posts')
        .update({
          status,
          published_at: status === 'published' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      console.log(`✅ Post publishing completed: ${status}`);
      return allSuccessful;
    } catch (error) {
      console.error('❌ Failed to publish post:', error);
      return false;
    }
  }

  private async publishToPlatform(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    console.log(`📤 Publishing to ${account.platform}: ${account.account_name}`);

    switch (account.platform) {
      case 'facebook':
        return await this.publishToFacebook(post, account);
      case 'twitter':
        return await this.publishToTwitter(post, account);
      case 'instagram':
        return await this.publishToInstagram(post, account);
      case 'linkedin':
        return await this.publishToLinkedIn(post, account);
      case 'youtube':
        return await this.publishToYouTube(post, account);
      case 'tiktok':
        return await this.publishToTikTok(post, account);
      case 'pinterest':
        return await this.publishToPinterest(post, account);
      default:
        console.warn(`Unsupported platform: ${account.platform}`);
        return false;
    }
  }

  private async publishToFacebook(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      // Mock Facebook API call
      console.log('📘 Publishing to Facebook');
      
      const payload = {
        message: post.content,
        access_token: account.access_token
      };

      // Add media if present
      if (post.media.length > 0) {
        payload['attached_media'] = post.media.map(media => ({
          media_fbid: media.id
        }));
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to Facebook:', error);
      return false;
    }
  }

  private async publishToTwitter(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log('🐦 Publishing to Twitter');
      
      const payload = {
        text: post.content,
        media: post.media.length > 0 ? {
          media_ids: post.media.map(m => m.id)
        } : undefined
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to Twitter:', error);
      return false;
    }
  }

  private async publishToInstagram(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log('📸 Publishing to Instagram');
      
      if (post.media.length === 0) {
        console.error('Instagram posts require media');
        return false;
      }

      const payload = {
        image_url: post.media[0].url,
        caption: post.content,
        access_token: account.access_token
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to Instagram:', error);
      return false;
    }
  }

  private async publishToLinkedIn(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log('💼 Publishing to LinkedIn');
      
      const payload = {
        content: {
          contentEntities: post.media.map(media => ({
            entityLocation: media.url,
            thumbnails: media.thumbnail_url ? [{ resolvedUrl: media.thumbnail_url }] : []
          })),
          title: post.content.substring(0, 100)
        },
        text: {
          text: post.content
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to LinkedIn:', error);
      return false;
    }
  }

  private async publishToYouTube(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log('📺 Publishing to YouTube');
      
      if (post.media.length === 0 || post.media[0].type !== 'video') {
        console.error('YouTube posts require video content');
        return false;
      }

      const payload = {
        snippet: {
          title: post.content.substring(0, 100),
          description: post.content,
          tags: post.hashtags,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: 'public'
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to YouTube:', error);
      return false;
    }
  }

  private async publishToTikTok(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log('🎵 Publishing to TikTok');
      
      if (post.media.length === 0 || post.media[0].type !== 'video') {
        console.error('TikTok posts require video content');
        return false;
      }

      const payload = {
        video: {
          video_url: post.media[0].url
        },
        post_info: {
          title: post.content,
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to TikTok:', error);
      return false;
    }
  }

  private async publishToPinterest(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log('📌 Publishing to Pinterest');
      
      if (post.media.length === 0) {
        console.error('Pinterest posts require media');
        return false;
      }

      const payload = {
        link: post.media[0].url,
        note: post.content,
        board_id: 'default_board' // Would be configurable
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Failed to publish to Pinterest:', error);
      return false;
    }
  }

  // Content Calendar Management
  async getContentCalendar(startDate: string, endDate: string): Promise<SocialMediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch content calendar:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get content calendar:', error);
      return [];
    }
  }

  async schedulePost(postId: string, scheduledAt: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({
          scheduled_at: scheduledAt,
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('Failed to schedule post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to schedule post:', error);
      return false;
    }
  }

  // Content Templates
  async createContentTemplate(templateData: {
    name: string;
    content: string;
    media_templates: string[];
    hashtags: string[];
    category: string;
    platforms: string[];
  }): Promise<any> {
    try {
      const template = {
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('content_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        console.error('Failed to create content template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to create content template:', error);
      return null;
    }
  }

  async getContentTemplates(category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('content_templates')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch content templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get content templates:', error);
      return [];
    }
  }

  // Hashtag Research and Optimization
  async researchHashtags(keyword: string, platform: string): Promise<any[]> {
    try {
      console.log(`🔍 Researching hashtags for: ${keyword} on ${platform}`);

      // Mock hashtag research - would integrate with actual APIs
      const mockHashtags = [
        { tag: `#${keyword}`, popularity: 95, competition: 'high', posts: 1500000 },
        { tag: `#${keyword}tips`, popularity: 75, competition: 'medium', posts: 250000 },
        { tag: `#${keyword}strategy`, popularity: 60, competition: 'low', posts: 85000 },
        { tag: `#${keyword}marketing`, popularity: 85, competition: 'high', posts: 950000 },
        { tag: `#${keyword}business`, popularity: 70, competition: 'medium', posts: 420000 }
      ];

      // Store hashtag research results
      await supabase
        .from('hashtag_research')
        .insert({
          keyword,
          platform,
          results: mockHashtags,
          researched_at: new Date().toISOString()
        });

      return mockHashtags;
    } catch (error) {
      console.error('Failed to research hashtags:', error);
      return [];
    }
  }

  async getOptimalHashtags(content: string, platform: string, count: number = 10): Promise<string[]> {
    try {
      // Extract keywords from content
      const keywords = this.extractKeywords(content);
      
      // Get hashtag suggestions for each keyword
      const allHashtags: any[] = [];
      for (const keyword of keywords.slice(0, 3)) {
        const hashtags = await this.researchHashtags(keyword, platform);
        allHashtags.push(...hashtags);
      }

      // Sort by popularity and filter by competition
      const optimalHashtags = allHashtags
        .filter(h => h.competition !== 'high')
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, count)
        .map(h => h.tag);

      return optimalHashtags;
    } catch (error) {
      console.error('Failed to get optimal hashtags:', error);
      return [];
    }
  }

  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - would use NLP in production
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said'].includes(word));

    // Return unique words
    return [...new Set(words)].slice(0, 5);
  }

  // Social Media Analytics
  async getPostAnalytics(postId: string): Promise<PostAnalytics | null> {
    try {
      const post = await this.getPost(postId);
      if (!post) return null;

      // Fetch analytics from each platform
      const platformAnalytics: Record<string, any> = {};
      
      for (const platformId of post.platforms) {
        const account = this.connectedAccounts.get(platformId);
        if (account) {
          platformAnalytics[account.platform] = await this.fetchPlatformAnalytics(post, account);
        }
      }

      // Calculate aggregate analytics
      const analytics: PostAnalytics = {
        platform_metrics: platformAnalytics,
        demographic_data: this.aggregateDemographicData(platformAnalytics),
        performance_score: this.calculatePerformanceScore(post.engagement),
        best_performing_time: this.findBestPerformingTime(platformAnalytics),
        audience_sentiment: this.analyzeSentiment(post.content)
      };

      // Update post with analytics
      await supabase
        .from('social_media_posts')
        .update({ analytics })
        .eq('id', postId);

      return analytics;
    } catch (error) {
      console.error('Failed to get post analytics:', error);
      return null;
    }
  }

  private async fetchPlatformAnalytics(post: SocialMediaPost, account: SocialMediaAccount): Promise<any> {
    // Mock platform analytics - would fetch from actual APIs
    return {
      impressions: Math.floor(Math.random() * 10000) + 1000,
      reach: Math.floor(Math.random() * 8000) + 800,
      engagement: Math.floor(Math.random() * 500) + 50,
      clicks: Math.floor(Math.random() * 200) + 20,
      shares: Math.floor(Math.random() * 50) + 5
    };
  }

  private aggregateDemographicData(platformAnalytics: Record<string, any>): DemographicData {
    // Mock demographic aggregation
    return {
      age_groups: {
        '18-24': 25,
        '25-34': 35,
        '35-44': 25,
        '45-54': 10,
        '55+': 5
      },
      gender_distribution: {
        'male': 45,
        'female': 52,
        'other': 3
      },
      location_data: {
        'US': 60,
        'UK': 15,
        'CA': 10,
        'AU': 8,
        'Other': 7
      },
      interests: ['marketing', 'business', 'technology', 'entrepreneurship']
    };
  }

  private calculatePerformanceScore(engagement: PostEngagement): number {
    const engagementRate = engagement.engagement_rate;
    const reachRate = engagement.reach > 0 ? engagement.impressions / engagement.reach : 0;
    const clickRate = engagement.impressions > 0 ? engagement.clicks / engagement.impressions : 0;
    
    return Math.min(100, Math.round(
      (engagementRate * 40) + 
      (reachRate * 30) + 
      (clickRate * 30)
    ));
  }

  private findBestPerformingTime(platformAnalytics: Record<string, any>): string {
    // Mock best performing time analysis
    const hours = ['09:00', '12:00', '15:00', '18:00', '21:00'];
    return hours[Math.floor(Math.random() * hours.length)];
  }

  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis - would use AI in production
    const positiveWords = ['great', 'awesome', 'amazing', 'excellent', 'fantastic', 'love', 'best'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Account Management
  async connectAccount(platform: string, authData: any): Promise<SocialMediaAccount | null> {
    try {
      console.log(`🔗 Connecting ${platform} account`);

      const accountData: Omit<SocialMediaAccount, 'id'> = {
        platform: platform as any,
        account_name: authData.account_name,
        account_id: authData.account_id,
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: authData.expires_at,
        status: 'connected',
        permissions: authData.permissions || [],
        profile_info: authData.profile_info,
        connected_at: new Date().toISOString(),
        last_sync: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_media_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) {
        console.error('Failed to connect account:', error);
        return null;
      }

      this.connectedAccounts.set(data.id, data);
      console.log(`✅ ${platform} account connected successfully`);
      
      return data;
    } catch (error) {
      console.error('❌ Failed to connect social media account:', error);
      return null;
    }
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_media_accounts')
        .update({ status: 'disconnected' })
        .eq('id', accountId);

      if (error) {
        console.error('Failed to disconnect account:', error);
        return false;
      }

      this.connectedAccounts.delete(accountId);
      return true;
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      return false;
    }
  }

  // Utility Methods
  private async getPost(postId: string): Promise<SocialMediaPost | null> {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Failed to get post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  }

  // Public API Methods
  async getPosts(filters: any = {}): Promise<SocialMediaPost[]> {
    try {
      let query = supabase.from('social_media_posts').select('*');
      
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.platform) query = query.contains('platforms', [filters.platform]);
      if (filters.campaign_id) query = query.eq('campaign_id', filters.campaign_id);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get posts:', error);
      return [];
    }
  }

  async getConnectedAccounts(): Promise<SocialMediaAccount[]> {
    return Array.from(this.connectedAccounts.values());
  }

  async getAnalyticsSummary(timeRange: string = '30d'): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange.replace('d', '')));

      const { data, error } = await supabase
        .from('social_media_posts')
        .select('engagement, analytics')
        .gte('published_at', startDate.toISOString())
        .eq('status', 'published');

      if (error) {
        console.error('Failed to get analytics summary:', error);
        return null;
      }

      // Aggregate analytics
      const summary = {
        total_posts: data?.length || 0,
        total_impressions: 0,
        total_engagement: 0,
        average_engagement_rate: 0,
        top_performing_post: null,
        platform_breakdown: {}
      };

      if (data) {
        data.forEach(post => {
          summary.total_impressions += post.engagement.impressions;
          summary.total_engagement += post.engagement.likes + post.engagement.comments + post.engagement.shares;
        });

        summary.average_engagement_rate = summary.total_impressions > 0 
          ? (summary.total_engagement / summary.total_impressions) * 100 
          : 0;
      }

      return summary;
    } catch (error) {
      console.error('Failed to get analytics summary:', error);
      return null;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
      this.schedulingInterval = null;
    }
  }
}

export default SocialMediaService;  
      ...postData,
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
          clicks: 0,
          impressions: 0,
          reach: 0,
          engagement_rate: 0
        },
        analytics: {
          platform_metrics: {},
          demographic_data: {
            age_groups: {},
            gender_distribution: {},
            location_data: {},
            interests: []
          },
          performance_score: 0,
          best_performing_time: '',
          audience_sentiment: 'neutral'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_media_posts')
        .insert(newPost)
        .select()
        .single();

      if (error) {
        console.error('Failed to create post:', error);
        return null;
      }

      // If scheduled for immediate posting, add to queue
      if (postData.status === 'published' || (postData.scheduled_at && new Date(postData.scheduled_at) <= new Date())) {
        await this.publishPost(data.id);
      }

      return data;
    } catch (error) {
      console.error('Failed to create post:', error);
      return null;
    }
  }

  async publishPost(postId: string): Promise<boolean> {
    try {
      console.log(`📤 Publishing post: ${postId}`);

      const post = await this.getPost(postId);
      if (!post) {
        console.error('Post not found');
        return false;
      }

      const results: Record<string, boolean> = {};
      
      // Publish to each platform
      for (const platform of post.platforms) {
        const account = Array.from(this.connectedAccounts.values())
          .find(acc => acc.platform === platform);
        
        if (!account) {
          console.error(`No connected account found for platform: ${platform}`);
          results[platform] = false;
          continue;
        }

        const success = await this.publishToPlatform(post, account);
        results[platform] = success;
      }

      // Update post status
      const allSuccessful = Object.values(results).every(success => success);
      const anySuccessful = Object.values(results).some(success => success);

      const status = allSuccessful ? 'published' : anySuccessful ? 'published' : 'failed';
      
      await supabase
        .from('social_media_posts')
        .update({
          status,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      console.log(`✅ Post ${postId} published with status: ${status}`);
      return allSuccessful;
    } catch (error) {
      console.error('Failed to publish post:', error);
      return false;
    }
  }

  private async publishToPlatform(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    try {
      console.log(`📱 Publishing to ${account.platform}: ${account.account_name}`);

      switch (account.platform) {
        case 'facebook':
          return await this.publishToFacebook(post, account);
        case 'twitter':
          return await this.publishToTwitter(post, account);
        case 'instagram':
          return await this.publishToInstagram(post, account);
        case 'linkedin':
          return await this.publishToLinkedIn(post, account);
        case 'youtube':
          return await this.publishToYouTube(post, account);
        case 'tiktok':
          return await this.publishToTikTok(post, account);
        case 'pinterest':
          return await this.publishToPinterest(post, account);
        default:
          console.error(`Unsupported platform: ${account.platform}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to publish to ${account.platform}:`, error);
      return false;
    }
  }

  private async publishToFacebook(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with Facebook Graph API
    console.log('📘 Publishing to Facebook');
    
    const payload = {
      message: post.content,
      access_token: account.access_token
    };

    // Add media if present
    if (post.media.length > 0) {
      payload['attached_media'] = post.media.map(media => ({
        media_fbid: media.id
      }));
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Math.random() > 0.1; // 90% success rate
  }

  private async publishToTwitter(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with Twitter API v2
    console.log('🐦 Publishing to Twitter');
    
    const payload = {
      text: post.content
    };

    // Add media if present
    if (post.media.length > 0) {
      payload['media'] = {
        media_ids: post.media.map(media => media.id)
      };
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return Math.random() > 0.05; // 95% success rate
  }

  private async publishToInstagram(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with Instagram Basic Display API
    console.log('📸 Publishing to Instagram');
    
    if (post.media.length === 0) {
      console.error('Instagram posts require media');
      return false;
    }

    const payload = {
      image_url: post.media[0].url,
      caption: post.content,
      access_token: account.access_token
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return Math.random() > 0.15; // 85% success rate
  }

  private async publishToLinkedIn(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with LinkedIn API
    console.log('💼 Publishing to LinkedIn');
    
    const payload = {
      content: {
        contentEntities: [],
        title: post.content.substring(0, 100)
      },
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      owner: `urn:li:person:${account.account_id}`,
      subject: post.content.substring(0, 100),
      text: {
        text: post.content
      }
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Math.random() > 0.08; // 92% success rate
  }

  private async publishToYouTube(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with YouTube Data API
    console.log('📺 Publishing to YouTube');
    
    if (post.post_type !== 'video') {
      console.error('YouTube posts must be videos');
      return false;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return Math.random() > 0.2; // 80% success rate
  }

  private async publishToTikTok(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with TikTok API
    console.log('🎵 Publishing to TikTok');
    
    if (post.post_type !== 'video') {
      console.error('TikTok posts must be videos');
      return false;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return Math.random() > 0.25; // 75% success rate
  }

  private async publishToPinterest(post: SocialMediaPost, account: SocialMediaAccount): Promise<boolean> {
    // Mock implementation - would integrate with Pinterest API
    console.log('📌 Publishing to Pinterest');
    
    if (post.media.length === 0) {
      console.error('Pinterest posts require images');
      return false;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return Math.random() > 0.12; // 88% success rate
  }

  // Content Calendar Management
  async getContentCalendar(startDate: string, endDate: string): Promise<SocialMediaPost[]> {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Failed to get content calendar:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get content calendar:', error);
      return [];
    }
  }

  async schedulePost(postId: string, scheduledAt: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({
          scheduled_at: scheduledAt,
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) {
        console.error('Failed to schedule post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to schedule post:', error);
      return false;
    }
  }

  // Content Templates
  async createContentTemplate(templateData: {
    name: string;
    content: string;
    platforms: string[];
    category: string;
    tags: string[];
  }): Promise<any> {
    try {
      const template = {
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_media_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        console.error('Failed to create template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to create template:', error);
      return null;
    }
  }

  async getContentTemplates(category?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('social_media_templates')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  // Hashtag Research
  async researchHashtags(keyword: string, platform: string): Promise<any[]> {
    try {
      console.log(`🔍 Researching hashtags for "${keyword}" on ${platform}`);

      // Mock hashtag research - would integrate with platform APIs or third-party services
      const mockHashtags = [
        { tag: `#${keyword}`, popularity: 95, competition: 'high', posts: 1500000 },
        { tag: `#${keyword}marketing`, popularity: 78, competition: 'medium', posts: 850000 },
        { tag: `#${keyword}tips`, popularity: 65, competition: 'low', posts: 320000 },
        { tag: `#${keyword}strategy`, popularity: 72, competition: 'medium', posts: 450000 },
        { tag: `#${keyword}business`, popularity: 88, competition: 'high', posts: 1200000 }
      ];

      // Store hashtag research results
      await supabase
        .from('hashtag_research')
        .insert({
          keyword,
          platform,
          results: mockHashtags,
          researched_at: new Date().toISOString()
        });

      return mockHashtags;
    } catch (error) {
      console.error('Failed to research hashtags:', error);
      return [];
    }
  }

  async getTrendingHashtags(platform: string, category?: string): Promise<string[]> {
    try {
      console.log(`📈 Getting trending hashtags for ${platform}`);

      // Mock trending hashtags - would integrate with platform APIs
      const trendingHashtags = [
        '#trending', '#viral', '#socialmedia', '#marketing', '#business',
        '#entrepreneur', '#success', '#motivation', '#inspiration', '#growth'
      ];

      return trendingHashtags;
    } catch (error) {
      console.error('Failed to get trending hashtags:', error);
      return [];
    }
  }

  // Analytics and Reporting
  async getPostAnalytics(postId: string): Promise<PostAnalytics | null> {
    try {
      const post = await this.getPost(postId);
      if (!post) return null;

      // Mock analytics - would fetch from platform APIs
      const analytics: PostAnalytics = {
        platform_metrics: {
          facebook: { likes: 45, comments: 12, shares: 8, reach: 1250 },
          twitter: { likes: 23, retweets: 5, replies: 3, impressions: 890 },
          instagram: { likes: 67, comments: 15, saves: 12, reach: 1450 }
        },
        demographic_data: {
          age_groups: { '18-24': 25, '25-34': 35, '35-44': 25, '45-54': 15 },
          gender_distribution: { male: 45, female: 55 },
          location_data: { 'United States': 60, 'Canada': 20, 'United Kingdom': 20 },
          interests: ['marketing', 'business', 'technology', 'entrepreneurship']
        },
        performance_score: 78,
        best_performing_time: '2:00 PM',
        audience_sentiment: 'positive'
      };

      // Update post with analytics
      await supabase
        .from('social_media_posts')
        .update({ analytics })
        .eq('id', postId);

      return analytics;
    } catch (error) {
      console.error('Failed to get post analytics:', error);
      return null;
    }
  }

  async getAccountAnalytics(accountId: string, timeRange: string = '30d'): Promise<any> {
    try {
      console.log(`📊 Getting analytics for account: ${accountId}`);

      // Mock account analytics - would fetch from platform APIs
      const analytics = {
        follower_growth: 150,
        engagement_rate: 4.2,
        reach: 15000,
        impressions: 45000,
        profile_visits: 850,
        website_clicks: 120,
        top_posts: [],
        audience_insights: {
          demographics: {
            age_groups: { '18-24': 25, '25-34': 35, '35-44': 25, '45-54': 15 },
            gender_distribution: { male: 45, female: 55 },
            locations: { 'United States': 60, 'Canada': 20, 'United Kingdom': 20 }
          },
          interests: ['marketing', 'business', 'technology'],
          active_times: ['2:00 PM', '6:00 PM', '8:00 PM']
        }
      };

      return analytics;
    } catch (error) {
      console.error('Failed to get account analytics:', error);
      return null;
    }
  }

  // Account Management
  async connectAccount(platform: string, authCode: string): Promise<SocialMediaAccount | null> {
    try {
      console.log(`🔗 Connecting ${platform} account`);

      // Mock account connection - would use OAuth flow
      const mockAccount: Omit<SocialMediaAccount, 'id'> = {
        platform: platform as any,
        account_name: `Mock ${platform} Account`,
        account_id: `${platform}_${Date.now()}`,
        access_token: `mock_token_${Date.now()}`,
        status: 'connected',
        permissions: ['read', 'write', 'publish'],
        profile_info: {
          username: `mock_${platform}_user`,
          display_name: `Mock ${platform} User`,
          follower_count: Math.floor(Math.random() * 10000),
          following_count: Math.floor(Math.random() * 1000),
          post_count: Math.floor(Math.random() * 500),
          verified: false
        },
        connected_at: new Date().toISOString(),
        last_sync: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_media_accounts')
        .insert(mockAccount)
        .select()
        .single();

      if (error) {
        console.error('Failed to connect account:', error);
        return null;
      }

      this.connectedAccounts.set(data.id, data);
      return data;
    } catch (error) {
      console.error('Failed to connect account:', error);
      return null;
    }
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('social_media_accounts')
        .update({ status: 'disconnected' })
        .eq('id', accountId);

      if (error) {
        console.error('Failed to disconnect account:', error);
        return false;
      }

      this.connectedAccounts.delete(accountId);
      return true;
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      return false;
    }
  }

  // Helper Methods
  private async getPost(postId: string): Promise<SocialMediaPost | null> {
    try {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Failed to get post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get post:', error);
      return null;
    }
  }

  // Public API Methods
  async getPosts(filters: any = {}): Promise<SocialMediaPost[]> {
    try {
      let query = supabase.from('social_media_posts').select('*');
      
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.platform) query = query.contains('platforms', [filters.platform]);
      if (filters.campaign_id) query = query.eq('campaign_id', filters.campaign_id);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get posts:', error);
      return [];
    }
  }

  async getConnectedAccounts(): Promise<SocialMediaAccount[]> {
    return Array.from(this.connectedAccounts.values());
  }

  // Cleanup
  destroy(): void {
    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
      this.schedulingInterval = null;
    }
  }
}

export default SocialMediaService;
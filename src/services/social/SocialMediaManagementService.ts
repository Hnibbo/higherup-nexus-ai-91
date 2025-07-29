import { supabase } from '@/integrations/supabase/client';

export interface SocialMediaPost {
  id: string;
  content: string;
  mediaUrls?: string[];
  platforms: string[];
  scheduledTime: Date;
  publishedTime?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  analytics?: SocialMediaAnalytics;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  campaign?: string;
  locationTargeting?: string[];
  demographicTargeting?: {
    ageRange?: string[];
    gender?: string[];
    interests?: string[];
  };
  boostBudget?: number;
}

export interface SocialMediaAnalytics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
  likes: number;
  comments: number;
  conversionRate?: number;
  roi?: number;
  demographicBreakdown?: Record<string, number>;
  geographicBreakdown?: Record<string, number>;
}

export interface SocialMediaAccount {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  status: 'active' | 'expired' | 'revoked' | 'error';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  profileImageUrl?: string;
  followers?: number;
  following?: number;
  lastSyncedAt?: Date;
}

export interface ContentLibraryItem {
  id: string;
  type: 'text' | 'image' | 'video' | 'link';
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  usageCount: number;
  performance?: {
    averageEngagement: number;
    topPlatform: string;
    bestTimeToPost: string;
  };
}

export interface SocialMediaCalendar {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  posts: SocialMediaPost[];
  collaborators?: string[];
  color?: string;
}

export interface SocialMediaCampaign {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'paused';
  budget?: number;
  goals: {
    reach?: number;
    engagement?: number;
    clicks?: number;
    conversions?: number;
  };
  targetAudience?: {
    demographics?: Record<string, any>;
    interests?: string[];
    locations?: string[];
  };
  posts: SocialMediaPost[];
  performance?: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
    roi: number;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SocialMediaManagementService {
  async connectAccount(platform: string, authCode: string, userId: string): Promise<SocialMediaAccount> {
    // Get access token from platform OAuth
    const tokenData = await this.getAccessToken(platform, authCode);
    
    // Get account details from platform
    const accountDetails = await this.getAccountDetails(platform, tokenData.accessToken);
    
    const account: SocialMediaAccount = {
      id: crypto.randomUUID(),
      platform,
      username: accountDetails.username,
      profileUrl: accountDetails.profileUrl,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiry: tokenData.expiresAt ? new Date(tokenData.expiresAt) : undefined,
      status: 'active',
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: accountDetails.profileImageUrl,
      followers: accountDetails.followers,
      following: accountDetails.following,
      lastSyncedAt: new Date()
    };
    
    // Store account in database
    const { error } = await supabase
      .from('social_media_accounts')
      .insert(account);
      
    if (error) throw error;
    
    return account;
  }
  
  async getConnectedAccounts(userId: string): Promise<SocialMediaAccount[]> {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('userId', userId);
      
    if (error) throw error;
    return data || [];
  }
  
  async createPost(post: Omit<SocialMediaPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<SocialMediaPost> {
    const newPost: SocialMediaPost = {
      id: crypto.randomUUID(),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...post
    };
    
    const { error } = await supabase
      .from('social_media_posts')
      .insert(newPost);
      
    if (error) throw error;
    
    return newPost;
  }
  
  async schedulePost(postId: string, scheduledTime: Date): Promise<SocialMediaPost> {
    const { data, error } = await supabase
      .from('social_media_posts')
      .update({
        scheduledTime,
        status: 'scheduled',
        updatedAt: new Date()
      })
      .eq('id', postId)
      .select('*')
      .single();
      
    if (error) throw error;
    
    // Schedule the post for publishing
    await this.schedulePostPublishing(data);
    
    return data;
  }
  
  async publishPost(postId: string): Promise<SocialMediaPost> {
    // Get post data
    const { data: post, error: fetchError } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', postId)
      .single();
      
    if (fetchError) throw fetchError;
    if (!post) throw new Error('Post not found');
    
    // Publish to each platform
    const publishResults = await Promise.allSettled(
      post.platforms.map(platform => this.publishToSocialPlatform(platform, post))
    );
    
    // Check if all platforms were successful
    const allSuccessful = publishResults.every(result => result.status === 'fulfilled');
    
    // Update post status
    const { data, error } = await supabase
      .from('social_media_posts')
      .update({
        status: allSuccessful ? 'published' : 'failed',
        publishedTime: allSuccessful ? new Date() : undefined,
        updatedAt: new Date()
      })
      .eq('id', postId)
      .select('*')
      .single();
      
    if (error) throw error;
    
    return data;
  }
  
  async getAnalytics(postId: string): Promise<SocialMediaAnalytics> {
    // Get post data
    const { data: post, error: fetchError } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', postId)
      .single();
      
    if (fetchError) throw fetchError;
    if (!post) throw new Error('Post not found');
    
    // Fetch analytics from each platform
    const analyticsPromises = post.platforms.map(platform => 
      this.fetchAnalyticsFromPlatform(platform, post)
    );
    
    const platformAnalytics = await Promise.all(analyticsPromises);
    
    // Combine analytics from all platforms
    const combinedAnalytics: SocialMediaAnalytics = {
      impressions: 0,
      reach: 0,
      engagement: 0,
      clicks: 0,
      shares: 0,
      likes: 0,
      comments: 0,
      demographicBreakdown: {},
      geographicBreakdown: {}
    };
    
    platformAnalytics.forEach(analytics => {
      combinedAnalytics.impressions += analytics.impressions;
      combinedAnalytics.reach += analytics.reach;
      combinedAnalytics.engagement += analytics.engagement;
      combinedAnalytics.clicks += analytics.clicks;
      combinedAnalytics.shares += analytics.shares;
      combinedAnalytics.likes += analytics.likes;
      combinedAnalytics.comments += analytics.comments;
      
      // Combine demographic data
      if (analytics.demographicBreakdown) {
        Object.entries(analytics.demographicBreakdown).forEach(([key, value]) => {
          combinedAnalytics.demographicBreakdown![key] = (combinedAnalytics.demographicBreakdown![key] || 0) + value;
        });
      }
      
      // Combine geographic data
      if (analytics.geographicBreakdown) {
        Object.entries(analytics.geographicBreakdown).forEach(([key, value]) => {
          combinedAnalytics.geographicBreakdown![key] = (combinedAnalytics.geographicBreakdown![key] || 0) + value;
        });
      }
    });
    
    // Calculate conversion rate and ROI if available
    if (post.boostBudget && post.boostBudget > 0) {
      // Assuming we have conversion data from another service
      const conversions = await this.getConversionsFromPost(postId);
      const conversionValue = await this.getConversionValue(postId);
      
      combinedAnalytics.conversionRate = conversions / combinedAnalytics.clicks;
      combinedAnalytics.roi = (conversionValue - post.boostBudget) / post.boostBudget * 100;
    }
    
    // Update analytics in the database
    await supabase
      .from('social_media_posts')
      .update({
        analytics: combinedAnalytics,
        updatedAt: new Date()
      })
      .eq('id', postId);
    
    return combinedAnalytics;
  }
  
  async createContentLibraryItem(item: Omit<ContentLibraryItem, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<ContentLibraryItem> {
    const newItem: ContentLibraryItem = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      ...item
    };
    
    const { error } = await supabase
      .from('content_library')
      .insert(newItem);
      
    if (error) throw error;
    
    return newItem;
  }
  
  async getContentLibrary(userId: string, filters?: { type?: string, tags?: string[], category?: string }): Promise<ContentLibraryItem[]> {
    let query = supabase
      .from('content_library')
      .select('*')
      .eq('userId', userId);
      
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
  
  async createCalendar(calendar: Omit<SocialMediaCalendar, 'id' | 'createdAt' | 'updatedAt' | 'posts'>): Promise<SocialMediaCalendar> {
    const newCalendar: SocialMediaCalendar = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      posts: [],
      ...calendar
    };
    
    const { error } = await supabase
      .from('social_media_calendars')
      .insert(newCalendar);
      
    if (error) throw error;
    
    return newCalendar;
  }
  
  async getCalendar(calendarId: string): Promise<SocialMediaCalendar> {
    const { data, error } = await supabase
      .from('social_media_calendars')
      .select('*, posts:social_media_posts(*)')
      .eq('id', calendarId)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  async addPostToCalendar(calendarId: string, postId: string): Promise<void> {
    // Get the calendar
    const { data: calendar, error: calendarError } = await supabase
      .from('social_media_calendars')
      .select('posts')
      .eq('id', calendarId)
      .single();
      
    if (calendarError) throw calendarError;
    
    // Get the post
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', postId)
      .single();
      
    if (postError) throw postError;
    
    // Update the calendar with the new post
    const { error } = await supabase
      .from('social_media_calendars')
      .update({
        posts: [...calendar.posts, post],
        updatedAt: new Date()
      })
      .eq('id', calendarId);
      
    if (error) throw error;
  }
  
  async createCampaign(campaign: Omit<SocialMediaCampaign, 'id' | 'createdAt' | 'updatedAt' | 'posts' | 'status'>): Promise<SocialMediaCampaign> {
    const newCampaign: SocialMediaCampaign = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      posts: [],
      status: 'draft',
      ...campaign
    };
    
    const { error } = await supabase
      .from('social_media_campaigns')
      .insert(newCampaign);
      
    if (error) throw error;
    
    return newCampaign;
  }
  
  async getCampaign(campaignId: string): Promise<SocialMediaCampaign> {
    const { data, error } = await supabase
      .from('social_media_campaigns')
      .select('*, posts:social_media_posts(*)')
      .eq('id', campaignId)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  async addPostToCampaign(campaignId: string, postId: string): Promise<void> {
    // Get the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('social_media_campaigns')
      .select('posts')
      .eq('id', campaignId)
      .single();
      
    if (campaignError) throw campaignError;
    
    // Get the post
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', postId)
      .single();
      
    if (postError) throw postError;
    
    // Update the post with campaign info
    await supabase
      .from('social_media_posts')
      .update({
        campaign: campaignId,
        updatedAt: new Date()
      })
      .eq('id', postId);
    
    // Update the campaign with the new post
    const { error } = await supabase
      .from('social_media_campaigns')
      .update({
        posts: [...campaign.posts, post],
        updatedAt: new Date()
      })
      .eq('id', campaignId);
      
    if (error) throw error;
  }
  
  async getCampaignPerformance(campaignId: string): Promise<SocialMediaCampaign['performance']> {
    // Get the campaign
    const { data: campaign, error } = await supabase
      .from('social_media_campaigns')
      .select('*, posts:social_media_posts(*)')
      .eq('id', campaignId)
      .single();
      
    if (error) throw error;
    
    // Calculate total reach, engagement, clicks
    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    
    for (const post of campaign.posts) {
      if (post.analytics) {
        totalReach += post.analytics.reach || 0;
        totalEngagement += post.analytics.engagement || 0;
        totalClicks += post.analytics.clicks || 0;
      }
    }
    
    // Get conversion data
    const conversions = await this.getCampaignConversions(campaignId);
    const conversionValue = await this.getCampaignConversionValue(campaignId);
    
    // Calculate ROI
    const campaignBudget = campaign.budget || 0;
    const roi = campaignBudget > 0 ? (conversionValue - campaignBudget) / campaignBudget * 100 : 0;
    
    const performance = {
      reach: totalReach,
      engagement: totalEngagement,
      clicks: totalClicks,
      conversions,
      roi
    };
    
    // Update campaign performance
    await supabase
      .from('social_media_campaigns')
      .update({
        performance,
        updatedAt: new Date()
      })
      .eq('id', campaignId);
    
    return performance;
  }
  
  async getBestTimeToPost(platform: string, userId: string): Promise<{
    dayOfWeek: string;
    timeOfDay: string;
    engagement: number;
  }[]> {
    // Get user's post history with analytics
    const { data: posts, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'published')
      .not('analytics', 'is', null);
      
    if (error) throw error;
    
    // Filter posts for the specific platform
    const platformPosts = posts.filter(post => 
      post.platforms.includes(platform) && post.publishedTime && post.analytics
    );
    
    // Group by day of week and time of day
    const engagementByTime: Record<string, Record<string, { count: number, total: number }>> = {};
    
    platformPosts.forEach(post => {
      if (!post.publishedTime || !post.analytics) return;
      
      const date = new Date(post.publishedTime);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const timeOfDay = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!engagementByTime[dayOfWeek]) {
        engagementByTime[dayOfWeek] = {};
      }
      
      if (!engagementByTime[dayOfWeek][timeOfDay]) {
        engagementByTime[dayOfWeek][timeOfDay] = { count: 0, total: 0 };
      }
      
      engagementByTime[dayOfWeek][timeOfDay].count += 1;
      engagementByTime[dayOfWeek][timeOfDay].total += post.analytics.engagement;
    });
    
    // Calculate average engagement and sort
    const bestTimes: Array<{
      dayOfWeek: string;
      timeOfDay: string;
      engagement: number;
    }> = [];
    
    Object.entries(engagementByTime).forEach(([dayOfWeek, times]) => {
      Object.entries(times).forEach(([timeOfDay, data]) => {
        bestTimes.push({
          dayOfWeek,
          timeOfDay,
          engagement: data.total / data.count
        });
      });
    });
    
    // Sort by engagement (highest first)
    bestTimes.sort((a, b) => b.engagement - a.engagement);
    
    return bestTimes.slice(0, 5); // Return top 5 times
  }
  
  async generateContentSuggestions(userId: string, topic?: string): Promise<Array<{
    content: string;
    type: 'text' | 'image' | 'video';
    platforms: string[];
    bestTimeToPost?: {
      dayOfWeek: string;
      timeOfDay: string;
    };
  }>> {
    // Get user's best performing content
    const { data: posts, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'published')
      .not('analytics', 'is', null)
      .order('analytics->engagement', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    
    // Analyze top performing content
    const contentPatterns = this.analyzeContentPatterns(posts);
    
    // Generate suggestions based on patterns and topic
    const suggestions = await this.generateSuggestions(contentPatterns, topic);
    
    // Get best time to post for each platform
    const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
    const bestTimes: Record<string, { dayOfWeek: string, timeOfDay: string }> = {};
    
    for (const platform of platforms) {
      const times = await this.getBestTimeToPost(platform, userId);
      if (times.length > 0) {
        bestTimes[platform] = {
          dayOfWeek: times[0].dayOfWeek,
          timeOfDay: times[0].timeOfDay
        };
      }
    }
    
    // Add best time to post to each suggestion
    return suggestions.map(suggestion => {
      const platform = suggestion.platforms[0];
      return {
        ...suggestion,
        bestTimeToPost: bestTimes[platform]
      };
    });
  }
  
  // Private helper methods
  private async getAccessToken(platform: string, authCode: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Implementation would vary by platform
    switch (platform) {
      case 'facebook':
        return this.getFacebookAccessToken(authCode);
      case 'twitter':
        return this.getTwitterAccessToken(authCode);
      case 'instagram':
        return this.getInstagramAccessToken(authCode);
      case 'linkedin':
        return this.getLinkedInAccessToken(authCode);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  private async getFacebookAccessToken(authCode: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Mock implementation
    return {
      accessToken: 'facebook_mock_token',
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000 // 60 days
    };
  }
  
  private async getTwitterAccessToken(authCode: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Mock implementation
    return {
      accessToken: 'twitter_mock_token'
    };
  }
  
  private async getInstagramAccessToken(authCode: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Mock implementation
    return {
      accessToken: 'instagram_mock_token',
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000 // 60 days
    };
  }
  
  private async getLinkedInAccessToken(authCode: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
  }> {
    // Mock implementation
    return {
      accessToken: 'linkedin_mock_token',
      refreshToken: 'linkedin_refresh_token',
      expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000 // 60 days
    };
  }
  
  private async getAccountDetails(platform: string, accessToken: string): Promise<{
    username: string;
    profileUrl: string;
    profileImageUrl?: string;
    followers?: number;
    following?: number;
  }> {
    // Implementation would vary by platform
    // Mock implementation
    return {
      username: `user_${platform}`,
      profileUrl: `https://${platform}.com/user_${platform}`,
      profileImageUrl: `https://${platform}.com/user_${platform}/profile.jpg`,
      followers: Math.floor(Math.random() * 10000),
      following: Math.floor(Math.random() * 1000)
    };
  }
  
  private async schedulePostPublishing(post: SocialMediaPost): Promise<void> {
    // In a real implementation, this would use a job queue like Bull
    // For now, we'll just log the scheduled time
    console.log(`Post ${post.id} scheduled for ${post.scheduledTime}`);
    
    // In a real implementation, we would add a job to the queue
    // that would be processed at the scheduled time
  }
  
  private async publishToSocialPlatform(platform: string, post: SocialMediaPost): Promise<boolean> {
    // Implementation would vary by platform
    // Mock implementation
    console.log(`Publishing to ${platform}: ${post.content}`);
    
    // Simulate API call to social platform
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return success (95% success rate for simulation)
    return Math.random() > 0.05;
  }
  
  private async fetchAnalyticsFromPlatform(platform: string, post: SocialMediaPost): Promise<SocialMediaAnalytics> {
    // Implementation would vary by platform
    // Mock implementation
    return {
      impressions: Math.floor(Math.random() * 5000),
      reach: Math.floor(Math.random() * 3000),
      engagement: Math.floor(Math.random() * 500),
      clicks: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 50),
      likes: Math.floor(Math.random() * 300),
      comments: Math.floor(Math.random() * 30),
      demographicBreakdown: {
        '18-24': Math.floor(Math.random() * 100),
        '25-34': Math.floor(Math.random() * 200),
        '35-44': Math.floor(Math.random() * 150),
        '45-54': Math.floor(Math.random() * 100),
        '55+': Math.floor(Math.random() * 50)
      },
      geographicBreakdown: {
        'US': Math.floor(Math.random() * 300),
        'UK': Math.floor(Math.random() * 100),
        'Canada': Math.floor(Math.random() * 80),
        'Australia': Math.floor(Math.random() * 50),
        'Other': Math.floor(Math.random() * 70)
      }
    };
  }
  
  private async getConversionsFromPost(postId: string): Promise<number> {
    // In a real implementation, this would fetch data from an analytics service
    // Mock implementation
    return Math.floor(Math.random() * 20);
  }
  
  private async getConversionValue(postId: string): Promise<number> {
    // In a real implementation, this would fetch data from an analytics service
    // Mock implementation
    return Math.floor(Math.random() * 2000) + 500;
  }
  
  private async getCampaignConversions(campaignId: string): Promise<number> {
    // In a real implementation, this would fetch data from an analytics service
    // Mock implementation
    return Math.floor(Math.random() * 100) + 10;
  }
  
  private async getCampaignConversionValue(campaignId: string): Promise<number> {
    // In a real implementation, this would fetch data from an analytics service
    // Mock implementation
    return Math.floor(Math.random() * 10000) + 2000;
  }
  
  private analyzeContentPatterns(posts: SocialMediaPost[]): any {
    // In a real implementation, this would use NLP to analyze content patterns
    // Mock implementation
    return {
      averageLength: posts.reduce((sum, post) => sum + post.content.length, 0) / posts.length,
      commonWords: ['product', 'service', 'business', 'customer', 'value'],
      topEmojis: ['🚀', '✅', '💯', '🔥', '👍'],
      topHashtags: ['#business', '#marketing', '#success', '#entrepreneur', '#growth']
    };
  }
  
  private async generateSuggestions(contentPatterns: any, topic?: string): Promise<Array<{
    content: string;
    type: 'text' | 'image' | 'video';
    platforms: string[];
  }>> {
    // In a real implementation, this would use AI to generate content suggestions
    // Mock implementation
    const suggestions = [
      {
        content: `Excited to announce our latest ${topic || 'product'} update! 🚀 Check out the new features that will transform your business. #innovation #growth`,
        type: 'text' as const,
        platforms: ['twitter', 'linkedin']
      },
      {
        content: `How our ${topic || 'solution'} helps businesses increase productivity by 35%. Swipe to learn more! 📈 #productivity #business`,
        type: 'image' as const,
        platforms: ['instagram', 'facebook']
      },
      {
        content: `Watch our CEO explain how ${topic || 'technology'} is changing the industry landscape and what it means for your business. 🎥 #thoughtleadership`,
        type: 'video' as const,
        platforms: ['linkedin', 'youtube']
      },
      {
        content: `"The best investment we made this year" - hear what our customers are saying about our ${topic || 'service'}. 💯 #testimonial #success`,
        type: 'text' as const,
        platforms: ['twitter', 'facebook']
      },
      {
        content: `5 ways ${topic || 'businesses'} can stay ahead of the competition in 2024. Thread 👇 #strategy #competitiveadvantage`,
        type: 'text' as const,
        platforms: ['twitter']
      }
    ];
    
    return suggestions;
  }
}

export const socialMediaManagementService = new SocialMediaManagementService();
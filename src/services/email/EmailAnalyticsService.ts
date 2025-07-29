import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

export interface EmailAnalytics {
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  open_count: number;
  unique_open_count: number;
  click_count: number;
  unique_click_count: number;
  bounce_count: number;
  complaint_count: number;
  unsubscribe_count: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  revenue_generated: number;
  conversion_count: number;
  conversion_rate: number;
}

export interface EmailPerformanceMetrics {
  total_campaigns: number;
  total_emails_sent: number;
  average_open_rate: number;
  average_click_rate: number;
  average_conversion_rate: number;
  total_revenue: number;
  top_performing_campaigns: Array<{
    campaign_id: string;
    campaign_name: string;
    open_rate: number;
    click_rate: number;
    revenue: number;
  }>;
  engagement_trends: Array<{
    date: string;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
}

export interface EmailSegmentAnalytics {
  segment_id: string;
  segment_name: string;
  total_contacts: number;
  active_contacts: number;
  average_open_rate: number;
  average_click_rate: number;
  total_revenue: number;
  engagement_score: number;
  best_send_time: string;
  preferred_content_type: string;
}

export interface EmailABTestResult {
  test_id: string;
  campaign_id: string;
  variant_a: {
    name: string;
    sent_count: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  };
  variant_b: {
    name: string;
    sent_count: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  };
  winner: 'A' | 'B' | 'tie';
  confidence_level: number;
  statistical_significance: boolean;
}

export interface EmailHeatmapData {
  campaign_id: string;
  click_data: Array<{
    element_id: string;
    element_type: 'link' | 'button' | 'image';
    click_count: number;
    unique_clicks: number;
    position: { x: number; y: number };
  }>;
  scroll_data: Array<{
    depth_percentage: number;
    user_count: number;
  }>;
  time_spent_data: Array<{
    section: string;
    average_time: number;
  }>;
}

export class EmailAnalyticsService {
  private static instance: EmailAnalyticsService;

  private constructor() {}

  public static getInstance(): EmailAnalyticsService {
    if (!EmailAnalyticsService.instance) {
      EmailAnalyticsService.instance = new EmailAnalyticsService();
    }
    return EmailAnalyticsService.instance;
  }

  // Campaign Analytics
  async getCampaignAnalytics(campaignId: string): Promise<EmailAnalytics> {
    try {
      console.log(`📊 Getting analytics for campaign: ${campaignId}`);

      // Get campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Get recipient data
      const { data: recipients, error: recipientsError } = await supabase
        .from('email_recipients')
        .select('*')
        .eq('campaign_id', campaignId);

      if (recipientsError) throw recipientsError;

      // Get conversion data
      const { data: conversions, error: conversionsError } = await supabase
        .from('email_conversions')
        .select('*')
        .eq('campaign_id', campaignId);

      if (conversionsError && conversionsError.code !== 'PGRST116') {
        throw conversionsError;
      }

      // Calculate metrics
      const sentCount = recipients?.length || 0;
      const deliveredCount = recipients?.filter(r => r.status !== 'bounced').length || 0;
      const openCount = recipients?.reduce((sum, r) => sum + r.open_count, 0) || 0;
      const uniqueOpenCount = recipients?.filter(r => r.open_count > 0).length || 0;
      const clickCount = recipients?.reduce((sum, r) => sum + r.click_count, 0) || 0;
      const uniqueClickCount = recipients?.filter(r => r.click_count > 0).length || 0;
      const bounceCount = recipients?.filter(r => r.status === 'bounced').length || 0;
      const complaintCount = recipients?.filter(r => r.status === 'complained').length || 0;
      const unsubscribeCount = recipients?.filter(r => r.status === 'unsubscribed').length || 0;

      // Calculate rates
      const openRate = sentCount > 0 ? (uniqueOpenCount / sentCount) * 100 : 0;
      const clickRate = sentCount > 0 ? (uniqueClickCount / sentCount) * 100 : 0;
      const clickToOpenRate = uniqueOpenCount > 0 ? (uniqueClickCount / uniqueOpenCount) * 100 : 0;
      const bounceRate = sentCount > 0 ? (bounceCount / sentCount) * 100 : 0;
      const unsubscribeRate = deliveredCount > 0 ? (unsubscribeCount / deliveredCount) * 100 : 0;

      // Calculate conversion metrics
      const conversionCount = conversions?.length || 0;
      const conversionRate = sentCount > 0 ? (conversionCount / sentCount) * 100 : 0;
      const revenueGenerated = conversions?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;

      return {
        campaign_id: campaignId,
        sent_count: sentCount,
        delivered_count: deliveredCount,
        open_count: openCount,
        unique_open_count: uniqueOpenCount,
        click_count: clickCount,
        unique_click_count: uniqueClickCount,
        bounce_count: bounceCount,
        complaint_count: complaintCount,
        unsubscribe_count: unsubscribeCount,
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        click_to_open_rate: Math.round(clickToOpenRate * 100) / 100,
        bounce_rate: Math.round(bounceRate * 100) / 100,
        unsubscribe_rate: Math.round(unsubscribeRate * 100) / 100,
        revenue_generated: revenueGenerated,
        conversion_count: conversionCount,
        conversion_rate: Math.round(conversionRate * 100) / 100
      };

    } catch (error) {
      console.error('❌ Failed to get campaign analytics:', error);
      throw error;
    }
  }

  async getOverallPerformanceMetrics(userId: string, dateRange?: { from: Date; to: Date }): Promise<EmailPerformanceMetrics> {
    try {
      console.log(`📈 Getting overall email performance metrics for user: ${userId}`);

      // Build date filter
      let dateFilter = '';
      if (dateRange) {
        dateFilter = `AND created_at >= '${dateRange.from.toISOString()}' AND created_at <= '${dateRange.to.toISOString()}'`;
      }

      // Get campaigns
      let campaignQuery = supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', userId);

      if (dateRange) {
        campaignQuery = campaignQuery
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      const { data: campaigns, error: campaignsError } = await campaignQuery;
      if (campaignsError) throw campaignsError;

      if (!campaigns || campaigns.length === 0) {
        return {
          total_campaigns: 0,
          total_emails_sent: 0,
          average_open_rate: 0,
          average_click_rate: 0,
          average_conversion_rate: 0,
          total_revenue: 0,
          top_performing_campaigns: [],
          engagement_trends: []
        };
      }

      // Get analytics for all campaigns
      const campaignAnalytics = await Promise.all(
        campaigns.map(campaign => this.getCampaignAnalytics(campaign.id))
      );

      // Calculate overall metrics
      const totalCampaigns = campaigns.length;
      const totalEmailsSent = campaignAnalytics.reduce((sum, a) => sum + a.sent_count, 0);
      const averageOpenRate = campaignAnalytics.reduce((sum, a) => sum + a.open_rate, 0) / totalCampaigns;
      const averageClickRate = campaignAnalytics.reduce((sum, a) => sum + a.click_rate, 0) / totalCampaigns;
      const averageConversionRate = campaignAnalytics.reduce((sum, a) => sum + a.conversion_rate, 0) / totalCampaigns;
      const totalRevenue = campaignAnalytics.reduce((sum, a) => sum + a.revenue_generated, 0);

      // Get top performing campaigns
      const topPerformingCampaigns = campaigns
        .map((campaign, index) => ({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          open_rate: campaignAnalytics[index].open_rate,
          click_rate: campaignAnalytics[index].click_rate,
          revenue: campaignAnalytics[index].revenue_generated
        }))
        .sort((a, b) => b.open_rate - a.open_rate)
        .slice(0, 5);

      // Generate engagement trends (mock data for now)
      const engagementTrends = this.generateEngagementTrends(dateRange);

      return {
        total_campaigns: totalCampaigns,
        total_emails_sent: totalEmailsSent,
        average_open_rate: Math.round(averageOpenRate * 100) / 100,
        average_click_rate: Math.round(averageClickRate * 100) / 100,
        average_conversion_rate: Math.round(averageConversionRate * 100) / 100,
        total_revenue: totalRevenue,
        top_performing_campaigns: topPerformingCampaigns,
        engagement_trends: engagementTrends
      };

    } catch (error) {
      console.error('❌ Failed to get overall performance metrics:', error);
      throw error;
    }
  }

  private generateEngagementTrends(dateRange?: { from: Date; to: Date }): Array<{ date: string; opens: number; clicks: number; conversions: number }> {
    const trends = [];
    const startDate = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dateRange?.to || new Date();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      trends.push({
        date: d.toISOString().split('T')[0],
        opens: Math.floor(Math.random() * 100) + 50,
        clicks: Math.floor(Math.random() * 30) + 10,
        conversions: Math.floor(Math.random() * 10) + 2
      });
    }

    return trends;
  }

  // Segment Analytics
  async getSegmentAnalytics(userId: string): Promise<EmailSegmentAnalytics[]> {
    try {
      console.log(`📊 Getting segment analytics for user: ${userId}`);

      // Get user segments
      const { data: segments, error: segmentsError } = await supabase
        .from('contact_segments')
        .select('*')
        .eq('user_id', userId);

      if (segmentsError) throw segmentsError;

      const segmentAnalytics: EmailSegmentAnalytics[] = [];

      for (const segment of segments || []) {
        // Get segment member count
        const { count: totalContacts, error: countError } = await supabase
          .from('contact_segment_members')
          .select('contact_id', { count: 'exact', head: true })
          .eq('segment_id', segment.id);

        if (countError) continue;

        // Get campaigns sent to this segment
        const { data: campaigns, error: campaignsError } = await supabase
          .from('email_campaigns')
          .select('*')
          .eq('segment_id', segment.id);

        if (campaignsError) continue;

        // Calculate segment metrics
        let totalOpenRate = 0;
        let totalClickRate = 0;
        let totalRevenue = 0;
        let campaignCount = 0;

        for (const campaign of campaigns || []) {
          try {
            const analytics = await this.getCampaignAnalytics(campaign.id);
            totalOpenRate += analytics.open_rate;
            totalClickRate += analytics.click_rate;
            totalRevenue += analytics.revenue_generated;
            campaignCount++;
          } catch (error) {
            console.warn(`Failed to get analytics for campaign ${campaign.id}:`, error);
          }
        }

        const averageOpenRate = campaignCount > 0 ? totalOpenRate / campaignCount : 0;
        const averageClickRate = campaignCount > 0 ? totalClickRate / campaignCount : 0;
        const engagementScore = (averageOpenRate + averageClickRate) / 2;

        segmentAnalytics.push({
          segment_id: segment.id,
          segment_name: segment.name,
          total_contacts: totalContacts || 0,
          active_contacts: Math.floor((totalContacts || 0) * 0.8), // Mock active contacts
          average_open_rate: Math.round(averageOpenRate * 100) / 100,
          average_click_rate: Math.round(averageClickRate * 100) / 100,
          total_revenue: totalRevenue,
          engagement_score: Math.round(engagementScore * 100) / 100,
          best_send_time: this.calculateBestSendTime(segment.id),
          preferred_content_type: this.calculatePreferredContentType(segment.id)
        });
      }

      return segmentAnalytics;

    } catch (error) {
      console.error('❌ Failed to get segment analytics:', error);
      throw error;
    }
  }

  private calculateBestSendTime(segmentId: string): string {
    // Mock implementation - in reality would analyze historical data
    const hours = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '7:00 PM'];
    return hours[Math.floor(Math.random() * hours.length)];
  }

  private calculatePreferredContentType(segmentId: string): string {
    // Mock implementation - in reality would analyze engagement by content type
    const types = ['Educational', 'Promotional', 'Newsletter', 'Product Updates'];
    return types[Math.floor(Math.random() * types.length)];
  }

  // A/B Testing Analytics
  async getABTestResults(testId: string): Promise<EmailABTestResult> {
    try {
      console.log(`🧪 Getting A/B test results for test: ${testId}`);

      // Get test data
      const { data: test, error: testError } = await supabase
        .from('email_ab_tests')
        .select('*')
        .eq('id', testId)
        .single();

      if (testError) throw testError;

      // Get analytics for both variants
      const variantAAnalytics = await this.getCampaignAnalytics(test.variant_a_campaign_id);
      const variantBAnalytics = await this.getCampaignAnalytics(test.variant_b_campaign_id);

      // Determine winner
      const aScore = variantAAnalytics.conversion_rate || variantAAnalytics.click_rate;
      const bScore = variantBAnalytics.conversion_rate || variantBAnalytics.click_rate;
      
      let winner: 'A' | 'B' | 'tie' = 'tie';
      if (aScore > bScore * 1.05) winner = 'A'; // 5% threshold
      else if (bScore > aScore * 1.05) winner = 'B';

      // Calculate statistical significance (simplified)
      const confidenceLevel = Math.min(95, Math.abs(aScore - bScore) * 10);
      const statisticalSignificance = confidenceLevel >= 90;

      return {
        test_id: testId,
        campaign_id: test.campaign_id,
        variant_a: {
          name: test.variant_a_name || 'Variant A',
          sent_count: variantAAnalytics.sent_count,
          open_rate: variantAAnalytics.open_rate,
          click_rate: variantAAnalytics.click_rate,
          conversion_rate: variantAAnalytics.conversion_rate
        },
        variant_b: {
          name: test.variant_b_name || 'Variant B',
          sent_count: variantBAnalytics.sent_count,
          open_rate: variantBAnalytics.open_rate,
          click_rate: variantBAnalytics.click_rate,
          conversion_rate: variantBAnalytics.conversion_rate
        },
        winner,
        confidence_level: Math.round(confidenceLevel * 100) / 100,
        statistical_significance: statisticalSignificance
      };

    } catch (error) {
      console.error('❌ Failed to get A/B test results:', error);
      throw error;
    }
  }

  // Email Heatmap Data
  async getEmailHeatmapData(campaignId: string): Promise<EmailHeatmapData> {
    try {
      console.log(`🔥 Getting heatmap data for campaign: ${campaignId}`);

      // Get click tracking data
      const { data: clickData, error: clickError } = await supabase
        .from('email_link_clicks')
        .select('*')
        .eq('campaign_id', campaignId);

      if (clickError && clickError.code !== 'PGRST116') {
        throw clickError;
      }

      // Process click data
      const clickMap = new Map();
      (clickData || []).forEach(click => {
        const key = click.url;
        if (!clickMap.has(key)) {
          clickMap.set(key, {
            element_id: `link_${Math.random().toString(36).substr(2, 9)}`,
            element_type: 'link',
            click_count: 0,
            unique_clicks: new Set(),
            position: { x: Math.random() * 100, y: Math.random() * 100 }
          });
        }
        const data = clickMap.get(key);
        data.click_count++;
        data.unique_clicks.add(click.contact_id);
      });

      const processedClickData = Array.from(clickMap.values()).map(data => ({
        ...data,
        unique_clicks: data.unique_clicks.size
      }));

      // Generate mock scroll and time data
      const scrollData = Array.from({ length: 10 }, (_, i) => ({
        depth_percentage: (i + 1) * 10,
        user_count: Math.floor(Math.random() * 50) + 10
      }));

      const timeSpentData = [
        { section: 'Header', average_time: Math.random() * 10 + 5 },
        { section: 'Content', average_time: Math.random() * 30 + 15 },
        { section: 'CTA', average_time: Math.random() * 5 + 2 },
        { section: 'Footer', average_time: Math.random() * 3 + 1 }
      ];

      return {
        campaign_id: campaignId,
        click_data: processedClickData,
        scroll_data: scrollData,
        time_spent_data: timeSpentData
      };

    } catch (error) {
      console.error('❌ Failed to get email heatmap data:', error);
      throw error;
    }
  }

  // Predictive Analytics
  async predictOptimalSendTime(userId: string, segmentId?: string): Promise<{ hour: number; day: string; confidence: number }> {
    try {
      console.log(`🔮 Predicting optimal send time for user: ${userId}`);

      // Get historical campaign data
      let query = supabase
        .from('email_campaigns')
        .select('*, email_recipients(*)')
        .eq('user_id', userId)
        .eq('status', 'sent');

      if (segmentId) {
        query = query.eq('segment_id', segmentId);
      }

      const { data: campaigns, error } = await query;
      if (error) throw error;

      // Analyze send times and engagement
      const timeAnalysis = new Map();
      
      (campaigns || []).forEach(campaign => {
        if (campaign.sent_at) {
          const sentDate = new Date(campaign.sent_at);
          const hour = sentDate.getHours();
          const day = sentDate.toLocaleDateString('en-US', { weekday: 'long' });
          const key = `${day}_${hour}`;

          if (!timeAnalysis.has(key)) {
            timeAnalysis.set(key, {
              hour,
              day,
              campaigns: 0,
              totalOpens: 0,
              totalSent: 0
            });
          }

          const data = timeAnalysis.get(key);
          data.campaigns++;
          data.totalSent += campaign.actual_recipients || 0;
          
          // Calculate opens (simplified)
          const recipients = campaign.email_recipients || [];
          data.totalOpens += recipients.filter((r: any) => r.open_count > 0).length;
        }
      });

      // Find optimal time
      let bestTime = { hour: 10, day: 'Tuesday', confidence: 0 };
      let bestOpenRate = 0;

      timeAnalysis.forEach((data, key) => {
        const openRate = data.totalSent > 0 ? data.totalOpens / data.totalSent : 0;
        if (openRate > bestOpenRate && data.campaigns >= 3) { // Minimum 3 campaigns for confidence
          bestOpenRate = openRate;
          bestTime = {
            hour: data.hour,
            day: data.day,
            confidence: Math.min(95, data.campaigns * 10) // Confidence based on sample size
          };
        }
      });

      console.log(`✅ Optimal send time predicted: ${bestTime.day} at ${bestTime.hour}:00`);
      return bestTime;

    } catch (error) {
      console.error('❌ Failed to predict optimal send time:', error);
      // Return default optimal time
      return { hour: 10, day: 'Tuesday', confidence: 50 };
    }
  }

  async predictSubjectLinePerformance(subjectLine: string, userId: string): Promise<{ predicted_open_rate: number; confidence: number; suggestions: string[] }> {
    try {
      console.log(`🔮 Predicting subject line performance: "${subjectLine}"`);

      // Get historical subject line data
      const { data: campaigns, error } = await supabase
        .from('email_campaigns')
        .select('subject_line, actual_recipients')
        .eq('user_id', userId)
        .eq('status', 'sent')
        .not('subject_line', 'is', null);

      if (error) throw error;

      // Analyze subject line patterns
      const subjectAnalysis = {
        length: subjectLine.length,
        hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(subjectLine),
        hasNumbers: /\d/.test(subjectLine),
        hasQuestion: subjectLine.includes('?'),
        hasExclamation: subjectLine.includes('!'),
        wordCount: subjectLine.split(' ').length,
        hasPersonalization: /\{\{.*\}\}/.test(subjectLine)
      };

      // Calculate predicted open rate based on patterns
      let predictedOpenRate = 20; // Base rate

      // Length optimization
      if (subjectAnalysis.length >= 30 && subjectAnalysis.length <= 50) {
        predictedOpenRate += 5;
      } else if (subjectAnalysis.length > 60) {
        predictedOpenRate -= 3;
      }

      // Pattern bonuses
      if (subjectAnalysis.hasPersonalization) predictedOpenRate += 8;
      if (subjectAnalysis.hasNumbers) predictedOpenRate += 3;
      if (subjectAnalysis.hasQuestion) predictedOpenRate += 2;
      if (subjectAnalysis.hasEmoji) predictedOpenRate += 1;

      // Generate suggestions
      const suggestions = [];
      if (!subjectAnalysis.hasPersonalization) {
        suggestions.push('Add personalization like {{first_name}} to increase engagement');
      }
      if (subjectAnalysis.length > 50) {
        suggestions.push('Consider shortening the subject line for better mobile display');
      }
      if (!subjectAnalysis.hasNumbers && !subjectAnalysis.hasQuestion) {
        suggestions.push('Try adding a number or question to create curiosity');
      }

      const confidence = Math.min(85, (campaigns?.length || 0) * 2); // Confidence based on historical data

      return {
        predicted_open_rate: Math.round(predictedOpenRate * 100) / 100,
        confidence,
        suggestions
      };

    } catch (error) {
      console.error('❌ Failed to predict subject line performance:', error);
      return {
        predicted_open_rate: 20,
        confidence: 50,
        suggestions: ['Add personalization to improve engagement']
      };
    }
  }

  // Conversion Tracking
  async trackEmailConversion(campaignId: string, contactId: string, conversionType: string, revenue?: number, metadata?: Record<string, any>): Promise<void> {
    try {
      console.log(`💰 Tracking email conversion: ${campaignId} for contact ${contactId}`);

      const { error } = await supabase
        .from('email_conversions')
        .insert({
          campaign_id: campaignId,
          contact_id: contactId,
          conversion_type: conversionType,
          revenue: revenue || 0,
          converted_at: new Date().toISOString(),
          metadata: metadata || {}
        });

      if (error) throw error;

      // Update contact interaction
      await supabase
        .from('contact_interactions')
        .insert({
          contact_id: contactId,
          interaction_type: 'email_conversion',
          description: `Email conversion: ${conversionType}`,
          created_at: new Date().toISOString(),
          metadata: { campaign_id: campaignId, conversion_type: conversionType, revenue }
        });

      console.log(`✅ Email conversion tracked: ${conversionType}`);

    } catch (error) {
      console.error('❌ Failed to track email conversion:', error);
    }
  }

  // Export Analytics Data
  async exportAnalyticsData(userId: string, format: 'csv' | 'json', dateRange?: { from: Date; to: Date }): Promise<string> {
    try {
      console.log(`📤 Exporting analytics data for user: ${userId} in ${format} format`);

      // Get performance metrics
      const metrics = await this.getOverallPerformanceMetrics(userId, dateRange);

      // Get campaigns
      let campaignQuery = supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', userId);

      if (dateRange) {
        campaignQuery = campaignQuery
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString());
      }

      const { data: campaigns, error } = await campaignQuery;
      if (error) throw error;

      // Get detailed analytics for each campaign
      const detailedData = await Promise.all(
        (campaigns || []).map(async campaign => {
          const analytics = await this.getCampaignAnalytics(campaign.id);
          return {
            campaign_name: campaign.name,
            campaign_type: campaign.campaign_type,
            sent_date: campaign.sent_at,
            ...analytics
          };
        })
      );

      if (format === 'csv') {
        return this.convertToCSV(detailedData);
      } else {
        return JSON.stringify({
          summary: metrics,
          campaigns: detailedData,
          exported_at: new Date().toISOString()
        }, null, 2);
      }

    } catch (error) {
      console.error('❌ Failed to export analytics data:', error);
      throw error;
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const emailAnalyticsService = EmailAnalyticsService.getInstance();
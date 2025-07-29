import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

export interface EmailCampaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  campaign_type: 'newsletter' | 'promotional' | 'transactional' | 'drip' | 'broadcast';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  subject_line: string;
  preview_text?: string;
  sender_name: string;
  sender_email: string;
  reply_to_email?: string;
  content: {
    html: string;
    text: string;
    template_id?: string;
  };
  recipients: {
    segment_ids: string[];
    contact_ids: string[];
    total_count: number;
  };
  scheduling: {
    send_immediately: boolean;
    scheduled_at?: Date;
    timezone: string;
    send_time_optimization: boolean;
  };
  ab_testing?: {
    enabled: boolean;
    test_type: 'subject_line' | 'content' | 'sender_name';
    variants: Array<{
      name: string;
      percentage: number;
      content: Record<string, any>;
    }>;
    winner_criteria: 'open_rate' | 'click_rate' | 'conversion_rate';
    test_duration_hours: number;
  };
  created_at: Date;
  updated_at: Date;
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'newsletter' | 'promotional' | 'welcome' | 'follow_up' | 'custom';
  html_content: string;
  text_content: string;
  variables: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    default_value?: any;
    required: boolean;
  }>;
  thumbnail_url?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EmailMetrics {
  campaign_id: string;
  total_sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  spam_complaints: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  unsubscribe_rate: number;
  spam_rate: number;
  engagement_score: number;
}

export class EmailCampaignService {
  private static instance: EmailCampaignService;

  private constructor() {}

  public static getInstance(): EmailCampaignService {
    if (!EmailCampaignService.instance) {
      EmailCampaignService.instance = new EmailCampaignService();
    }
    return EmailCampaignService.instance;
  }

  // Campaign Management
  async createEmailCampaign(campaign: Omit<EmailCampaign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailCampaign> {
    try {
      console.log(`📧 Creating email campaign: ${campaign.name}`);

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          user_id: campaign.user_id,
          name: campaign.name,
          description: campaign.description,
          campaign_type: campaign.campaign_type,
          status: campaign.status,
          subject_line: campaign.subject_line,
          preview_text: campaign.preview_text,
          sender_name: campaign.sender_name,
          sender_email: campaign.sender_email,
          reply_to_email: campaign.reply_to_email,
          content: campaign.content,
          recipients: campaign.recipients,
          scheduling: campaign.scheduling,
          ab_testing: campaign.ab_testing,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Email campaign created: ${campaign.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create email campaign:', error);
      throw error;
    }
  }  as
ync getEmailCampaigns(userId: string, filters?: {
    status?: string;
    campaign_type?: string;
    created_after?: Date;
  }): Promise<EmailCampaign[]> {
    try {
      let query = supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', userId);

      if (filters) {
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.campaign_type) query = query.eq('campaign_type', filters.campaign_type);
        if (filters.created_after) query = query.gte('created_at', filters.created_after.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get email campaigns:', error);
      throw error;
    }
  }

  async updateEmailCampaign(campaignId: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Email campaign updated: ${campaignId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update email campaign:', error);
      throw error;
    }
  }

  // Template Management
  async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    try {
      console.log(`📝 Creating email template: ${template.name}`);

      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: template.user_id,
          name: template.name,
          description: template.description,
          category: template.category,
          html_content: template.html_content,
          text_content: template.text_content,
          variables: template.variables,
          thumbnail_url: template.thumbnail_url,
          is_public: template.is_public,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Email template created: ${template.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create email template:', error);
      throw error;
    }
  }

  async getEmailTemplates(userId: string, category?: string): Promise<EmailTemplate[]> {
    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get email templates:', error);
      throw error;
    }
  }

  // Campaign Sending
  async sendEmailCampaign(campaignId: string): Promise<void> {
    try {
      console.log(`🚀 Sending email campaign: ${campaignId}`);

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Validate campaign can be sent
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new Error('Campaign cannot be sent in current status');
      }

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'sending',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);

      // Get recipients
      const recipients = await this.getRecipients(campaign);

      // Handle A/B testing
      if (campaign.ab_testing?.enabled) {
        await this.sendABTestCampaign(campaign, recipients);
      } else {
        await this.sendRegularCampaign(campaign, recipients);
      }

      console.log(`✅ Email campaign sent: ${campaignId}`);

    } catch (error) {
      console.error('❌ Failed to send email campaign:', error);
      
      // Update campaign status to failed
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      throw error;
    }
  }

  private async getRecipients(campaign: EmailCampaign): Promise<any[]> {
    const recipients: any[] = [];

    // Get contacts from segments
    for (const segmentId of campaign.recipients.segment_ids) {
      const segmentContacts = await enhancedSupabaseService.getContactsInSegment(segmentId, campaign.user_id);
      recipients.push(...segmentContacts);
    }

    // Get individual contacts
    if (campaign.recipients.contact_ids.length > 0) {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .in('id', campaign.recipients.contact_ids);

      if (!error && contacts) {
        recipients.push(...contacts);
      }
    }

    // Remove duplicates and unsubscribed contacts
    const uniqueRecipients = recipients
      .filter((contact, index, self) => 
        index === self.findIndex(c => c.id === contact.id)
      )
      .filter(contact => 
        contact.email && 
        contact.email_status !== 'unsubscribed' &&
        contact.email_status !== 'bounced'
      );

    return uniqueRecipients;
  }

  private async sendRegularCampaign(campaign: EmailCampaign, recipients: any[]): Promise<void> {
    console.log(`📧 Sending regular campaign to ${recipients.length} recipients`);

    // Process recipients in batches
    const batchSize = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(recipient => this.sendEmailToRecipient(campaign, recipient))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          sent++;
        } else {
          failed++;
          console.error('Failed to send email:', result.reason);
        }
      });

      // Update progress
      console.log(`📊 Progress: ${sent + failed}/${recipients.length} processed`);
    }

    // Update campaign status
    await supabase
      .from('email_campaigns')
      .update({ 
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', campaign.id);

    // Store campaign metrics
    await this.storeCampaignMetrics(campaign.id, {
      total_sent: sent,
      delivered: sent, // Mock - would be updated by delivery webhooks
      bounced: failed,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      spam_complaints: 0
    });

    console.log(`✅ Campaign sent: ${sent} successful, ${failed} failed`);
  }

  private async sendABTestCampaign(campaign: EmailCampaign, recipients: any[]): Promise<void> {
    console.log(`🧪 Sending A/B test campaign to ${recipients.length} recipients`);

    if (!campaign.ab_testing) return;

    // Split recipients based on A/B test percentages
    const variants = campaign.ab_testing.variants;
    const recipientGroups: { [key: string]: any[] } = {};
    
    let currentIndex = 0;
    for (const variant of variants) {
      const groupSize = Math.floor(recipients.length * variant.percentage / 100);
      recipientGroups[variant.name] = recipients.slice(currentIndex, currentIndex + groupSize);
      currentIndex += groupSize;
    }

    // Send each variant
    for (const variant of variants) {
      const variantRecipients = recipientGroups[variant.name];
      if (variantRecipients && variantRecipients.length > 0) {
        
        // Create variant campaign content
        const variantCampaign = {
          ...campaign,
          subject_line: variant.content.subject_line || campaign.subject_line,
          content: variant.content.content || campaign.content,
          sender_name: variant.content.sender_name || campaign.sender_name
        };

        await this.sendVariantCampaign(variantCampaign, variantRecipients, variant.name);
      }
    }

    // Schedule winner selection
    setTimeout(async () => {
      await this.selectABTestWinner(campaign.id);
    }, campaign.ab_testing.test_duration_hours * 60 * 60 * 1000);
  }

  private async sendVariantCampaign(campaign: any, recipients: any[], variantName: string): Promise<void> {
    console.log(`📧 Sending variant "${variantName}" to ${recipients.length} recipients`);

    for (const recipient of recipients) {
      try {
        await this.sendEmailToRecipient(campaign, recipient, variantName);
      } catch (error) {
        console.error(`Failed to send variant email to ${recipient.email}:`, error);
      }
    }
  }

  private async sendEmailToRecipient(campaign: any, recipient: any, variant?: string): Promise<void> {
    // Mock email sending - in reality would integrate with email service provider
    console.log(`📧 Sending email to ${recipient.email}: ${campaign.subject_line}`);

    // Personalize content
    const personalizedContent = this.personalizeEmailContent(campaign.content, recipient);

    // Store email send record
    await supabase
      .from('email_sends')
      .insert({
        campaign_id: campaign.id,
        contact_id: recipient.id,
        email_address: recipient.email,
        subject_line: campaign.subject_line,
        content: personalizedContent,
        variant: variant,
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    // Create interaction record
    await supabase
      .from('contact_interactions')
      .insert({
        user_id: campaign.user_id,
        contact_id: recipient.id,
        interaction_type: 'email_sent',
        description: `Email campaign sent: ${campaign.name}`,
        created_at: new Date().toISOString()
      });
  }

  private personalizeEmailContent(content: any, recipient: any): any {
    let personalizedHtml = content.html;
    let personalizedText = content.text;

    // Replace common variables
    const replacements = {
      '{{first_name}}': recipient.first_name || 'there',
      '{{last_name}}': recipient.last_name || '',
      '{{email}}': recipient.email || '',
      '{{company}}': recipient.company || '',
      '{{full_name}}': `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim() || 'there'
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      personalizedHtml = personalizedHtml.replace(new RegExp(placeholder, 'g'), value);
      personalizedText = personalizedText.replace(new RegExp(placeholder, 'g'), value);
    }

    return {
      html: personalizedHtml,
      text: personalizedText
    };
  }

  private async selectABTestWinner(campaignId: string): Promise<void> {
    try {
      console.log(`🏆 Selecting A/B test winner for campaign: ${campaignId}`);

      // Get campaign details
      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      if (!campaign.ab_testing?.enabled) return;

      // Get metrics for each variant
      const variantMetrics = await this.getVariantMetrics(campaignId);
      
      // Determine winner based on criteria
      const winnerCriteria = campaign.ab_testing.winner_criteria;
      let winner = variantMetrics[0];

      for (const variant of variantMetrics) {
        switch (winnerCriteria) {
          case 'open_rate':
            if (variant.open_rate > winner.open_rate) winner = variant;
            break;
          case 'click_rate':
            if (variant.click_rate > winner.click_rate) winner = variant;
            break;
          case 'conversion_rate':
            if (variant.conversion_rate > winner.conversion_rate) winner = variant;
            break;
        }
      }

      // Store A/B test results
      await supabase
        .from('ab_test_results')
        .insert({
          campaign_id: campaignId,
          winner_variant: winner.variant_name,
          winner_criteria: winnerCriteria,
          winner_value: winner[winnerCriteria],
          variant_metrics: variantMetrics,
          selected_at: new Date().toISOString()
        });

      console.log(`✅ A/B test winner selected: ${winner.variant_name}`);

    } catch (error) {
      console.error('❌ Failed to select A/B test winner:', error);
    }
  }

  private async getVariantMetrics(campaignId: string): Promise<any[]> {
    // Mock variant metrics - in reality would calculate from actual email tracking data
    return [
      {
        variant_name: 'A',
        sent: 500,
        opened: 175,
        clicked: 35,
        converted: 7,
        open_rate: 35.0,
        click_rate: 7.0,
        conversion_rate: 1.4
      },
      {
        variant_name: 'B',
        sent: 500,
        opened: 190,
        clicked: 42,
        converted: 9,
        open_rate: 38.0,
        click_rate: 8.4,
        conversion_rate: 1.8
      }
    ];
  }

  // Campaign Analytics
  async getCampaignMetrics(campaignId: string): Promise<EmailMetrics> {
    try {
      // Get email sends for this campaign
      const { data: sends, error: sendsError } = await supabase
        .from('email_sends')
        .select('*')
        .eq('campaign_id', campaignId);

      if (sendsError) throw sendsError;

      // Get email events (opens, clicks, etc.)
      const { data: events, error: eventsError } = await supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId);

      if (eventsError) throw eventsError;

      const totalSent = sends?.length || 0;
      const delivered = sends?.filter(s => s.status === 'delivered').length || totalSent;
      const bounced = sends?.filter(s => s.status === 'bounced').length || 0;
      const opened = events?.filter(e => e.event_type === 'opened').length || 0;
      const clicked = events?.filter(e => e.event_type === 'clicked').length || 0;
      const unsubscribed = events?.filter(e => e.event_type === 'unsubscribed').length || 0;
      const spamComplaints = events?.filter(e => e.event_type === 'spam_complaint').length || 0;

      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0;
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
      const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
      const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;
      const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;
      const spamRate = delivered > 0 ? (spamComplaints / delivered) * 100 : 0;

      // Calculate engagement score
      const engagementScore = Math.round(
        (openRate * 0.3) + 
        (clickRate * 0.4) + 
        (clickToOpenRate * 0.2) + 
        (Math.max(0, 100 - unsubscribeRate * 10) * 0.1)
      );

      return {
        campaign_id: campaignId,
        total_sent: totalSent,
        delivered,
        bounced,
        opened,
        clicked,
        unsubscribed,
        spam_complaints: spamComplaints,
        delivery_rate: Math.round(deliveryRate * 100) / 100,
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        click_to_open_rate: Math.round(clickToOpenRate * 100) / 100,
        unsubscribe_rate: Math.round(unsubscribeRate * 100) / 100,
        spam_rate: Math.round(spamRate * 100) / 100,
        engagement_score: engagementScore
      };

    } catch (error) {
      console.error('❌ Failed to get campaign metrics:', error);
      throw error;
    }
  }

  private async storeCampaignMetrics(campaignId: string, metrics: Partial<EmailMetrics>): Promise<void> {
    try {
      await supabase
        .from('email_campaign_metrics')
        .upsert({
          campaign_id: campaignId,
          ...metrics,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to store campaign metrics:', error);
    }
  }

  // Deliverability Optimization
  async optimizeDeliverability(campaignId: string): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    try {
      console.log(`🔍 Analyzing deliverability for campaign: ${campaignId}`);

      const { data: campaign, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;

      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check subject line
      if (campaign.subject_line.length > 50) {
        issues.push('Subject line is too long');
        recommendations.push('Keep subject line under 50 characters');
        score -= 10;
      }

      if (campaign.subject_line.includes('FREE') || campaign.subject_line.includes('!!!')) {
        issues.push('Subject line contains spam trigger words');
        recommendations.push('Avoid words like "FREE" and excessive punctuation');
        score -= 15;
      }

      // Check sender reputation
      const senderReputation = await this.checkSenderReputation(campaign.sender_email);
      if (senderReputation < 80) {
        issues.push('Sender reputation is low');
        recommendations.push('Improve sender reputation by reducing bounce and spam rates');
        score -= 20;
      }

      // Check content
      const contentAnalysis = this.analyzeEmailContent(campaign.content);
      if (contentAnalysis.spamScore > 5) {
        issues.push('Content has high spam score');
        recommendations.push('Reduce promotional language and improve text-to-image ratio');
        score -= contentAnalysis.spamScore;
      }

      return {
        score: Math.max(0, score),
        issues,
        recommendations
      };

    } catch (error) {
      console.error('❌ Failed to optimize deliverability:', error);
      throw error;
    }
  }

  private async checkSenderReputation(senderEmail: string): Promise<number> {
    // Mock sender reputation check - in reality would check with email service provider
    return Math.floor(Math.random() * 40) + 60; // Random score between 60-100
  }

  private analyzeEmailContent(content: any): { spamScore: number; issues: string[] } {
    let spamScore = 0;
    const issues: string[] = [];

    const html = content.html.toLowerCase();
    
    // Check for spam trigger words
    const spamWords = ['free', 'urgent', 'act now', 'limited time', 'click here'];
    spamWords.forEach(word => {
      if (html.includes(word)) {
        spamScore += 2;
        issues.push(`Contains spam trigger word: ${word}`);
      }
    });

    // Check text-to-image ratio
    const textLength = content.text.length;
    const imageCount = (html.match(/<img/g) || []).length;
    
    if (imageCount > 0 && textLength / imageCount < 100) {
      spamScore += 3;
      issues.push('Poor text-to-image ratio');
    }

    return { spamScore, issues };
  }

  // Default Templates Setup
  async setupDefaultEmailTemplates(userId: string): Promise<void> {
    try {
      console.log('🔧 Setting up default email templates...');

      const defaultTemplates: Array<Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>> = [
        {
          user_id: userId,
          name: 'Welcome Email',
          description: 'Welcome new subscribers',
          category: 'welcome',
          html_content: `
            <h1>Welcome {{first_name}}!</h1>
            <p>Thank you for joining our community. We're excited to have you on board!</p>
            <p>Here's what you can expect from us:</p>
            <ul>
              <li>Weekly insights and tips</li>
              <li>Exclusive offers and updates</li>
              <li>Access to our resource library</li>
            </ul>
            <p>Best regards,<br>The Team</p>
          `,
          text_content: `Welcome {{first_name}}! Thank you for joining our community...`,
          variables: [
            { name: 'first_name', type: 'text', default_value: 'there', required: false }
          ],
          is_public: false
        },
        {
          user_id: userId,
          name: 'Newsletter Template',
          description: 'Monthly newsletter template',
          category: 'newsletter',
          html_content: `
            <h1>{{newsletter_title}}</h1>
            <p>Hi {{first_name}},</p>
            <p>Here are this month's highlights:</p>
            <div>{{newsletter_content}}</div>
            <p>Thanks for reading!</p>
          `,
          text_content: `{{newsletter_title}} - Hi {{first_name}}, here are this month's highlights...`,
          variables: [
            { name: 'first_name', type: 'text', default_value: 'there', required: false },
            { name: 'newsletter_title', type: 'text', required: true },
            { name: 'newsletter_content', type: 'text', required: true }
          ],
          is_public: false
        }
      ];

      for (const template of defaultTemplates) {
        await this.createEmailTemplate(template);
      }

      console.log(`✅ Created ${defaultTemplates.length} default email templates`);

    } catch (error) {
      console.error('❌ Failed to setup default email templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailCampaignService = EmailCampaignService.getInstance();
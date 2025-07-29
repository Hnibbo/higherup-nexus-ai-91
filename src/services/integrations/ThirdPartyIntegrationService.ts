import { supabase } from '@/integrations/supabase/client';

/**
 * Third-Party Integration Service
 * 
 * This service provides comprehensive third-party integrations including:
 * - Popular CRM integrations (Salesforce, HubSpot)
 * - Email service provider integrations (Mailchimp, SendGrid)
 * - Payment processor integrations (Stripe, PayPal)
 * - Social media platform integrations
 * - Analytics platform integrations (Google Analytics)
 */

// Types for third-party integrations
export interface IntegrationConfig {
  id: string;
  integration_type: 'crm' | 'email' | 'payment' | 'social' | 'analytics';
  provider: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  credentials: {
    api_key?: string;
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    webhook_url?: string;
    [key: string]: any;
  };
  settings: {
    sync_frequency?: 'real_time' | 'hourly' | 'daily' | 'weekly';
    data_mapping?: Record<string, string>;
    filters?: Record<string, any>;
    [key: string]: any;
  };
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  integration_id: string;
  sync_type: 'full' | 'incremental';
  status: 'success' | 'partial' | 'failed';
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: Array<{
    record_id?: string;
    error_message: string;
    error_code?: string;
  }>;
  started_at: string;
  completed_at: string;
  next_sync?: string;
}

export interface WebhookEvent {
  id: string;
  integration_id: string;
  event_type: string;
  payload: any;
  processed: boolean;
  created_at: string;
  processed_at?: string;
}

export class ThirdPartyIntegrationService {
  private static instance: ThirdPartyIntegrationService;

  static getInstance(): ThirdPartyIntegrationService {
    if (!ThirdPartyIntegrationService.instance) {
      ThirdPartyIntegrationService.instance = new ThirdPartyIntegrationService();
    }
    return ThirdPartyIntegrationService.instance;
  }  // CRM 
Integrations (Salesforce, HubSpot)
  async setupCRMIntegration(provider: 'salesforce' | 'hubspot', credentials: any, settings: any): Promise<IntegrationConfig> {
    try {
      console.log(`🔗 Setting up ${provider} CRM integration`);

      const integration: IntegrationConfig = {
        id: `crm_${provider}_${Date.now()}`,
        integration_type: 'crm',
        provider: provider,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} CRM`,
        description: `Integration with ${provider} CRM system for contact and deal management`,
        status: 'pending',
        credentials: this.encryptCredentials(credentials),
        settings: {
          sync_frequency: settings.sync_frequency || 'hourly',
          data_mapping: this.getDefaultCRMMapping(provider),
          ...settings
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testCRMConnection(provider, credentials);
      integration.status = connectionTest.success ? 'active' : 'error';

      // Store integration config
      await this.storeIntegrationConfig(integration);

      // Set up initial sync
      if (integration.status === 'active') {
        await this.scheduleCRMSync(integration.id);
      }

      console.log(`✅ ${provider} CRM integration ${integration.status === 'active' ? 'activated' : 'failed'}`);
      return integration;

    } catch (error) {
      console.error(`❌ Failed to setup ${provider} CRM integration:`, error);
      throw error;
    }
  }

  private async testCRMConnection(provider: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'salesforce':
          return await this.testSalesforceConnection(credentials);
        case 'hubspot':
          return await this.testHubSpotConnection(credentials);
        default:
          return { success: false, error: 'Unsupported CRM provider' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  private async testSalesforceConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    // Mock Salesforce connection test
    console.log('🔍 Testing Salesforce connection...');
    
    if (!credentials.client_id || !credentials.client_secret) {
      return { success: false, error: 'Missing required Salesforce credentials' };
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true };
  }

  private async testHubSpotConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    // Mock HubSpot connection test
    console.log('🔍 Testing HubSpot connection...');
    
    if (!credentials.api_key) {
      return { success: false, error: 'Missing HubSpot API key' };
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return { success: true };
  }  p
rivate getDefaultCRMMapping(provider: string): Record<string, string> {
    const mappings = {
      salesforce: {
        'contact_email': 'Email',
        'contact_name': 'Name',
        'contact_phone': 'Phone',
        'company_name': 'Account.Name',
        'deal_amount': 'Opportunity.Amount',
        'deal_stage': 'Opportunity.StageName'
      },
      hubspot: {
        'contact_email': 'email',
        'contact_name': 'firstname,lastname',
        'contact_phone': 'phone',
        'company_name': 'company',
        'deal_amount': 'amount',
        'deal_stage': 'dealstage'
      }
    };

    return mappings[provider as keyof typeof mappings] || {};
  }

  async syncCRMData(integrationId: string): Promise<SyncResult> {
    try {
      console.log(`🔄 Starting CRM data sync for integration: ${integrationId}`);

      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      const syncResult: SyncResult = {
        integration_id: integrationId,
        sync_type: 'incremental',
        status: 'success',
        records_processed: 0,
        records_created: 0,
        records_updated: 0,
        records_failed: 0,
        errors: [],
        started_at: new Date().toISOString(),
        completed_at: '',
        next_sync: this.calculateNextSync(integration.settings.sync_frequency || 'hourly')
      };

      // Perform sync based on provider
      switch (integration.provider) {
        case 'salesforce':
          await this.syncSalesforceData(integration, syncResult);
          break;
        case 'hubspot':
          await this.syncHubSpotData(integration, syncResult);
          break;
      }

      syncResult.completed_at = new Date().toISOString();
      
      // Update last sync time
      await this.updateLastSync(integrationId, syncResult.completed_at);

      console.log(`✅ CRM sync completed: ${syncResult.records_processed} records processed`);
      return syncResult;

    } catch (error) {
      console.error('❌ CRM sync failed:', error);
      throw error;
    }
  }

  private async syncSalesforceData(integration: IntegrationConfig, syncResult: SyncResult): Promise<void> {
    // Mock Salesforce data sync
    console.log('📊 Syncing Salesforce data...');
    
    // Simulate fetching contacts
    const mockContacts = this.generateMockCRMData('salesforce', 'contacts', 25);
    syncResult.records_processed += mockContacts.length;
    syncResult.records_created += Math.floor(mockContacts.length * 0.3);
    syncResult.records_updated += Math.floor(mockContacts.length * 0.7);

    // Simulate fetching opportunities
    const mockOpportunities = this.generateMockCRMData('salesforce', 'opportunities', 15);
    syncResult.records_processed += mockOpportunities.length;
    syncResult.records_created += Math.floor(mockOpportunities.length * 0.4);
    syncResult.records_updated += Math.floor(mockOpportunities.length * 0.6);

    // Simulate some errors
    if (Math.random() > 0.9) {
      syncResult.records_failed = 2;
      syncResult.errors.push({
        record_id: 'sf_contact_123',
        error_message: 'Invalid email format',
        error_code: 'VALIDATION_ERROR'
      });
    }
  }

  private async syncHubSpotData(integration: IntegrationConfig, syncResult: SyncResult): Promise<void> {
    // Mock HubSpot data sync
    console.log('📊 Syncing HubSpot data...');
    
    // Simulate fetching contacts
    const mockContacts = this.generateMockCRMData('hubspot', 'contacts', 30);
    syncResult.records_processed += mockContacts.length;
    syncResult.records_created += Math.floor(mockContacts.length * 0.2);
    syncResult.records_updated += Math.floor(mockContacts.length * 0.8);

    // Simulate fetching deals
    const mockDeals = this.generateMockCRMData('hubspot', 'deals', 12);
    syncResult.records_processed += mockDeals.length;
    syncResult.records_created += Math.floor(mockDeals.length * 0.5);
    syncResult.records_updated += Math.floor(mockDeals.length * 0.5);
  }  // 
Email Service Provider Integrations (Mailchimp, SendGrid)
  async setupEmailIntegration(provider: 'mailchimp' | 'sendgrid', credentials: any, settings: any): Promise<IntegrationConfig> {
    try {
      console.log(`📧 Setting up ${provider} email integration`);

      const integration: IntegrationConfig = {
        id: `email_${provider}_${Date.now()}`,
        integration_type: 'email',
        provider: provider,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Email`,
        description: `Integration with ${provider} for email marketing and automation`,
        status: 'pending',
        credentials: this.encryptCredentials(credentials),
        settings: {
          sync_frequency: settings.sync_frequency || 'real_time',
          default_list_id: settings.default_list_id,
          ...settings
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testEmailConnection(provider, credentials);
      integration.status = connectionTest.success ? 'active' : 'error';

      // Store integration config
      await this.storeIntegrationConfig(integration);

      console.log(`✅ ${provider} email integration ${integration.status === 'active' ? 'activated' : 'failed'}`);
      return integration;

    } catch (error) {
      console.error(`❌ Failed to setup ${provider} email integration:`, error);
      throw error;
    }
  }

  private async testEmailConnection(provider: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'mailchimp':
          return await this.testMailchimpConnection(credentials);
        case 'sendgrid':
          return await this.testSendGridConnection(credentials);
        default:
          return { success: false, error: 'Unsupported email provider' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  private async testMailchimpConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 Testing Mailchimp connection...');
    
    if (!credentials.api_key) {
      return { success: false, error: 'Missing Mailchimp API key' };
    }

    await new Promise(resolve => setTimeout(resolve, 900));
    return { success: true };
  }

  private async testSendGridConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 Testing SendGrid connection...');
    
    if (!credentials.api_key) {
      return { success: false, error: 'Missing SendGrid API key' };
    }

    await new Promise(resolve => setTimeout(resolve, 700));
    return { success: true };
  }

  async sendEmailCampaign(integrationId: string, campaignData: any): Promise<{ success: boolean; campaign_id?: string; error?: string }> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration || integration.integration_type !== 'email') {
        throw new Error('Email integration not found');
      }

      console.log(`📤 Sending email campaign via ${integration.provider}`);

      switch (integration.provider) {
        case 'mailchimp':
          return await this.sendMailchimpCampaign(integration, campaignData);
        case 'sendgrid':
          return await this.sendSendGridCampaign(integration, campaignData);
        default:
          return { success: false, error: 'Unsupported email provider' };
      }

    } catch (error) {
      console.error('❌ Failed to send email campaign:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Campaign send failed' };
    }
  }

  private async sendMailchimpCampaign(integration: IntegrationConfig, campaignData: any): Promise<{ success: boolean; campaign_id?: string }> {
    // Mock Mailchimp campaign send
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const campaignId = `mc_campaign_${Date.now()}`;
    console.log(`✅ Mailchimp campaign sent: ${campaignId}`);
    
    return { success: true, campaign_id: campaignId };
  }

  private async sendSendGridCampaign(integration: IntegrationConfig, campaignData: any): Promise<{ success: boolean; campaign_id?: string }> {
    // Mock SendGrid campaign send
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const campaignId = `sg_campaign_${Date.now()}`;
    console.log(`✅ SendGrid campaign sent: ${campaignId}`);
    
    return { success: true, campaign_id: campaignId };
  }  // 
Payment Processor Integrations (Stripe, PayPal)
  async setupPaymentIntegration(provider: 'stripe' | 'paypal', credentials: any, settings: any): Promise<IntegrationConfig> {
    try {
      console.log(`💳 Setting up ${provider} payment integration`);

      const integration: IntegrationConfig = {
        id: `payment_${provider}_${Date.now()}`,
        integration_type: 'payment',
        provider: provider,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Payments`,
        description: `Integration with ${provider} for payment processing`,
        status: 'pending',
        credentials: this.encryptCredentials(credentials),
        settings: {
          webhook_url: settings.webhook_url,
          currency: settings.currency || 'USD',
          ...settings
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testPaymentConnection(provider, credentials);
      integration.status = connectionTest.success ? 'active' : 'error';

      // Store integration config
      await this.storeIntegrationConfig(integration);

      // Set up webhooks
      if (integration.status === 'active' && settings.webhook_url) {
        await this.setupPaymentWebhooks(integration);
      }

      console.log(`✅ ${provider} payment integration ${integration.status === 'active' ? 'activated' : 'failed'}`);
      return integration;

    } catch (error) {
      console.error(`❌ Failed to setup ${provider} payment integration:`, error);
      throw error;
    }
  }

  private async testPaymentConnection(provider: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      switch (provider) {
        case 'stripe':
          return await this.testStripeConnection(credentials);
        case 'paypal':
          return await this.testPayPalConnection(credentials);
        default:
          return { success: false, error: 'Unsupported payment provider' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  private async testStripeConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 Testing Stripe connection...');
    
    if (!credentials.secret_key) {
      return { success: false, error: 'Missing Stripe secret key' };
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  }

  private async testPayPalConnection(credentials: any): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 Testing PayPal connection...');
    
    if (!credentials.client_id || !credentials.client_secret) {
      return { success: false, error: 'Missing PayPal credentials' };
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  }

  private async setupPaymentWebhooks(integration: IntegrationConfig): Promise<void> {
    console.log(`🔗 Setting up ${integration.provider} webhooks`);
    
    // Mock webhook setup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`✅ ${integration.provider} webhooks configured`);
  }

  async processPaymentWebhook(integrationId: string, webhookData: any): Promise<{ processed: boolean; error?: string }> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration || integration.integration_type !== 'payment') {
        throw new Error('Payment integration not found');
      }

      console.log(`💰 Processing ${integration.provider} webhook`);

      // Store webhook event
      const webhookEvent: WebhookEvent = {
        id: `webhook_${Date.now()}`,
        integration_id: integrationId,
        event_type: webhookData.type || 'payment.completed',
        payload: webhookData,
        processed: false,
        created_at: new Date().toISOString()
      };

      await this.storeWebhookEvent(webhookEvent);

      // Process based on provider
      switch (integration.provider) {
        case 'stripe':
          await this.processStripeWebhook(webhookData);
          break;
        case 'paypal':
          await this.processPayPalWebhook(webhookData);
          break;
      }

      // Mark as processed
      webhookEvent.processed = true;
      webhookEvent.processed_at = new Date().toISOString();
      await this.updateWebhookEvent(webhookEvent);

      console.log(`✅ ${integration.provider} webhook processed`);
      return { processed: true };

    } catch (error) {
      console.error('❌ Failed to process payment webhook:', error);
      return { processed: false, error: error instanceof Error ? error.message : 'Webhook processing failed' };
    }
  }

  private async processStripeWebhook(webhookData: any): Promise<void> {
    // Mock Stripe webhook processing
    console.log('Processing Stripe webhook:', webhookData.type);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async processPayPalWebhook(webhookData: any): Promise<void> {
    // Mock PayPal webhook processing
    console.log('Processing PayPal webhook:', webhookData.event_type);
    await new Promise(resolve => setTimeout(resolve, 400));
  }  
// Social Media Platform Integrations
  async setupSocialIntegration(provider: 'facebook' | 'twitter' | 'linkedin' | 'instagram', credentials: any, settings: any): Promise<IntegrationConfig> {
    try {
      console.log(`📱 Setting up ${provider} social media integration`);

      const integration: IntegrationConfig = {
        id: `social_${provider}_${Date.now()}`,
        integration_type: 'social',
        provider: provider,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Social`,
        description: `Integration with ${provider} for social media management`,
        status: 'pending',
        credentials: this.encryptCredentials(credentials),
        settings: {
          auto_post: settings.auto_post || false,
          post_schedule: settings.post_schedule,
          ...settings
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testSocialConnection(provider, credentials);
      integration.status = connectionTest.success ? 'active' : 'error';

      // Store integration config
      await this.storeIntegrationConfig(integration);

      console.log(`✅ ${provider} social integration ${integration.status === 'active' ? 'activated' : 'failed'}`);
      return integration;

    } catch (error) {
      console.error(`❌ Failed to setup ${provider} social integration:`, error);
      throw error;
    }
  }

  private async testSocialConnection(provider: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    console.log(`🔍 Testing ${provider} connection...`);
    
    if (!credentials.access_token) {
      return { success: false, error: `Missing ${provider} access token` };
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    return { success: true };
  }

  async postToSocialMedia(integrationId: string, postData: any): Promise<{ success: boolean; post_id?: string; error?: string }> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration || integration.integration_type !== 'social') {
        throw new Error('Social media integration not found');
      }

      console.log(`📤 Posting to ${integration.provider}`);

      // Mock social media post
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const postId = `${integration.provider}_post_${Date.now()}`;
      console.log(`✅ Posted to ${integration.provider}: ${postId}`);
      
      return { success: true, post_id: postId };

    } catch (error) {
      console.error('❌ Failed to post to social media:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Social media post failed' };
    }
  }

  // Analytics Platform Integrations (Google Analytics)
  async setupAnalyticsIntegration(provider: 'google_analytics' | 'facebook_pixel', credentials: any, settings: any): Promise<IntegrationConfig> {
    try {
      console.log(`📊 Setting up ${provider} analytics integration`);

      const integration: IntegrationConfig = {
        id: `analytics_${provider}_${Date.now()}`,
        integration_type: 'analytics',
        provider: provider,
        name: `${provider.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        description: `Integration with ${provider} for analytics tracking`,
        status: 'pending',
        credentials: this.encryptCredentials(credentials),
        settings: {
          tracking_id: settings.tracking_id,
          events_to_track: settings.events_to_track || ['page_view', 'conversion'],
          ...settings
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testAnalyticsConnection(provider, credentials);
      integration.status = connectionTest.success ? 'active' : 'error';

      // Store integration config
      await this.storeIntegrationConfig(integration);

      console.log(`✅ ${provider} analytics integration ${integration.status === 'active' ? 'activated' : 'failed'}`);
      return integration;

    } catch (error) {
      console.error(`❌ Failed to setup ${provider} analytics integration:`, error);
      throw error;
    }
  }

  private async testAnalyticsConnection(provider: string, credentials: any): Promise<{ success: boolean; error?: string }> {
    console.log(`🔍 Testing ${provider} connection...`);
    
    switch (provider) {
      case 'google_analytics':
        if (!credentials.service_account_key) {
          return { success: false, error: 'Missing Google Analytics service account key' };
        }
        break;
      case 'facebook_pixel':
        if (!credentials.pixel_id || !credentials.access_token) {
          return { success: false, error: 'Missing Facebook Pixel credentials' };
        }
        break;
    }

    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true };
  }

  async trackAnalyticsEvent(integrationId: string, eventData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration || integration.integration_type !== 'analytics') {
        throw new Error('Analytics integration not found');
      }

      console.log(`📈 Tracking event via ${integration.provider}`);

      // Mock analytics event tracking
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`✅ Event tracked via ${integration.provider}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to track analytics event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Event tracking failed' };
    }
  } 
 // Utility Methods
  private encryptCredentials(credentials: any): any {
    // In a real implementation, this would encrypt sensitive data
    return { ...credentials, encrypted: true };
  }

  private async storeIntegrationConfig(integration: IntegrationConfig): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .insert({
        id: integration.id,
        integration_type: integration.integration_type,
        provider: integration.provider,
        name: integration.name,
        description: integration.description,
        status: integration.status,
        credentials: integration.credentials,
        settings: integration.settings,
        last_sync: integration.last_sync,
        created_at: integration.created_at,
        updated_at: integration.updated_at
      });

    if (error) {
      console.warn('Could not store integration config:', error);
    }
  }

  private async getIntegrationConfig(integrationId: string): Promise<IntegrationConfig | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      console.warn('Could not fetch integration config:', error);
      return null;
    }

    return data;
  }

  private async updateLastSync(integrationId: string, lastSync: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .update({ last_sync: lastSync, updated_at: new Date().toISOString() })
      .eq('id', integrationId);

    if (error) {
      console.warn('Could not update last sync:', error);
    }
  }

  private async storeWebhookEvent(event: WebhookEvent): Promise<void> {
    const { error } = await supabase
      .from('webhook_events')
      .insert({
        id: event.id,
        integration_id: event.integration_id,
        event_type: event.event_type,
        payload: event.payload,
        processed: event.processed,
        created_at: event.created_at,
        processed_at: event.processed_at
      });

    if (error) {
      console.warn('Could not store webhook event:', error);
    }
  }

  private async updateWebhookEvent(event: WebhookEvent): Promise<void> {
    const { error } = await supabase
      .from('webhook_events')
      .update({
        processed: event.processed,
        processed_at: event.processed_at
      })
      .eq('id', event.id);

    if (error) {
      console.warn('Could not update webhook event:', error);
    }
  }

  private generateMockCRMData(provider: string, dataType: string, count: number): any[] {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: `${provider}_${dataType}_${i + 1}`,
        name: `${dataType} ${i + 1}`,
        email: `contact${i + 1}@example.com`,
        created_at: new Date().toISOString()
      });
    }
    return data;
  }

  private calculateNextSync(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case 'real_time':
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 minutes
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 day
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week
      default:
        return new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour
    }
  }

  private async scheduleCRMSync(integrationId: string): Promise<void> {
    console.log(`⏰ Scheduling CRM sync for integration: ${integrationId}`);
    // In a real implementation, this would schedule the sync job
  }

  // Public methods for managing integrations
  async getAllIntegrations(): Promise<IntegrationConfig[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch integrations:', error);
      return [];
    }

    return data || [];
  }

  async getIntegrationsByType(type: string): Promise<IntegrationConfig[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch integrations by type:', error);
      return [];
    }

    return data || [];
  }

  async deleteIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Deleting integration: ${integrationId}`);

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        throw error;
      }

      console.log(`✅ Integration deleted: ${integrationId}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete integration:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async updateIntegrationStatus(integrationId: string, status: 'active' | 'inactive' | 'error'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ 
          status: status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', integrationId);

      if (error) {
        throw error;
      }

      console.log(`✅ Integration status updated: ${integrationId} -> ${status}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to update integration status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Status update failed' };
    }
  }

  async getIntegrationHealth(): Promise<{
    total_integrations: number;
    active_integrations: number;
    failed_integrations: number;
    last_sync_issues: number;
    health_score: number;
  }> {
    try {
      const integrations = await this.getAllIntegrations();
      
      const total = integrations.length;
      const active = integrations.filter(i => i.status === 'active').length;
      const failed = integrations.filter(i => i.status === 'error').length;
      
      // Check for sync issues (last sync more than expected frequency)
      const now = new Date();
      const syncIssues = integrations.filter(integration => {
        if (!integration.last_sync) return false;
        
        const lastSync = new Date(integration.last_sync);
        const expectedInterval = this.getExpectedSyncInterval(integration.settings.sync_frequency || 'hourly');
        
        return (now.getTime() - lastSync.getTime()) > expectedInterval;
      }).length;

      const healthScore = total > 0 ? Math.round(((active - failed - syncIssues) / total) * 100) : 100;

      return {
        total_integrations: total,
        active_integrations: active,
        failed_integrations: failed,
        last_sync_issues: syncIssues,
        health_score: Math.max(0, healthScore)
      };

    } catch (error) {
      console.error('❌ Failed to get integration health:', error);
      return {
        total_integrations: 0,
        active_integrations: 0,
        failed_integrations: 0,
        last_sync_issues: 0,
        health_score: 0
      };
    }
  }

  private getExpectedSyncInterval(frequency: string): number {
    switch (frequency) {
      case 'real_time':
        return 10 * 60 * 1000; // 10 minutes
      case 'hourly':
        return 2 * 60 * 60 * 1000; // 2 hours
      case 'daily':
        return 26 * 60 * 60 * 1000; // 26 hours
      case 'weekly':
        return 8 * 24 * 60 * 60 * 1000; // 8 days
      default:
        return 2 * 60 * 60 * 1000; // 2 hours
    }
  }

  // Bulk operations for enterprise customers
  async bulkSyncAllIntegrations(): Promise<SyncResult[]> {
    try {
      console.log('🔄 Starting bulk sync for all active integrations');

      const activeIntegrations = await this.getIntegrationsByType('crm');
      const syncResults: SyncResult[] = [];

      for (const integration of activeIntegrations) {
        if (integration.status === 'active') {
          try {
            const result = await this.syncCRMData(integration.id);
            syncResults.push(result);
          } catch (error) {
            console.error(`Failed to sync integration ${integration.id}:`, error);
            syncResults.push({
              integration_id: integration.id,
              sync_type: 'incremental',
              status: 'failed',
              records_processed: 0,
              records_created: 0,
              records_updated: 0,
              records_failed: 0,
              errors: [{ error_message: error instanceof Error ? error.message : 'Sync failed' }],
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            });
          }
        }
      }

      console.log(`✅ Bulk sync completed: ${syncResults.length} integrations processed`);
      return syncResults;

    } catch (error) {
      console.error('❌ Bulk sync failed:', error);
      throw error;
    }
  }

  // Integration monitoring and alerting
  async monitorIntegrations(): Promise<{
    alerts: Array<{
      integration_id: string;
      alert_type: 'sync_failure' | 'connection_error' | 'rate_limit' | 'data_quality';
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      created_at: string;
    }>;
  }> {
    try {
      console.log('🔍 Monitoring integrations for issues');

      const integrations = await this.getAllIntegrations();
      const alerts = [];

      for (const integration of integrations) {
        // Check for connection errors
        if (integration.status === 'error') {
          alerts.push({
            integration_id: integration.id,
            alert_type: 'connection_error' as const,
            message: `${integration.name} integration is in error state`,
            severity: 'high' as const,
            created_at: new Date().toISOString()
          });
        }

        // Check for sync failures
        if (integration.last_sync) {
          const lastSync = new Date(integration.last_sync);
          const now = new Date();
          const expectedInterval = this.getExpectedSyncInterval(integration.settings.sync_frequency || 'hourly');
          
          if ((now.getTime() - lastSync.getTime()) > expectedInterval * 2) {
            alerts.push({
              integration_id: integration.id,
              alert_type: 'sync_failure' as const,
              message: `${integration.name} has not synced for an extended period`,
              severity: 'medium' as const,
              created_at: new Date().toISOString()
            });
          }
        }
      }

      console.log(`🚨 Found ${alerts.length} integration alerts`);
      return { alerts };

    } catch (error) {
      console.error('❌ Failed to monitor integrations:', error);
      return { alerts: [] };
    }
  }

  // Data transformation and mapping utilities
  async transformData(integrationId: string, sourceData: any[], targetFormat: string): Promise<any[]> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      console.log(`🔄 Transforming data for ${integration.provider} -> ${targetFormat}`);

      const mapping = integration.settings.data_mapping || {};
      const transformedData = sourceData.map(record => {
        const transformed: any = {};
        
        Object.entries(mapping).forEach(([sourceField, targetField]) => {
          if (record[sourceField] !== undefined) {
            transformed[targetField as string] = record[sourceField];
          }
        });

        return transformed;
      });

      console.log(`✅ Transformed ${transformedData.length} records`);
      return transformedData;

    } catch (error) {
      console.error('❌ Failed to transform data:', error);
      throw error;
    }
  }

  // Integration analytics and reporting
  async getIntegrationAnalytics(dateRange: { start: string; end: string }): Promise<{
    sync_statistics: {
      total_syncs: number;
      successful_syncs: number;
      failed_syncs: number;
      records_processed: number;
    };
    performance_metrics: {
      average_sync_time: number;
      sync_frequency_compliance: number;
      error_rate: number;
    };
    integration_usage: Array<{
      integration_id: string;
      provider: string;
      sync_count: number;
      last_sync: string;
    }>;
  }> {
    try {
      console.log('📊 Generating integration analytics');

      // Mock analytics data (in real implementation, would query actual sync logs)
      const analytics = {
        sync_statistics: {
          total_syncs: 156,
          successful_syncs: 142,
          failed_syncs: 14,
          records_processed: 12847
        },
        performance_metrics: {
          average_sync_time: 2.3, // minutes
          sync_frequency_compliance: 94.2, // percentage
          error_rate: 8.97 // percentage
        },
        integration_usage: [
          {
            integration_id: 'crm_salesforce_123',
            provider: 'salesforce',
            sync_count: 48,
            last_sync: new Date().toISOString()
          },
          {
            integration_id: 'email_mailchimp_456',
            provider: 'mailchimp',
            sync_count: 72,
            last_sync: new Date().toISOString()
          }
        ]
      };

      console.log('✅ Integration analytics generated');
      return analytics;

    } catch (error) {
      console.error('❌ Failed to generate integration analytics:', error);
      throw error;
    }
  }
}

export const thirdPartyIntegrationService = ThirdPartyIntegrationService.getInstance();error);
      return [];
    }

    return data || [];
  }

  async getIntegrationsByType(type: IntegrationConfig['integration_type']): Promise<IntegrationConfig[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_type', type)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch integrations by type:', error);
      return [];
    }

    return data || [];
  }

  async deleteIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      console.log(`✅ Integration ${integrationId} deleted`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete integration:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  async getIntegrationStatus(integrationId: string): Promise<{ status: string; last_sync?: string; error?: string }> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);
      if (!integration) {
        return { status: 'not_found', error: 'Integration not found' };
      }

      return {
        status: integration.status,
        last_sync: integration.last_sync
      };

    } catch (error) {
      return { status: 'error', error: error instanceof Error ? error.message : 'Status check failed' };
    }
  }
}

// Export singleton instance
export const thirdPartyIntegrationService = ThirdPartyIntegrationService.getInstance();
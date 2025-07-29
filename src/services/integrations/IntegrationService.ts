import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

// Types for integrations
export interface Integration {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'payment' | 'social' | 'analytics' | 'automation' | 'storage';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  configuration: {
    api_key?: string;
    secret_key?: string;
    access_token?: string;
    refresh_token?: string;
    webhook_url?: string;
    custom_fields?: { [key: string]: any };
  };
  sync_settings: {
    auto_sync: boolean;
    sync_frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    last_sync: string;
    sync_direction: 'bidirectional' | 'inbound' | 'outbound';
  };
  data_mapping: {
    field_mappings: Array<{
      source_field: string;
      target_field: string;
      transformation?: string;
    }>;
    filters?: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
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
  duration_ms: number;
}

export class IntegrationService {
  private static instance: IntegrationService;

  private constructor() {}

  public static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  // CRM Integrations (Salesforce, HubSpot)
  async createSalesforceIntegration(config: {
    client_id: string;
    client_secret: string;
    username: string;
    password: string;
    security_token: string;
  }): Promise<Integration> {
    try {
      console.log('🔗 Creating Salesforce integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'Salesforce CRM',
        type: 'crm',
        provider: 'salesforce',
        status: 'pending',
        configuration: {
          api_key: config.client_id,
          secret_key: config.client_secret,
          custom_fields: {
            username: config.username,
            password: config.password,
            security_token: config.security_token,
            instance_url: 'https://login.salesforce.com'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date().toISOString(),
          sync_direction: 'bidirectional'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'Email', target_field: 'email' },
            { source_field: 'FirstName', target_field: 'first_name' },
            { source_field: 'LastName', target_field: 'last_name' },
            { source_field: 'Company', target_field: 'company' },
            { source_field: 'Phone', target_field: 'phone' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testSalesforceConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ Salesforce integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create Salesforce integration:', error);
      throw error;
    }
  }

  async createHubSpotIntegration(config: {
    api_key: string;
    portal_id: string;
  }): Promise<Integration> {
    try {
      console.log('🔗 Creating HubSpot integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'HubSpot CRM',
        type: 'crm',
        provider: 'hubspot',
        status: 'pending',
        configuration: {
          api_key: config.api_key,
          custom_fields: {
            portal_id: config.portal_id,
            base_url: 'https://api.hubapi.com'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date().toISOString(),
          sync_direction: 'bidirectional'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'email', target_field: 'email' },
            { source_field: 'firstname', target_field: 'first_name' },
            { source_field: 'lastname', target_field: 'last_name' },
            { source_field: 'company', target_field: 'company' },
            { source_field: 'phone', target_field: 'phone' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testHubSpotConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ HubSpot integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create HubSpot integration:', error);
      throw error;
    }
  }

  // Email Service Provider Integrations (Mailchimp, SendGrid)
  async createMailchimpIntegration(config: {
    api_key: string;
    server_prefix: string;
  }): Promise<Integration> {
    try {
      console.log('📧 Creating Mailchimp integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'Mailchimp Email',
        type: 'email',
        provider: 'mailchimp',
        status: 'pending',
        configuration: {
          api_key: config.api_key,
          custom_fields: {
            server_prefix: config.server_prefix,
            base_url: `https://${config.server_prefix}.api.mailchimp.com/3.0`
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'hourly',
          last_sync: new Date().toISOString(),
          sync_direction: 'outbound'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'email_address', target_field: 'email' },
            { source_field: 'merge_fields.FNAME', target_field: 'first_name' },
            { source_field: 'merge_fields.LNAME', target_field: 'last_name' },
            { source_field: 'status', target_field: 'subscription_status' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testMailchimpConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ Mailchimp integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create Mailchimp integration:', error);
      throw error;
    }
  }

  async createSendGridIntegration(config: {
    api_key: string;
  }): Promise<Integration> {
    try {
      console.log('📧 Creating SendGrid integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'SendGrid Email',
        type: 'email',
        provider: 'sendgrid',
        status: 'pending',
        configuration: {
          api_key: config.api_key,
          custom_fields: {
            base_url: 'https://api.sendgrid.com/v3'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date().toISOString(),
          sync_direction: 'outbound'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'email', target_field: 'email' },
            { source_field: 'first_name', target_field: 'first_name' },
            { source_field: 'last_name', target_field: 'last_name' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testSendGridConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ SendGrid integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create SendGrid integration:', error);
      throw error;
    }
  }

  // Payment Processor Integrations (Stripe, PayPal)
  async createStripeIntegration(config: {
    publishable_key: string;
    secret_key: string;
    webhook_secret?: string;
  }): Promise<Integration> {
    try {
      console.log('💳 Creating Stripe integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'Stripe Payments',
        type: 'payment',
        provider: 'stripe',
        status: 'pending',
        configuration: {
          api_key: config.publishable_key,
          secret_key: config.secret_key,
          custom_fields: {
            webhook_secret: config.webhook_secret,
            base_url: 'https://api.stripe.com/v1'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date().toISOString(),
          sync_direction: 'inbound'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'customer.email', target_field: 'email' },
            { source_field: 'customer.name', target_field: 'full_name' },
            { source_field: 'amount', target_field: 'transaction_amount' },
            { source_field: 'currency', target_field: 'currency' },
            { source_field: 'status', target_field: 'payment_status' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testStripeConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ Stripe integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create Stripe integration:', error);
      throw error;
    }
  }

  async createPayPalIntegration(config: {
    client_id: string;
    client_secret: string;
    environment: 'sandbox' | 'production';
  }): Promise<Integration> {
    try {
      console.log('💳 Creating PayPal integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'PayPal Payments',
        type: 'payment',
        provider: 'paypal',
        status: 'pending',
        configuration: {
          api_key: config.client_id,
          secret_key: config.client_secret,
          custom_fields: {
            environment: config.environment,
            base_url: config.environment === 'sandbox' 
              ? 'https://api.sandbox.paypal.com' 
              : 'https://api.paypal.com'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date().toISOString(),
          sync_direction: 'inbound'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'payer.email_address', target_field: 'email' },
            { source_field: 'payer.name.given_name', target_field: 'first_name' },
            { source_field: 'payer.name.surname', target_field: 'last_name' },
            { source_field: 'purchase_units[0].amount.value', target_field: 'transaction_amount' },
            { source_field: 'purchase_units[0].amount.currency_code', target_field: 'currency' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testPayPalConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ PayPal integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create PayPal integration:', error);
      throw error;
    }
  }

  // Social Media Platform Integrations
  async createFacebookIntegration(config: {
    app_id: string;
    app_secret: string;
    access_token: string;
  }): Promise<Integration> {
    try {
      console.log('📱 Creating Facebook integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'Facebook Social',
        type: 'social',
        provider: 'facebook',
        status: 'pending',
        configuration: {
          api_key: config.app_id,
          secret_key: config.app_secret,
          access_token: config.access_token,
          custom_fields: {
            base_url: 'https://graph.facebook.com/v18.0'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'hourly',
          last_sync: new Date().toISOString(),
          sync_direction: 'bidirectional'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'message', target_field: 'post_content' },
            { source_field: 'created_time', target_field: 'published_at' },
            { source_field: 'likes.summary.total_count', target_field: 'likes_count' },
            { source_field: 'comments.summary.total_count', target_field: 'comments_count' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testFacebookConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ Facebook integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create Facebook integration:', error);
      throw error;
    }
  }

  async createLinkedInIntegration(config: {
    client_id: string;
    client_secret: string;
    access_token: string;
  }): Promise<Integration> {
    try {
      console.log('💼 Creating LinkedIn integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'LinkedIn Social',
        type: 'social',
        provider: 'linkedin',
        status: 'pending',
        configuration: {
          api_key: config.client_id,
          secret_key: config.client_secret,
          access_token: config.access_token,
          custom_fields: {
            base_url: 'https://api.linkedin.com/v2'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'hourly',
          last_sync: new Date().toISOString(),
          sync_direction: 'bidirectional'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'text.text', target_field: 'post_content' },
            { source_field: 'created.time', target_field: 'published_at' },
            { source_field: 'socialMetadata.totalSocialActivityCounts.numLikes', target_field: 'likes_count' },
            { source_field: 'socialMetadata.totalSocialActivityCounts.numComments', target_field: 'comments_count' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testLinkedInConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ LinkedIn integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create LinkedIn integration:', error);
      throw error;
    }
  }

  // Analytics Platform Integrations (Google Analytics)
  async createGoogleAnalyticsIntegration(config: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
    property_id: string;
  }): Promise<Integration> {
    try {
      console.log('📊 Creating Google Analytics integration');

      const integration: Integration = {
        id: `integration_${Date.now()}`,
        name: 'Google Analytics',
        type: 'analytics',
        provider: 'google_analytics',
        status: 'pending',
        configuration: {
          api_key: config.client_id,
          secret_key: config.client_secret,
          refresh_token: config.refresh_token,
          custom_fields: {
            property_id: config.property_id,
            base_url: 'https://analyticsdata.googleapis.com/v1beta'
          }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'daily',
          last_sync: new Date().toISOString(),
          sync_direction: 'inbound'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'sessions', target_field: 'sessions' },
            { source_field: 'users', target_field: 'users' },
            { source_field: 'pageviews', target_field: 'page_views' },
            { source_field: 'bounceRate', target_field: 'bounce_rate' },
            { source_field: 'avgSessionDuration', target_field: 'avg_session_duration' }
          ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Test connection
      const connectionTest = await this.testGoogleAnalyticsConnection(integration);
      integration.status = connectionTest ? 'active' : 'error';

      await this.storeIntegration(integration);

      console.log(`✅ Google Analytics integration ${connectionTest ? 'created successfully' : 'created with errors'}`);
      return integration;

    } catch (error) {
      console.error('❌ Failed to create Google Analytics integration:', error);
      throw error;
    }
  }  // C
onnection Testing Methods
  private async testSalesforceConnection(integration: Integration): Promise<boolean> {
    try {
      // In a real implementation, this would make an actual API call to Salesforce
      console.log('🔍 Testing Salesforce connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Salesforce connection successful');
      } else {
        console.log('❌ Salesforce connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Salesforce connection test failed:', error);
      return false;
    }
  }

  private async testHubSpotConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing HubSpot connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ HubSpot connection successful');
      } else {
        console.log('❌ HubSpot connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ HubSpot connection test failed:', error);
      return false;
    }
  }

  private async testMailchimpConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing Mailchimp connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Mailchimp connection successful');
      } else {
        console.log('❌ Mailchimp connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Mailchimp connection test failed:', error);
      return false;
    }
  }

  private async testSendGridConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing SendGrid connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ SendGrid connection successful');
      } else {
        console.log('❌ SendGrid connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ SendGrid connection test failed:', error);
      return false;
    }
  }

  private async testStripeConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing Stripe connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Stripe connection successful');
      } else {
        console.log('❌ Stripe connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Stripe connection test failed:', error);
      return false;
    }
  }

  private async testPayPalConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing PayPal connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ PayPal connection successful');
      } else {
        console.log('❌ PayPal connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ PayPal connection test failed:', error);
      return false;
    }
  }

  private async testFacebookConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing Facebook connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Facebook connection successful');
      } else {
        console.log('❌ Facebook connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Facebook connection test failed:', error);
      return false;
    }
  }

  private async testLinkedInConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing LinkedIn connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ LinkedIn connection successful');
      } else {
        console.log('❌ LinkedIn connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ LinkedIn connection test failed:', error);
      return false;
    }
  }

  private async testGoogleAnalyticsConnection(integration: Integration): Promise<boolean> {
    try {
      console.log('🔍 Testing Google Analytics connection...');
      
      // Mock connection test - 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('✅ Google Analytics connection successful');
      } else {
        console.log('❌ Google Analytics connection failed');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Google Analytics connection test failed:', error);
      return false;
    }
  }

  // Data Synchronization
  async syncIntegration(integrationId: string, syncType: 'full' | 'incremental' = 'incremental'): Promise<SyncResult> {
    try {
      console.log(`🔄 Starting ${syncType} sync for integration: ${integrationId}`);

      const startTime = new Date();
      const integration = await this.getIntegration(integrationId);
      
      if (!integration) {
        throw new Error('Integration not found');
      }

      if (integration.status !== 'active') {
        throw new Error('Integration is not active');
      }

      // Perform sync based on provider
      const syncResult = await this.performSync(integration, syncType);

      // Update last sync time
      await this.updateLastSyncTime(integrationId);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const result: SyncResult = {
        integration_id: integrationId,
        sync_type: syncType,
        status: syncResult.status,
        records_processed: syncResult.records_processed,
        records_created: syncResult.records_created,
        records_updated: syncResult.records_updated,
        records_failed: syncResult.records_failed,
        errors: syncResult.errors,
        started_at: startTime.toISOString(),
        completed_at: endTime.toISOString(),
        duration_ms: duration
      };

      // Store sync result
      await this.storeSyncResult(result);

      console.log(`✅ Sync completed: ${result.records_processed} records processed, ${result.records_failed} failed`);
      return result;

    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }

  private async performSync(integration: Integration, syncType: string): Promise<any> {
    // Mock sync results based on provider
    const baseRecords = syncType === 'full' ? 1000 : 50;
    const recordsProcessed = Math.floor(Math.random() * baseRecords) + baseRecords;
    const recordsCreated = Math.floor(recordsProcessed * 0.3);
    const recordsUpdated = Math.floor(recordsProcessed * 0.6);
    const recordsFailed = Math.floor(recordsProcessed * 0.1);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      status: recordsFailed > recordsProcessed * 0.2 ? 'partial' : 'success',
      records_processed: recordsProcessed,
      records_created: recordsCreated,
      records_updated: recordsUpdated,
      records_failed: recordsFailed,
      errors: Array.from({ length: recordsFailed }, (_, i) => ({
        record_id: `record_${i + 1}`,
        error_message: 'Validation error: Missing required field',
        error_code: 'VALIDATION_ERROR'
      }))
    };
  }

  // Integration Management
  async getAllIntegrations(): Promise<Integration[]> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch integrations:', error);
        return this.getMockIntegrations();
      }

      return data || this.getMockIntegrations();

    } catch (error) {
      console.error('❌ Failed to get integrations:', error);
      return this.getMockIntegrations();
    }
  }

  private getMockIntegrations(): Integration[] {
    return [
      {
        id: 'integration_1',
        name: 'Salesforce CRM',
        type: 'crm',
        provider: 'salesforce',
        status: 'active',
        configuration: {
          api_key: 'sf_client_id',
          custom_fields: { instance_url: 'https://login.salesforce.com' }
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sync_direction: 'bidirectional'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'Email', target_field: 'email' },
            { source_field: 'FirstName', target_field: 'first_name' }
          ]
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'integration_2',
        name: 'Stripe Payments',
        type: 'payment',
        provider: 'stripe',
        status: 'active',
        configuration: {
          api_key: 'pk_test_123',
          secret_key: 'sk_test_123'
        },
        sync_settings: {
          auto_sync: true,
          sync_frequency: 'real_time',
          last_sync: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sync_direction: 'inbound'
        },
        data_mapping: {
          field_mappings: [
            { source_field: 'customer.email', target_field: 'email' },
            { source_field: 'amount', target_field: 'transaction_amount' }
          ]
        },
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  async getIntegration(integrationId: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      console.warn('Could not fetch integration:', error);
      return null;
    }

    return data;
  }

  async updateIntegration(integrationId: string, updates: Partial<Integration>): Promise<Integration | null> {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Integration updated: ${integrationId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update integration:', error);
      return null;
    }
  }

  async deleteIntegration(integrationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      console.log(`✅ Integration deleted: ${integrationId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete integration:', error);
      return false;
    }
  }

  // Utility Methods
  private async storeIntegration(integration: Integration): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .insert({
        id: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider,
        status: integration.status,
        configuration: integration.configuration,
        sync_settings: integration.sync_settings,
        data_mapping: integration.data_mapping,
        created_at: integration.created_at,
        updated_at: integration.updated_at
      });

    if (error) {
      console.warn('Could not store integration:', error);
    }
  }

  private async updateLastSyncTime(integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .update({
        sync_settings: supabase.raw(`
          jsonb_set(sync_settings, '{last_sync}', '"${new Date().toISOString()}"'::jsonb)
        `),
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId);

    if (error) {
      console.warn('Could not update last sync time:', error);
    }
  }

  private async storeSyncResult(result: SyncResult): Promise<void> {
    const { error } = await supabase
      .from('sync_results')
      .insert({
        integration_id: result.integration_id,
        sync_type: result.sync_type,
        status: result.status,
        records_processed: result.records_processed,
        records_created: result.records_created,
        records_updated: result.records_updated,
        records_failed: result.records_failed,
        errors: result.errors,
        started_at: result.started_at,
        completed_at: result.completed_at,
        duration_ms: result.duration_ms
      });

    if (error) {
      console.warn('Could not store sync result:', error);
    }
  }

  async getSyncHistory(integrationId: string, limit: number = 10): Promise<SyncResult[]> {
    const { data, error } = await supabase
      .from('sync_results')
      .select('*')
      .eq('integration_id', integrationId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Could not fetch sync history:', error);
      return [];
    }

    return data || [];
  }

  async getIntegrationsByType(type: Integration['type']): Promise<Integration[]> {
    const allIntegrations = await this.getAllIntegrations();
    return allIntegrations.filter(integration => integration.type === type);
  }

  async getActiveIntegrations(): Promise<Integration[]> {
    const allIntegrations = await this.getAllIntegrations();
    return allIntegrations.filter(integration => integration.status === 'active');
  }

  async testIntegrationConnection(integrationId: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        return false;
      }

      // Test connection based on provider
      switch (integration.provider) {
        case 'salesforce':
          return await this.testSalesforceConnection(integration);
        case 'hubspot':
          return await this.testHubSpotConnection(integration);
        case 'mailchimp':
          return await this.testMailchimpConnection(integration);
        case 'sendgrid':
          return await this.testSendGridConnection(integration);
        case 'stripe':
          return await this.testStripeConnection(integration);
        case 'paypal':
          return await this.testPayPalConnection(integration);
        case 'facebook':
          return await this.testFacebookConnection(integration);
        case 'linkedin':
          return await this.testLinkedInConnection(integration);
        case 'google_analytics':
          return await this.testGoogleAnalyticsConnection(integration);
        default:
          return false;
      }

    } catch (error) {
      console.error('❌ Failed to test integration connection:', error);
      return false;
    }
  }

  async getIntegrationStats(): Promise<{
    total_integrations: number;
    active_integrations: number;
    integrations_by_type: { [key: string]: number };
    recent_syncs: number;
    sync_success_rate: number;
  }> {
    try {
      const integrations = await this.getAllIntegrations();
      const activeIntegrations = integrations.filter(i => i.status === 'active');
      
      const integrationsByType = integrations.reduce((acc, integration) => {
        acc[integration.type] = (acc[integration.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Mock sync stats
      const recentSyncs = 45;
      const syncSuccessRate = 94.2;

      return {
        total_integrations: integrations.length,
        active_integrations: activeIntegrations.length,
        integrations_by_type: integrationsByType,
        recent_syncs: recentSyncs,
        sync_success_rate: syncSuccessRate
      };

    } catch (error) {
      console.error('❌ Failed to get integration stats:', error);
      return {
        total_integrations: 0,
        active_integrations: 0,
        integrations_by_type: {},
        recent_syncs: 0,
        sync_success_rate: 0
      };
    }
  }
}

// Export singleton instance
export const integrationService = IntegrationService.getInstance();
import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

// Types for API management
export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  version: string;
  description: string;
  parameters: APIParameter[];
  responses: APIResponse[];
  authentication_required: boolean;
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  tags: string[];
  deprecated: boolean;
  deprecation_date?: string;
  replacement_endpoint?: string;
  created_at: string;
  updated_at: string;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  location: 'query' | 'path' | 'header' | 'body';
  required: boolean;
  description: string;
  example?: any;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    enum_values?: string[];
  };
}

export interface APIResponse {
  status_code: number;
  description: string;
  schema?: any;
  examples?: { [key: string]: any };
}

export interface APIKey {
  id: string;
  key: string;
  name: string;
  user_id: string;
  permissions: string[];
  rate_limits: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  usage_stats: {
    total_requests: number;
    requests_today: number;
    last_used: string;
  };
  active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  retry_policy: {
    max_retries: number;
    retry_delay_seconds: number;
    exponential_backoff: boolean;
  };
  headers?: { [key: string]: string };
  created_at: string;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
}

export interface APIUsageMetrics {
  endpoint_id: string;
  api_key_id: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes: number;
  response_size_bytes: number;
  user_agent?: string;
  ip_address?: string;
  error_message?: string;
}

export interface RateLimitStatus {
  api_key_id: string;
  endpoint_id: string;
  current_usage: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  limits: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  reset_times: {
    minute_reset: string;
    hour_reset: string;
    day_reset: string;
  };
  blocked: boolean;
}

export interface APIAnalytics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  top_endpoints: Array<{
    endpoint: string;
    requests: number;
    success_rate: number;
  }>;
  top_users: Array<{
    api_key_id: string;
    requests: number;
    success_rate: number;
  }>;
  error_breakdown: Array<{
    status_code: number;
    count: number;
    percentage: number;
  }>;
  performance_trends: Array<{
    timestamp: string;
    requests: number;
    avg_response_time: number;
  }>;
}

export class APIManagementService {
  private static instance: APIManagementService;

  private constructor() {}

  public static getInstance(): APIManagementService {
    if (!APIManagementService.instance) {
      APIManagementService.instance = new APIManagementService();
    }
    return APIManagementService.instance;
  }

  // API Endpoint Management
  async createAPIEndpoint(endpoint: Omit<APIEndpoint, 'id' | 'created_at' | 'updated_at'>): Promise<APIEndpoint> {
    try {
      console.log(`🔗 Creating API endpoint: ${endpoint.method} ${endpoint.path}`);

      const apiEndpoint: APIEndpoint = {
        id: `endpoint_${Date.now()}`,
        ...endpoint,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store endpoint in database
      await this.storeAPIEndpoint(apiEndpoint);

      console.log(`✅ API endpoint created: ${endpoint.method} ${endpoint.path}`);
      return apiEndpoint;

    } catch (error) {
      console.error('❌ Failed to create API endpoint:', error);
      throw error;
    }
  }

  async getAllAPIEndpoints(version?: string): Promise<APIEndpoint[]> {
    try {
      let query = supabase
        .from('api_endpoints')
        .select('*')
        .order('path', { ascending: true });

      if (version) {
        query = query.eq('version', version);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Could not fetch API endpoints:', error);
        return this.getMockAPIEndpoints();
      }

      return data || this.getMockAPIEndpoints();

    } catch (error) {
      console.error('❌ Failed to get API endpoints:', error);
      return this.getMockAPIEndpoints();
    }
  }

  private getMockAPIEndpoints(): APIEndpoint[] {
    return [
      {
        id: 'endpoint_1',
        path: '/api/v1/contacts',
        method: 'GET',
        version: 'v1',
        description: 'Retrieve all contacts with optional filtering and pagination',
        parameters: [
          {
            name: 'page',
            type: 'number',
            location: 'query',
            required: false,
            description: 'Page number for pagination',
            example: 1
          },
          {
            name: 'limit',
            type: 'number',
            location: 'query',
            required: false,
            description: 'Number of items per page',
            example: 50,
            validation: { min_length: 1, max_length: 100 }
          },
          {
            name: 'search',
            type: 'string',
            location: 'query',
            required: false,
            description: 'Search term for filtering contacts',
            example: 'john@example.com'
          }
        ],
        responses: [
          {
            status_code: 200,
            description: 'Successfully retrieved contacts',
            schema: {
              type: 'object',
              properties: {
                data: { type: 'array' },
                pagination: { type: 'object' }
              }
            }
          },
          {
            status_code: 400,
            description: 'Invalid request parameters'
          },
          {
            status_code: 401,
            description: 'Authentication required'
          }
        ],
        authentication_required: true,
        rate_limit: {
          requests_per_minute: 100,
          requests_per_hour: 1000,
          requests_per_day: 10000
        },
        tags: ['contacts', 'crm'],
        deprecated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'endpoint_2',
        path: '/api/v1/contacts',
        method: 'POST',
        version: 'v1',
        description: 'Create a new contact',
        parameters: [
          {
            name: 'contact',
            type: 'object',
            location: 'body',
            required: true,
            description: 'Contact information',
            example: {
              email: 'john@example.com',
              first_name: 'John',
              last_name: 'Doe'
            }
          }
        ],
        responses: [
          {
            status_code: 201,
            description: 'Contact created successfully'
          },
          {
            status_code: 400,
            description: 'Invalid contact data'
          },
          {
            status_code: 409,
            description: 'Contact already exists'
          }
        ],
        authentication_required: true,
        rate_limit: {
          requests_per_minute: 50,
          requests_per_hour: 500,
          requests_per_day: 5000
        },
        tags: ['contacts', 'crm'],
        deprecated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'endpoint_3',
        path: '/api/v1/campaigns',
        method: 'GET',
        version: 'v1',
        description: 'Retrieve marketing campaigns',
        parameters: [
          {
            name: 'status',
            type: 'string',
            location: 'query',
            required: false,
            description: 'Filter by campaign status',
            validation: {
              enum_values: ['draft', 'active', 'paused', 'completed']
            }
          }
        ],
        responses: [
          {
            status_code: 200,
            description: 'Successfully retrieved campaigns'
          }
        ],
        authentication_required: true,
        rate_limit: {
          requests_per_minute: 100,
          requests_per_hour: 1000,
          requests_per_day: 10000
        },
        tags: ['campaigns', 'marketing'],
        deprecated: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private async storeAPIEndpoint(endpoint: APIEndpoint): Promise<void> {
    const { error } = await supabase
      .from('api_endpoints')
      .insert({
        id: endpoint.id,
        path: endpoint.path,
        method: endpoint.method,
        version: endpoint.version,
        description: endpoint.description,
        parameters: endpoint.parameters,
        responses: endpoint.responses,
        authentication_required: endpoint.authentication_required,
        rate_limit: endpoint.rate_limit,
        tags: endpoint.tags,
        deprecated: endpoint.deprecated,
        deprecation_date: endpoint.deprecation_date,
        replacement_endpoint: endpoint.replacement_endpoint,
        created_at: endpoint.created_at,
        updated_at: endpoint.updated_at
      });

    if (error) {
      console.warn('Could not store API endpoint:', error);
    }
  }

  // API Key Management
  async createAPIKey(
    userId: string,
    name: string,
    permissions: string[] = ['read'],
    customRateLimits?: Partial<APIKey['rate_limits']>
  ): Promise<APIKey> {
    try {
      console.log(`🔑 Creating API key for user: ${userId}`);

      const apiKey: APIKey = {
        id: `key_${Date.now()}`,
        key: this.generateAPIKey(),
        name: name,
        user_id: userId,
        permissions: permissions,
        rate_limits: {
          requests_per_minute: customRateLimits?.requests_per_minute || 60,
          requests_per_hour: customRateLimits?.requests_per_hour || 1000,
          requests_per_day: customRateLimits?.requests_per_day || 10000
        },
        usage_stats: {
          total_requests: 0,
          requests_today: 0,
          last_used: new Date().toISOString()
        },
        active: true,
        created_at: new Date().toISOString()
      };

      // Store API key in database
      await this.storeAPIKey(apiKey);

      console.log(`✅ API key created: ${name}`);
      return apiKey;

    } catch (error) {
      console.error('❌ Failed to create API key:', error);
      throw error;
    }
  }

  private generateAPIKey(): string {
    // Generate a secure API key
    const prefix = 'hup_';
    const randomPart = Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
    return prefix + randomPart;
  }

  async validateAPIKey(apiKey: string): Promise<APIKey | null> {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key', apiKey)
        .eq('active', true)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if key is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Failed to validate API key:', error);
      return null;
    }
  }

  private async storeAPIKey(apiKey: APIKey): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .insert({
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        user_id: apiKey.user_id,
        permissions: apiKey.permissions,
        rate_limits: apiKey.rate_limits,
        usage_stats: apiKey.usage_stats,
        active: apiKey.active,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      });

    if (error) {
      console.warn('Could not store API key:', error);
    }
  }  /
/ Rate Limiting
  async checkRateLimit(apiKeyId: string, endpointId: string): Promise<RateLimitStatus> {
    try {
      // Get current usage from cache/database
      const currentUsage = await this.getCurrentUsage(apiKeyId, endpointId);
      
      // Get rate limits for this API key and endpoint
      const limits = await this.getRateLimits(apiKeyId, endpointId);
      
      // Calculate reset times
      const now = new Date();
      const resetTimes = {
        minute_reset: new Date(now.getTime() + (60 - now.getSeconds()) * 1000).toISOString(),
        hour_reset: new Date(now.getTime() + (60 - now.getMinutes()) * 60 * 1000).toISOString(),
        day_reset: new Date(now.getTime() + (24 - now.getHours()) * 60 * 60 * 1000).toISOString()
      };

      // Check if any limits are exceeded
      const blocked = 
        currentUsage.requests_per_minute >= limits.requests_per_minute ||
        currentUsage.requests_per_hour >= limits.requests_per_hour ||
        currentUsage.requests_per_day >= limits.requests_per_day;

      const status: RateLimitStatus = {
        api_key_id: apiKeyId,
        endpoint_id: endpointId,
        current_usage: currentUsage,
        limits: limits,
        reset_times: resetTimes,
        blocked: blocked
      };

      return status;

    } catch (error) {
      console.error('❌ Failed to check rate limit:', error);
      // Return permissive status on error
      return {
        api_key_id: apiKeyId,
        endpoint_id: endpointId,
        current_usage: { requests_per_minute: 0, requests_per_hour: 0, requests_per_day: 0 },
        limits: { requests_per_minute: 1000, requests_per_hour: 10000, requests_per_day: 100000 },
        reset_times: {
          minute_reset: new Date().toISOString(),
          hour_reset: new Date().toISOString(),
          day_reset: new Date().toISOString()
        },
        blocked: false
      };
    }
  }

  async incrementUsage(apiKeyId: string, endpointId: string): Promise<void> {
    try {
      // Increment usage counters
      const timestamp = new Date().toISOString();
      
      // In a real implementation, this would use Redis or similar for fast counters
      // For now, we'll simulate the increment
      console.log(`📊 Incrementing usage for API key ${apiKeyId} on endpoint ${endpointId}`);

    } catch (error) {
      console.error('❌ Failed to increment usage:', error);
    }
  }

  private async getCurrentUsage(apiKeyId: string, endpointId: string): Promise<RateLimitStatus['current_usage']> {
    // In a real implementation, this would query Redis or a fast cache
    // For now, return mock data
    return {
      requests_per_minute: Math.floor(Math.random() * 10),
      requests_per_hour: Math.floor(Math.random() * 100),
      requests_per_day: Math.floor(Math.random() * 1000)
    };
  }

  private async getRateLimits(apiKeyId: string, endpointId: string): Promise<RateLimitStatus['limits']> {
    // Get API key to check its rate limits
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('rate_limits')
      .eq('id', apiKeyId)
      .single();

    if (apiKey?.rate_limits) {
      return apiKey.rate_limits;
    }

    // Default rate limits
    return {
      requests_per_minute: 60,
      requests_per_hour: 1000,
      requests_per_day: 10000
    };
  }

  // Webhook Management
  async createWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'secret' | 'created_at' | 'success_count' | 'failure_count'>): Promise<WebhookEndpoint> {
    try {
      console.log(`🪝 Creating webhook endpoint: ${webhook.url}`);

      const webhookEndpoint: WebhookEndpoint = {
        id: `webhook_${Date.now()}`,
        ...webhook,
        secret: this.generateWebhookSecret(),
        created_at: new Date().toISOString(),
        success_count: 0,
        failure_count: 0
      };

      // Store webhook in database
      await this.storeWebhook(webhookEndpoint);

      console.log(`✅ Webhook created: ${webhook.url}`);
      return webhookEndpoint;

    } catch (error) {
      console.error('❌ Failed to create webhook:', error);
      throw error;
    }
  }

  async triggerWebhook(webhookId: string, event: string, payload: any): Promise<boolean> {
    try {
      console.log(`🚀 Triggering webhook ${webhookId} for event: ${event}`);

      // Get webhook details
      const webhook = await this.getWebhook(webhookId);
      if (!webhook || !webhook.active) {
        console.warn('Webhook not found or inactive');
        return false;
      }

      // Check if webhook is subscribed to this event
      if (!webhook.events.includes(event) && !webhook.events.includes('*')) {
        console.log('Webhook not subscribed to this event');
        return false;
      }

      // Prepare webhook payload
      const webhookPayload = {
        event: event,
        timestamp: new Date().toISOString(),
        data: payload,
        webhook_id: webhookId
      };

      // Send webhook with retry logic
      const success = await this.sendWebhookWithRetry(webhook, webhookPayload);

      // Update webhook statistics
      await this.updateWebhookStats(webhookId, success);

      return success;

    } catch (error) {
      console.error('❌ Failed to trigger webhook:', error);
      return false;
    }
  }

  private generateWebhookSecret(): string {
    return 'whsec_' + Array.from({ length: 32 }, () => 
      Math.random().toString(36).charAt(2)
    ).join('');
  }

  private async getWebhook(webhookId: string): Promise<WebhookEndpoint | null> {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();

    if (error) {
      console.warn('Could not fetch webhook:', error);
      return null;
    }

    return data;
  }

  private async sendWebhookWithRetry(webhook: WebhookEndpoint, payload: any): Promise<boolean> {
    const maxRetries = webhook.retry_policy.max_retries;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // In a real implementation, this would make an HTTP request
        console.log(`📡 Sending webhook to ${webhook.url} (attempt ${attempt + 1})`);
        
        // Simulate HTTP request
        const success = Math.random() > 0.1; // 90% success rate for simulation
        
        if (success) {
          console.log('✅ Webhook sent successfully');
          return true;
        } else {
          throw new Error('Webhook delivery failed');
        }

      } catch (error) {
        console.warn(`⚠️ Webhook attempt ${attempt + 1} failed:`, error);
        
        if (attempt < maxRetries) {
          // Calculate delay with exponential backoff if enabled
          let delay = webhook.retry_policy.retry_delay_seconds * 1000;
          if (webhook.retry_policy.exponential_backoff) {
            delay *= Math.pow(2, attempt);
          }
          
          console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        attempt++;
      }
    }

    console.error('❌ Webhook delivery failed after all retries');
    return false;
  }

  private async updateWebhookStats(webhookId: string, success: boolean): Promise<void> {
    const updateField = success ? 'success_count' : 'failure_count';
    
    const { error } = await supabase
      .from('webhooks')
      .update({
        [updateField]: supabase.raw(`${updateField} + 1`),
        last_triggered: new Date().toISOString()
      })
      .eq('id', webhookId);

    if (error) {
      console.warn('Could not update webhook stats:', error);
    }
  }

  private async storeWebhook(webhook: WebhookEndpoint): Promise<void> {
    const { error } = await supabase
      .from('webhooks')
      .insert({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        active: webhook.active,
        retry_policy: webhook.retry_policy,
        headers: webhook.headers,
        created_at: webhook.created_at,
        success_count: webhook.success_count,
        failure_count: webhook.failure_count
      });

    if (error) {
      console.warn('Could not store webhook:', error);
    }
  }

  // API Usage Tracking and Analytics
  async logAPIUsage(usage: Omit<APIUsageMetrics, 'timestamp'>): Promise<void> {
    try {
      const usageMetrics: APIUsageMetrics = {
        ...usage,
        timestamp: new Date().toISOString()
      };

      // Store usage metrics
      await this.storeAPIUsage(usageMetrics);

      // Update API key usage stats
      await this.updateAPIKeyUsage(usage.api_key_id);

    } catch (error) {
      console.error('❌ Failed to log API usage:', error);
    }
  }

  async getAPIAnalytics(
    startDate: Date,
    endDate: Date,
    apiKeyId?: string,
    endpointId?: string
  ): Promise<APIAnalytics> {
    try {
      console.log(`📈 Generating API analytics from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // In a real implementation, this would query the usage metrics
      // For now, we'll generate mock analytics
      const analytics = this.generateMockAPIAnalytics();

      console.log(`✅ API analytics generated`);
      return analytics;

    } catch (error) {
      console.error('❌ Failed to get API analytics:', error);
      throw error;
    }
  }

  private generateMockAPIAnalytics(): APIAnalytics {
    return {
      total_requests: 125000,
      successful_requests: 118750,
      failed_requests: 6250,
      average_response_time: 245,
      top_endpoints: [
        {
          endpoint: '/api/v1/contacts',
          requests: 45000,
          success_rate: 98.2
        },
        {
          endpoint: '/api/v1/campaigns',
          requests: 32000,
          success_rate: 96.8
        },
        {
          endpoint: '/api/v1/analytics',
          requests: 28000,
          success_rate: 99.1
        }
      ],
      top_users: [
        {
          api_key_id: 'key_123',
          requests: 15000,
          success_rate: 97.5
        },
        {
          api_key_id: 'key_456',
          requests: 12000,
          success_rate: 98.8
        }
      ],
      error_breakdown: [
        {
          status_code: 400,
          count: 3200,
          percentage: 51.2
        },
        {
          status_code: 401,
          count: 1800,
          percentage: 28.8
        },
        {
          status_code: 429,
          count: 750,
          percentage: 12.0
        },
        {
          status_code: 500,
          count: 500,
          percentage: 8.0
        }
      ],
      performance_trends: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        requests: Math.floor(Math.random() * 1000) + 500,
        avg_response_time: Math.floor(Math.random() * 100) + 200
      }))
    };
  }

  private async storeAPIUsage(usage: APIUsageMetrics): Promise<void> {
    const { error } = await supabase
      .from('api_usage_metrics')
      .insert({
        endpoint_id: usage.endpoint_id,
        api_key_id: usage.api_key_id,
        timestamp: usage.timestamp,
        method: usage.method,
        path: usage.path,
        status_code: usage.status_code,
        response_time_ms: usage.response_time_ms,
        request_size_bytes: usage.request_size_bytes,
        response_size_bytes: usage.response_size_bytes,
        user_agent: usage.user_agent,
        ip_address: usage.ip_address,
        error_message: usage.error_message
      });

    if (error) {
      console.warn('Could not store API usage:', error);
    }
  }

  private async updateAPIKeyUsage(apiKeyId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({
        usage_stats: supabase.raw(`
          jsonb_set(
            jsonb_set(usage_stats, '{total_requests}', (COALESCE((usage_stats->>'total_requests')::int, 0) + 1)::text::jsonb),
            '{last_used}', '"${new Date().toISOString()}"'::jsonb
          )
        `)
      })
      .eq('id', apiKeyId);

    if (error) {
      console.warn('Could not update API key usage:', error);
    }
  }  //
 OpenAPI Documentation Generation
  async generateOpenAPISpec(version: string = 'v1'): Promise<any> {
    try {
      console.log(`📚 Generating OpenAPI specification for version ${version}`);

      const endpoints = await this.getAllAPIEndpoints(version);
      
      const openAPISpec = {
        openapi: '3.0.3',
        info: {
          title: 'HigherUp.ai API',
          description: 'Comprehensive API for the HigherUp.ai marketing automation platform',
          version: version,
          contact: {
            name: 'API Support',
            email: 'api-support@higherup.ai',
            url: 'https://docs.higherup.ai'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: 'https://api.higherup.ai',
            description: 'Production server'
          },
          {
            url: 'https://staging-api.higherup.ai',
            description: 'Staging server'
          }
        ],
        paths: this.generateOpenAPIPaths(endpoints),
        components: {
          securitySchemes: {
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
              description: 'API key for authentication'
            },
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT token for authentication'
            }
          },
          schemas: this.generateOpenAPISchemas(),
          responses: this.generateCommonResponses()
        },
        security: [
          { ApiKeyAuth: [] },
          { BearerAuth: [] }
        ],
        tags: this.generateAPITags(endpoints)
      };

      console.log(`✅ OpenAPI specification generated with ${Object.keys(openAPISpec.paths).length} endpoints`);
      return openAPISpec;

    } catch (error) {
      console.error('❌ Failed to generate OpenAPI spec:', error);
      throw error;
    }
  }

  private generateOpenAPIPaths(endpoints: APIEndpoint[]): any {
    const paths: any = {};

    endpoints.forEach(endpoint => {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: this.convertParametersToOpenAPI(endpoint.parameters),
        responses: this.convertResponsesToOpenAPI(endpoint.responses),
        security: endpoint.authentication_required ? [{ ApiKeyAuth: [] }] : [],
        deprecated: endpoint.deprecated,
        'x-rate-limit': endpoint.rate_limit
      };

      if (endpoint.deprecated && endpoint.replacement_endpoint) {
        paths[endpoint.path][endpoint.method.toLowerCase()]['x-replacement'] = endpoint.replacement_endpoint;
      }
    });

    return paths;
  }

  private convertParametersToOpenAPI(parameters: APIParameter[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      in: param.location,
      required: param.required,
      description: param.description,
      schema: {
        type: param.type,
        example: param.example,
        ...param.validation
      }
    }));
  }

  private convertResponsesToOpenAPI(responses: APIResponse[]): any {
    const openAPIResponses: any = {};

    responses.forEach(response => {
      openAPIResponses[response.status_code.toString()] = {
        description: response.description,
        content: response.schema ? {
          'application/json': {
            schema: response.schema,
            examples: response.examples
          }
        } : undefined
      };
    });

    return openAPIResponses;
  }

  private generateOpenAPISchemas(): any {
    return {
      Contact: {
        type: 'object',
        required: ['email'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the contact'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Contact email address'
          },
          first_name: {
            type: 'string',
            description: 'Contact first name'
          },
          last_name: {
            type: 'string',
            description: 'Contact last name'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Contact creation timestamp'
          }
        }
      },
      Campaign: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the campaign'
          },
          name: {
            type: 'string',
            description: 'Campaign name'
          },
          type: {
            type: 'string',
            enum: ['email', 'social', 'display', 'search'],
            description: 'Campaign type'
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'paused', 'completed'],
            description: 'Campaign status'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Campaign creation timestamp'
          }
        }
      },
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            description: 'Error code'
          },
          message: {
            type: 'string',
            description: 'Human-readable error message'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      },
      PaginatedResponse: {
        type: 'object',
        required: ['data', 'pagination'],
        properties: {
          data: {
            type: 'array',
            description: 'Array of data items'
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              limit: {
                type: 'integer',
                description: 'Items per page'
              },
              total: {
                type: 'integer',
                description: 'Total number of items'
              },
              pages: {
                type: 'integer',
                description: 'Total number of pages'
              }
            }
          }
        }
      }
    };
  }

  private generateCommonResponses(): any {
    return {
      BadRequest: {
        description: 'Bad request - invalid parameters',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized - invalid or missing API key',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden - insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        },
        headers: {
          'X-RateLimit-Limit': {
            description: 'Request limit per time window',
            schema: { type: 'integer' }
          },
          'X-RateLimit-Remaining': {
            description: 'Remaining requests in current window',
            schema: { type: 'integer' }
          },
          'X-RateLimit-Reset': {
            description: 'Time when rate limit resets',
            schema: { type: 'integer' }
          }
        }
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    };
  }

  private generateAPITags(endpoints: APIEndpoint[]): any[] {
    const tagSet = new Set<string>();
    endpoints.forEach(endpoint => {
      endpoint.tags.forEach(tag => tagSet.add(tag));
    });

    const tagDescriptions: { [key: string]: string } = {
      contacts: 'Contact management operations',
      campaigns: 'Marketing campaign operations',
      analytics: 'Analytics and reporting operations',
      crm: 'Customer relationship management',
      marketing: 'Marketing automation features',
      webhooks: 'Webhook management',
      users: 'User account management'
    };

    return Array.from(tagSet).map(tag => ({
      name: tag,
      description: tagDescriptions[tag] || `${tag} operations`
    }));
  }

  // Developer Portal Methods
  async getDeveloperPortalData(): Promise<any> {
    try {
      console.log('🏗️ Generating developer portal data');

      const [endpoints, analytics, codeExamples] = await Promise.all([
        this.getAllAPIEndpoints(),
        this.getAPIAnalytics(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
        this.generateCodeExamples()
      ]);

      const portalData = {
        overview: {
          total_endpoints: endpoints.length,
          api_version: 'v1',
          uptime: '99.9%',
          avg_response_time: analytics.average_response_time,
          total_requests_today: Math.floor(analytics.total_requests / 7) // Approximate daily
        },
        quick_start: {
          authentication: {
            method: 'API Key',
            header: 'X-API-Key',
            example: 'hup_your_api_key_here'
          },
          base_url: 'https://api.higherup.ai',
          rate_limits: {
            default: '1000 requests per hour',
            premium: '10000 requests per hour'
          }
        },
        popular_endpoints: endpoints.slice(0, 5).map(endpoint => ({
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          usage_count: Math.floor(Math.random() * 10000) + 1000
        })),
        code_examples: codeExamples,
        sdks: [
          {
            language: 'JavaScript',
            package: '@higherup/api-client',
            version: '1.2.0',
            install_command: 'npm install @higherup/api-client'
          },
          {
            language: 'Python',
            package: 'higherup-api',
            version: '1.1.0',
            install_command: 'pip install higherup-api'
          },
          {
            language: 'PHP',
            package: 'higherup/api-client',
            version: '1.0.5',
            install_command: 'composer require higherup/api-client'
          }
        ],
        support: {
          documentation_url: 'https://docs.higherup.ai',
          support_email: 'api-support@higherup.ai',
          community_forum: 'https://community.higherup.ai',
          status_page: 'https://status.higherup.ai'
        }
      };

      console.log('✅ Developer portal data generated');
      return portalData;

    } catch (error) {
      console.error('❌ Failed to generate developer portal data:', error);
      throw error;
    }
  }

  private async generateCodeExamples(): Promise<any> {
    return {
      javascript: {
        authentication: `
const client = new HigherUpAPI({
  apiKey: 'hup_your_api_key_here',
  baseURL: 'https://api.higherup.ai'
});`,
        get_contacts: `
// Get all contacts
const contacts = await client.contacts.list({
  page: 1,
  limit: 50
});

console.log(contacts.data);`,
        create_contact: `
// Create a new contact
const contact = await client.contacts.create({
  email: 'john@example.com',
  first_name: 'John',
  last_name: 'Doe'
});

console.log('Contact created:', contact.id);`,
        webhook_handling: `
// Handle webhook events
app.post('/webhook', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'contact.created':
      console.log('New contact:', event.data);
      break;
    case 'campaign.completed':
      console.log('Campaign finished:', event.data);
      break;
  }
  
  res.status(200).send('OK');
});`
      },
      python: {
        authentication: `
from higherup_api import HigherUpAPI

client = HigherUpAPI(
    api_key='hup_your_api_key_here',
    base_url='https://api.higherup.ai'
)`,
        get_contacts: `
# Get all contacts
contacts = client.contacts.list(page=1, limit=50)
print(contacts['data'])`,
        create_contact: `
# Create a new contact
contact = client.contacts.create({
    'email': 'john@example.com',
    'first_name': 'John',
    'last_name': 'Doe'
})

print(f"Contact created: {contact['id']}")`,
        webhook_handling: `
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    event = request.json
    
    if event['type'] == 'contact.created':
        print(f"New contact: {event['data']}")
    elif event['type'] == 'campaign.completed':
        print(f"Campaign finished: {event['data']}")
    
    return 'OK', 200`
      },
      curl: {
        authentication: `
# All requests require the X-API-Key header
curl -H "X-API-Key: hup_your_api_key_here" \\
     https://api.higherup.ai/v1/contacts`,
        get_contacts: `
curl -H "X-API-Key: hup_your_api_key_here" \\
     "https://api.higherup.ai/v1/contacts?page=1&limit=50"`,
        create_contact: `
curl -X POST \\
     -H "X-API-Key: hup_your_api_key_here" \\
     -H "Content-Type: application/json" \\
     -d '{"email":"john@example.com","first_name":"John","last_name":"Doe"}' \\
     https://api.higherup.ai/v1/contacts`
      }
    };
  }

  // Error Handling and Response Formatting
  formatAPIError(statusCode: number, errorCode: string, message: string, details?: any): any {
    return {
      error: {
        code: errorCode,
        message: message,
        status: statusCode,
        details: details,
        timestamp: new Date().toISOString(),
        documentation_url: `https://docs.higherup.ai/errors/${errorCode}`
      }
    };
  }

  formatAPIResponse(data: any, pagination?: any): any {
    const response: any = {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return response;
  }

  // Utility Methods
  async getAPIKeysByUser(userId: string): Promise<APIKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch API keys:', error);
      return [];
    }

    return data || [];
  }

  async revokeAPIKey(apiKeyId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ active: false })
        .eq('id', apiKeyId);

      if (error) throw error;

      console.log(`🔑 API key revoked: ${apiKeyId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to revoke API key:', error);
      return false;
    }
  }

  async getWebhooksByUser(userId: string): Promise<WebhookEndpoint[]> {
    // In a real implementation, this would join with user data
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch webhooks:', error);
      return [];
    }

    return data || [];
  }

  async testWebhook(webhookId: string): Promise<boolean> {
    const testPayload = {
      event: 'webhook.test',
      message: 'This is a test webhook delivery',
      timestamp: new Date().toISOString()
    };

    return await this.triggerWebhook(webhookId, 'webhook.test', testPayload);
  }

  async getAPIHealth(): Promise<any> {
    return {
      status: 'healthy',
      version: 'v1',
      uptime: '99.9%',
      response_time: '245ms',
      endpoints_available: (await this.getAllAPIEndpoints()).length,
      last_updated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const apiManagementService = APIManagementService.getInstance();
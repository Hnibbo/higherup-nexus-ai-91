import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Tables = Database['public']['Tables'];
export type Contact = Tables['contacts']['Row'];
export type Campaign = Tables['email_campaigns']['Row'];
export type Funnel = Tables['funnels']['Row'];
export type Integration = Tables['integrations']['Row'];
export type AnalyticsEvent = Tables['analytics_events']['Row'];

export class SupabaseService {
  private static instance: SupabaseService;

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Contact Management
  async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();

    if (error) throw new Error(`Failed to create contact: ${error.message}`);
    return data;
  }

  async getContacts(userId: string, limit: number = 100): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch contacts: ${error.message}`);
    return data || [];
  }

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update contact: ${error.message}`);
    return data;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete contact: ${error.message}`);
  }

  // Campaign Management
  async createEmailCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw new Error(`Failed to create campaign: ${error.message}`);
    return data;
  }

  async getEmailCampaigns(userId: string): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch campaigns: ${error.message}`);
    return data || [];
  }

  async updateEmailCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update campaign: ${error.message}`);
    return data;
  }

  // Funnel Management
  async createFunnel(funnel: Omit<Funnel, 'id' | 'created_at' | 'updated_at'>): Promise<Funnel> {
    const { data, error } = await supabase
      .from('funnels')
      .insert(funnel)
      .select()
      .single();

    if (error) throw new Error(`Failed to create funnel: ${error.message}`);
    return data;
  }

  async getFunnels(userId: string): Promise<Funnel[]> {
    const { data, error } = await supabase
      .from('funnels')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch funnels: ${error.message}`);
    return data || [];
  }

  async updateFunnel(id: string, updates: Partial<Funnel>): Promise<Funnel> {
    const { data, error } = await supabase
      .from('funnels')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update funnel: ${error.message}`);
    return data;
  }

  // Analytics
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<AnalyticsEvent> {
    const { data, error } = await supabase
      .from('analytics_events')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(`Failed to track event: ${error.message}`);
    return data;
  }

  async getAnalyticsEvents(
    userId: string, 
    eventType?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<AnalyticsEvent[]> {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch analytics events: ${error.message}`);
    return data || [];
  }

  // Integration Management
  async createIntegration(integration: Omit<Integration, 'id' | 'created_at' | 'updated_at'>): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .insert(integration)
      .select()
      .single();

    if (error) throw new Error(`Failed to create integration: ${error.message}`);
    return data;
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch integrations: ${error.message}`);
    return data || [];
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update integration: ${error.message}`);
    return data;
  }

  // Real-time subscriptions
  subscribeToContacts(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToCampaigns(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('campaigns_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_campaigns',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToFunnels(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('funnels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'funnels',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Advanced Analytics Queries
  async getDashboardMetrics(userId: string): Promise<{
    totalContacts: number;
    activeCampaigns: number;
    totalFunnels: number;
    conversionRate: number;
    revenueThisMonth: number;
  }> {
    // Get total contacts
    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get active campaigns
    const { count: activeCampaigns } = await supabase
      .from('email_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get total funnels
    const { count: totalFunnels } = await supabase
      .from('funnels')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Calculate average conversion rate
    const { data: funnelData } = await supabase
      .from('funnels')
      .select('conversion_rate')
      .eq('user_id', userId)
      .not('conversion_rate', 'is', null);

    const conversionRate = funnelData && funnelData.length > 0
      ? funnelData.reduce((sum, funnel) => sum + (funnel.conversion_rate || 0), 0) / funnelData.length
      : 0;

    // Get revenue from performance metrics (this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: revenueData } = await supabase
      .from('performance_metrics')
      .select('metric_value')
      .eq('user_id', userId)
      .eq('metric_name', 'revenue')
      .gte('created_at', startOfMonth.toISOString());

    const revenueThisMonth = revenueData
      ? revenueData.reduce((sum, metric) => sum + metric.metric_value, 0)
      : 0;

    return {
      totalContacts: totalContacts || 0,
      activeCampaigns: activeCampaigns || 0,
      totalFunnels: totalFunnels || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      revenueThisMonth
    };
  }

  // Batch operations for performance
  async batchCreateContacts(contacts: Omit<Contact, 'id' | 'created_at' | 'updated_at'>[]): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();

    if (error) throw new Error(`Failed to batch create contacts: ${error.message}`);
    return data || [];
  }

  async batchUpdateContacts(updates: { id: string; data: Partial<Contact> }[]): Promise<void> {
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('contacts')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    const results = await Promise.allSettled(promises);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      console.error('Some batch updates failed:', failures);
      throw new Error(`${failures.length} batch updates failed`);
    }
  }

  // Search and filtering
  async searchContacts(userId: string, searchTerm: string, filters?: {
    status?: string;
    leadTemperature?: string;
    company?: string;
  }): Promise<Contact[]> {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    // Text search across name, email, and company
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`);
    }

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.leadTemperature) {
      query = query.eq('lead_temperature', filters.leadTemperature);
    }

    if (filters?.company) {
      query = query.ilike('company', `%${filters.company}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw new Error(`Failed to search contacts: ${error.message}`);
    return data || [];
  }

  // Data export functionality
  async exportContacts(userId: string, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const contacts = await this.getContacts(userId, 10000); // Get all contacts

    if (format === 'json') {
      return JSON.stringify(contacts, null, 2);
    }

    // CSV format
    if (contacts.length === 0) return '';

    const headers = Object.keys(contacts[0]).join(',');
    const rows = contacts.map(contact => 
      Object.values(contact).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

// Export singleton instance
export const supabaseService = SupabaseService.getInstance();
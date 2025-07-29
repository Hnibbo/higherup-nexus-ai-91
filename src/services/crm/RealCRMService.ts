/**
 * Real CRM Service with Advanced Business Logic
 * Provides actual contact management, lead scoring, and customer intelligence
 */

import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  phone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  social_profiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  lead_score: number;
  lead_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  lifecycle_stage: 'subscriber' | 'lead' | 'marketing_qualified' | 'sales_qualified' | 'opportunity' | 'customer' | 'evangelist';
  source: string;
  tags: string[];
  custom_fields: Record<string, any>;
  last_activity_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date?: Date;
  actual_close_date?: Date;
  status: 'open' | 'won' | 'lost';
  lost_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: string;
  user_id: string;
  contact_id: string;
  deal_id?: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'website_visit' | 'form_submission' | 'email_open' | 'email_click';
  title: string;
  description?: string;
  outcome?: string;
  scheduled_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface LeadScoringRule {
  id: string;
  user_id: string;
  name: string;
  description: string;
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: any;
  };
  points: number;
  active: boolean;
  created_at: Date;
}

export interface CRMDashboard {
  overview: {
    total_contacts: number;
    total_leads: number;
    total_customers: number;
    total_deals: number;
    pipeline_value: number;
    won_deals_value: number;
    conversion_rate: number;
    average_deal_size: number;
  };
  lead_metrics: {
    new_leads_this_month: number;
    qualified_leads: number;
    hot_leads: number;
    average_lead_score: number;
    lead_conversion_rate: number;
  };
  recent_activities: Activity[];
  top_deals: Deal[];
  performance_trends: {
    leads_by_month: Array<{ month: string; count: number }>;
    deals_by_stage: Array<{ stage: string; count: number; value: number }>;
    conversion_funnel: Array<{ stage: string; count: number; conversion_rate: number }>;
  };
}

export class RealCRMService {
  /**
   * Create a new contact with automatic lead scoring
   */
  async createContact(userId: string, contactData: Partial<Contact>): Promise<Contact> {
    console.log(`👤 Creating new contact: ${contactData.email}`);

    const contact: Contact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      email: contactData.email || '',
      first_name: contactData.first_name,
      last_name: contactData.last_name,
      company: contactData.company,
      job_title: contactData.job_title,
      phone: contactData.phone,
      website: contactData.website,
      address: contactData.address,
      social_profiles: contactData.social_profiles,
      status: contactData.status || 'lead',
      lead_score: 0, // Will be calculated
      lead_grade: 'F', // Will be calculated
      lifecycle_stage: contactData.lifecycle_stage || 'lead',
      source: contactData.source || 'manual',
      tags: contactData.tags || [],
      custom_fields: contactData.custom_fields || {},
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      // Calculate initial lead score
      contact.lead_score = await this.calculateLeadScore(userId, contact);
      contact.lead_grade = this.calculateLeadGrade(contact.lead_score);

      // Store contact in database
      const { error } = await supabase
        .from('contacts')
        .insert({
          id: contact.id,
          user_id: contact.user_id,
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          company: contact.company,
          job_title: contact.job_title,
          phone: contact.phone,
          website: contact.website,
          address: contact.address,
          social_profiles: contact.social_profiles,
          status: contact.status,
          lead_score: contact.lead_score,
          lead_grade: contact.lead_grade,
          lifecycle_stage: contact.lifecycle_stage,
          source: contact.source,
          tags: contact.tags,
          custom_fields: contact.custom_fields,
          created_at: contact.created_at.toISOString(),
          updated_at: contact.updated_at.toISOString()
        });

      if (error) throw error;

      // Log activity
      await this.logActivity(userId, contact.id, {
        type: 'note',
        title: 'Contact Created',
        description: `New contact added from ${contact.source}`
      });

      console.log(`✅ Contact created with lead score: ${contact.lead_score}`);
      return contact;
    } catch (error) {
      console.error('❌ Failed to create contact:', error);
      throw error;
    }
  }

  /**
   * Calculate lead score based on contact data and scoring rules
   */
  async calculateLeadScore(userId: string, contact: Contact): Promise<number> {
    let score = 0;

    // Get user's scoring rules
    const scoringRules = await this.getLeadScoringRules(userId);

    // Apply scoring rules
    for (const rule of scoringRules) {
      if (!rule.active) continue;

      const fieldValue = this.getContactFieldValue(contact, rule.condition.field);
      const conditionMet = this.evaluateCondition(fieldValue, rule.condition);

      if (conditionMet) {
        score += rule.points;
        console.log(`📊 Applied rule "${rule.name}": +${rule.points} points`);
      }
    }

    // Default scoring if no custom rules
    if (scoringRules.length === 0) {
      score = this.calculateDefaultLeadScore(contact);
    }

    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
  }

  /**
   * Calculate default lead score based on common factors
   */
  private calculateDefaultLeadScore(contact: Contact): number {
    let score = 0;

    // Email domain scoring
    if (contact.email) {
      const domain = contact.email.split('@')[1];
      if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
        score += 10; // Business email
      }
    }

    // Company information
    if (contact.company) score += 15;
    if (contact.job_title) {
      const title = contact.job_title.toLowerCase();
      if (title.includes('ceo') || title.includes('founder') || title.includes('president')) {
        score += 20;
      } else if (title.includes('director') || title.includes('manager') || title.includes('head')) {
        score += 15;
      } else if (title.includes('vp') || title.includes('vice president')) {
        score += 18;
      } else {
        score += 5;
      }
    }

    // Contact completeness
    if (contact.phone) score += 10;
    if (contact.website) score += 5;
    if (contact.address) score += 5;
    if (contact.social_profiles?.linkedin) score += 8;

    // Source scoring
    const sourceScores: Record<string, number> = {
      'referral': 25,
      'webinar': 20,
      'content_download': 15,
      'website_form': 12,
      'social_media': 8,
      'cold_outreach': 5,
      'manual': 0
    };
    score += sourceScores[contact.source] || 0;

    return score;
  }

  /**
   * Calculate lead grade based on score
   */
  private calculateLeadGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }

  /**
   * Create a new deal
   */
  async createDeal(userId: string, dealData: Partial<Deal>): Promise<Deal> {
    console.log(`💰 Creating new deal: ${dealData.title}`);

    const deal: Deal = {
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      contact_id: dealData.contact_id || '',
      title: dealData.title || 'Untitled Deal',
      description: dealData.description,
      value: dealData.value || 0,
      currency: dealData.currency || 'USD',
      stage: dealData.stage || 'prospecting',
      probability: dealData.probability || 10,
      expected_close_date: dealData.expected_close_date,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      const { error } = await supabase
        .from('deals')
        .insert({
          id: deal.id,
          user_id: deal.user_id,
          contact_id: deal.contact_id,
          title: deal.title,
          description: deal.description,
          value: deal.value,
          currency: deal.currency,
          stage: deal.stage,
          probability: deal.probability,
          expected_close_date: deal.expected_close_date?.toISOString(),
          status: deal.status,
          created_at: deal.created_at.toISOString(),
          updated_at: deal.updated_at.toISOString()
        });

      if (error) throw error;

      // Log activity
      await this.logActivity(userId, deal.contact_id, {
        type: 'note',
        title: 'Deal Created',
        description: `New deal created: ${deal.title} (${deal.currency} ${deal.value})`
      }, deal.id);

      console.log(`✅ Deal created: ${deal.title}`);
      return deal;
    } catch (error) {
      console.error('❌ Failed to create deal:', error);
      throw error;
    }
  }

  /**
   * Log activity for a contact
   */
  async logActivity(
    userId: string, 
    contactId: string, 
    activityData: Partial<Activity>,
    dealId?: string
  ): Promise<Activity> {
    const activity: Activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      contact_id: contactId,
      deal_id: dealId,
      type: activityData.type || 'note',
      title: activityData.title || '',
      description: activityData.description,
      outcome: activityData.outcome,
      scheduled_at: activityData.scheduled_at,
      completed_at: activityData.completed_at || (activityData.type === 'note' ? new Date() : undefined),
      created_at: new Date()
    };

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          id: activity.id,
          user_id: activity.user_id,
          contact_id: activity.contact_id,
          deal_id: activity.deal_id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          outcome: activity.outcome,
          scheduled_at: activity.scheduled_at?.toISOString(),
          completed_at: activity.completed_at?.toISOString(),
          created_at: activity.created_at.toISOString()
        });

      if (error) throw error;

      // Update contact's last activity
      await this.updateContactLastActivity(contactId);

      return activity;
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      throw error;
    }
  }

  /**
   * Get CRM dashboard data
   */
  async getCRMDashboard(userId: string): Promise<CRMDashboard> {
    console.log(`📊 Generating CRM dashboard for user: ${userId}`);

    try {
      // Get contacts data
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId);

      if (contactsError) throw contactsError;

      // Get deals data
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', userId);

      if (dealsError) throw dealsError;

      // Get recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Calculate metrics
      const totalContacts = contacts?.length || 0;
      const totalLeads = contacts?.filter(c => c.status === 'lead').length || 0;
      const totalCustomers = contacts?.filter(c => c.status === 'customer').length || 0;
      const totalDeals = deals?.length || 0;
      
      const pipelineValue = deals?.filter(d => d.status === 'open')
        .reduce((sum, deal) => sum + deal.value, 0) || 0;
      
      const wonDealsValue = deals?.filter(d => d.status === 'won')
        .reduce((sum, deal) => sum + deal.value, 0) || 0;
      
      const conversionRate = totalLeads > 0 ? (totalCustomers / totalLeads) * 100 : 0;
      const averageDealSize = totalDeals > 0 ? pipelineValue / totalDeals : 0;

      // Lead metrics
      const currentMonth = new Date().getMonth();
      const newLeadsThisMonth = contacts?.filter(c => 
        new Date(c.created_at).getMonth() === currentMonth && c.status === 'lead'
      ).length || 0;

      const qualifiedLeads = contacts?.filter(c => 
        c.lifecycle_stage === 'marketing_qualified' || c.lifecycle_stage === 'sales_qualified'
      ).length || 0;

      const hotLeads = contacts?.filter(c => c.lead_score >= 70).length || 0;
      
      const averageLeadScore = contacts && contacts.length > 0 
        ? contacts.reduce((sum, c) => sum + (c.lead_score || 0), 0) / contacts.length 
        : 0;

      const leadConversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

      // Top deals
      const topDeals = deals?.filter(d => d.status === 'open')
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(deal => ({
          ...deal,
          created_at: new Date(deal.created_at),
          updated_at: new Date(deal.updated_at),
          expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : undefined,
          actual_close_date: deal.actual_close_date ? new Date(deal.actual_close_date) : undefined
        })) || [];

      // Performance trends (simplified)
      const leadsBy Month = this.generateLeadsByMonth(contacts || []);
      const dealsByStage = this.generateDealsByStage(deals || []);
      const conversionFunnel = this.generateConversionFunnel(contacts || []);

      const dashboard: CRMDashboard = {
        overview: {
          total_contacts: totalContacts,
          total_leads: totalLeads,
          total_customers: totalCustomers,
          total_deals: totalDeals,
          pipeline_value: Math.round(pipelineValue),
          won_deals_value: Math.round(wonDealsValue),
          conversion_rate: Math.round(conversionRate * 100) / 100,
          average_deal_size: Math.round(averageDealSize)
        },
        lead_metrics: {
          new_leads_this_month: newLeadsThisMonth,
          qualified_leads: qualifiedLeads,
          hot_leads: hotLeads,
          average_lead_score: Math.round(averageLeadScore),
          lead_conversion_rate: Math.round(leadConversionRate * 100) / 100
        },
        recent_activities: (activities || []).map(activity => ({
          ...activity,
          created_at: new Date(activity.created_at),
          scheduled_at: activity.scheduled_at ? new Date(activity.scheduled_at) : undefined,
          completed_at: activity.completed_at ? new Date(activity.completed_at) : undefined
        })),
        top_deals: topDeals,
        performance_trends: {
          leads_by_month: leadsBy Month,
          deals_by_stage: dealsByStage,
          conversion_funnel: conversionFunnel
        }
      };

      console.log(`✅ Dashboard generated with ${totalContacts} contacts and ${totalDeals} deals`);
      return dashboard;
    } catch (error) {
      console.error('❌ Failed to generate CRM dashboard:', error);
      throw error;
    }
  }

  /**
   * Helper methods for dashboard calculations
   */
  private generateLeadsByMonth(contacts: any[]): Array<{ month: string; count: number }> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => ({
      month,
      count: contacts.filter(c => {
        const createdDate = new Date(c.created_at);
        return createdDate.getFullYear() === currentYear && 
               createdDate.getMonth() === index &&
               c.status === 'lead';
      }).length
    }));
  }

  private generateDealsByStage(deals: any[]): Array<{ stage: string; count: number; value: number }> {
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    
    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.value, 0)
      };
    });
  }

  private generateConversionFunnel(contacts: any[]): Array<{ stage: string; count: number; conversion_rate: number }> {
    const stages = [
      { name: 'Leads', filter: (c: any) => c.status === 'lead' },
      { name: 'Marketing Qualified', filter: (c: any) => c.lifecycle_stage === 'marketing_qualified' },
      { name: 'Sales Qualified', filter: (c: any) => c.lifecycle_stage === 'sales_qualified' },
      { name: 'Opportunities', filter: (c: any) => c.lifecycle_stage === 'opportunity' },
      { name: 'Customers', filter: (c: any) => c.status === 'customer' }
    ];

    const totalLeads = contacts.filter(stages[0].filter).length;
    
    return stages.map((stage, index) => {
      const count = contacts.filter(stage.filter).length;
      const conversionRate = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
      
      return {
        stage: stage.name,
        count,
        conversion_rate: Math.round(conversionRate * 100) / 100
      };
    });
  }

  /**
   * Helper methods
   */
  private async getLeadScoringRules(userId: string): Promise<LeadScoringRule[]> {
    try {
      const { data, error } = await supabase
        .from('lead_scoring_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch lead scoring rules:', error);
      return [];
    }
  }

  private getContactFieldValue(contact: Contact, field: string): any {
    const fieldParts = field.split('.');
    let value: any = contact;
    
    for (const part of fieldParts) {
      value = value?.[part];
    }
    
    return value;
  }

  private evaluateCondition(fieldValue: any, condition: LeadScoringRule['condition']): boolean {
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > condition.value;
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < condition.value;
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined || fieldValue === '';
      default:
        return false;
    }
  }

  private async updateContactLastActivity(contactId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ 
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (error) throw error;
    } catch (error) {
      console.warn('⚠️ Failed to update contact last activity:', error);
    }
  }

  /**
   * Get contacts with filtering and pagination
   */
  async getContacts(
    userId: string, 
    options: {
      status?: string;
      lifecycle_stage?: string;
      lead_grade?: string;
      limit?: number;
      offset?: number;
      search?: string;
    } = {}
  ): Promise<{ contacts: Contact[]; total: number }> {
    try {
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.lifecycle_stage) {
        query = query.eq('lifecycle_stage', options.lifecycle_stage);
      }
      if (options.lead_grade) {
        query = query.eq('lead_grade', options.lead_grade);
      }
      if (options.search) {
        query = query.or(`email.ilike.%${options.search}%,first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,company.ilike.%${options.search}%`);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      // Order by lead score descending
      query = query.order('lead_score', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const contacts = (data || []).map(contact => ({
        ...contact,
        created_at: new Date(contact.created_at),
        updated_at: new Date(contact.updated_at),
        last_activity_at: contact.last_activity_at ? new Date(contact.last_activity_at) : undefined
      }));

      return { contacts, total: count || 0 };
    } catch (error) {
      console.error('❌ Failed to fetch contacts:', error);
      return { contacts: [], total: 0 };
    }
  }
}

// Export singleton instance
export const realCRMService = new RealCRMService();
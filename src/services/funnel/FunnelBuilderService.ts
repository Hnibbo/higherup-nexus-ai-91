import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

export interface FunnelStep {
  id: string;
  funnel_id: string;
  step_number: number;
  step_type: 'landing_page' | 'opt_in' | 'sales_page' | 'checkout' | 'thank_you' | 'upsell' | 'downsell' | 'custom';
  name: string;
  description?: string;
  page_config: {
    template_id?: string;
    custom_html?: string;
    custom_css?: string;
    custom_js?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
    og_image?: string;
  };
  form_config?: {
    fields: FormField[];
    submit_action: 'next_step' | 'external_url' | 'webhook';
    submit_url?: string;
    success_message?: string;
    error_message?: string;
  };
  payment_config?: {
    product_id?: string;
    price: number;
    currency: string;
    payment_processor: 'stripe' | 'paypal' | 'square';
    recurring?: {
      interval: 'monthly' | 'yearly';
      trial_days?: number;
    };
  };
  split_test_config?: {
    is_enabled: boolean;
    variants: Array<{
      name: string;
      traffic_percentage: number;
      page_config: any;
    }>;
  };
  conversion_tracking: {
    goal_type: 'page_view' | 'form_submit' | 'purchase' | 'custom_event';
    goal_value?: number;
    tracking_pixels?: string[];
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    custom_validation?: string;
  };
  options?: Array<{ value: string; label: string }>; // For select, radio, checkbox
  default_value?: any;
  conditional_logic?: {
    show_if: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
      value: any;
    }>;
  };
  order: number;
}

export interface Funnel {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'lead_generation' | 'sales' | 'webinar' | 'product_launch' | 'membership' | 'custom';
  domain?: string;
  subdomain?: string;
  custom_domain?: string;
  favicon_url?: string;
  global_styles: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    background_color: string;
    text_color: string;
    button_style: Record<string, any>;
  };
  steps: FunnelStep[];
  analytics_config: {
    google_analytics_id?: string;
    facebook_pixel_id?: string;
    custom_tracking_code?: string;
  };
  seo_config: {
    robots_txt?: string;
    sitemap_enabled: boolean;
    schema_markup?: Record<string, any>;
  };
  is_published: boolean;
  published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface FunnelTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image: string;
  steps: Omit<FunnelStep, 'id' | 'funnel_id' | 'created_at' | 'updated_at'>[];
  global_styles: Funnel['global_styles'];
  is_premium: boolean;
  created_by: string;
}

export interface FunnelMetrics {
  funnel_id: string;
  total_visitors: number;
  unique_visitors: number;
  conversion_rate: number;
  revenue_generated: number;
  step_metrics: Array<{
    step_number: number;
    step_name: string;
    visitors: number;
    conversions: number;
    conversion_rate: number;
    drop_off_rate: number;
    average_time_on_page: number;
  }>;
  traffic_sources: Record<string, number>;
  device_breakdown: Record<string, number>;
  location_data: Record<string, number>;
}

export class FunnelBuilderService {
  private static instance: FunnelBuilderService;

  private constructor() {}

  public static getInstance(): FunnelBuilderService {
    if (!FunnelBuilderService.instance) {
      FunnelBuilderService.instance = new FunnelBuilderService();
    }
    return FunnelBuilderService.instance;
  }

  // Funnel Management
  async createFunnel(funnel: Omit<Funnel, 'id' | 'created_at' | 'updated_at'>): Promise<Funnel> {
    try {
      console.log(`🎯 Creating funnel: ${funnel.name}`);

      // Create funnel record
      const { data: funnelData, error: funnelError } = await supabase
        .from('funnels')
        .insert({
          user_id: funnel.user_id,
          name: funnel.name,
          description: funnel.description,
          category: funnel.category,
          domain: funnel.domain,
          subdomain: funnel.subdomain,
          custom_domain: funnel.custom_domain,
          favicon_url: funnel.favicon_url,
          global_styles: funnel.global_styles,
          analytics_config: funnel.analytics_config,
          seo_config: funnel.seo_config,
          is_published: funnel.is_published,
          published_at: funnel.published_at?.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (funnelError) throw funnelError;

      // Create funnel steps
      const steps = await this.createFunnelSteps(funnelData.id, funnel.steps);

      console.log(`✅ Funnel created: ${funnel.name} with ${steps.length} steps`);
      return { ...funnelData, steps };

    } catch (error) {
      console.error('❌ Failed to create funnel:', error);
      throw error;
    }
  }

  private async createFunnelSteps(funnelId: string, steps: Omit<FunnelStep, 'id' | 'funnel_id' | 'created_at' | 'updated_at'>[]): Promise<FunnelStep[]> {
    const createdSteps: FunnelStep[] = [];

    for (const step of steps) {
      const { data, error } = await supabase
        .from('funnel_steps')
        .insert({
          funnel_id: funnelId,
          step_number: step.step_number,
          step_type: step.step_type,
          name: step.name,
          description: step.description,
          page_config: step.page_config,
          form_config: step.form_config,
          payment_config: step.payment_config,
          split_test_config: step.split_test_config,
          conversion_tracking: step.conversion_tracking,
          is_active: step.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      createdSteps.push(data);
    }

    return createdSteps;
  }

  async getFunnels(userId: string, category?: string): Promise<Funnel[]> {
    try {
      // Get funnels
      let funnelQuery = supabase
        .from('funnels')
        .select('*')
        .eq('user_id', userId);

      if (category) {
        funnelQuery = funnelQuery.eq('category', category);
      }

      const { data: funnels, error: funnelsError } = await funnelQuery.order('created_at', { ascending: false });

      if (funnelsError) throw funnelsError;

      // Get steps for each funnel
      const result: Funnel[] = [];

      for (const funnel of funnels || []) {
        const { data: steps, error: stepsError } = await supabase
          .from('funnel_steps')
          .select('*')
          .eq('funnel_id', funnel.id)
          .order('step_number', { ascending: true });

        if (stepsError) throw stepsError;

        result.push({
          ...funnel,
          steps: steps || []
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to get funnels:', error);
      throw error;
    }
  }

  async getFunnel(funnelId: string): Promise<Funnel> {
    try {
      // Get funnel
      const { data: funnel, error: funnelError } = await supabase
        .from('funnels')
        .select('*')
        .eq('id', funnelId)
        .single();

      if (funnelError) throw funnelError;

      // Get steps
      const { data: steps, error: stepsError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      return {
        ...funnel,
        steps: steps || []
      };

    } catch (error) {
      console.error('❌ Failed to get funnel:', error);
      throw error;
    }
  }

  async updateFunnel(funnelId: string, updates: Partial<Funnel>): Promise<Funnel> {
    try {
      console.log(`📝 Updating funnel: ${funnelId}`);

      // Update funnel record
      const { data: funnelData, error: funnelError } = await supabase
        .from('funnels')
        .update({
          name: updates.name,
          description: updates.description,
          category: updates.category,
          domain: updates.domain,
          subdomain: updates.subdomain,
          custom_domain: updates.custom_domain,
          favicon_url: updates.favicon_url,
          global_styles: updates.global_styles,
          analytics_config: updates.analytics_config,
          seo_config: updates.seo_config,
          is_published: updates.is_published,
          published_at: updates.published_at?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', funnelId)
        .select()
        .single();

      if (funnelError) throw funnelError;

      // Update steps if provided
      let steps = [];
      if (updates.steps) {
        // Delete existing steps
        await supabase
          .from('funnel_steps')
          .delete()
          .eq('funnel_id', funnelId);

        // Create new steps
        steps = await this.createFunnelSteps(funnelId, updates.steps);
      } else {
        // Get existing steps
        const { data: existingSteps } = await supabase
          .from('funnel_steps')
          .select('*')
          .eq('funnel_id', funnelId)
          .order('step_number', { ascending: true });

        steps = existingSteps || [];
      }

      console.log(`✅ Funnel updated: ${funnelId}`);
      return { ...funnelData, steps };

    } catch (error) {
      console.error('❌ Failed to update funnel:', error);
      throw error;
    }
  }

  async duplicateFunnel(funnelId: string, userId: string, newName?: string): Promise<Funnel> {
    try {
      console.log(`📋 Duplicating funnel: ${funnelId}`);

      // Get original funnel
      const originalFunnel = await this.getFunnel(funnelId);

      // Create duplicate
      const duplicate = await this.createFunnel({
        user_id: userId,
        name: newName || `${originalFunnel.name} (Copy)`,
        description: originalFunnel.description,
        category: originalFunnel.category,
        domain: undefined, // Don't copy domain
        subdomain: undefined, // Don't copy subdomain
        custom_domain: undefined, // Don't copy custom domain
        favicon_url: originalFunnel.favicon_url,
        global_styles: originalFunnel.global_styles,
        analytics_config: originalFunnel.analytics_config,
        seo_config: originalFunnel.seo_config,
        is_published: false, // Don't publish duplicate
        steps: originalFunnel.steps.map(step => ({
          step_number: step.step_number,
          step_type: step.step_type,
          name: step.name,
          description: step.description,
          page_config: step.page_config,
          form_config: step.form_config,
          payment_config: step.payment_config,
          split_test_config: step.split_test_config,
          conversion_tracking: step.conversion_tracking,
          is_active: step.is_active
        }))
      });

      console.log(`✅ Funnel duplicated: ${funnelId} -> ${duplicate.id}`);
      return duplicate;

    } catch (error) {
      console.error('❌ Failed to duplicate funnel:', error);
      throw error;
    }
  }

  async deleteFunnel(funnelId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting funnel: ${funnelId}`);

      // Delete steps first (due to foreign key constraint)
      await supabase
        .from('funnel_steps')
        .delete()
        .eq('funnel_id', funnelId);

      // Delete funnel
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', funnelId);

      if (error) throw error;

      console.log(`✅ Funnel deleted: ${funnelId}`);

    } catch (error) {
      console.error('❌ Failed to delete funnel:', error);
      throw error;
    }
  }

  // Step Management
  async addStep(funnelId: string, step: Omit<FunnelStep, 'id' | 'funnel_id' | 'created_at' | 'updated_at'>): Promise<FunnelStep> {
    try {
      console.log(`➕ Adding step to funnel: ${funnelId}`);

      const { data, error } = await supabase
        .from('funnel_steps')
        .insert({
          funnel_id: funnelId,
          step_number: step.step_number,
          step_type: step.step_type,
          name: step.name,
          description: step.description,
          page_config: step.page_config,
          form_config: step.form_config,
          payment_config: step.payment_config,
          split_test_config: step.split_test_config,
          conversion_tracking: step.conversion_tracking,
          is_active: step.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Step added to funnel: ${funnelId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to add step to funnel:', error);
      throw error;
    }
  }

  async updateStep(stepId: string, updates: Partial<FunnelStep>): Promise<FunnelStep> {
    try {
      console.log(`📝 Updating funnel step: ${stepId}`);

      const { data, error } = await supabase
        .from('funnel_steps')
        .update({
          step_number: updates.step_number,
          step_type: updates.step_type,
          name: updates.name,
          description: updates.description,
          page_config: updates.page_config,
          form_config: updates.form_config,
          payment_config: updates.payment_config,
          split_test_config: updates.split_test_config,
          conversion_tracking: updates.conversion_tracking,
          is_active: updates.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', stepId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Funnel step updated: ${stepId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update funnel step:', error);
      throw error;
    }
  }

  async deleteStep(stepId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting funnel step: ${stepId}`);

      const { error } = await supabase
        .from('funnel_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;

      console.log(`✅ Funnel step deleted: ${stepId}`);

    } catch (error) {
      console.error('❌ Failed to delete funnel step:', error);
      throw error;
    }
  }

  async reorderSteps(funnelId: string, stepIds: string[]): Promise<void> {
    try {
      console.log(`🔄 Reordering steps for funnel: ${funnelId}`);

      // Update step numbers based on new order
      for (let i = 0; i < stepIds.length; i++) {
        await supabase
          .from('funnel_steps')
          .update({
            step_number: i + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', stepIds[i]);
      }

      console.log(`✅ Steps reordered for funnel: ${funnelId}`);

    } catch (error) {
      console.error('❌ Failed to reorder funnel steps:', error);
      throw error;
    }
  }  //
 Publishing and Domain Management
  async publishFunnel(funnelId: string): Promise<Funnel> {
    try {
      console.log(`🚀 Publishing funnel: ${funnelId}`);

      // Validate funnel before publishing
      await this.validateFunnel(funnelId);

      const { data, error } = await supabase
        .from('funnels')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', funnelId)
        .select()
        .single();

      if (error) throw error;

      // Get steps
      const { data: steps } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('step_number', { ascending: true });

      console.log(`✅ Funnel published: ${funnelId}`);
      return { ...data, steps: steps || [] };

    } catch (error) {
      console.error('❌ Failed to publish funnel:', error);
      throw error;
    }
  }

  async unpublishFunnel(funnelId: string): Promise<Funnel> {
    try {
      console.log(`⏸️ Unpublishing funnel: ${funnelId}`);

      const { data, error } = await supabase
        .from('funnels')
        .update({
          is_published: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', funnelId)
        .select()
        .single();

      if (error) throw error;

      // Get steps
      const { data: steps } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', funnelId)
        .order('step_number', { ascending: true });

      console.log(`✅ Funnel unpublished: ${funnelId}`);
      return { ...data, steps: steps || [] };

    } catch (error) {
      console.error('❌ Failed to unpublish funnel:', error);
      throw error;
    }
  }

  private async validateFunnel(funnelId: string): Promise<void> {
    const funnel = await this.getFunnel(funnelId);

    // Check if funnel has at least one step
    if (!funnel.steps || funnel.steps.length === 0) {
      throw new Error('Funnel must have at least one step to be published');
    }

    // Check if all steps are properly configured
    for (const step of funnel.steps) {
      if (!step.name || step.name.trim() === '') {
        throw new Error(`Step ${step.step_number} must have a name`);
      }

      if (!step.page_config || (!step.page_config.template_id && !step.page_config.custom_html)) {
        throw new Error(`Step ${step.step_number} must have page content configured`);
      }

      // Validate form steps
      if (step.form_config && step.form_config.fields.length === 0) {
        throw new Error(`Step ${step.step_number} form must have at least one field`);
      }

      // Validate payment steps
      if (step.payment_config && (!step.payment_config.price || step.payment_config.price <= 0)) {
        throw new Error(`Step ${step.step_number} payment must have a valid price`);
      }
    }
  }

  async setCustomDomain(funnelId: string, domain: string): Promise<void> {
    try {
      console.log(`🌐 Setting custom domain for funnel: ${funnelId} -> ${domain}`);

      // Validate domain format
      if (!this.isValidDomain(domain)) {
        throw new Error('Invalid domain format');
      }

      // Check if domain is already in use
      const { data: existingFunnel, error: checkError } = await supabase
        .from('funnels')
        .select('id')
        .eq('custom_domain', domain)
        .neq('id', funnelId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingFunnel) {
        throw new Error('Domain is already in use by another funnel');
      }

      // Update funnel with custom domain
      const { error } = await supabase
        .from('funnels')
        .update({
          custom_domain: domain,
          updated_at: new Date().toISOString()
        })
        .eq('id', funnelId);

      if (error) throw error;

      console.log(`✅ Custom domain set: ${domain}`);

    } catch (error) {
      console.error('❌ Failed to set custom domain:', error);
      throw error;
    }
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  }

  // Template Management
  async getFunnelTemplates(category?: string): Promise<FunnelTemplate[]> {
    try {
      let query = supabase
        .from('funnel_templates')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get funnel templates:', error);
      throw error;
    }
  }

  async createFunnelFromTemplate(templateId: string, userId: string, funnelName: string): Promise<Funnel> {
    try {
      console.log(`📋 Creating funnel from template: ${templateId}`);

      // Get template
      const { data: template, error: templateError } = await supabase
        .from('funnel_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Create funnel from template
      const funnel = await this.createFunnel({
        user_id: userId,
        name: funnelName,
        description: template.description,
        category: template.category as any,
        global_styles: template.global_styles,
        analytics_config: {},
        seo_config: { sitemap_enabled: true },
        is_published: false,
        steps: template.steps.map((step, index) => ({
          step_number: index + 1,
          step_type: step.step_type,
          name: step.name,
          description: step.description,
          page_config: step.page_config,
          form_config: step.form_config,
          payment_config: step.payment_config,
          split_test_config: step.split_test_config,
          conversion_tracking: step.conversion_tracking,
          is_active: step.is_active
        }))
      });

      console.log(`✅ Funnel created from template: ${templateId} -> ${funnel.id}`);
      return funnel;

    } catch (error) {
      console.error('❌ Failed to create funnel from template:', error);
      throw error;
    }
  }

  // Form Builder
  async createForm(stepId: string, fields: FormField[]): Promise<void> {
    try {
      console.log(`📝 Creating form for step: ${stepId}`);

      // Get current step
      const { data: step, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      // Update step with form configuration
      const formConfig = {
        fields: fields.sort((a, b) => a.order - b.order),
        submit_action: 'next_step',
        success_message: 'Thank you! Your information has been submitted.',
        error_message: 'There was an error submitting your information. Please try again.'
      };

      await this.updateStep(stepId, {
        form_config: formConfig
      });

      console.log(`✅ Form created for step: ${stepId} with ${fields.length} fields`);

    } catch (error) {
      console.error('❌ Failed to create form:', error);
      throw error;
    }
  }

  async addFormField(stepId: string, field: FormField): Promise<void> {
    try {
      console.log(`➕ Adding form field to step: ${stepId}`);

      // Get current step
      const { data: step, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      if (!step.form_config) {
        throw new Error('Step does not have a form configuration');
      }

      // Add field to existing form
      const updatedFields = [...step.form_config.fields, field].sort((a, b) => a.order - b.order);

      await this.updateStep(stepId, {
        form_config: {
          ...step.form_config,
          fields: updatedFields
        }
      });

      console.log(`✅ Form field added to step: ${stepId}`);

    } catch (error) {
      console.error('❌ Failed to add form field:', error);
      throw error;
    }
  }

  async updateFormField(stepId: string, fieldId: string, updates: Partial<FormField>): Promise<void> {
    try {
      console.log(`📝 Updating form field: ${fieldId} in step: ${stepId}`);

      // Get current step
      const { data: step, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      if (!step.form_config) {
        throw new Error('Step does not have a form configuration');
      }

      // Update field
      const updatedFields = step.form_config.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      ).sort((a, b) => a.order - b.order);

      await this.updateStep(stepId, {
        form_config: {
          ...step.form_config,
          fields: updatedFields
        }
      });

      console.log(`✅ Form field updated: ${fieldId}`);

    } catch (error) {
      console.error('❌ Failed to update form field:', error);
      throw error;
    }
  }

  async removeFormField(stepId: string, fieldId: string): Promise<void> {
    try {
      console.log(`🗑️ Removing form field: ${fieldId} from step: ${stepId}`);

      // Get current step
      const { data: step, error: stepError } = await supabase
        .from('funnel_steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError) throw stepError;

      if (!step.form_config) {
        throw new Error('Step does not have a form configuration');
      }

      // Remove field
      const updatedFields = step.form_config.fields
        .filter(field => field.id !== fieldId)
        .sort((a, b) => a.order - b.order);

      await this.updateStep(stepId, {
        form_config: {
          ...step.form_config,
          fields: updatedFields
        }
      });

      console.log(`✅ Form field removed: ${fieldId}`);

    } catch (error) {
      console.error('❌ Failed to remove form field:', error);
      throw error;
    }
  }

  // Payment Integration
  async configurePayment(stepId: string, paymentConfig: FunnelStep['payment_config']): Promise<void> {
    try {
      console.log(`💳 Configuring payment for step: ${stepId}`);

      await this.updateStep(stepId, {
        payment_config: paymentConfig
      });

      console.log(`✅ Payment configured for step: ${stepId}`);

    } catch (error) {
      console.error('❌ Failed to configure payment:', error);
      throw error;
    }
  }

  // Split Testing
  async createSplitTest(stepId: string, variants: Array<{ name: string; traffic_percentage: number; page_config: any }>): Promise<void> {
    try {
      console.log(`🧪 Creating split test for step: ${stepId}`);

      // Validate traffic percentages
      const totalPercentage = variants.reduce((sum, variant) => sum + variant.traffic_percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Traffic percentages must sum to 100%');
      }

      const splitTestConfig = {
        is_enabled: true,
        variants
      };

      await this.updateStep(stepId, {
        split_test_config: splitTestConfig
      });

      console.log(`✅ Split test created for step: ${stepId} with ${variants.length} variants`);

    } catch (error) {
      console.error('❌ Failed to create split test:', error);
      throw error;
    }
  }

  async disableSplitTest(stepId: string): Promise<void> {
    try {
      console.log(`⏸️ Disabling split test for step: ${stepId}`);

      await this.updateStep(stepId, {
        split_test_config: {
          is_enabled: false,
          variants: []
        }
      });

      console.log(`✅ Split test disabled for step: ${stepId}`);

    } catch (error) {
      console.error('❌ Failed to disable split test:', error);
      throw error;
    }
  }

  // Default Templates Setup
  async setupDefaultFunnelTemplates(): Promise<void> {
    try {
      console.log('🔧 Setting up default funnel templates...');

      const defaultTemplates: Array<Omit<FunnelTemplate, 'id'>> = [
        {
          name: 'Lead Generation Funnel',
          description: 'Simple 2-step lead generation funnel with opt-in and thank you page',
          category: 'lead_generation',
          preview_image: 'https://via.placeholder.com/400x300/4f46e5/ffffff?text=Lead+Gen',
          is_premium: false,
          created_by: 'system',
          global_styles: {
            primary_color: '#4f46e5',
            secondary_color: '#06b6d4',
            font_family: 'Inter, sans-serif',
            background_color: '#ffffff',
            text_color: '#1f2937',
            button_style: {
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600'
            }
          },
          steps: [
            {
              step_number: 1,
              step_type: 'opt_in',
              name: 'Lead Capture',
              description: 'Capture visitor information',
              page_config: {
                template_id: 'lead_capture_template',
                seo_title: 'Get Your Free Guide',
                seo_description: 'Download our comprehensive guide and transform your business today.'
              },
              form_config: {
                fields: [
                  {
                    id: 'first_name',
                    type: 'text',
                    name: 'first_name',
                    label: 'First Name',
                    placeholder: 'Enter your first name',
                    required: true,
                    order: 1
                  },
                  {
                    id: 'email',
                    type: 'email',
                    name: 'email',
                    label: 'Email Address',
                    placeholder: 'Enter your email address',
                    required: true,
                    validation: {
                      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
                    },
                    order: 2
                  }
                ],
                submit_action: 'next_step',
                success_message: 'Thank you! Check your email for the download link.',
                error_message: 'Please check your information and try again.'
              },
              conversion_tracking: {
                goal_type: 'form_submit',
                goal_value: 10
              },
              is_active: true
            },
            {
              step_number: 2,
              step_type: 'thank_you',
              name: 'Thank You',
              description: 'Thank you and next steps',
              page_config: {
                template_id: 'thank_you_template',
                seo_title: 'Thank You - Download Your Guide',
                seo_description: 'Your guide is on its way! Check your email.'
              },
              conversion_tracking: {
                goal_type: 'page_view',
                goal_value: 10
              },
              is_active: true
            }
          ]
        },
        {
          name: 'Product Sales Funnel',
          description: 'Complete sales funnel with landing page, sales page, and checkout',
          category: 'sales',
          preview_image: 'https://via.placeholder.com/400x300/059669/ffffff?text=Sales+Funnel',
          is_premium: false,
          created_by: 'system',
          global_styles: {
            primary_color: '#059669',
            secondary_color: '#f59e0b',
            font_family: 'Inter, sans-serif',
            background_color: '#ffffff',
            text_color: '#1f2937',
            button_style: {
              backgroundColor: '#059669',
              color: '#ffffff',
              borderRadius: '6px',
              padding: '14px 28px',
              fontSize: '18px',
              fontWeight: '700'
            }
          },
          steps: [
            {
              step_number: 1,
              step_type: 'landing_page',
              name: 'Landing Page',
              description: 'Product introduction and benefits',
              page_config: {
                template_id: 'product_landing_template',
                seo_title: 'Transform Your Business Today',
                seo_description: 'Discover the proven system that has helped thousands of businesses grow.'
              },
              conversion_tracking: {
                goal_type: 'page_view',
                goal_value: 5
              },
              is_active: true
            },
            {
              step_number: 2,
              step_type: 'sales_page',
              name: 'Sales Page',
              description: 'Detailed product presentation and offer',
              page_config: {
                template_id: 'sales_page_template',
                seo_title: 'Get Started Today - Special Offer',
                seo_description: 'Limited time offer - Get our complete system at a special price.'
              },
              conversion_tracking: {
                goal_type: 'page_view',
                goal_value: 15
              },
              is_active: true
            },
            {
              step_number: 3,
              step_type: 'checkout',
              name: 'Checkout',
              description: 'Secure payment processing',
              page_config: {
                template_id: 'checkout_template',
                seo_title: 'Secure Checkout',
                seo_description: 'Complete your purchase securely.'
              },
              form_config: {
                fields: [
                  {
                    id: 'full_name',
                    type: 'text',
                    name: 'full_name',
                    label: 'Full Name',
                    placeholder: 'Enter your full name',
                    required: true,
                    order: 1
                  },
                  {
                    id: 'email',
                    type: 'email',
                    name: 'email',
                    label: 'Email Address',
                    placeholder: 'Enter your email address',
                    required: true,
                    order: 2
                  }
                ],
                submit_action: 'next_step',
                success_message: 'Order completed successfully!',
                error_message: 'Payment failed. Please try again.'
              },
              payment_config: {
                price: 97,
                currency: 'USD',
                payment_processor: 'stripe'
              },
              conversion_tracking: {
                goal_type: 'purchase',
                goal_value: 97
              },
              is_active: true
            },
            {
              step_number: 4,
              step_type: 'thank_you',
              name: 'Order Confirmation',
              description: 'Order confirmation and next steps',
              page_config: {
                template_id: 'order_confirmation_template',
                seo_title: 'Order Confirmed - Welcome!',
                seo_description: 'Your order has been confirmed. Welcome to the community!'
              },
              conversion_tracking: {
                goal_type: 'page_view',
                goal_value: 97
              },
              is_active: true
            }
          ]
        }
      ];

      for (const template of defaultTemplates) {
        const { error } = await supabase
          .from('funnel_templates')
          .insert(template);

        if (error && error.code !== '23505') { // Ignore duplicate key errors
          throw error;
        }
      }

      console.log(`✅ Created ${defaultTemplates.length} default funnel templates`);

    } catch (error) {
      console.error('❌ Failed to setup default funnel templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const funnelBuilderService = FunnelBuilderService.getInstance();
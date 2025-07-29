import { supabase } from '@/integrations/supabase/client';
import { emailCampaignService } from './EmailCampaignService';

export interface EmailAutomation {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_event: 'contact_created' | 'field_updated' | 'segment_added' | 'form_submitted' | 'website_activity' | 'date_based' | 'custom';
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  steps: EmailAutomationStep[];
}

export interface EmailAutomationStep {
  id: string;
  automation_id: string;
  step_number: number;
  step_type: 'send_email' | 'wait' | 'condition' | 'action';
  step_data: Record<string, any>;
  is_active: boolean;
  created_at: Date;
}

export interface EmailAutomationExecution {
  id: string;
  automation_id: string;
  contact_id: string;
  current_step: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'error';
  started_at: Date;
  completed_at?: Date;
  next_execution_at?: Date;
  error_message?: string;
  execution_data: Record<string, any>;
}

export interface EmailAutomationMetrics {
  automation_id: string;
  total_executions: number;
  active_executions: number;
  completed_executions: number;
  conversion_rate: number;
  average_completion_time: number;
  step_metrics: Array<{
    step_number: number;
    success_rate: number;
    average_time: number;
  }>;
}

export class EmailAutomationService {
  private static instance: EmailAutomationService;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAutomationProcessor();
  }

  public static getInstance(): EmailAutomationService {
    if (!EmailAutomationService.instance) {
      EmailAutomationService.instance = new EmailAutomationService();
    }
    return EmailAutomationService.instance;
  }

  private startAutomationProcessor(): void {
    // Process automations every minute
    this.processingInterval = setInterval(async () => {
      try {
        await this.processAutomations();
      } catch (error) {
        console.error('Automation processing failed:', error);
      }
    }, 60000);
  }

  // Automation Management
  async createAutomation(automation: Omit<EmailAutomation, 'id' | 'created_at' | 'updated_at'>): Promise<EmailAutomation> {
    try {
      console.log(`🤖 Creating email automation: ${automation.name}`);

      // Create automation record
      const { data, error } = await supabase
        .from('email_automations')
        .insert({
          user_id: automation.user_id,
          name: automation.name,
          description: automation.description,
          trigger_event: automation.trigger_event,
          trigger_conditions: automation.trigger_conditions,
          is_active: automation.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create steps
      const steps = await this.createAutomationSteps(data.id, automation.steps);

      console.log(`✅ Email automation created: ${automation.name}`);
      return { ...data, steps };

    } catch (error) {
      console.error('❌ Failed to create email automation:', error);
      throw error;
    }
  }

  private async createAutomationSteps(automationId: string, steps: Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>[]): Promise<EmailAutomationStep[]> {
    const createdSteps: EmailAutomationStep[] = [];

    for (const step of steps) {
      const { data, error } = await supabase
        .from('email_automation_steps')
        .insert({
          automation_id: automationId,
          step_number: step.step_number,
          step_type: step.step_type,
          step_data: step.step_data,
          is_active: step.is_active,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      createdSteps.push(data);
    }

    return createdSteps;
  }

  async getAutomations(userId: string): Promise<EmailAutomation[]> {
    try {
      // Get automations
      const { data: automations, error: automationsError } = await supabase
        .from('email_automations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (automationsError) throw automationsError;

      // Get steps for each automation
      const result: EmailAutomation[] = [];

      for (const automation of automations || []) {
        const { data: steps, error: stepsError } = await supabase
          .from('email_automation_steps')
          .select('*')
          .eq('automation_id', automation.id)
          .order('step_number', { ascending: true });

        if (stepsError) throw stepsError;

        result.push({
          ...automation,
          steps: steps || []
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to get email automations:', error);
      throw error;
    }
  }

  async updateAutomation(automationId: string, updates: Partial<EmailAutomation>): Promise<EmailAutomation> {
    try {
      // Update automation record
      const { data, error } = await supabase
        .from('email_automations')
        .update({
          name: updates.name,
          description: updates.description,
          trigger_event: updates.trigger_event,
          trigger_conditions: updates.trigger_conditions,
          is_active: updates.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', automationId)
        .select()
        .single();

      if (error) throw error;

      // Update steps if provided
      let steps = [];
      if (updates.steps) {
        // Delete existing steps
        await supabase
          .from('email_automation_steps')
          .delete()
          .eq('automation_id', automationId);

        // Create new steps
        steps = await this.createAutomationSteps(automationId, updates.steps);
      } else {
        // Get existing steps
        const { data: existingSteps } = await supabase
          .from('email_automation_steps')
          .select('*')
          .eq('automation_id', automationId)
          .order('step_number', { ascending: true });

        steps = existingSteps || [];
      }

      console.log(`✅ Email automation updated: ${automationId}`);
      return { ...data, steps };

    } catch (error) {
      console.error('❌ Failed to update email automation:', error);
      throw error;
    }
  }

  async toggleAutomationStatus(automationId: string, isActive: boolean): Promise<void> {
    try {
      console.log(`${isActive ? '▶️' : '⏸️'} ${isActive ? 'Activating' : 'Deactivating'} automation: ${automationId}`);

      const { error } = await supabase
        .from('email_automations')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', automationId);

      if (error) throw error;

      console.log(`✅ Automation ${isActive ? 'activated' : 'deactivated'}: ${automationId}`);

    } catch (error) {
      console.error(`❌ Failed to ${isActive ? 'activate' : 'deactivate'} automation:`, error);
      throw error;
    }
  } 
 // Automation Processing
  private async processAutomations(): Promise<void> {
    try {
      // Process triggers for active automations
      await this.checkAutomationTriggers();

      // Process active executions
      await this.processActiveExecutions();

    } catch (error) {
      console.error('Failed to process automations:', error);
    }
  }

  private async checkAutomationTriggers(): Promise<void> {
    try {
      // Get active automations
      const { data: automations, error } = await supabase
        .from('email_automations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const automation of automations || []) {
        try {
          await this.checkTriggerEvents(automation);
        } catch (error) {
          console.error(`Failed to check triggers for automation ${automation.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Failed to check automation triggers:', error);
    }
  }

  private async checkTriggerEvents(automation: EmailAutomation): Promise<void> {
    switch (automation.trigger_event) {
      case 'contact_created':
        await this.checkNewContactTrigger(automation);
        break;
      case 'field_updated':
        await this.checkFieldUpdateTrigger(automation);
        break;
      case 'segment_added':
        await this.checkSegmentAddedTrigger(automation);
        break;
      case 'form_submitted':
        await this.checkFormSubmittedTrigger(automation);
        break;
      case 'website_activity':
        await this.checkWebsiteActivityTrigger(automation);
        break;
      case 'date_based':
        await this.checkDateBasedTrigger(automation);
        break;
    }
  }

  private async checkNewContactTrigger(automation: EmailAutomation): Promise<void> {
    // Get recently created contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', automation.user_id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .is('automation_triggered', null);

    if (error) return;

    for (const contact of contacts || []) {
      if (this.evaluateConditions(automation.trigger_conditions, contact)) {
        await this.startAutomationExecution(automation.id, contact.id);
        
        // Mark as triggered to prevent duplicate execution
        await supabase
          .from('contacts')
          .update({ automation_triggered: automation.id })
          .eq('id', contact.id);
      }
    }
  }

  private async checkFieldUpdateTrigger(automation: EmailAutomation): Promise<void> {
    // Implementation for field update triggers
    console.log('Checking field update triggers...');
  }

  private async checkSegmentAddedTrigger(automation: EmailAutomation): Promise<void> {
    // Implementation for segment added triggers
    console.log('Checking segment added triggers...');
  }

  private async checkFormSubmittedTrigger(automation: EmailAutomation): Promise<void> {
    // Implementation for form submitted triggers
    console.log('Checking form submitted triggers...');
  }

  private async checkWebsiteActivityTrigger(automation: EmailAutomation): Promise<void> {
    // Implementation for website activity triggers
    console.log('Checking website activity triggers...');
  }

  private async checkDateBasedTrigger(automation: EmailAutomation): Promise<void> {
    // Implementation for date-based triggers
    console.log('Checking date-based triggers...');
  }

  private evaluateConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (data[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  async startAutomationExecution(automationId: string, contactId: string): Promise<EmailAutomationExecution> {
    try {
      console.log(`🚀 Starting automation execution: ${automationId} for contact ${contactId}`);

      // Get automation details
      const { data: automation, error: automationError } = await supabase
        .from('email_automations')
        .select('*')
        .eq('id', automationId)
        .single();

      if (automationError) throw automationError;

      // Get first step
      const { data: steps, error: stepsError } = await supabase
        .from('email_automation_steps')
        .select('*')
        .eq('automation_id', automationId)
        .eq('is_active', true)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      if (!steps || steps.length === 0) {
        throw new Error('No active steps found for automation');
      }

      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('email_automation_executions')
        .insert({
          automation_id: automationId,
          contact_id: contactId,
          current_step: 1,
          status: 'active',
          started_at: new Date().toISOString(),
          execution_data: {}
        })
        .select()
        .single();

      if (executionError) throw executionError;

      // Execute first step
      await this.executeStep(execution, steps[0]);

      console.log(`✅ Automation execution started: ${execution.id}`);
      return execution;

    } catch (error) {
      console.error('❌ Failed to start automation execution:', error);
      throw error;
    }
  }

  private async processActiveExecutions(): Promise<void> {
    try {
      // Get executions ready for next step
      const { data: executions, error } = await supabase
        .from('email_automation_executions')
        .select('*')
        .eq('status', 'active')
        .lte('next_execution_at', new Date().toISOString());

      if (error) throw error;

      for (const execution of executions || []) {
        try {
          await this.processExecution(execution);
        } catch (error) {
          console.error(`Failed to process execution ${execution.id}:`, error);
          
          // Mark execution as error
          await supabase
            .from('email_automation_executions')
            .update({
              status: 'error',
              error_message: error.toString()
            })
            .eq('id', execution.id);
        }
      }

    } catch (error) {
      console.error('Failed to process active executions:', error);
    }
  }

  private async processExecution(execution: EmailAutomationExecution): Promise<void> {
    // Get next step
    const { data: steps, error } = await supabase
      .from('email_automation_steps')
      .select('*')
      .eq('automation_id', execution.automation_id)
      .eq('step_number', execution.current_step)
      .eq('is_active', true)
      .single();

    if (error || !steps) {
      // No more steps, mark as completed
      await supabase
        .from('email_automation_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', execution.id);
      return;
    }

    await this.executeStep(execution, steps);
  }

  private async executeStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {
    console.log(`🔄 Executing step ${step.step_number} for execution ${execution.id}`);

    switch (step.step_type) {
      case 'send_email':
        await this.executeSendEmailStep(execution, step);
        break;
      case 'wait':
        await this.executeWaitStep(execution, step);
        break;
      case 'condition':
        await this.executeConditionStep(execution, step);
        break;
      case 'action':
        await this.executeActionStep(execution, step);
        break;
    }
  }

  private async executeSendEmailStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {
    try {
      const stepData = step.step_data;
      
      // Create campaign for this email
      const campaign = await emailCampaignService.createCampaign({
        user_id: stepData.user_id,
        name: `Automation Email - ${step.automation_id}`,
        campaign_type: 'automated',
        subject_line: stepData.subject_line,
        from_name: stepData.from_name,
        from_email: stepData.from_email,
        html_content: stepData.html_content,
        text_content: stepData.text_content,
        template_id: stepData.template_id,
        estimated_recipients: 1,
        metadata: { automation_id: step.automation_id, execution_id: execution.id }
      });

      // Send to specific contact
      // This would be implemented with actual email sending logic

      // Move to next step
      await this.moveToNextStep(execution);

    } catch (error) {
      console.error('Failed to execute send email step:', error);
      throw error;
    }
  }

  private async executeWaitStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {
    const waitTime = step.step_data.wait_time || 24; // hours
    const nextExecutionTime = new Date(Date.now() + waitTime * 60 * 60 * 1000);

    await supabase
      .from('email_automation_executions')
      .update({
        next_execution_at: nextExecutionTime.toISOString(),
        current_step: execution.current_step + 1
      })
      .eq('id', execution.id);
  }

  private async executeConditionStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {
    // Get contact data
    const { data: contact, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', execution.contact_id)
      .single();

    if (error) throw error;

    // Evaluate condition
    const condition = step.step_data.condition;
    const conditionMet = this.evaluateConditions(condition, contact);

    // Move to appropriate next step
    const nextStep = conditionMet ? step.step_data.true_step : step.step_data.false_step;
    
    await supabase
      .from('email_automation_executions')
      .update({
        current_step: nextStep,
        next_execution_at: new Date().toISOString()
      })
      .eq('id', execution.id);
  }

  private async executeActionStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {
    const action = step.step_data.action;
    
    switch (action.type) {
      case 'add_tag':
        // Add tag to contact
        break;
      case 'update_field':
        // Update contact field
        break;
      case 'add_to_segment':
        // Add contact to segment
        break;
    }

    await this.moveToNextStep(execution);
  }

  private async moveToNextStep(execution: EmailAutomationExecution): Promise<void> {
    await supabase
      .from('email_automation_executions')
      .update({
        current_step: execution.current_step + 1,
        next_execution_at: new Date().toISOString()
      })
      .eq('id', execution.id);
  }

  // Analytics and Metrics
  async getAutomationMetrics(automationId: string): Promise<EmailAutomationMetrics> {
    try {
      // Get execution data
      const { data: executions, error } = await supabase
        .from('email_automation_executions')
        .select('*')
        .eq('automation_id', automationId);

      if (error) throw error;

      const totalExecutions = executions?.length || 0;
      const activeExecutions = executions?.filter(e => e.status === 'active').length || 0;
      const completedExecutions = executions?.filter(e => e.status === 'completed').length || 0;
      
      const conversionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
      
      // Calculate average completion time
      const completedWithTime = executions?.filter(e => e.status === 'completed' && e.completed_at) || [];
      const averageCompletionTime = completedWithTime.length > 0 
        ? completedWithTime.reduce((sum, e) => {
            const start = new Date(e.started_at).getTime();
            const end = new Date(e.completed_at!).getTime();
            return sum + (end - start);
          }, 0) / completedWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Mock step metrics
      const stepMetrics = [
        { step_number: 1, success_rate: 95, average_time: 0.1 },
        { step_number: 2, success_rate: 88, average_time: 24 },
        { step_number: 3, success_rate: 82, average_time: 0.2 }
      ];

      return {
        automation_id: automationId,
        total_executions: totalExecutions,
        active_executions: activeExecutions,
        completed_executions: completedExecutions,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_completion_time: Math.round(averageCompletionTime * 100) / 100,
        step_metrics: stepMetrics
      };

    } catch (error) {
      console.error('❌ Failed to get automation metrics:', error);
      throw error;
    }
  }

  // Predefined Automation Templates
  async createWelcomeSequence(userId: string, templateId?: string): Promise<EmailAutomation> {
    const welcomeAutomation: Omit<EmailAutomation, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      name: 'Welcome Email Sequence',
      description: 'Automated welcome sequence for new contacts',
      trigger_event: 'contact_created',
      trigger_conditions: {},
      is_active: true,
      steps: [
        {
          step_number: 1,
          step_type: 'send_email',
          step_data: {
            template_id: templateId,
            subject_line: 'Welcome! Let\'s get started',
            from_name: 'Welcome Team',
            from_email: 'welcome@company.com'
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>,
        {
          step_number: 2,
          step_type: 'wait',
          step_data: {
            wait_time: 24 // 24 hours
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>,
        {
          step_number: 3,
          step_type: 'send_email',
          step_data: {
            subject_line: 'Getting the most out of your account',
            from_name: 'Success Team',
            from_email: 'success@company.com'
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>
      ]
    };

    return await this.createAutomation(welcomeAutomation);
  }

  async createAbandonedCartSequence(userId: string): Promise<EmailAutomation> {
    const cartAutomation: Omit<EmailAutomation, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      name: 'Abandoned Cart Recovery',
      description: 'Recover abandoned shopping carts',
      trigger_event: 'website_activity',
      trigger_conditions: { event: 'cart_abandoned' },
      is_active: true,
      steps: [
        {
          step_number: 1,
          step_type: 'wait',
          step_data: {
            wait_time: 1 // 1 hour
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>,
        {
          step_number: 2,
          step_type: 'send_email',
          step_data: {
            subject_line: 'You left something in your cart',
            from_name: 'Sales Team',
            from_email: 'sales@company.com'
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>,
        {
          step_number: 3,
          step_type: 'wait',
          step_data: {
            wait_time: 24 // 24 hours
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>,
        {
          step_number: 4,
          step_type: 'send_email',
          step_data: {
            subject_line: 'Special discount for you!',
            from_name: 'Sales Team',
            from_email: 'sales@company.com'
          },
          is_active: true
        } as Omit<EmailAutomationStep, 'id' | 'automation_id' | 'created_at'>
      ]
    };

    return await this.createAutomation(cartAutomation);
  }

  // Cleanup
  public cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Export singleton instance
export const emailAutomationService = EmailAutomationService.getInstance(); 
       .eq('is_active', true)
        .order('step_number', { ascending: true })
        .limit(1);

      if (stepsError) throw stepsError;

      if (!steps || steps.length === 0) {
        throw new Error('No steps found for automation');
      }

      // Create execution record
      const { data, error } = await supabase
        .from('email_automation_executions')
        .insert({
          automation_id: automationId,
          contact_id: contactId,
          current_step: 1,
          status: 'active',
          started_at: new Date().toISOString(),
          next_execution_at: new Date().toISOString(),
          execution_data: {}
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Automation execution started: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to start automation execution:', error);
      throw error;
    }
  }

  private async processActiveExecutions(): Promise<void> {\n    try {\n      // Get executions ready for processing\n      const { data: executions, error } = await supabase\n        .from('email_automation_executions')\n        .select('*')\n        .eq('status', 'active')\n        .lte('next_execution_at', new Date().toISOString());\n\n      if (error) throw error;\n\n      for (const execution of executions || []) {\n        try {\n          await this.processExecution(execution);\n        } catch (error) {\n          console.error(`Failed to process execution ${execution.id}:`, error);\n          \n          // Mark execution as error\n          await supabase\n            .from('email_automation_executions')\n            .update({\n              status: 'error',\n              error_message: error.toString()\n            })\n            .eq('id', execution.id);\n        }\n      }\n\n    } catch (error) {\n      console.error('Failed to process active executions:', error);\n    }\n  }\n\n  private async processExecution(execution: EmailAutomationExecution): Promise<void> {\n    console.log(`⚙️ Processing execution: ${execution.id} at step ${execution.current_step}`);\n\n    // Get automation and current step\n    const { data: automation, error: automationError } = await supabase\n      .from('email_automations')\n      .select('*')\n      .eq('id', execution.automation_id)\n      .single();\n\n    if (automationError) throw automationError;\n\n    const { data: step, error: stepError } = await supabase\n      .from('email_automation_steps')\n      .select('*')\n      .eq('automation_id', execution.automation_id)\n      .eq('step_number', execution.current_step)\n      .single();\n\n    if (stepError) throw stepError;\n\n    // Execute step\n    await this.executeStep(execution, step);\n\n    // Move to next step or complete\n    const { data: nextStep, error: nextStepError } = await supabase\n      .from('email_automation_steps')\n      .select('*')\n      .eq('automation_id', execution.automation_id)\n      .eq('step_number', execution.current_step + 1)\n      .single();\n\n    if (nextStepError || !nextStep) {\n      // Complete execution\n      await supabase\n        .from('email_automation_executions')\n        .update({\n          status: 'completed',\n          completed_at: new Date().toISOString()\n        })\n        .eq('id', execution.id);\n\n      console.log(`✅ Automation execution completed: ${execution.id}`);\n    } else {\n      // Move to next step\n      const nextExecutionTime = this.calculateNextExecutionTime(nextStep);\n      \n      await supabase\n        .from('email_automation_executions')\n        .update({\n          current_step: execution.current_step + 1,\n          next_execution_at: nextExecutionTime.toISOString()\n        })\n        .eq('id', execution.id);\n\n      console.log(`➡️ Moved to next step: ${execution.current_step + 1}`);\n    }\n  }\n\n  private async executeStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {\n    switch (step.step_type) {\n      case 'send_email':\n        await this.executeSendEmailStep(execution, step);\n        break;\n      case 'wait':\n        await this.executeWaitStep(execution, step);\n        break;\n      case 'condition':\n        await this.executeConditionStep(execution, step);\n        break;\n      case 'action':\n        await this.executeActionStep(execution, step);\n        break;\n      default:\n        console.warn(`Unknown step type: ${step.step_type}`);\n    }\n  }\n\n  private async executeSendEmailStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {\n    try {\n      console.log(`📧 Executing send email step for contact ${execution.contact_id}`);\n\n      const stepData = step.step_data;\n      \n      // Get contact details\n      const { data: contact, error: contactError } = await supabase\n        .from('contacts')\n        .select('*')\n        .eq('id', execution.contact_id)\n        .single();\n\n      if (contactError) throw contactError;\n\n      // Create and send campaign\n      const campaign = await emailCampaignService.createCampaign({\n        user_id: contact.user_id,\n        name: `Automation Email - ${stepData.subject || 'Automated Email'}`,\n        description: `Automated email from automation ${execution.automation_id}`,\n        status: 'draft',\n        campaign_type: 'automated',\n        subject_line: stepData.subject || 'Automated Email',\n        preview_text: stepData.preview_text,\n        from_name: stepData.from_name || 'HigherUp.ai',\n        from_email: stepData.from_email || 'noreply@higherup.ai',\n        template_id: stepData.template_id,\n        html_content: stepData.html_content,\n        text_content: stepData.text_content,\n        recipient_filter: { id: execution.contact_id },\n        estimated_recipients: 1,\n        metadata: {\n          automation_id: execution.automation_id,\n          execution_id: execution.id,\n          step_number: step.step_number\n        }\n      });\n\n      // Send immediately\n      await emailCampaignService.sendCampaignNow(campaign.id);\n\n      console.log(`✅ Email sent for automation step`);\n\n    } catch (error) {\n      console.error('❌ Failed to execute send email step:', error);\n      throw error;\n    }\n  }\n\n  private async executeWaitStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {\n    console.log(`⏰ Executing wait step: ${step.step_data.duration} ${step.step_data.unit}`);\n    // Wait step is handled by setting next_execution_at in processExecution\n  }\n\n  private async executeConditionStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {\n    console.log(`🔍 Executing condition step`);\n    \n    // Get contact data\n    const { data: contact, error } = await supabase\n      .from('contacts')\n      .select('*')\n      .eq('id', execution.contact_id)\n      .single();\n\n    if (error) throw error;\n\n    // Evaluate condition\n    const conditionMet = this.evaluateConditions(step.step_data.conditions, contact);\n    \n    if (!conditionMet) {\n      // Skip to alternative step or end\n      const alternativeStep = step.step_data.alternative_step;\n      if (alternativeStep) {\n        await supabase\n          .from('email_automation_executions')\n          .update({\n            current_step: alternativeStep,\n            next_execution_at: new Date().toISOString()\n          })\n          .eq('id', execution.id);\n      } else {\n        // End execution\n        await supabase\n          .from('email_automation_executions')\n          .update({\n            status: 'completed',\n            completed_at: new Date().toISOString()\n          })\n          .eq('id', execution.id);\n      }\n    }\n  }\n\n  private async executeActionStep(execution: EmailAutomationExecution, step: EmailAutomationStep): Promise<void> {\n    console.log(`⚡ Executing action step: ${step.step_data.action_type}`);\n    \n    switch (step.step_data.action_type) {\n      case 'add_tag':\n        await this.addTagToContact(execution.contact_id, step.step_data.tag);\n        break;\n      case 'update_field':\n        await this.updateContactField(execution.contact_id, step.step_data.field, step.step_data.value);\n        break;\n      case 'add_to_segment':\n        await this.addContactToSegment(execution.contact_id, step.step_data.segment_id);\n        break;\n      default:\n        console.warn(`Unknown action type: ${step.step_data.action_type}`);\n    }\n  }\n\n  private calculateNextExecutionTime(step: EmailAutomationStep): Date {\n    const now = new Date();\n    \n    if (step.step_type === 'wait') {\n      const duration = step.step_data.duration || 1;\n      const unit = step.step_data.unit || 'hours';\n      \n      switch (unit) {\n        case 'minutes':\n          return new Date(now.getTime() + duration * 60 * 1000);\n        case 'hours':\n          return new Date(now.getTime() + duration * 60 * 60 * 1000);\n        case 'days':\n          return new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);\n        case 'weeks':\n          return new Date(now.getTime() + duration * 7 * 24 * 60 * 60 * 1000);\n        default:\n          return new Date(now.getTime() + 60 * 60 * 1000); // Default 1 hour\n      }\n    }\n    \n    return now; // Execute immediately\n  }\n\n  private async addTagToContact(contactId: string, tag: string): Promise<void> {\n    try {\n      const { data: contact, error: contactError } = await supabase\n        .from('contacts')\n        .select('tags')\n        .eq('id', contactId)\n        .single();\n\n      if (contactError) throw contactError;\n\n      const currentTags = contact.tags || [];\n      if (!currentTags.includes(tag)) {\n        await supabase\n          .from('contacts')\n          .update({\n            tags: [...currentTags, tag],\n            updated_at: new Date().toISOString()\n          })\n          .eq('id', contactId);\n      }\n\n    } catch (error) {\n      console.error('Failed to add tag to contact:', error);\n    }\n  }\n\n  private async updateContactField(contactId: string, field: string, value: any): Promise<void> {\n    try {\n      await supabase\n        .from('contacts')\n        .update({\n          [field]: value,\n          updated_at: new Date().toISOString()\n        })\n        .eq('id', contactId);\n\n    } catch (error) {\n      console.error('Failed to update contact field:', error);\n    }\n  }\n\n  private async addContactToSegment(contactId: string, segmentId: string): Promise<void> {\n    try {\n      await supabase\n        .from('contact_segment_members')\n        .insert({\n          contact_id: contactId,\n          segment_id: segmentId,\n          added_at: new Date().toISOString()\n        });\n\n    } catch (error) {\n      console.error('Failed to add contact to segment:', error);\n    }\n  }
  // Aut
omation Analytics
  async getAutomationMetrics(automationId: string): Promise<EmailAutomationMetrics> {
    try {
      // Get execution data
      const { data: executions, error: executionsError } = await supabase
        .from('email_automation_executions')
        .select('*')
        .eq('automation_id', automationId);

      if (executionsError) throw executionsError;

      const totalExecutions = executions?.length || 0;
      const activeExecutions = executions?.filter(e => e.status === 'active').length || 0;
      const completedExecutions = executions?.filter(e => e.status === 'completed').length || 0;

      // Calculate conversion rate (completed / total)
      const conversionRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

      // Calculate average completion time
      const completedWithTime = executions?.filter(e => e.status === 'completed' && e.started_at && e.completed_at) || [];
      const averageCompletionTime = completedWithTime.length > 0 
        ? completedWithTime.reduce((sum, e) => {
            const start = new Date(e.started_at).getTime();
            const end = new Date(e.completed_at!).getTime();
            return sum + (end - start);
          }, 0) / completedWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Get step metrics
      const { data: steps, error: stepsError } = await supabase
        .from('email_automation_steps')
        .select('*')
        .eq('automation_id', automationId)
        .order('step_number', { ascending: true });

      if (stepsError) throw stepsError;

      const stepMetrics = (steps || []).map(step => {
        const stepExecutions = executions?.filter(e => e.current_step >= step.step_number) || [];
        const stepCompletions = executions?.filter(e => e.current_step > step.step_number || e.status === 'completed') || [];
        
        return {
          step_number: step.step_number,
          success_rate: stepExecutions.length > 0 ? (stepCompletions.length / stepExecutions.length) * 100 : 0,
          average_time: 0 // Would need more detailed tracking for this
        };
      });

      return {
        automation_id: automationId,
        total_executions: totalExecutions,
        active_executions: activeExecutions,
        completed_executions: completedExecutions,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_completion_time: Math.round(averageCompletionTime * 100) / 100,
        step_metrics: stepMetrics
      };

    } catch (error) {
      console.error('❌ Failed to get automation metrics:', error);
      throw error;
    }
  }

  async pauseExecution(executionId: string): Promise<void> {
    try {
      console.log(`⏸️ Pausing automation execution: ${executionId}`);

      const { error } = await supabase
        .from('email_automation_executions')
        .update({
          status: 'paused',
          next_execution_at: null
        })
        .eq('id', executionId);

      if (error) throw error;

      console.log(`✅ Automation execution paused: ${executionId}`);

    } catch (error) {
      console.error('❌ Failed to pause automation execution:', error);
      throw error;
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    try {
      console.log(`▶️ Resuming automation execution: ${executionId}`);

      const { error } = await supabase
        .from('email_automation_executions')
        .update({
          status: 'active',
          next_execution_at: new Date().toISOString()
        })
        .eq('id', executionId);

      if (error) throw error;

      console.log(`✅ Automation execution resumed: ${executionId}`);

    } catch (error) {
      console.error('❌ Failed to resume automation execution:', error);
      throw error;
    }
  }

  async cancelExecution(executionId: string): Promise<void> {
    try {
      console.log(`❌ Cancelling automation execution: ${executionId}`);

      const { error } = await supabase
        .from('email_automation_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      if (error) throw error;

      console.log(`✅ Automation execution cancelled: ${executionId}`);

    } catch (error) {
      console.error('❌ Failed to cancel automation execution:', error);
      throw error;
    }
  }

  // Default Automation Templates
  async setupDefaultAutomations(userId: string): Promise<void> {
    try {
      console.log('🔧 Setting up default email automations...');

      const defaultAutomations: Array<Omit<EmailAutomation, 'id' | 'created_at' | 'updated_at'>> = [
        {
          user_id: userId,
          name: 'Welcome Series',
          description: 'Welcome new contacts with a series of onboarding emails',
          trigger_event: 'contact_created',
          trigger_conditions: {},
          is_active: true,
          steps: [
            {
              step_number: 1,
              step_type: 'send_email',
              step_data: {
                subject: 'Welcome to HigherUp.ai!',
                template_id: null,
                html_content: '<h1>Welcome {{first_name}}!</h1><p>Thank you for joining us. We\'re excited to have you on board.</p>',
                text_content: 'Welcome {{first_name}}! Thank you for joining us.',
                from_name: 'HigherUp.ai Team',
                from_email: 'welcome@higherup.ai'
              },
              is_active: true
            },
            {
              step_number: 2,
              step_type: 'wait',
              step_data: {
                duration: 2,
                unit: 'days'
              },
              is_active: true
            },
            {
              step_number: 3,
              step_type: 'send_email',
              step_data: {
                subject: 'Getting Started with HigherUp.ai',
                html_content: '<h1>Getting Started</h1><p>Here are some resources to help you get the most out of HigherUp.ai.</p>',
                text_content: 'Getting Started - Here are some resources to help you get the most out of HigherUp.ai.',
                from_name: 'HigherUp.ai Team',
                from_email: 'support@higherup.ai'
              },
              is_active: true
            }
          ]
        },
        {
          user_id: userId,
          name: 'Abandoned Cart Recovery',
          description: 'Re-engage contacts who abandoned their cart',
          trigger_event: 'website_activity',
          trigger_conditions: {
            activity_type: 'cart_abandoned'
          },
          is_active: false, // Disabled by default
          steps: [
            {
              step_number: 1,
              step_type: 'wait',
              step_data: {
                duration: 1,
                unit: 'hours'
              },
              is_active: true
            },
            {
              step_number: 2,
              step_type: 'send_email',
              step_data: {
                subject: 'You left something behind...',
                html_content: '<h1>Complete Your Purchase</h1><p>Hi {{first_name}}, you left some items in your cart. Complete your purchase now!</p>',
                text_content: 'Hi {{first_name}}, you left some items in your cart. Complete your purchase now!',
                from_name: 'HigherUp.ai',
                from_email: 'sales@higherup.ai'
              },
              is_active: true
            },
            {
              step_number: 3,
              step_type: 'wait',
              step_data: {
                duration: 2,
                unit: 'days'
              },
              is_active: true
            },
            {
              step_number: 4,
              step_type: 'send_email',
              step_data: {
                subject: 'Last chance - 10% off your order',
                html_content: '<h1>Don\'t Miss Out!</h1><p>Complete your purchase now and save 10% with code SAVE10.</p>',
                text_content: 'Don\'t miss out! Complete your purchase now and save 10% with code SAVE10.',
                from_name: 'HigherUp.ai',
                from_email: 'sales@higherup.ai'
              },
              is_active: true
            }
          ]
        },
        {
          user_id: userId,
          name: 'Lead Nurturing Sequence',
          description: 'Nurture leads with educational content',
          trigger_event: 'segment_added',
          trigger_conditions: {
            segment_name: 'leads'
          },
          is_active: true,
          steps: [
            {
              step_number: 1,
              step_type: 'send_email',
              step_data: {
                subject: 'Thanks for your interest in HigherUp.ai',
                html_content: '<h1>Thanks for your interest!</h1><p>Here\'s some valuable information to help you succeed.</p>',
                text_content: 'Thanks for your interest! Here\'s some valuable information to help you succeed.',
                from_name: 'HigherUp.ai Team',
                from_email: 'leads@higherup.ai'
              },
              is_active: true
            },
            {
              step_number: 2,
              step_type: 'wait',
              step_data: {
                duration: 3,
                unit: 'days'
              },
              is_active: true
            },
            {
              step_number: 3,
              step_type: 'send_email',
              step_data: {
                subject: 'Case Study: How Company X Increased Revenue by 300%',
                html_content: '<h1>Success Story</h1><p>Learn how Company X used HigherUp.ai to transform their business.</p>',
                text_content: 'Success Story - Learn how Company X used HigherUp.ai to transform their business.',
                from_name: 'HigherUp.ai Team',
                from_email: 'leads@higherup.ai'
              },
              is_active: true
            },
            {
              step_number: 4,
              step_type: 'wait',
              step_data: {
                duration: 5,
                unit: 'days'
              },
              is_active: true
            },
            {
              step_number: 5,
              step_type: 'send_email',
              step_data: {
                subject: 'Ready to get started?',
                html_content: '<h1>Ready to Transform Your Business?</h1><p>Schedule a demo and see HigherUp.ai in action.</p>',
                text_content: 'Ready to transform your business? Schedule a demo and see HigherUp.ai in action.',
                from_name: 'HigherUp.ai Sales',
                from_email: 'sales@higherup.ai'
              },
              is_active: true
            }
          ]
        }
      ];

      for (const automation of defaultAutomations) {
        await this.createAutomation(automation);
      }

      console.log(`✅ Created ${defaultAutomations.length} default email automations`);

    } catch (error) {
      console.error('❌ Failed to setup default email automations:', error);
      throw error;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Export singleton instance
export const emailAutomationService = EmailAutomationService.getInstance();
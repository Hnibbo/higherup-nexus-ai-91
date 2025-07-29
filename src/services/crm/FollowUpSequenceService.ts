import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { taskManagementService } from './TaskManagementService';

export interface FollowUpSequence {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_event: 'contact_created' | 'deal_stage_change' | 'email_opened' | 'email_clicked' | 'form_submitted' | 'custom';
  trigger_conditions: Record<string, any>;
  steps: Array<{
    step_number: number;
    delay_days: number;
    delay_hours: number;
    action_type: 'email' | 'task' | 'call' | 'sms' | 'webhook';
    action_data: Record<string, any>;
    conditions?: Record<string, any>;
  }>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enrolled_at: Date;
  next_action_at: Date;
  completed_at?: Date;
  metadata: Record<string, any>;
}

export interface SequenceStep {
  id: string;
  enrollment_id: string;
  step_number: number;
  action_type: string;
  scheduled_at: Date;
  executed_at?: Date;
  status: 'scheduled' | 'executed' | 'failed' | 'skipped';
  result_data?: Record<string, any>;
  error_message?: string;
}

export interface SequenceMetrics {
  sequence_id: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  completion_rate: number;
  average_completion_time: number;
  step_performance: Array<{
    step_number: number;
    execution_rate: number;
    success_rate: number;
    average_response_time: number;
  }>;
  conversion_metrics: {
    email_open_rate: number;
    email_click_rate: number;
    task_completion_rate: number;
    overall_engagement_rate: number;
  };
}

export class FollowUpSequenceService {
  private static instance: FollowUpSequenceService;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startSequenceProcessor();
  }

  public static getInstance(): FollowUpSequenceService {
    if (!FollowUpSequenceService.instance) {
      FollowUpSequenceService.instance = new FollowUpSequenceService();
    }
    return FollowUpSequenceService.instance;
  }

  private startSequenceProcessor(): void {
    // Process sequences every minute
    this.processingInterval = setInterval(async () => {
      try {
        await this.processScheduledActions();
      } catch (error) {
        console.error('Sequence processing failed:', error);
      }
    }, 60000);
  }

  // Sequence Management
  async createFollowUpSequence(sequence: Omit<FollowUpSequence, 'id' | 'created_at' | 'updated_at'>): Promise<FollowUpSequence> {
    try {
      console.log(`🔄 Creating follow-up sequence: ${sequence.name}`);

      const { data, error } = await supabase
        .from('followup_sequences')
        .insert({
          user_id: sequence.user_id,
          name: sequence.name,
          description: sequence.description,
          trigger_event: sequence.trigger_event,
          trigger_conditions: sequence.trigger_conditions,
          steps: sequence.steps,
          is_active: sequence.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Follow-up sequence created: ${sequence.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create follow-up sequence:', error);
      throw error;
    }
  }

  async getFollowUpSequences(userId: string): Promise<FollowUpSequence[]> {
    try {
      const { data, error } = await supabase
        .from('followup_sequences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get follow-up sequences:', error);
      throw error;
    }
  }

  async updateFollowUpSequence(sequenceId: string, updates: Partial<FollowUpSequence>): Promise<FollowUpSequence> {
    try {
      const { data, error } = await supabase
        .from('followup_sequences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sequenceId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Follow-up sequence updated: ${sequenceId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update follow-up sequence:', error);
      throw error;
    }
  }

  // Enrollment Management
  async enrollContactInSequence(sequenceId: string, contactId: string, metadata?: Record<string, any>): Promise<SequenceEnrollment> {
    try {
      console.log(`📝 Enrolling contact ${contactId} in sequence ${sequenceId}`);

      // Check if contact is already enrolled
      const { data: existingEnrollment } = await supabase
        .from('sequence_enrollments')
        .select('id')
        .eq('sequence_id', sequenceId)
        .eq('contact_id', contactId)
        .eq('status', 'active')
        .single();

      if (existingEnrollment) {
        throw new Error('Contact is already enrolled in this sequence');
      }

      // Get sequence details
      const { data: sequence, error: sequenceError } = await supabase
        .from('followup_sequences')
        .select('*')
        .eq('id', sequenceId)
        .single();

      if (sequenceError) throw sequenceError;

      // Calculate next action time
      const firstStep = sequence.steps.find(s => s.step_number === 1);
      const nextActionAt = new Date();
      if (firstStep) {
        nextActionAt.setDate(nextActionAt.getDate() + firstStep.delay_days);
        nextActionAt.setHours(nextActionAt.getHours() + firstStep.delay_hours);
      }

      // Create enrollment
      const { data, error } = await supabase
        .from('sequence_enrollments')
        .insert({
          sequence_id: sequenceId,
          contact_id: contactId,
          current_step: 0,
          status: 'active',
          enrolled_at: new Date().toISOString(),
          next_action_at: nextActionAt.toISOString(),
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule first step
      if (firstStep) {
        await this.scheduleSequenceStep(data.id, firstStep, nextActionAt);
      }

      // Create activity record
      await supabase
        .from('contact_interactions')
        .insert({
          user_id: sequence.user_id,
          contact_id: contactId,
          interaction_type: 'sequence_enrolled',
          description: `Enrolled in follow-up sequence: ${sequence.name}`,
          created_at: new Date().toISOString()
        });

      console.log(`✅ Contact enrolled in sequence: ${contactId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to enroll contact in sequence:', error);
      throw error;
    }
  }

  async unenrollContactFromSequence(enrollmentId: string, reason?: string): Promise<void> {
    try {
      console.log(`❌ Unenrolling contact from sequence: ${enrollmentId}`);

      // Update enrollment status
      const { data: enrollment, error } = await supabase
        .from('sequence_enrollments')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          metadata: { cancellation_reason: reason }
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;

      // Cancel scheduled steps
      await supabase
        .from('sequence_steps')
        .update({ status: 'skipped' })
        .eq('enrollment_id', enrollmentId)
        .eq('status', 'scheduled');

      console.log(`✅ Contact unenrolled from sequence: ${enrollmentId}`);

    } catch (error) {
      console.error('❌ Failed to unenroll contact from sequence:', error);
      throw error;
    }
  }

  private async scheduleSequenceStep(enrollmentId: string, step: any, scheduledAt: Date): Promise<void> {
    try {
      await supabase
        .from('sequence_steps')
        .insert({
          enrollment_id: enrollmentId,
          step_number: step.step_number,
          action_type: step.action_type,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled'
        });

    } catch (error) {
      console.error('Failed to schedule sequence step:', error);
    }
  }

  // Sequence Processing
  private async processScheduledActions(): Promise<void> {
    try {
      // Get scheduled steps that are due
      const { data: dueSteps, error } = await supabase
        .from('sequence_steps')
        .select('*, enrollment:enrollment_id(*)')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())
        .limit(50);

      if (error) throw error;

      for (const step of dueSteps || []) {
        try {
          await this.executeSequenceStep(step);
        } catch (error) {
          console.error(`Failed to execute sequence step ${step.id}:`, error);
          
          // Mark step as failed
          await supabase
            .from('sequence_steps')
            .update({
              status: 'failed',
              executed_at: new Date().toISOString(),
              error_message: error.toString()
            })
            .eq('id', step.id);
        }
      }

    } catch (error) {
      console.error('Failed to process scheduled actions:', error);
    }
  }

  private async executeSequenceStep(step: any): Promise<void> {
    try {
      console.log(`⚡ Executing sequence step: ${step.id} (${step.action_type})`);

      // Mark step as executing
      await supabase
        .from('sequence_steps')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString()
        })
        .eq('id', step.id);

      // Get sequence and enrollment details
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('sequence_enrollments')
        .select('*, sequence:sequence_id(*)')
        .eq('id', step.enrollment_id)
        .single();

      if (enrollmentError) throw enrollmentError;

      // Skip if enrollment is not active
      if (enrollment.status !== 'active') {
        await supabase
          .from('sequence_steps')
          .update({ status: 'skipped' })
          .eq('id', step.id);
        return;
      }

      const sequence = enrollment.sequence;
      const sequenceStep = sequence.steps.find((s: any) => s.step_number === step.step_number);

      if (!sequenceStep) {
        throw new Error(`Sequence step ${step.step_number} not found`);
      }

      // Check step conditions
      if (sequenceStep.conditions && !await this.evaluateStepConditions(sequenceStep.conditions, enrollment.contact_id)) {
        await supabase
          .from('sequence_steps')
          .update({ status: 'skipped' })
          .eq('id', step.id);
        return;
      }

      // Execute action based on type
      let resultData: Record<string, any> = {};

      switch (step.action_type) {
        case 'email':
          resultData = await this.executeEmailAction(sequenceStep.action_data, enrollment.contact_id);
          break;
        case 'task':
          resultData = await this.executeTaskAction(sequenceStep.action_data, enrollment.contact_id, sequence.user_id);
          break;
        case 'call':
          resultData = await this.executeCallAction(sequenceStep.action_data, enrollment.contact_id, sequence.user_id);
          break;
        case 'sms':
          resultData = await this.executeSMSAction(sequenceStep.action_data, enrollment.contact_id);
          break;
        case 'webhook':
          resultData = await this.executeWebhookAction(sequenceStep.action_data, enrollment.contact_id);
          break;
      }

      // Update step with result
      await supabase
        .from('sequence_steps')
        .update({ result_data: resultData })
        .eq('id', step.id);

      // Update enrollment progress
      await this.updateEnrollmentProgress(enrollment, sequenceStep);

      console.log(`✅ Sequence step executed: ${step.id}`);

    } catch (error) {
      console.error(`Failed to execute sequence step ${step.id}:`, error);
      throw error;
    }
  }

  private async evaluateStepConditions(conditions: Record<string, any>, contactId: string): Promise<boolean> {
    try {
      // Get contact data
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) return false;

      // Simple condition evaluation
      for (const [key, expectedValue] of Object.entries(conditions)) {
        if (contact[key] !== expectedValue) {
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Failed to evaluate step conditions:', error);
      return false;
    }
  }

  private async executeEmailAction(actionData: Record<string, any>, contactId: string): Promise<Record<string, any>> {
    // Mock email execution - in reality would integrate with email service
    console.log(`📧 Sending email to contact ${contactId}:`, actionData.subject);
    
    // Create email interaction record
    await supabase
      .from('contact_interactions')
      .insert({
        contact_id: contactId,
        interaction_type: 'email_sent',
        description: `Sequence email sent: ${actionData.subject}`,
        created_at: new Date().toISOString()
      });

    return {
      email_sent: true,
      subject: actionData.subject,
      sent_at: new Date().toISOString()
    };
  }

  private async executeTaskAction(actionData: Record<string, any>, contactId: string, userId: string): Promise<Record<string, any>> {
    try {
      // Create task
      const task = await taskManagementService.createTask({
        user_id: userId,
        title: actionData.title || 'Follow-up Task',
        description: actionData.description,
        task_type: actionData.task_type || 'follow_up',
        priority: actionData.priority || 'medium',
        status: 'pending',
        assigned_to: actionData.assigned_to || userId,
        contact_id: contactId,
        due_date: new Date(Date.now() + (actionData.due_in_hours || 24) * 60 * 60 * 1000),
        estimated_duration: actionData.estimated_duration || 30,
        tags: actionData.tags || ['sequence'],
        custom_fields: { sequence_generated: true }
      });

      return {
        task_created: true,
        task_id: task.id,
        task_title: task.title
      };

    } catch (error) {
      console.error('Failed to create sequence task:', error);
      return { task_created: false, error: error.toString() };
    }
  }

  private async executeCallAction(actionData: Record<string, any>, contactId: string, userId: string): Promise<Record<string, any>> {
    // Create call task
    const task = await taskManagementService.createTask({
      user_id: userId,
      title: actionData.title || 'Follow-up Call',
      description: actionData.description || 'Call contact as part of follow-up sequence',
      task_type: 'call',
      priority: actionData.priority || 'medium',
      status: 'pending',
      assigned_to: actionData.assigned_to || userId,
      contact_id: contactId,
      due_date: new Date(Date.now() + (actionData.due_in_hours || 2) * 60 * 60 * 1000),
      estimated_duration: actionData.estimated_duration || 15,
      tags: ['sequence', 'call'],
      custom_fields: { 
        sequence_generated: true,
        call_script: actionData.call_script
      }
    });

    return {
      call_task_created: true,
      task_id: task.id
    };
  }

  private async executeSMSAction(actionData: Record<string, any>, contactId: string): Promise<Record<string, any>> {
    // Mock SMS execution
    console.log(`📱 Sending SMS to contact ${contactId}:`, actionData.message);
    
    await supabase
      .from('contact_interactions')
      .insert({
        contact_id: contactId,
        interaction_type: 'sms_sent',
        description: `Sequence SMS sent: ${actionData.message.substring(0, 50)}...`,
        created_at: new Date().toISOString()
      });

    return {
      sms_sent: true,
      message: actionData.message,
      sent_at: new Date().toISOString()
    };
  }

  private async executeWebhookAction(actionData: Record<string, any>, contactId: string): Promise<Record<string, any>> {
    // Mock webhook execution
    console.log(`🔗 Executing webhook for contact ${contactId}:`, actionData.url);
    
    return {
      webhook_executed: true,
      url: actionData.url,
      executed_at: new Date().toISOString()
    };
  }

  private async updateEnrollmentProgress(enrollment: any, completedStep: any): Promise<void> {
    try {
      const sequence = enrollment.sequence;
      const nextStepNumber = completedStep.step_number + 1;
      const nextStep = sequence.steps.find((s: any) => s.step_number === nextStepNumber);

      if (nextStep) {
        // Schedule next step
        const nextActionAt = new Date();
        nextActionAt.setDate(nextActionAt.getDate() + nextStep.delay_days);
        nextActionAt.setHours(nextActionAt.getHours() + nextStep.delay_hours);

        await supabase
          .from('sequence_enrollments')
          .update({
            current_step: nextStepNumber,
            next_action_at: nextActionAt.toISOString()
          })
          .eq('id', enrollment.id);

        // Schedule the next step
        await this.scheduleSequenceStep(enrollment.id, nextStep, nextActionAt);

      } else {
        // Sequence completed
        await supabase
          .from('sequence_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);

        // Create completion activity
        await supabase
          .from('contact_interactions')
          .insert({
            user_id: sequence.user_id,
            contact_id: enrollment.contact_id,
            interaction_type: 'sequence_completed',
            description: `Completed follow-up sequence: ${sequence.name}`,
            created_at: new Date().toISOString()
          });
      }

    } catch (error) {
      console.error('Failed to update enrollment progress:', error);
    }
  }

  // Sequence Metrics
  async getSequenceMetrics(sequenceId: string): Promise<SequenceMetrics> {
    try {
      // Get enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('sequence_enrollments')
        .select('*')
        .eq('sequence_id', sequenceId);

      if (enrollmentsError) throw enrollmentsError;

      // Get steps
      const { data: steps, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('*')
        .in('enrollment_id', (enrollments || []).map(e => e.id));

      if (stepsError) throw stepsError;

      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
      const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

      // Calculate average completion time
      const completedWithTime = enrollments?.filter(e => 
        e.status === 'completed' && e.enrolled_at && e.completed_at
      ) || [];
      
      const averageCompletionTime = completedWithTime.length > 0
        ? completedWithTime.reduce((sum, enrollment) => {
            const duration = new Date(enrollment.completed_at).getTime() - new Date(enrollment.enrolled_at).getTime();
            return sum + duration;
          }, 0) / completedWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Calculate step performance
      const stepNumbers = [...new Set((steps || []).map(s => s.step_number))];
      const stepPerformance = stepNumbers.map(stepNumber => {
        const stepData = steps?.filter(s => s.step_number === stepNumber) || [];
        const executedSteps = stepData.filter(s => s.status === 'executed');
        const successfulSteps = stepData.filter(s => s.status === 'executed' && !s.error_message);

        return {
          step_number: stepNumber,
          execution_rate: stepData.length > 0 ? (executedSteps.length / stepData.length) * 100 : 0,
          success_rate: executedSteps.length > 0 ? (successfulSteps.length / executedSteps.length) * 100 : 0,
          average_response_time: 0 // Would calculate from actual response data
        };
      });

      // Mock conversion metrics
      const conversionMetrics = {
        email_open_rate: 35.5,
        email_click_rate: 12.3,
        task_completion_rate: 78.9,
        overall_engagement_rate: 42.1
      };

      return {
        sequence_id: sequenceId,
        total_enrollments: totalEnrollments,
        active_enrollments: activeEnrollments,
        completed_enrollments: completedEnrollments,
        completion_rate: Math.round(completionRate * 100) / 100,
        average_completion_time: Math.round(averageCompletionTime * 100) / 100,
        step_performance: stepPerformance,
        conversion_metrics: conversionMetrics
      };

    } catch (error) {
      console.error('❌ Failed to get sequence metrics:', error);
      throw error;
    }
  }

  // Trigger Detection
  async checkSequenceTriggers(): Promise<void> {
    try {
      console.log('🔍 Checking sequence triggers...');

      // Get active sequences
      const { data: sequences, error } = await supabase
        .from('followup_sequences')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const sequence of sequences || []) {
        try {
          await this.checkSequenceTrigger(sequence);
        } catch (error) {
          console.error(`Failed to check trigger for sequence ${sequence.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Failed to check sequence triggers:', error);
    }
  }

  private async checkSequenceTrigger(sequence: FollowUpSequence): Promise<void> {
    switch (sequence.trigger_event) {
      case 'contact_created':
        await this.checkNewContactTrigger(sequence);
        break;
      case 'deal_stage_change':
        await this.checkDealStageChangeTrigger(sequence);
        break;
      case 'email_opened':
        await this.checkEmailOpenedTrigger(sequence);
        break;
      case 'email_clicked':
        await this.checkEmailClickedTrigger(sequence);
        break;
      case 'form_submitted':
        await this.checkFormSubmittedTrigger(sequence);
        break;
    }
  }

  private async checkNewContactTrigger(sequence: FollowUpSequence): Promise<void> {
    // Get recently created contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', sequence.user_id)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .is('sequence_enrolled', null);

    if (error) return;

    for (const contact of contacts || []) {
      if (this.evaluateConditions(sequence.trigger_conditions, contact)) {
        await this.enrollContactInSequence(sequence.id, contact.id);
        
        // Mark as enrolled to prevent duplicate enrollment
        await supabase
          .from('contacts')
          .update({ sequence_enrolled: sequence.id })
          .eq('id', contact.id);
      }
    }
  }

  private async checkDealStageChangeTrigger(sequence: FollowUpSequence): Promise<void> {
    // Implementation for deal stage change triggers
    console.log('Checking deal stage change triggers...');
  }

  private async checkEmailOpenedTrigger(sequence: FollowUpSequence): Promise<void> {
    // Implementation for email opened triggers
    console.log('Checking email opened triggers...');
  }

  private async checkEmailClickedTrigger(sequence: FollowUpSequence): Promise<void> {
    // Implementation for email clicked triggers
    console.log('Checking email clicked triggers...');
  }

  private async checkFormSubmittedTrigger(sequence: FollowUpSequence): Promise<void> {
    // Implementation for form submitted triggers
    console.log('Checking form submitted triggers...');
  }

  private evaluateConditions(conditions: Record<string, any>, data: Record<string, any>): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (data[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  // Default Sequences Setup
  async setupDefaultFollowUpSequences(userId: string): Promise<void> {
    try {
      console.log('🔧 Setting up default follow-up sequences...');

      const defaultSequences: Array<Omit<FollowUpSequence, 'id' | 'created_at' | 'updated_at'>> = [
        {
          user_id: userId,
          name: 'New Lead Nurturing',
          description: 'Automated nurturing sequence for new leads',
          trigger_event: 'contact_created',
          trigger_conditions: { status: 'lead' },
          steps: [
            {
              step_number: 1,
              delay_days: 0,
              delay_hours: 1,
              action_type: 'email',
              action_data: {
                subject: 'Welcome! Let\'s get started',
                template: 'welcome_email'
              }
            },
            {
              step_number: 2,
              delay_days: 2,
              delay_hours: 0,
              action_type: 'task',
              action_data: {
                title: 'Follow up with new lead',
                task_type: 'call',
                priority: 'medium',
                due_in_hours: 24
              }
            },
            {
              step_number: 3,
              delay_days: 5,
              delay_hours: 0,
              action_type: 'email',
              action_data: {
                subject: 'How can we help you succeed?',
                template: 'value_proposition_email'
              }
            }
          ],
          is_active: true
        },
        {
          user_id: userId,
          name: 'Demo Follow-up',
          description: 'Follow-up sequence after product demo',
          trigger_event: 'custom',
          trigger_conditions: { demo_completed: true },
          steps: [
            {
              step_number: 1,
              delay_days: 0,
              delay_hours: 2,
              action_type: 'email',
              action_data: {
                subject: 'Thank you for your time today',
                template: 'demo_followup_email'
              }
            },
            {
              step_number: 2,
              delay_days: 1,
              delay_hours: 0,
              action_type: 'task',
              action_data: {
                title: 'Send proposal to demo prospect',
                task_type: 'proposal',
                priority: 'high',
                due_in_hours: 48
              }
            },
            {
              step_number: 3,
              delay_days: 7,
              delay_hours: 0,
              action_type: 'call',
              action_data: {
                title: 'Follow-up call after proposal',
                priority: 'high',
                due_in_hours: 24
              }
            }
          ],
          is_active: true
        }
      ];

      for (const sequence of defaultSequences) {
        await this.createFollowUpSequence(sequence);
      }

      console.log(`✅ Created ${defaultSequences.length} default follow-up sequences`);

    } catch (error) {
      console.error('❌ Failed to setup default follow-up sequences:', error);
      throw error;
    }
  }

  // Cleanup
  async stopSequenceProcessor(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Sequence processor stopped');
    }
  }
}

// Export singleton instance
export const followUpSequenceService = FollowUpSequenceService.getInstance();
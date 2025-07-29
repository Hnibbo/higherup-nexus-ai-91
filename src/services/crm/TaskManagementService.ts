import { supabase } from '@/integrations/supabase/client';
import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  task_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  assigned_to: string;
  contact_id?: string;
  deal_id?: string;
  due_date: Date;
  completed_at?: Date;
  estimated_duration: number; // in minutes
  actual_duration?: number; // in minutes
  tags: string[];
  custom_fields: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TaskTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  task_type: string;
  priority: string;
  estimated_duration: number;
  instructions: string;
  checklist: Array<{
    item: string;
    required: boolean;
  }>;
  tags: string[];
  is_active: boolean;
  created_at: Date;
}

export interface TaskSequence {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_event: 'contact_created' | 'deal_created' | 'status_change' | 'date_based' | 'manual';
  trigger_conditions: Record<string, any>;
  tasks: Array<{
    template_id: string;
    delay_days: number;
    delay_hours: number;
    conditions?: Record<string, any>;
  }>;
  is_active: boolean;
  created_at: Date;
}

export interface TaskMetrics {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  average_completion_time: number;
  tasks_by_type: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  productivity_score: number;
}

export class TaskManagementService {
  private static instance: TaskManagementService;

  private constructor() {}

  public static getInstance(): TaskManagementService {
    if (!TaskManagementService.instance) {
      TaskManagementService.instance = new TaskManagementService();
    }
    return TaskManagementService.instance;
  }

  // Task Management
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      console.log(`📋 Creating task: ${task.title}`);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: task.user_id,
          title: task.title,
          description: task.description,
          task_type: task.task_type,
          priority: task.priority,
          status: task.status,
          assigned_to: task.assigned_to,
          contact_id: task.contact_id,
          deal_id: task.deal_id,
          due_date: task.due_date.toISOString(),
          estimated_duration: task.estimated_duration,
          tags: task.tags,
          custom_fields: task.custom_fields,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create activity record
      if (task.contact_id) {
        await supabase
          .from('contact_interactions')
          .insert({
            user_id: task.user_id,
            contact_id: task.contact_id,
            interaction_type: 'task_created',
            description: `Task created: ${task.title}`,
            created_at: new Date().toISOString()
          });
      }

      console.log(`✅ Task created: ${task.title}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create task:', error);
      throw error;
    }
  }

  async getTasks(userId: string, filters?: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    contact_id?: string;
    deal_id?: string;
    due_date_from?: Date;
    due_date_to?: Date;
  }): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId);

      if (filters) {
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.priority) query = query.eq('priority', filters.priority);
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
        if (filters.contact_id) query = query.eq('contact_id', filters.contact_id);
        if (filters.deal_id) query = query.eq('deal_id', filters.deal_id);
        if (filters.due_date_from) query = query.gte('due_date', filters.due_date_from.toISOString());
        if (filters.due_date_to) query = query.lte('due_date', filters.due_date_to.toISOString());
      }

      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get tasks:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Task updated: ${taskId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update task:', error);
      throw error;
    }
  }

  async completeTask(taskId: string, actualDuration?: number, notes?: string): Promise<Task> {
    try {
      console.log(`✅ Completing task: ${taskId}`);

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_duration: actualDuration,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Create completion activity
      if (data.contact_id) {
        await supabase
          .from('contact_interactions')
          .insert({
            user_id: data.user_id,
            contact_id: data.contact_id,
            interaction_type: 'task_completed',
            description: `Task completed: ${data.title}${notes ? ` - ${notes}` : ''}`,
            created_at: new Date().toISOString()
          });
      }

      console.log(`✅ Task completed: ${data.title}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to complete task:', error);
      throw error;
    }
  }

  // Task Templates
  async createTaskTemplate(template: Omit<TaskTemplate, 'id' | 'created_at'>): Promise<TaskTemplate> {
    try {
      console.log(`📝 Creating task template: ${template.name}`);

      const { data, error } = await supabase
        .from('task_templates')
        .insert({
          user_id: template.user_id,
          name: template.name,
          description: template.description,
          task_type: template.task_type,
          priority: template.priority,
          estimated_duration: template.estimated_duration,
          instructions: template.instructions,
          checklist: template.checklist,
          tags: template.tags,
          is_active: template.is_active,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Task template created: ${template.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create task template:', error);
      throw error;
    }
  }

  async getTaskTemplates(userId: string): Promise<TaskTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get task templates:', error);
      throw error;
    }
  }

  async createTaskFromTemplate(templateId: string, overrides: {
    assigned_to: string;
    contact_id?: string;
    deal_id?: string;
    due_date: Date;
    custom_fields?: Record<string, any>;
  }): Promise<Task> {
    try {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('task_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      // Create task from template
      const task = await this.createTask({
        user_id: template.user_id,
        title: template.name,
        description: template.description,
        task_type: template.task_type,
        priority: template.priority,
        status: 'pending',
        assigned_to: overrides.assigned_to,
        contact_id: overrides.contact_id,
        deal_id: overrides.deal_id,
        due_date: overrides.due_date,
        estimated_duration: template.estimated_duration,
        tags: template.tags,
        custom_fields: {
          template_id: templateId,
          instructions: template.instructions,
          checklist: template.checklist,
          ...overrides.custom_fields
        }
      });

      console.log(`✅ Task created from template: ${template.name}`);
      return task;

    } catch (error) {
      console.error('❌ Failed to create task from template:', error);
      throw error;
    }
  }

  // Task Sequences
  async createTaskSequence(sequence: Omit<TaskSequence, 'id' | 'created_at'>): Promise<TaskSequence> {
    try {
      console.log(`🔄 Creating task sequence: ${sequence.name}`);

      const { data, error } = await supabase
        .from('task_sequences')
        .insert({
          user_id: sequence.user_id,
          name: sequence.name,
          description: sequence.description,
          trigger_event: sequence.trigger_event,
          trigger_conditions: sequence.trigger_conditions,
          tasks: sequence.tasks,
          is_active: sequence.is_active,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Task sequence created: ${sequence.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create task sequence:', error);
      throw error;
    }
  }

  async triggerTaskSequence(sequenceId: string, context: {
    contact_id?: string;
    deal_id?: string;
    assigned_to: string;
    [key: string]: any;
  }): Promise<Task[]> {
    try {
      console.log(`🚀 Triggering task sequence: ${sequenceId}`);

      // Get sequence
      const { data: sequence, error: sequenceError } = await supabase
        .from('task_sequences')
        .select('*')
        .eq('id', sequenceId)
        .single();

      if (sequenceError) throw sequenceError;

      const createdTasks: Task[] = [];

      // Create tasks from sequence
      for (const sequenceTask of sequence.tasks) {
        try {
          // Calculate due date
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + sequenceTask.delay_days);
          dueDate.setHours(dueDate.getHours() + sequenceTask.delay_hours);

          // Check conditions if any
          if (sequenceTask.conditions && !this.evaluateConditions(sequenceTask.conditions, context)) {
            continue;
          }

          // Create task from template
          const task = await this.createTaskFromTemplate(sequenceTask.template_id, {
            assigned_to: context.assigned_to,
            contact_id: context.contact_id,
            deal_id: context.deal_id,
            due_date: dueDate,
            custom_fields: {
              sequence_id: sequenceId,
              sequence_step: createdTasks.length + 1
            }
          });

          createdTasks.push(task);

        } catch (error) {
          console.error(`Failed to create task from template ${sequenceTask.template_id}:`, error);
        }
      }

      console.log(`✅ Task sequence triggered: ${createdTasks.length} tasks created`);
      return createdTasks;

    } catch (error) {
      console.error('❌ Failed to trigger task sequence:', error);
      throw error;
    }
  }

  private evaluateConditions(conditions: Record<string, any>, context: Record<string, any>): boolean {
    // Simple condition evaluation - would be more sophisticated in reality
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (context[key] !== expectedValue) {
        return false;
      }
    }
    return true;
  }

  // Task Automation
  async processAutomatedTasks(): Promise<void> {
    try {
      console.log('🤖 Processing automated tasks...');

      // Get active task sequences
      const { data: sequences, error } = await supabase
        .from('task_sequences')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Check for trigger events
      for (const sequence of sequences || []) {
        try {
          await this.checkSequenceTriggers(sequence);
        } catch (error) {
          console.error(`Failed to check triggers for sequence ${sequence.id}:`, error);
        }
      }

      // Update overdue tasks
      await this.updateOverdueTasks();

      console.log('✅ Automated task processing completed');

    } catch (error) {
      console.error('❌ Failed to process automated tasks:', error);
    }
  }

  private async checkSequenceTriggers(sequence: TaskSequence): Promise<void> {
    // Check for events that should trigger this sequence
    switch (sequence.trigger_event) {
      case 'contact_created':
        await this.checkNewContacts(sequence);
        break;
      case 'deal_created':
        await this.checkNewDeals(sequence);
        break;
      case 'status_change':
        await this.checkStatusChanges(sequence);
        break;
      case 'date_based':
        await this.checkDateBasedTriggers(sequence);
        break;
    }
  }

  private async checkNewContacts(sequence: TaskSequence): Promise<void> {
    // Get recently created contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', sequence.user_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .is('sequence_triggered', null);

    if (error) return;

    for (const contact of contacts || []) {
      // Check if conditions match
      if (this.evaluateConditions(sequence.trigger_conditions, contact)) {
        await this.triggerTaskSequence(sequence.id, {
          contact_id: contact.id,
          assigned_to: contact.assigned_to || sequence.user_id
        });

        // Mark as triggered
        await supabase
          .from('contacts')
          .update({ sequence_triggered: sequence.id })
          .eq('id', contact.id);
      }
    }
  }

  private async checkNewDeals(sequence: TaskSequence): Promise<void> {
    // Similar implementation for deals
    console.log('Checking new deals for sequence triggers...');
  }

  private async checkStatusChanges(sequence: TaskSequence): Promise<void> {
    // Check for status changes that should trigger sequences
    console.log('Checking status changes for sequence triggers...');
  }

  private async checkDateBasedTriggers(sequence: TaskSequence): Promise<void> {
    // Check for date-based triggers
    console.log('Checking date-based triggers...');
  }

  private async updateOverdueTasks(): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'overdue' })
        .lt('due_date', new Date().toISOString())
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update overdue tasks:', error);
    }
  }

  // Task Metrics and Analytics
  async getTaskMetrics(userId: string, timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<TaskMetrics> {
    try {
      const timeframeDays = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

      // Get tasks in timeframe
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const overdueTasks = tasks?.filter(t => t.status === 'overdue').length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate average completion time
      const completedTasksWithDuration = tasks?.filter(t => 
        t.status === 'completed' && t.created_at && t.completed_at
      ) || [];
      
      const averageCompletionTime = completedTasksWithDuration.length > 0
        ? completedTasksWithDuration.reduce((sum, task) => {
            const duration = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
            return sum + duration;
          }, 0) / completedTasksWithDuration.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Tasks by type
      const tasksByType: Record<string, number> = {};
      tasks?.forEach(task => {
        tasksByType[task.task_type] = (tasksByType[task.task_type] || 0) + 1;
      });

      // Tasks by priority
      const tasksByPriority: Record<string, number> = {};
      tasks?.forEach(task => {
        tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
      });

      // Calculate productivity score
      const productivityScore = Math.round(
        (completionRate * 0.4) + 
        (Math.max(0, 100 - (overdueTasks / totalTasks * 100)) * 0.3) +
        (Math.min(averageCompletionTime <= 24 ? 100 : 100 - (averageCompletionTime - 24) * 2, 100) * 0.3)
      );

      return {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        completion_rate: Math.round(completionRate * 100) / 100,
        average_completion_time: Math.round(averageCompletionTime * 100) / 100,
        tasks_by_type: tasksByType,
        tasks_by_priority: tasksByPriority,
        productivity_score: productivityScore
      };

    } catch (error) {
      console.error('❌ Failed to get task metrics:', error);
      throw error;
    }
  }

  // Bulk Operations
  async bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Promise<void> {
    try {
      console.log(`📦 Bulk updating ${taskIds.length} tasks...`);

      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', taskIds);

      if (error) throw error;

      console.log(`✅ Bulk update completed for ${taskIds.length} tasks`);

    } catch (error) {
      console.error('❌ Failed to bulk update tasks:', error);
      throw error;
    }
  }

  async bulkCreateTasks(tasks: Array<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task[]> {
    try {
      console.log(`📦 Bulk creating ${tasks.length} tasks...`);

      const tasksToInsert = tasks.map(task => ({
        user_id: task.user_id,
        title: task.title,
        description: task.description,
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        assigned_to: task.assigned_to,
        contact_id: task.contact_id,
        deal_id: task.deal_id,
        due_date: task.due_date.toISOString(),
        estimated_duration: task.estimated_duration,
        tags: task.tags,
        custom_fields: task.custom_fields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToInsert)
        .select();

      if (error) throw error;

      console.log(`✅ Bulk creation completed for ${tasks.length} tasks`);
      return data || [];

    } catch (error) {
      console.error('❌ Failed to bulk create tasks:', error);
      throw error;
    }
  }

  // Default Templates Setup
  async setupDefaultTaskTemplates(userId: string): Promise<void> {
    try {
      console.log('🔧 Setting up default task templates...');

      const defaultTemplates: Array<Omit<TaskTemplate, 'id' | 'created_at'>> = [
        {
          user_id: userId,
          name: 'Welcome Call',
          description: 'Initial welcome call for new contacts',
          task_type: 'call',
          priority: 'high',
          estimated_duration: 30,
          instructions: 'Introduce yourself and the company, understand their needs, and schedule next steps.',
          checklist: [
            { item: 'Introduce yourself and company', required: true },
            { item: 'Ask about their current challenges', required: true },
            { item: 'Explain how we can help', required: true },
            { item: 'Schedule follow-up meeting', required: true }
          ],
          tags: ['onboarding', 'sales'],
          is_active: true
        },
        {
          user_id: userId,
          name: 'Follow-up Email',
          description: 'Standard follow-up email after initial contact',
          task_type: 'email',
          priority: 'medium',
          estimated_duration: 15,
          instructions: 'Send personalized follow-up email with relevant resources.',
          checklist: [
            { item: 'Personalize email content', required: true },
            { item: 'Include relevant resources', required: false },
            { item: 'Add clear call-to-action', required: true }
          ],
          tags: ['follow-up', 'nurturing'],
          is_active: true
        },
        {
          user_id: userId,
          name: 'Demo Preparation',
          description: 'Prepare for product demonstration',
          task_type: 'demo',
          priority: 'high',
          estimated_duration: 45,
          instructions: 'Research prospect, customize demo, and prepare materials.',
          checklist: [
            { item: 'Research prospect company and needs', required: true },
            { item: 'Customize demo scenarios', required: true },
            { item: 'Prepare demo environment', required: true },
            { item: 'Send calendar invite with agenda', required: true }
          ],
          tags: ['demo', 'sales'],
          is_active: true
        },
        {
          user_id: userId,
          name: 'Proposal Creation',
          description: 'Create and send proposal',
          task_type: 'proposal',
          priority: 'high',
          estimated_duration: 120,
          instructions: 'Create customized proposal based on discovery call notes.',
          checklist: [
            { item: 'Review discovery call notes', required: true },
            { item: 'Customize proposal template', required: true },
            { item: 'Include pricing and terms', required: true },
            { item: 'Get internal approval if needed', required: false },
            { item: 'Send proposal to prospect', required: true }
          ],
          tags: ['proposal', 'sales'],
          is_active: true
        }
      ];

      for (const template of defaultTemplates) {
        await this.createTaskTemplate(template);
      }

      console.log(`✅ Created ${defaultTemplates.length} default task templates`);

    } catch (error) {
      console.error('❌ Failed to setup default task templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const taskManagementService = TaskManagementService.getInstance();
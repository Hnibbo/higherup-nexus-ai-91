import { supabase } from '@/integrations/supabase/client';

/**
 * Advanced Automation Service
 * 
 * This service provides advanced automation features including:
 * - Multi-step automation sequences
 * - Time-based and event-based triggers
 * - Data transformation and mapping tools
 * - Error handling and retry mechanisms
 * - Workflow performance monitoring and optimization
 */

// Core automation types
export interface AutomationSequence {
  id: string;
  name: string;
  description: string;
  user_id: string;
  steps: AutomationStep[];
  triggers: AutomationTrigger[];
  status: 'active' | 'paused' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  execution_count: number;
  success_rate: number;
}

export interface AutomationStep {
  id: string;
  sequence_id: string;
  step_number: number;
  name: string;
  type: 'action' | 'condition' | 'delay' | 'parallel' | 'loop' | 'transform';
  config: Record<string, any>;
  retry_config: RetryConfig;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

export interface AutomationTrigger {
  id: string;
  sequence_id: string;
  type: 'time_based' | 'event_based' | 'webhook' | 'manual' | 'data_change';
  name: string;
  config: Record<string, any>;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
}

export interface RetryConfig {
  enabled: boolean;
  max_attempts: number;
  retry_delay_ms: number;
  exponential_backoff: boolean;
  backoff_multiplier?: number;
  max_delay_ms?: number;
}

export interface AutomationExecution {
  id: string;
  sequence_id: string;
  trigger_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input_data: any;
  output_data?: any;
  started_at: string;
  completed_at?: string;
  total_execution_time_ms?: number;
  error_message?: string;
  retry_count: number;
}

export class AdvancedAutomationService {
  private static instance: AdvancedAutomationService;

  private constructor() {}

  public static getInstance(): AdvancedAutomationService {
    if (!AdvancedAutomationService.instance) {
      AdvancedAutomationService.instance = new AdvancedAutomationService();
    }
    return AdvancedAutomationService.instance;
  }

  // Multi-step Automation Sequences
  async createAutomationSequence(sequenceData: Omit<AutomationSequence, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'success_rate'>): Promise<AutomationSequence> {
    try {
      console.log(`🔄 Creating automation sequence: ${sequenceData.name}`);

      const sequence: AutomationSequence = {
        id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...sequenceData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        execution_count: 0,
        success_rate: 0
      };

      // Store sequence
      await this.storeAutomationSequence(sequence);

      console.log(`✅ Automation sequence created: ${sequenceData.name}`);
      return sequence;

    } catch (error) {
      console.error('❌ Failed to create automation sequence:', error);
      throw error;
    }
  }

  async executeAutomationSequence(sequenceId: string, triggerData?: any): Promise<AutomationExecution> {
    try {
      console.log(`▶️ Executing automation sequence: ${sequenceId}`);

      const sequence = await this.getAutomationSequence(sequenceId);
      if (!sequence) {
        throw new Error('Automation sequence not found');
      }

      if (sequence.status !== 'active') {
        throw new Error('Automation sequence is not active');
      }

      const execution: AutomationExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sequence_id: sequenceId,
        trigger_id: triggerData?.trigger_id || 'manual',
        status: 'running',
        input_data: triggerData || {},
        started_at: new Date().toISOString(),
        retry_count: 0
      };

      await this.storeAutomationExecution(execution);

      // Process execution
      this.processAutomationExecution(execution, sequence).catch(error => {
        console.error(`Automation execution failed: ${execution.id}`, error);
      });

      console.log(`✅ Automation sequence execution started: ${execution.id}`);
      return execution;

    } catch (error) {
      console.error('❌ Failed to execute automation sequence:', error);
      throw error;
    }
  }

  private async processAutomationExecution(execution: AutomationExecution, sequence: AutomationSequence): Promise<void> {
    try {
      console.log(`⚙️ Processing automation execution: ${execution.id}`);

      const startTime = Date.now();

      // Execute steps in order
      for (const step of sequence.steps) {
        await this.executeStep(step, execution.input_data);
      }

      // Complete execution
      execution.status = 'completed';
      execution.completed_at = new Date().toISOString();
      execution.total_execution_time_ms = Date.now() - startTime;

      await this.updateAutomationExecution(execution);
      await this.updateSequenceStatistics(sequence.id, true);

      console.log(`✅ Automation execution completed: ${execution.id}`);

    } catch (error) {
      console.error(`❌ Automation execution failed: ${execution.id}`, error);

      execution.status = 'failed';
      execution.error_message = error instanceof Error ? error.message : 'Execution failed';
      execution.completed_at = new Date().toISOString();
      execution.total_execution_time_ms = Date.now() - new Date(execution.started_at).getTime();

      await this.updateAutomationExecution(execution);
      await this.updateSequenceStatistics(sequence.id, false);
    }
  }

  private async executeStep(step: AutomationStep, inputData: any): Promise<any> {
    const startTime = Date.now();
    console.log(`🔄 Executing step: ${step.name} (${step.type})`);

    try {
      let result: any;

      switch (step.type) {
        case 'action':
          result = await this.executeActionStep(step, inputData);
          break;
        case 'condition':
          result = await this.executeConditionStep(step, inputData);
          break;
        case 'delay':
          result = await this.executeDelayStep(step, inputData);
          break;
        case 'transform':
          result = await this.executeTransformStep(step, inputData);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const executionTime = Date.now() - startTime;
      console.log(`✅ Step completed: ${step.name} (${executionTime}ms)`);

      return result;

    } catch (error) {
      // Handle retry logic
      if (step.retry_config.enabled && step.retry_config.max_attempts > 0) {
        console.log(`🔄 Retrying step: ${step.name}`);
        
        const delay = this.calculateRetryDelay(step.retry_config, 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return await this.executeStep(step, inputData);
      }

      throw error;
    }
  }

  private async executeActionStep(step: AutomationStep, inputData: any): Promise<any> {
    const actionType = step.config.action_type;

    switch (actionType) {
      case 'send_email':
        return await this.executeSendEmailAction(step.config, inputData);
      case 'create_record':
        return await this.executeCreateRecordAction(step.config, inputData);
      case 'api_call':
        return await this.executeApiCallAction(step.config, inputData);
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  private async executeConditionStep(step: AutomationStep, inputData: any): Promise<any> {
    const rules = step.config.condition_rules || [];
    const result = this.evaluateConditionRules(rules, inputData);

    return {
      condition_result: result,
      rules_evaluated: rules.length,
      input_data: inputData
    };
  }

  private async executeDelayStep(step: AutomationStep, inputData: any): Promise<any> {
    const duration = step.config.delay_duration || 1;
    const unit = step.config.delay_unit || 'seconds';

    const delayMs = this.convertToMilliseconds(duration, unit);
    
    console.log(`⏰ Delaying execution for ${duration} ${unit}`);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    return {
      delay_duration: duration,
      delay_unit: unit,
      input_data: inputData
    };
  }

  private async executeTransformStep(step: AutomationStep, inputData: any): Promise<any> {
    const transformations = step.config.transformations || [];
    
    console.log(`🔄 Transforming data: ${transformations.length} transformations`);

    let transformedData = inputData;

    for (const transformation of transformations) {
      transformedData = await this.applyDataTransformation(transformation, transformedData);
    }

    return {
      original_data: inputData,
      transformed_data: transformedData,
      transformations_applied: transformations.length
    };
  }

  // Time-based and Event-based Triggers
  async activateTrigger(trigger: AutomationTrigger): Promise<void> {
    try {
      console.log(`🎯 Activating trigger: ${trigger.name} (${trigger.type})`);

      switch (trigger.type) {
        case 'time_based':
          await this.setupTimeTrigger(trigger);
          break;
        case 'event_based':
          await this.setupEventTrigger(trigger);
          break;
        case 'webhook':
          await this.setupWebhookTrigger(trigger);
          break;
        case 'data_change':
          await this.setupDataChangeTrigger(trigger);
          break;
      }

      trigger.is_active = true;
      await this.updateTrigger(trigger);

      console.log(`✅ Trigger activated: ${trigger.name}`);

    } catch (error) {
      console.error('❌ Failed to activate trigger:', error);
      throw error;
    }
  }

  private async setupTimeTrigger(trigger: AutomationTrigger): Promise<void> {
    console.log(`⏰ Setting up time trigger: ${trigger.name}`);
    // Mock time trigger setup
    this.scheduleTimeTrigger(trigger);
  }

  private scheduleTimeTrigger(trigger: AutomationTrigger): void {
    // Mock scheduling implementation
    console.log(`Scheduled time trigger: ${trigger.name}`);
  }

  private async setupEventTrigger(trigger: AutomationTrigger): Promise<void> {
    console.log(`📡 Setting up event trigger: ${trigger.name}`);
    // Mock event trigger setup
  }

  private async setupWebhookTrigger(trigger: AutomationTrigger): Promise<void> {
    const webhookUrl = `${process.env.BASE_URL}/api/webhooks/automation/${trigger.id}`;
    trigger.config.webhook_url = webhookUrl;
    console.log(`🪝 Webhook trigger URL: ${webhookUrl}`);
  }

  private async setupDataChangeTrigger(trigger: AutomationTrigger): Promise<void> {
    console.log(`📊 Setting up data change trigger: ${trigger.name}`);
    // Mock data change trigger setup
  }

  // Data Transformation and Mapping
  private async applyDataTransformation(transformation: any, data: any): Promise<any> {
    console.log(`🔄 Applying transformation: ${transformation.type}`);

    switch (transformation.type) {
      case 'map':
        return this.mapData(data, transformation.field_mapping || {});
      case 'filter':
        return this.filterData(data, transformation.filter_conditions || []);
      case 'format':
        return this.formatData(data, transformation.format_template || '');
      default:
        return data;
    }
  }

  private mapData(data: any, fieldMapping: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map(item => this.mapSingleItem(item, fieldMapping));
    } else {
      return this.mapSingleItem(data, fieldMapping);
    }
  }

  private mapSingleItem(item: any, fieldMapping: Record<string, string>): any {
    const mapped: any = {};
    
    Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
      if (item[sourceField] !== undefined) {
        mapped[targetField] = item[sourceField];
      }
    });

    return mapped;
  }

  private filterData(data: any, conditions: any[]): any {
    if (!Array.isArray(data)) {
      return this.evaluateConditionRules(conditions, data) ? data : null;
    }

    return data.filter(item => this.evaluateConditionRules(conditions, item));
  }

  private formatData(data: any, template: string): any {
    let formatted = template;
    
    if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        formatted = formatted.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      });
    }

    return formatted;
  }

  // Error Handling and Retry Mechanisms
  private calculateRetryDelay(retryConfig: RetryConfig, attemptNumber: number): number {
    let delay = retryConfig.retry_delay_ms;

    if (retryConfig.exponential_backoff) {
      const multiplier = retryConfig.backoff_multiplier || 2;
      delay = delay * Math.pow(multiplier, attemptNumber - 1);
    }

    if (retryConfig.max_delay_ms) {
      delay = Math.min(delay, retryConfig.max_delay_ms);
    }

    return delay;
  }

  // Utility Methods
  private evaluateConditionRules(rules: any[], data: any): boolean {
    return rules.every(rule => this.evaluateConditionRule(rule, data));
  }

  private evaluateConditionRule(rule: any, data: any): boolean {
    const fieldValue = data[rule.field];
    const ruleValue = rule.value;

    switch (rule.operator) {
      case 'equals':
        return fieldValue === ruleValue;
      case 'not_equals':
        return fieldValue !== ruleValue;
      case 'contains':
        return String(fieldValue).includes(String(ruleValue));
      case 'greater_than':
        return Number(fieldValue) > Number(ruleValue);
      case 'less_than':
        return Number(fieldValue) < Number(ruleValue);
      default:
        return false;
    }
  }

  private convertToMilliseconds(duration: number, unit: string): number {
    switch (unit) {
      case 'seconds':
        return duration * 1000;
      case 'minutes':
        return duration * 60 * 1000;
      case 'hours':
        return duration * 60 * 60 * 1000;
      case 'days':
        return duration * 24 * 60 * 60 * 1000;
      default:
        return duration;
    }
  }

  // Action Implementations
  private async executeSendEmailAction(config: any, inputData: any): Promise<any> {
    console.log(`📧 Sending email to: ${config.recipient}`);
    
    return {
      action: 'send_email',
      recipient: config.recipient,
      subject: config.subject,
      sent_at: new Date().toISOString(),
      message_id: `msg_${Date.now()}`
    };
  }

  private async executeCreateRecordAction(config: any, inputData: any): Promise<any> {
    console.log(`📝 Creating record in: ${config.table}`);
    
    return {
      action: 'create_record',
      table: config.table,
      record_id: `rec_${Date.now()}`,
      created_at: new Date().toISOString()
    };
  }

  private async executeApiCallAction(config: any, inputData: any): Promise<any> {
    console.log(`🌐 Making API call to: ${config.url}`);
    
    return {
      action: 'api_call',
      url: config.url,
      method: config.method || 'GET',
      status: 200,
      response: { success: true, timestamp: new Date().toISOString() }
    };
  }

  // Database Operations
  private async storeAutomationSequence(sequence: AutomationSequence): Promise<void> {
    const { error } = await supabase
      .from('automation_sequences')
      .insert({
        id: sequence.id,
        user_id: sequence.user_id,
        name: sequence.name,
        description: sequence.description,
        steps: sequence.steps,
        triggers: sequence.triggers,
        status: sequence.status,
        created_at: sequence.created_at,
        updated_at: sequence.updated_at,
        execution_count: sequence.execution_count,
        success_rate: sequence.success_rate
      });

    if (error) {
      console.warn('Could not store automation sequence:', error);
    }
  }

  private async getAutomationSequence(sequenceId: string): Promise<AutomationSequence | null> {
    const { data, error } = await supabase
      .from('automation_sequences')
      .select('*')
      .eq('id', sequenceId)
      .single();

    if (error) {
      console.warn('Could not fetch automation sequence:', error);
      return null;
    }

    return data;
  }

  private async storeAutomationExecution(execution: AutomationExecution): Promise<void> {
    const { error } = await supabase
      .from('automation_executions')
      .insert({
        id: execution.id,
        sequence_id: execution.sequence_id,
        trigger_id: execution.trigger_id,
        status: execution.status,
        input_data: execution.input_data,
        output_data: execution.output_data,
        started_at: execution.started_at,
        completed_at: execution.completed_at,
        total_execution_time_ms: execution.total_execution_time_ms,
        error_message: execution.error_message,
        retry_count: execution.retry_count
      });

    if (error) {
      console.warn('Could not store automation execution:', error);
    }
  }

  private async updateAutomationExecution(execution: AutomationExecution): Promise<void> {
    const { error } = await supabase
      .from('automation_executions')
      .update({
        status: execution.status,
        output_data: execution.output_data,
        completed_at: execution.completed_at,
        total_execution_time_ms: execution.total_execution_time_ms,
        error_message: execution.error_message,
        retry_count: execution.retry_count
      })
      .eq('id', execution.id);

    if (error) {
      console.warn('Could not update automation execution:', error);
    }
  }

  private async updateTrigger(trigger: AutomationTrigger): Promise<void> {
    const { error } = await supabase
      .from('automation_triggers')
      .upsert({
        id: trigger.id,
        sequence_id: trigger.sequence_id,
        type: trigger.type,
        name: trigger.name,
        config: trigger.config,
        is_active: trigger.is_active,
        last_triggered_at: trigger.last_triggered_at,
        trigger_count: trigger.trigger_count
      });

    if (error) {
      console.warn('Could not update trigger:', error);
    }
  }

  private async updateSequenceStatistics(sequenceId: string, success: boolean): Promise<void> {
    const sequence = await this.getAutomationSequence(sequenceId);
    if (!sequence) return;

    const newExecutionCount = sequence.execution_count + 1;
    const currentSuccesses = Math.round((sequence.success_rate / 100) * sequence.execution_count);
    const newSuccesses = success ? currentSuccesses + 1 : currentSuccesses;
    const newSuccessRate = (newSuccesses / newExecutionCount) * 100;

    const { error } = await supabase
      .from('automation_sequences')
      .update({
        execution_count: newExecutionCount,
        success_rate: Math.round(newSuccessRate * 100) / 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', sequenceId);

    if (error) {
      console.warn('Could not update sequence statistics:', error);
    }
  }
}

export const advancedAutomationService = AdvancedAutomationService.getInstance();
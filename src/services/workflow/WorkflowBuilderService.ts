import { supabase } from '@/integrations/supabase/client';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'branch' | 'merge';
  name: string;
  description: string;
  position: { x: number; y: number };
  config: Record<string, any>;
  connections: {
    inputs: string[];
    outputs: string[];
  };
  status: 'active' | 'inactive' | 'error';
}

export interface WorkflowTrigger extends WorkflowNode {
  type: 'trigger';
  trigger_type: 'manual' | 'schedule' | 'webhook' | 'event' | 'form_submit' | 'email_open' | 'email_click';
  trigger_config: {
    event_type?: string;
    schedule?: {
      frequency: 'once' | 'daily' | 'weekly' | 'monthly';
      time?: string;
      days?: number[];
      date?: string;
    };
    webhook_url?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
}

export interface WorkflowCondition extends WorkflowNode {
  type: 'condition';
  condition_type: 'if_then' | 'switch' | 'filter' | 'wait_until';
  logic: 'and' | 'or';
  rules: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: any;
    data_type: 'string' | 'number' | 'boolean' | 'date';
  }>;
  branches: {
    true_path: string[];
    false_path: string[];
  };
}

export interface WorkflowAction extends WorkflowNode {
  type: 'action';
  action_type: 'send_email' | 'create_contact' | 'update_contact' | 'add_tag' | 'remove_tag' | 'create_task' | 'send_webhook' | 'api_call' | 'custom';
  action_config: {
    template_id?: string;
    recipient?: string;
    subject?: string;
    content?: string;
    fields?: Record<string, any>;
    tags?: string[];
    webhook_url?: string;
    api_endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
  };
  retry_config: {
    max_retries: number;
    retry_delay: number;
    exponential_backoff: boolean;
  };
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: 'marketing' | 'sales' | 'customer_service' | 'operations' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  connections: Array<{
    from_node: string;
    to_node: string;
    condition?: string;
  }>;
  variables: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    default_value?: any;
    description?: string;
  }>;
  settings: {
    max_executions_per_day?: number;
    execution_timeout?: number;
    error_handling: 'stop' | 'continue' | 'retry';
    logging_level: 'none' | 'basic' | 'detailed';
  };
  created_at: Date;
  updated_at: Date;
  last_executed_at?: Date;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_data: any;
  current_node?: string;
  execution_path: Array<{
    node_id: string;
    started_at: Date;
    completed_at?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    output?: any;
    error?: string;
  }>;
  variables: Record<string, any>;
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview_image?: string;
  workflow_data: Omit<Workflow, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  usage_count: number;
  rating: number;
  is_premium: boolean;
}

export class WorkflowBuilderService {
  private static instance: WorkflowBuilderService;

  private constructor() {}

  public static getInstance(): WorkflowBuilderService {
    if (!WorkflowBuilderService.instance) {
      WorkflowBuilderService.instance = new WorkflowBuilderService();
    }
    return WorkflowBuilderService.instance;
  }

  // Workflow Management
  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    try {
      console.log(`⚙️ Creating workflow: ${workflowData.name}`);

      const workflow: Workflow = {
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...workflowData,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Validate workflow structure
      this.validateWorkflow(workflow);

      // Store workflow
      await this.storeWorkflow(workflow);

      console.log(`✅ Workflow created: ${workflowData.name}`);
      return workflow;

    } catch (error) {
      console.error('❌ Failed to create workflow:', error);
      throw error;
    }
  }  private v
alidateWorkflow(workflow: Workflow): void {
    // Check for at least one trigger
    const triggers = workflow.nodes.filter(node => node.type === 'trigger');
    if (triggers.length === 0) {
      throw new Error('Workflow must have at least one trigger');
    }

    // Check for orphaned nodes
    const connectedNodes = new Set<string>();
    workflow.connections.forEach(conn => {
      connectedNodes.add(conn.from_node);
      connectedNodes.add(conn.to_node);
    });

    const orphanedNodes = workflow.nodes.filter(node => 
      node.type !== 'trigger' && !connectedNodes.has(node.id)
    );

    if (orphanedNodes.length > 0) {
      throw new Error(`Orphaned nodes found: ${orphanedNodes.map(n => n.name).join(', ')}`);
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(workflow)) {
      throw new Error('Workflow contains circular dependencies');
    }
  }

  private hasCircularDependency(workflow: Workflow): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingConnections = workflow.connections.filter(conn => conn.from_node === nodeId);
      for (const conn of outgoingConnections) {
        if (hasCycle(conn.to_node)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of workflow.nodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) {
        return true;
      }
    }

    return false;
  }

  async getWorkflows(userId: string, category?: string): Promise<Workflow[]> {
    try {
      let query = supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(workflow => ({
        ...workflow,
        created_at: new Date(workflow.created_at),
        updated_at: new Date(workflow.updated_at),
        last_executed_at: workflow.last_executed_at ? new Date(workflow.last_executed_at) : undefined
      }));

    } catch (error) {
      console.error('❌ Failed to get workflows:', error);
      throw error;
    }
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    try {
      console.log(`📝 Updating workflow: ${workflowId}`);

      const updatedWorkflow = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('workflows')
        .update(updatedWorkflow)
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Workflow updated: ${workflowId}`);
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        last_executed_at: data.last_executed_at ? new Date(data.last_executed_at) : undefined
      };

    } catch (error) {
      console.error('❌ Failed to update workflow:', error);
      throw error;
    }
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting workflow: ${workflowId}`);

      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      console.log(`✅ Workflow deleted: ${workflowId}`);

    } catch (error) {
      console.error('❌ Failed to delete workflow:', error);
      throw error;
    }
  }

  async duplicateWorkflow(workflowId: string, newName?: string): Promise<Workflow> {
    try {
      console.log(`📋 Duplicating workflow: ${workflowId}`);

      // Get original workflow
      const { data: original, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Create duplicate
      const duplicate = await this.createWorkflow({
        user_id: original.user_id,
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        status: 'draft',
        nodes: original.nodes,
        connections: original.connections,
        variables: original.variables,
        settings: original.settings
      });

      console.log(`✅ Workflow duplicated: ${workflowId} -> ${duplicate.id}`);
      return duplicate;

    } catch (error) {
      console.error('❌ Failed to duplicate workflow:', error);
      throw error;
    }
  }

  private async storeWorkflow(workflow: Workflow): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .insert({
          user_id: workflow.user_id,
          name: workflow.name,
          description: workflow.description,
          category: workflow.category,
          status: workflow.status,
          nodes: workflow.nodes,
          connections: workflow.connections,
          variables: workflow.variables,
          settings: workflow.settings,
          created_at: workflow.created_at.toISOString(),
          updated_at: workflow.updated_at.toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store workflow:', error);
    }
  }

  // Node Management
  async addNode(workflowId: string, node: Omit<WorkflowNode, 'id'>): Promise<WorkflowNode> {
    try {
      console.log(`➕ Adding node to workflow: ${workflowId}`);

      const newNode: WorkflowNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...node
      };

      // Get current workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Add node to workflow
      const updatedNodes = [...workflow.nodes, newNode];

      await supabase
        .from('workflows')
        .update({
          nodes: updatedNodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      console.log(`✅ Node added to workflow: ${workflowId}`);
      return newNode;

    } catch (error) {
      console.error('❌ Failed to add node:', error);
      throw error;
    }
  }

  async updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): Promise<void> {
    try {
      console.log(`📝 Updating node: ${nodeId} in workflow: ${workflowId}`);

      // Get current workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Update node
      const updatedNodes = workflow.nodes.map((node: WorkflowNode) =>
        node.id === nodeId ? { ...node, ...updates } : node
      );

      await supabase
        .from('workflows')
        .update({
          nodes: updatedNodes,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      console.log(`✅ Node updated: ${nodeId}`);

    } catch (error) {
      console.error('❌ Failed to update node:', error);
      throw error;
    }
  }

  async removeNode(workflowId: string, nodeId: string): Promise<void> {
    try {
      console.log(`🗑️ Removing node: ${nodeId} from workflow: ${workflowId}`);

      // Get current workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Remove node and its connections
      const updatedNodes = workflow.nodes.filter((node: WorkflowNode) => node.id !== nodeId);
      const updatedConnections = workflow.connections.filter((conn: any) => 
        conn.from_node !== nodeId && conn.to_node !== nodeId
      );

      await supabase
        .from('workflows')
        .update({
          nodes: updatedNodes,
          connections: updatedConnections,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      console.log(`✅ Node removed: ${nodeId}`);

    } catch (error) {
      console.error('❌ Failed to remove node:', error);
      throw error;
    }
  }

  async connectNodes(workflowId: string, fromNodeId: string, toNodeId: string, condition?: string): Promise<void> {
    try {
      console.log(`🔗 Connecting nodes: ${fromNodeId} -> ${toNodeId}`);

      // Get current workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Add connection
      const newConnection = {
        from_node: fromNodeId,
        to_node: toNodeId,
        condition
      };

      const updatedConnections = [...workflow.connections, newConnection];

      await supabase
        .from('workflows')
        .update({
          connections: updatedConnections,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      console.log(`✅ Nodes connected: ${fromNodeId} -> ${toNodeId}`);

    } catch (error) {
      console.error('❌ Failed to connect nodes:', error);
      throw error;
    }
  }

  async disconnectNodes(workflowId: string, fromNodeId: string, toNodeId: string): Promise<void> {
    try {
      console.log(`🔌 Disconnecting nodes: ${fromNodeId} -> ${toNodeId}`);

      // Get current workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Remove connection
      const updatedConnections = workflow.connections.filter((conn: any) =>
        !(conn.from_node === fromNodeId && conn.to_node === toNodeId)
      );

      await supabase
        .from('workflows')
        .update({
          connections: updatedConnections,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      console.log(`✅ Nodes disconnected: ${fromNodeId} -> ${toNodeId}`);

    } catch (error) {
      console.error('❌ Failed to disconnect nodes:', error);
      throw error;
    }
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, triggerData?: any): Promise<WorkflowExecution> {
    try {
      console.log(`▶️ Executing workflow: ${workflowId}`);

      // Get workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      if (workflow.status !== 'active') {
        throw new Error('Workflow is not active');
      }

      // Create execution record
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflow_id: workflowId,
        status: 'running',
        trigger_data: triggerData || {},
        execution_path: [],
        variables: this.initializeVariables(workflow.variables, triggerData),
        started_at: new Date()
      };

      // Store execution
      await this.storeExecution(execution);

      // Start execution process
      this.processWorkflowExecution(execution, workflow).catch(error => {
        console.error(`Workflow execution failed: ${execution.id}`, error);
      });

      console.log(`✅ Workflow execution started: ${execution.id}`);
      return execution;

    } catch (error) {
      console.error('❌ Failed to execute workflow:', error);
      throw error;
    }
  }

  private initializeVariables(variableDefinitions: any[], triggerData: any): Record<string, any> {
    const variables: Record<string, any> = {};

    // Set default values
    variableDefinitions.forEach(varDef => {
      variables[varDef.name] = varDef.default_value;
    });

    // Override with trigger data
    if (triggerData) {
      Object.assign(variables, triggerData);
    }

    return variables;
  }

  private async processWorkflowExecution(execution: WorkflowExecution, workflow: any): Promise<void> {
    try {
      console.log(`⚙️ Processing workflow execution: ${execution.id}`);

      // Find trigger nodes
      const triggerNodes = workflow.nodes.filter((node: WorkflowNode) => node.type === 'trigger');
      
      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found');
      }

      // Start with first trigger
      const startNode = triggerNodes[0];
      await this.executeNode(execution, workflow, startNode);

      // Complete execution
      execution.status = 'completed';
      execution.completed_at = new Date();
      await this.updateExecution(execution);

      // Update workflow last executed time
      await supabase
        .from('workflows')
        .update({ last_executed_at: new Date().toISOString() })
        .eq('id', workflow.id);

      console.log(`✅ Workflow execution completed: ${execution.id}`);

    } catch (error) {
      console.error(`❌ Workflow execution failed: ${execution.id}`, error);

      execution.status = 'failed';
      execution.error_message = error.toString();
      execution.completed_at = new Date();
      await this.updateExecution(execution);
    }
  }

  private async executeNode(execution: WorkflowExecution, workflow: any, node: WorkflowNode): Promise<void> {
    console.log(`🔄 Executing node: ${node.name} (${node.type})`);

    const pathEntry = {
      node_id: node.id,
      started_at: new Date(),
      status: 'running' as const,
      output: undefined,
      error: undefined
    };

    execution.execution_path.push(pathEntry);
    execution.current_node = node.id;
    await this.updateExecution(execution);

    try {
      let output: any;

      switch (node.type) {
        case 'trigger':
          output = await this.executeTriggerNode(node as WorkflowTrigger, execution);
          break;
        case 'condition':
          output = await this.executeConditionNode(node as WorkflowCondition, execution);
          break;
        case 'action':
          output = await this.executeActionNode(node as WorkflowAction, execution);
          break;
        case 'delay':
          output = await this.executeDelayNode(node, execution);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      pathEntry.status = 'completed';
      pathEntry.completed_at = new Date();
      pathEntry.output = output;

      // Find next nodes
      const nextConnections = workflow.connections.filter((conn: any) => conn.from_node === node.id);
      
      for (const connection of nextConnections) {
        const nextNode = workflow.nodes.find((n: WorkflowNode) => n.id === connection.to_node);
        if (nextNode) {
          // Check connection condition if any
          if (!connection.condition || this.evaluateCondition(connection.condition, execution.variables)) {
            await this.executeNode(execution, workflow, nextNode);
          }
        }
      }

    } catch (error) {
      pathEntry.status = 'failed';
      pathEntry.completed_at = new Date();
      pathEntry.error = error.toString();
      throw error;
    }
  }

  private async executeTriggerNode(node: WorkflowTrigger, execution: WorkflowExecution): Promise<any> {
    console.log(`🎯 Executing trigger: ${node.trigger_type}`);
    
    // Trigger nodes don't perform actions, they just provide data
    return {
      trigger_type: node.trigger_type,
      trigger_data: execution.trigger_data
    };
  }

  private async executeConditionNode(node: WorkflowCondition, execution: WorkflowExecution): Promise<any> {
    console.log(`🔍 Executing condition: ${node.condition_type}`);
    
    const result = this.evaluateConditionRules(node.rules, node.logic, execution.variables);
    
    return {
      condition_result: result,
      rules_evaluated: node.rules.length
    };
  }

  private evaluateConditionRules(rules: any[], logic: string, variables: Record<string, any>): boolean {
    const results = rules.map(rule => this.evaluateRule(rule, variables));
    
    if (logic === 'and') {
      return results.every(result => result);
    } else {
      return results.some(result => result);
    }
  }

  private evaluateRule(rule: any, variables: Record<string, any>): boolean {
    const fieldValue = variables[rule.field];
    const ruleValue = rule.value;

    switch (rule.operator) {
      case 'equals':
        return fieldValue === ruleValue;
      case 'not_equals':
        return fieldValue !== ruleValue;
      case 'contains':
        return String(fieldValue).includes(String(ruleValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(ruleValue));
      case 'greater_than':
        return Number(fieldValue) > Number(ruleValue);
      case 'less_than':
        return Number(fieldValue) < Number(ruleValue);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return fieldValue && fieldValue !== '';
      default:
        return false;
    }
  }

  private async executeActionNode(node: WorkflowAction, execution: WorkflowExecution): Promise<any> {
    console.log(`⚡ Executing action: ${node.action_type}`);
    
    switch (node.action_type) {
      case 'send_email':
        return await this.executeSendEmailAction(node, execution);
      case 'create_contact':
        return await this.executeCreateContactAction(node, execution);
      case 'update_contact':
        return await this.executeUpdateContactAction(node, execution);
      case 'add_tag':
        return await this.executeAddTagAction(node, execution);
      case 'send_webhook':
        return await this.executeSendWebhookAction(node, execution);
      default:
        throw new Error(`Unknown action type: ${node.action_type}`);
    }
  }

  private async executeSendEmailAction(node: WorkflowAction, execution: WorkflowExecution): Promise<any> {
    // Mock email sending
    console.log(`📧 Sending email: ${node.action_config.subject}`);
    
    return {
      action: 'send_email',
      recipient: node.action_config.recipient,
      subject: node.action_config.subject,
      sent_at: new Date().toISOString()
    };
  }

  private async executeCreateContactAction(node: WorkflowAction, execution: WorkflowExecution): Promise<any> {
    // Mock contact creation
    console.log(`👤 Creating contact`);
    
    return {
      action: 'create_contact',
      contact_id: `contact_${Date.now()}`,
      fields: node.action_config.fields
    };
  }

  private async executeUpdateContactAction(node: WorkflowAction, execution: WorkflowExecution): Promise<any> {
    // Mock contact update
    console.log(`📝 Updating contact`);
    
    return {
      action: 'update_contact',
      fields_updated: Object.keys(node.action_config.fields || {}).length
    };
  }

  private async executeAddTagAction(node: WorkflowAction, execution: WorkflowExecution): Promise<any> {
    // Mock tag addition
    console.log(`🏷️ Adding tags: ${node.action_config.tags?.join(', ')}`);
    
    return {
      action: 'add_tag',
      tags_added: node.action_config.tags?.length || 0
    };
  }

  private async executeSendWebhookAction(node: WorkflowAction, execution: WorkflowExecution): Promise<any> {
    // Mock webhook sending
    console.log(`🪝 Sending webhook to: ${node.action_config.webhook_url}`);
    
    return {
      action: 'send_webhook',
      url: node.action_config.webhook_url,
      status: 'sent'
    };
  }

  private async executeDelayNode(node: WorkflowNode, execution: WorkflowExecution): Promise<any> {
    const delayMs = node.config.delay_ms || 1000;
    console.log(`⏰ Delaying execution for ${delayMs}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    return {
      action: 'delay',
      delay_ms: delayMs
    };
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // Simple condition evaluation - in reality would use a proper expression parser
    try {
      // Replace variable references with actual values
      let evaluatedCondition = condition;
      for (const [key, value] of Object.entries(variables)) {
        evaluatedCondition = evaluatedCondition.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), JSON.stringify(value));
      }
      
      // Evaluate the condition (this is simplified - would use a safe evaluator in production)
      return eval(evaluatedCondition);
    } catch (error) {
      console.warn('Failed to evaluate condition:', condition, error);
      return false;
    }
  }

  private async storeExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: execution.workflow_id,
          status: execution.status,
          trigger_data: execution.trigger_data,
          current_node: execution.current_node,
          execution_path: execution.execution_path,
          variables: execution.variables,
          started_at: execution.started_at.toISOString(),
          completed_at: execution.completed_at?.toISOString(),
          error_message: execution.error_message
        });

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to store execution:', error);
    }
  }

  private async updateExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_executions')
        .update({
          status: execution.status,
          current_node: execution.current_node,
          execution_path: execution.execution_path,
          variables: execution.variables,
          completed_at: execution.completed_at?.toISOString(),
          error_message: execution.error_message
        })
        .eq('id', execution.id);

      if (error) throw error;

    } catch (error) {
      console.warn('Failed to update execution:', error);
    }
  }  
// Workflow Templates
  async getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
    try {
      let query = supabase
        .from('workflow_templates')
        .select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get workflow templates:', error);
      throw error;
    }
  }

  async createWorkflowFromTemplate(templateId: string, userId: string, workflowName?: string): Promise<Workflow> {
    try {
      console.log(`📋 Creating workflow from template: ${templateId}`);

      // Get template
      const { data: template, error } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Create workflow from template
      const workflow = await this.createWorkflow({
        user_id: userId,
        name: workflowName || template.name,
        description: template.description,
        category: template.workflow_data.category,
        status: 'draft',
        nodes: template.workflow_data.nodes,
        connections: template.workflow_data.connections,
        variables: template.workflow_data.variables,
        settings: template.workflow_data.settings
      });

      // Update template usage count
      await supabase
        .from('workflow_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', templateId);

      console.log(`✅ Workflow created from template: ${templateId} -> ${workflow.id}`);
      return workflow;

    } catch (error) {
      console.error('❌ Failed to create workflow from template:', error);
      throw error;
    }
  }

  // Workflow Testing and Debugging
  async testWorkflow(workflowId: string, testData?: any): Promise<{
    success: boolean;
    execution_id?: string;
    test_results: Array<{
      node_id: string;
      node_name: string;
      status: 'passed' | 'failed' | 'skipped';
      execution_time_ms: number;
      output?: any;
      error?: string;
    }>;
    total_execution_time_ms: number;
    errors: string[];
  }> {
    try {
      console.log(`🧪 Testing workflow: ${workflowId}`);

      const startTime = Date.now();
      const testResults = [];
      const errors = [];

      // Get workflow
      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Create test execution
      const execution = await this.executeWorkflow(workflowId, testData);

      // Wait for execution to complete (with timeout)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (execution.status === 'running' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: updatedExecution } = await supabase
          .from('workflow_executions')
          .select('*')
          .eq('id', execution.id)
          .single();

        if (updatedExecution) {
          execution.status = updatedExecution.status;
          execution.execution_path = updatedExecution.execution_path;
          execution.error_message = updatedExecution.error_message;
        }
        
        attempts++;
      }

      // Analyze test results
      for (const pathEntry of execution.execution_path) {
        const node = workflow.nodes.find((n: WorkflowNode) => n.id === pathEntry.node_id);
        
        testResults.push({
          node_id: pathEntry.node_id,
          node_name: node?.name || 'Unknown Node',
          status: pathEntry.status === 'completed' ? 'passed' : pathEntry.status === 'failed' ? 'failed' : 'skipped',
          execution_time_ms: pathEntry.completed_at && pathEntry.started_at 
            ? new Date(pathEntry.completed_at).getTime() - new Date(pathEntry.started_at).getTime()
            : 0,
          output: pathEntry.output,
          error: pathEntry.error
        });

        if (pathEntry.error) {
          errors.push(`${node?.name || pathEntry.node_id}: ${pathEntry.error}`);
        }
      }

      const totalExecutionTime = Date.now() - startTime;
      const success = execution.status === 'completed' && errors.length === 0;

      console.log(`✅ Workflow test ${success ? 'passed' : 'failed'}: ${workflowId}`);

      return {
        success,
        execution_id: execution.id,
        test_results: testResults,
        total_execution_time_ms: totalExecutionTime,
        errors
      };

    } catch (error) {
      console.error('❌ Failed to test workflow:', error);
      return {
        success: false,
        test_results: [],
        total_execution_time_ms: 0,
        errors: [error instanceof Error ? error.message : 'Test failed']
      };
    }
  }

  async debugWorkflow(workflowId: string): Promise<{
    validation_errors: string[];
    performance_issues: string[];
    optimization_suggestions: string[];
    node_analysis: Array<{
      node_id: string;
      node_name: string;
      issues: string[];
      suggestions: string[];
    }>;
  }> {
    try {
      console.log(`🔍 Debugging workflow: ${workflowId}`);

      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      const validationErrors = [];
      const performanceIssues = [];
      const optimizationSuggestions = [];
      const nodeAnalysis = [];

      // Validate workflow structure
      try {
        this.validateWorkflow(workflow);
      } catch (validationError) {
        validationErrors.push(validationError.message);
      }

      // Analyze nodes
      for (const node of workflow.nodes) {
        const nodeIssues = [];
        const nodeSuggestions = [];

        // Check for common issues
        if (node.type === 'action' && !node.config) {
          nodeIssues.push('Action node missing configuration');
        }

        if (node.type === 'condition' && (!node.config || !node.config.rules)) {
          nodeIssues.push('Condition node missing rules');
        }

        // Check for performance issues
        if (node.type === 'delay' && node.config.delay_ms > 60000) {
          performanceIssues.push(`Long delay in node "${node.name}": ${node.config.delay_ms}ms`);
        }

        // Optimization suggestions
        if (node.type === 'action' && node.action_type === 'send_email' && !node.retry_config) {
          nodeSuggestions.push('Consider adding retry configuration for email actions');
        }

        nodeAnalysis.push({
          node_id: node.id,
          node_name: node.name,
          issues: nodeIssues,
          suggestions: nodeSuggestions
        });
      }

      // Check for workflow-level optimizations
      const actionNodes = workflow.nodes.filter((n: WorkflowNode) => n.type === 'action');
      if (actionNodes.length > 10) {
        optimizationSuggestions.push('Consider breaking down complex workflows into smaller sub-workflows');
      }

      const parallelizableActions = this.findParallelizableActions(workflow);
      if (parallelizableActions.length > 0) {
        optimizationSuggestions.push(`${parallelizableActions.length} actions could be parallelized for better performance`);
      }

      console.log(`✅ Workflow debugging completed: ${workflowId}`);

      return {
        validation_errors: validationErrors,
        performance_issues: performanceIssues,
        optimization_suggestions: optimizationSuggestions,
        node_analysis: nodeAnalysis
      };

    } catch (error) {
      console.error('❌ Failed to debug workflow:', error);
      throw error;
    }
  }

  private findParallelizableActions(workflow: any): string[] {
    // Find action nodes that don't depend on each other and could run in parallel
    const parallelizable = [];
    const actionNodes = workflow.nodes.filter((n: WorkflowNode) => n.type === 'action');

    for (let i = 0; i < actionNodes.length; i++) {
      for (let j = i + 1; j < actionNodes.length; j++) {
        const node1 = actionNodes[i];
        const node2 = actionNodes[j];

        // Check if nodes are independent (no direct connection path)
        if (!this.hasConnectionPath(workflow, node1.id, node2.id) && 
            !this.hasConnectionPath(workflow, node2.id, node1.id)) {
          parallelizable.push(`${node1.name} and ${node2.name}`);
        }
      }
    }

    return parallelizable;
  }

  private hasConnectionPath(workflow: any, fromNodeId: string, toNodeId: string): boolean {
    const visited = new Set<string>();
    const queue = [fromNodeId];

    while (queue.length > 0) {
      const currentNodeId = queue.shift()!;
      
      if (currentNodeId === toNodeId) {
        return true;
      }

      if (visited.has(currentNodeId)) {
        continue;
      }

      visited.add(currentNodeId);

      // Find connected nodes
      const connections = workflow.connections.filter((conn: any) => conn.from_node === currentNodeId);
      for (const connection of connections) {
        queue.push(connection.to_node);
      }
    }

    return false;
  }

  // Workflow Analytics and Monitoring
  async getWorkflowAnalytics(workflowId: string, dateRange?: { start: string; end: string }): Promise<{
    execution_count: number;
    success_rate: number;
    average_execution_time_ms: number;
    most_common_errors: Array<{ error: string; count: number }>;
    node_performance: Array<{
      node_id: string;
      node_name: string;
      execution_count: number;
      success_rate: number;
      average_execution_time_ms: number;
    }>;
    execution_trends: Array<{
      date: string;
      executions: number;
      successes: number;
      failures: number;
    }>;
  }> {
    try {
      console.log(`📊 Getting workflow analytics: ${workflowId}`);

      let query = supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId);

      if (dateRange) {
        query = query
          .gte('started_at', dateRange.start)
          .lte('started_at', dateRange.end);
      }

      const { data: executions, error } = await query;

      if (error) throw error;

      const executionCount = executions?.length || 0;
      const successfulExecutions = executions?.filter(e => e.status === 'completed') || [];
      const failedExecutions = executions?.filter(e => e.status === 'failed') || [];

      const successRate = executionCount > 0 ? (successfulExecutions.length / executionCount) * 100 : 0;

      // Calculate average execution time
      const completedExecutions = executions?.filter(e => e.completed_at) || [];
      const totalExecutionTime = completedExecutions.reduce((sum, exec) => {
        const startTime = new Date(exec.started_at).getTime();
        const endTime = new Date(exec.completed_at).getTime();
        return sum + (endTime - startTime);
      }, 0);

      const averageExecutionTime = completedExecutions.length > 0 
        ? totalExecutionTime / completedExecutions.length 
        : 0;

      // Find most common errors
      const errorCounts: { [key: string]: number } = {};
      failedExecutions.forEach(exec => {
        if (exec.error_message) {
          errorCounts[exec.error_message] = (errorCounts[exec.error_message] || 0) + 1;
        }
      });

      const mostCommonErrors = Object.entries(errorCounts)
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Analyze node performance
      const nodePerformance = this.analyzeNodePerformance(executions || []);

      // Generate execution trends (mock data for now)
      const executionTrends = this.generateExecutionTrends(executions || []);

      console.log(`✅ Workflow analytics generated: ${workflowId}`);

      return {
        execution_count: executionCount,
        success_rate: Math.round(successRate * 100) / 100,
        average_execution_time_ms: Math.round(averageExecutionTime),
        most_common_errors: mostCommonErrors,
        node_performance: nodePerformance,
        execution_trends: executionTrends
      };

    } catch (error) {
      console.error('❌ Failed to get workflow analytics:', error);
      throw error;
    }
  }

  private analyzeNodePerformance(executions: any[]): Array<{
    node_id: string;
    node_name: string;
    execution_count: number;
    success_rate: number;
    average_execution_time_ms: number;
  }> {
    const nodeStats: { [nodeId: string]: any } = {};

    executions.forEach(execution => {
      if (execution.execution_path) {
        execution.execution_path.forEach((pathEntry: any) => {
          if (!nodeStats[pathEntry.node_id]) {
            nodeStats[pathEntry.node_id] = {
              node_id: pathEntry.node_id,
              node_name: pathEntry.node_id, // Would get actual name from workflow
              executions: [],
              successes: 0,
              failures: 0,
              total_time: 0
            };
          }

          const stats = nodeStats[pathEntry.node_id];
          stats.executions.push(pathEntry);

          if (pathEntry.status === 'completed') {
            stats.successes++;
          } else if (pathEntry.status === 'failed') {
            stats.failures++;
          }

          if (pathEntry.started_at && pathEntry.completed_at) {
            const executionTime = new Date(pathEntry.completed_at).getTime() - new Date(pathEntry.started_at).getTime();
            stats.total_time += executionTime;
          }
        });
      }
    });

    return Object.values(nodeStats).map((stats: any) => ({
      node_id: stats.node_id,
      node_name: stats.node_name,
      execution_count: stats.executions.length,
      success_rate: stats.executions.length > 0 
        ? Math.round((stats.successes / stats.executions.length) * 10000) / 100
        : 0,
      average_execution_time_ms: stats.executions.length > 0 
        ? Math.round(stats.total_time / stats.executions.length)
        : 0
    }));
  }

  private generateExecutionTrends(executions: any[]): Array<{
    date: string;
    executions: number;
    successes: number;
    failures: number;
  }> {
    const trends: { [date: string]: { executions: number; successes: number; failures: number } } = {};

    executions.forEach(execution => {
      const date = new Date(execution.started_at).toISOString().split('T')[0];
      
      if (!trends[date]) {
        trends[date] = { executions: 0, successes: 0, failures: 0 };
      }

      trends[date].executions++;
      
      if (execution.status === 'completed') {
        trends[date].successes++;
      } else if (execution.status === 'failed') {
        trends[date].failures++;
      }
    });

    return Object.entries(trends)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Workflow Import/Export
  async exportWorkflow(workflowId: string): Promise<{
    workflow_data: any;
    export_format: string;
    exported_at: string;
  }> {
    try {
      console.log(`📤 Exporting workflow: ${workflowId}`);

      const { data: workflow, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Remove user-specific and system-generated fields
      const exportData = {
        name: workflow.name,
        description: workflow.description,
        category: workflow.category,
        nodes: workflow.nodes,
        connections: workflow.connections,
        variables: workflow.variables,
        settings: workflow.settings,
        export_version: '1.0'
      };

      console.log(`✅ Workflow exported: ${workflowId}`);

      return {
        workflow_data: exportData,
        export_format: 'json',
        exported_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to export workflow:', error);
      throw error;
    }
  }

  async importWorkflow(userId: string, workflowData: any, workflowName?: string): Promise<Workflow> {
    try {
      console.log(`📥 Importing workflow: ${workflowName || workflowData.name}`);

      // Validate import data
      if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
        throw new Error('Invalid workflow data: missing or invalid nodes');
      }

      if (!workflowData.connections || !Array.isArray(workflowData.connections)) {
        throw new Error('Invalid workflow data: missing or invalid connections');
      }

      // Create workflow from imported data
      const workflow = await this.createWorkflow({
        user_id: userId,
        name: workflowName || workflowData.name || 'Imported Workflow',
        description: workflowData.description || 'Imported workflow',
        category: workflowData.category || 'custom',
        status: 'draft',
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        variables: workflowData.variables || [],
        settings: workflowData.settings || {
          error_handling: 'stop',
          logging_level: 'basic'
        }
      });

      console.log(`✅ Workflow imported: ${workflow.id}`);
      return workflow;

    } catch (error) {
      console.error('❌ Failed to import workflow:', error);
      throw error;
    }
  }

  // Utility Methods
  async getWorkflowExecutions(workflowId: string, limit: number = 50): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(execution => ({
        ...execution,
        started_at: new Date(execution.started_at),
        completed_at: execution.completed_at ? new Date(execution.completed_at) : undefined
      }));

    } catch (error) {
      console.error('❌ Failed to get workflow executions:', error);
      throw error;
    }
  }

  async cancelWorkflowExecution(executionId: string): Promise<void> {
    try {
      console.log(`⏹️ Cancelling workflow execution: ${executionId}`);

      const { error } = await supabase
        .from('workflow_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);

      if (error) throw error;

      console.log(`✅ Workflow execution cancelled: ${executionId}`);

    } catch (error) {
      console.error('❌ Failed to cancel workflow execution:', error);
      throw error;
    }
  }

  async getAvailableActions(): Promise<Array<{
    type: string;
    name: string;
    description: string;
    category: string;
    config_schema: any;
  }>> {
    return [
      {
        type: 'send_email',
        name: 'Send Email',
        description: 'Send an email to specified recipients',
        category: 'communication',
        config_schema: {
          recipient: { type: 'string', required: true },
          subject: { type: 'string', required: true },
          content: { type: 'string', required: true },
          template_id: { type: 'string', required: false }
        }
      },
      {
        type: 'create_contact',
        name: 'Create Contact',
        description: 'Create a new contact in the CRM',
        category: 'crm',
        config_schema: {
          email: { type: 'string', required: true },
          name: { type: 'string', required: false },
          phone: { type: 'string', required: false },
          company: { type: 'string', required: false }
        }
      },
      {
        type: 'update_contact',
        name: 'Update Contact',
        description: 'Update an existing contact',
        category: 'crm',
        config_schema: {
          contact_id: { type: 'string', required: true },
          fields: { type: 'object', required: true }
        }
      },
      {
        type: 'add_tag',
        name: 'Add Tag',
        description: 'Add tags to a contact',
        category: 'crm',
        config_schema: {
          contact_id: { type: 'string', required: true },
          tags: { type: 'array', required: true }
        }
      },
      {
        type: 'send_webhook',
        name: 'Send Webhook',
        description: 'Send data to an external webhook URL',
        category: 'integration',
        config_schema: {
          webhook_url: { type: 'string', required: true },
          method: { type: 'string', required: false, default: 'POST' },
          headers: { type: 'object', required: false },
          body: { type: 'object', required: false }
        }
      }
    ];
  }

  async getAvailableTriggers(): Promise<Array<{
    type: string;
    name: string;
    description: string;
    category: string;
    config_schema: any;
  }>> {
    return [
      {
        type: 'manual',
        name: 'Manual Trigger',
        description: 'Manually trigger the workflow',
        category: 'manual',
        config_schema: {}
      },
      {
        type: 'schedule',
        name: 'Schedule Trigger',
        description: 'Trigger workflow on a schedule',
        category: 'time',
        config_schema: {
          frequency: { type: 'string', required: true, options: ['once', 'daily', 'weekly', 'monthly'] },
          time: { type: 'string', required: false },
          days: { type: 'array', required: false },
          date: { type: 'string', required: false }
        }
      },
      {
        type: 'webhook',
        name: 'Webhook Trigger',
        description: 'Trigger workflow via webhook',
        category: 'integration',
        config_schema: {
          webhook_url: { type: 'string', readonly: true }
        }
      },
      {
        type: 'form_submit',
        name: 'Form Submission',
        description: 'Trigger when a form is submitted',
        category: 'form',
        config_schema: {
          form_id: { type: 'string', required: true }
        }
      },
      {
        type: 'email_open',
        name: 'Email Opened',
        description: 'Trigger when an email is opened',
        category: 'email',
        config_schema: {
          campaign_id: { type: 'string', required: false }
        }
      }
    ];
  }
}

export const workflowBuilderService = WorkflowBuilderService.getInstance();
  async testWorkflow(workflowId: string, testData?: any): Promise<{
    success: boolean;
    execution_id: string;
    execution_time: number;
    nodes_executed: number;
    errors: string[];
    warnings: string[];
  }> {
    try {
      console.log(`🧪 Testing workflow: ${workflowId}`);

      const startTime = Date.now();
      const execution = await this.executeWorkflow(workflowId, testData);
      
      // Wait for execution to complete (with timeout)
      const timeout = 30000; // 30 seconds
      const checkInterval = 1000; // 1 second
      let elapsed = 0;

      while (execution.status === 'running' && elapsed < timeout) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
        
        // Get updated execution status
        const { data: updatedExecution } = await supabase
          .from('workflow_executions')
          .select('status, execution_path')
          .eq('id', execution.id)
          .single();

        if (updatedExecution) {
          execution.status = updatedExecution.status;
          execution.execution_path = updatedExecution.execution_path;
        }
      }

      const executionTime = Date.now() - startTime;
      const errors = execution.execution_path
        .filter(step => step.status === 'failed')
        .map(step => step.error || 'Unknown error');

      const warnings = [];
      if (elapsed >= timeout) {
        warnings.push('Test execution timed out');
      }

      return {
        success: execution.status === 'completed',
        execution_id: execution.id,
        execution_time: executionTime,
        nodes_executed: execution.execution_path.length,
        errors,
        warnings
      };

    } catch (error) {
      console.error('❌ Failed to test workflow:', error);
      return {
        success: false,
        execution_id: '',
        execution_time: 0,
        nodes_executed: 0,
        errors: [error.toString()],
        warnings: []
      };
    }
  }

  async getWorkflowExecutions(workflowId: string, limit: number = 20): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(execution => ({
        ...execution,
        started_at: new Date(execution.started_at),
        completed_at: execution.completed_at ? new Date(execution.completed_at) : undefined,
        execution_path: execution.execution_path.map((step: any) => ({
          ...step,
          started_at: new Date(step.started_at),
          completed_at: step.completed_at ? new Date(step.completed_at) : undefined
        }))
      }));

    } catch (error) {
      console.error('❌ Failed to get workflow executions:', error);
      throw error;
    }
  }

  // Action Library
  getAvailableActions(): Array<{
    type: string;
    name: string;
    description: string;
    category: string;
    config_schema: any;
    icon: string;
  }> {
    return [
      {
        type: 'send_email',
        name: 'Send Email',
        description: 'Send an email to a contact or list',
        category: 'Communication',
        config_schema: {
          recipient: { type: 'string', required: true, description: 'Email recipient' },
          subject: { type: 'string', required: true, description: 'Email subject' },
          content: { type: 'string', required: true, description: 'Email content' },
          template_id: { type: 'string', required: false, description: 'Email template ID' }
        },
        icon: '📧'
      },
      {
        type: 'create_contact',
        name: 'Create Contact',
        description: 'Create a new contact in the CRM',
        category: 'CRM',
        config_schema: {
          email: { type: 'string', required: true, description: 'Contact email' },
          first_name: { type: 'string', required: false, description: 'First name' },
          last_name: { type: 'string', required: false, description: 'Last name' },
          phone: { type: 'string', required: false, description: 'Phone number' }
        },
        icon: '👤'
      },
      {
        type: 'update_contact',
        name: 'Update Contact',
        description: 'Update an existing contact',
        category: 'CRM',
        config_schema: {
          contact_id: { type: 'string', required: true, description: 'Contact ID' },
          fields: { type: 'object', required: true, description: 'Fields to update' }
        },
        icon: '📝'
      },
      {
        type: 'add_tag',
        name: 'Add Tag',
        description: 'Add tags to a contact',
        category: 'CRM',
        config_schema: {
          contact_id: { type: 'string', required: true, description: 'Contact ID' },
          tags: { type: 'array', required: true, description: 'Tags to add' }
        },
        icon: '🏷️'
      },
      {
        type: 'remove_tag',
        name: 'Remove Tag',
        description: 'Remove tags from a contact',
        category: 'CRM',
        config_schema: {
          contact_id: { type: 'string', required: true, description: 'Contact ID' },
          tags: { type: 'array', required: true, description: 'Tags to remove' }
        },
        icon: '🗑️'
      },
      {
        type: 'create_task',
        name: 'Create Task',
        description: 'Create a task or reminder',
        category: 'Productivity',
        config_schema: {
          title: { type: 'string', required: true, description: 'Task title' },
          description: { type: 'string', required: false, description: 'Task description' },
          due_date: { type: 'string', required: false, description: 'Due date' },
          assignee: { type: 'string', required: false, description: 'Task assignee' }
        },
        icon: '✅'
      },
      {
        type: 'send_webhook',
        name: 'Send Webhook',
        description: 'Send data to an external webhook URL',
        category: 'Integration',
        config_schema: {
          webhook_url: { type: 'string', required: true, description: 'Webhook URL' },
          method: { type: 'string', required: false, description: 'HTTP method', default: 'POST' },
          headers: { type: 'object', required: false, description: 'HTTP headers' },
          body: { type: 'object', required: false, description: 'Request body' }
        },
        icon: '🪝'
      },
      {
        type: 'api_call',
        name: 'API Call',
        description: 'Make an HTTP API call',
        category: 'Integration',
        config_schema: {
          api_endpoint: { type: 'string', required: true, description: 'API endpoint URL' },
          method: { type: 'string', required: true, description: 'HTTP method' },
          headers: { type: 'object', required: false, description: 'HTTP headers' },
          body: { type: 'object', required: false, description: 'Request body' }
        },
        icon: '🔌'
      },
      {
        type: 'delay',
        name: 'Delay',
        description: 'Wait for a specified amount of time',
        category: 'Control',
        config_schema: {
          delay_ms: { type: 'number', required: true, description: 'Delay in milliseconds' }
        },
        icon: '⏰'
      }
    ];
  }

  // Trigger Library
  getAvailableTriggers(): Array<{
    type: string;
    name: string;
    description: string;
    category: string;
    config_schema: any;
    icon: string;
  }> {
    return [
      {
        type: 'manual',
        name: 'Manual Trigger',
        description: 'Manually start the workflow',
        category: 'Manual',
        config_schema: {},
        icon: '👆'
      },
      {
        type: 'schedule',
        name: 'Schedule',
        description: 'Run workflow on a schedule',
        category: 'Time',
        config_schema: {
          frequency: { type: 'string', required: true, description: 'Schedule frequency' },
          time: { type: 'string', required: false, description: 'Time of day' },
          days: { type: 'array', required: false, description: 'Days of week' }
        },
        icon: '📅'
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Trigger via webhook call',
        category: 'Integration',
        config_schema: {
          webhook_url: { type: 'string', required: false, description: 'Webhook URL (auto-generated)' }
        },
        icon: '🪝'
      },
      {
        type: 'form_submit',
        name: 'Form Submission',
        description: 'Trigger when a form is submitted',
        category: 'Forms',
        config_schema: {
          form_id: { type: 'string', required: true, description: 'Form ID' }
        },
        icon: '📝'
      },
      {
        type: 'email_open',
        name: 'Email Opened',
        description: 'Trigger when an email is opened',
        category: 'Email',
        config_schema: {
          campaign_id: { type: 'string', required: false, description: 'Specific campaign ID' }
        },
        icon: '📧'
      },
      {
        type: 'email_click',
        name: 'Email Clicked',
        description: 'Trigger when an email link is clicked',
        category: 'Email',
        config_schema: {
          campaign_id: { type: 'string', required: false, description: 'Specific campaign ID' },
          link_url: { type: 'string', required: false, description: 'Specific link URL' }
        },
        icon: '🖱️'
      },
      {
        type: 'contact_created',
        name: 'Contact Created',
        description: 'Trigger when a new contact is created',
        category: 'CRM',
        config_schema: {
          conditions: { type: 'array', required: false, description: 'Additional conditions' }
        },
        icon: '👤'
      },
      {
        type: 'contact_updated',
        name: 'Contact Updated',
        description: 'Trigger when a contact is updated',
        category: 'CRM',
        config_schema: {
          field: { type: 'string', required: false, description: 'Specific field that changed' },
          conditions: { type: 'array', required: false, description: 'Additional conditions' }
        },
        icon: '📝'
      }
    ];
  }

  // Default Workflow Templates Setup
  async setupDefaultWorkflowTemplates(): Promise<void> {
    try {
      console.log('🔧 Setting up default workflow templates...');

      const defaultTemplates: Array<Omit<WorkflowTemplate, 'id'>> = [
        {
          name: 'Welcome Email Sequence',
          description: 'Send a series of welcome emails to new contacts',
          category: 'Email Marketing',
          workflow_data: {
            name: 'Welcome Email Sequence',
            description: 'Automated welcome email sequence for new contacts',
            category: 'marketing',
            status: 'draft',
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                name: 'New Contact Created',
                description: 'Triggers when a new contact is created',
                position: { x: 100, y: 100 },
                config: {
                  trigger_type: 'contact_created'
                },
                connections: { inputs: [], outputs: ['action_1'] },
                status: 'active'
              },
              {
                id: 'action_1',
                type: 'action',
                name: 'Send Welcome Email',
                description: 'Send welcome email to new contact',
                position: { x: 300, y: 100 },
                config: {
                  action_type: 'send_email',
                  action_config: {
                    subject: 'Welcome to HigherUp.ai!',
                    content: 'Thank you for joining us. We\'re excited to have you on board!'
                  }
                },
                connections: { inputs: ['trigger_1'], outputs: ['delay_1'] },
                status: 'active'
              },
              {
                id: 'delay_1',
                type: 'delay',
                name: 'Wait 2 Days',
                description: 'Wait 2 days before next email',
                position: { x: 500, y: 100 },
                config: {
                  delay_ms: 2 * 24 * 60 * 60 * 1000
                },
                connections: { inputs: ['action_1'], outputs: ['action_2'] },
                status: 'active'
              },
              {
                id: 'action_2',
                type: 'action',
                name: 'Send Getting Started Email',
                description: 'Send getting started guide',
                position: { x: 700, y: 100 },
                config: {
                  action_type: 'send_email',
                  action_config: {
                    subject: 'Getting Started with HigherUp.ai',
                    content: 'Here are some resources to help you get started with our platform.'
                  }
                },
                connections: { inputs: ['delay_1'], outputs: [] },
                status: 'active'
              }
            ],
            connections: [
              { from_node: 'trigger_1', to_node: 'action_1' },
              { from_node: 'action_1', to_node: 'delay_1' },
              { from_node: 'delay_1', to_node: 'action_2' }
            ],
            variables: [
              { name: 'contact_email', type: 'string', description: 'Contact email address' },
              { name: 'contact_name', type: 'string', description: 'Contact name' }
            ],
            settings: {
              max_executions_per_day: 1000,
              execution_timeout: 300000,
              error_handling: 'continue',
              logging_level: 'basic'
            }
          },
          usage_count: 0,
          rating: 4.8,
          is_premium: false
        },
        {
          name: 'Lead Nurturing Campaign',
          description: 'Nurture leads with educational content over time',
          category: 'Lead Generation',
          workflow_data: {
            name: 'Lead Nurturing Campaign',
            description: 'Automated lead nurturing with educational content',
            category: 'sales',
            status: 'draft',
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                name: 'Lead Tag Added',
                description: 'Triggers when lead tag is added to contact',
                position: { x: 100, y: 100 },
                config: {
                  trigger_type: 'contact_updated',
                  conditions: [{ field: 'tags', operator: 'contains', value: 'lead' }]
                },
                connections: { inputs: [], outputs: ['action_1'] },
                status: 'active'
              },
              {
                id: 'action_1',
                type: 'action',
                name: 'Send Educational Content',
                description: 'Send first educational email',
                position: { x: 300, y: 100 },
                config: {
                  action_type: 'send_email',
                  action_config: {
                    subject: 'Your Guide to Success',
                    content: 'Here\'s valuable information to help you succeed in your industry.'
                  }
                },
                connections: { inputs: ['trigger_1'], outputs: ['delay_1'] },
                status: 'active'
              },
              {
                id: 'delay_1',
                type: 'delay',
                name: 'Wait 1 Week',
                description: 'Wait 1 week before follow-up',
                position: { x: 500, y: 100 },
                config: {
                  delay_ms: 7 * 24 * 60 * 60 * 1000
                },
                connections: { inputs: ['action_1'], outputs: ['action_2'] },
                status: 'active'
              },
              {
                id: 'action_2',
                type: 'action',
                name: 'Send Case Study',
                description: 'Send success case study',
                position: { x: 700, y: 100 },
                config: {
                  action_type: 'send_email',
                  action_config: {
                    subject: 'How Company X Increased Revenue by 300%',
                    content: 'Learn from this detailed case study of a successful implementation.'
                  }
                },
                connections: { inputs: ['delay_1'], outputs: [] },
                status: 'active'
              }
            ],
            connections: [
              { from_node: 'trigger_1', to_node: 'action_1' },
              { from_node: 'action_1', to_node: 'delay_1' },
              { from_node: 'delay_1', to_node: 'action_2' }
            ],
            variables: [
              { name: 'contact_email', type: 'string', description: 'Contact email address' },
              { name: 'industry', type: 'string', description: 'Contact industry' }
            ],
            settings: {
              max_executions_per_day: 500,
              execution_timeout: 300000,
              error_handling: 'continue',
              logging_level: 'detailed'
            }
          },
          usage_count: 0,
          rating: 4.6,
          is_premium: false
        }
      ];

      for (const template of defaultTemplates) {
        const { error } = await supabase
          .from('workflow_templates')
          .insert(template);

        if (error && error.code !== '23505') { // Ignore duplicate key errors
          throw error;
        }
      }

      console.log(`✅ Created ${defaultTemplates.length} default workflow templates`);

    } catch (error) {
      console.error('❌ Failed to setup default workflow templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const workflowBuilderService = WorkflowBuilderService.getInstance();
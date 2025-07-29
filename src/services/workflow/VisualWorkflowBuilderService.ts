import { supabase } from '@/integrations/supabase/client';

/**
 * Visual Workflow Builder Service
 * 
 * Provides drag-and-drop workflow creation with conditional logic,
 * triggers, actions, and comprehensive workflow management.
 */

export interface WorkflowNode {
    id: string;
    type: 'trigger' | 'condition' | 'action' | 'delay' | 'split' | 'merge';
    name: string;
    description: string;
    position: { x: number; y: number };
    config: Record<string, any>;
    connections: {
        input: string[];
        output: string[];
    };
    status: 'active' | 'inactive' | 'error';
    created_at: string;
    updated_at: string;
}

export interface WorkflowConnection {
    id: string;
    source_node_id: string;
    target_node_id: string;
    condition?: string;
    label?: string;
    created_at: string;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    status: 'draft' | 'active' | 'paused' | 'archived';
    trigger_type: 'manual' | 'scheduled' | 'event' | 'webhook';
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    variables: Record<string, any>;
    settings: {
        timeout_minutes: number;
        retry_attempts: number;
        error_handling: 'stop' | 'continue' | 'retry';
        notifications: boolean;
    };
    statistics: {
        total_executions: number;
        successful_executions: number;
        failed_executions: number;
        avg_execution_time: number;
        last_execution: string | null;
    };
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface WorkflowExecution {
    id: string;
    workflow_id: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    trigger_data: Record<string, any>;
    execution_log: ExecutionLogEntry[];
    start_time: string;
    end_time?: string;
    duration_ms?: number;
    error_message?: string;
}

export interface ExecutionLogEntry {
    timestamp: string;
    node_id: string;
    node_name: string;
    action: string;
    status: 'started' | 'completed' | 'failed' | 'skipped';
    input_data?: Record<string, any>;
    output_data?: Record<string, any>;
    error_message?: string;
    duration_ms: number;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    workflow_data: Omit<Workflow, 'id' | 'created_by' | 'created_at' | 'updated_at' | 'statistics'>;
    usage_count: number;
    rating: number;
    created_at: string;
}

export interface TriggerDefinition {
    type: string;
    name: string;
    description: string;
    icon: string;
    config_schema: Record<string, any>;
    output_schema: Record<string, any>;
}

export interface ActionDefinition {
    type: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    config_schema: Record<string, any>;
    input_schema: Record<string, any>;
    output_schema: Record<string, any>;
}

export class VisualWorkflowBuilderService {
    private static instance: VisualWorkflowBuilderService;
    private triggerDefinitions: Map<string, TriggerDefinition> = new Map();
    private actionDefinitions: Map<string, ActionDefinition> = new Map();

    private constructor() {
        this.initializeService();
    }

    public static getInstance(): VisualWorkflowBuilderService {
        if (!VisualWorkflowBuilderService.instance) {
            VisualWorkflowBuilderService.instance = new VisualWorkflowBuilderService();
        }
        return VisualWorkflowBuilderService.instance;
    }

    private async initializeService(): Promise<void> {
        try {
            console.log('🔧 Initializing Visual Workflow Builder Service');

            // Load trigger and action definitions
            await this.loadTriggerDefinitions();
            await this.loadActionDefinitions();

            // Initialize workflow engine
            await this.initializeWorkflowEngine();

            console.log('✅ Visual Workflow Builder Service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Visual Workflow Builder Service:', error);
        }
    }

    // Workflow Management
    async createWorkflow(workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'statistics'>): Promise<Workflow> {
        try {
            console.log(`🔨 Creating workflow: ${workflowData.name}`);

            const workflow: Workflow = {
                id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...workflowData,
                statistics: {
                    total_executions: 0,
                    successful_executions: 0,
                    failed_executions: 0,
                    avg_execution_time: 0,
                    last_execution: null
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Validate workflow structure
            const validation = await this.validateWorkflow(workflow);
            if (!validation.isValid) {
                throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
            }

            // Store workflow
            await this.storeWorkflow(workflow);

            console.log(`✅ Workflow created: ${workflow.id}`);
            return workflow;

        } catch (error) {
            console.error('❌ Failed to create workflow:', error);
            throw error;
        }
    }

    async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
        try {
            console.log(`📝 Updating workflow: ${workflowId}`);

            const existingWorkflow = await this.getWorkflow(workflowId);
            if (!existingWorkflow) {
                throw new Error('Workflow not found');
            }

            const updatedWorkflow: Workflow = {
                ...existingWorkflow,
                ...updates,
                updated_at: new Date().toISOString()
            };

            // Validate updated workflow
            const validation = await this.validateWorkflow(updatedWorkflow);
            if (!validation.isValid) {
                throw new Error(`Workflow validation failed: ${validation.errors.join(', ')}`);
            }

            // Store updated workflow
            await this.storeWorkflow(updatedWorkflow);

            console.log(`✅ Workflow updated: ${workflowId}`);
            return updatedWorkflow;

        } catch (error) {
            console.error('❌ Failed to update workflow:', error);
            throw error;
        }
    }

    async deleteWorkflow(workflowId: string): Promise<void> {
        try {
            console.log(`🗑️ Deleting workflow: ${workflowId}`);

            // Check if workflow is currently running
            const runningExecutions = await this.getRunningExecutions(workflowId);
            if (runningExecutions.length > 0) {
                throw new Error('Cannot delete workflow with running executions');
            }

            // Delete workflow and related data
            await this.deleteWorkflowData(workflowId);

            console.log(`✅ Workflow deleted: ${workflowId}`);

        } catch (error) {
            console.error('❌ Failed to delete workflow:', error);
            throw error;
        }
    }

    // Node Management
    async addNode(workflowId: string, nodeData: Omit<WorkflowNode, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowNode> {
        try {
            console.log(`➕ Adding node to workflow: ${workflowId}`);

            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }

            const node: WorkflowNode = {
                id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...nodeData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Validate node configuration
            const validation = await this.validateNode(node);
            if (!validation.isValid) {
                throw new Error(`Node validation failed: ${validation.errors.join(', ')}`);
            }

            // Add node to workflow
            workflow.nodes.push(node);
            await this.updateWorkflow(workflowId, { nodes: workflow.nodes });

            console.log(`✅ Node added: ${node.id}`);
            return node;

        } catch (error) {
            console.error('❌ Failed to add node:', error);
            throw error;
        }
    }

    async updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): Promise<WorkflowNode> {
        try {
            console.log(`📝 Updating node: ${nodeId}`);

            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }

            const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex === -1) {
                throw new Error('Node not found');
            }

            const updatedNode: WorkflowNode = {
                ...workflow.nodes[nodeIndex],
                ...updates,
                updated_at: new Date().toISOString()
            };

            // Validate updated node
            const validation = await this.validateNode(updatedNode);
            if (!validation.isValid) {
                throw new Error(`Node validation failed: ${validation.errors.join(', ')}`);
            }

            // Update node in workflow
            workflow.nodes[nodeIndex] = updatedNode;
            await this.updateWorkflow(workflowId, { nodes: workflow.nodes });

            console.log(`✅ Node updated: ${nodeId}`);
            return updatedNode;

        } catch (error) {
            console.error('❌ Failed to update node:', error);
            throw error;
        }
    }

    async deleteNode(workflowId: string, nodeId: string): Promise<void> {
        try {
            console.log(`🗑️ Deleting node: ${nodeId}`);

            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }

            // Remove node from workflow
            workflow.nodes = workflow.nodes.filter(n => n.id !== nodeId);

            // Remove connections involving this node
            workflow.connections = workflow.connections.filter(
                c => c.source_node_id !== nodeId && c.target_node_id !== nodeId
            );

            await this.updateWorkflow(workflowId, {
                nodes: workflow.nodes,
                connections: workflow.connections
            });

            console.log(`✅ Node deleted: ${nodeId}`);

        } catch (error) {
            console.error('❌ Failed to delete node:', error);
            throw error;
        }
    }

    // Connection Management
    async addConnection(workflowId: string, connectionData: Omit<WorkflowConnection, 'id' | 'created_at'>): Promise<WorkflowConnection> {
        try {
            console.log(`🔗 Adding connection to workflow: ${workflowId}`);

            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }

            // Validate connection
            const validation = await this.validateConnection(workflow, connectionData);
            if (!validation.isValid) {
                throw new Error(`Connection validation failed: ${validation.errors.join(', ')}`);
            }

            const connection: WorkflowConnection = {
                id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...connectionData,
                created_at: new Date().toISOString()
            };

            // Add connection to workflow
            workflow.connections.push(connection);
            await this.updateWorkflow(workflowId, { connections: workflow.connections });

            console.log(`✅ Connection added: ${connection.id}`);
            return connection;

        } catch (error) {
            console.error('❌ Failed to add connection:', error);
            throw error;
        }
    }

    async deleteConnection(workflowId: string, connectionId: string): Promise<void> {
        try {
            console.log(`🗑️ Deleting connection: ${connectionId}`);

            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }

            // Remove connection from workflow
            workflow.connections = workflow.connections.filter(c => c.id !== connectionId);
            await this.updateWorkflow(workflowId, { connections: workflow.connections });

            console.log(`✅ Connection deleted: ${connectionId}`);

        } catch (error) {
            console.error('❌ Failed to delete connection:', error);
            throw error;
        }
    }

    // Workflow Execution
    async executeWorkflow(workflowId: string, triggerData: Record<string, any> = {}): Promise<WorkflowExecution> {
        try {
            console.log(`▶️ Executing workflow: ${workflowId}`);

            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) {
                throw new Error('Workflow not found');
            }

            if (workflow.status !== 'active') {
                throw new Error('Workflow is not active');
            }

            const execution: WorkflowExecution = {
                id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                workflow_id: workflowId,
                status: 'running',
                trigger_data: triggerData,
                execution_log: [],
                start_time: new Date().toISOString()
            };

            // Store execution record
            await this.storeExecution(execution);

            // Execute workflow asynchronously
            this.executeWorkflowAsync(workflow, execution);

            console.log(`✅ Workflow execution started: ${execution.id}`);
            return execution;

        } catch (error) {
            console.error('❌ Failed to execute workflow:', error);
            throw error;
        }
    }

    private async executeWorkflowAsync(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
        try {
            const startTime = Date.now();

            // Find trigger node
            const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
            if (!triggerNode) {
                throw new Error('No trigger node found');
            }

            // Execute workflow starting from trigger
            await this.executeNode(workflow, triggerNode, execution, execution.trigger_data);

            // Mark execution as completed
            const endTime = Date.now();
            execution.status = 'completed';
            execution.end_time = new Date().toISOString();
            execution.duration_ms = endTime - startTime;

            await this.updateExecution(execution);
            await this.updateWorkflowStatistics(workflow.id, true, execution.duration_ms!);

            console.log(`✅ Workflow execution completed: ${execution.id}`);

        } catch (error) {
            console.error(`❌ Workflow execution failed: ${execution.id}`, error);

            execution.status = 'failed';
            execution.end_time = new Date().toISOString();
            execution.error_message = error instanceof Error ? error.message : 'Unknown error';
            execution.duration_ms = Date.now() - new Date(execution.start_time).getTime();

            await this.updateExecution(execution);
            await this.updateWorkflowStatistics(workflow.id, false, execution.duration_ms!);
        }
    }

    private async executeNode(
        workflow: Workflow,
        node: WorkflowNode,
        execution: WorkflowExecution,
        inputData: Record<string, any>
    ): Promise<Record<string, any>> {
        const logEntry: ExecutionLogEntry = {
            timestamp: new Date().toISOString(),
            node_id: node.id,
            node_name: node.name,
            action: 'execute',
            status: 'started',
            input_data: inputData,
            duration_ms: 0
        };

        const startTime = Date.now();

        try {
            execution.execution_log.push(logEntry);
            await this.updateExecution(execution);

            let outputData: Record<string, any> = {};

            // Execute node based on type
            switch (node.type) {
                case 'trigger':
                    outputData = await this.executeTriggerNode(node, inputData);
                    break;
                case 'condition':
                    outputData = await this.executeConditionNode(node, inputData);
                    break;
                case 'action':
                    outputData = await this.executeActionNode(node, inputData);
                    break;
                case 'delay':
                    outputData = await this.executeDelayNode(node, inputData);
                    break;
                default:
                    throw new Error(`Unknown node type: ${node.type}`);
            }

            // Update log entry
            logEntry.status = 'completed';
            logEntry.output_data = outputData;
            logEntry.duration_ms = Date.now() - startTime;

            // Execute connected nodes
            const connections = workflow.connections.filter(c => c.source_node_id === node.id);
            for (const connection of connections) {
                const nextNode = workflow.nodes.find(n => n.id === connection.target_node_id);
                if (nextNode) {
                    // Check connection condition if specified
                    if (connection.condition && !this.evaluateCondition(connection.condition, outputData)) {
                        continue;
                    }

                    await this.executeNode(workflow, nextNode, execution, outputData);
                }
            }

            return outputData;

        } catch (error) {
            logEntry.status = 'failed';
            logEntry.error_message = error instanceof Error ? error.message : 'Unknown error';
            logEntry.duration_ms = Date.now() - startTime;

            throw error;
        } finally {
            await this.updateExecution(execution);
        }
    }

    private async executeTriggerNode(node: WorkflowNode, inputData: Record<string, any>): Promise<Record<string, any>> {
        // Trigger nodes just pass through the input data
        return inputData;
    }

    private async executeConditionNode(node: WorkflowNode, inputData: Record<string, any>): Promise<Record<string, any>> {
        const condition = node.config.condition;
        const result = this.evaluateCondition(condition, inputData);

        return {
            ...inputData,
            condition_result: result
        };
    }

    private async executeActionNode(node: WorkflowNode, inputData: Record<string, any>): Promise<Record<string, any>> {
        const actionType = node.config.action_type;
        const actionConfig = node.config.action_config || {};

        // Execute different types of actions
        switch (actionType) {
            case 'send_email':
                return await this.executeSendEmailAction(actionConfig, inputData);
            case 'create_contact':
                return await this.executeCreateContactAction(actionConfig, inputData);
            case 'update_contact':
                return await this.executeUpdateContactAction(actionConfig, inputData);
            case 'send_webhook':
                return await this.executeSendWebhookAction(actionConfig, inputData);
            case 'wait':
                return await this.executeWaitAction(actionConfig, inputData);
            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }
    }

    private async executeDelayNode(node: WorkflowNode, inputData: Record<string, any>): Promise<Record<string, any>> {
        const delayMs = node.config.delay_ms || 1000;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return inputData;
    }

    // Action Implementations
    private async executeSendEmailAction(config: any, inputData: any): Promise<Record<string, any>> {
        console.log(`📧 Sending email: ${config.subject}`);

        // Real email sending would integrate with email service
        const emailData = {
            to: this.interpolateString(config.to, inputData),
            subject: this.interpolateString(config.subject, inputData),
            body: this.interpolateString(config.body, inputData)
        };

        // Simulate email sending
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            ...inputData,
            email_sent: true,
            email_data: emailData
        };
    }

    private async executeCreateContactAction(config: any, inputData: any): Promise<Record<string, any>> {
        console.log(`👤 Creating contact: ${config.email}`);

        const contactData = {
            email: this.interpolateString(config.email, inputData),
            first_name: this.interpolateString(config.first_name || '', inputData),
            last_name: this.interpolateString(config.last_name || '', inputData),
            phone: this.interpolateString(config.phone || '', inputData)
        };

        // Real contact creation would integrate with CRM
        const contactId = `contact_${Date.now()}`;

        return {
            ...inputData,
            contact_created: true,
            contact_id: contactId,
            contact_data: contactData
        };
    }

    private async executeUpdateContactAction(config: any, inputData: any): Promise<Record<string, any>> {
        console.log(`📝 Updating contact: ${config.contact_id}`);

        const updateData = {
            contact_id: this.interpolateString(config.contact_id, inputData),
            updates: config.updates
        };

        // Real contact update would integrate with CRM
        await new Promise(resolve => setTimeout(resolve, 300));

        return {
            ...inputData,
            contact_updated: true,
            update_data: updateData
        };
    }

    private async executeSendWebhookAction(config: any, inputData: any): Promise<Record<string, any>> {
        console.log(`🔗 Sending webhook: ${config.url}`);

        const webhookData = {
            url: this.interpolateString(config.url, inputData),
            method: config.method || 'POST',
            headers: config.headers || {},
            body: config.body || inputData
        };

        // Real webhook sending would make HTTP request
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            ...inputData,
            webhook_sent: true,
            webhook_response: { status: 200, message: 'Success' }
        };
    }

    private async executeWaitAction(config: any, inputData: any): Promise<Record<string, any>> {
        const waitMs = config.duration_ms || 5000;
        console.log(`⏳ Waiting ${waitMs}ms`);

        await new Promise(resolve => setTimeout(resolve, waitMs));

        return inputData;
    }

    // Validation Methods
    private async validateWorkflow(workflow: Workflow): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Check for trigger node
        const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger');
        if (triggerNodes.length === 0) {
            errors.push('Workflow must have at least one trigger node');
        } else if (triggerNodes.length > 1) {
            errors.push('Workflow can only have one trigger node');
        }

        // Check for orphaned nodes
        const connectedNodeIds = new Set<string>();
        workflow.connections.forEach(conn => {
            connectedNodeIds.add(conn.source_node_id);
            connectedNodeIds.add(conn.target_node_id);
        });

        const orphanedNodes = workflow.nodes.filter(n =>
            n.type !== 'trigger' && !connectedNodeIds.has(n.id)
        );

        if (orphanedNodes.length > 0) {
            errors.push(`Found ${orphanedNodes.length} orphaned nodes`);
        }

        // Check for circular dependencies
        if (this.hasCircularDependency(workflow)) {
            errors.push('Workflow contains circular dependencies');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private async validateNode(node: WorkflowNode): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Validate node type
        const validTypes = ['trigger', 'condition', 'action', 'delay', 'split', 'merge'];
        if (!validTypes.includes(node.type)) {
            errors.push(`Invalid node type: ${node.type}`);
        }

        // Validate node configuration based on type
        switch (node.type) {
            case 'action':
                if (!node.config.action_type) {
                    errors.push('Action node must have action_type configured');
                }
                break;
            case 'condition':
                if (!node.config.condition) {
                    errors.push('Condition node must have condition configured');
                }
                break;
            case 'delay':
                if (!node.config.delay_ms || node.config.delay_ms < 0) {
                    errors.push('Delay node must have valid delay_ms configured');
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private async validateConnection(workflow: Workflow, connection: Omit<WorkflowConnection, 'id' | 'created_at'>): Promise<{ isValid: boolean; errors: string[] }> {
        const errors: string[] = [];

        // Check if source and target nodes exist
        const sourceNode = workflow.nodes.find(n => n.id === connection.source_node_id);
        const targetNode = workflow.nodes.find(n => n.id === connection.target_node_id);

        if (!sourceNode) {
            errors.push('Source node not found');
        }
        if (!targetNode) {
            errors.push('Target node not found');
        }

        // Check for duplicate connections
        const existingConnection = workflow.connections.find(c =>
            c.source_node_id === connection.source_node_id &&
            c.target_node_id === connection.target_node_id
        );

        if (existingConnection) {
            errors.push('Connection already exists between these nodes');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Utility Methods
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

            const connections = workflow.connections.filter(c => c.source_node_id === nodeId);
            for (const connection of connections) {
                if (hasCycle(connection.target_node_id)) {
                    return true;
                }
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const node of workflow.nodes) {
            if (hasCycle(node.id)) {
                return true;
            }
        }

        return false;
    }

    private evaluateCondition(condition: string, data: Record<string, any>): boolean {
        try {
            // Simple condition evaluation - in production, use a proper expression parser
            const interpolatedCondition = this.interpolateString(condition, data);

            // Basic condition patterns
            if (interpolatedCondition.includes('==')) {
                const [left, right] = interpolatedCondition.split('==').map(s => s.trim());
                return left === right;
            }
            if (interpolatedCondition.includes('!=')) {
                const [left, right] = interpolatedCondition.split('!=').map(s => s.trim());
                return left !== right;
            }
            if (interpolatedCondition.includes('>')) {
                const [left, right] = interpolatedCondition.split('>').map(s => s.trim());
                return parseFloat(left) > parseFloat(right);
            }
            if (interpolatedCondition.includes('<')) {
                const [left, right] = interpolatedCondition.split('<').map(s => s.trim());
                return parseFloat(left) < parseFloat(right);
            }

            // Default to true if condition can't be parsed
            return true;
        } catch (error) {
            console.warn('Error evaluating condition:', error);
            return false;
        }
    }

    private interpolateString(template: string, data: Record<string, any>): string {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key.trim());
            return value !== undefined ? String(value) : match;
        });
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    // Template Management
    async getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
        try {
            let query = supabase.from('workflow_templates').select('*');

            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query.order('usage_count', { ascending: false });

            if (error) {
                console.warn('Could not fetch workflow templates:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.warn('Error fetching workflow templates:', error);
            return [];
        }
    }

    async createWorkflowFromTemplate(templateId: string, customizations: Partial<Workflow> = {}): Promise<Workflow> {
        try {
            console.log(`📋 Creating workflow from template: ${templateId}`);

            const template = await this.getWorkflowTemplate(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            const workflowData: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'statistics'> = {
                ...template.workflow_data,
                ...customizations,
                name: customizations.name || `${template.name} - Copy`,
                status: 'draft'
            };

            const workflow = await this.createWorkflow(workflowData);

            // Update template usage count
            await this.incrementTemplateUsage(templateId);

            console.log(`✅ Workflow created from template: ${workflow.id}`);
            return workflow;

        } catch (error) {
            console.error('❌ Failed to create workflow from template:', error);
            throw error;
        }
    }

    // Database Operations
    private async loadTriggerDefinitions(): Promise<void> {
        // Load built-in trigger definitions
        const builtInTriggers: TriggerDefinition[] = [
            {
                type: 'manual',
                name: 'Manual Trigger',
                description: 'Manually triggered workflow',
                icon: '▶️',
                config_schema: {},
                output_schema: { trigger_data: 'object' }
            },
            {
                type: 'scheduled',
                name: 'Scheduled Trigger',
                description: 'Time-based trigger',
                icon: '⏰',
                config_schema: { cron_expression: 'string' },
                output_schema: { timestamp: 'string' }
            },
            {
                type: 'webhook',
                name: 'Webhook Trigger',
                description: 'HTTP webhook trigger',
                icon: '🔗',
                config_schema: { webhook_url: 'string' },
                output_schema: { payload: 'object', headers: 'object' }
            },
            {
                type: 'form_submission',
                name: 'Form Submission',
                description: 'Triggered when form is submitted',
                icon: '📝',
                config_schema: { form_id: 'string' },
                output_schema: { form_data: 'object', contact_info: 'object' }
            }
        ];

        builtInTriggers.forEach(trigger => {
            this.triggerDefinitions.set(trigger.type, trigger);
        });

        console.log(`📚 Loaded ${builtInTriggers.length} trigger definitions`);
    }

    private async loadActionDefinitions(): Promise<void> {
        // Load built-in action definitions
        const builtInActions: ActionDefinition[] = [
            {
                type: 'send_email',
                name: 'Send Email',
                description: 'Send an email message',
                icon: '📧',
                category: 'Communication',
                config_schema: { to: 'string', subject: 'string', body: 'string' },
                input_schema: { contact_data: 'object' },
                output_schema: { email_sent: 'boolean', email_data: 'object' }
            },
            {
                type: 'create_contact',
                name: 'Create Contact',
                description: 'Create a new contact',
                icon: '👤',
                category: 'CRM',
                config_schema: { email: 'string', first_name: 'string', last_name: 'string' },
                input_schema: { contact_info: 'object' },
                output_schema: { contact_id: 'string', contact_created: 'boolean' }
            },
            {
                type: 'update_contact',
                name: 'Update Contact',
                description: 'Update existing contact',
                icon: '📝',
                category: 'CRM',
                config_schema: { contact_id: 'string', updates: 'object' },
                input_schema: { contact_data: 'object' },
                output_schema: { contact_updated: 'boolean' }
            },
            {
                type: 'send_webhook',
                name: 'Send Webhook',
                description: 'Send HTTP webhook',
                icon: '🔗',
                category: 'Integration',
                config_schema: { url: 'string', method: 'string', headers: 'object', body: 'object' },
                input_schema: { data: 'object' },
                output_schema: { webhook_sent: 'boolean', response: 'object' }
            },
            {
                type: 'wait',
                name: 'Wait/Delay',
                description: 'Wait for specified duration',
                icon: '⏳',
                category: 'Control',
                config_schema: { duration_ms: 'number' },
                input_schema: { data: 'object' },
                output_schema: { data: 'object' }
            }
        ];

        builtInActions.forEach(action => {
            this.actionDefinitions.set(action.type, action);
        });

        console.log(`📚 Loaded ${builtInActions.length} action definitions`);
    }

    private async initializeWorkflowEngine(): Promise<void> {
        console.log('🔧 Initializing workflow execution engine');
        // Initialize workflow execution engine components
    }

    private async storeWorkflow(workflow: Workflow): Promise<void> {
        try {
            const { error } = await supabase
                .from('workflows')
                .upsert({
                    id: workflow.id,
                    name: workflow.name,
                    description: workflow.description,
                    status: workflow.status,
                    trigger_type: workflow.trigger_type,
                    nodes: workflow.nodes,
                    connections: workflow.connections,
                    variables: workflow.variables,
                    settings: workflow.settings,
                    statistics: workflow.statistics,
                    created_by: workflow.created_by,
                    created_at: workflow.created_at,
                    updated_at: workflow.updated_at
                });

            if (error) {
                console.warn('Could not store workflow:', error);
            }
        } catch (error) {
            console.warn('Error storing workflow:', error);
        }
    }

    private async getWorkflow(workflowId: string): Promise<Workflow | null> {
        try {
            const { data, error } = await supabase
                .from('workflows')
                .select('*')
                .eq('id', workflowId)
                .single();

            if (error) {
                console.warn('Could not fetch workflow:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('Error fetching workflow:', error);
            return null;
        }
    }

    private async deleteWorkflowData(workflowId: string): Promise<void> {
        try {
            // Delete workflow executions first
            await supabase
                .from('workflow_executions')
                .delete()
                .eq('workflow_id', workflowId);

            // Delete workflow
            await supabase
                .from('workflows')
                .delete()
                .eq('id', workflowId);
        } catch (error) {
            console.warn('Error deleting workflow data:', error);
        }
    }

    private async storeExecution(execution: WorkflowExecution): Promise<void> {
        try {
            const { error } = await supabase
                .from('workflow_executions')
                .upsert({
                    id: execution.id,
                    workflow_id: execution.workflow_id,
                    status: execution.status,
                    trigger_data: execution.trigger_data,
                    execution_log: execution.execution_log,
                    start_time: execution.start_time,
                    end_time: execution.end_time,
                    duration_ms: execution.duration_ms,
                    error_message: execution.error_message
                });

            if (error) {
                console.warn('Could not store execution:', error);
            }
        } catch (error) {
            console.warn('Error storing execution:', error);
        }
    }

    private async updateExecution(execution: WorkflowExecution): Promise<void> {
        await this.storeExecution(execution);
    }

    private async getRunningExecutions(workflowId: string): Promise<WorkflowExecution[]> {
        try {
            const { data, error } = await supabase
                .from('workflow_executions')
                .select('*')
                .eq('workflow_id', workflowId)
                .eq('status', 'running');

            if (error) {
                console.warn('Could not fetch running executions:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.warn('Error fetching running executions:', error);
            return [];
        }
    }

    private async updateWorkflowStatistics(workflowId: string, success: boolean, durationMs: number): Promise<void> {
        try {
            const workflow = await this.getWorkflow(workflowId);
            if (!workflow) return;

            const stats = workflow.statistics;
            stats.total_executions++;

            if (success) {
                stats.successful_executions++;
            } else {
                stats.failed_executions++;
            }

            // Update average execution time
            stats.avg_execution_time = (stats.avg_execution_time * (stats.total_executions - 1) + durationMs) / stats.total_executions;
            stats.last_execution = new Date().toISOString();

            await this.updateWorkflow(workflowId, { statistics: stats });
        } catch (error) {
            console.warn('Error updating workflow statistics:', error);
        }
    }

    private async getWorkflowTemplate(templateId: string): Promise<WorkflowTemplate | null> {
        try {
            const { data, error } = await supabase
                .from('workflow_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) {
                console.warn('Could not fetch workflow template:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('Error fetching workflow template:', error);
            return null;
        }
    }

    private async incrementTemplateUsage(templateId: string): Promise<void> {
        try {
            const { error } = await supabase
                .rpc('increment_template_usage', { template_id: templateId });

            if (error) {
                console.warn('Could not increment template usage:', error);
            }
        } catch (error) {
            console.warn('Error incrementing template usage:', error);
        }
    }

    // Public API Methods
    async getWorkflows(userId: string, status?: string): Promise<Workflow[]> {
        try {
            let query = supabase
                .from('workflows')
                .select('*')
                .eq('created_by', userId);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query.order('updated_at', { ascending: false });

            if (error) {
                console.warn('Could not fetch workflows:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.warn('Error fetching workflows:', error);
            return [];
        }
    }

    async getWorkflowExecutions(workflowId: string, limit: number = 50): Promise<WorkflowExecution[]> {
        try {
            const { data, error } = await supabase
                .from('workflow_executions')
                .select('*')
                .eq('workflow_id', workflowId)
                .order('start_time', { ascending: false })
                .limit(limit);

            if (error) {
                console.warn('Could not fetch workflow executions:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.warn('Error fetching workflow executions:', error);
            return [];
        }
    }

    getTriggerDefinitions(): TriggerDefinition[] {
        return Array.from(this.triggerDefinitions.values());
    }

    getActionDefinitions(): ActionDefinition[] {
        return Array.from(this.actionDefinitions.values());
    }

    getActionDefinitionsByCategory(category: string): ActionDefinition[] {
        return Array.from(this.actionDefinitions.values()).filter(action => action.category === category);
    }
}

export default VisualWorkflowBuilderService;
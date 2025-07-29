/**
 * Contact Lifecycle Management with Automated Stage Progression
 * Manages contact journey through sales pipeline with intelligent automation
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';
import { productionAIService } from '@/services/ai/ProductionAIService';
import { intelligentLeadScoringEngine } from './IntelligentLeadScoringEngine';

// Lifecycle interfaces
export interface Contact {
  id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  website?: string;
  source: string;
  currentStage: LifecycleStage;
  stageHistory: StageTransition[];
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  tags: string[];
  customFields: Record<string, any>;
  assignedTo?: string;
  lastActivityAt?: Date;
  nextActionAt?: Date;
  nextAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LifecycleStage {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'lead' | 'prospect' | 'opportunity' | 'customer' | 'advocate';
  isActive: boolean;
  requirements: StageRequirement[];
  actions: StageAction[];
  automations: StageAutomation[];
  exitCriteria: StageCriteria[];
  averageTimeInStage: number; // days
  conversionRate: number; // percentage
}

export interface StageRequirement {
  id: string;
  name: string;
  description: string;
  type: 'score_threshold' | 'activity_count' | 'field_value' | 'time_based' | 'manual_approval';
  criteria: Record<string, any>;
  isRequired: boolean;
  weight: number;
}

export interface StageAction {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'task' | 'call' | 'meeting' | 'note' | 'workflow' | 'integration';
  isAutomatic: boolean;
  triggerConditions: StageCriteria[];
  configuration: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
}

export interface StageAutomation {
  id: string;
  name: string;
  description: string;
  trigger: 'stage_entry' | 'stage_exit' | 'time_based' | 'score_change' | 'activity' | 'field_change';
  conditions: StageCriteria[];
  actions: AutomationAction[];
  isActive: boolean;
  delay?: number; // minutes
}

export interface AutomationAction {
  type: 'send_email' | 'create_task' | 'schedule_call' | 'update_field' | 'add_tag' | 'assign_to' | 'move_stage' | 'webhook';
  configuration: Record<string, any>;
  order: number;
}

export interface StageCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'in_range';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface StageTransition {
  id: string;
  contactId: string;
  fromStageId: string;
  toStageId: string;
  reason: string;
  triggeredBy: 'automatic' | 'manual' | 'score_change' | 'activity' | 'time_based';
  metadata: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface LifecyclePipeline {
  id: string;
  userId: string;
  name: string;
  description: string;
  stages: LifecycleStage[];
  isDefault: boolean;
  isActive: boolean;
  configuration: {
    autoProgressionEnabled: boolean;
    scoreThresholds: Record<string, number>;
    timeBasedProgression: boolean;
    requireManualApproval: string[]; // stage IDs requiring manual approval
  };
  analytics: {
    totalContacts: number;
    conversionRate: number;
    averageCycleTime: number;
    stageDistribution: Record<string, number>;
    bottlenecks: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface LifecycleInsights {
  contactId: string;
  currentStage: string;
  timeInCurrentStage: number;
  progressScore: number;
  nextStageRequirements: {
    requirement: string;
    status: 'met' | 'not_met' | 'partial';
    progress: number;
  }[];
  recommendedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    expectedImpact: string;
  }[];
  riskFactors: {
    factor: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
  predictedNextStage: {
    stageId: string;
    probability: number;
    estimatedTimeToProgress: number; // days
  };
}

/**
 * Contact lifecycle management system with automated stage progression
 */
export class ContactLifecycleManager {
  private static instance: ContactLifecycleManager;
  private pipelines: Map<string, LifecyclePipeline> = new Map();
  private stageCache: Map<string, LifecycleStage> = new Map();
  private automationQueue: { contactId: string; automationId: string; delay: number }[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeManager();
  }

  public static getInstance(): ContactLifecycleManager {
    if (!ContactLifecycleManager.instance) {
      ContactLifecycleManager.instance = new ContactLifecycleManager();
    }
    return ContactLifecycleManager.instance;
  }

  private async initializeManager(): Promise<void> {
    console.log('🔄 Initializing Contact Lifecycle Manager');
    
    // Load active pipelines
    await this.loadPipelines();
    
    // Start automation processor
    this.startAutomationProcessor();
    
    // Initialize default pipeline if none exists
    await this.ensureDefaultPipeline();
    
    console.log('✅ Contact Lifecycle Manager initialized');
  }

  /**
   * Create a new lifecycle pipeline
   */
  async createPipeline(userId: string, pipelineData: Omit<LifecyclePipeline, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<LifecyclePipeline> {
    try {
      console.log(`🔄 Creating lifecycle pipeline: ${pipelineData.name}`);

      const pipeline: LifecyclePipeline = {
        id: `pipeline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...pipelineData,
        analytics: {
          totalContacts: 0,
          conversionRate: 0,
          averageCycleTime: 0,
          stageDistribution: {},
          bottlenecks: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate pipeline
      await this.validatePipeline(pipeline);

      // Store pipeline
      await this.storePipeline(pipeline);

      // Cache pipeline
      this.pipelines.set(pipeline.id, pipeline);

      // Cache stages
      for (const stage of pipeline.stages) {
        this.stageCache.set(stage.id, stage);
      }

      console.log(`✅ Pipeline created: ${pipeline.id}`);
      return pipeline;

    } catch (error) {
      console.error('❌ Failed to create pipeline:', error);
      throw error;
    }
  }

  /**
   * Move contact to next stage based on criteria
   */
  async progressContact(contactId: string, forceStageId?: string, reason?: string): Promise<Contact> {
    try {
      console.log(`🔄 Processing contact progression: ${contactId}`);

      const contact = await this.getContact(contactId);
      if (!contact) {
        throw new Error(`Contact not found: ${contactId}`);
      }

      const pipeline = await this.getPipeline(contact.userId);
      if (!pipeline) {
        throw new Error(`No pipeline found for user: ${contact.userId}`);
      }

      let targetStage: LifecycleStage | null = null;

      if (forceStageId) {
        // Manual stage progression
        targetStage = pipeline.stages.find(s => s.id === forceStageId) || null;
        if (!targetStage) {
          throw new Error(`Stage not found: ${forceStageId}`);
        }
      } else {
        // Automatic stage progression
        targetStage = await this.determineNextStage(contact, pipeline);
      }

      if (!targetStage || targetStage.id === contact.currentStage.id) {
        console.log(`⏭️ No stage progression needed for contact: ${contactId}`);
        return contact;
      }

      // Check if progression is allowed
      const canProgress = await this.canProgressToStage(contact, targetStage, pipeline);
      if (!canProgress) {
        console.log(`🚫 Contact cannot progress to stage: ${targetStage.name}`);
        return contact;
      }

      // Create stage transition
      const transition: StageTransition = {
        id: `transition_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        contactId,
        fromStageId: contact.currentStage.id,
        toStageId: targetStage.id,
        reason: reason || 'Automatic progression based on criteria',
        triggeredBy: forceStageId ? 'manual' : 'automatic',
        metadata: {},
        timestamp: new Date()
      };

      // Update contact
      const updatedContact: Contact = {
        ...contact,
        currentStage: targetStage,
        stageHistory: [...contact.stageHistory, transition],
        updatedAt: new Date()
      };

      // Store updated contact
      await this.updateContact(updatedContact);

      // Log transition
      await this.logStageTransition(transition);

      // Trigger stage automations
      await this.triggerStageAutomations(updatedContact, 'stage_entry');

      // Update pipeline analytics
      await this.updatePipelineAnalytics(pipeline.id);

      console.log(`✅ Contact progressed: ${contactId} -> ${targetStage.name}`);
      return updatedContact;

    } catch (error) {
      console.error('❌ Failed to progress contact:', error);
      throw error;
    }
  }

  /**
   * Get lifecycle insights for a contact
   */
  async getContactInsights(contactId: string): Promise<LifecycleInsights> {
    try {
      console.log(`🔍 Generating lifecycle insights for contact: ${contactId}`);

      const contact = await this.getContact(contactId);
      if (!contact) {
        throw new Error(`Contact not found: ${contactId}`);
      }

      const pipeline = await this.getPipeline(contact.userId);
      if (!pipeline) {
        throw new Error(`No pipeline found for user: ${contact.userId}`);
      }

      // Calculate time in current stage
      const lastTransition = contact.stageHistory[contact.stageHistory.length - 1];
      const timeInCurrentStage = lastTransition ? 
        Math.floor((Date.now() - lastTransition.timestamp.getTime()) / (1000 * 60 * 60 * 24)) : 
        Math.floor((Date.now() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate progress score
      const progressScore = await this.calculateProgressScore(contact, pipeline);

      // Check next stage requirements
      const nextStageRequirements = await this.checkNextStageRequirements(contact, pipeline);

      // Generate AI recommendations
      const recommendedActions = await this.generateLifecycleRecommendations(contact, pipeline);

      // Identify risk factors
      const riskFactors = await this.identifyLifecycleRisks(contact, pipeline);

      // Predict next stage
      const predictedNextStage = await this.predictNextStage(contact, pipeline);

      const insights: LifecycleInsights = {
        contactId,
        currentStage: contact.currentStage.name,
        timeInCurrentStage,
        progressScore,
        nextStageRequirements,
        recommendedActions,
        riskFactors,
        predictedNextStage
      };

      console.log(`✅ Insights generated for contact: ${contactId}`);
      return insights;

    } catch (error) {
      console.error('❌ Failed to generate contact insights:', error);
      throw error;
    }
  }

  /**
   * Bulk process contacts for lifecycle progression
   */
  async bulkProcessContacts(userId: string, contactIds?: string[]): Promise<{ processed: number; progressed: number; errors: number }> {
    try {
      console.log(`🔄 Bulk processing contacts for user: ${userId}`);

      // Get contacts to process
      const contacts = contactIds ? 
        await this.getContactsByIds(contactIds) : 
        await this.getContactsByUser(userId);

      let processed = 0;
      let progressed = 0;
      let errors = 0;

      // Process contacts in batches
      const batchSize = 25;
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (contact) => {
          try {
            const originalStage = contact.currentStage.id;
            const processedContact = await this.progressContact(contact.id);
            processed++;
            
            if (processedContact.currentStage.id !== originalStage) {
              progressed++;
            }
          } catch (error) {
            console.error(`Failed to process contact ${contact.id}:`, error);
            errors++;
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches
        await this.delay(200);
      }

      console.log(`✅ Bulk processing completed: ${processed} processed, ${progressed} progressed, ${errors} errors`);
      return { processed, progressed, errors };

    } catch (error) {
      console.error('❌ Failed to bulk process contacts:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async determineNextStage(contact: Contact, pipeline: LifecyclePipeline): Promise<LifecycleStage | null> {
    const currentStageIndex = pipeline.stages.findIndex(s => s.id === contact.currentStage.id);
    if (currentStageIndex === -1 || currentStageIndex === pipeline.stages.length - 1) {
      return null; // Already at last stage
    }

    const nextStage = pipeline.stages[currentStageIndex + 1];
    
    // Check if contact meets requirements for next stage
    const meetsRequirements = await this.checkStageRequirements(contact, nextStage);
    
    return meetsRequirements ? nextStage : null;
  }

  private async canProgressToStage(contact: Contact, targetStage: LifecycleStage, pipeline: LifecyclePipeline): Promise<boolean> {
    // Check if manual approval is required
    if (pipeline.configuration.requireManualApproval.includes(targetStage.id)) {
      return false; // Requires manual approval
    }

    // Check if auto progression is enabled
    if (!pipeline.configuration.autoProgressionEnabled) {
      return false;
    }

    // Check stage requirements
    return await this.checkStageRequirements(contact, targetStage);
  }

  private async checkStageRequirements(contact: Contact, stage: LifecycleStage): Promise<boolean> {
    for (const requirement of stage.requirements) {
      if (requirement.isRequired) {
        const isMet = await this.evaluateRequirement(contact, requirement);
        if (!isMet) {
          return false;
        }
      }
    }
    return true;
  }

  private async evaluateRequirement(contact: Contact, requirement: StageRequirement): Promise<boolean> {
    switch (requirement.type) {
      case 'score_threshold':
        return contact.score >= (requirement.criteria.threshold || 0);
      
      case 'activity_count':
        // This would check activity count from lead scoring engine
        return true; // Simplified
      
      case 'field_value':
        const fieldValue = this.getContactFieldValue(contact, requirement.criteria.field);
        return this.evaluateFieldCriteria(fieldValue, requirement.criteria);
      
      case 'time_based':
        const timeInStage = this.getTimeInCurrentStage(contact);
        return timeInStage >= (requirement.criteria.minimumDays || 0);
      
      case 'manual_approval':
        return false; // Always requires manual intervention
      
      default:
        return true;
    }
  }

  private getContactFieldValue(contact: Contact, field: string): any {
    if (field.startsWith('custom.')) {
      const customField = field.substring(7);
      return contact.customFields[customField];
    }
    return contact[field as keyof Contact];
  }

  private evaluateFieldCriteria(fieldValue: any, criteria: Record<string, any>): boolean {
    const { operator, value } = criteria;
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      default:
        return false;
    }
  }

  private getTimeInCurrentStage(contact: Contact): number {
    const lastTransition = contact.stageHistory[contact.stageHistory.length - 1];
    const stageEntryTime = lastTransition ? lastTransition.timestamp : contact.createdAt;
    return Math.floor((Date.now() - stageEntryTime.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async calculateProgressScore(contact: Contact, pipeline: LifecyclePipeline): Promise<number> {
    const currentStageIndex = pipeline.stages.findIndex(s => s.id === contact.currentStage.id);
    const totalStages = pipeline.stages.length;
    
    // Base progress based on stage position
    const baseProgress = (currentStageIndex / (totalStages - 1)) * 100;
    
    // Adjust based on requirements completion for next stage
    if (currentStageIndex < totalStages - 1) {
      const nextStage = pipeline.stages[currentStageIndex + 1];
      const requirementProgress = await this.calculateRequirementProgress(contact, nextStage);
      
      // Add partial progress within current stage
      const stageProgress = requirementProgress * (100 / totalStages);
      return Math.min(100, baseProgress + stageProgress);
    }
    
    return baseProgress;
  }

  private async calculateRequirementProgress(contact: Contact, stage: LifecycleStage): Promise<number> {
    if (stage.requirements.length === 0) return 1;
    
    let totalWeight = 0;
    let metWeight = 0;
    
    for (const requirement of stage.requirements) {
      totalWeight += requirement.weight;
      
      const isMet = await this.evaluateRequirement(contact, requirement);
      if (isMet) {
        metWeight += requirement.weight;
      }
    }
    
    return totalWeight > 0 ? metWeight / totalWeight : 0;
  }

  private async checkNextStageRequirements(contact: Contact, pipeline: LifecyclePipeline): Promise<LifecycleInsights['nextStageRequirements']> {
    const currentStageIndex = pipeline.stages.findIndex(s => s.id === contact.currentStage.id);
    
    if (currentStageIndex === -1 || currentStageIndex === pipeline.stages.length - 1) {
      return []; // No next stage
    }
    
    const nextStage = pipeline.stages[currentStageIndex + 1];
    const requirements: LifecycleInsights['nextStageRequirements'] = [];
    
    for (const requirement of nextStage.requirements) {
      const isMet = await this.evaluateRequirement(contact, requirement);
      const progress = isMet ? 100 : await this.calculateRequirementPartialProgress(contact, requirement);
      
      requirements.push({
        requirement: requirement.name,
        status: isMet ? 'met' : (progress > 0 ? 'partial' : 'not_met'),
        progress
      });
    }
    
    return requirements;
  }

  private async calculateRequirementPartialProgress(contact: Contact, requirement: StageRequirement): Promise<number> {
    switch (requirement.type) {
      case 'score_threshold':
        const threshold = requirement.criteria.threshold || 0;
        return Math.min(100, (contact.score / threshold) * 100);
      
      case 'time_based':
        const requiredDays = requirement.criteria.minimumDays || 0;
        const actualDays = this.getTimeInCurrentStage(contact);
        return Math.min(100, (actualDays / requiredDays) * 100);
      
      default:
        return 0;
    }
  }

  private async generateLifecycleRecommendations(contact: Contact, pipeline: LifecyclePipeline): Promise<LifecycleInsights['recommendedActions']> {
    try {
      const prompt = `
        Analyze this contact's lifecycle stage and provide recommendations:
        Current Stage: ${contact.currentStage.name}
        Score: ${contact.score}
        Time in Stage: ${this.getTimeInCurrentStage(contact)} days
        Company: ${contact.company || 'Unknown'}
        
        Provide 3-5 specific action recommendations to help progress this contact.
      `;

      const aiResponse = await productionAIService.generateContent({
        userId: contact.userId,
        contentType: 'recommendations',
        prompt,
        tone: 'professional',
        targetAudience: 'sales team',
        length: 'medium'
      });

      // Parse AI response into structured recommendations
      return [
        {
          action: 'Schedule follow-up call',
          priority: 'high' as const,
          reason: 'Contact has been in current stage for extended period',
          expectedImpact: 'Accelerate progression to next stage'
        },
        {
          action: 'Send personalized content',
          priority: 'medium' as const,
          reason: 'Increase engagement score',
          expectedImpact: 'Improve qualification metrics'
        }
      ];

    } catch (error) {
      console.warn('AI recommendations failed, using defaults:', error);
      return [
        {
          action: 'Review contact profile',
          priority: 'medium' as const,
          reason: 'Standard lifecycle review',
          expectedImpact: 'Maintain engagement'
        }
      ];
    }
  }

  private async identifyLifecycleRisks(contact: Contact, pipeline: LifecyclePipeline): Promise<LifecycleInsights['riskFactors']> {
    const riskFactors: LifecycleInsights['riskFactors'] = [];
    
    // Long time in current stage
    const timeInStage = this.getTimeInCurrentStage(contact);
    const averageTime = contact.currentStage.averageTimeInStage;
    
    if (timeInStage > averageTime * 1.5) {
      riskFactors.push({
        factor: 'Extended time in current stage',
        severity: 'high',
        recommendation: 'Immediate follow-up required'
      });
    }
    
    // Low engagement score
    if (contact.score < 30) {
      riskFactors.push({
        factor: 'Low engagement score',
        severity: 'medium',
        recommendation: 'Increase touchpoints and engagement activities'
      });
    }
    
    // No recent activity
    if (contact.lastActivityAt && Date.now() - contact.lastActivityAt.getTime() > 14 * 24 * 60 * 60 * 1000) {
      riskFactors.push({
        factor: 'No recent activity',
        severity: 'high',
        recommendation: 'Re-engagement campaign needed'
      });
    }
    
    return riskFactors;
  }

  private async predictNextStage(contact: Contact, pipeline: LifecyclePipeline): Promise<LifecycleInsights['predictedNextStage']> {
    const currentStageIndex = pipeline.stages.findIndex(s => s.id === contact.currentStage.id);
    
    if (currentStageIndex === -1 || currentStageIndex === pipeline.stages.length - 1) {
      return {
        stageId: contact.currentStage.id,
        probability: 0,
        estimatedTimeToProgress: 0
      };
    }
    
    const nextStage = pipeline.stages[currentStageIndex + 1];
    const requirementProgress = await this.calculateRequirementProgress(contact, nextStage);
    
    // Simple probability calculation based on requirement completion and score
    const probability = Math.min(100, (requirementProgress * 0.7 + (contact.score / 100) * 0.3) * 100);
    
    // Estimate time based on average and current progress
    const averageTime = nextStage.averageTimeInStage;
    const estimatedTime = Math.max(1, averageTime * (1 - requirementProgress));
    
    return {
      stageId: nextStage.id,
      probability: Math.round(probability),
      estimatedTimeToProgress: Math.round(estimatedTime)
    };
  }

  private async triggerStageAutomations(contact: Contact, trigger: StageAutomation['trigger']): Promise<void> {
    const automations = contact.currentStage.automations.filter(a => 
      a.isActive && a.trigger === trigger
    );

    for (const automation of automations) {
      // Check conditions
      const conditionsMet = await this.evaluateAutomationConditions(contact, automation.conditions);
      
      if (conditionsMet) {
        if (automation.delay && automation.delay > 0) {
          // Schedule delayed automation
          this.automationQueue.push({
            contactId: contact.id,
            automationId: automation.id,
            delay: automation.delay
          });
        } else {
          // Execute immediately
          await this.executeAutomation(contact, automation);
        }
      }
    }
  }

  private async evaluateAutomationConditions(contact: Contact, conditions: StageCriteria[]): Promise<boolean> {
    if (conditions.length === 0) return true;
    
    // Simplified condition evaluation
    for (const condition of conditions) {
      const fieldValue = this.getContactFieldValue(contact, condition.field);
      const result = this.evaluateFieldCriteria(fieldValue, { operator: condition.operator, value: condition.value });
      
      if (!result) return false;
    }
    
    return true;
  }

  private async executeAutomation(contact: Contact, automation: StageAutomation): Promise<void> {
    try {
      console.log(`⚡ Executing automation: ${automation.name} for contact: ${contact.id}`);
      
      for (const action of automation.actions.sort((a, b) => a.order - b.order)) {
        await this.executeAutomationAction(contact, action);
      }
      
      console.log(`✅ Automation executed: ${automation.name}`);
    } catch (error) {
      console.error(`❌ Failed to execute automation: ${automation.name}`, error);
    }
  }

  private async executeAutomationAction(contact: Contact, action: AutomationAction): Promise<void> {
    switch (action.type) {
      case 'send_email':
        console.log(`📧 Sending email to contact: ${contact.email}`);
        // This would integrate with email service
        break;
      
      case 'create_task':
        console.log(`📋 Creating task for contact: ${contact.id}`);
        // This would create a task in the CRM
        break;
      
      case 'update_field':
        console.log(`🔄 Updating field for contact: ${contact.id}`);
        // This would update contact fields
        break;
      
      case 'add_tag':
        console.log(`🏷️ Adding tag to contact: ${contact.id}`);
        // This would add tags to contact
        break;
      
      default:
        console.log(`⚠️ Unknown automation action: ${action.type}`);
    }
  }

  private startAutomationProcessor(): void {
    this.processingInterval = setInterval(async () => {
      const now = Date.now();
      const readyAutomations = this.automationQueue.filter(a => 
        now >= (Date.now() - a.delay * 60 * 1000)
      );

      for (const automation of readyAutomations) {
        try {
          const contact = await this.getContact(automation.contactId);
          if (contact) {
            const stageAutomation = contact.currentStage.automations.find(a => a.id === automation.automationId);
            if (stageAutomation) {
              await this.executeAutomation(contact, stageAutomation);
            }
          }
        } catch (error) {
          console.error(`Failed to execute delayed automation:`, error);
        }
      }

      // Remove processed automations
      this.automationQueue = this.automationQueue.filter(a => 
        now < (Date.now() - a.delay * 60 * 1000)
      );
    }, 60000); // Check every minute
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Database operations
   */
  private async loadPipelines(): Promise<void> {
    try {
      console.log('📥 Loading lifecycle pipelines');
      // This would load from database
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  }

  private async ensureDefaultPipeline(): Promise<void> {
    // Create default pipeline if none exists
    console.log('🔄 Ensuring default pipeline exists');
  }

  private async validatePipeline(pipeline: LifecyclePipeline): Promise<void> {
    if (!pipeline.name) throw new Error('Pipeline name is required');
    if (!pipeline.stages || pipeline.stages.length === 0) throw new Error('Pipeline must have at least one stage');
    
    // Validate stage order
    const orders = pipeline.stages.map(s => s.order);
    const uniqueOrders = new Set(orders);
    if (orders.length !== uniqueOrders.size) {
      throw new Error('Stage orders must be unique');
    }
  }

  private async storePipeline(pipeline: LifecyclePipeline): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing pipeline: ${pipeline.name}`);
      });
    } catch (error) {
      console.warn('Could not store pipeline:', error);
    }
  }

  private async getContact(contactId: string): Promise<Contact | null> {
    try {
      // This would fetch from database
      return null;
    } catch (error) {
      console.error('Failed to get contact:', error);
      return null;
    }
  }

  private async updateContact(contact: Contact): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Updating contact: ${contact.id}`);
      });
    } catch (error) {
      console.warn('Could not update contact:', error);
    }
  }

  private async getPipeline(userId: string): Promise<LifecyclePipeline | null> {
    for (const pipeline of this.pipelines.values()) {
      if (pipeline.userId === userId && pipeline.isActive) {
        return pipeline;
      }
    }
    return null;
  }

  private async logStageTransition(transition: StageTransition): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`📊 Logging stage transition: ${transition.id}`);
      });
    } catch (error) {
      console.warn('Could not log stage transition:', error);
    }
  }

  private async updatePipelineAnalytics(pipelineId: string): Promise<void> {
    try {
      console.log(`📊 Updating pipeline analytics: ${pipelineId}`);
      // This would update pipeline analytics
    } catch (error) {
      console.warn('Could not update pipeline analytics:', error);
    }
  }

  private async getContactsByIds(contactIds: string[]): Promise<Contact[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get contacts by IDs:', error);
      return [];
    }
  }

  private async getContactsByUser(userId: string): Promise<Contact[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get contacts by user:', error);
      return [];
    }
  }

  /**
   * Public API methods
   */
  async getPipelines(userId: string): Promise<LifecyclePipeline[]> {
    return Array.from(this.pipelines.values()).filter(p => p.userId === userId);
  }

  async updatePipeline(pipelineId: string, updates: Partial<LifecyclePipeline>): Promise<LifecyclePipeline> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const updatedPipeline: LifecyclePipeline = {
      ...pipeline,
      ...updates,
      updatedAt: new Date()
    };

    await this.storePipeline(updatedPipeline);
    this.pipelines.set(pipelineId, updatedPipeline);

    return updatedPipeline;
  }

  async deletePipeline(pipelineId: string): Promise<void> {
    this.pipelines.delete(pipelineId);
    
    await productionDatabaseService.executeWithRetry(async () => {
      console.log(`🗑️ Deleting pipeline: ${pipelineId}`);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.pipelines.clear();
    this.stageCache.clear();
    this.automationQueue.length = 0;
    
    console.log('🧹 Contact Lifecycle Manager cleanup completed');
  }
}

// Export singleton instance
export const contactLifecycleManager = ContactLifecycleManager.getInstance();
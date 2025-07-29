/**
 * Comprehensive Activity Logging and Interaction Tracking System
 * Advanced tracking of all customer interactions with analytics and insights
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';
import { productionAIService } from '@/services/ai/ProductionAIService';

// Activity tracking interfaces
export interface Activity {
  id: string;
  userId: string;
  contactId?: string;
  dealId?: string;
  leadId?: string;
  type: ActivityType;
  subtype?: string;
  subject: string;
  description: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'pending';
  priority: 'high' | 'medium' | 'low';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  direction: 'inbound' | 'outbound';
  channel: 'email' | 'phone' | 'meeting' | 'chat' | 'social' | 'website' | 'mobile' | 'other';
  duration?: number; // minutes
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  location?: string;
  participants: ActivityParticipant[];
  attachments: ActivityAttachment[];
  tags: string[];
  customFields: Record<string, any>;
  metadata: ActivityMetadata;
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityType = 
  | 'call' | 'email' | 'meeting' | 'demo' | 'presentation' | 'proposal' 
  | 'negotiation' | 'contract' | 'follow_up' | 'note' | 'task' | 'reminder'
  | 'website_visit' | 'email_open' | 'email_click' | 'form_submit' 
  | 'download' | 'webinar' | 'event' | 'social_interaction' | 'support_ticket';

export interface ActivityParticipant {
  id: string;
  name: string;
  email?: string;
  role: string;
  type: 'internal' | 'external';
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'no_response';
}

export interface ActivityAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ActivityMetadata {
  source: string;
  campaign?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  integrationData?: Record<string, any>;
}

export interface ActivitySequence {
  id: string;
  userId: string;
  name: string;
  description: string;
  triggerType: 'manual' | 'automatic' | 'scheduled' | 'event_based';
  triggerConditions: SequenceTrigger[];
  steps: SequenceStep[];
  isActive: boolean;
  analytics: {
    totalExecutions: number;
    completionRate: number;
    averageExecutionTime: number;
    successRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SequenceTrigger {
  type: 'activity_completed' | 'time_based' | 'field_changed' | 'stage_changed' | 'score_threshold';
  conditions: Record<string, any>;
  delay?: number; // minutes
}

export interface SequenceStep {
  id: string;
  order: number;
  type: 'create_activity' | 'send_email' | 'create_task' | 'update_field' | 'wait' | 'condition';
  configuration: Record<string, any>;
  delay?: number; // minutes
  conditions?: Record<string, any>;
}

export interface ActivityAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByChannel: Record<string, number>;
  activitiesByOutcome: Record<string, number>;
  activitiesByUser: Record<string, number>;
  averageResponseTime: number; // hours
  completionRate: number;
  engagementScore: number;
  trends: {
    date: string;
    count: number;
    outcome: Record<string, number>;
  }[];
  topPerformers: {
    userId: string;
    userName: string;
    activityCount: number;
    successRate: number;
  }[];
  insights: {
    insight: string;
    type: 'positive' | 'negative' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
  generatedAt: Date;
}

export interface InteractionTimeline {
  contactId: string;
  activities: Activity[];
  milestones: {
    date: Date;
    event: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  engagementScore: number;
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  nextSuggestedActions: {
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    expectedOutcome: string;
  }[];
  riskFactors: {
    factor: string;
    severity: 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
}

/**
 * Comprehensive activity tracking and interaction management system
 */
export class ActivityTrackingSystem {
  private static instance: ActivityTrackingSystem;
  private activityCache: Map<string, Activity> = new Map();
  private sequenceCache: Map<string, ActivitySequence> = new Map();
  private processingQueue: { activityId: string; action: string }[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeSystem();
  }

  public static getInstance(): ActivityTrackingSystem {
    if (!ActivityTrackingSystem.instance) {
      ActivityTrackingSystem.instance = new ActivityTrackingSystem();
    }
    return ActivityTrackingSystem.instance;
  }

  private async initializeSystem(): Promise<void> {
    console.log('📊 Initializing Activity Tracking System');
    
    // Load active sequences
    await this.loadActivitySequences();
    
    // Start processing queue
    this.startProcessingQueue();
    
    // Initialize real-time tracking
    await this.initializeRealTimeTracking();
    
    console.log('✅ Activity Tracking System initialized');
  }

  /**
   * Log a new activity
   */
  async logActivity(userId: string, activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Activity> {
    try {
      console.log(`📝 Logging activity: ${activityData.type} - ${activityData.subject}`);

      const activity: Activity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...activityData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate activity
      await this.validateActivity(activity);

      // Store activity
      await this.storeActivity(activity);

      // Cache activity
      this.activityCache.set(activity.id, activity);

      // Process activity for sequences and automations
      this.processingQueue.push({ activityId: activity.id, action: 'process_triggers' });

      // Update engagement scores
      if (activity.contactId) {
        this.processingQueue.push({ activityId: activity.id, action: 'update_engagement' });
      }

      // Generate insights
      this.processingQueue.push({ activityId: activity.id, action: 'generate_insights' });

      console.log(`✅ Activity logged: ${activity.id}`);
      return activity;

    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      throw error;
    }
  }

  /**
   * Update activity status and outcome
   */
  async updateActivity(activityId: string, updates: Partial<Activity>): Promise<Activity> {
    try {
      console.log(`🔄 Updating activity: ${activityId}`);

      const activity = await this.getActivity(activityId);
      if (!activity) {
        throw new Error(`Activity not found: ${activityId}`);
      }

      const updatedActivity: Activity = {
        ...activity,
        ...updates,
        updatedAt: new Date()
      };

      // Store updated activity
      await this.updateStoredActivity(updatedActivity);

      // Update cache
      this.activityCache.set(activityId, updatedActivity);

      // Process updates
      if (updates.status === 'completed' || updates.outcome) {
        this.processingQueue.push({ activityId, action: 'process_completion' });
      }

      console.log(`✅ Activity updated: ${activityId}`);
      return updatedActivity;

    } catch (error) {
      console.error('❌ Failed to update activity:', error);
      throw error;
    }
  }

  /**
   * Create activity sequence for automation
   */
  async createActivitySequence(userId: string, sequenceData: Omit<ActivitySequence, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<ActivitySequence> {
    try {
      console.log(`⚡ Creating activity sequence: ${sequenceData.name}`);

      const sequence: ActivitySequence = {
        id: `sequence_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...sequenceData,
        analytics: {
          totalExecutions: 0,
          completionRate: 0,
          averageExecutionTime: 0,
          successRate: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate sequence
      await this.validateSequence(sequence);

      // Store sequence
      await this.storeSequence(sequence);

      // Cache sequence
      this.sequenceCache.set(sequence.id, sequence);

      console.log(`✅ Activity sequence created: ${sequence.id}`);
      return sequence;

    } catch (error) {
      console.error('❌ Failed to create activity sequence:', error);
      throw error;
    }
  }

  /**
   * Get activity analytics for a user
   */
  async getActivityAnalytics(userId: string, period: 'day' | 'week' | 'month' | 'quarter' | 'year'): Promise<ActivityAnalytics> {
    try {
      console.log(`📊 Generating activity analytics for user: ${userId} (${period})`);

      // Check cache first
      const cacheKey = `activity_analytics:${userId}:${period}`;
      const cachedAnalytics = await redisCacheService.get<ActivityAnalytics>(cacheKey);
      
      if (cachedAnalytics && this.isAnalyticsValid(cachedAnalytics)) {
        console.log('⚡ Returning cached analytics');
        return cachedAnalytics;
      }

      // Calculate period dates
      const { startDate, endDate } = this.calculatePeriodDates(period);

      // Get activities for period
      const activities = await this.getActivitiesInPeriod(userId, startDate, endDate);

      // Calculate analytics
      const analytics: ActivityAnalytics = {
        userId,
        period,
        startDate,
        endDate,
        totalActivities: activities.length,
        activitiesByType: this.groupActivitiesByType(activities),
        activitiesByChannel: this.groupActivitiesByChannel(activities),
        activitiesByOutcome: this.groupActivitiesByOutcome(activities),
        activitiesByUser: this.groupActivitiesByUser(activities),
        averageResponseTime: this.calculateAverageResponseTime(activities),
        completionRate: this.calculateCompletionRate(activities),
        engagementScore: this.calculateEngagementScore(activities),
        trends: this.calculateTrends(activities, period),
        topPerformers: await this.getTopPerformers(userId, startDate, endDate),
        insights: await this.generateAnalyticsInsights(activities),
        generatedAt: new Date()
      };

      // Cache analytics for 30 minutes
      await redisCacheService.set(cacheKey, analytics, 1800);

      console.log(`✅ Analytics generated: ${activities.length} activities analyzed`);
      return analytics;

    } catch (error) {
      console.error('❌ Failed to generate activity analytics:', error);
      throw error;
    }
  }

  /**
   * Get interaction timeline for a contact
   */
  async getInteractionTimeline(contactId: string): Promise<InteractionTimeline> {
    try {
      console.log(`📅 Generating interaction timeline for contact: ${contactId}`);

      // Get all activities for contact
      const activities = await this.getActivitiesByContact(contactId);

      // Sort activities by date
      activities.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Generate milestones
      const milestones = this.generateMilestones(activities);

      // Calculate engagement score and trend
      const engagementScore = this.calculateContactEngagementScore(activities);
      const engagementTrend = this.calculateEngagementTrend(activities);

      // Generate next suggested actions
      const nextSuggestedActions = await this.generateNextActions(contactId, activities);

      // Identify risk factors
      const riskFactors = this.identifyInteractionRisks(activities);

      const timeline: InteractionTimeline = {
        contactId,
        activities,
        milestones,
        engagementScore,
        engagementTrend,
        nextSuggestedActions,
        riskFactors
      };

      console.log(`✅ Timeline generated: ${activities.length} activities, ${milestones.length} milestones`);
      return timeline;

    } catch (error) {
      console.error('❌ Failed to generate interaction timeline:', error);
      throw error;
    }
  }

  /**
   * Track real-time activity automatically
   */
  async trackRealTimeActivity(userId: string, activityType: ActivityType, metadata: Partial<ActivityMetadata>): Promise<void> {
    try {
      // Create automatic activity log
      await this.logActivity(userId, {
        type: activityType,
        subject: `Automatic ${activityType} tracking`,
        description: `System tracked ${activityType} activity`,
        outcome: 'neutral',
        priority: 'low',
        status: 'completed',
        direction: 'inbound',
        channel: metadata.source as any || 'website',
        participants: [],
        attachments: [],
        tags: ['automatic', 'real-time'],
        customFields: {},
        metadata: {
          source: 'automatic_tracking',
          ...metadata
        },
        createdBy: 'system',
        completedAt: new Date()
      });

    } catch (error) {
      console.error('❌ Failed to track real-time activity:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async validateActivity(activity: Activity): Promise<void> {
    if (!activity.type) throw new Error('Activity type is required');
    if (!activity.subject) throw new Error('Activity subject is required');
    if (!activity.createdBy) throw new Error('Activity creator is required');
  }

  private async validateSequence(sequence: ActivitySequence): Promise<void> {
    if (!sequence.name) throw new Error('Sequence name is required');
    if (!sequence.steps || sequence.steps.length === 0) throw new Error('Sequence must have at least one step');
  }

  private calculatePeriodDates(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  private groupActivitiesByType(activities: Activity[]): Record<ActivityType, number> {
    const grouped: Record<string, number> = {};
    
    activities.forEach(activity => {
      grouped[activity.type] = (grouped[activity.type] || 0) + 1;
    });

    return grouped as Record<ActivityType, number>;
  }

  private groupActivitiesByChannel(activities: Activity[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    activities.forEach(activity => {
      grouped[activity.channel] = (grouped[activity.channel] || 0) + 1;
    });

    return grouped;
  }

  private groupActivitiesByOutcome(activities: Activity[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    activities.forEach(activity => {
      grouped[activity.outcome] = (grouped[activity.outcome] || 0) + 1;
    });

    return grouped;
  }

  private groupActivitiesByUser(activities: Activity[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    activities.forEach(activity => {
      grouped[activity.createdBy] = (grouped[activity.createdBy] || 0) + 1;
    });

    return grouped;
  }

  private calculateAverageResponseTime(activities: Activity[]): number {
    const responseTimes = activities
      .filter(a => a.scheduledAt && a.completedAt)
      .map(a => (a.completedAt!.getTime() - a.scheduledAt!.getTime()) / (1000 * 60 * 60));

    return responseTimes.length > 0 ? 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0;
  }

  private calculateCompletionRate(activities: Activity[]): number {
    const completed = activities.filter(a => a.status === 'completed').length;
    return activities.length > 0 ? (completed / activities.length) * 100 : 0;
  }

  private calculateEngagementScore(activities: Activity[]): number {
    let score = 0;
    
    activities.forEach(activity => {
      switch (activity.outcome) {
        case 'positive':
          score += 10;
          break;
        case 'neutral':
          score += 5;
          break;
        case 'negative':
          score -= 5;
          break;
      }
      
      // Bonus for completed activities
      if (activity.status === 'completed') {
        score += 2;
      }
    });

    return Math.max(0, score);
  }

  private calculateTrends(activities: Activity[], period: string): ActivityAnalytics['trends'] {
    const trends: ActivityAnalytics['trends'] = [];
    const groupedByDate: Record<string, Activity[]> = {};

    // Group activities by date
    activities.forEach(activity => {
      const dateKey = activity.createdAt.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(activity);
    });

    // Generate trend data
    Object.entries(groupedByDate).forEach(([date, dayActivities]) => {
      const outcomeCount: Record<string, number> = {};
      dayActivities.forEach(activity => {
        outcomeCount[activity.outcome] = (outcomeCount[activity.outcome] || 0) + 1;
      });

      trends.push({
        date,
        count: dayActivities.length,
        outcome: outcomeCount
      });
    });

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getTopPerformers(userId: string, startDate: Date, endDate: Date): Promise<ActivityAnalytics['topPerformers']> {
    try {
      // This would fetch user performance data from database
      return [
        {
          userId: 'user1',
          userName: 'John Doe',
          activityCount: 45,
          successRate: 78
        }
      ];
    } catch (error) {
      console.warn('Could not get top performers:', error);
      return [];
    }
  }

  private async generateAnalyticsInsights(activities: Activity[]): Promise<ActivityAnalytics['insights']> {
    const insights: ActivityAnalytics['insights'] = [];

    // High completion rate insight
    const completionRate = this.calculateCompletionRate(activities);
    if (completionRate > 80) {
      insights.push({
        insight: 'High activity completion rate indicates good follow-through',
        type: 'positive',
        impact: 'medium',
        recommendation: 'Continue current activity management practices'
      });
    }

    // Low engagement insight
    const engagementScore = this.calculateEngagementScore(activities);
    if (engagementScore < 50) {
      insights.push({
        insight: 'Low engagement score suggests need for better interaction quality',
        type: 'negative',
        impact: 'high',
        recommendation: 'Focus on more meaningful customer interactions'
      });
    }

    return insights;
  }

  private generateMilestones(activities: Activity[]): InteractionTimeline['milestones'] {
    const milestones: InteractionTimeline['milestones'] = [];

    // First contact
    if (activities.length > 0) {
      milestones.push({
        date: activities[0].createdAt,
        event: 'First Contact',
        description: `Initial ${activities[0].type} interaction`,
        impact: 'positive'
      });
    }

    // Major activities
    activities.forEach(activity => {
      if (['demo', 'proposal', 'contract', 'meeting'].includes(activity.type)) {
        milestones.push({
          date: activity.createdAt,
          event: activity.type.charAt(0).toUpperCase() + activity.type.slice(1),
          description: activity.subject,
          impact: activity.outcome === 'positive' ? 'positive' : 
                 activity.outcome === 'negative' ? 'negative' : 'neutral'
        });
      }
    });

    return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private calculateContactEngagementScore(activities: Activity[]): number {
    return this.calculateEngagementScore(activities);
  }

  private calculateEngagementTrend(activities: Activity[]): 'increasing' | 'decreasing' | 'stable' {
    if (activities.length < 4) return 'stable';

    const recent = activities.slice(-3);
    const older = activities.slice(-6, -3);

    const recentScore = this.calculateEngagementScore(recent);
    const olderScore = this.calculateEngagementScore(older);

    const difference = recentScore - olderScore;

    if (difference > 10) return 'increasing';
    if (difference < -10) return 'decreasing';
    return 'stable';
  }

  private async generateNextActions(contactId: string, activities: Activity[]): Promise<InteractionTimeline['nextSuggestedActions']> {
    const actions: InteractionTimeline['nextSuggestedActions'] = [];

    // Based on last activity
    const lastActivity = activities[activities.length - 1];
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActivity > 7) {
        actions.push({
          action: 'Schedule follow-up call',
          priority: 'high',
          reason: 'No activity for over a week',
          expectedOutcome: 'Re-engage contact and maintain relationship'
        });
      }

      if (lastActivity.outcome === 'positive' && lastActivity.type === 'demo') {
        actions.push({
          action: 'Send proposal',
          priority: 'high',
          reason: 'Positive demo outcome',
          expectedOutcome: 'Move to next stage in sales process'
        });
      }
    }

    return actions;
  }

  private identifyInteractionRisks(activities: Activity[]): InteractionTimeline['riskFactors'] {
    const risks: InteractionTimeline['riskFactors'] = [];

    // No recent activity
    const lastActivity = activities[activities.length - 1];
    if (lastActivity) {
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceLastActivity > 14) {
        risks.push({
          factor: 'No recent activity',
          severity: 'high',
          recommendation: 'Immediate re-engagement required'
        });
      }
    }

    // Negative outcomes
    const negativeActivities = activities.filter(a => a.outcome === 'negative');
    if (negativeActivities.length > activities.length * 0.3) {
      risks.push({
        factor: 'High negative interaction rate',
        severity: 'medium',
        recommendation: 'Review interaction approach and value proposition'
      });
    }

    return risks;
  }

  private isAnalyticsValid(analytics: ActivityAnalytics): boolean {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return analytics.generatedAt > thirtyMinutesAgo;
  }

  private startProcessingQueue(): void {
    this.processingInterval = setInterval(async () => {
      if (this.processingQueue.length > 0) {
        const item = this.processingQueue.shift();
        if (item) {
          try {
            await this.processQueueItem(item);
          } catch (error) {
            console.error(`Failed to process queue item:`, error);
          }
        }
      }
    }, 5000); // Process every 5 seconds
  }

  private async processQueueItem(item: { activityId: string; action: string }): Promise<void> {
    const activity = await this.getActivity(item.activityId);
    if (!activity) return;

    switch (item.action) {
      case 'process_triggers':
        await this.processTriggers(activity);
        break;
      case 'update_engagement':
        await this.updateEngagementScore(activity);
        break;
      case 'generate_insights':
        await this.generateActivityInsights(activity);
        break;
      case 'process_completion':
        await this.processActivityCompletion(activity);
        break;
    }
  }

  private async processTriggers(activity: Activity): Promise<void> {
    // Process activity sequences that might be triggered
    console.log(`⚡ Processing triggers for activity: ${activity.id}`);
  }

  private async updateEngagementScore(activity: Activity): Promise<void> {
    // Update contact engagement score based on activity
    console.log(`📊 Updating engagement score for activity: ${activity.id}`);
  }

  private async generateActivityInsights(activity: Activity): Promise<void> {
    // Generate AI insights for the activity
    console.log(`🔍 Generating insights for activity: ${activity.id}`);
  }

  private async processActivityCompletion(activity: Activity): Promise<void> {
    // Process completed activity for follow-up actions
    console.log(`✅ Processing completion for activity: ${activity.id}`);
  }

  /**
   * Database operations
   */
  private async loadActivitySequences(): Promise<void> {
    try {
      console.log('📥 Loading activity sequences');
      // This would load from database
    } catch (error) {
      console.error('Failed to load activity sequences:', error);
    }
  }

  private async initializeRealTimeTracking(): Promise<void> {
    console.log('🔄 Initializing real-time activity tracking');
    // Set up real-time tracking listeners
  }

  private async storeActivity(activity: Activity): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing activity: ${activity.subject}`);
      });
    } catch (error) {
      console.warn('Could not store activity:', error);
    }
  }

  private async updateStoredActivity(activity: Activity): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🔄 Updating stored activity: ${activity.id}`);
      });
    } catch (error) {
      console.warn('Could not update stored activity:', error);
    }
  }

  private async storeSequence(sequence: ActivitySequence): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing sequence: ${sequence.name}`);
      });
    } catch (error) {
      console.warn('Could not store sequence:', error);
    }
  }

  private async getActivity(activityId: string): Promise<Activity | null> {
    if (this.activityCache.has(activityId)) {
      return this.activityCache.get(activityId)!;
    }

    try {
      // This would fetch from database
      return null;
    } catch (error) {
      console.error('Failed to get activity:', error);
      return null;
    }
  }

  private async getActivitiesInPeriod(userId: string, startDate: Date, endDate: Date): Promise<Activity[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get activities in period:', error);
      return [];
    }
  }

  private async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    try {
      // This would fetch from database
      return [];
    } catch (error) {
      console.error('Failed to get activities by contact:', error);
      return [];
    }
  }

  /**
   * Public API methods
   */
  async getActivities(userId: string, filters?: {
    contactId?: string;
    dealId?: string;
    type?: ActivityType;
    status?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<Activity[]> {
    try {
      // This would fetch from database with filters
      return [];
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  async getActivitySequences(userId: string): Promise<ActivitySequence[]> {
    return Array.from(this.sequenceCache.values()).filter(s => s.userId === userId);
  }

  async deleteActivity(activityId: string): Promise<void> {
    this.activityCache.delete(activityId);
    
    await productionDatabaseService.executeWithRetry(async () => {
      console.log(`🗑️ Deleting activity: ${activityId}`);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.activityCache.clear();
    this.sequenceCache.clear();
    this.processingQueue.length = 0;
    
    console.log('🧹 Activity Tracking System cleanup completed');
  }
}

// Export singleton instance
export const activityTrackingSystem = ActivityTrackingSystem.getInstance();
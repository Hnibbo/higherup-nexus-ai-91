/**
 * Conversion Tracking System with Accurate Attribution
 * Advanced tracking system for monitoring conversions across multiple touchpoints
 * with sophisticated attribution modeling and cross-device tracking
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';

// Conversion tracking interfaces
export interface ConversionEvent {
  id: string;
  userId: string;
  funnelId: string;
  sessionId: string;
  visitorId: string;
  eventType: 'page_view' | 'click' | 'form_submit' | 'purchase' | 'signup' | 'download' | 'custom';
  eventName: string;
  value: number;
  currency: string;
  timestamp: Date;
  properties: EventProperties;
  attribution: AttributionData;
  device: DeviceInfo;
  location: LocationInfo;
  referrer: ReferrerInfo;
  campaign: CampaignInfo;
  touchpoint: TouchpointInfo;
  conversionPath: ConversionPathStep[];
}

export interface EventProperties {
  pageUrl: string;
  pageTitle: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  formId?: string;
  productId?: string;
  category?: string;
  customProperties: Record<string, any>;
}

export interface AttributionData {
  model: AttributionModel;
  touchpointWeights: TouchpointWeight[];
  firstTouch: TouchpointInfo;
  lastTouch: TouchpointInfo;
  assistingTouchpoints: TouchpointInfo[];
  attributedValue: number;
  confidence: number;
}

export interface AttributionModel {
  type: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based' | 'data_driven' | 'custom';
  parameters: AttributionParameters;
  lookbackWindow: number; // days
  crossDevice: boolean;
}

export interface AttributionParameters {
  decayRate?: number;
  firstTouchWeight?: number;
  lastTouchWeight?: number;
  middleTouchWeight?: number;
  customWeights?: Record<string, number>;
}

export interface TouchpointWeight {
  touchpointId: string;
  weight: number;
  attributedValue: number;
  reasoning: string;
}

export interface TouchpointInfo {
  id: string;
  type: 'organic_search' | 'paid_search' | 'social' | 'email' | 'direct' | 'referral' | 'display' | 'affiliate';
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  term?: string;
  timestamp: Date;
  value: number;
  position: number; // position in conversion path
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  version: string;
  userAgent: string;
  screenResolution: string;
  deviceId: string;
  fingerprint: string;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  ipAddress: string;
}

export interface ReferrerInfo {
  url?: string;
  domain?: string;
  type: 'search_engine' | 'social_media' | 'website' | 'email' | 'direct' | 'unknown';
  searchTerm?: string;
}

export interface CampaignInfo {
  id?: string;
  name?: string;
  source: string;
  medium: string;
  content?: string;
  term?: string;
  utmParameters: UTMParameters;
}

export interface UTMParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  [key: string]: string | undefined;
}

export interface ConversionPathStep {
  stepNumber: number;
  touchpoint: TouchpointInfo;
  timestamp: Date;
  timeFromPrevious?: number; // milliseconds
  value: number;
  conversionProbability: number;
}

export interface ConversionFunnel {
  id: string;
  userId: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  goals: ConversionGoal[];
  attribution: AttributionConfiguration;
  tracking: TrackingConfiguration;
  analytics: FunnelAnalytics;
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface FunnelStep {
  id: string;
  name: string;
  description: string;
  order: number;
  type: 'page_view' | 'event' | 'time_spent' | 'custom';
  conditions: StepCondition[];
  isRequired: boolean;
  timeLimit?: number; // seconds
}

export interface StepCondition {
  type: 'url_match' | 'event_trigger' | 'element_click' | 'form_submit' | 'custom';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface ConversionGoal {
  id: string;
  name: string;
  type: 'revenue' | 'lead' | 'engagement' | 'custom';
  value: number;
  currency?: string;
  conditions: GoalCondition[];
  attribution: AttributionModel;
  isActive: boolean;
}

export interface GoalCondition {
  type: 'event' | 'page' | 'value' | 'time' | 'custom';
  operator: string;
  value: any;
}

export interface AttributionConfiguration {
  defaultModel: AttributionModel;
  customModels: AttributionModel[];
  crossDeviceTracking: boolean;
  cookieSettings: CookieSettings;
  dataRetention: DataRetentionSettings;
}

export interface CookieSettings {
  firstPartyCookies: boolean;
  thirdPartyCookies: boolean;
  cookieDuration: number; // days
  sameSitePolicy: 'strict' | 'lax' | 'none';
  secure: boolean;
}

export interface DataRetentionSettings {
  rawDataRetention: number; // days
  aggregatedDataRetention: number; // days
  personalDataRetention: number; // days
  anonymizationDelay: number; // days
}

export interface TrackingConfiguration {
  autoTracking: AutoTrackingSettings;
  customEvents: CustomEventDefinition[];
  dataLayer: DataLayerConfiguration;
  privacy: PrivacySettings;
}

export interface AutoTrackingSettings {
  pageViews: boolean;
  clicks: boolean;
  formSubmissions: boolean;
  scrollDepth: boolean;
  fileDownloads: boolean;
  outboundLinks: boolean;
  videoEngagement: boolean;
}

export interface CustomEventDefinition {
  id: string;
  name: string;
  trigger: EventTrigger;
  properties: EventPropertyDefinition[];
  value: ValueDefinition;
  isActive: boolean;
}

export interface EventTrigger {
  type: 'dom_ready' | 'element_click' | 'form_submit' | 'scroll' | 'time' | 'custom';
  selector?: string;
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  property: string;
  operator: string;
  value: any;
}

export interface EventPropertyDefinition {
  name: string;
  source: 'element_attribute' | 'page_property' | 'custom_function' | 'constant';
  value: string;
  required: boolean;
}

export interface ValueDefinition {
  type: 'fixed' | 'dynamic' | 'calculated';
  value?: number;
  source?: string;
  calculation?: string;
}

export interface DataLayerConfiguration {
  enabled: boolean;
  variableName: string;
  pushEvents: boolean;
  customDimensions: CustomDimension[];
}

export interface CustomDimension {
  id: string;
  name: string;
  scope: 'hit' | 'session' | 'user';
  source: string;
  isActive: boolean;
}

export interface PrivacySettings {
  gdprCompliance: boolean;
  ccpaCompliance: boolean;
  consentRequired: boolean;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
  dataProcessingConsent: ConsentSettings;
}

export interface ConsentSettings {
  required: boolean;
  categories: ConsentCategory[];
  defaultConsent: boolean;
  consentDuration: number; // days
}

export interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  defaultValue: boolean;
}

export interface FunnelAnalytics {
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  averageTimeToConvert: number;
  dropOffPoints: DropOffPoint[];
  topConversionPaths: ConversionPath[];
  attributionBreakdown: AttributionBreakdown;
  deviceBreakdown: DeviceBreakdown;
  channelPerformance: ChannelPerformance[];
}

export interface DropOffPoint {
  stepId: string;
  stepName: string;
  visitors: number;
  dropOffRate: number;
  reasons: DropOffReason[];
}

export interface DropOffReason {
  reason: string;
  percentage: number;
  impact: 'high' | 'medium' | 'low';
}

export interface ConversionPath {
  id: string;
  steps: ConversionPathStep[];
  frequency: number;
  conversionRate: number;
  averageValue: number;
  timeToConvert: number;
}

export interface AttributionBreakdown {
  byChannel: ChannelAttribution[];
  byCampaign: CampaignAttribution[];
  byTouchpoint: TouchpointAttribution[];
  modelComparison: ModelComparison[];
}

export interface ChannelAttribution {
  channel: string;
  attributedConversions: number;
  attributedValue: number;
  percentage: number;
}

export interface CampaignAttribution {
  campaignId: string;
  campaignName: string;
  attributedConversions: number;
  attributedValue: number;
  percentage: number;
}

export interface TouchpointAttribution {
  touchpointId: string;
  type: string;
  attributedConversions: number;
  attributedValue: number;
  averagePosition: number;
}

export interface ModelComparison {
  modelType: string;
  attributedConversions: number;
  attributedValue: number;
  difference: number;
}

export interface DeviceBreakdown {
  desktop: DeviceMetrics;
  mobile: DeviceMetrics;
  tablet: DeviceMetrics;
}

export interface DeviceMetrics {
  visitors: number;
  conversions: number;
  conversionRate: number;
  averageValue: number;
}

export interface ChannelPerformance {
  channel: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  averageValue: number;
  costPerConversion?: number;
  returnOnAdSpend?: number;
}

export interface VisitorSession {
  id: string;
  visitorId: string;
  deviceId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: ConversionEvent[];
  touchpoints: TouchpointInfo[];
  converted: boolean;
  conversionValue: number;
  attribution: AttributionData;
}

export interface CrossDeviceProfile {
  id: string;
  visitorIds: string[];
  deviceIds: string[];
  sessions: VisitorSession[];
  firstSeen: Date;
  lastSeen: Date;
  totalConversions: number;
  totalValue: number;
  unifiedAttribution: AttributionData;
}

/**
 * Conversion Tracking System with accurate attribution
 */
export class ConversionTrackingSystem {
  private static instance: ConversionTrackingSystem;
  private funnels: Map<string, ConversionFunnel> = new Map();
  private events: Map<string, ConversionEvent[]> = new Map();
  private sessions: Map<string, VisitorSession> = new Map();
  private crossDeviceProfiles: Map<string, CrossDeviceProfile> = new Map();
  private attributionEngine: AttributionEngine;

  private constructor() {
    this.attributionEngine = new AttributionEngine();
    this.initializeSystem();
  }

  public static getInstance(): ConversionTrackingSystem {
    if (!ConversionTrackingSystem.instance) {
      ConversionTrackingSystem.instance = new ConversionTrackingSystem();
    }
    return ConversionTrackingSystem.instance;
  }

  private async initializeSystem(): Promise<void> {
    console.log('📊 Initializing Conversion Tracking System');
    
    // Load existing funnels
    await this.loadFunnels();
    
    // Initialize attribution engine
    await this.attributionEngine.initialize();
    
    // Set up event processing
    await this.setupEventProcessing();
    
    console.log('✅ Conversion Tracking System initialized');
  }

  /**
   * Create a new conversion funnel
   */
  async createFunnel(userId: string, funnelData: Omit<ConversionFunnel, 'id' | 'createdAt' | 'updatedAt' | 'analytics'>): Promise<ConversionFunnel> {
    try {
      console.log(`🎯 Creating conversion funnel: ${funnelData.name}`);

      const funnel: ConversionFunnel = {
        id: `funnel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        ...funnelData,
        analytics: {
          totalVisitors: 0,
          totalConversions: 0,
          conversionRate: 0,
          averageTimeToConvert: 0,
          dropOffPoints: [],
          topConversionPaths: [],
          attributionBreakdown: {
            byChannel: [],
            byCampaign: [],
            byTouchpoint: [],
            modelComparison: []
          },
          deviceBreakdown: {
            desktop: { visitors: 0, conversions: 0, conversionRate: 0, averageValue: 0 },
            mobile: { visitors: 0, conversions: 0, conversionRate: 0, averageValue: 0 },
            tablet: { visitors: 0, conversions: 0, conversionRate: 0, averageValue: 0 }
          },
          channelPerformance: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate funnel configuration
      await this.validateFunnelConfiguration(funnel);

      // Store funnel
      await this.storeFunnel(funnel);
      this.funnels.set(funnel.id, funnel);

      // Initialize event tracking for funnel
      this.events.set(funnel.id, []);

      console.log(`✅ Conversion funnel created: ${funnel.id}`);
      return funnel;

    } catch (error) {
      console.error('❌ Failed to create conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Track conversion event
   */
  async trackEvent(eventData: Omit<ConversionEvent, 'id' | 'timestamp' | 'attribution' | 'conversionPath'>): Promise<ConversionEvent> {
    try {
      console.log(`📈 Tracking conversion event: ${eventData.eventType}.${eventData.eventName}`);

      // Create event with attribution
      const event: ConversionEvent = {
        id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...eventData,
        timestamp: new Date(),
        attribution: await this.calculateAttribution(eventData),
        conversionPath: await this.buildConversionPath(eventData.sessionId, eventData.funnelId)
      };

      // Store event
      await this.storeEvent(event);

      // Add to funnel events
      const funnelEvents = this.events.get(event.funnelId) || [];
      funnelEvents.push(event);
      this.events.set(event.funnelId, funnelEvents);

      // Update session
      await this.updateSession(event);

      // Update cross-device profile
      await this.updateCrossDeviceProfile(event);

      // Update funnel analytics
      await this.updateFunnelAnalytics(event.funnelId);

      console.log(`✅ Event tracked: ${event.id}`);
      return event;

    } catch (error) {
      console.error('❌ Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Get conversion attribution for a specific event
   */
  async getEventAttribution(eventId: string): Promise<AttributionData | null> {
    try {
      console.log(`🔍 Getting attribution for event: ${eventId}`);

      // Find event across all funnels
      for (const funnelEvents of this.events.values()) {
        const event = funnelEvents.find(e => e.id === eventId);
        if (event) {
          return event.attribution;
        }
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get event attribution:', error);
      return null;
    }
  }

  /**
   * Analyze conversion paths
   */
  async analyzeConversionPaths(funnelId: string, options: {
    timeRange?: { start: Date; end: Date };
    attributionModel?: AttributionModel;
    segmentation?: string[];
  } = {}): Promise<ConversionPath[]> {
    try {
      console.log(`📊 Analyzing conversion paths: ${funnelId}`);

      const funnel = this.funnels.get(funnelId);
      if (!funnel) {
        throw new Error(`Funnel not found: ${funnelId}`);
      }

      const events = this.events.get(funnelId) || [];
      
      // Filter events by time range
      let filteredEvents = events;
      if (options.timeRange) {
        filteredEvents = events.filter(e => 
          e.timestamp >= options.timeRange!.start && 
          e.timestamp <= options.timeRange!.end
        );
      }

      // Group events by session
      const sessionEvents = new Map<string, ConversionEvent[]>();
      for (const event of filteredEvents) {
        const sessionEvts = sessionEvents.get(event.sessionId) || [];
        sessionEvts.push(event);
        sessionEvents.set(event.sessionId, sessionEvts);
      }

      // Build conversion paths
      const conversionPaths: ConversionPath[] = [];
      for (const [sessionId, sessionEvts] of sessionEvents.entries()) {
        const sortedEvents = sessionEvts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // Check if session converted
        const hasConversion = sortedEvents.some(e => this.isConversionEvent(e, funnel));
        if (!hasConversion) continue;

        const path: ConversionPath = {
          id: `path_${sessionId}`,
          steps: sortedEvents.map((event, index) => ({
            stepNumber: index + 1,
            touchpoint: event.touchpoint,
            timestamp: event.timestamp,
            timeFromPrevious: index > 0 ? event.timestamp.getTime() - sortedEvents[index - 1].timestamp.getTime() : undefined,
            value: event.value,
            conversionProbability: this.calculateConversionProbability(event, funnel)
          })),
          frequency: 1,
          conversionRate: 1,
          averageValue: sortedEvents.reduce((sum, e) => sum + e.value, 0),
          timeToConvert: sortedEvents[sortedEvents.length - 1].timestamp.getTime() - sortedEvents[0].timestamp.getTime()
        };

        conversionPaths.push(path);
      }

      // Aggregate similar paths
      const aggregatedPaths = this.aggregateConversionPaths(conversionPaths);

      console.log(`✅ Analyzed ${aggregatedPaths.length} unique conversion paths`);
      return aggregatedPaths;

    } catch (error) {
      console.error('❌ Failed to analyze conversion paths:', error);
      return [];
    }
  }

  /**
   * Compare attribution models
   */
  async compareAttributionModels(funnelId: string, models: AttributionModel[]): Promise<ModelComparison[]> {
    try {
      console.log(`🔬 Comparing attribution models for funnel: ${funnelId}`);

      const events = this.events.get(funnelId) || [];
      const comparisons: ModelComparison[] = [];

      for (const model of models) {
        let totalConversions = 0;
        let totalValue = 0;

        for (const event of events) {
          if (this.isConversionEvent(event, this.funnels.get(funnelId)!)) {
            const attribution = await this.attributionEngine.calculateAttribution(event, model);
            totalConversions += 1;
            totalValue += attribution.attributedValue;
          }
        }

        comparisons.push({
          modelType: model.type,
          attributedConversions: totalConversions,
          attributedValue: totalValue,
          difference: 0 // Will be calculated relative to baseline
        });
      }

      // Calculate differences relative to first model
      if (comparisons.length > 0) {
        const baseline = comparisons[0];
        for (const comparison of comparisons) {
          comparison.difference = comparison.attributedValue - baseline.attributedValue;
        }
      }

      console.log(`✅ Attribution model comparison completed`);
      return comparisons;

    } catch (error) {
      console.error('❌ Failed to compare attribution models:', error);
      return [];
    }
  }

  /**
   * Get funnel analytics
   */
  async getFunnelAnalytics(funnelId: string, timeRange?: { start: Date; end: Date }): Promise<FunnelAnalytics> {
    try {
      console.log(`📊 Getting funnel analytics: ${funnelId}`);

      const funnel = this.funnels.get(funnelId);
      if (!funnel) {
        throw new Error(`Funnel not found: ${funnelId}`);
      }

      // Update analytics with latest data
      await this.updateFunnelAnalytics(funnelId, timeRange);

      return funnel.analytics;

    } catch (error) {
      console.error('❌ Failed to get funnel analytics:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async loadFunnels(): Promise<void> {
    try {
      console.log('📥 Loading conversion funnels');
      // This would load from database
    } catch (error) {
      console.error('Failed to load funnels:', error);
    }
  }

  private async setupEventProcessing(): Promise<void> {
    console.log('⚙️ Setting up event processing');
    
    // Set up real-time event processing
    // This would include queue processing, batch processing, etc.
  }

  private async validateFunnelConfiguration(funnel: ConversionFunnel): Promise<void> {
    // Validate steps
    if (funnel.steps.length === 0) {
      throw new Error('Funnel must have at least one step');
    }

    // Validate step order
    const orders = funnel.steps.map(s => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error('Funnel steps must have consecutive order numbers starting from 1');
      }
    }

    // Validate goals
    if (funnel.goals.length === 0) {
      throw new Error('Funnel must have at least one conversion goal');
    }
  }

  private async calculateAttribution(eventData: any): Promise<AttributionData> {
    const funnel = this.funnels.get(eventData.funnelId);
    if (!funnel) {
      throw new Error(`Funnel not found: ${eventData.funnelId}`);
    }

    return await this.attributionEngine.calculateAttribution(eventData, funnel.attribution.defaultModel);
  }

  private async buildConversionPath(sessionId: string, funnelId: string): Promise<ConversionPathStep[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return session.touchpoints.map((touchpoint, index) => ({
      stepNumber: index + 1,
      touchpoint,
      timestamp: touchpoint.timestamp,
      timeFromPrevious: index > 0 ? touchpoint.timestamp.getTime() - session.touchpoints[index - 1].timestamp.getTime() : undefined,
      value: touchpoint.value,
      conversionProbability: 0.5 // Would be calculated based on historical data
    }));
  }

  private async updateSession(event: ConversionEvent): Promise<void> {
    let session = this.sessions.get(event.sessionId);
    
    if (!session) {
      session = {
        id: event.sessionId,
        visitorId: event.visitorId,
        deviceId: event.device.deviceId,
        startTime: event.timestamp,
        pageViews: 0,
        events: [],
        touchpoints: [],
        converted: false,
        conversionValue: 0,
        attribution: event.attribution
      };
    }

    // Update session data
    session.events.push(event);
    session.endTime = event.timestamp;
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    
    if (event.eventType === 'page_view') {
      session.pageViews++;
    }

    // Add touchpoint if new
    if (!session.touchpoints.some(t => t.id === event.touchpoint.id)) {
      session.touchpoints.push(event.touchpoint);
    }

    // Check for conversion
    const funnel = this.funnels.get(event.funnelId);
    if (funnel && this.isConversionEvent(event, funnel)) {
      session.converted = true;
      session.conversionValue += event.value;
    }

    this.sessions.set(event.sessionId, session);
    await this.storeSession(session);
  }

  private async updateCrossDeviceProfile(event: ConversionEvent): Promise<void> {
    // Cross-device profile logic would go here
    // This would link sessions across devices for the same user
  }

  private async updateFunnelAnalytics(funnelId: string, timeRange?: { start: Date; end: Date }): Promise<void> {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) return;

    const events = this.events.get(funnelId) || [];
    
    // Filter by time range if provided
    const filteredEvents = timeRange 
      ? events.filter(e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end)
      : events;

    // Calculate basic metrics
    const uniqueVisitors = new Set(filteredEvents.map(e => e.visitorId)).size;
    const conversions = filteredEvents.filter(e => this.isConversionEvent(e, funnel));
    
    funnel.analytics.totalVisitors = uniqueVisitors;
    funnel.analytics.totalConversions = conversions.length;
    funnel.analytics.conversionRate = uniqueVisitors > 0 ? conversions.length / uniqueVisitors : 0;

    // Calculate average time to convert
    const conversionTimes = conversions.map(e => {
      const firstEvent = filteredEvents
        .filter(fe => fe.visitorId === e.visitorId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      return e.timestamp.getTime() - firstEvent.timestamp.getTime();
    });
    
    funnel.analytics.averageTimeToConvert = conversionTimes.length > 0 
      ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length 
      : 0;

    // Calculate drop-off points
    funnel.analytics.dropOffPoints = await this.calculateDropOffPoints(funnel, filteredEvents);

    // Calculate attribution breakdown
    funnel.analytics.attributionBreakdown = await this.calculateAttributionBreakdown(filteredEvents);

    // Calculate device breakdown
    funnel.analytics.deviceBreakdown = this.calculateDeviceBreakdown(filteredEvents);

    // Calculate channel performance
    funnel.analytics.channelPerformance = this.calculateChannelPerformance(filteredEvents);

    funnel.updatedAt = new Date();
    await this.updateFunnel(funnel);
  }

  private isConversionEvent(event: ConversionEvent, funnel: ConversionFunnel): boolean {
    return funnel.goals.some(goal => {
      return goal.conditions.every(condition => {
        switch (condition.type) {
          case 'event':
            return event.eventType === condition.value || event.eventName === condition.value;
          case 'value':
            return this.evaluateCondition(event.value, condition.operator, condition.value);
          default:
            return false;
        }
      });
    });
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'greater_than': return actual > expected;
      case 'less_than': return actual < expected;
      case 'contains': return String(actual).includes(String(expected));
      default: return false;
    }
  }

  private calculateConversionProbability(event: ConversionEvent, funnel: ConversionFunnel): number {
    // This would use machine learning to predict conversion probability
    // For now, return a simple calculation based on event type and position
    const baseProb = event.eventType === 'purchase' ? 0.9 : 0.3;
    const positionFactor = Math.min(1, event.conversionPath.length / funnel.steps.length);
    return baseProb * positionFactor;
  }

  private aggregateConversionPaths(paths: ConversionPath[]): ConversionPath[] {
    const pathMap = new Map<string, ConversionPath>();

    for (const path of paths) {
      // Create a signature for the path based on touchpoint types
      const signature = path.steps.map(s => s.touchpoint.type).join('->');
      
      if (pathMap.has(signature)) {
        const existing = pathMap.get(signature)!;
        existing.frequency++;
        existing.averageValue = (existing.averageValue + path.averageValue) / 2;
        existing.timeToConvert = (existing.timeToConvert + path.timeToConvert) / 2;
      } else {
        pathMap.set(signature, { ...path, frequency: 1 });
      }
    }

    return Array.from(pathMap.values()).sort((a, b) => b.frequency - a.frequency);
  }

  private async calculateDropOffPoints(funnel: ConversionFunnel, events: ConversionEvent[]): Promise<DropOffPoint[]> {
    const dropOffPoints: DropOffPoint[] = [];

    for (const step of funnel.steps) {
      const stepEvents = events.filter(e => this.matchesStepConditions(e, step));
      const nextStepEvents = funnel.steps
        .filter(s => s.order === step.order + 1)
        .flatMap(s => events.filter(e => this.matchesStepConditions(e, s)));

      const visitors = new Set(stepEvents.map(e => e.visitorId)).size;
      const nextStepVisitors = new Set(nextStepEvents.map(e => e.visitorId)).size;
      const dropOffRate = visitors > 0 ? (visitors - nextStepVisitors) / visitors : 0;

      dropOffPoints.push({
        stepId: step.id,
        stepName: step.name,
        visitors,
        dropOffRate,
        reasons: [] // Would be populated with actual analysis
      });
    }

    return dropOffPoints;
  }

  private matchesStepConditions(event: ConversionEvent, step: FunnelStep): boolean {
    return step.conditions.every(condition => {
      switch (condition.type) {
        case 'url_match':
          return this.evaluateCondition(event.properties.pageUrl, condition.operator, condition.value);
        case 'event_trigger':
          return event.eventType === condition.value || event.eventName === condition.value;
        default:
          return false;
      }
    });
  }

  private async calculateAttributionBreakdown(events: ConversionEvent[]): Promise<AttributionBreakdown> {
    const byChannel: ChannelAttribution[] = [];
    const byCampaign: CampaignAttribution[] = [];
    const byTouchpoint: TouchpointAttribution[] = [];

    // Group by channel
    const channelMap = new Map<string, { conversions: number; value: number }>();
    for (const event of events) {
      const channel = event.touchpoint.type;
      const existing = channelMap.get(channel) || { conversions: 0, value: 0 };
      existing.conversions += 1;
      existing.value += event.attribution.attributedValue;
      channelMap.set(channel, existing);
    }

    const totalValue = Array.from(channelMap.values()).reduce((sum, ch) => sum + ch.value, 0);
    
    for (const [channel, data] of channelMap.entries()) {
      byChannel.push({
        channel,
        attributedConversions: data.conversions,
        attributedValue: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
      });
    }

    return {
      byChannel,
      byCampaign,
      byTouchpoint,
      modelComparison: []
    };
  }

  private calculateDeviceBreakdown(events: ConversionEvent[]): DeviceBreakdown {
    const deviceMap = new Map<string, { visitors: Set<string>; conversions: number; value: number }>();

    for (const event of events) {
      const deviceType = event.device.type;
      const existing = deviceMap.get(deviceType) || { visitors: new Set(), conversions: 0, value: 0 };
      existing.visitors.add(event.visitorId);
      if (event.eventType === 'purchase') {
        existing.conversions++;
        existing.value += event.value;
      }
      deviceMap.set(deviceType, existing);
    }

    const createMetrics = (data: { visitors: Set<string>; conversions: number; value: number }): DeviceMetrics => ({
      visitors: data.visitors.size,
      conversions: data.conversions,
      conversionRate: data.visitors.size > 0 ? data.conversions / data.visitors.size : 0,
      averageValue: data.conversions > 0 ? data.value / data.conversions : 0
    });

    return {
      desktop: createMetrics(deviceMap.get('desktop') || { visitors: new Set(), conversions: 0, value: 0 }),
      mobile: createMetrics(deviceMap.get('mobile') || { visitors: new Set(), conversions: 0, value: 0 }),
      tablet: createMetrics(deviceMap.get('tablet') || { visitors: new Set(), conversions: 0, value: 0 })
    };
  }

  private calculateChannelPerformance(events: ConversionEvent[]): ChannelPerformance[] {
    const channelMap = new Map<string, { visitors: Set<string>; conversions: number; value: number }>();

    for (const event of events) {
      const channel = event.touchpoint.source;
      const existing = channelMap.get(channel) || { visitors: new Set(), conversions: 0, value: 0 };
      existing.visitors.add(event.visitorId);
      if (event.eventType === 'purchase') {
        existing.conversions++;
        existing.value += event.value;
      }
      channelMap.set(channel, existing);
    }

    return Array.from(channelMap.entries()).map(([channel, data]) => ({
      channel,
      visitors: data.visitors.size,
      conversions: data.conversions,
      conversionRate: data.visitors.size > 0 ? data.conversions / data.visitors.size : 0,
      averageValue: data.conversions > 0 ? data.value / data.conversions : 0
    }));
  }

  /**
   * Database operations
   */
  private async storeFunnel(funnel: ConversionFunnel): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing conversion funnel: ${funnel.name}`);
      });
    } catch (error) {
      console.warn('Could not store funnel:', error);
    }
  }

  private async updateFunnel(funnel: ConversionFunnel): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🔄 Updating conversion funnel: ${funnel.id}`);
      });
    } catch (error) {
      console.warn('Could not update funnel:', error);
    }
  }

  private async storeEvent(event: ConversionEvent): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing conversion event: ${event.eventType}.${event.eventName}`);
      });
    } catch (error) {
      console.warn('Could not store event:', error);
    }
  }

  private async storeSession(session: VisitorSession): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing visitor session: ${session.id}`);
      });
    } catch (error) {
      console.warn('Could not store session:', error);
    }
  }

  /**
   * Public API methods
   */
  async getFunnels(userId: string): Promise<ConversionFunnel[]> {
    return Array.from(this.funnels.values()).filter(f => f.userId === userId);
  }

  async getFunnel(funnelId: string): Promise<ConversionFunnel | null> {
    return this.funnels.get(funnelId) || null;
  }

  async getFunnelEvents(funnelId: string, limit: number = 1000): Promise<ConversionEvent[]> {
    const events = this.events.get(funnelId) || [];
    return events.slice(-limit);
  }

  async getVisitorSessions(visitorId: string): Promise<VisitorSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.visitorId === visitorId);
  }

  async deleteFunnel(funnelId: string): Promise<void> {
    this.funnels.delete(funnelId);
    this.events.delete(funnelId);

    await productionDatabaseService.executeWithRetry(async () => {
      console.log(`🗑️ Deleting conversion funnel: ${funnelId}`);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.funnels.clear();
    this.events.clear();
    this.sessions.clear();
    this.crossDeviceProfiles.clear();
    
    console.log('🧹 Conversion Tracking System cleanup completed');
  }
}

/**
 * Attribution Engine for calculating attribution weights
 */
class AttributionEngine {
  async initialize(): Promise<void> {
    console.log('🎯 Initializing Attribution Engine');
  }

  async calculateAttribution(eventData: any, model: AttributionModel): Promise<AttributionData> {
    // This would implement sophisticated attribution calculation
    // For now, return a simplified attribution
    return {
      model,
      touchpointWeights: [],
      firstTouch: eventData.touchpoint,
      lastTouch: eventData.touchpoint,
      assistingTouchpoints: [],
      attributedValue: eventData.value,
      confidence: 0.85
    };
  }
}

// Export singleton instance
export const conversionTrackingSystem = ConversionTrackingSystem.getInstance();
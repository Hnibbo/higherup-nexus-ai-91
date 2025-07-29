import { enhancedSupabaseService } from '../database/EnhancedSupabaseService';
import { supabase } from '@/integrations/supabase/client';
import { PredictiveAnalyticsEngine } from '../ai/PredictiveAnalyticsEngine';
import { AIIntelligenceEngine } from '../ai/AIIntelligenceEngine';

export interface PredictionModel {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  model_type: 'churn' | 'conversion' | 'ltv' | 'next_purchase' | 'lead_scoring' | 'custom';
  algorithm: 'random_forest' | 'neural_network' | 'gradient_boosting' | 'logistic_regression' | 'custom';
  features: string[];
  hyperparameters: Record<string, any>;
  performance_metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
    auc?: number;
  };
  training_date: Date;
  version: string;
  status: 'training' | 'active' | 'archived';
}

export interface PredictionResult {
  id: string;
  model_id: string;
  entity_type: 'contact' | 'deal' | 'campaign' | 'product';
  entity_id: string;
  prediction_type: string;
  prediction_value: any;
  confidence_score: number;
  explanation: string[];
  features_used: Record<string, any>;
  created_at: Date;
  valid_until: Date;
}

export interface ModelTrainingJob {
  id: string;
  user_id: string;
  model_type: string;
  training_data_source: string;
  parameters: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
  result_model_id?: string;
}

export interface PredictionBatch {
  id: string;
  user_id: string;
  model_id: string;
  entity_ids: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: Date;
  completed_at?: Date;
  result_count: number;
  error_count: number;
}

export interface ModelPerformanceMetrics {
  model_id: string;
  accuracy_over_time: Array<{ date: string; accuracy: number }>;
  prediction_distribution: Record<string, number>;
  feature_importance: Array<{ feature: string; importance: number }>;
  confusion_matrix?: number[][];
  roc_curve?: Array<{ fpr: number; tpr: number }>;
  precision_recall_curve?: Array<{ precision: number; recall: number }>;
}

export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private predictiveEngine: PredictiveAnalyticsEngine;
  private aiEngine: AIIntelligenceEngine;

  private constructor() {
    this.predictiveEngine = PredictiveAnalyticsEngine.getInstance();
    this.aiEngine = AIIntelligenceEngine.getInstance();
  }

  public static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  // Model Management
  async createPredictionModel(model: Omit<PredictionModel, 'id' | 'training_date' | 'performance_metrics' | 'version' | 'status'>): Promise<PredictionModel> {
    try {
      console.log(`🔄 Creating prediction model: ${model.name}`);
      
      const { data, error } = await supabase
        .from('ai_models')
        .insert({
          user_id: model.user_id,
          name: model.name,
          description: model.description,
          model_type: model.model_type,
          algorithm: model.algorithm,
          features: model.features,
          hyperparameters: model.hyperparameters,
          performance_metrics: {},
          training_date: null,
          version: '1.0.0',
          status: 'training'
        })
        .select()
        .single();

      if (error) throw error;

      // Start training job
      await this.startModelTraining(data.id, model.model_type, model.features, model.hyperparameters);

      console.log(`✅ Prediction model created: ${data.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create prediction model:', error);
      throw error;
    }
  }

  async getPredictionModels(userId: string, modelType?: string): Promise<PredictionModel[]> {
    try {
      let query = supabase
        .from('ai_models')
        .select('*')
        .eq('user_id', userId);

      if (modelType) {
        query = query.eq('model_type', modelType);
      }

      const { data, error } = await query.order('training_date', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get prediction models:', error);
      throw error;
    }
  }

  async updatePredictionModel(modelId: string, updates: Partial<PredictionModel>): Promise<PredictionModel> {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .update(updates)
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Prediction model updated: ${data.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update prediction model:', error);
      throw error;
    }
  }

  async archiveModel(modelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update({ status: 'archived' })
        .eq('id', modelId);

      if (error) throw error;

      console.log(`✅ Prediction model archived: ${modelId}`);

    } catch (error) {
      console.error('❌ Failed to archive prediction model:', error);
      throw error;
    }
  }

  // Model Training
  private async startModelTraining(modelId: string, modelType: string, features: string[], hyperparameters: Record<string, any>): Promise<ModelTrainingJob> {
    try {
      // Create training job
      const { data: model, error: modelError } = await supabase
        .from('ai_models')
        .select('user_id')
        .eq('id', modelId)
        .single();

      if (modelError) throw modelError;

      const { data, error } = await supabase
        .from('model_training_jobs')
        .insert({
          user_id: model.user_id,
          model_id: modelId,
          model_type: modelType,
          training_data_source: 'auto',
          parameters: {
            features,
            hyperparameters
          },
          status: 'queued',
          progress: 0,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Start training process asynchronously
      this.processTrainingJob(data.id).catch(err => {
        console.error(`Training job ${data.id} failed:`, err);
      });

      console.log(`🔄 Model training job started: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to start model training:', error);
      throw error;
    }
  }

  private async processTrainingJob(jobId: string): Promise<void> {
    try {
      // Get job details
      const { data: job, error: jobError } = await supabase
        .from('model_training_jobs')
        .select('*, model:model_id(*)')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      // Update job status
      await supabase
        .from('model_training_jobs')
        .update({
          status: 'processing',
          progress: 10
        })
        .eq('id', jobId);

      // Get training data based on model type
      const trainingData = await this.getTrainingData(job.model_type, job.user_id);

      // Update progress
      await supabase
        .from('model_training_jobs')
        .update({ progress: 30 })
        .eq('id', jobId);

      // Train model using predictive engine
      const trainingResult = await this.predictiveEngine.trainModel({
        modelType: job.model_type,
        algorithm: job.model.algorithm,
        features: job.parameters.features,
        hyperparameters: job.parameters.hyperparameters,
        trainingData
      });

      // Update progress
      await supabase
        .from('model_training_jobs')
        .update({ progress: 80 })
        .eq('id', jobId);

      // Update model with training results
      await supabase
        .from('ai_models')
        .update({
          performance_metrics: trainingResult.metrics,
          training_date: new Date().toISOString(),
          status: 'active',
          version: this.incrementVersion(job.model.version)
        })
        .eq('id', job.model_id);

      // Complete job
      await supabase
        .from('model_training_jobs')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          result_model_id: job.model_id
        })
        .eq('id', jobId);

      console.log(`✅ Model training completed for job: ${jobId}`);

    } catch (error) {
      console.error(`❌ Model training failed for job ${jobId}:`, error);

      // Update job with error
      await supabase
        .from('model_training_jobs')
        .update({
          status: 'failed',
          error_message: error.toString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
    }
  }

  private async getTrainingData(modelType: string, userId: string): Promise<any[]> {
    switch (modelType) {
      case 'churn':
        return this.getChurnTrainingData(userId);
      case 'conversion':
        return this.getConversionTrainingData(userId);
      case 'ltv':
        return this.getLTVTrainingData(userId);
      case 'lead_scoring':
        return this.getLeadScoringTrainingData(userId);
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  private async getChurnTrainingData(userId: string): Promise<any[]> {
    // Get contacts with interaction history and churn status
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        email,
        status,
        interaction_count,
        last_interaction_at,
        created_at,
        custom_fields
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'inactive', 'churned']);

    if (error) throw error;

    // Enrich with behavioral data
    const enrichedData = await Promise.all((data || []).map(async contact => {
      // Get behavioral signals
      const { data: signals } = await supabase
        .from('behavioral_signals')
        .select('signal_type, signal_value, timestamp')
        .eq('contact_id', contact.id)
        .order('timestamp', { ascending: false });

      // Calculate engagement metrics
      const emailOpens = signals?.filter(s => s.signal_type === 'email_open').length || 0;
      const emailClicks = signals?.filter(s => s.signal_type === 'email_click').length || 0;
      const websiteVisits = signals?.filter(s => s.signal_type === 'website_visit').length || 0;

      // Calculate days since last interaction
      const lastInteraction = contact.last_interaction_at 
        ? new Date(contact.last_interaction_at) 
        : null;
      const daysSinceLastInteraction = lastInteraction
        ? Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculate customer tenure in days
      const createdAt = new Date(contact.created_at);
      const tenureDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: contact.id,
        email_domain: contact.email.split('@')[1],
        status: contact.status,
        churned: contact.status === 'churned' ? 1 : 0,
        interaction_count: contact.interaction_count,
        days_since_last_interaction: daysSinceLastInteraction,
        tenure_days: tenureDays,
        email_opens_30d: emailOpens,
        email_clicks_30d: emailClicks,
        website_visits_30d: websiteVisits,
        company_size: contact.custom_fields?.company_size || 'unknown',
        industry: contact.custom_fields?.industry || 'unknown'
      };
    }));

    return enrichedData;
  }

  private async getConversionTrainingData(userId: string): Promise<any[]> {
    // Get leads with conversion outcomes
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        email,
        status,
        lead_score,
        interaction_count,
        last_interaction_at,
        created_at,
        custom_fields
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(contact => ({
      id: contact.id,
      lead_score: contact.lead_score || 0,
      interaction_count: contact.interaction_count || 0,
      converted: contact.status === 'customer' ? 1 : 0,
      email_domain: contact.email.split('@')[1],
      company_size: contact.custom_fields?.company_size || 'unknown',
      industry: contact.custom_fields?.industry || 'unknown'
    }));
  }

  private async getLTVTrainingData(userId: string): Promise<any[]> {
    // Get customers with purchase history
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        email,
        status,
        created_at,
        custom_fields
      `)
      .eq('user_id', userId)
      .eq('status', 'customer');

    if (error) throw error;

    return (data || []).map(contact => ({
      id: contact.id,
      tenure_months: Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)),
      company_size: contact.custom_fields?.company_size || 'unknown',
      industry: contact.custom_fields?.industry || 'unknown',
      ltv: Math.random() * 10000 // Mock LTV for now
    }));
  }

  private async getLeadScoringTrainingData(userId: string): Promise<any[]> {
    // Get leads with scoring data
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        email,
        status,
        lead_score,
        interaction_count,
        created_at,
        custom_fields
      `)
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map(contact => ({
      id: contact.id,
      current_score: contact.lead_score || 0,
      interaction_count: contact.interaction_count || 0,
      email_domain: contact.email.split('@')[1],
      company_size: contact.custom_fields?.company_size || 'unknown',
      industry: contact.custom_fields?.industry || 'unknown'
    }));
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
  }

  // Predictions
  async generatePrediction(
    modelId: string,
    entityType: 'contact' | 'deal' | 'campaign' | 'product',
    entityId: string
  ): Promise<PredictionResult> {
    try {
      console.log(`🔮 Generating prediction for ${entityType} ${entityId} using model ${modelId}`);
      
      // Get model details
      const { data: model, error: modelError } = await supabase
        .from('ai_models')
        .select('*')
        .eq('id', modelId)
        .single();

      if (modelError) throw modelError;

      if (model.status !== 'active') {
        throw new Error(`Model ${modelId} is not active`);
      }

      // Get entity data
      const entityData = await this.getEntityData(entityType, entityId);

      // Generate prediction using predictive engine
      const prediction = await this.predictiveEngine.generatePrediction({
        modelType: model.model_type,
        algorithm: model.algorithm,
        features: model.features,
        entityData
      });

      // Store prediction result
      const { data, error } = await supabase
        .from('predictive_analytics')
        .insert({
          model_id: modelId,
          entity_type: entityType,
          entity_id: entityId,
          prediction_type: model.model_type,
          prediction_data: {
            value: prediction.value,
            explanation: prediction.explanation,
            features_used: prediction.featuresUsed
          },
          confidence_score: prediction.confidence,
          model_version: model.version,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Prediction generated for ${entityType} ${entityId}`);
      
      return {
        id: data.id,
        model_id: modelId,
        entity_type: entityType,
        entity_id: entityId,
        prediction_type: model.model_type,
        prediction_value: prediction.value,
        confidence_score: prediction.confidence,
        explanation: prediction.explanation,
        features_used: prediction.featuresUsed,
        created_at: new Date(data.created_at),
        valid_until: new Date(data.expires_at)
      };

    } catch (error) {
      console.error('❌ Failed to generate prediction:', error);
      throw error;
    }
  }

  async getPredictions(
    entityType: 'contact' | 'deal' | 'campaign' | 'product',
    entityId: string,
    predictionType?: string
  ): Promise<PredictionResult[]> {
    try {
      let query = supabase
        .from('predictive_analytics')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .gt('expires_at', new Date().toISOString());

      if (predictionType) {
        query = query.eq('prediction_type', predictionType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        model_id: item.model_id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        prediction_type: item.prediction_type,
        prediction_value: item.prediction_data.value,
        confidence_score: item.confidence_score,
        explanation: item.prediction_data.explanation || [],
        features_used: item.prediction_data.features_used || {},
        created_at: new Date(item.created_at),
        valid_until: new Date(item.expires_at)
      }));

    } catch (error) {
      console.error('❌ Failed to get predictions:', error);
      throw error;
    }
  }

  private async getEntityData(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'contact':
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', entityId)
          .single();
        
        if (contactError) throw contactError;
        return contact;

      case 'deal':
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('id', entityId)
          .single();
        
        if (dealError) throw dealError;
        return deal;

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  // Batch Predictions
  async createPredictionBatch(
    userId: string,
    modelId: string,
    entityIds: string[]
  ): Promise<PredictionBatch> {
    try {
      console.log(`🔄 Creating prediction batch for ${entityIds.length} entities`);

      const { data, error } = await supabase
        .from('prediction_batches')
        .insert({
          user_id: userId,
          model_id: modelId,
          entity_ids: entityIds,
          status: 'queued',
          progress: 0,
          created_at: new Date().toISOString(),
          result_count: 0,
          error_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Start batch processing asynchronously
      this.processPredictionBatch(data.id).catch(err => {
        console.error(`Prediction batch ${data.id} failed:`, err);
      });

      console.log(`✅ Prediction batch created: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create prediction batch:', error);
      throw error;
    }
  }

  private async processPredictionBatch(batchId: string): Promise<void> {
    try {
      // Get batch details
      const { data: batch, error: batchError } = await supabase
        .from('prediction_batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;

      // Update batch status
      await supabase
        .from('prediction_batches')
        .update({
          status: 'processing',
          progress: 0
        })
        .eq('id', batchId);

      let successCount = 0;
      let errorCount = 0;
      const totalEntities = batch.entity_ids.length;

      // Process entities in batches of 10
      const batchSize = 10;
      for (let i = 0; i < totalEntities; i += batchSize) {
        const entityBatch = batch.entity_ids.slice(i, i + batchSize);
        
        await Promise.allSettled(
          entityBatch.map(async entityId => {
            try {
              await this.generatePrediction(batch.model_id, 'contact', entityId);
              successCount++;
            } catch (error) {
              console.error(`Failed to generate prediction for entity ${entityId}:`, error);
              errorCount++;
            }
          })
        );

        // Update progress
        const progress = Math.floor(((i + batchSize) / totalEntities) * 100);
        await supabase
          .from('prediction_batches')
          .update({
            progress: Math.min(progress, 100),
            result_count: successCount,
            error_count: errorCount
          })
          .eq('id', batchId);
      }

      // Complete batch
      await supabase
        .from('prediction_batches')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          result_count: successCount,
          error_count: errorCount
        })
        .eq('id', batchId);

      console.log(`✅ Prediction batch completed: ${batchId} (${successCount} success, ${errorCount} errors)`);

    } catch (error) {
      console.error(`❌ Prediction batch failed: ${batchId}`, error);

      // Update batch with error
      await supabase
        .from('prediction_batches')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);
    }
  }

  // Model Performance
  async getModelPerformance(modelId: string): Promise<ModelPerformanceMetrics> {
    try {
      // Get model predictions for performance analysis
      const { data: predictions, error } = await supabase
        .from('predictive_analytics')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      // Calculate performance metrics
      const predictionDistribution: Record<string, number> = {};
      const accuracyOverTime: Array<{ date: string; accuracy: number }> = [];

      predictions?.forEach(prediction => {
        const value = prediction.prediction_data.value;
        const key = typeof value === 'number' 
          ? value > 0.5 ? 'high' : 'low'
          : String(value);
        
        predictionDistribution[key] = (predictionDistribution[key] || 0) + 1;
      });

      // Mock feature importance (would be calculated from actual model)
      const featureImportance = [
        { feature: 'interaction_count', importance: 0.35 },
        { feature: 'days_since_last_interaction', importance: 0.28 },
        { feature: 'email_engagement', importance: 0.22 },
        { feature: 'company_size', importance: 0.15 }
      ];

      return {
        model_id: modelId,
        accuracy_over_time: accuracyOverTime,
        prediction_distribution: predictionDistribution,
        feature_importance: featureImportance
      };

    } catch (error) {
      console.error('❌ Failed to get model performance:', error);
      throw error;
    }
  }

  // Bulk Operations
  async bulkGeneratePredictions(
    userId: string,
    modelId: string,
    entityType: 'contact' | 'deal' | 'campaign' | 'product',
    entityIds: string[]
  ): Promise<void> {
    console.log(`🔮 Bulk generating predictions for ${entityIds.length} ${entityType}s...`);
    
    let processed = 0;
    const batchSize = 5;
    
    for (let i = 0; i < entityIds.length; i += batchSize) {
      const batch = entityIds.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(entityId => this.generatePrediction(modelId, entityType, entityId))
      );
      processed += batch.length;
      console.log(`📊 Progress: ${processed}/${entityIds.length} predictions generated`);
    }
    
    console.log(`✅ Bulk prediction generation completed for ${entityIds.length} entities`);
  }

  // Analytics and Insights
  async getPredictionInsights(userId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    total_predictions: number;
    accuracy_trend: number;
    top_models: Array<{ model_id: string; name: string; usage_count: number }>;
    prediction_types: Record<string, number>;
  }> {
    try {
      const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
      const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

      // Get predictions in timeframe
      const { data: predictions, error } = await supabase
        .from('predictive_analytics')
        .select('*, model:model_id(name)')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const totalPredictions = predictions?.length || 0;
      
      // Calculate prediction types distribution
      const predictionTypes: Record<string, number> = {};
      const modelUsage: Record<string, { name: string; count: number }> = {};

      predictions?.forEach(prediction => {
        predictionTypes[prediction.prediction_type] = (predictionTypes[prediction.prediction_type] || 0) + 1;
        
        const modelId = prediction.model_id;
        if (!modelUsage[modelId]) {
          modelUsage[modelId] = { name: prediction.model?.name || 'Unknown', count: 0 };
        }
        modelUsage[modelId].count++;
      });

      // Get top models
      const topModels = Object.entries(modelUsage)
        .map(([model_id, data]) => ({
          model_id,
          name: data.name,
          usage_count: data.count
        }))
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 5);

      return {
        total_predictions: totalPredictions,
        accuracy_trend: 0.85, // Mock accuracy trend
        top_models: topModels,
        prediction_types: predictionTypes
      };

    } catch (error) {
      console.error('❌ Failed to get prediction insights:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const predictiveAnalyticsService = PredictiveAnalyticsService.getInstance();
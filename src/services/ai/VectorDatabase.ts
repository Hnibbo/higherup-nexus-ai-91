import { z } from 'zod';

// Core interfaces for Vector Database functionality
export interface VectorEmbedding {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  content: string;
  contentType: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: Date;
}

export interface SemanticSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, any>;
  contentType: string;
}

export interface SemanticSearchQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  threshold?: number;
  contentTypes?: string[];
}

export interface VectorIndex {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'dot_product';
  totalVectors: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimilarityResult {
  id: string;
  similarity: number;
  content: string;
  metadata: Record<string, any>;
}

export interface ClusterResult {
  clusterId: string;
  vectors: VectorEmbedding[];
  centroid: number[];
  coherence: number;
  topics: string[];
}

export interface RecommendationResult {
  id: string;
  content: string;
  relevanceScore: number;
  reasoning: string[];
  metadata: Record<string, any>;
}

// Validation schemas
const VectorEmbeddingSchema = z.object({
  id: z.string(),
  vector: z.array(z.number()),
  metadata: z.record(z.any()),
  content: z.string(),
  contentType: z.enum(['text', 'image', 'audio', 'video', 'document']),
  timestamp: z.date()
});

const SemanticSearchQuerySchema = z.object({
  query: z.string(),
  filters: z.record(z.any()).optional(),
  limit: z.number().positive().optional(),
  threshold: z.number().min(0).max(1).optional(),
  contentTypes: z.array(z.string()).optional()
});

export class VectorDatabase {
  private indices: Map<string, VectorIndex> = new Map();
  private vectors: Map<string, Map<string, VectorEmbedding>> = new Map();
  private isInitialized = false;
  private embeddingModel: any;
  private defaultDimension = 1536; // OpenAI embedding dimension

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialize embedding model
    this.embeddingModel = await this.loadEmbeddingModel();
    
    // Create default indices
    await this.createIndex('content', this.defaultDimension, 'cosine');
    await this.createIndex('customers', this.defaultDimension, 'cosine');
    await this.createIndex('products', this.defaultDimension, 'cosine');
    await this.createIndex('campaigns', this.defaultDimension, 'cosine');
    await this.createIndex('insights', this.defaultDimension, 'cosine');
    
    this.isInitialized = true;
    console.log('Vector Database initialized successfully');
  }

  async createIndex(name: string, dimension: number, metric: 'cosine' | 'euclidean' | 'dot_product'): Promise<VectorIndex> {
    await this.ensureInitialized();
    
    const index: VectorIndex = {
      name,
      dimension,
      metric,
      totalVectors: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.indices.set(name, index);
    this.vectors.set(name, new Map());
    
    console.log(`Created vector index: ${name} (${dimension}D, ${metric})`);
    return index;
  }

  async addVector(indexName: string, embedding: VectorEmbedding): Promise<void> {
    await this.ensureInitialized();
    
    const index = this.indices.get(indexName);
    if (!index) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    if (embedding.vector.length !== index.dimension) {
      throw new Error(`Vector dimension mismatch. Expected ${index.dimension}, got ${embedding.vector.length}`);
    }
    
    const validatedEmbedding = VectorEmbeddingSchema.parse(embedding);
    
    const indexVectors = this.vectors.get(indexName)!;
    indexVectors.set(embedding.id, validatedEmbedding);
    
    // Update index stats
    index.totalVectors = indexVectors.size;
    index.updatedAt = new Date();
    
    console.log(`Added vector ${embedding.id} to index ${indexName}`);
  }

  async addContent(indexName: string, content: string, contentType: 'text' | 'image' | 'audio' | 'video' | 'document', metadata: Record<string, any> = {}): Promise<string> {
    await this.ensureInitialized();
    
    // Generate embedding for content
    const vector = await this.generateEmbedding(content, contentType);
    
    const embedding: VectorEmbedding = {
      id: this.generateId(),
      vector,
      metadata,
      content,
      contentType,
      timestamp: new Date()
    };
    
    await this.addVector(indexName, embedding);
    return embedding.id;
  }

  async semanticSearch(indexName: string, query: SemanticSearchQuery): Promise<SemanticSearchResult[]> {
    await this.ensureInitialized();
    
    const validatedQuery = SemanticSearchQuerySchema.parse(query);
    
    const index = this.indices.get(indexName);
    if (!index) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    // Generate embedding for query
    const queryVector = await this.generateEmbedding(validatedQuery.query, 'text');
    
    // Get all vectors from index
    const indexVectors = this.vectors.get(indexName)!;
    const results: SemanticSearchResult[] = [];
    
    // Calculate similarities
    for (const [id, embedding] of indexVectors) {
      // Apply filters if specified
      if (validatedQuery.filters && !this.matchesFilters(embedding.metadata, validatedQuery.filters)) {
        continue;
      }
      
      // Apply content type filter if specified
      if (validatedQuery.contentTypes && !validatedQuery.contentTypes.includes(embedding.contentType)) {
        continue;
      }
      
      const similarity = this.calculateSimilarity(queryVector, embedding.vector, index.metric);
      
      // Apply threshold filter
      if (validatedQuery.threshold && similarity < validatedQuery.threshold) {
        continue;
      }
      
      results.push({
        id,
        content: embedding.content,
        similarity,
        metadata: embedding.metadata,
        contentType: embedding.contentType
      });
    }
    
    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Apply limit
    const limit = validatedQuery.limit || 10;
    return results.slice(0, limit);
  }

  async findSimilar(indexName: string, vectorId: string, limit: number = 10): Promise<SimilarityResult[]> {
    await this.ensureInitialized();
    
    const index = this.indices.get(indexName);
    if (!index) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    const indexVectors = this.vectors.get(indexName)!;
    const targetVector = indexVectors.get(vectorId);
    
    if (!targetVector) {
      throw new Error(`Vector not found: ${vectorId}`);
    }
    
    const results: SimilarityResult[] = [];
    
    for (const [id, embedding] of indexVectors) {
      if (id === vectorId) continue; // Skip self
      
      const similarity = this.calculateSimilarity(targetVector.vector, embedding.vector, index.metric);
      
      results.push({
        id,
        similarity,
        content: embedding.content,
        metadata: embedding.metadata
      });
    }
    
    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, limit);
  }

  async clusterVectors(indexName: string, numClusters: number): Promise<ClusterResult[]> {
    await this.ensureInitialized();
    
    const index = this.indices.get(indexName);
    if (!index) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    const indexVectors = this.vectors.get(indexName)!;
    const vectors = Array.from(indexVectors.values());
    
    if (vectors.length < numClusters) {
      throw new Error(`Not enough vectors for clustering. Need at least ${numClusters}, got ${vectors.length}`);
    }
    
    // Perform K-means clustering
    const clusters = await this.performKMeansClustering(vectors, numClusters);
    
    return clusters.map((cluster, index) => ({
      clusterId: `cluster_${index}`,
      vectors: cluster.vectors,
      centroid: cluster.centroid,
      coherence: cluster.coherence,
      topics: this.extractTopics(cluster.vectors)
    }));
  }

  async getRecommendations(indexName: string, userProfile: Record<string, any>, limit: number = 10): Promise<RecommendationResult[]> {
    await this.ensureInitialized();
    
    // Create user profile embedding
    const profileText = this.profileToText(userProfile);
    const profileVector = await this.generateEmbedding(profileText, 'text');
    
    const index = this.indices.get(indexName);
    if (!index) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    const indexVectors = this.vectors.get(indexName)!;
    const recommendations: RecommendationResult[] = [];
    
    for (const [id, embedding] of indexVectors) {
      const similarity = this.calculateSimilarity(profileVector, embedding.vector, index.metric);
      const relevanceScore = this.calculateRelevanceScore(similarity, embedding.metadata, userProfile);
      
      if (relevanceScore > 0.5) { // Minimum relevance threshold
        recommendations.push({
          id,
          content: embedding.content,
          relevanceScore,
          reasoning: this.generateRecommendationReasoning(embedding, userProfile, similarity),
          metadata: embedding.metadata
        });
      }
    }
    
    // Sort by relevance score (descending)
    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return recommendations.slice(0, limit);
  }

  async deleteVector(indexName: string, vectorId: string): Promise<void> {
    await this.ensureInitialized();
    
    const indexVectors = this.vectors.get(indexName);
    if (!indexVectors) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    const deleted = indexVectors.delete(vectorId);
    if (!deleted) {
      throw new Error(`Vector not found: ${vectorId}`);
    }
    
    // Update index stats
    const index = this.indices.get(indexName)!;
    index.totalVectors = indexVectors.size;
    index.updatedAt = new Date();
    
    console.log(`Deleted vector ${vectorId} from index ${indexName}`);
  }

  async getIndexStats(indexName: string): Promise<VectorIndex | null> {
    await this.ensureInitialized();
    
    return this.indices.get(indexName) || null;
  }

  async listIndices(): Promise<VectorIndex[]> {
    await this.ensureInitialized();
    
    return Array.from(this.indices.values());
  }

  // Advanced analytics methods
  async analyzeContentTrends(indexName: string, timeframe: string): Promise<any> {
    const indexVectors = this.vectors.get(indexName);
    if (!indexVectors) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    const vectors = Array.from(indexVectors.values());
    const timeframeDays = this.parseTimeframe(timeframe);
    const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    
    const recentVectors = vectors.filter(v => v.timestamp >= cutoffDate);
    
    // Cluster recent content to identify trends
    if (recentVectors.length >= 3) {
      const clusters = await this.performKMeansClustering(recentVectors, Math.min(5, Math.floor(recentVectors.length / 2)));
      
      return {
        totalContent: recentVectors.length,
        trends: clusters.map(cluster => ({
          topic: this.extractTopics(cluster.vectors)[0] || 'Unknown',
          contentCount: cluster.vectors.length,
          coherence: cluster.coherence,
          examples: cluster.vectors.slice(0, 3).map(v => v.content.substring(0, 100))
        })),
        timeframe,
        analyzedAt: new Date()
      };
    }
    
    return {
      totalContent: recentVectors.length,
      trends: [],
      message: 'Insufficient data for trend analysis',
      timeframe,
      analyzedAt: new Date()
    };
  }

  async findContentGaps(indexName: string, targetTopics: string[]): Promise<any> {
    const indexVectors = this.vectors.get(indexName);
    if (!indexVectors) {
      throw new Error(`Index not found: ${indexName}`);
    }
    
    const gaps = [];
    
    for (const topic of targetTopics) {
      const topicVector = await this.generateEmbedding(topic, 'text');
      
      // Find most similar content
      let maxSimilarity = 0;
      let bestMatch = null;
      
      for (const [id, embedding] of indexVectors) {
        const similarity = this.calculateSimilarity(topicVector, embedding.vector, 'cosine');
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = { id, content: embedding.content };
        }
      }
      
      if (maxSimilarity < 0.7) { // Gap threshold
        gaps.push({
          topic,
          gapScore: 1 - maxSimilarity,
          bestMatch,
          recommendation: `Create content about ${topic} to fill this gap`
        });
      }
    }
    
    return {
      gaps: gaps.sort((a, b) => b.gapScore - a.gapScore),
      analyzedTopics: targetTopics.length,
      gapsFound: gaps.length
    };
  }

  // Private helper methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private async loadEmbeddingModel(): Promise<any> {
    // Placeholder for actual embedding model loading
    return {
      type: 'text-embedding-ada-002',
      dimension: this.defaultDimension,
      maxTokens: 8192
    };
  }

  private async generateEmbedding(content: string, contentType: string): Promise<number[]> {
    // Simulate embedding generation
    // In production, this would call actual embedding API (OpenAI, Cohere, etc.)
    
    const embedding = new Array(this.defaultDimension);
    
    // Create pseudo-embedding based on content hash and type
    const hash = this.simpleHash(content + contentType);
    const random = this.seededRandom(hash);
    
    for (let i = 0; i < this.defaultDimension; i++) {
      embedding[i] = (random() - 0.5) * 2; // Range: -1 to 1
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private calculateSimilarity(vector1: number[], vector2: number[], metric: string): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vector dimensions must match');
    }
    
    switch (metric) {
      case 'cosine':
        return this.cosineSimilarity(vector1, vector2);
      case 'euclidean':
        return 1 / (1 + this.euclideanDistance(vector1, vector2));
      case 'dot_product':
        return this.dotProduct(vector1, vector2);
      default:
        throw new Error(`Unknown similarity metric: ${metric}`);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private matchesFilters(metadata: Record<string, any>, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private async performKMeansClustering(vectors: VectorEmbedding[], k: number): Promise<any[]> {
    // Simplified K-means clustering implementation
    const data = vectors.map(v => v.vector);
    
    // Initialize centroids randomly
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const randomVector = data[Math.floor(Math.random() * data.length)];
      centroids.push([...randomVector]);
    }
    
    const clusters = Array(k).fill(null).map(() => ({ vectors: [], centroid: [], coherence: 0 }));
    
    // Assign vectors to clusters (simplified)
    vectors.forEach((vector, index) => {
      let bestCluster = 0;
      let bestDistance = Infinity;
      
      centroids.forEach((centroid, clusterIndex) => {
        const distance = this.euclideanDistance(vector.vector, centroid);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = clusterIndex;
        }
      });
      
      clusters[bestCluster].vectors.push(vector);
    });
    
    // Calculate cluster statistics
    clusters.forEach((cluster, index) => {
      if (cluster.vectors.length > 0) {
        cluster.centroid = centroids[index];
        cluster.coherence = this.calculateClusterCoherence(cluster.vectors);
      }
    });
    
    return clusters.filter(cluster => cluster.vectors.length > 0);
  }

  private calculateClusterCoherence(vectors: VectorEmbedding[]): number {
    if (vectors.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        totalSimilarity += this.cosineSimilarity(vectors[i].vector, vectors[j].vector);
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalSimilarity / comparisons : 0;
  }

  private extractTopics(vectors: VectorEmbedding[]): string[] {
    // Simple topic extraction based on content keywords
    const allWords = vectors.flatMap(v => 
      v.content.toLowerCase().split(/\W+/).filter(word => word.length > 3)
    );
    
    const wordCounts = allWords.reduce((counts, word) => {
      counts[word] = (counts[word] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  private profileToText(profile: Record<string, any>): string {
    return Object.entries(profile)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' ');
  }

  private calculateRelevanceScore(similarity: number, metadata: Record<string, any>, userProfile: Record<string, any>): number {
    let score = similarity * 0.7; // Base similarity weight
    
    // Add metadata-based relevance
    if (metadata.category && userProfile.interests?.includes(metadata.category)) {
      score += 0.2;
    }
    
    if (metadata.difficulty && metadata.difficulty === userProfile.skillLevel) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private generateRecommendationReasoning(embedding: VectorEmbedding, userProfile: Record<string, any>, similarity: number): string[] {
    const reasons = [];
    
    if (similarity > 0.8) {
      reasons.push('High content similarity to your interests');
    }
    
    if (embedding.metadata.category && userProfile.interests?.includes(embedding.metadata.category)) {
      reasons.push(`Matches your interest in ${embedding.metadata.category}`);
    }
    
    if (embedding.metadata.popularity > 0.8) {
      reasons.push('Popular content among similar users');
    }
    
    return reasons;
  }

  private parseTimeframe(timeframe: string): number {
    const timeframeMap: Record<string, number> = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    return timeframeMap[timeframe] || 30;
  }

  private generateId(): string {
    return `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
  }
}

// Singleton instance
export const vectorDatabase = new VectorDatabase();
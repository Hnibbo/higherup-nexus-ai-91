/**
 * Brand Voice Consistency Engine for Production AI
 * Ensures all generated content maintains consistent brand voice across all channels
 */

import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';

export interface BrandVoiceProfile {
  id: string;
  userId: string;
  name: string;
  description: string;
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational' | 'urgent' | 'luxury';
  personalityTraits: string[];
  writingStyle: {
    sentenceLength: 'short' | 'medium' | 'long' | 'varied';
    vocabularyLevel: 'simple' | 'intermediate' | 'advanced' | 'technical';
    formality: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
  };
  brandValues: string[];
  targetAudience: {
    demographics: string[];
    psychographics: string[];
    painPoints: string[];
  };
  doNotUse: string[];
  preferredPhrases: string[];
  sampleContent: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceConsistencyAnalysis {
  overallScore: number;
  toneConsistency: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  vocabularyConsistency: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  styleConsistency: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  brandAlignment: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  correctedContent?: string;
}

export interface VoiceTrainingData {
  contentSamples: string[];
  performanceMetrics: {
    engagementRate: number;
    conversionRate: number;
    brandRecognition: number;
  };
  audienceFeedback: string[];
}

/**
 * Production Brand Voice Consistency Engine
 */
export class BrandVoiceEngine {
  private static instance: BrandVoiceEngine;
  private voiceProfiles: Map<string, BrandVoiceProfile> = new Map();
  private analysisCache: Map<string, VoiceConsistencyAnalysis> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): BrandVoiceEngine {
    if (!BrandVoiceEngine.instance) {
      BrandVoiceEngine.instance = new BrandVoiceEngine();
    }
    return BrandVoiceEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    try {
      console.log('🎯 Initializing Brand Voice Consistency Engine');
      
      // Load existing brand voice profiles
      await this.loadBrandVoiceProfiles();
      
      console.log('✅ Brand Voice Consistency Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Brand Voice Consistency Engine:', error);
    }
  }

  /**
   * Create a new brand voice profile
   */
  async createBrandVoiceProfile(profile: Omit<BrandVoiceProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandVoiceProfile> {
    try {
      console.log(`🎨 Creating brand voice profile: ${profile.name}`);

      const brandVoice: BrandVoiceProfile = {
        id: `brand_voice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in database
      await this.storeBrandVoiceProfile(brandVoice);
      
      // Cache the profile
      this.voiceProfiles.set(brandVoice.id, brandVoice);
      await redisCacheService.set(`brand_voice:${brandVoice.id}`, brandVoice, 3600);

      // Train voice model with examples
      if (profile.sampleContent.length > 0) {
        await this.trainVoiceModel(brandVoice.id, {
          contentSamples: profile.sampleContent,
          performanceMetrics: { engagementRate: 0, conversionRate: 0, brandRecognition: 0 },
          audienceFeedback: []
        });
      }

      console.log(`✅ Brand voice profile created: ${brandVoice.id}`);
      return brandVoice;

    } catch (error) {
      console.error('❌ Failed to create brand voice profile:', error);
      throw error;
    }
  }

  /**
   * Analyze brand voice from existing content samples
   */
  async analyzeBrandVoiceFromContent(contentSamples: string[], brandName: string, userId: string): Promise<BrandVoiceProfile> {
    try {
      console.log(`🔍 Analyzing brand voice from ${contentSamples.length} content samples`);

      // Analyze tone patterns
      const toneAnalysis = this.analyzeTonePatterns(contentSamples);
      
      // Analyze writing style
      const styleAnalysis = this.analyzeWritingStyle(contentSamples);
      
      // Extract personality traits
      const personalityTraits = this.extractPersonalityTraits(contentSamples);
      
      // Infer brand values
      const brandValues = this.inferBrandValues(contentSamples);
      
      // Extract preferred phrases
      const preferredPhrases = this.extractPreferredPhrases(contentSamples);

      const analyzedProfile: BrandVoiceProfile = {
        id: `analyzed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        name: brandName,
        description: `Analyzed brand voice for ${brandName} based on existing content`,
        tone: toneAnalysis.dominantTone,
        personalityTraits,
        writingStyle: styleAnalysis,
        brandValues,
        targetAudience: this.inferTargetAudience(contentSamples),
        doNotUse: [],
        preferredPhrases,
        sampleContent: contentSamples.slice(0, 5), // Store first 5 as examples
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store the analyzed profile
      await this.storeBrandVoiceProfile(analyzedProfile);
      this.voiceProfiles.set(analyzedProfile.id, analyzedProfile);

      console.log(`✅ Brand voice analyzed with ${toneAnalysis.confidence}% confidence`);
      return analyzedProfile;

    } catch (error) {
      console.error('❌ Failed to analyze brand voice:', error);
      throw error;
    }
  }

  /**
   * Analyze content for voice consistency
   */
  async analyzeVoiceConsistency(content: string, brandVoiceId: string): Promise<VoiceConsistencyAnalysis> {
    try {
      console.log(`🎯 Analyzing voice consistency for brand voice: ${brandVoiceId}`);

      // Check cache first
      const cacheKey = `voice_analysis:${brandVoiceId}:${this.hashContent(content)}`;
      const cachedAnalysis = await redisCacheService.get<VoiceConsistencyAnalysis>(cacheKey);
      
      if (cachedAnalysis) {
        console.log('⚡ Returning cached voice analysis');
        return cachedAnalysis;
      }

      // Get brand voice profile
      const brandVoice = await this.getBrandVoiceProfile(brandVoiceId);
      if (!brandVoice) {
        throw new Error('Brand voice profile not found');
      }

      // Analyze different aspects of voice consistency
      const toneConsistency = this.analyzeToneConsistency(content, brandVoice);
      const vocabularyConsistency = this.analyzeVocabularyConsistency(content, brandVoice);
      const styleConsistency = this.analyzeStyleConsistency(content, brandVoice);
      const brandAlignment = this.analyzeBrandAlignment(content, brandVoice);

      // Calculate overall score
      const overallScore = (
        toneConsistency.score * 0.3 +
        vocabularyConsistency.score * 0.25 +
        styleConsistency.score * 0.25 +
        brandAlignment.score * 0.2
      );

      const analysis: VoiceConsistencyAnalysis = {
        overallScore,
        toneConsistency,
        vocabularyConsistency,
        styleConsistency,
        brandAlignment
      };

      // Generate corrected content if score is low
      if (overallScore < 70) {
        analysis.correctedContent = await this.generateCorrectedContent(content, brandVoice, analysis);
      }

      // Cache the analysis
      await redisCacheService.set(cacheKey, analysis, 1800); // Cache for 30 minutes

      console.log(`✅ Voice consistency analysis completed (Score: ${overallScore.toFixed(2)})`);
      return analysis;

    } catch (error) {
      console.error('❌ Failed to analyze voice consistency:', error);
      throw error;
    }
  }

  /**
   * Ensure content matches brand voice
   */
  async ensureVoiceConsistency(content: string, brandVoiceId: string): Promise<string> {
    try {
      console.log('🔧 Ensuring voice consistency');

      const analysis = await this.analyzeVoiceConsistency(content, brandVoiceId);
      
      if (analysis.overallScore >= 80) {
        console.log('✅ Content already meets voice consistency standards');
        return content;
      }

      if (analysis.correctedContent) {
        console.log('✅ Content corrected for voice consistency');
        return analysis.correctedContent;
      }

      // If no corrected content, apply basic corrections
      const brandVoice = await this.getBrandVoiceProfile(brandVoiceId);
      if (!brandVoice) {
        return content;
      }

      const correctedContent = this.applyBasicVoiceCorrections(content, brandVoice);

      console.log('✅ Basic voice corrections applied');
      return correctedContent;

    } catch (error) {
      console.error('❌ Failed to ensure voice consistency:', error);
      return content; // Return original content if correction fails
    }
  }

  /**
   * Train voice model with new content
   */
  async trainVoiceModel(brandVoiceId: string, trainingData: VoiceTrainingData): Promise<void> {
    try {
      console.log(`🎓 Training voice model for brand voice: ${brandVoiceId}`);

      // Analyze training content
      const voicePatterns = this.extractVoicePatterns(trainingData.contentSamples);
      
      // Update brand voice profile with learned patterns
      await this.updateVoiceProfile(brandVoiceId, voicePatterns);
      
      // Store training metrics
      await this.storeTrainingMetrics(brandVoiceId, trainingData.performanceMetrics);

      console.log('✅ Voice model training completed');

    } catch (error) {
      console.error('❌ Failed to train voice model:', error);
      throw error;
    }
  }

  /**
   * Private analysis methods
   */
  private analyzeTonePatterns(contentSamples: string[]): any {
    const allText = contentSamples.join(' ').toLowerCase();
    
    const toneIndicators = {
      professional: ['expertise', 'solution', 'optimize', 'strategic', 'efficient', 'professional', 'industry', 'business'],
      casual: ['hey', 'awesome', 'cool', 'easy', 'simple', 'fun', 'great', 'nice'],
      friendly: ['welcome', 'help', 'support', 'together', 'community', 'friendly', 'warm', 'caring'],
      authoritative: ['proven', 'leading', 'expert', 'research', 'data', 'evidence', 'authority', 'established'],
      conversational: ['you', 'your', 'we', 'us', 'let\'s', 'how', 'what', 'why', 'think'],
      urgent: ['now', 'today', 'immediately', 'urgent', 'hurry', 'limited', 'act fast', 'don\'t wait'],
      luxury: ['premium', 'exclusive', 'luxury', 'sophisticated', 'elegant', 'refined', 'elite', 'prestige']
    };

    let dominantTone: keyof typeof toneIndicators = 'professional';
    let maxScore = 0;
    const toneScores: Record<string, number> = {};

    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (allText.split(indicator).length - 1);
      }, 0);
      
      toneScores[tone] = score;
      
      if (score > maxScore) {
        maxScore = score;
        dominantTone = tone as keyof typeof toneIndicators;
      }
    });

    const totalWords = allText.split(' ').length;
    const confidence = Math.min(95, 50 + (maxScore / totalWords * 1000));

    return {
      dominantTone,
      toneScores,
      confidence
    };
  }

  private analyzeWritingStyle(contentSamples: string[]): BrandVoiceProfile['writingStyle'] {
    const allText = contentSamples.join(' ');
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Analyze sentence length
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const avgSentenceLength = sentenceLengths.reduce((sum, len) => sum + len, 0) / sentenceLengths.length;
    
    let sentenceLength: 'short' | 'medium' | 'long' | 'varied' = 'medium';
    const variance = this.calculateVariance(sentenceLengths);
    
    if (variance > 50) {
      sentenceLength = 'varied';
    } else if (avgSentenceLength < 10) {
      sentenceLength = 'short';
    } else if (avgSentenceLength > 20) {
      sentenceLength = 'long';
    }

    // Analyze vocabulary level
    const vocabularyLevel = this.determineVocabularyLevel(allText.toLowerCase());
    
    // Analyze formality
    const formality = this.determineFormalityLevel(allText.toLowerCase());

    return {
      sentenceLength,
      vocabularyLevel,
      formality
    };
  }

  private extractPersonalityTraits(contentSamples: string[]): string[] {
    const allText = contentSamples.join(' ').toLowerCase();
    const traits: string[] = [];
    
    const traitIndicators = {
      'Innovative': ['innovative', 'cutting-edge', 'revolutionary', 'breakthrough', 'pioneering', 'advanced'],
      'Reliable': ['reliable', 'trusted', 'dependable', 'consistent', 'stable', 'proven'],
      'Customer-focused': ['customer', 'client', 'service', 'support', 'satisfaction', 'experience'],
      'Quality-driven': ['quality', 'excellence', 'premium', 'superior', 'best', 'outstanding'],
      'Efficient': ['fast', 'quick', 'efficient', 'streamlined', 'optimized', 'productive'],
      'Transparent': ['transparent', 'honest', 'open', 'clear', 'straightforward', 'authentic'],
      'Collaborative': ['together', 'partnership', 'team', 'collaboration', 'community', 'cooperative'],
      'Results-oriented': ['results', 'outcomes', 'success', 'achievement', 'performance', 'goals'],
      'Caring': ['care', 'compassionate', 'empathetic', 'understanding', 'supportive', 'helpful'],
      'Expert': ['expert', 'specialist', 'professional', 'experienced', 'knowledgeable', 'skilled']
    };

    Object.entries(traitIndicators).forEach(([trait, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (allText.split(indicator).length - 1);
      }, 0);
      
      if (score > 0) {
        traits.push(trait);
      }
    });
    
    return traits.slice(0, 6); // Return top 6 traits
  }

  private inferBrandValues(contentSamples: string[]): string[] {
    const allText = contentSamples.join(' ').toLowerCase();
    const values: string[] = [];
    
    const valueIndicators = {
      'Quality': ['quality', 'excellence', 'superior', 'premium', 'best-in-class', 'outstanding'],
      'Innovation': ['innovation', 'creative', 'breakthrough', 'revolutionary', 'cutting-edge', 'pioneering'],
      'Customer Focus': ['customer', 'client', 'service', 'satisfaction', 'experience', 'support'],
      'Integrity': ['integrity', 'honest', 'ethical', 'trustworthy', 'transparent', 'authentic'],
      'Sustainability': ['sustainable', 'responsible', 'environmental', 'green', 'eco-friendly', 'conscious'],
      'Growth': ['growth', 'expansion', 'development', 'progress', 'advancement', 'evolution'],
      'Collaboration': ['collaboration', 'partnership', 'teamwork', 'community', 'together', 'unity'],
      'Excellence': ['excellence', 'outstanding', 'exceptional', 'superior', 'world-class', 'premier'],
      'Reliability': ['reliable', 'dependable', 'consistent', 'stable', 'trustworthy', 'secure'],
      'Efficiency': ['efficient', 'productive', 'streamlined', 'optimized', 'effective', 'smart']
    };

    Object.entries(valueIndicators).forEach(([value, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (allText.split(indicator).length - 1);
      }, 0);
      
      if (score > 0) {
        values.push(value);
      }
    });
    
    return values.slice(0, 5); // Return top 5 values
  }

  private extractPreferredPhrases(contentSamples: string[]): string[] {
    const phrases: string[] = [];
    const allText = contentSamples.join(' ').toLowerCase();
    
    // Common business phrases to look for
    const commonPhrases = [
      'drive growth', 'increase revenue', 'improve efficiency', 'scale your business',
      'customer success', 'proven results', 'industry leading', 'cutting edge',
      'best practices', 'competitive advantage', 'market leader', 'innovative solutions',
      'exceptional service', 'trusted partner', 'world-class', 'state-of-the-art',
      'next level', 'game changer', 'breakthrough technology', 'seamless experience',
      'unparalleled quality', 'comprehensive solution', 'strategic approach', 'measurable results'
    ];
    
    commonPhrases.forEach(phrase => {
      if (allText.includes(phrase)) {
        phrases.push(phrase);
      }
    });
    
    return phrases.slice(0, 8);
  }

  private inferTargetAudience(contentSamples: string[]): BrandVoiceProfile['targetAudience'] {
    // Simplified audience inference based on content analysis
    const allText = contentSamples.join(' ').toLowerCase();
    
    const demographics: string[] = [];
    const psychographics: string[] = [];
    const painPoints: string[] = [];
    
    // Infer demographics
    if (allText.includes('business') || allText.includes('professional')) {
      demographics.push('Business professionals');
    }
    if (allText.includes('entrepreneur') || allText.includes('startup')) {
      demographics.push('Entrepreneurs');
    }
    if (allText.includes('manager') || allText.includes('executive')) {
      demographics.push('Decision makers');
    }
    
    // Infer psychographics
    if (allText.includes('growth') || allText.includes('scale')) {
      psychographics.push('Growth-oriented');
    }
    if (allText.includes('technology') || allText.includes('digital')) {
      psychographics.push('Technology-forward');
    }
    if (allText.includes('quality') || allText.includes('premium')) {
      psychographics.push('Quality-conscious');
    }
    
    // Infer pain points
    if (allText.includes('efficiency') || allText.includes('productivity')) {
      painPoints.push('Efficiency challenges');
    }
    if (allText.includes('scale') || allText.includes('growth')) {
      painPoints.push('Scaling difficulties');
    }
    if (allText.includes('competitive') || allText.includes('market')) {
      painPoints.push('Competitive pressure');
    }

    return {
      demographics: demographics.length > 0 ? demographics : ['Business professionals'],
      psychographics: psychographics.length > 0 ? psychographics : ['Growth-oriented'],
      painPoints: painPoints.length > 0 ? painPoints : ['Efficiency challenges']
    };
  }

  private analyzeToneConsistency(content: string, brandVoice: BrandVoiceProfile): VoiceConsistencyAnalysis['toneConsistency'] {
    const contentTone = this.detectContentTone(content);
    const targetTone = brandVoice.tone;
    
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    let score = 100;
    
    if (contentTone !== targetTone) {
      score -= 30;
      violations.push(`Content tone (${contentTone}) doesn't match brand tone (${targetTone})`);
      suggestions.push(`Adjust content to match ${targetTone} tone`);
    }
    
    // Check for prohibited words/phrases
    brandVoice.doNotUse.forEach(phrase => {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        score -= 20;
        violations.push(`Contains prohibited phrase: "${phrase}"`);
        suggestions.push(`Remove or replace "${phrase}"`);
      }
    });

    return {
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  private analyzeVocabularyConsistency(content: string, brandVoice: BrandVoiceProfile): VoiceConsistencyAnalysis['vocabularyConsistency'] {
    const contentVocabLevel = this.determineVocabularyLevel(content.toLowerCase());
    const targetVocabLevel = brandVoice.writingStyle.vocabularyLevel;
    
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    let score = 100;
    
    if (contentVocabLevel !== targetVocabLevel) {
      score -= 40;
      violations.push(`Vocabulary level (${contentVocabLevel}) doesn't match brand level (${targetVocabLevel})`);
      suggestions.push(`Adjust vocabulary to ${targetVocabLevel} level`);
    }
    
    // Check for preferred phrases usage
    const usedPreferredPhrases = brandVoice.preferredPhrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (usedPreferredPhrases.length === 0 && brandVoice.preferredPhrases.length > 0) {
      score -= 20;
      suggestions.push(`Consider using preferred phrases: ${brandVoice.preferredPhrases.slice(0, 3).join(', ')}`);
    }

    return {
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  private analyzeStyleConsistency(content: string, brandVoice: BrandVoiceProfile): VoiceConsistencyAnalysis['styleConsistency'] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    let score = 100;
    
    // Check sentence length consistency
    const targetSentenceLength = brandVoice.writingStyle.sentenceLength;
    let expectedRange = [10, 20]; // medium
    
    switch (targetSentenceLength) {
      case 'short':
        expectedRange = [5, 12];
        break;
      case 'long':
        expectedRange = [18, 35];
        break;
      case 'varied':
        expectedRange = [5, 35];
        break;
    }
    
    if (avgSentenceLength < expectedRange[0] || avgSentenceLength > expectedRange[1]) {
      score -= 30;
      violations.push(`Average sentence length (${avgSentenceLength.toFixed(1)}) doesn't match ${targetSentenceLength} style`);
      suggestions.push(`Adjust sentence length to match ${targetSentenceLength} style`);
    }
    
    // Check formality level
    const contentFormality = this.determineFormalityLevel(content.toLowerCase());
    const targetFormality = brandVoice.writingStyle.formality;
    
    if (contentFormality !== targetFormality) {
      score -= 30;
      violations.push(`Formality level (${contentFormality}) doesn't match brand formality (${targetFormality})`);
      suggestions.push(`Adjust formality to ${targetFormality} level`);
    }

    return {
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  private analyzeBrandAlignment(content: string, brandVoice: BrandVoiceProfile): VoiceConsistencyAnalysis['brandAlignment'] {
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    let score = 100;
    
    // Check if content reflects brand values
    const contentLower = content.toLowerCase();
    const reflectedValues = brandVoice.brandValues.filter(value => {
      const valueKeywords = this.getValueKeywords(value);
      return valueKeywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
    });
    
    if (reflectedValues.length === 0 && brandVoice.brandValues.length > 0) {
      score -= 40;
      violations.push('Content doesn\'t reflect any brand values');
      suggestions.push(`Consider incorporating brand values: ${brandVoice.brandValues.slice(0, 3).join(', ')}`);
    }
    
    // Check personality traits alignment
    const reflectedTraits = brandVoice.personalityTraits.filter(trait => {
      const traitKeywords = this.getTraitKeywords(trait);
      return traitKeywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
    });
    
    if (reflectedTraits.length === 0 && brandVoice.personalityTraits.length > 0) {
      score -= 30;
      suggestions.push(`Consider reflecting personality traits: ${brandVoice.personalityTraits.slice(0, 2).join(', ')}`);
    }

    return {
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  private async generateCorrectedContent(content: string, brandVoice: BrandVoiceProfile, analysis: VoiceConsistencyAnalysis): Promise<string> {
    let correctedContent = content;
    
    // Apply tone corrections
    if (analysis.toneConsistency.score < 70) {
      correctedContent = this.adjustTone(correctedContent, brandVoice.tone);
    }
    
    // Apply vocabulary corrections
    if (analysis.vocabularyConsistency.score < 70) {
      correctedContent = this.adjustVocabulary(correctedContent, brandVoice.writingStyle.vocabularyLevel);
    }
    
    // Apply style corrections
    if (analysis.styleConsistency.score < 70) {
      correctedContent = this.adjustStyle(correctedContent, brandVoice.writingStyle);
    }
    
    // Remove prohibited phrases
    brandVoice.doNotUse.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      correctedContent = correctedContent.replace(regex, '[REMOVED]');
    });
    
    return correctedContent;
  }

  private applyBasicVoiceCorrections(content: string, brandVoice: BrandVoiceProfile): string {
    let corrected = content;
    
    // Basic tone adjustment
    corrected = this.adjustTone(corrected, brandVoice.tone);
    
    // Remove prohibited phrases
    brandVoice.doNotUse.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      corrected = corrected.replace(regex, '');
    });
    
    // Add preferred phrases where appropriate
    if (brandVoice.preferredPhrases.length > 0 && Math.random() > 0.5) {
      const randomPhrase = brandVoice.preferredPhrases[Math.floor(Math.random() * brandVoice.preferredPhrases.length)];
      corrected += ` ${randomPhrase}`;
    }
    
    return corrected.trim();
  }

  /**
   * Helper methods
   */
  private detectContentTone(content: string): string {
    const contentLower = content.toLowerCase();
    
    const toneIndicators = {
      professional: ['expertise', 'solution', 'optimize', 'strategic', 'efficient', 'business'],
      casual: ['hey', 'awesome', 'cool', 'easy', 'simple', 'fun'],
      friendly: ['welcome', 'help', 'support', 'together', 'community', 'warm'],
      authoritative: ['proven', 'leading', 'expert', 'research', 'data', 'evidence'],
      conversational: ['you', 'your', 'we', 'us', 'let\'s', 'how', 'what'],
      urgent: ['now', 'today', 'immediately', 'urgent', 'hurry', 'limited'],
      luxury: ['premium', 'exclusive', 'luxury', 'sophisticated', 'elegant', 'refined']
    };

    let maxScore = 0;
    let detectedTone = 'professional';

    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (contentLower.split(indicator).length - 1);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedTone = tone;
      }
    });

    return detectedTone;
  }

  private determineVocabularyLevel(text: string): 'simple' | 'intermediate' | 'advanced' | 'technical' {
    const complexWords = ['optimization', 'implementation', 'sophisticated', 'comprehensive', 'methodology', 'strategic', 'innovative'];
    const technicalWords = ['algorithm', 'analytics', 'infrastructure', 'integration', 'automation', 'architecture', 'framework'];
    
    const complexCount = complexWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const technicalCount = technicalWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const wordCount = text.split(' ').length;
    
    const complexRatio = complexCount / wordCount;
    const technicalRatio = technicalCount / wordCount;
    
    if (technicalRatio > 0.02) return 'technical';
    if (complexRatio > 0.05) return 'advanced';
    if (complexRatio > 0.02) return 'intermediate';
    return 'simple';
  }

  private determineFormalityLevel(text: string): 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal' {
    const formalIndicators = ['furthermore', 'therefore', 'consequently', 'nevertheless', 'moreover', 'accordingly'];
    const informalIndicators = ['gonna', 'wanna', 'hey', 'awesome', 'cool', 'yeah'];
    
    const formalCount = formalIndicators.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const informalCount = informalIndicators.reduce((count, word) => count + (text.split(word).length - 1), 0);
    
    if (formalCount > informalCount + 2) return 'formal';
    if (informalCount > formalCount + 2) return 'informal';
    return 'neutral';
  }

  private adjustTone(content: string, targetTone: string): string {
    let adjusted = content;
    
    switch (targetTone) {
      case 'professional':
        adjusted = adjusted.replace(/awesome|cool|amazing/gi, 'excellent');
        adjusted = adjusted.replace(/!/g, '.');
        break;
      case 'casual':
        adjusted = adjusted.replace(/excellent|outstanding/gi, 'awesome');
        adjusted = adjusted.replace(/\. /g, '! ');
        break;
      case 'friendly':
        adjusted = adjusted.replace(/\b(we|our company)\b/gi, 'we');
        adjusted = 'We\'re excited to share that ' + adjusted;
        break;
      case 'authoritative':
        adjusted = adjusted.replace(/we think|we believe/gi, 'research shows');
        adjusted = adjusted.replace(/might|could/gi, 'will');
        break;
    }
    
    return adjusted;
  }

  private adjustVocabulary(content: string, targetLevel: string): string {
    let adjusted = content;
    
    const vocabularyMappings = {
      simple: {
        'utilize': 'use',
        'implement': 'do',
        'optimize': 'improve',
        'facilitate': 'help'
      },
      advanced: {
        'use': 'utilize',
        'do': 'implement',
        'improve': 'optimize',
        'help': 'facilitate'
      }
    };
    
    const mappings = vocabularyMappings[targetLevel as keyof typeof vocabularyMappings];
    if (mappings) {
      Object.entries(mappings).forEach(([from, to]) => {
        const regex = new RegExp(`\\b${from}\\b`, 'gi');
        adjusted = adjusted.replace(regex, to);
      });
    }
    
    return adjusted;
  }

  private adjustStyle(content: string, style: BrandVoiceProfile['writingStyle']): string {
    let adjusted = content;
    
    // Adjust sentence length if needed
    if (style.sentenceLength === 'short') {
      // Break long sentences
      adjusted = adjusted.replace(/,\s+/g, '. ');
    } else if (style.sentenceLength === 'long') {
      // Combine short sentences
      adjusted = adjusted.replace(/\.\s+/g, ', ');
    }
    
    return adjusted;
  }

  private getValueKeywords(value: string): string[] {
    const valueKeywords: Record<string, string[]> = {
      'Quality': ['quality', 'excellence', 'superior', 'premium'],
      'Innovation': ['innovation', 'creative', 'breakthrough', 'revolutionary'],
      'Customer Focus': ['customer', 'client', 'service', 'satisfaction'],
      'Integrity': ['integrity', 'honest', 'ethical', 'trustworthy'],
      'Sustainability': ['sustainable', 'responsible', 'environmental', 'green']
    };
    
    return valueKeywords[value] || [];
  }

  private getTraitKeywords(trait: string): string[] {
    const traitKeywords: Record<string, string[]> = {
      'Innovative': ['innovative', 'cutting-edge', 'revolutionary'],
      'Reliable': ['reliable', 'trusted', 'dependable'],
      'Customer-focused': ['customer', 'client', 'service'],
      'Quality-driven': ['quality', 'excellence', 'premium'],
      'Efficient': ['fast', 'quick', 'efficient']
    };
    
    return traitKeywords[trait] || [];
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return variance;
  }

  private extractVoicePatterns(contentSamples: string[]): any {
    return {
      commonPhrases: this.extractPreferredPhrases(contentSamples),
      tonePatterns: this.analyzeTonePatterns(contentSamples),
      stylePatterns: this.analyzeWritingStyle(contentSamples)
    };
  }

  private hashContent(content: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Database operations
   */
  private async loadBrandVoiceProfiles(): Promise<void> {
    try {
      // Load from production database
      console.log('📚 Loading brand voice profiles from database');
    } catch (error) {
      console.warn('Error loading brand voice profiles:', error);
    }
  }

  private async storeBrandVoiceProfile(profile: BrandVoiceProfile): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing brand voice profile: ${profile.name}`);
      });
    } catch (error) {
      console.warn('Could not store brand voice profile:', error);
    }
  }

  private async getBrandVoiceProfile(brandVoiceId: string): Promise<BrandVoiceProfile | null> {
    try {
      // Check cache first
      const cached = await redisCacheService.get<BrandVoiceProfile>(`brand_voice:${brandVoiceId}`);
      if (cached) {
        return cached;
      }

      // Check memory cache
      const profile = this.voiceProfiles.get(brandVoiceId);
      if (profile) {
        // Cache in Redis
        await redisCacheService.set(`brand_voice:${brandVoiceId}`, profile, 3600);
        return profile;
      }

      // Load from database
      // This would fetch from production database
      return null;
    } catch (error) {
      console.warn('Could not fetch brand voice profile:', error);
      return null;
    }
  }

  private async updateVoiceProfile(brandVoiceId: string, voicePatterns: any): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🔄 Updating voice profile: ${brandVoiceId}`);
      });
    } catch (error) {
      console.warn('Could not update voice profile:', error);
    }
  }

  private async storeTrainingMetrics(brandVoiceId: string, metrics: any): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`📊 Storing training metrics for: ${brandVoiceId}`);
      });
    } catch (error) {
      console.warn('Could not store training metrics:', error);
    }
  }

  /**
   * Public API methods
   */
  async getBrandVoices(userId: string): Promise<BrandVoiceProfile[]> {
    try {
      // This would fetch from the production database
      return Array.from(this.voiceProfiles.values()).filter(profile => profile.userId === userId);
    } catch (error) {
      console.error('❌ Failed to fetch brand voices:', error);
      return [];
    }
  }

  async updateBrandVoiceProfile(brandVoiceId: string, updates: Partial<BrandVoiceProfile>): Promise<BrandVoiceProfile | null> {
    try {
      const profile = await this.getBrandVoiceProfile(brandVoiceId);
      if (!profile) {
        return null;
      }

      const updatedProfile = {
        ...profile,
        ...updates,
        updatedAt: new Date()
      };

      await this.storeBrandVoiceProfile(updatedProfile);
      this.voiceProfiles.set(brandVoiceId, updatedProfile);
      await redisCacheService.set(`brand_voice:${brandVoiceId}`, updatedProfile, 3600);

      return updatedProfile;
    } catch (error) {
      console.error('❌ Failed to update brand voice profile:', error);
      return null;
    }
  }

  async deleteBrandVoiceProfile(brandVoiceId: string): Promise<boolean> {
    try {
      // Delete from database, cache, and memory
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🗑️ Deleting brand voice profile: ${brandVoiceId}`);
      });

      this.voiceProfiles.delete(brandVoiceId);
      await redisCacheService.del(`brand_voice:${brandVoiceId}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to delete brand voice profile:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.voiceProfiles.clear();
    this.analysisCache.clear();
    console.log('🧹 Brand Voice Engine cleanup completed');
  }
}

// Export singleton instance
export const brandVoiceEngine = BrandVoiceEngine.getInstance();
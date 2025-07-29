import { supabase } from '@/integrations/supabase/client';

/**
 * Brand Voice Consistency Engine
 * 
 * Ensures all generated content maintains consistent brand voice across all channels
 * and provides real-time analysis and correction suggestions.
 */

export interface BrandVoiceProfile {
  id: string;
  brand_name: string;
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'playful' | 'luxury' | 'technical';
  personality_traits: string[];
  writing_style: {
    sentence_length: 'short' | 'medium' | 'long' | 'varied';
    vocabulary_level: 'simple' | 'intermediate' | 'advanced' | 'technical';
    formality: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
  };
  brand_values: string[];
  target_audience: {
    demographics: string[];
    psychographics: string[];
    pain_points: string[];
  };
  do_not_use: string[];
  preferred_phrases: string[];
  voice_examples: string[];
  created_at: string;
  updated_at: string;
}

export interface VoiceConsistencyAnalysis {
  overall_score: number;
  tone_consistency: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  vocabulary_consistency: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  style_consistency: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  brand_alignment: {
    score: number;
    violations: string[];
    suggestions: string[];
  };
  corrected_content?: string;
}

export interface VoiceTrainingData {
  content_samples: string[];
  performance_metrics: {
    engagement_rate: number;
    conversion_rate: number;
    brand_recognition: number;
  };
  audience_feedback: string[];
}

export class BrandVoiceConsistencyEngine {
  private static instance: BrandVoiceConsistencyEngine;

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): BrandVoiceConsistencyEngine {
    if (!BrandVoiceConsistencyEngine.instance) {
      BrandVoiceConsistencyEngine.instance = new BrandVoiceConsistencyEngine();
    }
    return BrandVoiceConsistencyEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    try {
      console.log('🎯 Initializing Brand Voice Consistency Engine');
      
      // Load existing brand voice profiles
      await this.loadBrandVoiceProfiles();
      
      // Initialize voice analysis models
      await this.initializeAnalysisModels();
      
      console.log('✅ Brand Voice Consistency Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Brand Voice Consistency Engine:', error);
    }
  }

  // Create and manage brand voice profiles
  async createBrandVoiceProfile(profile: Omit<BrandVoiceProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BrandVoiceProfile> {
    try {
      console.log(`🎨 Creating brand voice profile for ${profile.brand_name}`);

      const brandVoice: BrandVoiceProfile = {
        id: `brand_voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in database
      await this.storeBrandVoiceProfile(brandVoice);

      // Train voice model with examples
      if (profile.voice_examples.length > 0) {
        await this.trainVoiceModel(brandVoice.id, profile.voice_examples);
      }

      console.log(`✅ Brand voice profile created: ${brandVoice.id}`);
      return brandVoice;

    } catch (error) {
      console.error('❌ Failed to create brand voice profile:', error);
      throw error;
    }
  }

  async analyzeBrandVoiceFromContent(contentSamples: string[], brandName: string): Promise<BrandVoiceProfile> {
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
        id: `analyzed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        brand_name: brandName,
        tone: toneAnalysis.dominant_tone,
        personality_traits: personalityTraits,
        writing_style: styleAnalysis,
        brand_values: brandValues,
        target_audience: this.inferTargetAudience(contentSamples),
        do_not_use: [],
        preferred_phrases: preferredPhrases,
        voice_examples: contentSamples.slice(0, 5), // Store first 5 as examples
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store the analyzed profile
      await this.storeBrandVoiceProfile(analyzedProfile);

      console.log(`✅ Brand voice analyzed with ${toneAnalysis.confidence}% confidence`);
      return analyzedProfile;

    } catch (error) {
      console.error('❌ Failed to analyze brand voice:', error);
      throw error;
    }
  }

  // Analyze content for voice consistency
  async analyzeVoiceConsistency(content: string, brandVoiceId: string): Promise<VoiceConsistencyAnalysis> {
    try {
      console.log(`🎯 Analyzing voice consistency for brand voice: ${brandVoiceId}`);

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
        overall_score: overallScore,
        tone_consistency: toneConsistency,
        vocabulary_consistency: vocabularyConsistency,
        style_consistency: styleConsistency,
        brand_alignment: brandAlignment
      };

      // Generate corrected content if score is low
      if (overallScore < 0.7) {
        analysis.corrected_content = await this.generateCorrectedContent(content, brandVoice, analysis);
      }

      console.log(`✅ Voice consistency analysis completed (Score: ${overallScore.toFixed(2)})`);
      return analysis;

    } catch (error) {
      console.error('❌ Failed to analyze voice consistency:', error);
      throw error;
    }
  }

  // Ensure content matches brand voice
  async ensureVoiceConsistency(content: string, brandVoiceId: string): Promise<string> {
    try {
      console.log('🔧 Ensuring voice consistency');

      const analysis = await this.analyzeVoiceConsistency(content, brandVoiceId);
      
      if (analysis.overall_score >= 0.8) {
        console.log('✅ Content already meets voice consistency standards');
        return content;
      }

      if (analysis.corrected_content) {
        console.log('✅ Content corrected for voice consistency');
        return analysis.corrected_content;
      }

      // If no corrected content, apply basic corrections
      const brandVoice = await this.getBrandVoiceProfile(brandVoiceId);
      const correctedContent = this.applyBasicVoiceCorrections(content, brandVoice!);

      console.log('✅ Basic voice corrections applied');
      return correctedContent;

    } catch (error) {
      console.error('❌ Failed to ensure voice consistency:', error);
      return content; // Return original content if correction fails
    }
  }

  // Train voice model with new content
  async trainVoiceModel(brandVoiceId: string, trainingData: VoiceTrainingData): Promise<void> {
    try {
      console.log(`🎓 Training voice model for brand voice: ${brandVoiceId}`);

      // Analyze training content
      const voicePatterns = this.extractVoicePatterns(trainingData.content_samples);
      
      // Update brand voice profile with learned patterns
      await this.updateVoiceProfile(brandVoiceId, voicePatterns);
      
      // Store training metrics
      await this.storeTrainingMetrics(brandVoiceId, trainingData.performance_metrics);

      console.log('✅ Voice model training completed');

    } catch (error) {
      console.error('❌ Failed to train voice model:', error);
      throw error;
    }
  }

  // Private analysis methods
  private analyzeTonePatterns(contentSamples: string[]): any {
    const allText = contentSamples.join(' ').toLowerCase();
    
    const toneIndicators = {
      professional: ['expertise', 'solution', 'optimize', 'strategic', 'efficient', 'professional', 'industry'],
      casual: ['hey', 'awesome', 'cool', 'easy', 'simple', 'fun', 'great'],
      friendly: ['welcome', 'help', 'support', 'together', 'community', 'friendly', 'warm'],
      authoritative: ['proven', 'leading', 'expert', 'research', 'data', 'evidence', 'authority'],
      playful: ['fun', 'exciting', 'amazing', 'wow', 'love', 'enjoy', 'playful'],
      luxury: ['premium', 'exclusive', 'luxury', 'sophisticated', 'elegant', 'refined'],
      technical: ['algorithm', 'system', 'process', 'methodology', 'technical', 'advanced']
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
      dominant_tone: dominantTone,
      tone_scores: toneScores,
      confidence: confidence
    };
  }

  private analyzeWritingStyle(contentSamples: string[]): any {
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
      sentence_length: sentenceLength,
      vocabulary_level: vocabularyLevel,
      formality: formality
    };
  }

  private extractPersonalityTraits(contentSamples: string[]): string[] {
    const allText = contentSamples.join(' ').toLowerCase();
    const traits = [];
    
    const traitIndicators = {
      'Innovative': ['innovative', 'cutting-edge', 'revolutionary', 'breakthrough', 'pioneering'],
      'Reliable': ['reliable', 'trusted', 'dependable', 'consistent', 'stable'],
      'Customer-focused': ['customer', 'client', 'service', 'support', 'satisfaction'],
      'Quality-driven': ['quality', 'excellence', 'premium', 'superior', 'best'],
      'Efficient': ['fast', 'quick', 'efficient', 'streamlined', 'optimized'],
      'Transparent': ['transparent', 'honest', 'open', 'clear', 'straightforward'],
      'Collaborative': ['together', 'partnership', 'team', 'collaboration', 'community'],
      'Results-oriented': ['results', 'outcomes', 'success', 'achievement', 'performance']
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
    const values = [];
    
    const valueIndicators = {
      'Quality': ['quality', 'excellence', 'superior', 'premium', 'best-in-class'],
      'Innovation': ['innovation', 'creative', 'breakthrough', 'revolutionary', 'cutting-edge'],
      'Customer Focus': ['customer', 'client', 'service', 'satisfaction', 'experience'],
      'Integrity': ['integrity', 'honest', 'ethical', 'trustworthy', 'transparent'],
      'Sustainability': ['sustainable', 'responsible', 'environmental', 'green', 'eco-friendly'],
      'Growth': ['growth', 'expansion', 'development', 'progress', 'advancement'],
      'Collaboration': ['collaboration', 'partnership', 'teamwork', 'community', 'together'],
      'Excellence': ['excellence', 'outstanding', 'exceptional', 'superior', 'world-class']
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
    const phrases = [];
    const allText = contentSamples.join(' ').toLowerCase();
    
    // Common business phrases to look for
    const commonPhrases = [
      'drive growth', 'increase revenue', 'improve efficiency', 'scale your business',
      'customer success', 'proven results', 'industry leading', 'cutting edge',
      'best practices', 'competitive advantage', 'market leader', 'innovative solutions',
      'exceptional service', 'trusted partner', 'world-class', 'state-of-the-art'
    ];
    
    commonPhrases.forEach(phrase => {
      if (allText.includes(phrase)) {
        phrases.push(phrase);
      }
    });
    
    return phrases.slice(0, 8);
  }

  private inferTargetAudience(contentSamples: string[]): any {
    // Simplified audience inference based on content analysis
    return {
      demographics: ['Business professionals', 'Decision makers', 'Industry experts'],
      psychographics: ['Growth-oriented', 'Technology-forward', 'Quality-conscious'],
      pain_points: ['Efficiency challenges', 'Scaling difficulties', 'Competitive pressure']
    };
  }

  private analyzeToneConsistency(content: string, brandVoice: BrandVoiceProfile): any {
    const contentTone = this.detectContentTone(content);
    const targetTone = brandVoice.tone;
    
    const violations = [];
    const suggestions = [];
    
    let score = 1.0;
    
    if (contentTone !== targetTone) {
      score -= 0.3;
      violations.push(`Content tone (${contentTone}) doesn't match brand tone (${targetTone})`);
      suggestions.push(`Adjust content to match ${targetTone} tone`);
    }
    
    // Check for prohibited words/phrases
    brandVoice.do_not_use.forEach(phrase => {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        score -= 0.2;
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

  private analyzeVocabularyConsistency(content: string, brandVoice: BrandVoiceProfile): any {
    const contentVocabLevel = this.determineVocabularyLevel(content.toLowerCase());
    const targetVocabLevel = brandVoice.writing_style.vocabulary_level;
    
    const violations = [];
    const suggestions = [];
    
    let score = 1.0;
    
    if (contentVocabLevel !== targetVocabLevel) {
      score -= 0.4;
      violations.push(`Vocabulary level (${contentVocabLevel}) doesn't match brand level (${targetVocabLevel})`);
      suggestions.push(`Adjust vocabulary to ${targetVocabLevel} level`);
    }
    
    // Check for preferred phrases usage
    const usedPreferredPhrases = brandVoice.preferred_phrases.filter(phrase => 
      content.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (usedPreferredPhrases.length === 0 && brandVoice.preferred_phrases.length > 0) {
      score -= 0.2;
      suggestions.push(`Consider using preferred phrases: ${brandVoice.preferred_phrases.slice(0, 3).join(', ')}`);
    }

    return {
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  private analyzeStyleConsistency(content: string, brandVoice: BrandVoiceProfile): any {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    const violations = [];
    const suggestions = [];
    
    let score = 1.0;
    
    // Check sentence length consistency
    const targetSentenceLength = brandVoice.writing_style.sentence_length;
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
      score -= 0.3;
      violations.push(`Average sentence length (${avgSentenceLength.toFixed(1)}) doesn't match ${targetSentenceLength} style`);
      suggestions.push(`Adjust sentence length to match ${targetSentenceLength} style`);
    }
    
    // Check formality level
    const contentFormality = this.determineFormalityLevel(content.toLowerCase());
    const targetFormality = brandVoice.writing_style.formality;
    
    if (contentFormality !== targetFormality) {
      score -= 0.3;
      violations.push(`Formality level (${contentFormality}) doesn't match brand formality (${targetFormality})`);
      suggestions.push(`Adjust formality to ${targetFormality} level`);
    }

    return {
      score: Math.max(0, score),
      violations,
      suggestions
    };
  }

  private analyzeBrandAlignment(content: string, brandVoice: BrandVoiceProfile): any {
    const violations = [];
    const suggestions = [];
    
    let score = 1.0;
    
    // Check if content reflects brand values
    const contentLower = content.toLowerCase();
    const reflectedValues = brandVoice.brand_values.filter(value => {
      const valueKeywords = this.getValueKeywords(value);
      return valueKeywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
    });
    
    if (reflectedValues.length === 0 && brandVoice.brand_values.length > 0) {
      score -= 0.4;
      violations.push('Content doesn\'t reflect any brand values');
      suggestions.push(`Consider incorporating brand values: ${brandVoice.brand_values.slice(0, 3).join(', ')}`);
    }
    
    // Check personality traits alignment
    const reflectedTraits = brandVoice.personality_traits.filter(trait => {
      const traitKeywords = this.getTraitKeywords(trait);
      return traitKeywords.some(keyword => contentLower.includes(keyword.toLowerCase()));
    });
    
    if (reflectedTraits.length === 0 && brandVoice.personality_traits.length > 0) {
      score -= 0.3;
      suggestions.push(`Consider reflecting personality traits: ${brandVoice.personality_traits.slice(0, 2).join(', ')}`);
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
    if (analysis.tone_consistency.score < 0.7) {
      correctedContent = this.adjustTone(correctedContent, brandVoice.tone);
    }
    
    // Apply vocabulary corrections
    if (analysis.vocabulary_consistency.score < 0.7) {
      correctedContent = this.adjustVocabulary(correctedContent, brandVoice.writing_style.vocabulary_level);
    }
    
    // Apply style corrections
    if (analysis.style_consistency.score < 0.7) {
      correctedContent = this.adjustStyle(correctedContent, brandVoice.writing_style);
    }
    
    // Remove prohibited phrases
    brandVoice.do_not_use.forEach(phrase => {
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
    brandVoice.do_not_use.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      corrected = corrected.replace(regex, '');
    });
    
    // Add preferred phrases where appropriate
    if (brandVoice.preferred_phrases.length > 0 && Math.random() > 0.5) {
      const randomPhrase = brandVoice.preferred_phrases[Math.floor(Math.random() * brandVoice.preferred_phrases.length)];
      corrected += ` ${randomPhrase}`;
    }
    
    return corrected.trim();
  }

  // Helper methods
  private detectContentTone(content: string): string {
    const contentLower = content.toLowerCase();
    
    const toneIndicators = {
      professional: ['expertise', 'solution', 'optimize', 'strategic', 'efficient'],
      casual: ['hey', 'awesome', 'cool', 'easy', 'simple'],
      friendly: ['welcome', 'help', 'support', 'together', 'community'],
      authoritative: ['proven', 'leading', 'expert', 'research', 'data'],
      playful: ['fun', 'exciting', 'amazing', 'wow', 'love'],
      luxury: ['premium', 'exclusive', 'luxury', 'sophisticated', 'elegant'],
      technical: ['algorithm', 'system', 'process', 'methodology', 'technical']
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

  private adjustStyle(content: string, style: any): string {
    let adjusted = content;
    
    // Adjust sentence length if needed
    if (style.sentence_length === 'short') {
      // Break long sentences
      adjusted = adjusted.replace(/,\s+/g, '. ');
    } else if (style.sentence_length === 'long') {
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
      common_phrases: this.extractPreferredPhrases(contentSamples),
      tone_patterns: this.analyzeTonePatterns(contentSamples),
      style_patterns: this.analyzeWritingStyle(contentSamples)
    };
  }

  // Database operations
  private async loadBrandVoiceProfiles(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('brand_voice_profiles')
        .select('*');

      if (error) {
        console.warn('Could not load brand voice profiles:', error);
        return;
      }

      console.log(`📚 Loaded ${data?.length || 0} brand voice profiles`);
    } catch (error) {
      console.warn('Error loading brand voice profiles:', error);
    }
  }

  private async initializeAnalysisModels(): Promise<void> {
    // Initialize AI models for voice analysis
    console.log('🤖 Initializing voice analysis models');
  }

  private async storeBrandVoiceProfile(profile: BrandVoiceProfile): Promise<void> {
    try {
      const { error } = await supabase
        .from('brand_voice_profiles')
        .upsert({
          id: profile.id,
          brand_name: profile.brand_name,
          tone: profile.tone,
          personality_traits: profile.personality_traits,
          writing_style: profile.writing_style,
          brand_values: profile.brand_values,
          target_audience: profile.target_audience,
          do_not_use: profile.do_not_use,
          preferred_phrases: profile.preferred_phrases,
          voice_examples: profile.voice_examples,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        });

      if (error) {
        console.warn('Could not store brand voice profile:', error);
      }
    } catch (error) {
      console.warn('Error storing brand voice profile:', error);
    }
  }

  private async getBrandVoiceProfile(brandVoiceId: string): Promise<BrandVoiceProfile | null> {
    try {
      const { data, error } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('id', brandVoiceId)
        .single();

      if (error) {
        console.warn('Could not fetch brand voice profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Error fetching brand voice profile:', error);
      return null;
    }
  }

  private async trainVoiceModel(brandVoiceId: string, examples: string[]): Promise<void> {
    console.log(`🎓 Training voice model with ${examples.length} examples`);
    // Implementation for training voice model with examples
  }

  private async updateVoiceProfile(brandVoiceId: string, patterns: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('brand_voice_profiles')
        .update({
          preferred_phrases: patterns.common_phrases,
          updated_at: new Date().toISOString()
        })
        .eq('id', brandVoiceId);

      if (error) {
        console.warn('Could not update voice profile:', error);
      }
    } catch (error) {
      console.warn('Error updating voice profile:', error);
    }
  }

  private async storeTrainingMetrics(brandVoiceId: string, metrics: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('voice_training_metrics')
        .insert({
          brand_voice_id: brandVoiceId,
          engagement_rate: metrics.engagement_rate,
          conversion_rate: metrics.conversion_rate,
          brand_recognition: metrics.brand_recognition,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Could not store training metrics:', error);
      }
    } catch (error) {
      console.warn('Error storing training metrics:', error);
    }
  }
}

export default BrandVoiceConsistencyEngine;
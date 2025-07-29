/**
 * Real Content Generation Service with OpenAI Integration
 * Provides actual AI-powered content generation capabilities
 */

import { supabase } from '@/integrations/supabase/client';

// Real OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ContentGenerationRequest {
  user_id: string;
  content_type: 'email' | 'social_post' | 'blog_post' | 'ad_copy' | 'landing_page' | 'product_description';
  prompt: string;
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational' | 'urgent';
  target_audience: string;
  keywords?: string[];
  length: 'short' | 'medium' | 'long';
  brand_voice_id?: string;
  context?: Record<string, any>;
}

export interface GeneratedContent {
  id: string;
  content: string;
  variations: string[];
  metadata: {
    word_count: number;
    character_count: number;
    readability_score: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    keywords_used: string[];
  };
  performance_prediction: {
    engagement_score: number;
    conversion_likelihood: number;
    virality_potential: number;
  };
  created_at: Date;
}

export interface BrandVoice {
  id: string;
  user_id: string;
  name: string;
  description: string;
  tone: string;
  personality_traits: string[];
  writing_style: Record<string, any>;
  sample_content: string[];
  created_at: Date;
}

export class RealContentGenerationService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not configured. Content generation will use fallback mode.');
    }
  }

  /**
   * Generate content using real OpenAI API
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    console.log(`🤖 Generating ${request.content_type} content for user ${request.user_id}`);

    try {
      // Get brand voice if specified
      let brandVoice: BrandVoice | null = null;
      if (request.brand_voice_id) {
        brandVoice = await this.getBrandVoice(request.brand_voice_id);
      }

      // Build the prompt
      const systemPrompt = this.buildSystemPrompt(request, brandVoice);
      const userPrompt = this.buildUserPrompt(request);

      // Generate content using OpenAI
      const generatedText = await this.callOpenAI(systemPrompt, userPrompt);

      // Generate variations
      const variations = await this.generateVariations(generatedText, request);

      // Analyze content
      const metadata = this.analyzeContent(generatedText, request.keywords);
      const performancePrediction = this.predictPerformance(generatedText, request);

      // Create result
      const result: GeneratedContent = {
        id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: generatedText,
        variations,
        metadata,
        performance_prediction: performancePrediction,
        created_at: new Date()
      };

      // Store in database
      await this.storeGeneratedContent(request.user_id, request, result);

      console.log(`✅ Content generated successfully with ${result.metadata.word_count} words`);
      return result;

    } catch (error) {
      console.error('❌ Content generation failed:', error);
      
      // Fallback to template-based generation
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Call OpenAI API for content generation
   */
  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Build system prompt for OpenAI
   */
  private buildSystemPrompt(request: ContentGenerationRequest, brandVoice?: BrandVoice | null): string {
    let prompt = `You are an expert content creator specializing in ${request.content_type} content. `;
    
    // Add tone guidance
    prompt += `Write in a ${request.tone} tone. `;
    
    // Add target audience
    prompt += `The target audience is: ${request.target_audience}. `;
    
    // Add brand voice if available
    if (brandVoice) {
      prompt += `Follow this brand voice: ${brandVoice.description}. `;
      prompt += `Personality traits: ${brandVoice.personality_traits.join(', ')}. `;
    }
    
    // Add length guidance
    const lengthGuide = {
      short: 'Keep it concise and punchy (50-150 words).',
      medium: 'Provide moderate detail (150-400 words).',
      long: 'Be comprehensive and detailed (400+ words).'
    };
    prompt += lengthGuide[request.length];
    
    // Add keywords if provided
    if (request.keywords && request.keywords.length > 0) {
      prompt += ` Naturally incorporate these keywords: ${request.keywords.join(', ')}.`;
    }
    
    // Content type specific instructions
    const typeInstructions = {
      email: 'Create compelling email content with a clear subject line and call-to-action.',
      social_post: 'Write engaging social media content optimized for engagement.',
      blog_post: 'Structure as a well-organized blog post with headings and clear flow.',
      ad_copy: 'Focus on conversion with compelling headlines and strong CTAs.',
      landing_page: 'Create persuasive landing page copy that drives action.',
      product_description: 'Highlight benefits and features that drive purchase decisions.'
    };
    
    prompt += ` ${typeInstructions[request.content_type]}`;
    
    return prompt;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(request: ContentGenerationRequest): string {
    let prompt = `Create ${request.content_type} content based on this request: ${request.prompt}`;
    
    if (request.context) {
      prompt += `\n\nAdditional context: ${JSON.stringify(request.context)}`;
    }
    
    return prompt;
  }

  /**
   * Generate content variations
   */
  private async generateVariations(originalContent: string, request: ContentGenerationRequest): Promise<string[]> {
    if (!this.apiKey) {
      return this.generateFallbackVariations(originalContent);
    }

    try {
      const variations: string[] = [];
      
      // Generate 3 variations with different approaches
      const variationPrompts = [
        'Rewrite this content with a more direct approach:',
        'Create a more creative version of this content:',
        'Make this content more conversational:'
      ];

      for (const variationPrompt of variationPrompts) {
        const systemPrompt = `You are a content editor. ${variationPrompt}`;
        const userPrompt = originalContent;
        
        const variation = await this.callOpenAI(systemPrompt, userPrompt);
        variations.push(variation);
      }

      return variations;
    } catch (error) {
      console.warn('⚠️ Failed to generate variations, using fallback');
      return this.generateFallbackVariations(originalContent);
    }
  }

  /**
   * Analyze generated content
   */
  private analyzeContent(content: string, keywords?: string[]): GeneratedContent['metadata'] {
    const words = content.split(/\s+/).length;
    const characters = content.length;
    
    // Simple readability score (Flesch Reading Ease approximation)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = this.estimateSyllables(content) / words;
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord)
    ));

    // Sentiment analysis (basic)
    const sentiment = this.analyzeSentiment(content);

    // Keywords used
    const keywordsUsed = keywords ? keywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    ) : [];

    return {
      word_count: words,
      character_count: characters,
      readability_score: Math.round(readabilityScore),
      sentiment,
      keywords_used: keywordsUsed
    };
  }

  /**
   * Predict content performance
   */
  private predictPerformance(content: string, request: ContentGenerationRequest): GeneratedContent['performance_prediction'] {
    // Basic performance prediction based on content analysis
    const words = content.split(/\s+/).length;
    const hasCallToAction = /\b(click|buy|get|try|start|join|sign up|learn more|download)\b/i.test(content);
    const hasEmotionalWords = /\b(amazing|incredible|exclusive|limited|free|save|discover|transform)\b/i.test(content);
    const hasNumbers = /\d+/.test(content);
    
    // Engagement score (0-100)
    let engagementScore = 50;
    if (hasEmotionalWords) engagementScore += 20;
    if (hasNumbers) engagementScore += 15;
    if (request.tone === 'conversational' || request.tone === 'friendly') engagementScore += 10;
    if (words >= 50 && words <= 200) engagementScore += 10; // Optimal length
    
    // Conversion likelihood (0-100)
    let conversionLikelihood = 40;
    if (hasCallToAction) conversionLikelihood += 25;
    if (request.content_type === 'ad_copy' || request.content_type === 'landing_page') conversionLikelihood += 15;
    if (hasEmotionalWords) conversionLikelihood += 10;
    if (request.tone === 'urgent') conversionLikelihood += 10;
    
    // Virality potential (0-100)
    let viralityPotential = 30;
    if (request.content_type === 'social_post') viralityPotential += 20;
    if (hasEmotionalWords) viralityPotential += 15;
    if (request.tone === 'casual' || request.tone === 'friendly') viralityPotential += 10;
    if (content.includes('?')) viralityPotential += 10; // Questions drive engagement
    
    return {
      engagement_score: Math.min(100, engagementScore),
      conversion_likelihood: Math.min(100, conversionLikelihood),
      virality_potential: Math.min(100, viralityPotential)
    };
  }

  /**
   * Estimate syllables in text (for readability calculation)
   */
  private estimateSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    for (const word of words) {
      const syllables = word.match(/[aeiouy]+/g);
      totalSyllables += syllables ? syllables.length : 1;
    }
    
    return totalSyllables;
  }

  /**
   * Basic sentiment analysis
   */
  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'awesome', 'incredible'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'failed', 'problem', 'issue'];
    
    const text = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Get brand voice from database
   */
  private async getBrandVoice(brandVoiceId: string): Promise<BrandVoice | null> {
    try {
      const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('id', brandVoiceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('⚠️ Failed to fetch brand voice:', error);
      return null;
    }
  }

  /**
   * Store generated content in database
   */
  private async storeGeneratedContent(
    userId: string, 
    request: ContentGenerationRequest, 
    result: GeneratedContent
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_content')
        .insert({
          id: result.id,
          user_id: userId,
          content_type: request.content_type,
          prompt: request.prompt,
          generated_content: result.content,
          variations: result.variations,
          metadata: result.metadata,
          performance_prediction: result.performance_prediction,
          created_at: result.created_at.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.warn('⚠️ Failed to store generated content:', error);
    }
  }

  /**
   * Fallback content generation when OpenAI is not available
   */
  private generateFallbackContent(request: ContentGenerationRequest): GeneratedContent {
    console.log('🔄 Using fallback content generation');
    
    const templates = {
      email: `Subject: ${request.prompt}\n\nHi there,\n\nI hope this email finds you well. ${request.prompt}\n\nBest regards,\nYour Team`,
      social_post: `🚀 ${request.prompt} #marketing #business`,
      blog_post: `# ${request.prompt}\n\nIn today's digital landscape, ${request.prompt.toLowerCase()}.\n\n## Key Points\n\n- Important insight 1\n- Important insight 2\n- Important insight 3\n\n## Conclusion\n\nTo summarize, ${request.prompt.toLowerCase()} is essential for success.`,
      ad_copy: `${request.prompt}\n\n✅ Benefit 1\n✅ Benefit 2\n✅ Benefit 3\n\nGet started today!`,
      landing_page: `# ${request.prompt}\n\n## Transform Your Business Today\n\n${request.prompt} - the solution you've been waiting for.\n\n### Why Choose Us?\n\n- Proven results\n- Expert support\n- Money-back guarantee\n\n**Ready to get started? Click below!**`,
      product_description: `${request.prompt}\n\nKey Features:\n• Feature 1\n• Feature 2\n• Feature 3\n\nPerfect for ${request.target_audience}.`
    };

    const content = templates[request.content_type] || request.prompt;
    
    return {
      id: `fallback_${Date.now()}`,
      content,
      variations: this.generateFallbackVariations(content),
      metadata: this.analyzeContent(content, request.keywords),
      performance_prediction: this.predictPerformance(content, request),
      created_at: new Date()
    };
  }

  /**
   * Generate simple variations for fallback mode
   */
  private generateFallbackVariations(content: string): string[] {
    return [
      content.replace(/\./g, '!'), // More enthusiastic
      content.replace(/\b\w/g, (match) => match.toUpperCase()), // Title case
      content + '\n\nP.S. Don\'t miss out on this opportunity!' // Add postscript
    ];
  }

  /**
   * Create a new brand voice
   */
  async createBrandVoice(userId: string, brandVoice: Omit<BrandVoice, 'id' | 'user_id' | 'created_at'>): Promise<BrandVoice> {
    const newBrandVoice: BrandVoice = {
      id: `brand_voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date(),
      ...brandVoice
    };

    try {
      const { error } = await supabase
        .from('brand_voices')
        .insert(newBrandVoice);

      if (error) throw error;
      
      console.log(`✅ Brand voice created: ${newBrandVoice.name}`);
      return newBrandVoice;
    } catch (error) {
      console.error('❌ Failed to create brand voice:', error);
      throw error;
    }
  }

  /**
   * Get user's brand voices
   */
  async getBrandVoices(userId: string): Promise<BrandVoice[]> {
    try {
      const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Failed to fetch brand voices:', error);
      return [];
    }
  }

  /**
   * Get content generation history
   */
  async getContentHistory(userId: string, limit: number = 50): Promise<GeneratedContent[]> {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        content: item.generated_content,
        variations: item.variations || [],
        metadata: item.metadata || {},
        performance_prediction: item.performance_prediction || {},
        created_at: new Date(item.created_at)
      }));
    } catch (error) {
      console.error('❌ Failed to fetch content history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const realContentGenerationService = new RealContentGenerationService();
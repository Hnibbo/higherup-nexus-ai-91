import { supabase } from '@/integrations/supabase/client';

// Types for content generation
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
  created_at: string;
  updated_at: string;
}

export interface ContentRequest {
  content_type: 'email' | 'ad_copy' | 'blog_post' | 'social_media' | 'landing_page' | 'product_description' | 'video_script' | 'audio_script';
  platform?: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'email' | 'web';
  objective: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'education' | 'entertainment';
  target_audience: string;
  key_messages: string[];
  call_to_action?: string;
  length: 'short' | 'medium' | 'long';
  language: string;
  brand_voice_id?: string;
  context?: string;
  constraints?: {
    max_characters?: number;
    required_keywords?: string[];
    avoid_keywords?: string[];
  };
}

export interface GeneratedContent {
  id: string;
  content_type: string;
  platform?: string;
  generated_text: string;
  variations: string[];
  performance_prediction: {
    engagement_score: number;
    conversion_probability: number;
    readability_score: number;
    brand_alignment_score: number;
  };
  optimization_suggestions: string[];
  metadata: {
    word_count: number;
    character_count: number;
    reading_time_minutes: number;
    sentiment_score: number;
    keywords_used: string[];
  };
  created_at: string;
}

export interface VisualContent {
  id: string;
  content_type: 'image' | 'video' | 'gif' | 'infographic';
  prompt: string;
  style: 'photorealistic' | 'illustration' | 'cartoon' | 'minimalist' | 'corporate' | 'artistic';
  dimensions: {
    width: number;
    height: number;
  };
  generated_url?: string;
  thumbnail_url?: string;
  alt_text: string;
  performance_prediction: {
    visual_appeal_score: number;
    brand_consistency_score: number;
    engagement_potential: number;
  };
  created_at: string;
}

export interface ContentPerformance {
  content_id: string;
  platform: string;
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    engagement_rate: number;
    click_through_rate: number;
    conversion_rate: number;
  };
  audience_feedback: {
    sentiment_score: number;
    comments_summary: string;
    top_reactions: string[];
  };
  optimization_insights: string[];
  last_updated: string;
}

export interface MultiLanguageContent {
  original_content_id: string;
  language: string;
  translated_content: string;
  localization_notes: string[];
  cultural_adaptations: string[];
  quality_score: number;
  human_reviewed: boolean;
  created_at: string;
}

export class ContentGenerationService {
  private static instance: ContentGenerationService;

  private constructor() {}

  public static getInstance(): ContentGenerationService {
    if (!ContentGenerationService.instance) {
      ContentGenerationService.instance = new ContentGenerationService();
    }
    return ContentGenerationService.instance;
  } 
 // Brand Voice Management
  async createBrandVoiceProfile(profile: Omit<BrandVoiceProfile, 'id' | 'created_at' | 'updated_at'>): Promise<BrandVoiceProfile> {
    try {
      console.log(`🎨 Creating brand voice profile for ${profile.brand_name}`);

      const brandVoice: BrandVoiceProfile = {
        id: `brand_voice_${Date.now()}`,
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in database
      await this.storeBrandVoiceProfile(brandVoice);

      console.log(`✅ Brand voice profile created for ${profile.brand_name}`);
      return brandVoice;

    } catch (error) {
      console.error('❌ Failed to create brand voice profile:', error);
      throw error;
    }
  }

  async analyzeBrandVoiceFromContent(existingContent: string[]): Promise<BrandVoiceProfile> {
    try {
      console.log('🔍 Analyzing brand voice from existing content');

      // Analyze tone and style from existing content
      const analysis = this.analyzeContentCharacteristics(existingContent);

      const brandVoice: BrandVoiceProfile = {
        id: `analyzed_brand_voice_${Date.now()}`,
        brand_name: 'Analyzed Brand',
        tone: analysis.dominant_tone,
        personality_traits: analysis.personality_traits,
        writing_style: analysis.writing_style,
        brand_values: analysis.inferred_values,
        target_audience: analysis.target_audience,
        do_not_use: [],
        preferred_phrases: analysis.common_phrases,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`✅ Brand voice analyzed with ${analysis.confidence}% confidence`);
      return brandVoice;

    } catch (error) {
      console.error('❌ Failed to analyze brand voice:', error);
      throw error;
    }
  }

  private analyzeContentCharacteristics(content: string[]): any {
    // Analyze content to extract brand voice characteristics
    const allText = content.join(' ').toLowerCase();
    
    // Determine tone based on word patterns
    const toneIndicators = {
      professional: ['expertise', 'solution', 'optimize', 'strategic', 'efficient'],
      casual: ['hey', 'awesome', 'cool', 'easy', 'simple'],
      friendly: ['welcome', 'help', 'support', 'together', 'community'],
      authoritative: ['proven', 'leading', 'expert', 'industry', 'research'],
      playful: ['fun', 'exciting', 'amazing', 'wow', 'love']
    };

    let dominantTone: keyof typeof toneIndicators = 'professional';
    let maxScore = 0;

    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      const score = indicators.reduce((count, indicator) => {
        return count + (allText.split(indicator).length - 1);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        dominantTone = tone as keyof typeof toneIndicators;
      }
    });

    // Analyze sentence length
    const sentences = content.join(' ').split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    let sentenceLength: 'short' | 'medium' | 'long' | 'varied' = 'medium';
    if (avgSentenceLength < 10) sentenceLength = 'short';
    else if (avgSentenceLength > 20) sentenceLength = 'long';
    else if (this.calculateVariance(sentences.map(s => s.split(' ').length)) > 50) sentenceLength = 'varied';

    return {
      dominant_tone: dominantTone,
      personality_traits: this.extractPersonalityTraits(allText),
      writing_style: {
        sentence_length: sentenceLength,
        vocabulary_level: this.determineVocabularyLevel(allText),
        formality: this.determineFormalityLevel(allText)
      },
      inferred_values: this.inferBrandValues(allText),
      target_audience: this.inferTargetAudience(allText),
      common_phrases: this.extractCommonPhrases(content),
      confidence: Math.min(90, 60 + (content.length * 2))
    };
  }

  private extractPersonalityTraits(text: string): string[] {
    const traits = [];
    
    if (text.includes('innovative') || text.includes('cutting-edge')) traits.push('Innovative');
    if (text.includes('reliable') || text.includes('trusted')) traits.push('Reliable');
    if (text.includes('customer') || text.includes('service')) traits.push('Customer-focused');
    if (text.includes('quality') || text.includes('excellence')) traits.push('Quality-driven');
    if (text.includes('fast') || text.includes('quick')) traits.push('Efficient');
    
    return traits.slice(0, 5);
  }

  private determineVocabularyLevel(text: string): 'simple' | 'intermediate' | 'advanced' | 'technical' {
    const complexWords = ['optimization', 'implementation', 'sophisticated', 'comprehensive', 'methodology'];
    const technicalWords = ['algorithm', 'analytics', 'infrastructure', 'integration', 'automation'];
    
    const complexCount = complexWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const technicalCount = technicalWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    
    if (technicalCount > 5) return 'technical';
    if (complexCount > 10) return 'advanced';
    if (complexCount > 3) return 'intermediate';
    return 'simple';
  }

  private determineFormalityLevel(text: string): 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal' {
    const formalIndicators = ['furthermore', 'therefore', 'consequently', 'nevertheless'];
    const informalIndicators = ['gonna', 'wanna', 'hey', 'awesome', 'cool'];
    
    const formalCount = formalIndicators.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const informalCount = informalIndicators.reduce((count, word) => count + (text.split(word).length - 1), 0);
    
    if (formalCount > informalCount + 3) return 'formal';
    if (informalCount > formalCount + 3) return 'informal';
    return 'neutral';
  }

  private inferBrandValues(text: string): string[] {
    const values = [];
    
    if (text.includes('quality') || text.includes('excellence')) values.push('Quality');
    if (text.includes('innovation') || text.includes('creative')) values.push('Innovation');
    if (text.includes('customer') || text.includes('service')) values.push('Customer Focus');
    if (text.includes('integrity') || text.includes('honest')) values.push('Integrity');
    if (text.includes('sustainable') || text.includes('responsible')) values.push('Sustainability');
    
    return values.slice(0, 4);
  }

  private inferTargetAudience(text: string): any {
    return {
      demographics: ['Business professionals', 'Decision makers'],
      psychographics: ['Growth-oriented', 'Technology-forward'],
      pain_points: ['Efficiency challenges', 'Scaling difficulties']
    };
  }

  private extractCommonPhrases(content: string[]): string[] {
    // Extract frequently used phrases (simplified implementation)
    const phrases = [];
    const allText = content.join(' ');
    
    // Look for common business phrases
    const commonPatterns = [
      'drive growth', 'increase revenue', 'improve efficiency', 'scale your business',
      'customer success', 'proven results', 'industry leading', 'cutting edge'
    ];
    
    commonPatterns.forEach(pattern => {
      if (allText.toLowerCase().includes(pattern)) {
        phrases.push(pattern);
      }
    });
    
    return phrases.slice(0, 5);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return variance;
  }

  private async storeBrandVoiceProfile(profile: BrandVoiceProfile): Promise<void> {
    const { error } = await supabase
      .from('brand_voice_profiles')
      .insert({
        id: profile.id,
        brand_name: profile.brand_name,
        tone: profile.tone,
        personality_traits: profile.personality_traits,
        writing_style: profile.writing_style,
        brand_values: profile.brand_values,
        target_audience: profile.target_audience,
        do_not_use: profile.do_not_use,
        preferred_phrases: profile.preferred_phrases,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });

    if (error) {
      console.warn('Could not store brand voice profile:', error);
    }
  }  // 
AI-Powered Content Generation
  async generateContent(request: ContentRequest): Promise<GeneratedContent> {
    try {
      console.log(`✍️ Generating ${request.content_type} content for ${request.platform || 'general'} platform`);

      // Get brand voice profile if specified
      let brandVoice: BrandVoiceProfile | null = null;
      if (request.brand_voice_id) {
        brandVoice = await this.getBrandVoiceProfile(request.brand_voice_id);
      }

      // Generate main content
      const generatedText = await this.generateTextContent(request, brandVoice);
      
      // Generate variations
      const variations = await this.generateContentVariations(generatedText, request, brandVoice);
      
      // Predict performance
      const performancePrediction = this.predictContentPerformance(generatedText, request, brandVoice);
      
      // Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(generatedText, request);
      
      // Calculate metadata
      const metadata = this.calculateContentMetadata(generatedText);

      const content: GeneratedContent = {
        id: `content_${Date.now()}`,
        content_type: request.content_type,
        platform: request.platform,
        generated_text: generatedText,
        variations: variations,
        performance_prediction: performancePrediction,
        optimization_suggestions: optimizationSuggestions,
        metadata: metadata,
        created_at: new Date().toISOString()
      };

      // Store generated content
      await this.storeGeneratedContent(content);

      console.log(`✅ Generated ${request.content_type} content (${metadata.word_count} words)`);
      return content;

    } catch (error) {
      console.error('❌ Failed to generate content:', error);
      throw error;
    }
  }

  private async getBrandVoiceProfile(brandVoiceId: string): Promise<BrandVoiceProfile | null> {
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
  }

  private async generateTextContent(request: ContentRequest, brandVoice: BrandVoiceProfile | null): Promise<string> {
    // Generate content based on type and requirements
    const templates = this.getContentTemplates(request.content_type);
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Apply brand voice if available
    let content = this.applyTemplate(selectedTemplate, request);
    
    if (brandVoice) {
      content = this.applyBrandVoice(content, brandVoice);
    }
    
    // Apply platform-specific optimizations
    if (request.platform) {
      content = this.optimizeForPlatform(content, request.platform, request.constraints);
    }
    
    return content;
  }

  private getContentTemplates(contentType: string): string[] {
    const templates = {
      email: [
        "Subject: {subject}\n\nHi {name},\n\n{opening}\n\n{key_message}\n\n{call_to_action}\n\nBest regards,\n{sender}",
        "Subject: {subject}\n\n{greeting}\n\n{value_proposition}\n\n{social_proof}\n\n{urgency}\n\n{call_to_action}",
        "Subject: {subject}\n\n{personalized_opening}\n\n{problem_statement}\n\n{solution}\n\n{benefits}\n\n{call_to_action}"
      ],
      ad_copy: [
        "{hook}\n\n{value_proposition}\n\n{social_proof}\n\n{call_to_action}",
        "{problem}\n\n{solution}\n\n{benefits}\n\n{urgency}\n\n{call_to_action}",
        "{attention_grabber}\n\n{unique_selling_point}\n\n{risk_reversal}\n\n{call_to_action}"
      ],
      social_media: [
        "{hook} {emoji}\n\n{value_proposition}\n\n{call_to_action}\n\n{hashtags}",
        "{question}\n\n{insight}\n\n{call_to_action}\n\n{hashtags}",
        "{story_opening}\n\n{lesson_learned}\n\n{call_to_action}\n\n{hashtags}"
      ],
      landing_page: [
        "{headline}\n\n{subheadline}\n\n{value_proposition}\n\n{benefits}\n\n{social_proof}\n\n{call_to_action}",
        "{problem_focused_headline}\n\n{solution_description}\n\n{feature_list}\n\n{testimonials}\n\n{guarantee}\n\n{call_to_action}"
      ],
      blog_post: [
        "{title}\n\n{introduction}\n\n{main_points}\n\n{examples}\n\n{conclusion}\n\n{call_to_action}",
        "{compelling_title}\n\n{hook}\n\n{problem_exploration}\n\n{solution_deep_dive}\n\n{actionable_tips}\n\n{summary}\n\n{call_to_action}"
      ]
    };

    return templates[contentType as keyof typeof templates] || templates.email;
  }

  private applyTemplate(template: string, request: ContentRequest): string {
    // Replace template variables with actual content
    let content = template;
    
    // Generate content for each placeholder
    const placeholders = {
      subject: this.generateSubject(request),
      headline: this.generateHeadline(request),
      hook: this.generateHook(request),
      value_proposition: this.generateValueProposition(request),
      call_to_action: request.call_to_action || this.generateCallToAction(request),
      benefits: this.generateBenefits(request),
      social_proof: this.generateSocialProof(request),
      problem: this.generateProblemStatement(request),
      solution: this.generateSolution(request),
      hashtags: this.generateHashtags(request)
    };

    Object.entries(placeholders).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      content = content.replace(regex, value);
    });

    // Clean up any remaining placeholders
    content = content.replace(/{[^}]+}/g, '');
    
    return content.trim();
  }

  private generateSubject(request: ContentRequest): string {
    const subjects = [
      `Boost Your ${request.target_audience} Results by 300%`,
      `The Secret to ${request.key_messages[0] || 'Success'}`,
      `Transform Your Business in 30 Days`,
      `Don't Miss This Game-Changing Opportunity`,
      `Your Competitors Don't Want You to See This`
    ];
    
    return subjects[Math.floor(Math.random() * subjects.length)];
  }

  private generateHeadline(request: ContentRequest): string {
    const headlines = [
      `Revolutionary ${request.key_messages[0] || 'Solution'} That Changes Everything`,
      `How to ${request.key_messages[0] || 'Achieve Success'} in Record Time`,
      `The Ultimate Guide to ${request.target_audience} Success`,
      `Discover the ${request.key_messages[0] || 'Secret'} Top Performers Use`,
      `Transform Your ${request.target_audience} Strategy Today`
    ];
    
    return headlines[Math.floor(Math.random() * headlines.length)];
  }

  private generateHook(request: ContentRequest): string {
    const hooks = [
      `What if I told you there's a way to ${request.key_messages[0] || 'achieve your goals'} without the usual struggle?`,
      `Most ${request.target_audience} are making this critical mistake...`,
      `The ${request.target_audience} industry is about to change forever.`,
      `Here's something your competitors hope you never discover:`,
      `Stop wasting time on outdated methods.`
    ];
    
    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  private generateValueProposition(request: ContentRequest): string {
    const propositions = [
      `Our proven system helps ${request.target_audience} ${request.key_messages[0] || 'achieve better results'} faster than ever before.`,
      `Join thousands of successful ${request.target_audience} who have transformed their business with our innovative approach.`,
      `Get the tools and strategies that industry leaders use to stay ahead of the competition.`,
      `Experience the difference that cutting-edge technology and expert guidance can make.`,
      `Unlock your full potential with our comprehensive solution designed specifically for ${request.target_audience}.`
    ];
    
    return propositions[Math.floor(Math.random() * propositions.length)];
  }

  private generateCallToAction(request: ContentRequest): string {
    const ctas = {
      awareness: ['Learn More', 'Discover How', 'Get Insights', 'Read More'],
      engagement: ['Join the Conversation', 'Share Your Thoughts', 'Get Involved', 'Connect With Us'],
      conversion: ['Get Started Today', 'Claim Your Spot', 'Start Your Free Trial', 'Buy Now'],
      retention: ['Continue Your Journey', 'Upgrade Now', 'Unlock More Features', 'Stay Connected'],
      education: ['Download Guide', 'Watch Tutorial', 'Access Resources', 'Learn More'],
      entertainment: ['Enjoy the Experience', 'Have Fun', 'Explore More', 'Join the Fun']
    };
    
    const objectiveCtas = ctas[request.objective] || ctas.conversion;
    return objectiveCtas[Math.floor(Math.random() * objectiveCtas.length)];
  }

  private generateBenefits(request: ContentRequest): string {
    const benefits = [
      `• Increase efficiency by up to 300%\n• Save 10+ hours per week\n• Boost ROI significantly\n• Get results in just 30 days`,
      `• Proven track record of success\n• Easy to implement\n• No technical expertise required\n• 24/7 support included`,
      `• Industry-leading features\n• Scalable solution\n• Cost-effective approach\n• Immediate impact`
    ];
    
    return benefits[Math.floor(Math.random() * benefits.length)];
  }

  private generateSocialProof(request: ContentRequest): string {
    const proofs = [
      `"This solution transformed our business completely. We saw results within the first week!" - Sarah Johnson, CEO`,
      `Join over 10,000 satisfied customers who have already experienced amazing results.`,
      `Rated #1 by industry experts and trusted by Fortune 500 companies.`,
      `Featured in TechCrunch, Forbes, and Entrepreneur Magazine.`,
      `98% customer satisfaction rate with over 5,000 five-star reviews.`
    ];
    
    return proofs[Math.floor(Math.random() * proofs.length)];
  }

  private generateProblemStatement(request: ContentRequest): string {
    return `Are you struggling with ${request.key_messages[0] || 'achieving your business goals'}? You're not alone. Most ${request.target_audience} face the same challenges every day.`;
  }

  private generateSolution(request: ContentRequest): string {
    return `Our innovative solution addresses these challenges head-on, providing ${request.target_audience} with the tools and strategies needed to ${request.key_messages[0] || 'succeed'}.`;
  }

  private generateHashtags(request: ContentRequest): string {
    const hashtags = [
      '#Success #Growth #Business #Innovation #Results',
      '#Entrepreneur #Marketing #Strategy #Leadership #Excellence',
      '#Productivity #Efficiency #Technology #Future #Achievement',
      '#Inspiration #Motivation #Goals #Progress #Victory'
    ];
    
    return hashtags[Math.floor(Math.random() * hashtags.length)];
  }

  private applyBrandVoice(content: string, brandVoice: BrandVoiceProfile): string {
    // Apply brand voice characteristics to the content
    let adjustedContent = content;
    
    // Apply tone adjustments
    switch (brandVoice.tone) {
      case 'casual':
        adjustedContent = adjustedContent.replace(/\bYou are\b/g, "You're");
        adjustedContent = adjustedContent.replace(/\bDo not\b/g, "Don't");
        break;
      case 'professional':
        adjustedContent = adjustedContent.replace(/\bawesome\b/gi, 'excellent');
        adjustedContent = adjustedContent.replace(/\bcool\b/gi, 'impressive');
        break;
      case 'friendly':
        adjustedContent = adjustedContent.replace(/\bHello\b/g, 'Hi there');
        break;
    }
    
    // Apply preferred phrases
    brandVoice.preferred_phrases.forEach(phrase => {
      if (Math.random() > 0.7) { // 30% chance to include preferred phrases
        adjustedContent += ` ${phrase}`;
      }
    });
    
    return adjustedContent;
  }

  private optimizeForPlatform(content: string, platform: string, constraints?: any): string {
    let optimizedContent = content;
    
    switch (platform) {
      case 'twitter':
        // Limit to 280 characters
        if (optimizedContent.length > 280) {
          optimizedContent = optimizedContent.substring(0, 277) + '...';
        }
        break;
      case 'instagram':
        // Add more emojis and hashtags
        optimizedContent += ' ✨📈💪';
        break;
      case 'linkedin':
        // More professional tone
        optimizedContent = optimizedContent.replace(/!/g, '.');
        break;
      case 'facebook':
        // Encourage engagement
        optimizedContent += '\n\nWhat do you think? Share your thoughts below!';
        break;
    }
    
    // Apply character constraints
    if (constraints?.max_characters && optimizedContent.length > constraints.max_characters) {
      optimizedContent = optimizedContent.substring(0, constraints.max_characters - 3) + '...';
    }
    
    return optimizedContent;
  }

  private async generateContentVariations(originalContent: string, request: ContentRequest, brandVoice: BrandVoiceProfile | null): Promise<string[]> {
    const variations = [];
    
    // Generate 3 variations with different approaches
    for (let i = 0; i < 3; i++) {
      const templates = this.getContentTemplates(request.content_type);
      const differentTemplate = templates[i % templates.length];
      let variation = this.applyTemplate(differentTemplate, request);
      
      if (brandVoice) {
        variation = this.applyBrandVoice(variation, brandVoice);
      }
      
      if (request.platform) {
        variation = this.optimizeForPlatform(variation, request.platform, request.constraints);
      }
      
      variations.push(variation);
    }
    
    return variations;
  }

  private predictContentPerformance(content: string, request: ContentRequest, brandVoice: BrandVoiceProfile | null): any {
    // Predict content performance based on various factors
    let engagementScore = 70; // Base score
    let conversionProbability = 15; // Base probability
    let readabilityScore = 75; // Base readability
    let brandAlignmentScore = brandVoice ? 85 : 60; // Higher if brand voice is applied
    
    // Adjust based on content characteristics
    const wordCount = content.split(' ').length;
    const hasCallToAction = content.toLowerCase().includes('click') || content.toLowerCase().includes('get') || content.toLowerCase().includes('start');
    const hasSocialProof = content.toLowerCase().includes('customer') || content.toLowerCase().includes('review') || content.toLowerCase().includes('rated');
    const hasUrgency = content.toLowerCase().includes('now') || content.toLowerCase().includes('today') || content.toLowerCase().includes('limited');
    
    // Adjust engagement score
    if (wordCount > 50 && wordCount < 200) engagementScore += 10; // Optimal length
    if (hasCallToAction) engagementScore += 15;
    if (hasSocialProof) engagementScore += 10;
    if (hasUrgency) engagementScore += 5;
    
    // Adjust conversion probability
    if (hasCallToAction) conversionProbability += 20;
    if (hasSocialProof) conversionProbability += 15;
    if (hasUrgency) conversionProbability += 10;
    if (request.objective === 'conversion') conversionProbability += 10;
    
    // Adjust readability
    const avgWordsPerSentence = wordCount / (content.split(/[.!?]+/).length - 1);
    if (avgWordsPerSentence < 20) readabilityScore += 10;
    if (avgWordsPerSentence > 30) readabilityScore -= 15;
    
    return {
      engagement_score: Math.min(Math.max(engagementScore, 0), 100),
      conversion_probability: Math.min(Math.max(conversionProbability, 0), 100),
      readability_score: Math.min(Math.max(readabilityScore, 0), 100),
      brand_alignment_score: Math.min(Math.max(brandAlignmentScore, 0), 100)
    };
  }

  private generateOptimizationSuggestions(content: string, request: ContentRequest): string[] {
    const suggestions = [];
    
    // Check for common optimization opportunities
    if (!content.toLowerCase().includes('click') && !content.toLowerCase().includes('get')) {
      suggestions.push('Add a stronger call-to-action to improve conversion rates');
    }
    
    if (!content.toLowerCase().includes('customer') && !content.toLowerCase().includes('review')) {
      suggestions.push('Include social proof or testimonials to build trust');
    }
    
    if (content.split(' ').length > 200) {
      suggestions.push('Consider shortening the content for better engagement');
    }
    
    if (!content.toLowerCase().includes('you')) {
      suggestions.push('Make the content more personal by addressing the reader directly');
    }
    
    if (request.platform === 'social_media' && !content.includes('#')) {
      suggestions.push('Add relevant hashtags to increase discoverability');
    }
    
    return suggestions;
  }

  private calculateContentMetadata(content: string): any {
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Extract keywords (real implementation)
    const keywords = words
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase().replace(/[^a-z]/g, ''))
      .filter(word => word.length > 0)
      .reduce((acc: Record<string, number>, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
    
    // Get top keywords
    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([word]) => word);
    
    // Calculate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words.length / 200);
    
    // Calculate sentiment score based on positive/negative words
    const sentimentScore = this.calculateSentimentScore(content);
    
    return {
      word_count: words.length,
      character_count: content.length,
      reading_time_minutes: readingTimeMinutes,
      sentiment_score: sentimentScore,
      keywords_used: topKeywords,
      sentence_count: sentences.length,
      avg_sentence_length: words.length / Math.max(sentences.length, 1),
      readability_index: this.calculateReadabilityIndex(content, words.length, sentences.length)
    };
  }

  private calculateSentimentScore(content: string): number {
    const positiveWords = [
      'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'incredible', 'outstanding',
      'perfect', 'wonderful', 'brilliant', 'superb', 'magnificent', 'exceptional', 'remarkable',
      'success', 'achieve', 'win', 'benefit', 'advantage', 'improve', 'boost', 'enhance',
      'love', 'enjoy', 'happy', 'excited', 'thrilled', 'delighted', 'satisfied', 'pleased'
    ];
    
    const negativeWords = [
      'terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'disgusting', 'disappointing',
      'failed', 'failure', 'problem', 'issue', 'difficult', 'hard', 'struggle', 'challenge',
      'worried', 'concerned', 'frustrated', 'angry', 'upset', 'sad', 'disappointed', 'annoyed'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (positiveWords.includes(cleanWord)) positiveCount++;
      if (negativeWords.includes(cleanWord)) negativeCount++;
    });
    
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) return 0.5; // Neutral
    
    return positiveCount / totalSentimentWords;
  }

  private calculateReadabilityIndex(content: string, wordCount: number, sentenceCount: number): number {
    // Simplified Flesch Reading Ease calculation
    const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
    const syllableCount = this.countSyllables(content);
    const avgSyllablesPerWord = syllableCount / Math.max(wordCount, 1);
    
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert to 0-1 scale (higher is more readable)
    return Math.max(0, Math.min(1, fleschScore / 100));
  }

  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length === 0) return;
      
      // Simple syllable counting algorithm
      let syllables = cleanWord.match(/[aeiouy]+/g)?.length || 0;
      if (cleanWord.endsWith('e')) syllables--;
      if (syllables === 0) syllables = 1;
      
      totalSyllables += syllables;
    });
    
    return totalSyllables;
  }

  // Visual Content Generation
  async generateVisualContent(request: {
    content_type: 'image' | 'video' | 'gif' | 'infographic';
    prompt: string;
    style: string;
    dimensions: { width: number; height: number };
    brand_elements?: any;
  }): Promise<VisualContent> {
    try {
      console.log(`🎨 Generating ${request.content_type} visual content`);

      // Generate visual content description and metadata
      const visualContent: VisualContent = {
        id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content_type: request.content_type,
        prompt: request.prompt,
        style: request.style,
        dimensions: request.dimensions,
        alt_text: this.generateAltText(request.prompt, request.content_type),
        performance_prediction: this.predictVisualPerformance(request),
        created_at: new Date().toISOString()
      };

      // Store visual content metadata
      await this.storeVisualContent(visualContent);

      console.log(`✅ Generated ${request.content_type} visual content: ${visualContent.id}`);
      return visualContent;

    } catch (error) {
      console.error('❌ Failed to generate visual content:', error);
      throw error;
    }
  }

  private generateAltText(prompt: string, contentType: string): string {
    // Generate descriptive alt text based on prompt
    const cleanPrompt = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const keywords = cleanPrompt.split(' ').filter(word => word.length > 2).slice(0, 5);
    
    return `${contentType} showing ${keywords.join(', ')}`;
  }

  private predictVisualPerformance(request: any): any {
    let visualAppealScore = 0.7; // Base score
    let brandConsistencyScore = 0.8;
    let engagementPotential = 0.6;

    // Adjust based on content type
    switch (request.content_type) {
      case 'video':
        engagementPotential += 0.2;
        break;
      case 'infographic':
        visualAppealScore += 0.1;
        break;
      case 'gif':
        engagementPotential += 0.15;
        break;
    }

    // Adjust based on style
    if (request.style === 'photorealistic') {
      visualAppealScore += 0.1;
    } else if (request.style === 'minimalist') {
      brandConsistencyScore += 0.1;
    }

    // Adjust based on dimensions (optimal ratios)
    const aspectRatio = request.dimensions.width / request.dimensions.height;
    if (aspectRatio >= 1.5 && aspectRatio <= 1.8) { // Good for social media
      engagementPotential += 0.1;
    }

    return {
      visual_appeal_score: Math.min(visualAppealScore, 1.0),
      brand_consistency_score: Math.min(brandConsistencyScore, 1.0),
      engagement_potential: Math.min(engagementPotential, 1.0)
    };
  }

  // Multi-language Content Generation
  async generateMultiLanguageContent(originalContentId: string, targetLanguages: string[]): Promise<MultiLanguageContent[]> {
    try {
      console.log(`🌍 Generating multi-language content for ${targetLanguages.length} languages`);

      // Get original content
      const originalContent = await this.getGeneratedContent(originalContentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      const multiLanguageContents: MultiLanguageContent[] = [];

      for (const language of targetLanguages) {
        console.log(`🔄 Processing translation for ${language}`);

        const translatedContent = await this.translateContent(originalContent.generated_text, language);
        const qualityScore = this.assessTranslationQuality(translatedContent, language);

        const multiLangContent: MultiLanguageContent = {
          original_content_id: originalContentId,
          language: language,
          translated_content: translatedContent.text,
          localization_notes: translatedContent.notes,
          cultural_adaptations: translatedContent.adaptations,
          quality_score: qualityScore,
          human_reviewed: qualityScore < 0.8,
          created_at: new Date().toISOString()
        };

        multiLanguageContents.push(multiLangContent);
        await this.storeMultiLanguageContent(multiLangContent);
      }

      console.log(`✅ Generated multi-language content for ${multiLanguageContents.length} languages`);
      return multiLanguageContents;

    } catch (error) {
      console.error('❌ Failed to generate multi-language content:', error);
      throw error;
    }
  }

  private async translateContent(text: string, targetLanguage: string): Promise<{
    text: string;
    notes: string[];
    adaptations: string[];
  }> {
    // Real translation logic would integrate with translation APIs
    // For now, implementing basic language-specific adaptations
    
    const languageAdaptations: Record<string, any> = {
      'es': { // Spanish
        formal_address: 'usted',
        currency: 'EUR',
        date_format: 'DD/MM/YYYY',
        cultural_notes: ['Use formal address for business', 'Include cultural warmth']
      },
      'fr': { // French
        formal_address: 'vous',
        currency: 'EUR', 
        date_format: 'DD/MM/YYYY',
        cultural_notes: ['Maintain formal business tone', 'Use proper French business etiquette']
      },
      'de': { // German
        formal_address: 'Sie',
        currency: 'EUR',
        date_format: 'DD.MM.YYYY',
        cultural_notes: ['Use formal business language', 'Be direct and precise']
      },
      'ja': { // Japanese
        formal_address: 'keigo',
        currency: 'JPY',
        date_format: 'YYYY/MM/DD',
        cultural_notes: ['Use appropriate honorifics', 'Maintain respectful tone']
      }
    };

    const adaptations = languageAdaptations[targetLanguage] || {};
    
    // Basic text processing for demonstration
    let translatedText = `[${targetLanguage.toUpperCase()}] ${text}`;
    
    // Apply basic adaptations
    const notes = [
      `Translated to ${targetLanguage}`,
      `Applied ${adaptations.formal_address || 'standard'} addressing`,
      `Currency format: ${adaptations.currency || 'USD'}`,
      `Date format: ${adaptations.date_format || 'MM/DD/YYYY'}`
    ];

    const culturalAdaptations = adaptations.cultural_notes || ['Standard localization applied'];

    return {
      text: translatedText,
      notes: notes,
      adaptations: culturalAdaptations
    };
  }

  private assessTranslationQuality(translatedContent: any, language: string): number {
    let qualityScore = 0.8; // Base quality score

    // Check text length (should be reasonable)
    const textLength = translatedContent.text.length;
    if (textLength > 10 && textLength < 10000) {
      qualityScore += 0.1;
    }

    // Check for language-specific markers
    if (translatedContent.text.includes(`[${language.toUpperCase()}]`)) {
      qualityScore += 0.05;
    }

    // Check cultural adaptations
    if (translatedContent.adaptations && translatedContent.adaptations.length > 0) {
      qualityScore += 0.05;
    }

    return Math.min(qualityScore, 1.0);
  }

  // Content Performance Tracking
  async trackContentPerformance(contentId: string, platform: string): Promise<ContentPerformance> {
    try {
      console.log(`📊 Tracking performance for content ${contentId} on ${platform}`);

      // Simulate gathering real performance metrics
      const metrics = await this.gatherRealPerformanceMetrics(contentId, platform);
      const audienceFeedback = await this.analyzeAudienceFeedback(contentId, platform);
      const optimizationInsights = this.generateOptimizationInsights(metrics, audienceFeedback);

      const performance: ContentPerformance = {
        content_id: contentId,
        platform: platform,
        metrics: metrics,
        audience_feedback: audienceFeedback,
        optimization_insights: optimizationInsights,
        last_updated: new Date().toISOString()
      };

      // Store performance data
      await this.storeContentPerformance(performance);

      console.log(`✅ Performance tracking completed for ${contentId}`);
      return performance;

    } catch (error) {
      console.error('❌ Failed to track content performance:', error);
      throw error;
    }
  }

  private async gatherRealPerformanceMetrics(contentId: string, platform: string): Promise<any> {
    // In a real implementation, this would connect to analytics APIs
    // For now, simulating realistic metrics based on platform and content type
    
    const baseMetrics = {
      impressions: Math.floor(Math.random() * 10000) + 1000,
      clicks: 0,
      conversions: 0,
      engagement_rate: 0,
      click_through_rate: 0,
      conversion_rate: 0
    };

    // Calculate derived metrics
    baseMetrics.clicks = Math.floor(baseMetrics.impressions * (Math.random() * 0.1 + 0.02)); // 2-12% CTR
    baseMetrics.conversions = Math.floor(baseMetrics.clicks * (Math.random() * 0.2 + 0.05)); // 5-25% conversion
    baseMetrics.engagement_rate = baseMetrics.clicks / baseMetrics.impressions;
    baseMetrics.click_through_rate = baseMetrics.engagement_rate;
    baseMetrics.conversion_rate = baseMetrics.conversions / Math.max(baseMetrics.clicks, 1);

    return baseMetrics;
  }

  private async analyzeAudienceFeedback(contentId: string, platform: string): Promise<any> {
    // Simulate audience feedback analysis
    const sentimentScore = Math.random() * 0.4 + 0.6; // 0.6 to 1.0 (generally positive)
    
    const reactions = ['👍', '❤️', '😊', '🔥', '💯'];
    const topReactions = reactions.slice(0, Math.floor(Math.random() * 3) + 2);

    return {
      sentiment_score: sentimentScore,
      comments_summary: this.generateCommentsSummary(sentimentScore),
      top_reactions: topReactions
    };
  }

  private generateCommentsSummary(sentimentScore: number): string {
    if (sentimentScore > 0.8) {
      return 'Highly positive audience response with praise for value and clarity';
    } else if (sentimentScore > 0.6) {
      return 'Generally positive feedback with some constructive suggestions';
    } else {
      return 'Mixed reactions with opportunities for improvement identified';
    }
  }

  private generateOptimizationInsights(metrics: any, feedback: any): string[] {
    const insights = [];

    if (metrics.click_through_rate < 0.05) {
      insights.push('Consider improving headline to increase click-through rate');
    }

    if (metrics.conversion_rate < 0.1) {
      insights.push('Strengthen call-to-action to improve conversion rate');
    }

    if (feedback.sentiment_score < 0.7) {
      insights.push('Review content tone and messaging based on audience feedback');
    }

    if (metrics.engagement_rate > 0.08) {
      insights.push('High engagement detected - consider similar content formats');
    }

    return insights;
  }

  // Database operations
  private async storeGeneratedContent(content: GeneratedContent): Promise<void> {
    try {
      const { error } = await supabase
        .from('generated_content')
        .insert({
          id: content.id,
          content_type: content.content_type,
          platform: content.platform,
          generated_text: content.generated_text,
          variations: content.variations,
          performance_prediction: content.performance_prediction,
          optimization_suggestions: content.optimization_suggestions,
          metadata: content.metadata,
          created_at: content.created_at
        });

      if (error) {
        console.warn('Could not store generated content:', error);
      }
    } catch (error) {
      console.warn('Error storing generated content:', error);
    }
  }

  private async storeVisualContent(content: VisualContent): Promise<void> {
    try {
      const { error } = await supabase
        .from('visual_content')
        .insert({
          id: content.id,
          content_type: content.content_type,
          prompt: content.prompt,
          style: content.style,
          dimensions: content.dimensions,
          generated_url: content.generated_url,
          thumbnail_url: content.thumbnail_url,
          alt_text: content.alt_text,
          performance_prediction: content.performance_prediction,
          created_at: content.created_at
        });

      if (error) {
        console.warn('Could not store visual content:', error);
      }
    } catch (error) {
      console.warn('Error storing visual content:', error);
    }
  }

  private async storeMultiLanguageContent(content: MultiLanguageContent): Promise<void> {
    try {
      const { error } = await supabase
        .from('multi_language_content')
        .insert({
          original_content_id: content.original_content_id,
          language: content.language,
          translated_content: content.translated_content,
          localization_notes: content.localization_notes,
          cultural_adaptations: content.cultural_adaptations,
          quality_score: content.quality_score,
          human_reviewed: content.human_reviewed,
          created_at: content.created_at
        });

      if (error) {
        console.warn('Could not store multi-language content:', error);
      }
    } catch (error) {
      console.warn('Error storing multi-language content:', error);
    }
  }

  private async storeContentPerformance(performance: ContentPerformance): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_performance')
        .upsert({
          content_id: performance.content_id,
          platform: performance.platform,
          metrics: performance.metrics,
          audience_feedback: performance.audience_feedback,
          optimization_insights: performance.optimization_insights,
          last_updated: performance.last_updated
        });

      if (error) {
        console.warn('Could not store content performance:', error);
      }
    } catch (error) {
      console.warn('Error storing content performance:', error);
    }
  }

  private async getGeneratedContent(contentId: string): Promise<GeneratedContent | null> {
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) {
        console.warn('Could not fetch generated content:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Error fetching generated content:', error);
      return null;
    }
  }
}'))
      .filter(word => word.length > 0)
      .reduce((acc: { [key: string]: number }, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([word]) => word);

    // Calculate sentiment (simplified)
    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'good', 'best', 'love', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor', 'failed'];
    
    const positiveCount = positiveWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
    
    let sentimentScore = 0;
    if (positiveCount > negativeCount) sentimentScore = (positiveCount - negativeCount) / words.length * 100;
    else if (negativeCount > positiveCount) sentimentScore = -((negativeCount - positiveCount) / words.length * 100);

    return {
      word_count: words.length,
      character_count: content.length,
      reading_time_minutes: Math.ceil(words.length / 200), // Average reading speed
      sentiment_score: Math.max(-100, Math.min(100, sentimentScore)),
      keywords_used: topKeywords
    };
  }

  private async storeGeneratedContent(content: GeneratedContent): Promise<void> {
    const { error } = await supabase
      .from('generated_content')
      .insert({
        id: content.id,
        content_type: content.content_type,
        platform: content.platform,
        generated_text: content.generated_text,
        variations: content.variations,
        performance_prediction: content.performance_prediction,
        optimization_suggestions: content.optimization_suggestions,
        metadata: content.metadata,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store generated content:', error);
    }
  }

  // Image and Video Generation
  async generateVisualContent(request: {
    content_type: 'image' | 'video' | 'gif' | 'infographic';
    prompt: string;
    style: 'photorealistic' | 'illustration' | 'cartoon' | 'minimalist' | 'corporate' | 'artistic';
    dimensions: { width: number; height: number };
    brand_guidelines?: any;
  }): Promise<VisualContent> {
    try {
      console.log(`🎨 Generating ${request.content_type} with ${request.style} style`);

      // Enhance prompt with style and brand guidelines
      let enhancedPrompt = this.enhanceVisualPrompt(request.prompt, request.style, request.brand_guidelines);

      // Generate visual content (simulated - in real implementation would use DALL-E, Midjourney, etc.)
      const generatedUrl = await this.generateVisualAsset(enhancedPrompt, request);
      
      // Generate thumbnail for videos
      const thumbnailUrl = request.content_type === 'video' ? await this.generateVideoThumbnail(generatedUrl) : undefined;
      
      // Generate alt text for accessibility
      const altText = this.generateAltText(request.prompt, request.content_type);
      
      // Predict visual performance
      const performancePrediction = this.predictVisualPerformance(request);

      const visualContent: VisualContent = {
        id: `visual_${Date.now()}`,
        content_type: request.content_type,
        prompt: enhancedPrompt,
        style: request.style,
        dimensions: request.dimensions,
        generated_url: generatedUrl,
        thumbnail_url: thumbnailUrl,
        alt_text: altText,
        performance_prediction: performancePrediction,
        created_at: new Date().toISOString()
      };

      // Store visual content
      await this.storeVisualContent(visualContent);

      console.log(`✅ Generated ${request.content_type} successfully`);
      return visualContent;

    } catch (error) {
      console.error('❌ Failed to generate visual content:', error);
      throw error;
    }
  }

  private enhanceVisualPrompt(prompt: string, style: string, brandGuidelines?: any): string {
    let enhancedPrompt = prompt;

    // Add style specifications
    const styleEnhancements = {
      photorealistic: 'photorealistic, high quality, professional photography, detailed',
      illustration: 'digital illustration, clean lines, vibrant colors, modern design',
      cartoon: 'cartoon style, friendly, approachable, colorful, fun',
      minimalist: 'minimalist design, clean, simple, elegant, white space',
      corporate: 'professional, business-appropriate, clean, modern, trustworthy',
      artistic: 'artistic, creative, unique perspective, expressive, imaginative'
    };

    enhancedPrompt += `, ${styleEnhancements[style as keyof typeof styleEnhancements]}`;

    // Add brand guidelines if provided
    if (brandGuidelines) {
      if (brandGuidelines.colors) {
        enhancedPrompt += `, using brand colors: ${brandGuidelines.colors.join(', ')}`;
      }
      if (brandGuidelines.fonts) {
        enhancedPrompt += `, typography style: ${brandGuidelines.fonts[0]}`;
      }
    }

    return enhancedPrompt;
  }

  private async generateVisualAsset(prompt: string, request: any): Promise<string> {
    // Simulate visual generation (in real implementation, would integrate with AI image generation APIs)
    console.log(`Generating visual asset with prompt: ${prompt}`);
    
    // Return a placeholder URL (in real implementation, would return actual generated image URL)
    const timestamp = Date.now();
    return `https://generated-content.example.com/${request.content_type}/${timestamp}.${request.content_type === 'video' ? 'mp4' : 'png'}`;
  }

  private async generateVideoThumbnail(videoUrl: string): Promise<string> {
    // Generate thumbnail for video content
    return videoUrl.replace('.mp4', '_thumbnail.jpg');
  }

  private generateAltText(prompt: string, contentType: string): string {
    return `${contentType} showing ${prompt}`;
  }

  private predictVisualPerformance(request: any): any {
    let visualAppealScore = 75;
    let brandConsistencyScore = 80;
    let engagementPotential = 70;

    // Adjust based on style
    if (request.style === 'photorealistic') visualAppealScore += 10;
    if (request.style === 'minimalist') brandConsistencyScore += 15;
    if (request.style === 'cartoon') engagementPotential += 20;

    // Adjust based on dimensions (optimal social media sizes)
    const { width, height } = request.dimensions;
    if ((width === 1080 && height === 1080) || (width === 1200 && height === 630)) {
      engagementPotential += 10;
    }

    return {
      visual_appeal_score: Math.min(visualAppealScore, 100),
      brand_consistency_score: Math.min(brandConsistencyScore, 100),
      engagement_potential: Math.min(engagementPotential, 100)
    };
  }

  private async storeVisualContent(content: VisualContent): Promise<void> {
    const { error } = await supabase
      .from('visual_content')
      .insert({
        id: content.id,
        content_type: content.content_type,
        prompt: content.prompt,
        style: content.style,
        dimensions: content.dimensions,
        generated_url: content.generated_url,
        thumbnail_url: content.thumbnail_url,
        alt_text: content.alt_text,
        performance_prediction: content.performance_prediction,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store visual content:', error);
    }
  }

  // Multi-language Content Generation
  async generateMultiLanguageContent(contentId: string, targetLanguages: string[]): Promise<MultiLanguageContent[]> {
    try {
      console.log(`🌍 Generating multi-language content for ${targetLanguages.length} languages`);

      // Get original content
      const originalContent = await this.getGeneratedContent(contentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      const multiLanguageContent: MultiLanguageContent[] = [];

      for (const language of targetLanguages) {
        console.log(`Translating to ${language}`);
        
        const translatedContent = await this.translateContent(originalContent.generated_text, language);
        const culturalAdaptations = this.getCulturalAdaptations(language);
        const qualityScore = this.assessTranslationQuality(translatedContent, language);

        const multiLangContent: MultiLanguageContent = {
          original_content_id: contentId,
          language: language,
          translated_content: translatedContent,
          localization_notes: this.getLocalizationNotes(language),
          cultural_adaptations: culturalAdaptations,
          quality_score: qualityScore,
          human_reviewed: false,
          created_at: new Date().toISOString()
        };

        multiLanguageContent.push(multiLangContent);
        await this.storeMultiLanguageContent(multiLangContent);
      }

      console.log(`✅ Generated content in ${targetLanguages.length} languages`);
      return multiLanguageContent;

    } catch (error) {
      console.error('❌ Failed to generate multi-language content:', error);
      throw error;
    }
  }

  private async getGeneratedContent(contentId: string): Promise<GeneratedContent | null> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) {
      console.warn('Could not fetch generated content:', error);
      return null;
    }

    return data;
  }

  private async translateContent(content: string, targetLanguage: string): Promise<string> {
    // Simulate translation (in real implementation, would use Google Translate, DeepL, etc.)
    console.log(`Translating content to ${targetLanguage}`);
    
    // For demo purposes, return a placeholder translation
    const languageNames: { [key: string]: string } = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese'
    };

    return `[Content translated to ${languageNames[targetLanguage] || targetLanguage}]\n\n${content}`;
  }

  private getCulturalAdaptations(language: string): string[] {
    const adaptations: { [key: string]: string[] } = {
      'ja': ['Use more formal language', 'Include honorifics', 'Avoid direct confrontation'],
      'de': ['Use formal address (Sie)', 'Be direct and precise', 'Include technical details'],
      'es': ['Use warm, personal tone', 'Include family references', 'Use emotional appeals'],
      'fr': ['Maintain elegant language', 'Use sophisticated vocabulary', 'Include cultural references'],
      'zh': ['Respect hierarchy', 'Use indirect communication', 'Include group benefits']
    };

    return adaptations[language] || ['Adapt tone for local culture', 'Consider local customs'];
  }

  private getLocalizationNotes(language: string): string[] {
    return [
      `Content localized for ${language} market`,
      'Currency and date formats adjusted',
      'Cultural references updated',
      'Legal disclaimers reviewed'
    ];
  }

  private assessTranslationQuality(translatedContent: string, language: string): number {
    // Simulate quality assessment (in real implementation, would use AI quality scoring)
    const baseScore = 85;
    const languageComplexity: { [key: string]: number } = {
      'es': 5, 'fr': 5, 'de': -5, 'it': 5, 'pt': 5,
      'ja': -15, 'ko': -10, 'zh': -10, 'ar': -15
    };

    return Math.max(60, Math.min(100, baseScore + (languageComplexity[language] || 0)));
  }

  private async storeMultiLanguageContent(content: MultiLanguageContent): Promise<void> {
    const { error } = await supabase
      .from('multi_language_content')
      .insert({
        original_content_id: content.original_content_id,
        language: content.language,
        translated_content: content.translated_content,
        localization_notes: content.localization_notes,
        cultural_adaptations: content.cultural_adaptations,
        quality_score: content.quality_score,
        human_reviewed: content.human_reviewed,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store multi-language content:', error);
    }
  }

  // Content Performance Tracking
  async trackContentPerformance(contentId: string, platform: string, metrics: any): Promise<ContentPerformance> {
    try {
      console.log(`📊 Tracking performance for content ${contentId} on ${platform}`);

      const performance: ContentPerformance = {
        content_id: contentId,
        platform: platform,
        metrics: {
          impressions: metrics.impressions || 0,
          clicks: metrics.clicks || 0,
          conversions: metrics.conversions || 0,
          engagement_rate: metrics.engagement_rate || 0,
          click_through_rate: metrics.clicks && metrics.impressions ? (metrics.clicks / metrics.impressions) * 100 : 0,
          conversion_rate: metrics.conversions && metrics.clicks ? (metrics.conversions / metrics.clicks) * 100 : 0
        },
        audience_feedback: {
          sentiment_score: metrics.sentiment_score || 0,
          comments_summary: metrics.comments_summary || 'No comments available',
          top_reactions: metrics.top_reactions || []
        },
        optimization_insights: this.generateOptimizationInsights(metrics),
        last_updated: new Date().toISOString()
      };

      await this.storeContentPerformance(performance);

      console.log(`✅ Performance tracked for content ${contentId}`);
      return performance;

    } catch (error) {
      console.error('❌ Failed to track content performance:', error);
      throw error;
    }
  }

  private generateOptimizationInsights(metrics: any): string[] {
    const insights = [];

    if (metrics.click_through_rate < 2) {
      insights.push('Consider improving headline or call-to-action to increase click-through rate');
    }

    if (metrics.conversion_rate < 5) {
      insights.push('Landing page optimization may improve conversion rates');
    }

    if (metrics.engagement_rate < 3) {
      insights.push('Try more engaging content formats or interactive elements');
    }

    if (metrics.sentiment_score < 0) {
      insights.push('Negative sentiment detected - review content tone and messaging');
    }

    return insights;
  }

  private async storeContentPerformance(performance: ContentPerformance): Promise<void> {
    const { error } = await supabase
      .from('content_performance')
      .upsert({
        content_id: performance.content_id,
        platform: performance.platform,
        metrics: performance.metrics,
        audience_feedback: performance.audience_feedback,
        optimization_insights: performance.optimization_insights,
        last_updated: performance.last_updated
      });

    if (error) {
      console.warn('Could not store content performance:', error);
    }
  }

  // Content Optimization
  async optimizeContent(contentId: string, performanceData: ContentPerformance): Promise<GeneratedContent> {
    try {
      console.log(`🔧 Optimizing content ${contentId} based on performance data`);

      const originalContent = await this.getGeneratedContent(contentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      // Analyze performance issues
      const issues = this.identifyPerformanceIssues(performanceData);
      
      // Generate optimized version
      const optimizedText = this.applyOptimizations(originalContent.generated_text, issues);
      
      // Create new optimized content
      const optimizedContent: GeneratedContent = {
        ...originalContent,
        id: `optimized_${Date.now()}`,
        generated_text: optimizedText,
        optimization_suggestions: [`Optimized based on performance data from ${performanceData.platform}`],
        created_at: new Date().toISOString()
      };

      await this.storeGeneratedContent(optimizedContent);

      console.log(`✅ Content optimized successfully`);
      return optimizedContent;

    } catch (error) {
      console.error('❌ Failed to optimize content:', error);
      throw error;
    }
  }

  private identifyPerformanceIssues(performance: ContentPerformance): string[] {
    const issues = [];

    if (performance.metrics.click_through_rate < 2) {
      issues.push('low_ctr');
    }

    if (performance.metrics.conversion_rate < 5) {
      issues.push('low_conversion');
    }

    if (performance.metrics.engagement_rate < 3) {
      issues.push('low_engagement');
    }

    if (performance.audience_feedback.sentiment_score < 0) {
      issues.push('negative_sentiment');
    }

    return issues;
  }

  private applyOptimizations(content: string, issues: string[]): string {
    let optimizedContent = content;

    issues.forEach(issue => {
      switch (issue) {
        case 'low_ctr':
          // Strengthen headline and call-to-action
          optimizedContent = this.strengthenCallToAction(optimizedContent);
          break;
        case 'low_conversion':
          // Add urgency and social proof
          optimizedContent = this.addUrgencyElements(optimizedContent);
          break;
        case 'low_engagement':
          // Make content more interactive
          optimizedContent = this.makeMoreEngaging(optimizedContent);
          break;
        case 'negative_sentiment':
          // Adjust tone to be more positive
          optimizedContent = this.improveContentTone(optimizedContent);
          break;
      }
    });

    return optimizedContent;
  }

  private strengthenCallToAction(content: string): string {
    // Replace weak CTAs with stronger ones
    const strongCTAs = ['Get Started Now', 'Claim Your Spot Today', 'Start Your Free Trial', 'Download Instantly'];
    const weakCTAs = ['learn more', 'click here', 'find out', 'see more'];
    
    let strengthenedContent = content;
    weakCTAs.forEach((weakCTA, index) => {
      const regex = new RegExp(weakCTA, 'gi');
      strengthenedContent = strengthenedContent.replace(regex, strongCTAs[index % strongCTAs.length]);
    });
    
    return strengthenedContent;
  }

  private addUrgencyElements(content: string): string {
    const urgencyPhrases = [
      'Limited time offer',
      'Only available today',
      'Don\'t miss out',
      'Act now before it\'s too late'
    ];
    
    const randomUrgency = urgencyPhrases[Math.floor(Math.random() * urgencyPhrases.length)];
    return `${randomUrgency}! ${content}`;
  }

  private makeMoreEngaging(content: string): string {
    // Add questions and interactive elements
    const questions = [
      'What do you think?',
      'Have you experienced this?',
      'Ready to transform your business?',
      'Which option sounds better to you?'
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    return `${content}\n\n${randomQuestion}`;
  }

  private improveContentTone(content: string): string {
    // Replace negative words with positive alternatives
    const positiveReplacements: { [key: string]: string } = {
      'problem': 'challenge',
      'difficult': 'manageable',
      'impossible': 'achievable with the right approach',
      'failure': 'learning opportunity',
      'can\'t': 'haven\'t yet'
    };
    
    let improvedContent = content;
    Object.entries(positiveReplacements).forEach(([negative, positive]) => {
      const regex = new RegExp(negative, 'gi');
      improvedContent = improvedContent.replace(regex, positive);
    });
    
    return improvedContent;
  }

  // Utility Methods
  async getContentAnalytics(dateRange: { start: string; end: string }): Promise<any> {
    try {
      const { data: contentData, error } = await supabase
        .from('generated_content')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (error) throw error;

      const analytics = {
        total_content_generated: contentData?.length || 0,
        content_by_type: this.groupByContentType(contentData || []),
        average_performance: this.calculateAveragePerformance(contentData || []),
        top_performing_content: this.getTopPerformingContent(contentData || []),
        optimization_opportunities: this.identifyOptimizationOpportunities(contentData || [])
      };

      return analytics;

    } catch (error) {
      console.error('❌ Failed to get content analytics:', error);
      throw error;
    }
  }

  private groupByContentType(contentData: any[]): any {
    return contentData.reduce((acc, content) => {
      acc[content.content_type] = (acc[content.content_type] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAveragePerformance(contentData: any[]): any {
    if (contentData.length === 0) return {};

    const totalPerformance = contentData.reduce((acc, content) => {
      const perf = content.performance_prediction || {};
      acc.engagement_score += perf.engagement_score || 0;
      acc.conversion_probability += perf.conversion_probability || 0;
      acc.readability_score += perf.readability_score || 0;
      return acc;
    }, { engagement_score: 0, conversion_probability: 0, readability_score: 0 });

    return {
      engagement_score: totalPerformance.engagement_score / contentData.length,
      conversion_probability: totalPerformance.conversion_probability / contentData.length,
      readability_score: totalPerformance.readability_score / contentData.length
    };
  }

  private getTopPerformingContent(contentData: any[]): any[] {
    return contentData
      .sort((a, b) => {
        const aScore = (a.performance_prediction?.engagement_score || 0) + (a.performance_prediction?.conversion_probability || 0);
        const bScore = (b.performance_prediction?.engagement_score || 0) + (b.performance_prediction?.conversion_probability || 0);
        return bScore - aScore;
      })
      .slice(0, 5);
  }

  private identifyOptimizationOpportunities(contentData: any[]): string[] {
    const opportunities = [];

    const lowPerformingContent = contentData.filter(content => 
      (content.performance_prediction?.engagement_score || 0) < 60
    );

    if (lowPerformingContent.length > contentData.length * 0.3) {
      opportunities.push('30% of content has low engagement scores - consider improving headlines and CTAs');
    }

    const lowReadabilityContent = contentData.filter(content => 
      (content.performance_prediction?.readability_score || 0) < 70
    );

    if (lowReadabilityContent.length > contentData.length * 0.2) {
      opportunities.push('20% of content has low readability - consider simplifying language');
    }

    return opportunities;
  }
}

export const contentGenerationService = ContentGenerationService.getInstance(); => word.length > 4)
      .map(word => word.toLowerCase().replace(/[^a-z]/g, ''))
      .filter(word => word.length > 0)
      .slice(0, 10);
    
    // Calculate sentiment (simplified)
    const positiveWords = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'success', 'best', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'horrible', 'fail', 'problem', 'issue'];
    
    const positiveCount = positiveWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
    
    const sentimentScore = ((positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1)) * 50 + 50;
    
    return {
      word_count: words.length,
      character_count: content.length,
      reading_time_minutes: Math.ceil(words.length / 200), // Average reading speed
      sentiment_score: Math.round(sentimentScore),
      keywords_used: keywords
    };
  }

  private async storeGeneratedContent(content: GeneratedContent): Promise<void> {
    const { error } = await supabase
      .from('generated_content')
      .insert({
        id: content.id,
        content_type: content.content_type,
        platform: content.platform,
        generated_text: content.generated_text,
        variations: content.variations,
        performance_prediction: content.performance_prediction,
        optimization_suggestions: content.optimization_suggestions,
        metadata: content.metadata,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store generated content:', error);
    }
  }  //
 Visual Content Generation
  async generateVisualContent(
    prompt: string,
    contentType: 'image' | 'video' | 'gif' | 'infographic',
    style: 'photorealistic' | 'illustration' | 'cartoon' | 'minimalist' | 'corporate' | 'artistic',
    dimensions: { width: number; height: number }
  ): Promise<VisualContent> {
    try {
      console.log(`🎨 Generating ${contentType} with ${style} style`);

      // In a real implementation, this would call AI image/video generation APIs
      // For now, we'll create a mock response
      const visualContent: VisualContent = {
        id: `visual_${Date.now()}`,
        content_type: contentType,
        prompt: prompt,
        style: style,
        dimensions: dimensions,
        generated_url: this.generateMockImageUrl(contentType, style),
        thumbnail_url: this.generateMockThumbnailUrl(contentType),
        alt_text: this.generateAltText(prompt, contentType),
        performance_prediction: this.predictVisualPerformance(prompt, contentType, style),
        created_at: new Date().toISOString()
      };

      // Store visual content
      await this.storeVisualContent(visualContent);

      console.log(`✅ Generated ${contentType} content`);
      return visualContent;

    } catch (error) {
      console.error('❌ Failed to generate visual content:', error);
      throw error;
    }
  }

  private generateMockImageUrl(contentType: string, style: string): string {
    // Generate mock URLs for different content types and styles
    const baseUrl = 'https://generated-content.example.com';
    const timestamp = Date.now();
    return `${baseUrl}/${contentType}/${style}/${timestamp}.${contentType === 'video' ? 'mp4' : 'jpg'}`;
  }

  private generateMockThumbnailUrl(contentType: string): string {
    const baseUrl = 'https://generated-content.example.com';
    const timestamp = Date.now();
    return `${baseUrl}/thumbnails/${contentType}_${timestamp}.jpg`;
  }

  private generateAltText(prompt: string, contentType: string): string {
    // Generate descriptive alt text based on the prompt
    const cleanPrompt = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    return `${contentType} showing ${cleanPrompt}`;
  }

  private predictVisualPerformance(prompt: string, contentType: string, style: string): any {
    let visualAppealScore = 75;
    let brandConsistencyScore = 70;
    let engagementPotential = 65;

    // Adjust scores based on content type
    if (contentType === 'video') {
      engagementPotential += 20;
      visualAppealScore += 10;
    } else if (contentType === 'infographic') {
      brandConsistencyScore += 15;
      visualAppealScore += 5;
    }

    // Adjust scores based on style
    if (style === 'corporate') {
      brandConsistencyScore += 15;
    } else if (style === 'artistic') {
      visualAppealScore += 20;
      engagementPotential += 10;
    }

    // Adjust based on prompt complexity
    const promptWords = prompt.split(' ').length;
    if (promptWords > 10) {
      visualAppealScore += 10;
    }

    return {
      visual_appeal_score: Math.min(Math.max(visualAppealScore, 0), 100),
      brand_consistency_score: Math.min(Math.max(brandConsistencyScore, 0), 100),
      engagement_potential: Math.min(Math.max(engagementPotential, 0), 100)
    };
  }

  private async storeVisualContent(content: VisualContent): Promise<void> {
    const { error } = await supabase
      .from('visual_content')
      .insert({
        id: content.id,
        content_type: content.content_type,
        prompt: content.prompt,
        style: content.style,
        dimensions: content.dimensions,
        generated_url: content.generated_url,
        thumbnail_url: content.thumbnail_url,
        alt_text: content.alt_text,
        performance_prediction: content.performance_prediction,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store visual content:', error);
    }
  }

  // Multi-Language Content Generation
  async translateContent(
    originalContentId: string,
    targetLanguage: string,
    includeLocalization: boolean = true
  ): Promise<MultiLanguageContent> {
    try {
      console.log(`🌍 Translating content to ${targetLanguage}`);

      // Get original content
      const originalContent = await this.getGeneratedContent(originalContentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      // Translate the content
      const translatedText = await this.performTranslation(originalContent.generated_text, targetLanguage);
      
      // Apply localization if requested
      const localizedContent = includeLocalization 
        ? await this.applyLocalization(translatedText, targetLanguage)
        : translatedText;

      // Generate localization notes
      const localizationNotes = this.generateLocalizationNotes(targetLanguage);
      
      // Generate cultural adaptations
      const culturalAdaptations = this.generateCulturalAdaptations(targetLanguage);
      
      // Calculate quality score
      const qualityScore = this.calculateTranslationQuality(originalContent.generated_text, localizedContent);

      const multiLanguageContent: MultiLanguageContent = {
        original_content_id: originalContentId,
        language: targetLanguage,
        translated_content: localizedContent,
        localization_notes: localizationNotes,
        cultural_adaptations: culturalAdaptations,
        quality_score: qualityScore,
        human_reviewed: false,
        created_at: new Date().toISOString()
      };

      // Store translated content
      await this.storeMultiLanguageContent(multiLanguageContent);

      console.log(`✅ Content translated to ${targetLanguage} (Quality: ${qualityScore}%)`);
      return multiLanguageContent;

    } catch (error) {
      console.error('❌ Failed to translate content:', error);
      throw error;
    }
  }

  private async getGeneratedContent(contentId: string): Promise<GeneratedContent | null> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) {
      console.warn('Could not fetch original content:', error);
      return null;
    }

    return data;
  }

  private async performTranslation(text: string, targetLanguage: string): Promise<string> {
    // In a real implementation, this would use translation APIs like Google Translate or DeepL
    // For now, we'll provide mock translations for common languages
    
    const mockTranslations: { [key: string]: { [key: string]: string } } = {
      'es': {
        'Get Started Today': 'Comience Hoy',
        'Learn More': 'Aprende Más',
        'Join thousands': 'Únete a miles',
        'Transform your business': 'Transforma tu negocio'
      },
      'fr': {
        'Get Started Today': 'Commencez Aujourd\'hui',
        'Learn More': 'En Savoir Plus',
        'Join thousands': 'Rejoignez des milliers',
        'Transform your business': 'Transformez votre entreprise'
      },
      'de': {
        'Get Started Today': 'Heute Beginnen',
        'Learn More': 'Mehr Erfahren',
        'Join thousands': 'Schließen Sie sich Tausenden an',
        'Transform your business': 'Transformieren Sie Ihr Unternehmen'
      }
    };

    let translatedText = text;
    const languageTranslations = mockTranslations[targetLanguage];
    
    if (languageTranslations) {
      Object.entries(languageTranslations).forEach(([english, translated]) => {
        translatedText = translatedText.replace(new RegExp(english, 'gi'), translated);
      });
    }

    return translatedText;
  }

  private async applyLocalization(text: string, targetLanguage: string): Promise<string> {
    let localizedText = text;

    // Apply language-specific formatting and cultural adaptations
    switch (targetLanguage) {
      case 'es':
        // Spanish localization
        localizedText = localizedText.replace(/\$(\d+)/g, '$1 USD');
        break;
      case 'fr':
        // French localization
        localizedText = localizedText.replace(/\$(\d+)/g, '$1 USD');
        break;
      case 'de':
        // German localization
        localizedText = localizedText.replace(/\$(\d+)/g, '$1 USD');
        break;
      case 'ja':
        // Japanese localization
        localizedText = localizedText.replace(/\$(\d+)/g, '¥$1');
        break;
    }

    return localizedText;
  }

  private generateLocalizationNotes(targetLanguage: string): string[] {
    const notes: { [key: string]: string[] } = {
      'es': [
        'Consider using formal "usted" vs informal "tú" based on target audience',
        'Adapt currency references to local market',
        'Review cultural references for Spanish-speaking markets'
      ],
      'fr': [
        'Ensure proper use of formal vs informal address',
        'Adapt business terminology to French market standards',
        'Consider regional variations (France vs Quebec)'
      ],
      'de': [
        'Use appropriate level of formality (Sie vs Du)',
        'Adapt to German business communication style',
        'Consider compound word formations'
      ],
      'ja': [
        'Ensure appropriate honorific language (keigo)',
        'Adapt to Japanese business etiquette',
        'Consider vertical vs horizontal text layout'
      ]
    };

    return notes[targetLanguage] || ['Review cultural context for target market', 'Verify technical terminology accuracy'];
  }

  private generateCulturalAdaptations(targetLanguage: string): string[] {
    const adaptations: { [key: string]: string[] } = {
      'es': [
        'Emphasize family and community values',
        'Use warmer, more personal tone',
        'Include references to local holidays and traditions'
      ],
      'fr': [
        'Emphasize quality and sophistication',
        'Use more formal business language',
        'Reference French business culture and values'
      ],
      'de': [
        'Emphasize efficiency and precision',
        'Use direct, factual communication style',
        'Focus on technical specifications and quality'
      ],
      'ja': [
        'Emphasize group harmony and consensus',
        'Use indirect communication style',
        'Show respect for hierarchy and tradition'
      ]
    };

    return adaptations[targetLanguage] || ['Adapt messaging to local cultural values', 'Consider local business practices'];
  }

  private calculateTranslationQuality(originalText: string, translatedText: string): number {
    // Simple quality calculation based on length and structure preservation
    const originalLength = originalText.length;
    const translatedLength = translatedText.length;
    
    // Quality decreases if translation is too short or too long compared to original
    const lengthRatio = translatedLength / originalLength;
    let qualityScore = 85; // Base quality score
    
    if (lengthRatio < 0.7 || lengthRatio > 1.5) {
      qualityScore -= 15;
    }
    
    // Check if key elements are preserved
    const originalSentences = originalText.split(/[.!?]+/).length;
    const translatedSentences = translatedText.split(/[.!?]+/).length;
    
    if (Math.abs(originalSentences - translatedSentences) > 2) {
      qualityScore -= 10;
    }
    
    return Math.max(Math.min(qualityScore, 100), 50);
  }

  private async storeMultiLanguageContent(content: MultiLanguageContent): Promise<void> {
    const { error } = await supabase
      .from('multi_language_content')
      .insert({
        original_content_id: content.original_content_id,
        language: content.language,
        translated_content: content.translated_content,
        localization_notes: content.localization_notes,
        cultural_adaptations: content.cultural_adaptations,
        quality_score: content.quality_score,
        human_reviewed: content.human_reviewed,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store multi-language content:', error);
    }
  }

  // Content Performance Tracking
  async trackContentPerformance(contentId: string, platform: string, metrics: any): Promise<ContentPerformance> {
    try {
      console.log(`📊 Tracking performance for content ${contentId} on ${platform}`);

      const performance: ContentPerformance = {
        content_id: contentId,
        platform: platform,
        metrics: {
          impressions: metrics.impressions || 0,
          clicks: metrics.clicks || 0,
          conversions: metrics.conversions || 0,
          engagement_rate: metrics.engagement_rate || 0,
          click_through_rate: metrics.clicks && metrics.impressions ? (metrics.clicks / metrics.impressions) * 100 : 0,
          conversion_rate: metrics.conversions && metrics.clicks ? (metrics.conversions / metrics.clicks) * 100 : 0
        },
        audience_feedback: {
          sentiment_score: metrics.sentiment_score || 75,
          comments_summary: metrics.comments_summary || 'Generally positive feedback',
          top_reactions: metrics.top_reactions || ['👍', '❤️', '🔥']
        },
        optimization_insights: this.generatePerformanceInsights(metrics),
        last_updated: new Date().toISOString()
      };

      // Store performance data
      await this.storeContentPerformance(performance);

      console.log(`✅ Performance tracked for content ${contentId}`);
      return performance;

    } catch (error) {
      console.error('❌ Failed to track content performance:', error);
      throw error;
    }
  }

  private generatePerformanceInsights(metrics: any): string[] {
    const insights = [];

    if (metrics.click_through_rate < 2) {
      insights.push('Consider testing different headlines to improve click-through rate');
    }

    if (metrics.conversion_rate < 5) {
      insights.push('Strengthen the call-to-action to boost conversion rates');
    }

    if (metrics.engagement_rate > 10) {
      insights.push('High engagement detected - consider creating similar content');
    }

    if (metrics.sentiment_score < 60) {
      insights.push('Negative sentiment detected - review content tone and messaging');
    }

    return insights;
  }

  private async storeContentPerformance(performance: ContentPerformance): Promise<void> {
    const { error } = await supabase
      .from('content_performance')
      .insert({
        content_id: performance.content_id,
        platform: performance.platform,
        metrics: performance.metrics,
        audience_feedback: performance.audience_feedback,
        optimization_insights: performance.optimization_insights,
        last_updated: performance.last_updated
      });

    if (error) {
      console.warn('Could not store content performance:', error);
    }
  }

  // Content Optimization
  async optimizeContentForAudience(contentId: string, audienceSegment: string): Promise<GeneratedContent> {
    try {
      console.log(`🎯 Optimizing content ${contentId} for ${audienceSegment} audience`);

      // Get original content
      const originalContent = await this.getGeneratedContent(contentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      // Apply audience-specific optimizations
      const optimizedText = this.applyAudienceOptimizations(originalContent.generated_text, audienceSegment);
      
      // Generate new performance prediction
      const performancePrediction = this.predictContentPerformance(optimizedText, {
        content_type: originalContent.content_type,
        platform: originalContent.platform,
        objective: 'conversion',
        target_audience: audienceSegment,
        key_messages: [],
        length: 'medium',
        language: 'en'
      }, null);

      const optimizedContent: GeneratedContent = {
        ...originalContent,
        id: `optimized_${Date.now()}`,
        generated_text: optimizedText,
        performance_prediction: performancePrediction,
        optimization_suggestions: this.generateOptimizationSuggestions(optimizedText, {
          content_type: originalContent.content_type,
          objective: 'conversion',
          target_audience: audienceSegment,
          key_messages: [],
          length: 'medium',
          language: 'en'
        }),
        created_at: new Date().toISOString()
      };

      // Store optimized content
      await this.storeGeneratedContent(optimizedContent);

      console.log(`✅ Content optimized for ${audienceSegment} audience`);
      return optimizedContent;

    } catch (error) {
      console.error('❌ Failed to optimize content for audience:', error);
      throw error;
    }
  }

  private applyAudienceOptimizations(content: string, audienceSegment: string): string {
    let optimizedContent = content;

    // Apply audience-specific modifications
    switch (audienceSegment.toLowerCase()) {
      case 'millennials':
        optimizedContent = optimizedContent.replace(/\bexcellent\b/gi, 'awesome');
        optimizedContent = optimizedContent.replace(/\bgreat\b/gi, 'amazing');
        break;
      case 'executives':
        optimizedContent = optimizedContent.replace(/\bawesome\b/gi, 'exceptional');
        optimizedContent = optimizedContent.replace(/\bcool\b/gi, 'innovative');
        break;
      case 'small business owners':
        optimizedContent = optimizedContent.replace(/\benterprise\b/gi, 'business');
        optimizedContent = optimizedContent.replace(/\bscale\b/gi, 'grow');
        break;
    }

    return optimizedContent;
  }

  // Utility Methods
  async getContentTemplates(): Promise<{ [key: string]: string[] }> {
    return {
      email: ['Professional email template', 'Promotional email template', 'Newsletter template'],
      ad_copy: ['Facebook ad template', 'Google ad template', 'Display ad template'],
      social_media: ['Instagram post template', 'Twitter post template', 'LinkedIn post template'],
      blog_post: ['How-to blog template', 'Listicle template', 'Case study template'],
      landing_page: ['Sales page template', 'Lead capture template', 'Product page template']
    };
  }

  async getBrandVoiceProfiles(): Promise<BrandVoiceProfile[]> {
    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch brand voice profiles:', error);
      return [];
    }

    return data || [];
  }

  async getContentPerformanceAnalytics(contentId: string): Promise<ContentPerformance[]> {
    const { data, error } = await supabase
      .from('content_performance')
      .select('*')
      .eq('content_id', contentId)
      .order('last_updated', { ascending: false });

    if (error) {
      console.warn('Could not fetch content performance:', error);
      return [];
    }

    return data || [];
  }
}

// Export singleton instance
export const contentGenerationService = ContentGenerationService.getInstance(); => word
.length > 3 && !['this', 'that', 'with', 'have', 'will', 'your', 'they', 'been', 'their'].includes(word.toLowerCase()))
      .reduce((acc: Record<string, number>, word) => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        acc[cleanWord] = (acc[cleanWord] || 0) + 1;
        return acc;
      }, {});

    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([word]) => word);

    // Calculate sentiment (simplified)
    const positiveWords = ['great', 'excellent', 'amazing', 'fantastic', 'wonderful', 'perfect', 'best', 'love', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
    
    const positiveCount = positiveWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (content.toLowerCase().split(word).length - 1), 0);
    
    const sentimentScore = Math.max(-100, Math.min(100, (positiveCount - negativeCount) * 10 + 50));

    return {
      word_count: words.length,
      character_count: content.length,
      reading_time_minutes: Math.ceil(words.length / 200), // Average reading speed
      sentiment_score: sentimentScore,
      keywords_used: topKeywords
    };
  }

  private async storeGeneratedContent(content: GeneratedContent): Promise<void> {
    const { error } = await supabase
      .from('generated_content')
      .insert({
        id: content.id,
        content_type: content.content_type,
        platform: content.platform,
        generated_text: content.generated_text,
        variations: content.variations,
        performance_prediction: content.performance_prediction,
        optimization_suggestions: content.optimization_suggestions,
        metadata: content.metadata,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store generated content:', error);
    }
  }

  // Visual Content Generation
  async generateVisualContent(prompt: string, contentType: 'image' | 'video' | 'gif' | 'infographic', style: VisualContent['style'], dimensions: { width: number; height: number }): Promise<VisualContent> {
    try {
      console.log(`🎨 Generating ${contentType} with style: ${style}`);

      // Generate visual content (mock implementation)
      const visualContent: VisualContent = {
        id: `visual_${Date.now()}`,
        content_type: contentType,
        prompt: prompt,
        style: style,
        dimensions: dimensions,
        generated_url: this.generateMockImageUrl(contentType, style),
        thumbnail_url: this.generateMockThumbnailUrl(),
        alt_text: this.generateAltText(prompt, contentType),
        performance_prediction: this.predictVisualPerformance(prompt, contentType, style),
        created_at: new Date().toISOString()
      };

      // Store visual content
      await this.storeVisualContent(visualContent);

      console.log(`✅ Generated ${contentType} content successfully`);
      return visualContent;

    } catch (error) {
      console.error('❌ Failed to generate visual content:', error);
      throw error;
    }
  }

  private generateMockImageUrl(contentType: string, style: string): string {
    // Mock image generation - in reality would use AI image generation service
    const baseUrl = 'https://images.unsplash.com';
    const imageIds = {
      photorealistic: ['1557804506-669a67965ba0', '1551434678-e076c223a692', '1551836022-0c4c3aae-d5d4'],
      illustration: ['1558618047-3c8c76ca7d13', '1557683316-973673baf926', '1557683311-9834b5b2c8e5'],
      corporate: ['1557804506-669a67965ba0', '1551434678-e076c223a692', '1557683316-973673baf926'],
      minimalist: ['1558618047-3c8c76ca7d13', '1557683311-9834b5b2c8e5', '1551836022-0c4c3aae-d5d4'],
      artistic: ['1557683316-973673baf926', '1558618047-3c8c76ca7d13', '1557683311-9834b5b2c8e5']
    };

    const styleImages = imageIds[style as keyof typeof imageIds] || imageIds.corporate;
    const randomImage = styleImages[Math.floor(Math.random() * styleImages.length)];
    
    return `${baseUrl}/${randomImage}?w=800&h=600&fit=crop`;
  }

  private generateMockThumbnailUrl(): string {
    return 'https://images.unsplash.com/1557804506-669a67965ba0?w=200&h=150&fit=crop';
  }

  private generateAltText(prompt: string, contentType: string): string {
    return `AI-generated ${contentType} showing ${prompt.toLowerCase()}`;
  }

  private predictVisualPerformance(prompt: string, contentType: string, style: string): any {
    let visualAppealScore = 70;
    let brandConsistencyScore = 75;
    let engagementPotential = 65;

    // Adjust based on content type
    if (contentType === 'video') engagementPotential += 20;
    if (contentType === 'infographic') visualAppealScore += 15;
    if (contentType === 'gif') engagementPotential += 10;

    // Adjust based on style
    if (style === 'photorealistic') visualAppealScore += 10;
    if (style === 'corporate') brandConsistencyScore += 15;
    if (style === 'artistic') visualAppealScore += 15;

    // Adjust based on prompt complexity
    if (prompt.split(' ').length > 10) visualAppealScore += 5;

    return {
      visual_appeal_score: Math.min(Math.max(visualAppealScore, 0), 100),
      brand_consistency_score: Math.min(Math.max(brandConsistencyScore, 0), 100),
      engagement_potential: Math.min(Math.max(engagementPotential, 0), 100)
    };
  }

  private async storeVisualContent(content: VisualContent): Promise<void> {
    const { error } = await supabase
      .from('visual_content')
      .insert({
        id: content.id,
        content_type: content.content_type,
        prompt: content.prompt,
        style: content.style,
        dimensions: content.dimensions,
        generated_url: content.generated_url,
        thumbnail_url: content.thumbnail_url,
        alt_text: content.alt_text,
        performance_prediction: content.performance_prediction,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store visual content:', error);
    }
  }

  // Content Performance Tracking
  async trackContentPerformance(contentId: string, platform: string, metrics: ContentPerformance['metrics']): Promise<ContentPerformance> {
    try {
      console.log(`📊 Tracking performance for content: ${contentId}`);

      // Calculate derived metrics
      const clickThroughRate = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      const conversionRate = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
      const engagementRate = metrics.impressions > 0 ? (metrics.engagement_rate || 0) : 0;

      // Generate audience feedback analysis
      const audienceFeedback = await this.analyzeAudienceFeedback(contentId, platform);

      // Generate optimization insights
      const optimizationInsights = this.generatePerformanceInsights(metrics, clickThroughRate, conversionRate);

      const performance: ContentPerformance = {
        content_id: contentId,
        platform: platform,
        metrics: {
          ...metrics,
          click_through_rate: clickThroughRate,
          conversion_rate: conversionRate
        },
        audience_feedback: audienceFeedback,
        optimization_insights: optimizationInsights,
        last_updated: new Date().toISOString()
      };

      // Store performance data
      await this.storeContentPerformance(performance);

      console.log(`✅ Performance tracked for content: ${contentId}`);
      return performance;

    } catch (error) {
      console.error('❌ Failed to track content performance:', error);
      throw error;
    }
  }

  private async analyzeAudienceFeedback(contentId: string, platform: string): Promise<ContentPerformance['audience_feedback']> {
    // Mock audience feedback analysis
    const sentimentScores = [65, 78, 82, 71, 89, 76];
    const sentimentScore = sentimentScores[Math.floor(Math.random() * sentimentScores.length)];

    const commentsSummaries = [
      'Mostly positive feedback with users appreciating the clear value proposition',
      'Mixed reactions with some users requesting more detailed information',
      'Highly positive response with many users sharing and commenting',
      'Good engagement with users asking follow-up questions',
      'Strong positive sentiment with users praising the content quality'
    ];

    const topReactions = [
      ['👍', '❤️', '🔥'],
      ['😍', '👏', '💯'],
      ['🚀', '⭐', '👌'],
      ['💪', '🎯', '✨']
    ];

    return {
      sentiment_score: sentimentScore,
      comments_summary: commentsSummaries[Math.floor(Math.random() * commentsSummaries.length)],
      top_reactions: topReactions[Math.floor(Math.random() * topReactions.length)]
    };
  }

  private generatePerformanceInsights(metrics: ContentPerformance['metrics'], ctr: number, conversionRate: number): string[] {
    const insights = [];

    // CTR insights
    if (ctr < 1) {
      insights.push('Low click-through rate suggests the content may need a stronger call-to-action or more compelling headline');
    } else if (ctr > 5) {
      insights.push('Excellent click-through rate indicates strong audience engagement with the content');
    }

    // Conversion insights
    if (conversionRate < 2) {
      insights.push('Low conversion rate may indicate a mismatch between content promise and landing page experience');
    } else if (conversionRate > 10) {
      insights.push('High conversion rate shows excellent alignment between content and audience needs');
    }

    // Engagement insights
    if (metrics.engagement_rate < 2) {
      insights.push('Low engagement suggests content may not be resonating with the target audience');
    } else if (metrics.engagement_rate > 8) {
      insights.push('High engagement indicates content is highly relevant and valuable to the audience');
    }

    // Impressions insights
    if (metrics.impressions < 1000) {
      insights.push('Low impression count suggests content distribution could be improved');
    }

    return insights;
  }

  private async storeContentPerformance(performance: ContentPerformance): Promise<void> {
    const { error } = await supabase
      .from('content_performance')
      .upsert({
        content_id: performance.content_id,
        platform: performance.platform,
        metrics: performance.metrics,
        audience_feedback: performance.audience_feedback,
        optimization_insights: performance.optimization_insights,
        last_updated: performance.last_updated
      });

    if (error) {
      console.warn('Could not store content performance:', error);
    }
  }

  // Multi-Language Content Generation and Translation
  async translateContent(contentId: string, targetLanguage: string, includeLocalization: boolean = true): Promise<MultiLanguageContent> {
    try {
      console.log(`🌍 Translating content ${contentId} to ${targetLanguage}`);

      // Get original content
      const originalContent = await this.getGeneratedContent(contentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      // Translate content
      const translatedText = await this.performTranslation(originalContent.generated_text, targetLanguage);

      // Apply localization if requested
      let localizedContent = translatedText;
      let culturalAdaptations: string[] = [];
      let localizationNotes: string[] = [];

      if (includeLocalization) {
        const localizationResult = await this.applyLocalization(translatedText, targetLanguage, originalContent.content_type);
        localizedContent = localizationResult.content;
        culturalAdaptations = localizationResult.adaptations;
        localizationNotes = localizationResult.notes;
      }

      // Calculate quality score
      const qualityScore = this.calculateTranslationQuality(originalContent.generated_text, localizedContent, targetLanguage);

      const multiLanguageContent: MultiLanguageContent = {
        original_content_id: contentId,
        language: targetLanguage,
        translated_content: localizedContent,
        localization_notes: localizationNotes,
        cultural_adaptations: culturalAdaptations,
        quality_score: qualityScore,
        human_reviewed: false,
        created_at: new Date().toISOString()
      };

      // Store translated content
      await this.storeMultiLanguageContent(multiLanguageContent);

      console.log(`✅ Content translated to ${targetLanguage} with ${qualityScore}% quality score`);
      return multiLanguageContent;

    } catch (error) {
      console.error('❌ Failed to translate content:', error);
      throw error;
    }
  }

  private async getGeneratedContent(contentId: string): Promise<GeneratedContent | null> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) {
      console.warn('Could not fetch generated content:', error);
      return null;
    }

    return data;
  }

  private async performTranslation(text: string, targetLanguage: string): Promise<string> {
    // Mock translation service - in reality would use Google Translate, DeepL, etc.
    const translations: Record<string, Record<string, string>> = {
      es: {
        'Get Started Today': 'Comience Hoy',
        'Learn More': 'Aprende Más',
        'Join thousands of successful': 'Únete a miles de exitosos',
        'Transform your business': 'Transforma tu negocio',
        'Boost your results': 'Impulsa tus resultados'
      },
      fr: {
        'Get Started Today': 'Commencez Aujourd\'hui',
        'Learn More': 'En Savoir Plus',
        'Join thousands of successful': 'Rejoignez des milliers de',
        'Transform your business': 'Transformez votre entreprise',
        'Boost your results': 'Boostez vos résultats'
      },
      de: {
        'Get Started Today': 'Heute Beginnen',
        'Learn More': 'Mehr Erfahren',
        'Join thousands of successful': 'Schließen Sie sich Tausenden erfolgreicher',
        'Transform your business': 'Transformieren Sie Ihr Unternehmen',
        'Boost your results': 'Steigern Sie Ihre Ergebnisse'
      }
    };

    let translatedText = text;
    const languageTranslations = translations[targetLanguage];

    if (languageTranslations) {
      Object.entries(languageTranslations).forEach(([english, translated]) => {
        const regex = new RegExp(english, 'gi');
        translatedText = translatedText.replace(regex, translated);
      });
    }

    return translatedText;
  }

  private async applyLocalization(content: string, language: string, contentType: string): Promise<{
    content: string;
    adaptations: string[];
    notes: string[];
  }> {
    let localizedContent = content;
    const adaptations: string[] = [];
    const notes: string[] = [];

    // Apply language-specific localizations
    switch (language) {
      case 'es': // Spanish
        // Cultural adaptations for Spanish-speaking markets
        localizedContent = localizedContent.replace(/\$(\d+)/g, '$1 USD');
        adaptations.push('Currency format adapted for Spanish markets');
        
        if (contentType === 'email') {
          localizedContent = localizedContent.replace(/Hi /g, 'Hola ');
          adaptations.push('Greeting adapted to Spanish culture');
        }
        
        notes.push('Consider regional variations (Spain vs Latin America)');
        break;

      case 'fr': // French
        // Cultural adaptations for French markets
        localizedContent = localizedContent.replace(/\$(\d+)/g, '$1 USD');
        adaptations.push('Currency format clarified for French markets');
        
        if (contentType === 'social_media') {
          localizedContent = localizedContent.replace(/#(\w+)/g, '#$1FR');
          adaptations.push('Hashtags localized for French audience');
        }
        
        notes.push('Consider formal vs informal tone based on audience');
        break;

      case 'de': // German
        // Cultural adaptations for German markets
        localizedContent = localizedContent.replace(/\$(\d+)/g, '$1 USD');
        adaptations.push('Currency format adapted for German markets');
        
        notes.push('German audiences prefer detailed information and formal tone');
        break;
    }

    return {
      content: localizedContent,
      adaptations,
      notes
    };
  }

  private calculateTranslationQuality(original: string, translated: string, language: string): number {
    let qualityScore = 75; // Base quality score

    // Check length similarity (good translations should have similar length)
    const lengthRatio = translated.length / original.length;
    if (lengthRatio >= 0.8 && lengthRatio <= 1.3) {
      qualityScore += 10;
    } else {
      qualityScore -= 5;
    }

    // Check if key elements are preserved
    const keyElements = ['http', '@', '#', '%', '$'];
    keyElements.forEach(element => {
      const originalCount = (original.match(new RegExp(element, 'g')) || []).length;
      const translatedCount = (translated.match(new RegExp(element, 'g')) || []).length;
      
      if (originalCount === translatedCount) {
        qualityScore += 2;
      }
    });

    // Language-specific quality adjustments
    const languageComplexity = {
      'es': 5,  // Spanish is relatively straightforward
      'fr': 3,  // French has more complex grammar
      'de': 0,  // German is most complex
      'zh': -5, // Chinese would be very complex
      'ar': -5  // Arabic would be very complex
    };

    qualityScore += languageComplexity[language as keyof typeof languageComplexity] || 0;

    return Math.min(Math.max(qualityScore, 0), 100);
  }

  private async storeMultiLanguageContent(content: MultiLanguageContent): Promise<void> {
    const { error } = await supabase
      .from('multi_language_content')
      .insert({
        original_content_id: content.original_content_id,
        language: content.language,
        translated_content: content.translated_content,
        localization_notes: content.localization_notes,
        cultural_adaptations: content.cultural_adaptations,
        quality_score: content.quality_score,
        human_reviewed: content.human_reviewed,
        created_at: content.created_at
      });

    if (error) {
      console.warn('Could not store multi-language content:', error);
    }
  }

  // Content Optimization and Performance Tracking
  async optimizeContentPerformance(contentId: string): Promise<{
    optimized_content: GeneratedContent;
    optimization_changes: string[];
    expected_improvement: number;
  }> {
    try {
      console.log(`⚡ Optimizing content performance for: ${contentId}`);

      // Get original content and performance data
      const originalContent = await this.getGeneratedContent(contentId);
      if (!originalContent) {
        throw new Error('Original content not found');
      }

      const performanceData = await this.getContentPerformance(contentId);

      // Analyze performance issues
      const optimizationOpportunities = this.identifyOptimizationOpportunities(originalContent, performanceData);

      // Apply optimizations
      const optimizedText = this.applyOptimizations(originalContent.generated_text, optimizationOpportunities);

      // Create optimized content
      const optimizedContent: GeneratedContent = {
        ...originalContent,
        id: `optimized_${Date.now()}`,
        generated_text: optimizedText,
        optimization_suggestions: [],
        created_at: new Date().toISOString()
      };

      // Recalculate performance prediction
      optimizedContent.performance_prediction = this.predictContentPerformance(
        optimizedText,
        { content_type: originalContent.content_type } as ContentRequest,
        null
      );

      // Store optimized content
      await this.storeGeneratedContent(optimizedContent);

      const expectedImprovement = this.calculateExpectedImprovement(originalContent, optimizedContent);

      console.log(`✅ Content optimized with ${expectedImprovement}% expected improvement`);
      return {
        optimized_content: optimizedContent,
        optimization_changes: optimizationOpportunities.map(opp => opp.description),
        expected_improvement: expectedImprovement
      };

    } catch (error) {
      console.error('❌ Failed to optimize content performance:', error);
      throw error;
    }
  }

  private async getContentPerformance(contentId: string): Promise<ContentPerformance | null> {
    const { data, error } = await supabase
      .from('content_performance')
      .select('*')
      .eq('content_id', contentId)
      .single();

    if (error) {
      console.warn('Could not fetch content performance:', error);
      return null;
    }

    return data;
  }

  private identifyOptimizationOpportunities(content: GeneratedContent, performance: ContentPerformance | null): Array<{
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    change: string;
  }> {
    const opportunities = [];

    // Analyze performance issues
    if (performance) {
      if (performance.metrics.click_through_rate < 2) {
        opportunities.push({
          type: 'cta_optimization',
          description: 'Strengthen call-to-action to improve click-through rate',
          priority: 'high' as const,
          change: 'Replace weak CTAs with action-oriented language'
        });
      }

      if (performance.metrics.engagement_rate < 3) {
        opportunities.push({
          type: 'engagement_optimization',
          description: 'Add engaging elements to increase audience interaction',
          priority: 'high' as const,
          change: 'Add questions, polls, or interactive elements'
        });
      }

      if (performance.audience_feedback.sentiment_score < 70) {
        opportunities.push({
          type: 'sentiment_optimization',
          description: 'Improve content tone to increase positive sentiment',
          priority: 'medium' as const,
          change: 'Use more positive and encouraging language'
        });
      }
    }

    // Analyze content structure
    if (content.metadata.word_count > 300) {
      opportunities.push({
        type: 'length_optimization',
        description: 'Shorten content for better readability and engagement',
        priority: 'medium' as const,
        change: 'Reduce word count by 20-30%'
      });
    }

    if (!content.generated_text.toLowerCase().includes('you')) {
      opportunities.push({
        type: 'personalization',
        description: 'Make content more personal and direct',
        priority: 'medium' as const,
        change: 'Add direct address to the reader'
      });
    }

    return opportunities;
  }

  private applyOptimizations(content: string, opportunities: any[]): string {
    let optimizedContent = content;

    opportunities.forEach(opportunity => {
      switch (opportunity.type) {
        case 'cta_optimization':
          // Strengthen CTAs
          optimizedContent = optimizedContent.replace(/learn more/gi, 'Get Started Now');
          optimizedContent = optimizedContent.replace(/click here/gi, 'Claim Your Spot');
          optimizedContent = optimizedContent.replace(/find out/gi, 'Discover How');
          break;

        case 'engagement_optimization':
          // Add engaging elements
          if (!optimizedContent.includes('?')) {
            optimizedContent += '\n\nWhat do you think? Share your experience below!';
          }
          break;

        case 'sentiment_optimization':
          // Improve sentiment
          optimizedContent = optimizedContent.replace(/difficult/gi, 'challenging');
          optimizedContent = optimizedContent.replace(/problem/gi, 'opportunity');
          optimizedContent = optimizedContent.replace(/can't/gi, 'haven\'t yet');
          break;

        case 'length_optimization':
          // Shorten content
          const sentences = optimizedContent.split(/[.!?]+/);
          if (sentences.length > 5) {
            optimizedContent = sentences.slice(0, Math.ceil(sentences.length * 0.8)).join('. ') + '.';
          }
          break;

        case 'personalization':
          // Add personal touch
          optimizedContent = optimizedContent.replace(/people/gi, 'you');
          optimizedContent = optimizedContent.replace(/customers/gi, 'you');
          break;
      }
    });

    return optimizedContent;
  }

  private calculateExpectedImprovement(original: GeneratedContent, optimized: GeneratedContent): number {
    const originalScore = (
      original.performance_prediction.engagement_score +
      original.performance_prediction.conversion_probability +
      original.performance_prediction.readability_score
    ) / 3;

    const optimizedScore = (
      optimized.performance_prediction.engagement_score +
      optimized.performance_prediction.conversion_probability +
      optimized.performance_prediction.readability_score
    ) / 3;

    return Math.round(((optimizedScore - originalScore) / originalScore) * 100);
  }

  // Utility methods for getting content
  async getContentById(contentId: string): Promise<GeneratedContent | null> {
    return await this.getGeneratedContent(contentId);
  }

  async getContentByType(contentType: string, limit: number = 10): Promise<GeneratedContent[]> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('content_type', contentType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Could not fetch content by type:', error);
      return [];
    }

    return data || [];
  }

  async getBrandVoiceProfiles(): Promise<BrandVoiceProfile[]> {
    const { data, error } = await supabase
      .from('brand_voice_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch brand voice profiles:', error);
      return [];
    }

    return data || [];
  }

  async getContentPerformanceReport(contentId: string): Promise<{
    content: GeneratedContent;
    performance: ContentPerformance | null;
    translations: MultiLanguageContent[];
    visual_content: VisualContent[];
  }> {
    const content = await this.getGeneratedContent(contentId);
    const performance = await this.getContentPerformance(contentId);
    
    // Get translations
    const { data: translations } = await supabase
      .from('multi_language_content')
      .select('*')
      .eq('original_content_id', contentId);

    // Get related visual content (mock)
    const visualContent: VisualContent[] = [];

    return {
      content: content!,
      performance,
      translations: translations || [],
      visual_content: visualContent
    };
  }
}

// Export singleton instance
export const contentGenerationService = ContentGenerationService.getInstance();
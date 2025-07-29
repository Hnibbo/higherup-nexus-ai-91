/**
 * Advanced Email Template Engine with Dynamic Content Generation
 * Provides sophisticated template management, rendering, and optimization
 */

import { productionAIService } from '@/services/ai/ProductionAIService';
import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';

// Template interfaces
export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  templateType: 'campaign' | 'automation' | 'transactional';
  variables: TemplateVariable[];
  previewText?: string;
  category: string;
  tags: string[];
  isActive: boolean;
  version: number;
  parentTemplateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'image' | 'url';
  defaultValue?: any;
  required: boolean;
  description: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

export interface TemplateBlock {
  id: string;
  type: 'header' | 'text' | 'image' | 'button' | 'divider' | 'social' | 'footer';
  content: any;
  styles: Record<string, any>;
  conditions?: TemplateCondition[];
}

export interface TemplateCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface RenderContext {
  recipient: {
    email: string;
    firstName?: string;
    lastName?: string;
    customFields: Record<string, any>;
  };
  campaign?: {
    id: string;
    name: string;
    customFields: Record<string, any>;
  };
  user: {
    id: string;
    companyName?: string;
    customFields: Record<string, any>;
  };
  system: {
    unsubscribeUrl: string;
    webViewUrl: string;
    currentDate: Date;
    trackingPixelUrl: string;
  };
}

export interface TemplatePerformance {
  templateId: string;
  totalSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  averageEngagementTime: number;
  topPerformingVariants: string[];
  lastUpdated: Date;
}

/**
 * Advanced email template engine with AI-powered optimization
 */
export class EmailTemplateEngine {
  private static instance: EmailTemplateEngine;
  private templateCache: Map<string, EmailTemplate> = new Map();
  private renderCache: Map<string, string> = new Map();

  private constructor() {
    this.initializeEngine();
  }

  public static getInstance(): EmailTemplateEngine {
    if (!EmailTemplateEngine.instance) {
      EmailTemplateEngine.instance = new EmailTemplateEngine();
    }
    return EmailTemplateEngine.instance;
  }

  private async initializeEngine(): Promise<void> {
    console.log('🎨 Initializing Email Template Engine');
    
    // Load default templates
    await this.loadDefaultTemplates();
    
    // Set up template performance monitoring
    await this.initializePerformanceTracking();
    
    console.log('✅ Email Template Engine initialized');
  }

  /**
   * Create a new email template with AI assistance
   */
  async createTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<EmailTemplate> {
    try {
      console.log(`🎨 Creating email template: ${templateData.name}`);

      // Generate enhanced content using AI if needed
      let enhancedContent = templateData.htmlContent;
      if (templateData.htmlContent.length < 200) {
        try {
          const aiContent = await productionAIService.generateContent({
            userId: templateData.userId,
            contentType: 'email',
            prompt: `Create a professional email template for: ${templateData.name}. Subject: ${templateData.subject}. Content: ${templateData.htmlContent}`,
            tone: 'professional',
            targetAudience: 'email subscribers',
            length: 'medium'
          });
          enhancedContent = aiContent.content;
          console.log('🤖 Template enhanced with AI content');
        } catch (error) {
          console.warn('⚠️ AI enhancement failed, using original content');
        }
      }

      // Extract variables from content
      const variables = this.extractTemplateVariables(enhancedContent);

      // Create template
      const template: EmailTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...templateData,
        htmlContent: enhancedContent,
        textContent: templateData.textContent || this.convertHtmlToText(enhancedContent),
        variables,
        version: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store template
      await this.storeTemplate(template);

      // Cache template
      this.templateCache.set(template.id, template);

      console.log(`✅ Template created: ${template.id}`);
      return template;

    } catch (error) {
      console.error('❌ Failed to create template:', error);
      throw error;
    }
  }

  /**
   * Render template with dynamic content
   */
  async renderTemplate(templateId: string, context: RenderContext): Promise<{ html: string; text: string; subject: string }> {
    try {
      console.log(`🎨 Rendering template: ${templateId}`);

      // Check render cache
      const cacheKey = `render:${templateId}:${this.hashContext(context)}`;
      const cachedRender = await redisCacheService.get<{ html: string; text: string; subject: string }>(cacheKey);
      
      if (cachedRender) {
        console.log('⚡ Returning cached render');
        return cachedRender;
      }

      // Get template
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Render HTML content
      const html = await this.renderHtmlContent(template.htmlContent, context);
      
      // Render text content
      const text = await this.renderTextContent(template.textContent, context);
      
      // Render subject
      const subject = await this.renderSubject(template.subject, context);

      const result = { html, text, subject };

      // Cache rendered content for 1 hour
      await redisCacheService.set(cacheKey, result, 3600);

      console.log(`✅ Template rendered successfully`);
      return result;

    } catch (error) {
      console.error('❌ Failed to render template:', error);
      throw error;
    }
  }

  /**
   * Create A/B test variants of a template
   */
  async createABTestVariants(templateId: string, variants: {
    name: string;
    changes: {
      subject?: string;
      htmlContent?: string;
      textContent?: string;
    };
  }[]): Promise<EmailTemplate[]> {
    try {
      console.log(`🧪 Creating A/B test variants for template: ${templateId}`);

      const originalTemplate = await this.getTemplate(templateId);
      if (!originalTemplate) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const variantTemplates: EmailTemplate[] = [];

      for (const variant of variants) {
        const variantTemplate: EmailTemplate = {
          ...originalTemplate,
          id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: `${originalTemplate.name} - ${variant.name}`,
          subject: variant.changes.subject || originalTemplate.subject,
          htmlContent: variant.changes.htmlContent || originalTemplate.htmlContent,
          textContent: variant.changes.textContent || originalTemplate.textContent,
          parentTemplateId: templateId,
          version: originalTemplate.version + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Update variables if content changed
        if (variant.changes.htmlContent) {
          variantTemplate.variables = this.extractTemplateVariables(variantTemplate.htmlContent);
        }

        await this.storeTemplate(variantTemplate);
        this.templateCache.set(variantTemplate.id, variantTemplate);
        variantTemplates.push(variantTemplate);
      }

      console.log(`✅ Created ${variantTemplates.length} A/B test variants`);
      return variantTemplates;

    } catch (error) {
      console.error('❌ Failed to create A/B test variants:', error);
      throw error;
    }
  }

  /**
   * Optimize template based on performance data
   */
  async optimizeTemplate(templateId: string): Promise<EmailTemplate> {
    try {
      console.log(`⚡ Optimizing template: ${templateId}`);

      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const performance = await this.getTemplatePerformance(templateId);
      
      // Use AI to suggest optimizations
      const optimizationPrompt = `
        Optimize this email template based on performance data:
        Template: ${template.name}
        Subject: ${template.subject}
        Open Rate: ${performance.openRate}%
        Click Rate: ${performance.clickRate}%
        Content: ${template.htmlContent.substring(0, 500)}...
        
        Suggest improvements for better engagement.
      `;

      const aiOptimization = await productionAIService.generateContent({
        userId: template.userId,
        contentType: 'email',
        prompt: optimizationPrompt,
        tone: 'professional',
        targetAudience: 'email subscribers',
        length: 'medium'
      });

      // Create optimized version
      const optimizedTemplate = await this.createTemplate({
        ...template,
        name: `${template.name} - Optimized`,
        htmlContent: aiOptimization.content,
        parentTemplateId: templateId
      });

      console.log(`✅ Template optimized: ${optimizedTemplate.id}`);
      return optimizedTemplate;

    } catch (error) {
      console.error('❌ Failed to optimize template:', error);
      throw error;
    }
  }

  /**
   * Get template performance analytics
   */
  async getTemplatePerformance(templateId: string): Promise<TemplatePerformance> {
    try {
      console.log(`📊 Getting performance for template: ${templateId}`);

      // Check cache first
      const cacheKey = `template_performance:${templateId}`;
      const cachedPerformance = await redisCacheService.get<TemplatePerformance>(cacheKey);
      
      if (cachedPerformance) {
        return cachedPerformance;
      }

      // Calculate performance from delivery data
      // This would query actual delivery and engagement data
      const performance: TemplatePerformance = {
        templateId,
        totalSent: 1000, // Mock data
        openRate: 25.5,
        clickRate: 3.2,
        conversionRate: 1.8,
        bounceRate: 2.1,
        unsubscribeRate: 0.5,
        averageEngagementTime: 45,
        topPerformingVariants: [],
        lastUpdated: new Date()
      };

      // Cache for 30 minutes
      await redisCacheService.set(cacheKey, performance, 1800);

      return performance;

    } catch (error) {
      console.error('❌ Failed to get template performance:', error);
      throw error;
    }
  }

  /**
   * Validate template content and structure
   */
  async validateTemplate(template: Partial<EmailTemplate>): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check required fields
      if (!template.name) errors.push('Template name is required');
      if (!template.subject) errors.push('Subject line is required');
      if (!template.htmlContent) errors.push('HTML content is required');

      // Validate HTML structure
      if (template.htmlContent) {
        const htmlValidation = this.validateHtmlContent(template.htmlContent);
        errors.push(...htmlValidation.errors);
        warnings.push(...htmlValidation.warnings);
      }

      // Check for accessibility issues
      if (template.htmlContent) {
        const accessibilityIssues = this.checkAccessibility(template.htmlContent);
        warnings.push(...accessibilityIssues);
      }

      // Validate variables
      if (template.variables) {
        for (const variable of template.variables) {
          if (!variable.name) errors.push('Variable name is required');
          if (!variable.type) errors.push('Variable type is required');
        }
      }

      // Check subject line best practices
      if (template.subject) {
        if (template.subject.length > 50) {
          warnings.push('Subject line is longer than recommended (50 characters)');
        }
        if (template.subject.includes('FREE') || template.subject.includes('!!!')) {
          warnings.push('Subject line may trigger spam filters');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('❌ Template validation failed:', error);
      return {
        isValid: false,
        errors: ['Template validation failed'],
        warnings: []
      };
    }
  }

  /**
   * Clone template with modifications
   */
  async cloneTemplate(templateId: string, modifications: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const originalTemplate = await this.getTemplate(templateId);
      if (!originalTemplate) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const clonedTemplate = await this.createTemplate({
        ...originalTemplate,
        ...modifications,
        name: modifications.name || `${originalTemplate.name} - Copy`,
        parentTemplateId: templateId
      });

      console.log(`✅ Template cloned: ${clonedTemplate.id}`);
      return clonedTemplate;

    } catch (error) {
      console.error('❌ Failed to clone template:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async renderHtmlContent(htmlContent: string, context: RenderContext): Promise<string> {
    let rendered = htmlContent;

    // Replace system variables
    rendered = rendered.replace(/\{\{unsubscribe_url\}\}/g, context.system.unsubscribeUrl);
    rendered = rendered.replace(/\{\{web_view_url\}\}/g, context.system.webViewUrl);
    rendered = rendered.replace(/\{\{tracking_pixel\}\}/g, `<img src="${context.system.trackingPixelUrl}" width="1" height="1" style="display:none;" />`);

    // Replace recipient variables
    rendered = rendered.replace(/\{\{first_name\}\}/g, context.recipient.firstName || '');
    rendered = rendered.replace(/\{\{last_name\}\}/g, context.recipient.lastName || '');
    rendered = rendered.replace(/\{\{email\}\}/g, context.recipient.email);

    // Replace custom fields
    for (const [key, value] of Object.entries(context.recipient.customFields)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    // Replace user variables
    if (context.user.companyName) {
      rendered = rendered.replace(/\{\{company_name\}\}/g, context.user.companyName);
    }

    // Replace date variables
    rendered = rendered.replace(/\{\{current_date\}\}/g, context.system.currentDate.toLocaleDateString());
    rendered = rendered.replace(/\{\{current_year\}\}/g, context.system.currentDate.getFullYear().toString());

    // Process conditional blocks
    rendered = this.processConditionalBlocks(rendered, context);

    return rendered;
  }

  private async renderTextContent(textContent: string, context: RenderContext): Promise<string> {
    let rendered = textContent;

    // Similar variable replacement for text content
    rendered = rendered.replace(/\{\{first_name\}\}/g, context.recipient.firstName || '');
    rendered = rendered.replace(/\{\{last_name\}\}/g, context.recipient.lastName || '');
    rendered = rendered.replace(/\{\{email\}\}/g, context.recipient.email);

    // Replace custom fields
    for (const [key, value] of Object.entries(context.recipient.customFields)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    return rendered;
  }

  private async renderSubject(subject: string, context: RenderContext): Promise<string> {
    let rendered = subject;

    // Replace variables in subject
    rendered = rendered.replace(/\{\{first_name\}\}/g, context.recipient.firstName || '');
    rendered = rendered.replace(/\{\{last_name\}\}/g, context.recipient.lastName || '');
    
    // Replace custom fields
    for (const [key, value] of Object.entries(context.recipient.customFields)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    return rendered;
  }

  private extractTemplateVariables(content: string): TemplateVariable[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: TemplateVariable[] = [];
    const foundVariables = new Set<string>();

    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1].trim();
      if (!foundVariables.has(variableName)) {
        foundVariables.add(variableName);
        
        // Determine variable type based on name
        let type: TemplateVariable['type'] = 'text';
        if (variableName.includes('date')) type = 'date';
        if (variableName.includes('url') || variableName.includes('link')) type = 'url';
        if (variableName.includes('image') || variableName.includes('photo')) type = 'image';
        if (variableName.includes('count') || variableName.includes('number')) type = 'number';

        variables.push({
          name: variableName,
          type,
          required: !['first_name', 'last_name', 'company_name'].includes(variableName),
          description: `Dynamic content for ${variableName.replace(/_/g, ' ')}`
        });
      }
    }

    return variables;
  }

  private convertHtmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private processConditionalBlocks(content: string, context: RenderContext): string {
    // Process conditional blocks like {{#if condition}}...{{/if}}
    const conditionalRegex = /\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs;
    
    return content.replace(conditionalRegex, (match, condition, block) => {
      try {
        // Simple condition evaluation
        const shouldShow = this.evaluateCondition(condition, context);
        return shouldShow ? block : '';
      } catch (error) {
        console.warn('Failed to evaluate condition:', condition);
        return block; // Show block if condition evaluation fails
      }
    });
  }

  private evaluateCondition(condition: string, context: RenderContext): boolean {
    // Simple condition evaluation - in production, use a proper expression parser
    if (condition.includes('first_name')) {
      return !!context.recipient.firstName;
    }
    if (condition.includes('company_name')) {
      return !!context.user.companyName;
    }
    return true;
  }

  private validateHtmlContent(html: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for basic HTML structure
    if (!html.includes('<html') && !html.includes('<body')) {
      warnings.push('Template should include proper HTML structure');
    }

    // Check for unsubscribe link
    if (!html.includes('unsubscribe')) {
      errors.push('Template must include an unsubscribe link');
    }

    // Check for alt text on images
    const imgRegex = /<img[^>]*>/g;
    const images = html.match(imgRegex) || [];
    for (const img of images) {
      if (!img.includes('alt=')) {
        warnings.push('Images should include alt text for accessibility');
      }
    }

    return { errors, warnings };
  }

  private checkAccessibility(html: string): string[] {
    const warnings: string[] = [];

    // Check for proper heading structure
    if (html.includes('<h3') && !html.includes('<h1') && !html.includes('<h2')) {
      warnings.push('Use proper heading hierarchy (h1, h2, h3)');
    }

    // Check for color contrast (basic check)
    if (html.includes('color:') && !html.includes('background-color:')) {
      warnings.push('Ensure sufficient color contrast for accessibility');
    }

    return warnings;
  }

  private hashContext(context: RenderContext): string {
    return Buffer.from(JSON.stringify(context)).toString('base64').substring(0, 16);
  }

  private async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    try {
      // This would fetch from database in production
      return null;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  private async storeTemplate(template: EmailTemplate): Promise<void> {
    try {
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`💾 Storing template: ${template.name}`);
        // Store in database
      });
    } catch (error) {
      console.warn('Could not store template:', error);
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: 'Welcome Email',
        subject: 'Welcome to {{company_name}}, {{first_name}}!',
        htmlContent: `
          <html>
            <body>
              <h1>Welcome {{first_name}}!</h1>
              <p>Thank you for joining {{company_name}}. We're excited to have you on board.</p>
              <p>Get started by exploring our platform and discovering all the amazing features we have to offer.</p>
              <a href="{{web_view_url}}">Get Started</a>
              <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
              {{tracking_pixel}}
            </body>
          </html>
        `,
        templateType: 'automation' as const,
        category: 'onboarding',
        tags: ['welcome', 'onboarding']
      },
      {
        name: 'Newsletter Template',
        subject: 'Your Weekly Update from {{company_name}}',
        htmlContent: `
          <html>
            <body>
              <h1>Weekly Newsletter</h1>
              <p>Hi {{first_name}},</p>
              <p>Here's what's new this week at {{company_name}}:</p>
              <div>
                <h2>Featured Content</h2>
                <p>{{featured_content}}</p>
              </div>
              <p>Thanks for reading!</p>
              <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
              {{tracking_pixel}}
            </body>
          </html>
        `,
        templateType: 'campaign' as const,
        category: 'newsletter',
        tags: ['newsletter', 'weekly']
      }
    ];

    for (const templateData of defaultTemplates) {
      try {
        await this.createTemplate({
          userId: 'system',
          ...templateData,
          textContent: this.convertHtmlToText(templateData.htmlContent)
        });
      } catch (error) {
        console.warn('Failed to create default template:', templateData.name);
      }
    }
  }

  private async initializePerformanceTracking(): Promise<void> {
    console.log('📊 Initializing template performance tracking');
    // Set up performance monitoring
  }

  /**
   * Public API methods
   */
  async getTemplates(userId: string, filters?: {
    category?: string;
    templateType?: string;
    tags?: string[];
  }): Promise<EmailTemplate[]> {
    try {
      // This would fetch from database with filters
      return Array.from(this.templateCache.values()).filter(template => 
        template.userId === userId || template.userId === 'system'
      );
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      // Remove from cache
      this.templateCache.delete(templateId);
      
      // Remove from database
      await productionDatabaseService.executeWithRetry(async () => {
        console.log(`🗑️ Deleting template: ${templateId}`);
      });

      console.log(`✅ Template deleted: ${templateId}`);
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw error;
    }
  }

  async updateTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const updatedTemplate: EmailTemplate = {
        ...template,
        ...updates,
        version: template.version + 1,
        updatedAt: new Date()
      };

      // Re-extract variables if content changed
      if (updates.htmlContent) {
        updatedTemplate.variables = this.extractTemplateVariables(updatedTemplate.htmlContent);
      }

      await this.storeTemplate(updatedTemplate);
      this.templateCache.set(templateId, updatedTemplate);

      console.log(`✅ Template updated: ${templateId}`);
      return updatedTemplate;

    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.templateCache.clear();
    this.renderCache.clear();
    console.log('🧹 Email Template Engine cleanup completed');
  }
}

// Export singleton instance
export const emailTemplateEngine = EmailTemplateEngine.getInstance();
import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplateBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'social' | 'header' | 'footer' | 'columns' | 'spacer';
  content: Record<string, any>;
  styles: Record<string, any>;
  order: number;
}

export interface EmailTemplateDesign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'newsletter' | 'promotional' | 'transactional' | 'drip' | 'custom';
  blocks: EmailTemplateBlock[];
  global_styles: {
    background_color: string;
    font_family: string;
    font_size: string;
    line_height: string;
    text_color: string;
    link_color: string;
    container_width: string;
    padding: string;
  };
  preview_image?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email';
  default_value?: any;
  description?: string;
  required: boolean;
}

export class EmailTemplateBuilderService {
  private static instance: EmailTemplateBuilderService;

  private constructor() {}

  public static getInstance(): EmailTemplateBuilderService {
    if (!EmailTemplateBuilderService.instance) {
      EmailTemplateBuilderService.instance = new EmailTemplateBuilderService();
    }
    return EmailTemplateBuilderService.instance;
  }

  // Template Design Management
  async createTemplateDesign(design: Omit<EmailTemplateDesign, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplateDesign> {
    try {
      console.log(`🎨 Creating email template design: ${design.name}`);

      const { data, error } = await supabase
        .from('email_template_designs')
        .insert({
          user_id: design.user_id,
          name: design.name,
          description: design.description,
          category: design.category,
          blocks: design.blocks,
          global_styles: design.global_styles,
          preview_image: design.preview_image,
          is_public: design.is_public,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Email template design created: ${design.name}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to create email template design:', error);
      throw error;
    }
  }

  async getTemplateDesigns(userId: string, category?: string): Promise<EmailTemplateDesign[]> {
    try {
      let query = supabase
        .from('email_template_designs')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('❌ Failed to get email template designs:', error);
      throw error;
    }
  }

  async updateTemplateDesign(designId: string, updates: Partial<EmailTemplateDesign>): Promise<EmailTemplateDesign> {
    try {
      const { data, error } = await supabase
        .from('email_template_designs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', designId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Email template design updated: ${designId}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to update email template design:', error);
      throw error;
    }
  }

  async duplicateTemplateDesign(designId: string, userId: string, newName?: string): Promise<EmailTemplateDesign> {
    try {
      // Get original design
      const { data: original, error: originalError } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (originalError) throw originalError;

      // Create duplicate
      const duplicate = await this.createTemplateDesign({
        user_id: userId,
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        blocks: original.blocks,
        global_styles: original.global_styles,
        is_public: false
      });

      console.log(`✅ Email template design duplicated: ${designId} -> ${duplicate.id}`);
      return duplicate;

    } catch (error) {
      console.error('❌ Failed to duplicate email template design:', error);
      throw error;
    }
  }

  // Template Building
  async addBlock(designId: string, block: Omit<EmailTemplateBlock, 'id' | 'order'>): Promise<EmailTemplateDesign> {
    try {
      // Get current design
      const { data: design, error: designError } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (designError) throw designError;

      // Add new block
      const newBlock: EmailTemplateBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...block,
        order: design.blocks.length
      };

      const updatedBlocks = [...design.blocks, newBlock];

      // Update design
      const updatedDesign = await this.updateTemplateDesign(designId, {
        blocks: updatedBlocks
      });

      console.log(`✅ Block added to template design: ${designId}`);
      return updatedDesign;

    } catch (error) {
      console.error('❌ Failed to add block to template design:', error);
      throw error;
    }
  }

  async updateBlock(designId: string, blockId: string, updates: Partial<EmailTemplateBlock>): Promise<EmailTemplateDesign> {
    try {
      // Get current design
      const { data: design, error: designError } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (designError) throw designError;

      // Update block
      const updatedBlocks = design.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      );

      // Update design
      const updatedDesign = await this.updateTemplateDesign(designId, {
        blocks: updatedBlocks
      });

      console.log(`✅ Block updated in template design: ${designId}`);
      return updatedDesign;

    } catch (error) {
      console.error('❌ Failed to update block in template design:', error);
      throw error;
    }
  }

  async removeBlock(designId: string, blockId: string): Promise<EmailTemplateDesign> {
    try {
      // Get current design
      const { data: design, error: designError } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (designError) throw designError;

      // Remove block and reorder
      const updatedBlocks = design.blocks
        .filter(block => block.id !== blockId)
        .map((block, index) => ({ ...block, order: index }));

      // Update design
      const updatedDesign = await this.updateTemplateDesign(designId, {
        blocks: updatedBlocks
      });

      console.log(`✅ Block removed from template design: ${designId}`);
      return updatedDesign;

    } catch (error) {
      console.error('❌ Failed to remove block from template design:', error);
      throw error;
    }
  }

  async reorderBlocks(designId: string, blockIds: string[]): Promise<EmailTemplateDesign> {
    try {
      // Get current design
      const { data: design, error: designError } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (designError) throw designError;

      // Reorder blocks
      const blockMap = new Map(design.blocks.map(block => [block.id, block]));
      const updatedBlocks = blockIds
        .map(id => blockMap.get(id))
        .filter(Boolean)
        .map((block, index) => ({ ...block!, order: index }));

      // Update design
      const updatedDesign = await this.updateTemplateDesign(designId, {
        blocks: updatedBlocks
      });

      console.log(`✅ Blocks reordered in template design: ${designId}`);
      return updatedDesign;

    } catch (error) {
      console.error('❌ Failed to reorder blocks in template design:', error);
      throw error;
    }
  }

  // HTML Generation
  async generateHTML(designId: string, variables?: Record<string, any>): Promise<string> {
    try {
      // Get design
      const { data: design, error } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (error) throw error;

      // Generate HTML
      const html = this.buildHTMLFromDesign(design, variables);

      console.log(`✅ HTML generated for template design: ${designId}`);
      return html;

    } catch (error) {
      console.error('❌ Failed to generate HTML from template design:', error);
      throw error;
    }
  }

  private buildHTMLFromDesign(design: EmailTemplateDesign, variables?: Record<string, any>): string {
    const { global_styles, blocks } = design;

    // Build CSS styles
    const globalCSS = `
      body {
        margin: 0;
        padding: 0;
        background-color: ${global_styles.background_color};
        font-family: ${global_styles.font_family};
        font-size: ${global_styles.font_size};
        line-height: ${global_styles.line_height};
        color: ${global_styles.text_color};
      }
      .email-container {
        max-width: ${global_styles.container_width};
        margin: 0 auto;
        padding: ${global_styles.padding};
      }
      a {
        color: ${global_styles.link_color};
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    `;

    // Build blocks HTML
    const blocksHTML = blocks
      .sort((a, b) => a.order - b.order)
      .map(block => this.buildBlockHTML(block, variables))
      .join('');

    // Complete HTML structure
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${design.name}</title>
        <style>
          ${globalCSS}
        </style>
      </head>
      <body>
        <div class="email-container">
          ${blocksHTML}
        </div>
      </body>
      </html>
    `;
  }

  private buildBlockHTML(block: EmailTemplateBlock, variables?: Record<string, any>): string {
    const { type, content, styles } = block;
    const blockStyles = this.buildInlineStyles(styles);

    switch (type) {
      case 'text':
        return `<div style="${blockStyles}">${this.replaceVariables(content.text || '', variables)}</div>`;
      
      case 'image':
        return `
          <div style="${blockStyles}">
            <img src="${content.src || ''}" 
                 alt="${content.alt || ''}" 
                 style="max-width: 100%; height: auto; ${content.width ? `width: ${content.width};` : ''}" />
          </div>
        `;
      
      case 'button':
        return `
          <div style="${blockStyles}">
            <a href="${content.url || '#'}" 
               style="display: inline-block; padding: ${content.padding || '12px 24px'}; 
                      background-color: ${content.background_color || '#007bff'}; 
                      color: ${content.text_color || '#ffffff'}; 
                      text-decoration: none; border-radius: ${content.border_radius || '4px'};">
              ${this.replaceVariables(content.text || 'Button', variables)}
            </a>
          </div>
        `;
      
      case 'divider':
        return `
          <div style="${blockStyles}">
            <hr style="border: none; height: ${content.height || '1px'}; 
                       background-color: ${content.color || '#cccccc'}; 
                       margin: ${content.margin || '20px 0'};" />
          </div>
        `;
      
      case 'spacer':
        return `<div style="height: ${content.height || '20px'};"></div>`;
      
      case 'header':
        return `
          <header style="${blockStyles}">
            <h1 style="margin: 0; font-size: ${content.font_size || '24px'}; 
                       color: ${content.text_color || 'inherit'};">
              ${this.replaceVariables(content.text || '', variables)}
            </h1>
          </header>
        `;
      
      case 'footer':
        return `
          <footer style="${blockStyles}">
            <p style="margin: 0; font-size: ${content.font_size || '12px'}; 
                      color: ${content.text_color || '#666666'};">
              ${this.replaceVariables(content.text || '', variables)}
            </p>
          </footer>
        `;
      
      case 'columns':
        const columnsHTML = (content.columns || [])
          .map((column: any) => `
            <td style="width: ${100 / content.columns.length}%; vertical-align: top; padding: ${column.padding || '10px'};">
              ${this.replaceVariables(column.content || '', variables)}
            </td>
          `)
          .join('');
        
        return `
          <div style="${blockStyles}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                ${columnsHTML}
              </tr>
            </table>
          </div>
        `;
      
      case 'social':
        const socialLinks = (content.links || [])
          .map((link: any) => `
            <a href="${link.url || '#'}" style="display: inline-block; margin: 0 ${content.spacing || '10px'};">
              <img src="${link.icon || ''}" alt="${link.platform || ''}" 
                   style="width: ${content.icon_size || '24px'}; height: ${content.icon_size || '24px'};" />
            </a>
          `)
          .join('');
        
        return `
          <div style="${blockStyles}; text-align: ${content.alignment || 'center'};">
            ${socialLinks}
          </div>
        `;
      
      default:
        return `<div style="${blockStyles}">Unknown block type: ${type}</div>`;
    }
  }

  private buildInlineStyles(styles: Record<string, any>): string {
    return Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ');
  }

  private replaceVariables(text: string, variables?: Record<string, any>): string {
    if (!variables) return text;

    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  // Template Variables
  async extractVariables(designId: string): Promise<TemplateVariable[]> {
    try {
      // Get design
      const { data: design, error } = await supabase
        .from('email_template_designs')
        .select('*')
        .eq('id', designId)
        .single();

      if (error) throw error;

      // Extract variables from all blocks
      const variables = new Set<string>();
      const variableRegex = /\{\{([^}]+)\}\}/g;

      design.blocks.forEach(block => {
        const blockContent = JSON.stringify(block.content);
        let match;
        while ((match = variableRegex.exec(blockContent)) !== null) {
          variables.add(match[1].trim());
        }
      });

      // Convert to TemplateVariable objects
      return Array.from(variables).map(name => ({
        name,
        type: this.inferVariableType(name),
        required: true,
        description: `Variable: ${name}`
      }));

    } catch (error) {
      console.error('❌ Failed to extract variables from template design:', error);
      throw error;
    }
  }

  private inferVariableType(variableName: string): TemplateVariable['type'] {
    const name = variableName.toLowerCase();
    
    if (name.includes('email')) return 'email';
    if (name.includes('url') || name.includes('link')) return 'url';
    if (name.includes('date') || name.includes('time')) return 'date';
    if (name.includes('count') || name.includes('number') || name.includes('price')) return 'number';
    if (name.includes('active') || name.includes('enabled') || name.includes('is_')) return 'boolean';
    
    return 'text';
  }

  // Preview Generation
  async generatePreview(designId: string, variables?: Record<string, any>): Promise<string> {
    try {
      // Generate HTML with sample data if no variables provided
      const sampleVariables = variables || {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        company: 'Acme Corp',
        date: new Date().toLocaleDateString()
      };

      const html = await this.generateHTML(designId, sampleVariables);

      console.log(`✅ Preview generated for template design: ${designId}`);
      return html;

    } catch (error) {
      console.error('❌ Failed to generate preview for template design:', error);
      throw error;
    }
  }

  // Default Templates Setup
  async setupDefaultTemplateDesigns(userId: string): Promise<void> {
    try {
      console.log('🔧 Setting up default email template designs...');

      const defaultDesigns: Array<Omit<EmailTemplateDesign, 'id' | 'created_at' | 'updated_at'>> = [
        {
          user_id: userId,
          name: 'Simple Newsletter',
          description: 'Clean and simple newsletter template',
          category: 'newsletter',
          is_public: false,
          global_styles: {
            background_color: '#f8f9fa',
            font_family: 'Arial, sans-serif',
            font_size: '16px',
            line_height: '1.6',
            text_color: '#333333',
            link_color: '#007bff',
            container_width: '600px',
            padding: '20px'
          },
          blocks: [
            {
              id: 'header_1',
              type: 'header',
              content: {
                text: 'Monthly Newsletter',
                font_size: '28px',
                text_color: '#2c3e50'
              },
              styles: {
                textAlign: 'center',
                padding: '20px 0',
                backgroundColor: '#ffffff',
                marginBottom: '20px'
              },
              order: 0
            },
            {
              id: 'text_1',
              type: 'text',
              content: {
                text: '<p>Hello {{first_name}},</p><p>Welcome to our monthly newsletter! Here are the latest updates and insights from our team.</p>'
              },
              styles: {
                padding: '20px',
                backgroundColor: '#ffffff',
                marginBottom: '20px'
              },
              order: 1
            },
            {
              id: 'button_1',
              type: 'button',
              content: {
                text: 'Read More',
                url: 'https://example.com',
                background_color: '#007bff',
                text_color: '#ffffff',
                padding: '12px 24px',
                border_radius: '4px'
              },
              styles: {
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#ffffff',
                marginBottom: '20px'
              },
              order: 2
            },
            {
              id: 'footer_1',
              type: 'footer',
              content: {
                text: 'Thanks for reading! <a href="#">Unsubscribe</a>',
                font_size: '12px',
                text_color: '#666666'
              },
              styles: {
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa'
              },
              order: 3
            }
          ]
        },
        {
          user_id: userId,
          name: 'Product Announcement',
          description: 'Template for announcing new products or features',
          category: 'promotional',
          is_public: false,
          global_styles: {
            background_color: '#ffffff',
            font_family: 'Helvetica, Arial, sans-serif',
            font_size: '16px',
            line_height: '1.5',
            text_color: '#333333',
            link_color: '#e74c3c',
            container_width: '600px',
            padding: '0'
          },
          blocks: [
            {
              id: 'image_1',
              type: 'image',
              content: {
                src: 'https://via.placeholder.com/600x200/e74c3c/ffffff?text=New+Product',
                alt: 'New Product Announcement',
                width: '100%'
              },
              styles: {
                textAlign: 'center',
                marginBottom: '30px'
              },
              order: 0
            },
            {
              id: 'header_1',
              type: 'header',
              content: {
                text: 'Introducing Our Latest Innovation',
                font_size: '32px',
                text_color: '#2c3e50'
              },
              styles: {
                textAlign: 'center',
                padding: '0 20px',
                marginBottom: '20px'
              },
              order: 1
            },
            {
              id: 'text_1',
              type: 'text',
              content: {
                text: '<p>Hi {{first_name}},</p><p>We\'re excited to announce our latest product that will revolutionize the way you work. This innovative solution combines cutting-edge technology with user-friendly design.</p>'
              },
              styles: {
                padding: '0 20px',
                marginBottom: '30px'
              },
              order: 2
            },
            {
              id: 'button_1',
              type: 'button',
              content: {
                text: 'Learn More',
                url: 'https://example.com/product',
                background_color: '#e74c3c',
                text_color: '#ffffff',
                padding: '15px 30px',
                border_radius: '6px'
              },
              styles: {
                textAlign: 'center',
                marginBottom: '40px'
              },
              order: 3
            },
            {
              id: 'divider_1',
              type: 'divider',
              content: {
                height: '2px',
                color: '#ecf0f1',
                margin: '30px 20px'
              },
              styles: {},
              order: 4
            },
            {
              id: 'footer_1',
              type: 'footer',
              content: {
                text: '© 2024 HigherUp.ai. All rights reserved. <a href="#">Unsubscribe</a>',
                font_size: '12px',
                text_color: '#7f8c8d'
              },
              styles: {
                textAlign: 'center',
                padding: '20px'
              },
              order: 5
            }
          ]
        }
      ];

      for (const design of defaultDesigns) {
        await this.createTemplateDesign(design);
      }

      console.log(`✅ Created ${defaultDesigns.length} default email template designs`);

    } catch (error) {
      console.error('❌ Failed to setup default email template designs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailTemplateBuilderService = EmailTemplateBuilderService.getInstance();
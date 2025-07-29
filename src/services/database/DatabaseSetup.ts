import Database from 'better-sqlite3';
import { join } from 'path';

export interface DatabaseConfig {
  path: string;
  enableWAL: boolean;
  enableForeignKeys: boolean;
  timeout: number;
}

export class DatabaseSetup {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;

  constructor(config: Partial<DatabaseConfig> = {}) {
    this.config = {
      path: config.path || join(process.cwd(), 'data', 'higherup.db'),
      enableWAL: config.enableWAL ?? true,
      enableForeignKeys: config.enableForeignKeys ?? true,
      timeout: config.timeout || 30000
    };
  }

  async initialize(): Promise<void> {
    console.log('🗄️ Initializing HigherUp.ai Database...');

    try {
      // Create database connection
      this.db = new Database(this.config.path);

      // Configure database
      if (this.config.enableWAL) {
        this.db.pragma('journal_mode = WAL');
      }

      if (this.config.enableForeignKeys) {
        this.db.pragma('foreign_keys = ON');
      }

      this.db.pragma(`busy_timeout = ${this.config.timeout}`);

      // Create all tables
      await this.createTables();

      // Insert initial data
      await this.insertInitialData();

      console.log('✅ Database initialized successfully');

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    console.log('📋 Creating database tables...');

    // Customers table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        company TEXT,
        industry TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        lifetime_value REAL DEFAULT 0,
        churn_probability REAL DEFAULT 0,
        last_activity DATETIME,
        metadata TEXT -- JSON
      )
    `);

    // Campaigns table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        budget REAL DEFAULT 0,
        spent REAL DEFAULT 0,
        revenue REAL DEFAULT 0,
        roi REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        start_date DATETIME,
        end_date DATETIME,
        target_audience TEXT, -- JSON
        content TEXT, -- JSON
        performance_metrics TEXT, -- JSON
        ai_insights TEXT -- JSON
      )
    `);

    // Content table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS content (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL, -- 'text', 'image', 'video', 'audio'
        content TEXT NOT NULL,
        brand_voice_score REAL DEFAULT 0,
        seo_score REAL DEFAULT 0,
        performance_score REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        campaign_id TEXT,
        metadata TEXT, -- JSON
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);

    // Analytics table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL, -- 'campaign', 'customer', 'content'
        entity_id TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT -- JSON
      )
    `);

    // AI Insights table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'prediction', 'recommendation', 'alert', 'optimization'
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        confidence REAL NOT NULL,
        impact TEXT NOT NULL, -- 'high', 'medium', 'low'
        actionable BOOLEAN DEFAULT 1,
        actions TEXT, -- JSON array
        metadata TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active' -- 'active', 'resolved', 'dismissed'
      )
    `);

    // Predictions table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL, -- 'revenue', 'churn', 'clv', 'market_trends'
        entity_id TEXT, -- customer_id, campaign_id, etc.
        prediction_data TEXT NOT NULL, -- JSON
        confidence REAL NOT NULL,
        timeframe TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        accuracy REAL -- Actual vs predicted (filled later)
      )
    `);

    // Vector Embeddings table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS vector_embeddings (
        id TEXT PRIMARY KEY,
        content_id TEXT,
        embedding BLOB NOT NULL, -- Serialized vector
        content_type TEXT NOT NULL,
        content_text TEXT NOT NULL,
        metadata TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES content(id)
      )
    `);

    // Market Intelligence table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS market_intelligence (
        id TEXT PRIMARY KEY,
        industry TEXT NOT NULL,
        competitor TEXT,
        intelligence_type TEXT NOT NULL, -- 'trend', 'pricing', 'feature', 'campaign'
        data TEXT NOT NULL, -- JSON
        confidence REAL NOT NULL,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `);

    // Performance Metrics table
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        metric_type TEXT NOT NULL, -- 'engagement', 'conversion', 'revenue', 'churn'
        value REAL NOT NULL,
        benchmark REAL,
        target REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        period TEXT -- 'daily', 'weekly', 'monthly'
      )
    `);

    // Create indexes for better performance
    this.db!.exec(`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
      CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
      CREATE INDEX IF NOT EXISTS idx_content_campaign ON content(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_insights_type ON ai_insights(type);
      CREATE INDEX IF NOT EXISTS idx_insights_impact ON ai_insights(impact);
      CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(type);
      CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(entity_id);
      CREATE INDEX IF NOT EXISTS idx_market_intelligence_industry ON market_intelligence(industry);
      CREATE INDEX IF NOT EXISTS idx_performance_entity ON performance_metrics(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);
    `);

    console.log('✅ Database tables created successfully');
  }

  private async insertInitialData(): Promise<void> {
    console.log('📊 Inserting initial data...');

    // Insert sample customers
    const insertCustomer = this.db!.prepare(`
      INSERT OR IGNORE INTO customers (id, name, email, company, industry, lifetime_value, churn_probability, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const customers = [
      {
        id: 'cust_001',
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Inc',
        industry: 'technology',
        lifetime_value: 75000,
        churn_probability: 0.15,
        metadata: JSON.stringify({ segment: 'enterprise', source: 'direct' })
      },
      {
        id: 'cust_002',
        name: 'Sarah Johnson',
        email: 'sarah.j@innovate.co',
        company: 'Innovate Co',
        industry: 'marketing',
        lifetime_value: 45000,
        churn_probability: 0.25,
        metadata: JSON.stringify({ segment: 'mid-market', source: 'referral' })
      },
      {
        id: 'cust_003',
        name: 'Mike Chen',
        email: 'mike.chen@startup.io',
        company: 'Startup.io',
        industry: 'fintech',
        lifetime_value: 25000,
        churn_probability: 0.35,
        metadata: JSON.stringify({ segment: 'startup', source: 'organic' })
      }
    ];

    customers.forEach(customer => {
      insertCustomer.run(
        customer.id,
        customer.name,
        customer.email,
        customer.company,
        customer.industry,
        customer.lifetime_value,
        customer.churn_probability,
        customer.metadata
      );
    });

    // Insert sample campaigns
    const insertCampaign = this.db!.prepare(`
      INSERT OR IGNORE INTO campaigns (id, name, type, status, budget, spent, revenue, roi, target_audience, content, performance_metrics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const campaigns = [
      {
        id: 'camp_001',
        name: 'Q4 Market Domination Campaign',
        type: 'acquisition',
        status: 'active',
        budget: 100000,
        spent: 45000,
        revenue: 180000,
        roi: 4.0,
        target_audience: JSON.stringify({ industries: ['technology', 'marketing'], company_size: 'enterprise' }),
        content: JSON.stringify({ channels: ['email', 'social', 'display'], messages: ['AI-powered growth'] }),
        performance_metrics: JSON.stringify({ ctr: 0.045, conversion_rate: 0.12, engagement: 0.78 })
      },
      {
        id: 'camp_002',
        name: 'Competitive Advantage Campaign',
        type: 'competitive',
        status: 'active',
        budget: 75000,
        spent: 32000,
        revenue: 125000,
        roi: 3.9,
        target_audience: JSON.stringify({ competitors: ['HubSpot', 'Marketo'], decision_makers: true }),
        content: JSON.stringify({ focus: 'superiority', tone: 'confident' }),
        performance_metrics: JSON.stringify({ ctr: 0.052, conversion_rate: 0.15, engagement: 0.82 })
      }
    ];

    campaigns.forEach(campaign => {
      insertCampaign.run(
        campaign.id,
        campaign.name,
        campaign.type,
        campaign.status,
        campaign.budget,
        campaign.spent,
        campaign.revenue,
        campaign.roi,
        campaign.target_audience,
        campaign.content,
        campaign.performance_metrics
      );
    });

    // Insert sample market intelligence
    const insertMarketIntel = this.db!.prepare(`
      INSERT OR IGNORE INTO market_intelligence (id, industry, competitor, intelligence_type, data, confidence, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const marketIntel = [
      {
        id: 'intel_001',
        industry: 'marketing_automation',
        competitor: 'HubSpot',
        intelligence_type: 'pricing',
        data: JSON.stringify({ 
          pricing_tiers: ['starter', 'professional', 'enterprise'],
          avg_price: 800,
          recent_changes: 'increased enterprise pricing by 15%'
        }),
        confidence: 0.92,
        source: 'competitive_analysis'
      },
      {
        id: 'intel_002',
        industry: 'marketing_automation',
        competitor: 'Marketo',
        intelligence_type: 'feature',
        data: JSON.stringify({
          new_features: ['AI lead scoring', 'predictive content'],
          gaps: ['voice AI', 'advanced computer vision'],
          market_position: 'enterprise-focused'
        }),
        confidence: 0.88,
        source: 'feature_analysis'
      }
    ];

    marketIntel.forEach(intel => {
      insertMarketIntel.run(
        intel.id,
        intel.industry,
        intel.competitor,
        intel.intelligence_type,
        intel.data,
        intel.confidence,
        intel.source
      );
    });

    // Insert performance benchmarks
    const insertMetric = this.db!.prepare(`
      INSERT OR IGNORE INTO performance_metrics (id, entity_type, entity_id, metric_type, value, benchmark, target, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const metrics = [
      { id: 'metric_001', entity_type: 'campaign', entity_id: 'camp_001', metric_type: 'conversion', value: 0.12, benchmark: 0.08, target: 0.15, period: 'monthly' },
      { id: 'metric_002', entity_type: 'campaign', entity_id: 'camp_001', metric_type: 'engagement', value: 0.78, benchmark: 0.65, target: 0.80, period: 'monthly' },
      { id: 'metric_003', entity_type: 'customer', entity_id: 'cust_001', metric_type: 'engagement', value: 0.85, benchmark: 0.70, target: 0.90, period: 'weekly' },
      { id: 'metric_004', entity_type: 'platform', entity_id: 'overall', metric_type: 'revenue', value: 500000, benchmark: 400000, target: 600000, period: 'monthly' }
    ];

    metrics.forEach(metric => {
      insertMetric.run(
        metric.id,
        metric.entity_type,
        metric.entity_id,
        metric.metric_type,
        metric.value,
        metric.benchmark,
        metric.target,
        metric.period
      );
    });

    console.log('✅ Initial data inserted successfully');
  }

  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('🗄️ Database connection closed');
    }
  }

  // Utility methods for common queries
  async getCustomers(limit: number = 100): Promise<any[]> {
    const stmt = this.db!.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }

  async getCampaigns(status?: string): Promise<any[]> {
    let query = 'SELECT * FROM campaigns ORDER BY created_at DESC';
    let params: any[] = [];
    
    if (status) {
      query = 'SELECT * FROM campaigns WHERE status = ? ORDER BY created_at DESC';
      params = [status];
    }
    
    const stmt = this.db!.prepare(query);
    return stmt.all(...params);
  }

  async getMarketIntelligence(industry?: string): Promise<any[]> {
    let query = 'SELECT * FROM market_intelligence ORDER BY created_at DESC';
    let params: any[] = [];
    
    if (industry) {
      query = 'SELECT * FROM market_intelligence WHERE industry = ? ORDER BY created_at DESC';
      params = [industry];
    }
    
    const stmt = this.db!.prepare(query);
    return stmt.all(...params);
  }

  async getPerformanceMetrics(entityType?: string, entityId?: string): Promise<any[]> {
    let query = 'SELECT * FROM performance_metrics ORDER BY timestamp DESC';
    let params: any[] = [];
    
    if (entityType && entityId) {
      query = 'SELECT * FROM performance_metrics WHERE entity_type = ? AND entity_id = ? ORDER BY timestamp DESC';
      params = [entityType, entityId];
    } else if (entityType) {
      query = 'SELECT * FROM performance_metrics WHERE entity_type = ? ORDER BY timestamp DESC';
      params = [entityType];
    }
    
    const stmt = this.db!.prepare(query);
    return stmt.all(...params);
  }
}

// Singleton instance
export const databaseSetup = new DatabaseSetup();
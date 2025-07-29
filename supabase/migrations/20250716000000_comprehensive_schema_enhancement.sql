-- Comprehensive Database Schema Enhancement for Market Domination Platform
-- This migration creates a complete enterprise-grade database schema with all business entities

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types for better data integrity
CREATE TYPE user_plan_type AS ENUM ('starter', 'professional', 'enterprise', 'agency');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived');
CREATE TYPE lead_temperature AS ENUM ('cold', 'warm', 'hot', 'qualified');
CREATE TYPE contact_status AS ENUM ('active', 'inactive', 'unsubscribed', 'bounced');
CREATE TYPE funnel_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'syncing');
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'error');
CREATE TYPE ai_model_status AS ENUM ('training', 'ready', 'updating', 'error');

-- Enhanced Profiles table with comprehensive user management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create comprehensive audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive customer intelligence table
CREATE TABLE IF NOT EXISTS customer_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    intelligence_type TEXT NOT NULL,
    data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    source TEXT NOT NULL,
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create advanced campaign management table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL,
    status campaign_status DEFAULT 'draft',
    budget_total DECIMAL(12,2) DEFAULT 0,
    budget_spent DECIMAL(12,2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}',
    content_config JSONB DEFAULT '{}',
    automation_rules JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    ai_optimization_enabled BOOLEAN DEFAULT TRUE,
    ai_insights JSONB DEFAULT '{}',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_budget CHECK (budget_spent <= budget_total)
);

-- Create advanced funnel management table
CREATE TABLE IF NOT EXISTS sales_funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status funnel_status DEFAULT 'draft',
    funnel_config JSONB NOT NULL DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    conversion_tracking JSONB DEFAULT '{}',
    ab_test_config JSONB DEFAULT '{}',
    performance_data JSONB DEFAULT '{}',
    ai_optimization JSONB DEFAULT '{}',
    total_visitors INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive analytics events table
CREATE TABLE IF NOT EXISTS analytics_events_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID,
    event_type TEXT NOT NULL,
    event_category TEXT,
    event_action TEXT,
    event_label TEXT,
    event_value DECIMAL(12,2),
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    device_info JSONB,
    geographic_data JSONB,
    custom_properties JSONB DEFAULT '{}',
    funnel_id UUID REFERENCES sales_funnels(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI model management table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    model_type TEXT NOT NULL,
    model_version TEXT NOT NULL,
    status ai_model_status DEFAULT 'training',
    training_data JSONB,
    hyperparameters JSONB,
    performance_metrics JSONB,
    accuracy_score DECIMAL(5,4),
    last_trained_at TIMESTAMPTZ,
    deployment_config JSONB,
    resource_usage JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create predictive analytics table
CREATE TABLE IF NOT EXISTS predictive_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    prediction_data JSONB NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    prediction_horizon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    actual_outcome JSONB,
    accuracy_measured DECIMAL(5,4)
);

-- Create comprehensive integrations table
CREATE TABLE IF NOT EXISTS platform_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_name TEXT NOT NULL,
    integration_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    status integration_status DEFAULT 'disconnected',
    configuration JSONB NOT NULL DEFAULT '{}',
    credentials_hash TEXT, -- Encrypted credentials
    sync_settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    sync_frequency INTERVAL,
    error_log JSONB DEFAULT '[]',
    performance_metrics JSONB DEFAULT '{}',
    webhook_endpoints JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create workflow automation table
CREATE TABLE IF NOT EXISTS workflow_automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status workflow_status DEFAULT 'draft',
    trigger_config JSONB NOT NULL,
    conditions JSONB DEFAULT '[]',
    actions JSONB NOT NULL,
    execution_log JSONB DEFAULT '[]',
    performance_stats JSONB DEFAULT '{}',
    ai_optimization_enabled BOOLEAN DEFAULT TRUE,
    learning_data JSONB DEFAULT '{}',
    last_executed_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive team management table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    access_level TEXT DEFAULT 'member',
    department TEXT,
    manager_id UUID REFERENCES team_members(id),
    onboarding_status TEXT DEFAULT 'pending',
    performance_metrics JSONB DEFAULT '{}',
    last_activity_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create advanced lead scoring table
CREATE TABLE IF NOT EXISTS lead_scoring_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    scoring_criteria JSONB NOT NULL,
    weights JSONB NOT NULL,
    thresholds JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    performance_metrics JSONB DEFAULT '{}',
    last_calibrated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create content intelligence table
CREATE TABLE IF NOT EXISTS content_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id UUID,
    analysis_type TEXT NOT NULL,
    analysis_results JSONB NOT NULL,
    performance_score DECIMAL(5,2),
    optimization_suggestions JSONB DEFAULT '[]',
    brand_alignment_score DECIMAL(5,2),
    sentiment_analysis JSONB,
    seo_analysis JSONB,
    readability_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market intelligence table
CREATE TABLE IF NOT EXISTS market_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intelligence_type TEXT NOT NULL,
    industry TEXT,
    competitor TEXT,
    data_source TEXT NOT NULL,
    intelligence_data JSONB NOT NULL,
    confidence_level DECIMAL(3,2),
    relevance_score DECIMAL(3,2),
    actionable_insights JSONB DEFAULT '[]',
    trend_analysis JSONB,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive backup and recovery tracking
CREATE TABLE IF NOT EXISTS backup_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    backup_size_bytes BIGINT,
    backup_location TEXT,
    retention_until TIMESTAMPTZ,
    verification_status TEXT,
    error_details JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Create data lineage tracking table
CREATE TABLE IF NOT EXISTS data_lineage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_table TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID NOT NULL,
    transformation_type TEXT NOT NULL,
    transformation_details JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_customer_intelligence_user_id ON customer_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_intelligence_contact_id ON customer_intelligence(contact_id);
CREATE INDEX IF NOT EXISTS idx_customer_intelligence_type ON customer_intelligence(intelligence_type);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);

CREATE INDEX IF NOT EXISTS idx_sales_funnels_user_id ON sales_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_funnels_status ON sales_funnels(status);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events_enhanced(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events_enhanced(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_funnel_id ON analytics_events_enhanced(funnel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign_id ON analytics_events_enhanced(campaign_id);

CREATE INDEX IF NOT EXISTS idx_ai_models_user_id ON ai_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(model_type);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_user_id ON predictive_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_entity ON predictive_analytics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_expires_at ON predictive_analytics(expires_at);

CREATE INDEX IF NOT EXISTS idx_platform_integrations_user_id ON platform_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_status ON platform_integrations(status);
CREATE INDEX IF NOT EXISTS idx_platform_integrations_type ON platform_integrations(integration_type);

CREATE INDEX IF NOT EXISTS idx_workflow_automations_user_id ON workflow_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_automations_status ON workflow_automations(status);

CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_content_intelligence_user_id ON content_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_content_intelligence_type ON content_intelligence(content_type);

CREATE INDEX IF NOT EXISTS idx_market_intelligence_user_id ON market_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_industry ON market_intelligence(industry);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_expires_at ON market_intelligence(expires_at);

-- Add foreign key constraints for data integrity
ALTER TABLE customer_intelligence 
ADD CONSTRAINT fk_customer_intelligence_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sales_funnels 
ADD CONSTRAINT fk_sales_funnels_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ai_models 
ADD CONSTRAINT fk_ai_models_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE predictive_analytics 
ADD CONSTRAINT fk_predictive_analytics_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE platform_integrations 
ADD CONSTRAINT fk_platform_integrations_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE workflow_automations 
ADD CONSTRAINT fk_workflow_automations_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE team_members 
ADD CONSTRAINT fk_team_members_org 
FOREIGN KEY (organization_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE team_members 
ADD CONSTRAINT fk_team_members_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE lead_scoring_models 
ADD CONSTRAINT fk_lead_scoring_models_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE content_intelligence 
ADD CONSTRAINT fk_content_intelligence_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE market_intelligence 
ADD CONSTRAINT fk_market_intelligence_user 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
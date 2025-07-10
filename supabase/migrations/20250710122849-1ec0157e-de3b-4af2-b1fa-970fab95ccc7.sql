-- ========================================
-- PRODUCTION-READY DATABASE SCHEMA UPGRADE
-- Making HigherUp.ai 1000x Better Than All Competitors
-- ========================================

-- Enhanced AI Interactions with Canvas Logging
ALTER TABLE ai_interactions ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT '{}';
ALTER TABLE ai_interactions ADD COLUMN IF NOT EXISTS interaction_context JSONB DEFAULT '{}';
ALTER TABLE ai_interactions ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';
ALTER TABLE ai_interactions ADD COLUMN IF NOT EXISTS user_satisfaction_score INTEGER DEFAULT NULL;

-- Comprehensive User Behavior Tracking
CREATE TABLE IF NOT EXISTS user_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    page_path TEXT NOT NULL,
    action_type TEXT NOT NULL, -- click, view, scroll, form_submit, etc.
    element_data JSONB DEFAULT '{}',
    interaction_duration INTEGER DEFAULT 0, -- in milliseconds
    device_info JSONB DEFAULT '{}',
    browser_info JSONB DEFAULT '{}',
    conversion_funnel_step TEXT,
    ab_test_variant TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Video Generation System
CREATE TABLE IF NOT EXISTS video_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    script_content TEXT,
    avatar_id TEXT,
    avatar_settings JSONB DEFAULT '{}',
    video_settings JSONB DEFAULT '{}', -- quality, style, music, etc.
    generation_status TEXT DEFAULT 'draft', -- draft, processing, completed, failed
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    generation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Avatar Management
CREATE TABLE IF NOT EXISTS ai_avatars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_type TEXT NOT NULL, -- professional, casual, corporate, etc.
    gender TEXT,
    accent TEXT,
    voice_id TEXT,
    appearance_settings JSONB DEFAULT '{}',
    personality_traits JSONB DEFAULT '{}',
    thumbnail_url TEXT,
    model_file_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    creator_user_id UUID,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Video Templates
CREATE TABLE IF NOT EXISTS video_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    duration_range TEXT, -- "1-2 min", "30s", etc.
    template_data JSONB NOT NULL DEFAULT '{}',
    preview_video_url TEXT,
    thumbnail_url TEXT,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Funnel Analytics
CREATE TABLE IF NOT EXISTS funnel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    funnel_id UUID NOT NULL,
    visitor_id UUID,
    session_id UUID NOT NULL,
    step_name TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    entry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exit_timestamp TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    conversion_achieved BOOLEAN DEFAULT FALSE,
    traffic_source TEXT,
    utm_campaign TEXT,
    utm_medium TEXT,
    utm_source TEXT,
    device_type TEXT,
    browser_type TEXT,
    geographic_location JSONB DEFAULT '{}',
    user_agent TEXT,
    referrer_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI-Powered Personalization Engine
CREATE TABLE IF NOT EXISTS user_personalization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    behavioral_profile JSONB DEFAULT '{}', -- interests, preferences, engagement patterns
    ai_recommendations JSONB DEFAULT '{}',
    content_preferences JSONB DEFAULT '{}',
    communication_style TEXT, -- formal, casual, professional
    optimal_contact_times JSONB DEFAULT '{}',
    conversion_triggers JSONB DEFAULT '{}',
    predicted_lifetime_value DECIMAL(10,2),
    churn_risk_score DECIMAL(3,2),
    engagement_score DECIMAL(3,2),
    last_ai_analysis TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced CRM with AI Insights
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS lead_temperature TEXT DEFAULT 'cold'; -- hot, warm, cold
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS predicted_conversion_probability DECIMAL(3,2);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ai_generated_insights JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS engagement_history JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS social_media_profiles JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_interaction_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;

-- Smart Email Campaign Analytics
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS ai_optimization_suggestions JSONB DEFAULT '{}';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS subject_line_variants JSONB DEFAULT '{}';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS send_time_optimization JSONB DEFAULT '{}';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS target_audience_data JSONB DEFAULT '{}';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS conversion_tracking JSONB DEFAULT '{}';
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS roi_metrics JSONB DEFAULT '{}';

-- AI Support System
CREATE TABLE IF NOT EXISTS ai_support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    message_type TEXT NOT NULL, -- user, ai, system
    message_content TEXT NOT NULL,
    intent_detected TEXT,
    confidence_score DECIMAL(3,2),
    resolved BOOLEAN DEFAULT FALSE,
    escalated_to_human BOOLEAN DEFAULT FALSE,
    satisfaction_rating INTEGER, -- 1-5 stars
    resolution_time_seconds INTEGER,
    conversation_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced A/B Testing Framework
CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name TEXT NOT NULL,
    test_type TEXT NOT NULL, -- email, funnel, landing_page, etc.
    status TEXT DEFAULT 'draft', -- draft, running, completed, paused
    target_resource_id UUID, -- funnel_id, campaign_id, etc.
    variants JSONB NOT NULL DEFAULT '{}',
    traffic_allocation JSONB DEFAULT '{}', -- how traffic is split
    success_metrics JSONB DEFAULT '{}',
    statistical_significance DECIMAL(5,4),
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    results_data JSONB DEFAULT '{}',
    winner_variant TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Performance Monitoring
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    metric_type TEXT NOT NULL, -- revenue, conversions, traffic, etc.
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    period_type TEXT NOT NULL, -- hourly, daily, weekly, monthly
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    comparison_period_value DECIMAL(15,4),
    percentage_change DECIMAL(5,2),
    goal_value DECIMAL(15,4),
    goal_achievement_percentage DECIMAL(5,2),
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Workflow Automation
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS ai_optimization_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}';
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS learning_data JSONB DEFAULT '{}';
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS webhook_endpoints JSONB DEFAULT '{}';
ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS conditional_logic JSONB DEFAULT '{}';

-- Advanced Analytics Dashboard
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    widget_type TEXT NOT NULL,
    widget_config JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    is_visible BOOLEAN DEFAULT TRUE,
    refresh_interval INTEGER DEFAULT 300, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive Intelligence
CREATE TABLE IF NOT EXISTS competitor_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    competitor_name TEXT NOT NULL,
    competitor_domain TEXT,
    analysis_type TEXT NOT NULL, -- pricing, features, content, seo
    analysis_data JSONB NOT NULL DEFAULT '{}',
    competitive_advantage_score DECIMAL(3,2),
    threat_level TEXT, -- low, medium, high
    opportunities JSONB DEFAULT '{}',
    last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auto_update_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advanced Lead Scoring
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- demographic, behavioral, engagement
    conditions JSONB NOT NULL DEFAULT '{}',
    score_points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Profiles for Complete User Data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS annual_revenue TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_goals JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feature_usage_stats JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- RLS Policies for all new tables
ALTER TABLE user_behavior_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own behavior logs" ON user_behavior_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own behavior logs" ON user_behavior_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own video projects" ON video_projects FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ai_avatars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view public avatars" ON ai_avatars FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage their own avatars" ON ai_avatars FOR ALL USING (auth.uid() = creator_user_id);

ALTER TABLE video_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view video templates" ON video_templates FOR SELECT USING (true);

ALTER TABLE funnel_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analytics for their funnels" ON funnel_analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM funnels WHERE funnels.id = funnel_analytics.funnel_id AND funnels.user_id = auth.uid())
);
CREATE POLICY "Users can insert analytics for their funnels" ON funnel_analytics FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM funnels WHERE funnels.id = funnel_analytics.funnel_id AND funnels.user_id = auth.uid())
);

ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own personalization" ON user_personalization FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ai_support_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own support conversations" ON ai_support_conversations FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own AB tests" ON ab_tests FOR ALL USING (auth.uid() = created_by);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own metrics" ON performance_metrics FOR ALL USING (auth.uid() = user_id);

ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own dashboard widgets" ON dashboard_widgets FOR ALL USING (auth.uid() = user_id);

ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own competitor analysis" ON competitor_analysis FOR ALL USING (auth.uid() = user_id);

ALTER TABLE lead_scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own lead scoring rules" ON lead_scoring_rules FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_projects_updated_at BEFORE UPDATE ON video_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_avatars_updated_at BEFORE UPDATE ON ai_avatars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_personalization_updated_at BEFORE UPDATE ON user_personalization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitor_analysis_updated_at BEFORE UPDATE ON competitor_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_scoring_rules_updated_at BEFORE UPDATE ON lead_scoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_user_id ON user_behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_session_id ON user_behavior_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_action_type ON user_behavior_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_logs_created_at ON user_behavior_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_video_projects_user_id ON video_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_projects(generation_status);
CREATE INDEX IF NOT EXISTS idx_video_projects_created_at ON video_projects(created_at);

CREATE INDEX IF NOT EXISTS idx_funnel_analytics_funnel_id ON funnel_analytics(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_session_id ON funnel_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_step_order ON funnel_analytics(step_order);
CREATE INDEX IF NOT EXISTS idx_funnel_analytics_conversion ON funnel_analytics(conversion_achieved);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(period_start, period_end);

-- Insert default AI avatars
INSERT INTO ai_avatars (name, avatar_type, gender, accent, voice_id, appearance_settings, personality_traits, is_public, usage_count) VALUES
('Sarah', 'professional', 'female', 'american', 'voice_sarah_001', 
 '{"hair_color": "brown", "eye_color": "blue", "style": "business"}', 
 '{"confidence": 0.9, "friendliness": 0.8, "professionalism": 0.95}', true, 0),
('David', 'casual', 'male', 'british', 'voice_david_001', 
 '{"hair_color": "black", "eye_color": "brown", "style": "casual"}', 
 '{"confidence": 0.8, "friendliness": 0.9, "professionalism": 0.7}', true, 0),
('Maria', 'corporate', 'female', 'spanish', 'voice_maria_001', 
 '{"hair_color": "blonde", "eye_color": "green", "style": "executive"}', 
 '{"confidence": 0.95, "friendliness": 0.75, "professionalism": 0.98}', true, 0),
('James', 'friendly', 'male', 'australian', 'voice_james_001', 
 '{"hair_color": "red", "eye_color": "blue", "style": "approachable"}', 
 '{"confidence": 0.85, "friendliness": 0.95, "professionalism": 0.8}', true, 0)
ON CONFLICT DO NOTHING;

-- Insert default video templates
INSERT INTO video_templates (name, category, description, duration_range, template_data, tags) VALUES
('Product Demo', 'marketing', 'Showcase your product features with compelling visuals', '1-2 min', 
 '{"structure": ["intro", "problem", "solution", "features", "cta"], "style": "modern", "transitions": "smooth"}', 
 ARRAY['product', 'demo', 'marketing']),
('Explainer Video', 'educational', 'Explain complex concepts in simple terms', '2-3 min', 
 '{"structure": ["hook", "problem", "explanation", "examples", "conclusion"], "style": "animated", "transitions": "educational"}', 
 ARRAY['explainer', 'education', 'tutorial']),
('Social Media Ad', 'advertising', 'High-converting social media advertisements', '15-30s', 
 '{"structure": ["hook", "benefit", "proof", "cta"], "style": "dynamic", "transitions": "fast"}', 
 ARRAY['social', 'ad', 'conversion']),
('Testimonial Video', 'social_proof', 'Customer success stories and testimonials', '1 min', 
 '{"structure": ["introduction", "problem", "solution", "results", "recommendation"], "style": "authentic", "transitions": "natural"}', 
 ARRAY['testimonial', 'social_proof', 'customer'])
ON CONFLICT DO NOTHING;
-- Production Database Optimization Migration
-- Optimizes database schema for production performance with proper indexing and constraints

-- Enable additional extensions for production
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

-- Create optimized indexes for production performance
-- Contact management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_id_status 
ON contacts(user_id, status) WHERE status IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_id_created_at 
ON contacts(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_email_gin 
ON contacts USING gin(email gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_name_gin 
ON contacts USING gin((first_name || ' ' || last_name) gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_company_gin 
ON contacts USING gin(company gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_lead_score 
ON contacts(user_id, lead_score DESC) WHERE lead_score > 0;

-- Email campaign indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_user_status 
ON email_campaigns(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_campaigns_scheduled 
ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'scheduled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_deliveries_campaign_status 
ON email_deliveries(campaign_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_deliveries_contact_delivered 
ON email_deliveries(contact_id, delivered_at) WHERE delivered_at IS NOT NULL;

-- Funnel and analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funnels_user_status 
ON funnels(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_type_created 
ON analytics_events(user_id, event_type, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_session_created 
ON analytics_events(session_id, created_at) WHERE session_id IS NOT NULL;

-- Performance metrics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_user_metric_date 
ON performance_metrics(user_id, metric_name, created_at DESC);

-- Integration indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_user_status 
ON integrations(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_integrations_provider_status 
ON integrations(provider, status);

-- Create materialized views for complex analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_metrics AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT c.id) as total_contacts,
    COUNT(DISTINCT CASE WHEN ec.status = 'active' THEN ec.id END) as active_campaigns,
    COUNT(DISTINCT f.id) as total_funnels,
    AVG(f.conversion_rate) as avg_conversion_rate,
    SUM(CASE WHEN pm.metric_name = 'revenue' AND pm.created_at >= date_trunc('month', CURRENT_DATE) 
             THEN pm.metric_value ELSE 0 END) as revenue_this_month,
    COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as new_contacts_30d,
    COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN c.id END) as new_contacts_7d
FROM auth.users u
LEFT JOIN contacts c ON u.id = c.user_id
LEFT JOIN email_campaigns ec ON u.id = ec.user_id
LEFT JOIN funnels f ON u.id = f.user_id
LEFT JOIN performance_metrics pm ON u.id = pm.user_id
GROUP BY u.id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_metrics_user_id 
ON user_dashboard_metrics(user_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_dashboard_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for contact analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS contact_analytics AS
SELECT 
    user_id,
    status,
    lead_temperature,
    source,
    COUNT(*) as contact_count,
    AVG(lead_score) as avg_lead_score,
    MIN(created_at) as first_contact_date,
    MAX(created_at) as last_contact_date,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_this_month,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as new_this_week
FROM contacts
GROUP BY user_id, status, lead_temperature, source;

-- Create indexes on contact analytics view
CREATE INDEX IF NOT EXISTS idx_contact_analytics_user_id 
ON contact_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_contact_analytics_status 
ON contact_analytics(user_id, status);

-- Create function for advanced contact search with full-text search
CREATE OR REPLACE FUNCTION search_contacts(
    p_user_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_lead_temperature TEXT DEFAULT NULL,
    p_company TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    status TEXT,
    lead_temperature TEXT,
    lead_score INTEGER,
    source TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.email,
        c.first_name,
        c.last_name,
        c.company,
        c.status,
        c.lead_temperature,
        c.lead_score,
        c.source,
        c.created_at,
        c.updated_at,
        CASE 
            WHEN p_search_term IS NOT NULL THEN
                ts_rank(
                    to_tsvector('english', 
                        COALESCE(c.first_name, '') || ' ' || 
                        COALESCE(c.last_name, '') || ' ' || 
                        COALESCE(c.email, '') || ' ' || 
                        COALESCE(c.company, '')
                    ),
                    plainto_tsquery('english', p_search_term)
                )
            ELSE 1.0
        END as search_rank
    FROM contacts c
    WHERE c.user_id = p_user_id
        AND (p_search_term IS NULL OR (
            c.first_name ILIKE '%' || p_search_term || '%' OR
            c.last_name ILIKE '%' || p_search_term || '%' OR
            c.email ILIKE '%' || p_search_term || '%' OR
            c.company ILIKE '%' || p_search_term || '%'
        ))
        AND (p_status IS NULL OR c.status = p_status)
        AND (p_lead_temperature IS NULL OR c.lead_temperature = p_lead_temperature)
        AND (p_company IS NULL OR c.company ILIKE '%' || p_company || '%')
    ORDER BY 
        CASE WHEN p_search_term IS NOT NULL THEN search_rank END DESC,
        c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function for batch contact operations
CREATE OR REPLACE FUNCTION batch_update_lead_scores(
    p_user_id UUID,
    p_updates JSONB
)
RETURNS INTEGER AS $$
DECLARE
    update_count INTEGER := 0;
    update_record RECORD;
BEGIN
    FOR update_record IN 
        SELECT 
            (value->>'contact_id')::UUID as contact_id,
            (value->>'lead_score')::INTEGER as lead_score
        FROM jsonb_array_elements(p_updates)
    LOOP
        UPDATE contacts 
        SET 
            lead_score = update_record.lead_score,
            updated_at = NOW()
        WHERE id = update_record.contact_id 
            AND user_id = p_user_id;
        
        IF FOUND THEN
            update_count := update_count + 1;
        END IF;
    END LOOP;
    
    RETURN update_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for campaign performance analytics
CREATE OR REPLACE FUNCTION get_campaign_performance(
    p_user_id UUID,
    p_campaign_id UUID DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
    campaign_id UUID,
    campaign_name TEXT,
    total_sent INTEGER,
    total_delivered INTEGER,
    total_opened INTEGER,
    total_clicked INTEGER,
    delivery_rate DECIMAL,
    open_rate DECIMAL,
    click_rate DECIMAL,
    click_to_open_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id as campaign_id,
        ec.name as campaign_name,
        COUNT(ed.id)::INTEGER as total_sent,
        COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END)::INTEGER as total_delivered,
        COUNT(CASE WHEN ed.opened_at IS NOT NULL THEN 1 END)::INTEGER as total_opened,
        COUNT(CASE WHEN ed.clicked_at IS NOT NULL THEN 1 END)::INTEGER as total_clicked,
        CASE 
            WHEN COUNT(ed.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END)::DECIMAL / COUNT(ed.id)) * 100, 2)
            ELSE 0 
        END as delivery_rate,
        CASE 
            WHEN COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END) > 0 THEN 
                ROUND((COUNT(CASE WHEN ed.opened_at IS NOT NULL THEN 1 END)::DECIMAL / COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END)) * 100, 2)
            ELSE 0 
        END as open_rate,
        CASE 
            WHEN COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END) > 0 THEN 
                ROUND((COUNT(CASE WHEN ed.clicked_at IS NOT NULL THEN 1 END)::DECIMAL / COUNT(CASE WHEN ed.status = 'delivered' THEN 1 END)) * 100, 2)
            ELSE 0 
        END as click_rate,
        CASE 
            WHEN COUNT(CASE WHEN ed.opened_at IS NOT NULL THEN 1 END) > 0 THEN 
                ROUND((COUNT(CASE WHEN ed.clicked_at IS NOT NULL THEN 1 END)::DECIMAL / COUNT(CASE WHEN ed.opened_at IS NOT NULL THEN 1 END)) * 100, 2)
            ELSE 0 
        END as click_to_open_rate
    FROM email_campaigns ec
    LEFT JOIN email_deliveries ed ON ec.id = ed.campaign_id
    WHERE ec.user_id = p_user_id
        AND (p_campaign_id IS NULL OR ec.id = p_campaign_id)
        AND (p_start_date IS NULL OR ec.created_at >= p_start_date)
        AND (p_end_date IS NULL OR ec.created_at <= p_end_date)
    GROUP BY ec.id, ec.name
    ORDER BY ec.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all relevant tables
DO $$
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY[
        'contacts', 'email_campaigns', 'funnels', 'integrations', 
        'performance_metrics', 'analytics_events', 'profiles'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_updated_at ON %I;
            CREATE TRIGGER trigger_update_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name);
    END LOOP;
END $$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            user_id, table_name, record_id, action, new_values, 
            changed_fields, created_at
        ) VALUES (
            COALESCE(NEW.user_id, auth.uid()),
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'INSERT',
            to_jsonb(NEW),
            ARRAY(SELECT jsonb_object_keys(to_jsonb(NEW))),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            user_id, table_name, record_id, action, old_values, 
            new_values, changed_fields, created_at
        ) VALUES (
            COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
            TG_TABLE_NAME,
            NEW.id::TEXT,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            ARRAY(
                SELECT key FROM jsonb_each(to_jsonb(NEW)) 
                WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key
            ),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, table_name, record_id, action, old_values, created_at
        ) VALUES (
            COALESCE(OLD.user_id, auth.uid()),
            TG_TABLE_NAME,
            OLD.id::TEXT,
            'DELETE',
            to_jsonb(OLD),
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
DO $$
DECLARE
    table_name TEXT;
    audited_tables TEXT[] := ARRAY[
        'contacts', 'email_campaigns', 'funnels', 'integrations'
    ];
BEGIN
    FOREACH table_name IN ARRAY audited_tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS audit_trigger ON %I;
            CREATE TRIGGER audit_trigger
                AFTER INSERT OR UPDATE OR DELETE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION audit_trigger_function();
        ', table_name, table_name);
    END LOOP;
END $$;

-- Create function for database health monitoring
CREATE OR REPLACE FUNCTION get_database_health()
RETURNS TABLE(
    metric_name TEXT,
    metric_value NUMERIC,
    status TEXT,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'active_connections'::TEXT,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC,
        CASE 
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') < 50 THEN 'healthy'
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') < 100 THEN 'warning'
            ELSE 'critical'
        END::TEXT,
        NOW()
    UNION ALL
    SELECT 
        'database_size_mb'::TEXT,
        (SELECT pg_database_size(current_database()) / 1024 / 1024)::NUMERIC,
        'healthy'::TEXT,
        NOW()
    UNION ALL
    SELECT 
        'cache_hit_ratio'::TEXT,
        (SELECT 
            CASE 
                WHEN (blks_hit + blks_read) = 0 THEN 100
                ELSE (blks_hit::NUMERIC / (blks_hit + blks_read)) * 100
            END
         FROM pg_stat_database WHERE datname = current_database())::NUMERIC,
        CASE 
            WHEN (SELECT 
                CASE 
                    WHEN (blks_hit + blks_read) = 0 THEN 100
                    ELSE (blks_hit::NUMERIC / (blks_hit + blks_read)) * 100
                END
             FROM pg_stat_database WHERE datname = current_database()) > 95 THEN 'healthy'
            WHEN (SELECT 
                CASE 
                    WHEN (blks_hit + blks_read) = 0 THEN 100
                    ELSE (blks_hit::NUMERIC / (blks_hit + blks_read)) * 100
                END
             FROM pg_stat_database WHERE datname = current_database()) > 90 THEN 'warning'
            ELSE 'critical'
        END::TEXT,
        NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to analyze slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pss.query,
        pss.calls,
        pss.total_exec_time as total_time,
        pss.mean_exec_time as mean_time,
        pss.rows
    FROM pg_stat_statements pss
    ORDER BY pss.mean_exec_time DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create scheduled job to refresh materialized views (requires pg_cron extension)
-- This would be enabled in production with proper scheduling
-- SELECT cron.schedule('refresh-dashboard-metrics', '*/5 * * * *', 'SELECT refresh_user_dashboard_metrics();');

-- Create function for data archival (for GDPR compliance)
CREATE OR REPLACE FUNCTION archive_old_data(
    p_days_old INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER := 0;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (p_days_old || ' days')::INTERVAL;
    
    -- Archive old analytics events
    WITH archived AS (
        DELETE FROM analytics_events 
        WHERE created_at < cutoff_date
        RETURNING *
    )
    SELECT COUNT(*) INTO archived_count FROM archived;
    
    -- Archive old audit logs
    DELETE FROM audit_logs WHERE created_at < cutoff_date;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for application user
-- GRANT USAGE ON SCHEMA public TO application_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO application_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO application_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO application_user;

-- Create comment documentation for key functions
COMMENT ON FUNCTION search_contacts IS 'Advanced contact search with full-text search capabilities and filtering';
COMMENT ON FUNCTION batch_update_lead_scores IS 'Efficiently update lead scores for multiple contacts in a single transaction';
COMMENT ON FUNCTION get_campaign_performance IS 'Calculate comprehensive email campaign performance metrics';
COMMENT ON FUNCTION get_database_health IS 'Monitor database health metrics for production monitoring';
COMMENT ON FUNCTION archive_old_data IS 'Archive old data for GDPR compliance and performance optimization';

-- Analyze tables for query planner optimization
ANALYZE contacts;
ANALYZE email_campaigns;
ANALYZE email_deliveries;
ANALYZE funnels;
ANALYZE analytics_events;
ANALYZE performance_metrics;
ANALYZE integrations;
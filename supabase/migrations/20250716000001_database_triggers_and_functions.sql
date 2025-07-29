-- Database Triggers and Functions for Automated Data Processing and Audit Trails
-- This migration creates comprehensive triggers for audit logging, data validation, and automated processing

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for comprehensive audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
    field_name TEXT;
BEGIN
    -- Handle different trigger operations
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
        changed_fields = ARRAY(SELECT jsonb_object_keys(old_data));
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
        changed_fields = ARRAY(SELECT jsonb_object_keys(new_data));
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Identify changed fields
        changed_fields = ARRAY(
            SELECT key 
            FROM jsonb_each(old_data) old_kv
            JOIN jsonb_each(new_data) new_kv ON old_kv.key = new_kv.key
            WHERE old_kv.value IS DISTINCT FROM new_kv.value
        );
    END IF;

    -- Insert audit record
    INSERT INTO audit_logs (
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        ip_address,
        user_agent
    ) VALUES (
        COALESCE(
            CASE WHEN TG_OP = 'DELETE' THEN (OLD.user_id)::UUID 
                 ELSE (NEW.user_id)::UUID END,
            auth.uid()
        ),
        TG_TABLE_NAME,
        COALESCE(
            CASE WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT 
                 ELSE NEW.id::TEXT END
        ),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        inet_client_addr(),
        current_setting('request.headers', true)::JSONB->>'user-agent'
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically calculate lead scores
CREATE OR REPLACE FUNCTION calculate_lead_score()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    scoring_model RECORD;
    criteria JSONB;
    weight INTEGER;
BEGIN
    -- Get active scoring model for the user
    SELECT * INTO scoring_model 
    FROM lead_scoring_models 
    WHERE user_id = NEW.user_id AND is_active = TRUE 
    LIMIT 1;

    IF scoring_model IS NOT NULL THEN
        -- Calculate score based on criteria
        FOR criteria IN SELECT * FROM jsonb_array_elements(scoring_model.scoring_criteria)
        LOOP
            weight := (criteria->>'weight')::INTEGER;
            
            -- Email domain scoring
            IF criteria->>'type' = 'email_domain' THEN
                IF NEW.email LIKE '%@' || (criteria->>'domain') THEN
                    score := score + weight;
                END IF;
            END IF;
            
            -- Company size scoring
            IF criteria->>'type' = 'company_size' AND NEW.custom_fields ? 'company_size' THEN
                IF NEW.custom_fields->>'company_size' = criteria->>'value' THEN
                    score := score + weight;
                END IF;
            END IF;
            
            -- Industry scoring
            IF criteria->>'type' = 'industry' AND NEW.custom_fields ? 'industry' THEN
                IF NEW.custom_fields->>'industry' = criteria->>'value' THEN
                    score := score + weight;
                END IF;
            END IF;
            
            -- Engagement scoring
            IF criteria->>'type' = 'engagement' AND NEW.interaction_count IS NOT NULL THEN
                IF NEW.interaction_count >= (criteria->>'threshold')::INTEGER THEN
                    score := score + weight;
                END IF;
            END IF;
        END LOOP;
        
        -- Update lead score
        NEW.lead_score := LEAST(score, 100); -- Cap at 100
        
        -- Set lead temperature based on score
        IF NEW.lead_score >= 80 THEN
            NEW.lead_temperature := 'hot';
        ELSIF NEW.lead_score >= 50 THEN
            NEW.lead_temperature := 'warm';
        ELSE
            NEW.lead_temperature := 'cold';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update campaign performance metrics
CREATE OR REPLACE FUNCTION update_campaign_performance()
RETURNS TRIGGER AS $$
DECLARE
    campaign_record RECORD;
    total_sent INTEGER;
    total_opened INTEGER;
    total_clicked INTEGER;
    open_rate DECIMAL(5,2);
    click_rate DECIMAL(5,2);
    roi DECIMAL(10,2);
BEGIN
    -- Get campaign data
    SELECT * INTO campaign_record FROM campaigns WHERE id = NEW.campaign_id;
    
    IF campaign_record IS NOT NULL THEN
        -- Calculate email campaign metrics
        IF TG_TABLE_NAME = 'email_campaigns' THEN
            SELECT 
                COALESCE(SUM(total_sent), 0),
                COALESCE(SUM(total_opened), 0),
                COALESCE(SUM(total_clicked), 0)
            INTO total_sent, total_opened, total_clicked
            FROM email_campaigns 
            WHERE user_id = NEW.user_id;
            
            -- Calculate rates
            open_rate := CASE WHEN total_sent > 0 THEN (total_opened::DECIMAL / total_sent) * 100 ELSE 0 END;
            click_rate := CASE WHEN total_opened > 0 THEN (total_clicked::DECIMAL / total_opened) * 100 ELSE 0 END;
            
            -- Update campaign performance metrics
            UPDATE campaigns 
            SET performance_metrics = jsonb_set(
                COALESCE(performance_metrics, '{}'),
                '{email_metrics}',
                jsonb_build_object(
                    'total_sent', total_sent,
                    'total_opened', total_opened,
                    'total_clicked', total_clicked,
                    'open_rate', open_rate,
                    'click_rate', click_rate,
                    'last_updated', NOW()
                )
            )
            WHERE id = campaign_record.id;
        END IF;
        
        -- Calculate ROI if revenue and budget data available
        IF campaign_record.budget_total > 0 THEN
            roi := ((COALESCE((campaign_record.performance_metrics->>'revenue')::DECIMAL, 0) - campaign_record.budget_spent) / campaign_record.budget_spent) * 100;
            
            UPDATE campaigns 
            SET performance_metrics = jsonb_set(
                COALESCE(performance_metrics, '{}'),
                '{roi}',
                to_jsonb(roi)
            )
            WHERE id = campaign_record.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically backup critical data changes
CREATE OR REPLACE FUNCTION trigger_data_backup()
RETURNS TRIGGER AS $$
BEGIN
    -- Log backup requirement for critical tables
    IF TG_TABLE_NAME IN ('campaigns', 'contacts', 'email_campaigns', 'sales_funnels') THEN
        INSERT INTO backup_operations (
            backup_type,
            status,
            backup_location,
            metadata
        ) VALUES (
            'incremental',
            'running',
            'auto_trigger_backup',
            jsonb_build_object(
                'trigger_table', TG_TABLE_NAME,
                'trigger_operation', TG_OP,
                'record_id', COALESCE(NEW.id::TEXT, OLD.id::TEXT),
                'triggered_at', NOW()
            )
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function for data validation and integrity checks
CREATE OR REPLACE FUNCTION validate_data_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate email format for contacts
    IF TG_TABLE_NAME = 'contacts' AND NEW.email IS NOT NULL THEN
        IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RAISE EXCEPTION 'Invalid email format: %', NEW.email;
        END IF;
    END IF;
    
    -- Validate campaign budget constraints
    IF TG_TABLE_NAME = 'campaigns' THEN
        IF NEW.budget_spent > NEW.budget_total THEN
            RAISE EXCEPTION 'Budget spent (%) cannot exceed total budget (%)', NEW.budget_spent, NEW.budget_total;
        END IF;
    END IF;
    
    -- Validate funnel conversion rate
    IF TG_TABLE_NAME = 'sales_funnels' THEN
        IF NEW.total_visitors > 0 THEN
            NEW.conversion_rate := (NEW.total_conversions::DECIMAL / NEW.total_visitors) * 100;
        ELSE
            NEW.conversion_rate := 0;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate AI insights automatically
CREATE OR REPLACE FUNCTION generate_ai_insights()
RETURNS TRIGGER AS $$
DECLARE
    insight_data JSONB;
BEGIN
    -- Generate insights for campaign performance changes
    IF TG_TABLE_NAME = 'campaigns' AND TG_OP = 'UPDATE' THEN
        -- Check for significant performance changes
        IF (NEW.performance_metrics->>'roi')::DECIMAL > (OLD.performance_metrics->>'roi')::DECIMAL + 10 THEN
            INSERT INTO customer_intelligence (
                user_id,
                intelligence_type,
                data,
                confidence_score,
                source
            ) VALUES (
                NEW.user_id,
                'campaign_performance_improvement',
                jsonb_build_object(
                    'campaign_id', NEW.id,
                    'campaign_name', NEW.name,
                    'old_roi', OLD.performance_metrics->>'roi',
                    'new_roi', NEW.performance_metrics->>'roi',
                    'improvement', (NEW.performance_metrics->>'roi')::DECIMAL - (OLD.performance_metrics->>'roi')::DECIMAL,
                    'insight', 'Campaign performance has significantly improved. Consider scaling this campaign.'
                ),
                0.85,
                'automated_analysis'
            );
        END IF;
    END IF;
    
    -- Generate insights for lead score changes
    IF TG_TABLE_NAME = 'contacts' AND TG_OP = 'UPDATE' THEN
        IF NEW.lead_score > OLD.lead_score + 20 THEN
            INSERT INTO customer_intelligence (
                user_id,
                contact_id,
                intelligence_type,
                data,
                confidence_score,
                source
            ) VALUES (
                NEW.user_id,
                NEW.id,
                'lead_score_increase',
                jsonb_build_object(
                    'contact_name', NEW.name,
                    'old_score', OLD.lead_score,
                    'new_score', NEW.lead_score,
                    'increase', NEW.lead_score - OLD.lead_score,
                    'insight', 'This lead has shown significant engagement. Consider prioritizing for sales outreach.'
                ),
                0.90,
                'automated_analysis'
            );
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up expired predictions
    DELETE FROM predictive_analytics 
    WHERE expires_at < NOW();
    
    -- Clean up expired market intelligence
    DELETE FROM market_intelligence 
    WHERE expires_at < NOW();
    
    -- Clean up old audit logs (keep 1 year)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Clean up old analytics events (keep 2 years)
    DELETE FROM analytics_events_enhanced 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    RAISE NOTICE 'Expired data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_funnels_updated_at 
    BEFORE UPDATE ON sales_funnels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at 
    BEFORE UPDATE ON ai_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_integrations_updated_at 
    BEFORE UPDATE ON platform_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_automations_updated_at 
    BEFORE UPDATE ON workflow_automations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at 
    BEFORE UPDATE ON team_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_scoring_models_updated_at 
    BEFORE UPDATE ON lead_scoring_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_intelligence_updated_at 
    BEFORE UPDATE ON content_intelligence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_intelligence_updated_at 
    BEFORE UPDATE ON customer_intelligence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers for all major tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_contacts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_email_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_sales_funnels_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sales_funnels
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_platform_integrations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON platform_integrations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create data validation triggers
CREATE TRIGGER validate_contacts_data
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION validate_data_integrity();

CREATE TRIGGER validate_campaigns_data
    BEFORE INSERT OR UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION validate_data_integrity();

CREATE TRIGGER validate_sales_funnels_data
    BEFORE INSERT OR UPDATE ON sales_funnels
    FOR EACH ROW EXECUTE FUNCTION validate_data_integrity();

-- Create lead scoring triggers
CREATE TRIGGER calculate_contact_lead_score
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION calculate_lead_score();

-- Create performance update triggers
CREATE TRIGGER update_email_campaign_performance
    AFTER INSERT OR UPDATE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_campaign_performance();

-- Create AI insights generation triggers
CREATE TRIGGER generate_campaign_insights
    AFTER UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION generate_ai_insights();

CREATE TRIGGER generate_contact_insights
    AFTER UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION generate_ai_insights();

-- Create backup triggers for critical data
CREATE TRIGGER backup_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION trigger_data_backup();

CREATE TRIGGER backup_contacts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION trigger_data_backup();

CREATE TRIGGER backup_email_campaigns_trigger
    AFTER INSERT OR UPDATE OR DELETE ON email_campaigns
    FOR EACH ROW EXECUTE FUNCTION trigger_data_backup();

CREATE TRIGGER backup_sales_funnels_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sales_funnels
    FOR EACH ROW EXECUTE FUNCTION trigger_data_backup();
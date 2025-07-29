-- Database Functions for Complex Business Logic and Calculations
-- This migration creates comprehensive business logic functions for analytics, predictions, and calculations

-- Function to calculate Customer Lifetime Value (CLV)
CREATE OR REPLACE FUNCTION calculate_customer_lifetime_value(
    contact_uuid UUID,
    prediction_months INTEGER DEFAULT 12
)
RETURNS DECIMAL(12,2) AS $
DECLARE
    avg_monthly_revenue DECIMAL(12,2);
    churn_rate DECIMAL(5,4);
    customer_lifespan DECIMAL(8,2);
    clv DECIMAL(12,2);
BEGIN
    -- Calculate average monthly revenue for this customer
    SELECT COALESCE(AVG(metric_value), 0) INTO avg_monthly_revenue
    FROM performance_metrics pm
    WHERE pm.entity_type = 'customer' 
    AND pm.entity_id = contact_uuid::TEXT
    AND pm.metric_type = 'revenue'
    AND pm.timestamp >= NOW() - INTERVAL '12 months';

    -- Get customer's churn probability or use industry average
    SELECT COALESCE(
        (SELECT (custom_fields->>'churn_probability')::DECIMAL(5,4) 
         FROM contacts WHERE id = contact_uuid),
        0.05
    ) INTO churn_rate;

    -- Calculate customer lifespan (1 / churn_rate)
    customer_lifespan := CASE 
        WHEN churn_rate > 0 THEN 1.0 / churn_rate
        ELSE prediction_months::DECIMAL
    END;

    -- Calculate CLV: Average Monthly Revenue × Customer Lifespan
    clv := avg_monthly_revenue * LEAST(customer_lifespan, prediction_months);

    RETURN COALESCE(clv, 0);
END;
$ LANGUAGE plpgsql;

-- Function to calculate lead score based on multiple factors
CREATE OR REPLACE FUNCTION calculate_advanced_lead_score(
    contact_uuid UUID
)
RETURNS INTEGER AS $
DECLARE
    base_score INTEGER := 0;
    email_score INTEGER := 0;
    company_score INTEGER := 0;
    engagement_score INTEGER := 0;
    behavioral_score INTEGER := 0;
    final_score INTEGER;
    contact_record RECORD;
BEGIN
    -- Get contact data
    SELECT * INTO contact_record FROM contacts WHERE id = contact_uuid;
    
    IF contact_record IS NULL THEN
        RETURN 0;
    END IF;

    -- Email domain scoring (business domains get higher scores)
    CASE 
        WHEN contact_record.email LIKE '%@gmail.com' OR contact_record.email LIKE '%@yahoo.com' 
             OR contact_record.email LIKE '%@hotmail.com' THEN
            email_score := 5;
        WHEN contact_record.email LIKE '%@%' THEN
            email_score := 15; -- Business email
        ELSE
            email_score := 0;
    END CASE;

    -- Company size scoring
    CASE 
        WHEN contact_record.custom_fields->>'company_size' = 'enterprise' THEN
            company_score := 25;
        WHEN contact_record.custom_fields->>'company_size' = 'mid-market' THEN
            company_score := 20;
        WHEN contact_record.custom_fields->>'company_size' = 'small' THEN
            company_score := 15;
        WHEN contact_record.custom_fields->>'company_size' = 'startup' THEN
            company_score := 10;
        ELSE
            company_score := 5;
    END CASE;

    -- Engagement scoring based on interactions
    engagement_score := LEAST(COALESCE(contact_record.interaction_count, 0) * 2, 30);

    -- Behavioral scoring based on recent activity
    SELECT COALESCE(COUNT(*) * 3, 0) INTO behavioral_score
    FROM analytics_events_enhanced
    WHERE user_id = contact_record.user_id
    AND custom_properties->>'contact_id' = contact_uuid::TEXT
    AND created_at >= NOW() - INTERVAL '30 days'
    AND event_type IN ('page_view', 'email_open', 'email_click', 'form_submit');

    behavioral_score := LEAST(behavioral_score, 25);

    -- Calculate final score
    final_score := email_score + company_score + engagement_score + behavioral_score;
    
    -- Cap at 100
    RETURN LEAST(final_score, 100);
END;
$ LANGUAGE plpgsql;

-- Function to predict campaign performance
CREATE OR REPLACE FUNCTION predict_campaign_performance(
    campaign_uuid UUID,
    prediction_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $
DECLARE
    campaign_record RECORD;
    historical_performance JSONB;
    predicted_metrics JSONB;
    similar_campaigns_avg RECORD;
BEGIN
    -- Get campaign data
    SELECT * INTO campaign_record FROM campaigns WHERE id = campaign_uuid;
    
    IF campaign_record IS NULL THEN
        RETURN '{"error": "Campaign not found"}'::JSONB;
    END IF;

    -- Get historical performance for similar campaigns
    SELECT 
        AVG((performance_metrics->>'open_rate')::DECIMAL) as avg_open_rate,
        AVG((performance_metrics->>'click_rate')::DECIMAL) as avg_click_rate,
        AVG((performance_metrics->>'conversion_rate')::DECIMAL) as avg_conversion_rate,
        AVG((performance_metrics->>'roi')::DECIMAL) as avg_roi
    INTO similar_campaigns_avg
    FROM campaigns
    WHERE user_id = campaign_record.user_id
    AND campaign_type = campaign_record.campaign_type
    AND status = 'completed'
    AND created_at >= NOW() - INTERVAL '6 months';

    -- Build prediction based on historical data and current campaign setup
    predicted_metrics := jsonb_build_object(
        'predicted_open_rate', COALESCE(similar_campaigns_avg.avg_open_rate, 0.25),
        'predicted_click_rate', COALESCE(similar_campaigns_avg.avg_click_rate, 0.03),
        'predicted_conversion_rate', COALESCE(similar_campaigns_avg.avg_conversion_rate, 0.02),
        'predicted_roi', COALESCE(similar_campaigns_avg.avg_roi, 2.5),
        'confidence_level', CASE 
            WHEN similar_campaigns_avg.avg_roi IS NOT NULL THEN 0.8
            ELSE 0.4
        END,
        'prediction_period_days', prediction_days,
        'predicted_revenue', campaign_record.budget_total * COALESCE(similar_campaigns_avg.avg_roi, 2.5),
        'risk_factors', CASE
            WHEN campaign_record.budget_total > 10000 THEN '["high_budget_risk"]'::JSONB
            ELSE '[]'::JSONB
        END
    );

    RETURN predicted_metrics;
END;
$ LANGUAGE plpgsql;

-- Function to generate market intelligence insights
CREATE OR REPLACE FUNCTION generate_market_insights(
    user_uuid UUID,
    industry_filter TEXT DEFAULT NULL
)
RETURNS JSONB AS $
DECLARE
    insights JSONB := '[]'::JSONB;
    competitor_analysis JSONB;
    trend_analysis JSONB;
    opportunity_analysis JSONB;
BEGIN
    -- Competitor analysis
    SELECT jsonb_agg(
        jsonb_build_object(
            'competitor', competitor,
            'intelligence_type', intelligence_type,
            'confidence_level', confidence_level,
            'key_insights', intelligence_data->'key_insights',
            'last_updated', collected_at
        )
    ) INTO competitor_analysis
    FROM market_intelligence
    WHERE user_id = user_uuid
    AND (industry_filter IS NULL OR industry = industry_filter)
    AND intelligence_type = 'competitor_analysis'
    AND expires_at > NOW()
    ORDER BY confidence_level DESC, collected_at DESC
    LIMIT 10;

    -- Trend analysis
    SELECT jsonb_agg(
        jsonb_build_object(
            'trend_name', intelligence_data->>'trend_name',
            'trend_direction', intelligence_data->>'trend_direction',
            'impact_score', intelligence_data->>'impact_score',
            'relevance_score', relevance_score,
            'actionable_insights', actionable_insights
        )
    ) INTO trend_analysis
    FROM market_intelligence
    WHERE user_id = user_uuid
    AND (industry_filter IS NULL OR industry = industry_filter)
    AND intelligence_type = 'market_trend'
    AND expires_at > NOW()
    ORDER BY relevance_score DESC
    LIMIT 5;

    -- Opportunity analysis
    SELECT jsonb_agg(
        jsonb_build_object(
            'opportunity_type', intelligence_data->>'opportunity_type',
            'potential_value', intelligence_data->>'potential_value',
            'effort_required', intelligence_data->>'effort_required',
            'time_sensitivity', intelligence_data->>'time_sensitivity',
            'recommended_actions', actionable_insights
        )
    ) INTO opportunity_analysis
    FROM market_intelligence
    WHERE user_id = user_uuid
    AND (industry_filter IS NULL OR industry = industry_filter)
    AND intelligence_type = 'market_opportunity'
    AND expires_at > NOW()
    ORDER BY (intelligence_data->>'potential_value')::DECIMAL DESC
    LIMIT 5;

    -- Combine all insights
    insights := jsonb_build_object(
        'competitor_analysis', COALESCE(competitor_analysis, '[]'::JSONB),
        'trend_analysis', COALESCE(trend_analysis, '[]'::JSONB),
        'opportunity_analysis', COALESCE(opportunity_analysis, '[]'::JSONB),
        'generated_at', NOW(),
        'industry_filter', industry_filter
    );

    RETURN insights;
END;
$ LANGUAGE plpgsql;

-- Function to calculate funnel optimization recommendations
CREATE OR REPLACE FUNCTION optimize_funnel_performance(
    funnel_uuid UUID
)
RETURNS JSONB AS $
DECLARE
    funnel_record RECORD;
    step_analysis JSONB;
    recommendations JSONB := '[]'::JSONB;
    bottleneck_step JSONB;
BEGIN
    -- Get funnel data
    SELECT * INTO funnel_record FROM sales_funnels WHERE id = funnel_uuid;
    
    IF funnel_record IS NULL THEN
        RETURN '{"error": "Funnel not found"}'::JSONB;
    END IF;

    -- Analyze each step performance
    SELECT jsonb_agg(
        jsonb_build_object(
            'step_name', step->>'name',
            'step_order', step->>'order',
            'conversion_rate', step->>'conversion_rate',
            'drop_off_rate', (100 - (step->>'conversion_rate')::DECIMAL),
            'visitors', step->>'visitors',
            'conversions', step->>'conversions'
        ) ORDER BY (step->>'order')::INTEGER
    ) INTO step_analysis
    FROM jsonb_array_elements(funnel_record.steps) AS step;

    -- Identify bottleneck (step with highest drop-off rate)
    SELECT step INTO bottleneck_step
    FROM jsonb_array_elements(step_analysis) AS step
    ORDER BY (step->>'drop_off_rate')::DECIMAL DESC
    LIMIT 1;

    -- Generate recommendations based on analysis
    IF bottleneck_step IS NOT NULL THEN
        recommendations := recommendations || jsonb_build_array(
            jsonb_build_object(
                'type', 'bottleneck_optimization',
                'priority', 'high',
                'step_name', bottleneck_step->>'step_name',
                'issue', 'High drop-off rate detected',
                'recommendation', 'Consider A/B testing different content, reducing form fields, or improving page load speed',
                'potential_impact', 'Could improve overall conversion by 15-25%'
            )
        );
    END IF;

    -- Check for low overall conversion rate
    IF funnel_record.conversion_rate < 2.0 THEN
        recommendations := recommendations || jsonb_build_array(
            jsonb_build_object(
                'type', 'overall_conversion',
                'priority', 'high',
                'issue', 'Overall conversion rate below industry average',
                'recommendation', 'Review traffic quality, value proposition clarity, and user experience',
                'potential_impact', 'Could double conversion rates with proper optimization'
            )
        );
    END IF;

    -- Check for traffic volume issues
    IF funnel_record.total_visitors < 1000 THEN
        recommendations := recommendations || jsonb_build_array(
            jsonb_build_object(
                'type', 'traffic_volume',
                'priority', 'medium',
                'issue', 'Low traffic volume may affect statistical significance',
                'recommendation', 'Increase marketing spend or improve SEO to drive more qualified traffic',
                'potential_impact', 'More data will enable better optimization decisions'
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'funnel_id', funnel_uuid,
        'funnel_name', funnel_record.name,
        'current_conversion_rate', funnel_record.conversion_rate,
        'step_analysis', step_analysis,
        'bottleneck_step', bottleneck_step,
        'recommendations', recommendations,
        'analysis_date', NOW()
    );
END;
$ LANGUAGE plpgsql;

-- Function to calculate ROI across all campaigns
CREATE OR REPLACE FUNCTION calculate_portfolio_roi(
    user_uuid UUID,
    date_range_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $
DECLARE
    total_spent DECIMAL(12,2);
    total_revenue DECIMAL(12,2);
    portfolio_roi DECIMAL(8,2);
    campaign_breakdown JSONB;
    top_performers JSONB;
    underperformers JSONB;
BEGIN
    -- Calculate totals
    SELECT 
        COALESCE(SUM(budget_spent), 0),
        COALESCE(SUM((performance_metrics->>'revenue')::DECIMAL), 0)
    INTO total_spent, total_revenue
    FROM campaigns
    WHERE user_id = user_uuid
    AND created_at >= NOW() - (date_range_days || ' days')::INTERVAL;

    -- Calculate portfolio ROI
    portfolio_roi := CASE 
        WHEN total_spent > 0 THEN ((total_revenue - total_spent) / total_spent) * 100
        ELSE 0
    END;

    -- Get campaign breakdown
    SELECT jsonb_agg(
        jsonb_build_object(
            'campaign_id', id,
            'campaign_name', name,
            'campaign_type', campaign_type,
            'spent', budget_spent,
            'revenue', (performance_metrics->>'revenue')::DECIMAL,
            'roi', CASE 
                WHEN budget_spent > 0 THEN 
                    (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100
                ELSE 0
            END,
            'status', status
        ) ORDER BY 
            CASE 
                WHEN budget_spent > 0 THEN 
                    (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100
                ELSE 0
            END DESC
    ) INTO campaign_breakdown
    FROM campaigns
    WHERE user_id = user_uuid
    AND created_at >= NOW() - (date_range_days || ' days')::INTERVAL;

    -- Get top performers (ROI > 200%)
    SELECT jsonb_agg(campaign) INTO top_performers
    FROM (
        SELECT jsonb_build_object(
            'campaign_name', name,
            'roi', CASE 
                WHEN budget_spent > 0 THEN 
                    (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100
                ELSE 0
            END,
            'revenue', (performance_metrics->>'revenue')::DECIMAL
        ) as campaign
        FROM campaigns
        WHERE user_id = user_uuid
        AND created_at >= NOW() - (date_range_days || ' days')::INTERVAL
        AND budget_spent > 0
        AND (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 > 200
        ORDER BY (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) DESC
        LIMIT 5
    ) top_campaigns;

    -- Get underperformers (ROI < 50%)
    SELECT jsonb_agg(campaign) INTO underperformers
    FROM (
        SELECT jsonb_build_object(
            'campaign_name', name,
            'roi', CASE 
                WHEN budget_spent > 0 THEN 
                    (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100
                ELSE 0
            END,
            'spent', budget_spent,
            'issues', ARRAY['low_roi', 'needs_optimization']
        ) as campaign
        FROM campaigns
        WHERE user_id = user_uuid
        AND created_at >= NOW() - (date_range_days || ' days')::INTERVAL
        AND budget_spent > 0
        AND (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 < 50
        ORDER BY (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) ASC
        LIMIT 5
    ) under_campaigns;

    RETURN jsonb_build_object(
        'portfolio_roi', portfolio_roi,
        'total_spent', total_spent,
        'total_revenue', total_revenue,
        'date_range_days', date_range_days,
        'campaign_breakdown', COALESCE(campaign_breakdown, '[]'::JSONB),
        'top_performers', COALESCE(top_performers, '[]'::JSONB),
        'underperformers', COALESCE(underperformers, '[]'::JSONB),
        'analysis_date', NOW()
    );
END;
$ LANGUAGE plpgsql;

-- Function to generate automated insights
CREATE OR REPLACE FUNCTION generate_automated_insights(
    user_uuid UUID
)
RETURNS VOID AS $
DECLARE
    insight_record RECORD;
    clv_insights JSONB;
    campaign_insights JSONB;
    funnel_insights JSONB;
BEGIN
    -- Generate CLV insights for high-value customers
    FOR insight_record IN 
        SELECT id, name, email, calculate_customer_lifetime_value(id) as clv
        FROM contacts 
        WHERE user_id = user_uuid 
        AND status = 'active'
        ORDER BY calculate_customer_lifetime_value(id) DESC 
        LIMIT 10
    LOOP
        IF insight_record.clv > 10000 THEN
            INSERT INTO customer_intelligence (
                user_id,
                contact_id,
                intelligence_type,
                data,
                confidence_score,
                source
            ) VALUES (
                user_uuid,
                insight_record.id,
                'high_value_customer',
                jsonb_build_object(
                    'customer_name', insight_record.name,
                    'customer_email', insight_record.email,
                    'predicted_clv', insight_record.clv,
                    'insight', 'This customer has high lifetime value potential. Consider VIP treatment and personalized outreach.',
                    'recommended_actions', ARRAY['assign_account_manager', 'create_custom_journey', 'priority_support']
                ),
                0.85,
                'automated_clv_analysis'
            );
        END IF;
    END LOOP;

    -- Generate campaign performance insights
    INSERT INTO customer_intelligence (
        user_id,
        intelligence_type,
        data,
        confidence_score,
        source
    )
    SELECT 
        user_uuid,
        'campaign_performance_alert',
        jsonb_build_object(
            'campaign_name', name,
            'campaign_id', id,
            'roi', (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100,
            'insight', CASE 
                WHEN (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 > 300 THEN
                    'Exceptional campaign performance detected. Consider scaling this campaign.'
                WHEN (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 < 50 THEN
                    'Poor campaign performance detected. Review and optimize immediately.'
                ELSE
                    'Campaign performing within normal range.'
            END,
            'recommended_actions', CASE 
                WHEN (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 > 300 THEN
                    ARRAY['increase_budget', 'expand_audience', 'duplicate_campaign']
                WHEN (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 < 50 THEN
                    ARRAY['pause_campaign', 'review_targeting', 'optimize_creative']
                ELSE
                    ARRAY['monitor_performance']
            END
        ),
        CASE 
            WHEN (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 > 300 THEN 0.90
            WHEN (((performance_metrics->>'revenue')::DECIMAL - budget_spent) / budget_spent) * 100 < 50 THEN 0.85
            ELSE 0.70
        END,
        'automated_campaign_analysis'
    FROM campaigns
    WHERE user_id = user_uuid
    AND status = 'active'
    AND budget_spent > 0
    AND updated_at >= NOW() - INTERVAL '24 hours';

    RAISE NOTICE 'Automated insights generated for user %', user_uuid;
END;
$ LANGUAGE plpgsql;

-- Function to clean up old data and maintain performance
CREATE OR REPLACE FUNCTION maintain_database_performance()
RETURNS VOID AS $
BEGIN
    -- Archive old analytics events (keep 1 year)
    DELETE FROM analytics_events_enhanced 
    WHERE created_at < NOW() - INTERVAL '1 year';

    -- Clean up expired predictions
    DELETE FROM predictive_analytics 
    WHERE expires_at < NOW();

    -- Clean up expired market intelligence
    DELETE FROM market_intelligence 
    WHERE expires_at < NOW();

    -- Clean up old audit logs (keep 6 months)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';

    -- Update table statistics
    ANALYZE contacts;
    ANALYZE campaigns;
    ANALYZE email_campaigns;
    ANALYZE sales_funnels;
    ANALYZE analytics_events_enhanced;
    ANALYZE customer_intelligence;

    RAISE NOTICE 'Database maintenance completed at %', NOW();
END;
$ LANGUAGE plpgsql;

-- Create scheduled job to run automated insights generation
-- This would typically be set up with pg_cron or similar
-- SELECT cron.schedule('generate-insights', '0 */6 * * *', 'SELECT generate_automated_insights(user_id) FROM auth.users;');

-- Create scheduled job for database maintenance
-- SELECT cron.schedule('db-maintenance', '0 2 * * 0', 'SELECT maintain_database_performance();');
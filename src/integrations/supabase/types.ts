export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ab_tests: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          created_by: string
          end_date: string | null
          id: string
          results_data: Json | null
          start_date: string | null
          statistical_significance: number | null
          status: string | null
          success_metrics: Json | null
          target_resource_id: string | null
          test_name: string
          test_type: string
          traffic_allocation: Json | null
          updated_at: string | null
          variants: Json
          winner_variant: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          created_by: string
          end_date?: string | null
          id?: string
          results_data?: Json | null
          start_date?: string | null
          statistical_significance?: number | null
          status?: string | null
          success_metrics?: Json | null
          target_resource_id?: string | null
          test_name: string
          test_type: string
          traffic_allocation?: Json | null
          updated_at?: string | null
          variants?: Json
          winner_variant?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          id?: string
          results_data?: Json | null
          start_date?: string | null
          statistical_significance?: number | null
          status?: string | null
          success_metrics?: Json | null
          target_resource_id?: string | null
          test_name?: string
          test_type?: string
          traffic_allocation?: Json | null
          updated_at?: string | null
          variants?: Json
          winner_variant?: string | null
        }
        Relationships: []
      }
      ai_avatars: {
        Row: {
          accent: string | null
          appearance_settings: Json | null
          avatar_type: string
          created_at: string | null
          creator_user_id: string | null
          gender: string | null
          id: string
          is_public: boolean | null
          model_file_url: string | null
          name: string
          personality_traits: Json | null
          rating: number | null
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
          voice_id: string | null
        }
        Insert: {
          accent?: string | null
          appearance_settings?: Json | null
          avatar_type: string
          created_at?: string | null
          creator_user_id?: string | null
          gender?: string | null
          id?: string
          is_public?: boolean | null
          model_file_url?: string | null
          name: string
          personality_traits?: Json | null
          rating?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
          voice_id?: string | null
        }
        Update: {
          accent?: string | null
          appearance_settings?: Json | null
          avatar_type?: string
          created_at?: string | null
          creator_user_id?: string | null
          gender?: string | null
          id?: string
          is_public?: boolean | null
          model_file_url?: string | null
          name?: string
          personality_traits?: Json | null
          rating?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
          voice_id?: string | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          canvas_data: Json | null
          created_at: string
          credits_used: number | null
          id: string
          interaction_context: Json | null
          interaction_type: string
          performance_metrics: Json | null
          prompt: string | null
          response: string | null
          user_id: string
          user_satisfaction_score: number | null
        }
        Insert: {
          canvas_data?: Json | null
          created_at?: string
          credits_used?: number | null
          id?: string
          interaction_context?: Json | null
          interaction_type: string
          performance_metrics?: Json | null
          prompt?: string | null
          response?: string | null
          user_id: string
          user_satisfaction_score?: number | null
        }
        Update: {
          canvas_data?: Json | null
          created_at?: string
          credits_used?: number | null
          id?: string
          interaction_context?: Json | null
          interaction_type?: string
          performance_metrics?: Json | null
          prompt?: string | null
          response?: string | null
          user_id?: string
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      ai_support_conversations: {
        Row: {
          confidence_score: number | null
          conversation_id: string
          conversation_metadata: Json | null
          created_at: string | null
          escalated_to_human: boolean | null
          id: string
          intent_detected: string | null
          message_content: string
          message_type: string
          resolution_time_seconds: number | null
          resolved: boolean | null
          satisfaction_rating: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          conversation_id?: string
          conversation_metadata?: Json | null
          created_at?: string | null
          escalated_to_human?: boolean | null
          id?: string
          intent_detected?: string | null
          message_content: string
          message_type: string
          resolution_time_seconds?: number | null
          resolved?: boolean | null
          satisfaction_rating?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          conversation_id?: string
          conversation_metadata?: Json | null
          created_at?: string | null
          escalated_to_human?: boolean | null
          id?: string
          intent_detected?: string | null
          message_content?: string
          message_type?: string
          resolution_time_seconds?: number | null
          resolved?: boolean | null
          satisfaction_rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          page_url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          method: string
          request_data: Json | null
          response_status: number | null
          response_time_ms: number | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          method: string
          request_data?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          method?: string
          request_data?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      automation_workflows: {
        Row: {
          actions: Json
          ai_optimization_enabled: boolean | null
          conditional_logic: Json | null
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          learning_data: Json | null
          name: string
          performance_metrics: Json | null
          status: string
          successful_runs: number
          total_runs: number
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
          webhook_endpoints: Json | null
        }
        Insert: {
          actions?: Json
          ai_optimization_enabled?: boolean | null
          conditional_logic?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          learning_data?: Json | null
          name: string
          performance_metrics?: Json | null
          status?: string
          successful_runs?: number
          total_runs?: number
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
          webhook_endpoints?: Json | null
        }
        Update: {
          actions?: Json
          ai_optimization_enabled?: boolean | null
          conditional_logic?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          learning_data?: Json | null
          name?: string
          performance_metrics?: Json | null
          status?: string
          successful_runs?: number
          total_runs?: number
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
          webhook_endpoints?: Json | null
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean | null
          stripe_event_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_data?: Json
          event_type: string
          id?: string
          processed?: boolean | null
          stripe_event_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          stripe_event_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          id: string
          last_seen: string
          presence_data: Json
          room_id: string
          session_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string
          presence_data?: Json
          room_id: string
          session_data?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string
          presence_data?: Json
          room_id?: string
          session_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      competitor_analysis: {
        Row: {
          analysis_data: Json
          analysis_type: string
          auto_update_enabled: boolean | null
          competitive_advantage_score: number | null
          competitor_domain: string | null
          competitor_name: string
          created_at: string | null
          id: string
          last_analyzed: string | null
          opportunities: Json | null
          threat_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json
          analysis_type: string
          auto_update_enabled?: boolean | null
          competitive_advantage_score?: number | null
          competitor_domain?: string | null
          competitor_name: string
          created_at?: string | null
          id?: string
          last_analyzed?: string | null
          opportunities?: Json | null
          threat_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          auto_update_enabled?: boolean | null
          competitive_advantage_score?: number | null
          competitor_domain?: string | null
          competitor_name?: string
          created_at?: string | null
          id?: string
          last_analyzed?: string | null
          opportunities?: Json | null
          threat_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          ai_generated_insights: Json | null
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          engagement_history: Json | null
          id: string
          interaction_count: number | null
          last_interaction_date: string | null
          lead_score: number | null
          lead_temperature: string | null
          name: string
          notes: string | null
          phone: string | null
          predicted_conversion_probability: number | null
          social_media_profiles: Json | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated_insights?: Json | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          engagement_history?: Json | null
          id?: string
          interaction_count?: number | null
          last_interaction_date?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          predicted_conversion_probability?: number | null
          social_media_profiles?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated_insights?: Json | null
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          engagement_history?: Json | null
          id?: string
          interaction_count?: number | null
          last_interaction_date?: string | null
          lead_score?: number | null
          lead_temperature?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          predicted_conversion_probability?: number | null
          social_media_profiles?: Json | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          created_at: string | null
          height: number | null
          id: string
          is_visible: boolean | null
          position_x: number | null
          position_y: number | null
          refresh_interval: number | null
          updated_at: string | null
          user_id: string
          widget_config: Json | null
          widget_type: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          height?: number | null
          id?: string
          is_visible?: boolean | null
          position_x?: number | null
          position_y?: number | null
          refresh_interval?: number | null
          updated_at?: string | null
          user_id: string
          widget_config?: Json | null
          widget_type: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          height?: number | null
          id?: string
          is_visible?: boolean | null
          position_x?: number | null
          position_y?: number | null
          refresh_interval?: number | null
          updated_at?: string | null
          user_id?: string
          widget_config?: Json | null
          widget_type?: string
          width?: number | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          ai_optimization_suggestions: Json | null
          content: string
          conversion_tracking: Json | null
          created_at: string
          id: string
          name: string
          roi_metrics: Json | null
          scheduled_at: string | null
          send_time_optimization: Json | null
          sent_at: string | null
          status: string | null
          subject: string
          subject_line_variants: Json | null
          target_audience_data: Json | null
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_optimization_suggestions?: Json | null
          content: string
          conversion_tracking?: Json | null
          created_at?: string
          id?: string
          name: string
          roi_metrics?: Json | null
          scheduled_at?: string | null
          send_time_optimization?: Json | null
          sent_at?: string | null
          status?: string | null
          subject: string
          subject_line_variants?: Json | null
          target_audience_data?: Json | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_optimization_suggestions?: Json | null
          content?: string
          conversion_tracking?: Json | null
          created_at?: string
          id?: string
          name?: string
          roi_metrics?: Json | null
          scheduled_at?: string | null
          send_time_optimization?: Json | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          subject_line_variants?: Json | null
          target_audience_data?: Json | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          flag_name: string
          id: string
          is_enabled: boolean | null
          rollout_percentage: number | null
          target_users: Json | null
          updated_at: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          target_users?: Json | null
          updated_at?: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          target_users?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      funnel_analytics: {
        Row: {
          browser_type: string | null
          conversion_achieved: boolean | null
          created_at: string | null
          device_type: string | null
          entry_timestamp: string | null
          exit_timestamp: string | null
          funnel_id: string
          geographic_location: Json | null
          id: string
          referrer_url: string | null
          session_id: string
          step_name: string
          step_order: number
          time_spent_seconds: number | null
          traffic_source: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          browser_type?: string | null
          conversion_achieved?: boolean | null
          created_at?: string | null
          device_type?: string | null
          entry_timestamp?: string | null
          exit_timestamp?: string | null
          funnel_id: string
          geographic_location?: Json | null
          id?: string
          referrer_url?: string | null
          session_id: string
          step_name: string
          step_order: number
          time_spent_seconds?: number | null
          traffic_source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser_type?: string | null
          conversion_achieved?: boolean | null
          created_at?: string | null
          device_type?: string | null
          entry_timestamp?: string | null
          exit_timestamp?: string | null
          funnel_id?: string
          geographic_location?: Json | null
          id?: string
          referrer_url?: string | null
          session_id?: string
          step_name?: string
          step_order?: number
          time_spent_seconds?: number | null
          traffic_source?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      funnels: {
        Row: {
          conversion_rate: number | null
          created_at: string
          description: string | null
          funnel_data: Json | null
          id: string
          name: string
          status: string | null
          total_conversions: number | null
          total_visits: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          funnel_data?: Json | null
          id?: string
          name: string
          status?: string | null
          total_conversions?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string
          description?: string | null
          funnel_data?: Json | null
          id?: string
          name?: string
          status?: string | null
          total_conversions?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config_data: Json
          created_at: string
          credentials_encrypted: string | null
          error_log: Json | null
          id: string
          integration_name: string
          integration_type: string
          last_sync_at: string | null
          status: string
          sync_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config_data?: Json
          created_at?: string
          credentials_encrypted?: string | null
          error_log?: Json | null
          id?: string
          integration_name: string
          integration_type: string
          last_sync_at?: string | null
          status?: string
          sync_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config_data?: Json
          created_at?: string
          credentials_encrypted?: string | null
          error_log?: Json | null
          id?: string
          integration_name?: string
          integration_type?: string
          last_sync_at?: string | null
          status?: string
          sync_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_scoring_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          priority_order: number | null
          rule_name: string
          rule_type: string
          score_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_order?: number | null
          rule_name: string
          rule_type: string
          score_points: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_order?: number | null
          rule_name?: string
          rule_type?: string
          score_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          additional_data: Json | null
          comparison_period_value: number | null
          created_at: string | null
          goal_achievement_percentage: number | null
          goal_value: number | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          percentage_change: number | null
          period_end: string
          period_start: string
          period_type: string
          user_id: string
        }
        Insert: {
          additional_data?: Json | null
          comparison_period_value?: number | null
          created_at?: string | null
          goal_achievement_percentage?: number | null
          goal_value?: number | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          percentage_change?: number | null
          period_end: string
          period_start: string
          period_type: string
          user_id: string
        }
        Update: {
          additional_data?: Json | null
          comparison_period_value?: number | null
          created_at?: string | null
          goal_achievement_percentage?: number | null
          goal_value?: number | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          percentage_change?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_credits_remaining: number | null
          annual_revenue: string | null
          avatar_url: string | null
          business_goals: Json | null
          company_name: string | null
          company_size: string | null
          created_at: string
          feature_usage_stats: Json | null
          full_name: string | null
          id: string
          industry: string | null
          last_active_at: string | null
          onboarded: boolean | null
          phone: string | null
          plan_type: string | null
          subscription_tier: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_credits_remaining?: number | null
          annual_revenue?: string | null
          avatar_url?: string | null
          business_goals?: Json | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          feature_usage_stats?: Json | null
          full_name?: string | null
          id?: string
          industry?: string | null
          last_active_at?: string | null
          onboarded?: boolean | null
          phone?: string | null
          plan_type?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_credits_remaining?: number | null
          annual_revenue?: string | null
          avatar_url?: string | null
          business_goals?: Json | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          feature_usage_stats?: Json | null
          full_name?: string | null
          id?: string
          industry?: string | null
          last_active_at?: string | null
          onboarded?: boolean | null
          phone?: string | null
          plan_type?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_campaigns: {
        Row: {
          campaign_data: Json | null
          created_at: string
          id: string
          message: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string
          total_clicked: number | null
          total_delivered: number | null
          total_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_data?: Json | null
          created_at?: string
          id?: string
          message: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          total_clicked?: number | null
          total_delivered?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_data?: Json | null
          created_at?: string
          id?: string
          message?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          total_clicked?: number | null
          total_delivered?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string | null
          member_user_id: string
          permissions: Json | null
          role: string
          status: string
          team_owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email?: string | null
          member_user_id: string
          permissions?: Json | null
          role?: string
          status?: string
          team_owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string | null
          member_user_id?: string
          permissions?: Json | null
          role?: string
          status?: string
          team_owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string | null
          downloads: number
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          preview_url: string | null
          price_cents: number
          rating: number | null
          tags: string[] | null
          template_data: Json
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          creator_id: string
          description?: string | null
          downloads?: number
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          preview_url?: string | null
          price_cents?: number
          rating?: number | null
          tags?: string[] | null
          template_data: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string | null
          downloads?: number
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          preview_url?: string | null
          price_cents?: number
          rating?: number | null
          tags?: string[] | null
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_behavior_logs: {
        Row: {
          ab_test_variant: string | null
          action_type: string
          browser_info: Json | null
          conversion_funnel_step: string | null
          created_at: string | null
          device_info: Json | null
          element_data: Json | null
          id: string
          interaction_duration: number | null
          ip_address: unknown | null
          page_path: string
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          ab_test_variant?: string | null
          action_type: string
          browser_info?: Json | null
          conversion_funnel_step?: string | null
          created_at?: string | null
          device_info?: Json | null
          element_data?: Json | null
          id?: string
          interaction_duration?: number | null
          ip_address?: unknown | null
          page_path: string
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          ab_test_variant?: string | null
          action_type?: string
          browser_info?: Json | null
          conversion_funnel_step?: string | null
          created_at?: string | null
          device_info?: Json | null
          element_data?: Json | null
          id?: string
          interaction_duration?: number | null
          ip_address?: unknown | null
          page_path?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_personalization: {
        Row: {
          ai_recommendations: Json | null
          behavioral_profile: Json | null
          churn_risk_score: number | null
          communication_style: string | null
          content_preferences: Json | null
          conversion_triggers: Json | null
          created_at: string | null
          engagement_score: number | null
          id: string
          last_ai_analysis: string | null
          optimal_contact_times: Json | null
          predicted_lifetime_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_recommendations?: Json | null
          behavioral_profile?: Json | null
          churn_risk_score?: number | null
          communication_style?: string | null
          content_preferences?: Json | null
          conversion_triggers?: Json | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          last_ai_analysis?: string | null
          optimal_contact_times?: Json | null
          predicted_lifetime_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_recommendations?: Json | null
          behavioral_profile?: Json | null
          churn_risk_score?: number | null
          communication_style?: string | null
          content_preferences?: Json | null
          conversion_triggers?: Json | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          last_ai_analysis?: string | null
          optimal_contact_times?: Json | null
          predicted_lifetime_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_projects: {
        Row: {
          avatar_id: string | null
          avatar_settings: Json | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          generation_metadata: Json | null
          generation_status: string | null
          id: string
          like_count: number | null
          script_content: string | null
          share_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_settings: Json | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          avatar_id?: string | null
          avatar_settings?: Json | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          generation_metadata?: Json | null
          generation_status?: string | null
          id?: string
          like_count?: number | null
          script_content?: string | null
          share_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_settings?: Json | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          avatar_id?: string | null
          avatar_settings?: Json | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          generation_metadata?: Json | null
          generation_status?: string | null
          id?: string
          like_count?: number | null
          script_content?: string | null
          share_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_settings?: Json | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      video_templates: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_range: string | null
          id: string
          is_featured: boolean | null
          name: string
          preview_video_url: string | null
          rating: number | null
          tags: string[] | null
          template_data: Json
          thumbnail_url: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_range?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          preview_video_url?: string | null
          rating?: number | null
          tags?: string[] | null
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_range?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          preview_video_url?: string | null
          rating?: number | null
          tags?: string[] | null
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      website_pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          page_content: Json | null
          page_name: string
          page_path: string
          updated_at: string
          website_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_content?: Json | null
          page_name: string
          page_path: string
          updated_at?: string
          website_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          page_content?: Json | null
          page_name?: string
          page_path?: string
          updated_at?: string
          website_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_pages_website_id_fkey"
            columns: ["website_id"]
            isOneToOne: false
            referencedRelation: "websites"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          analytics_data: Json | null
          conversions: number | null
          created_at: string
          custom_domain: string | null
          id: string
          name: string
          seo_settings: Json | null
          status: string
          template_name: string
          updated_at: string
          url_slug: string
          user_id: string
          visitors: number | null
          website_data: Json | null
        }
        Insert: {
          analytics_data?: Json | null
          conversions?: number | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          name: string
          seo_settings?: Json | null
          status?: string
          template_name: string
          updated_at?: string
          url_slug: string
          user_id: string
          visitors?: number | null
          website_data?: Json | null
        }
        Update: {
          analytics_data?: Json | null
          conversions?: number | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          name?: string
          seo_settings?: Json | null
          status?: string
          template_name?: string
          updated_at?: string
          url_slug?: string
          user_id?: string
          visitors?: number | null
          website_data?: Json | null
        }
        Relationships: []
      }
      white_label_settings: {
        Row: {
          company_name: string | null
          created_at: string
          custom_domain: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          privacy_url: string | null
          secondary_color: string | null
          support_email: string | null
          support_phone: string | null
          terms_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          privacy_url?: string | null
          secondary_color?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          privacy_url?: string | null
          secondary_color?: string | null
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

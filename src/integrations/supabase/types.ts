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
      ai_interactions: {
        Row: {
          created_at: string
          credits_used: number | null
          id: string
          interaction_type: string
          prompt: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          id?: string
          interaction_type: string
          prompt?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          id?: string
          interaction_type?: string
          prompt?: string | null
          response?: string | null
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
      automation_workflows: {
        Row: {
          actions: Json
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          status: string
          successful_runs: number
          total_runs: number
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          status?: string
          successful_runs?: number
          total_runs?: number
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          status?: string
          successful_runs?: number
          total_runs?: number
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          lead_score: number | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_score?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lead_score?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string
          user_id?: string
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
      profiles: {
        Row: {
          ai_credits_remaining: number | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarded: boolean | null
          phone: string | null
          plan_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_credits_remaining?: number | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean | null
          phone?: string | null
          plan_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_credits_remaining?: number | null
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean | null
          phone?: string | null
          plan_type?: string | null
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

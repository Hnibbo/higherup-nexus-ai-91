-- Add analytics tracking for user behavior
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add notifications system
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add team management
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  permissions JSONB DEFAULT '{}',
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, suspended
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_owner_id, member_user_id)
);

-- Add automation workflows
CREATE TABLE public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- webhook, schedule, event
  trigger_config JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, draft
  total_runs INTEGER NOT NULL DEFAULT 0,
  successful_runs INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add templates marketplace
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- funnel, email, website, landing_page
  template_data JSONB NOT NULL,
  preview_url TEXT,
  thumbnail_url TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0, -- 0 for free
  downloads INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add billing and subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'starter', -- starter, professional, agency
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, unpaid
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add white label settings
CREATE TABLE public.white_label_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#06B6D4',
  custom_domain TEXT,
  favicon_url TEXT,
  support_email TEXT,
  support_phone TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_label_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Analytics events - users can only see their own
CREATE POLICY "Users can manage their own analytics" ON public.analytics_events
FOR ALL USING (user_id = auth.uid());

-- Notifications - users can only see their own
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Team members - users can manage their own teams
CREATE POLICY "Users can manage their team members" ON public.team_members
FOR ALL USING (team_owner_id = auth.uid() OR member_user_id = auth.uid());

-- Automation workflows - users can only manage their own
CREATE POLICY "Users can manage their own workflows" ON public.automation_workflows
FOR ALL USING (user_id = auth.uid());

-- Templates - published templates are viewable by all, creators can manage their own
CREATE POLICY "Anyone can view published templates" ON public.templates
FOR SELECT USING (is_published = true);

CREATE POLICY "Creators can manage their own templates" ON public.templates
FOR ALL USING (creator_id = auth.uid());

-- Subscriptions - users can only see their own
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
FOR ALL USING (auth.role() = 'service_role');

-- White label settings - users can only manage their own
CREATE POLICY "Users can manage their own white label settings" ON public.white_label_settings
FOR ALL USING (user_id = auth.uid());

-- Add triggers for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_white_label_settings_updated_at
  BEFORE UPDATE ON public.white_label_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX idx_team_members_team_owner ON public.team_members(team_owner_id);
CREATE INDEX idx_team_members_member ON public.team_members(member_user_id);

CREATE INDEX idx_automation_workflows_user_id ON public.automation_workflows(user_id);
CREATE INDEX idx_automation_workflows_status ON public.automation_workflows(status);

CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_published ON public.templates(is_published);
CREATE INDEX idx_templates_featured ON public.templates(is_featured);
CREATE INDEX idx_templates_downloads ON public.templates(downloads);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
-- Create websites table for website builder
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url_slug TEXT NOT NULL,
  template_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  website_data JSONB DEFAULT '{}',
  custom_domain TEXT,
  analytics_data JSONB DEFAULT '{}',
  seo_settings JSONB DEFAULT '{}',
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

-- Create policies for websites
CREATE POLICY "Users can manage their own websites"
ON public.websites
FOR ALL
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_websites_updated_at
BEFORE UPDATE ON public.websites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create website_pages table for page content
CREATE TABLE IF NOT EXISTS public.website_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_content JSONB DEFAULT '{}',
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for website pages
CREATE POLICY "Users can manage pages for their websites"
ON public.website_pages
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.websites 
  WHERE websites.id = website_pages.website_id 
  AND websites.user_id = auth.uid()
));

-- Create updated_at trigger
CREATE TRIGGER update_website_pages_updated_at
BEFORE UPDATE ON public.website_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sms_campaigns table for SMS marketing
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  campaign_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS campaigns
CREATE POLICY "Users can manage their own SMS campaigns"
ON public.sms_campaigns
FOR ALL
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_sms_campaigns_updated_at
BEFORE UPDATE ON public.sms_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing routes to help redirect
INSERT INTO public.notifications (user_id, title, message, type)
SELECT id, 'Welcome to HigherUp.ai', 'Your complete business domination platform is ready!', 'success'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.notifications WHERE title = 'Welcome to HigherUp.ai');
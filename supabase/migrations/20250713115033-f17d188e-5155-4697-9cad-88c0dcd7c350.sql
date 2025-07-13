-- Insert sample data to make the app feel real and functional

-- Add sample contacts
INSERT INTO public.contacts (user_id, name, email, phone, company, lead_score, status, lead_temperature, notes) VALUES
  (
    (SELECT auth.uid()),
    'Sarah Johnson',
    'sarah.johnson@techcorp.com',
    '+1-555-0123',
    'TechCorp Industries',
    85,
    'active',
    'hot',
    'Highly engaged prospect. CEO of growing tech company.'
  ),
  (
    (SELECT auth.uid()),
    'Michael Chen',
    'mike@startupco.io',
    '+1-555-0456',
    'StartupCo',
    72,
    'active',
    'warm',
    'Interested in our enterprise package. Follow up needed.'
  ),
  (
    (SELECT auth.uid()),
    'Emma Rodriguez',
    'emma.r@digitalagency.com',
    '+1-555-0789',
    'Digital Solutions Agency',
    45,
    'active',
    'cold',
    'New lead from marketing campaign. Need to qualify.'
  ),
  (
    (SELECT auth.uid()),
    'James Wilson',
    'j.wilson@consulting.biz',
    '+1-555-0321',
    'Wilson Consulting',
    90,
    'active',
    'hot',
    'Ready to purchase. Decision maker confirmed.'
  );

-- Add sample email campaigns
INSERT INTO public.email_campaigns (user_id, name, subject, content, status, total_sent, total_opened, total_clicked) VALUES
  (
    (SELECT auth.uid()),
    'Product Launch Campaign',
    '🚀 Introducing Our Game-Changing Platform!',
    'Get ready to dominate your market with our revolutionary new features...',
    'sent',
    1250,
    387,
    156
  ),
  (
    (SELECT auth.uid()),
    'Welcome Series - Part 1',
    'Welcome to HigherUp.ai - Your Success Starts Now!',
    'Thank you for joining thousands of businesses already crushing their competition...',
    'sent',
    2100,
    945,
    234
  ),
  (
    (SELECT auth.uid()),
    'Black Friday Special',
    '💥 50% OFF Everything - Limited Time!',
    'Don not miss this exclusive opportunity to upgrade your business...',
    'draft',
    0,
    0,
    0
  );

-- Add sample funnels
INSERT INTO public.funnels (user_id, name, description, status, total_visits, total_conversions, conversion_rate) VALUES
  (
    (SELECT auth.uid()),
    'Lead Magnet Funnel',
    'High-converting lead capture funnel with free guide download',
    'active',
    5420,
    987,
    18.2
  ),
  (
    (SELECT auth.uid()),
    'Product Demo Funnel',
    'Demo request funnel for enterprise prospects',
    'active',
    2100,
    312,
    14.9
  ),
  (
    (SELECT auth.uid()),
    'Webinar Registration',
    'Automated webinar registration and follow-up sequence',
    'draft',
    0,
    0,
    0
  );

-- Add sample video projects
INSERT INTO public.video_projects (user_id, title, description, duration_seconds, view_count, like_count, generation_status) VALUES
  (
    (SELECT auth.uid()),
    'Product Demo Video',
    'AI-generated demo showcasing key features and benefits',
    120,
    1543,
    89,
    'completed'
  ),
  (
    (SELECT auth.uid()),
    'Customer Testimonial',
    'Authentic customer success story with AI avatar',
    95,
    892,
    67,
    'completed'
  ),
  (
    (SELECT auth.uid()),
    'Sales Pitch Video',
    'Personalized sales video for enterprise prospects',
    180,
    234,
    23,
    'processing'
  );

-- Add sample notifications
INSERT INTO public.notifications (user_id, title, message, type, action_url) VALUES
  (
    (SELECT auth.uid()),
    'New Hot Lead Alert! 🔥',
    'James Wilson just upgraded to a 90 lead score. Time to close this deal!',
    'success',
    '/crm'
  ),
  (
    (SELECT auth.uid()),
    'Campaign Performance Update',
    'Your Product Launch Campaign achieved 31% open rate - beating industry average!',
    'info',
    '/email-marketing'
  ),
  (
    (SELECT auth.uid()),
    'AI Credits Running Low',
    'You have 15 AI credits remaining. Upgrade now to keep dominating!',
    'warning',
    '/pricing'
  );

-- Add sample performance metrics
INSERT INTO public.performance_metrics (user_id, metric_name, metric_type, metric_value, period_start, period_end, period_type) VALUES
  (
    (SELECT auth.uid()),
    'Email Open Rate',
    'marketing',
    31.2,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'monthly'
  ),
  (
    (SELECT auth.uid()),
    'Lead Conversion Rate',
    'sales',
    18.7,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'monthly'
  ),
  (
    (SELECT auth.uid()),
    'Revenue Growth',
    'financial',
    24.5,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE,
    'monthly'
  );
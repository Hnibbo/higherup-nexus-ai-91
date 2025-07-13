import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useSampleData = () => {
  const { user } = useAuth();

  const createSampleData = async () => {
    if (!user) return;

    try {
      // Check if user already has data
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Only create sample data if user has no existing data
      if (contactsCount === 0) {
        // Add sample contacts
        await supabase.from('contacts').insert([
          {
            user_id: user.id,
            name: 'Sarah Johnson',
            email: 'sarah.johnson@techcorp.com',
            phone: '+1-555-0123',
            company: 'TechCorp Industries',
            lead_score: 85,
            status: 'active',
            lead_temperature: 'hot',
            notes: 'Highly engaged prospect. CEO of growing tech company.'
          },
          {
            user_id: user.id,
            name: 'Michael Chen',
            email: 'mike@startupco.io',
            phone: '+1-555-0456',
            company: 'StartupCo',
            lead_score: 72,
            status: 'active',
            lead_temperature: 'warm',
            notes: 'Interested in our enterprise package. Follow up needed.'
          },
          {
            user_id: user.id,
            name: 'Emma Rodriguez',
            email: 'emma.r@digitalagency.com',
            phone: '+1-555-0789',
            company: 'Digital Solutions Agency',
            lead_score: 45,
            status: 'active',
            lead_temperature: 'cold',
            notes: 'New lead from marketing campaign. Need to qualify.'
          },
          {
            user_id: user.id,
            name: 'James Wilson',
            email: 'j.wilson@consulting.biz',
            phone: '+1-555-0321',
            company: 'Wilson Consulting',
            lead_score: 90,
            status: 'active',
            lead_temperature: 'hot',
            notes: 'Ready to purchase. Decision maker confirmed.'
          }
        ]);

        // Add sample email campaigns
        await supabase.from('email_campaigns').insert([
          {
            user_id: user.id,
            name: 'Product Launch Campaign',
            subject: '🚀 Introducing Our Game-Changing Platform!',
            content: 'Get ready to dominate your market with our revolutionary new features...',
            status: 'sent',
            total_sent: 1250,
            total_opened: 387,
            total_clicked: 156
          },
          {
            user_id: user.id,
            name: 'Welcome Series - Part 1',
            subject: 'Welcome to HigherUp.ai - Your Success Starts Now!',
            content: 'Thank you for joining thousands of businesses already crushing their competition...',
            status: 'sent',
            total_sent: 2100,
            total_opened: 945,
            total_clicked: 234
          },
          {
            user_id: user.id,
            name: 'Black Friday Special',
            subject: '💥 50% OFF Everything - Limited Time!',
            content: 'Don\'t miss this exclusive opportunity to upgrade your business...',
            status: 'draft',
            total_sent: 0,
            total_opened: 0,
            total_clicked: 0
          }
        ]);

        // Add sample funnels
        await supabase.from('funnels').insert([
          {
            user_id: user.id,
            name: 'Lead Magnet Funnel',
            description: 'High-converting lead capture funnel with free guide download',
            status: 'active',
            total_visits: 5420,
            total_conversions: 987,
            conversion_rate: 18.2
          },
          {
            user_id: user.id,
            name: 'Product Demo Funnel',
            description: 'Demo request funnel for enterprise prospects',
            status: 'active',
            total_visits: 2100,
            total_conversions: 312,
            conversion_rate: 14.9
          },
          {
            user_id: user.id,
            name: 'Webinar Registration',
            description: 'Automated webinar registration and follow-up sequence',
            status: 'draft',
            total_visits: 0,
            total_conversions: 0,
            conversion_rate: 0
          }
        ]);

        // Add sample video projects
        await supabase.from('video_projects').insert([
          {
            user_id: user.id,
            title: 'Product Demo Video',
            description: 'AI-generated demo showcasing key features and benefits',
            duration_seconds: 120,
            view_count: 1543,
            like_count: 89,
            generation_status: 'completed'
          },
          {
            user_id: user.id,
            title: 'Customer Testimonial',
            description: 'Authentic customer success story with AI avatar',
            duration_seconds: 95,
            view_count: 892,
            like_count: 67,
            generation_status: 'completed'
          },
          {
            user_id: user.id,
            title: 'Sales Pitch Video',
            description: 'Personalized sales video for enterprise prospects',
            duration_seconds: 180,
            view_count: 234,
            like_count: 23,
            generation_status: 'processing'
          }
        ]);

        // Add sample notifications
        await supabase.from('notifications').insert([
          {
            user_id: user.id,
            title: 'New Hot Lead Alert! 🔥',
            message: 'James Wilson just upgraded to a 90 lead score. Time to close this deal!',
            type: 'success',
            action_url: '/crm'
          },
          {
            user_id: user.id,
            title: 'Campaign Performance Update',
            message: 'Your Product Launch Campaign achieved 31% open rate - beating industry average!',
            type: 'info',
            action_url: '/email-marketing'
          },
          {
            user_id: user.id,
            title: 'AI Credits Running Low',
            message: 'You have 15 AI credits remaining. Upgrade now to keep dominating!',
            type: 'warning',
            action_url: '/pricing'
          }
        ]);

        console.log('Sample data created successfully!');
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      createSampleData();
    }
  }, [user]);

  return null;
};
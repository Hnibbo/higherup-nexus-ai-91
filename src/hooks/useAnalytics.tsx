import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  page_url?: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const track = async (event: AnalyticsEvent) => {
    try {
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        event_type: event.event_type,
        event_data: event.event_data || {},
        page_url: event.page_url || window.location.pathname,
        user_agent: navigator.userAgent,
        ip_address: null // Will be handled by RLS policies
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const trackPageView = async (page?: string) => {
    await track({
      event_type: 'page_view',
      page_url: page || window.location.pathname,
      event_data: {
        referrer: document.referrer,
        title: document.title
      }
    });
  };

  const trackUserAction = async (action: string, data?: Record<string, any>) => {
    await track({
      event_type: 'user_action',
      event_data: {
        action,
        ...data
      }
    });
  };

  const trackConversion = async (type: string, value?: number, data?: Record<string, any>) => {
    await track({
      event_type: 'conversion',
      event_data: {
        conversion_type: type,
        value,
        ...data
      }
    });
  };

  const trackError = async (error: Error, context?: Record<string, any>) => {
    await track({
      event_type: 'error',
      event_data: {
        error_message: error.message,
        error_stack: error.stack,
        context
      }
    });
  };

  // Auto-track page views
  useEffect(() => {
    trackPageView();

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        trackPageView();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    track,
    trackPageView,
    trackUserAction,
    trackConversion,
    trackError
  };
};
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsEvent {
  event_type: string;
  event_data?: any;
  page_url?: string;
}

export const useAnalytics = () => {
  const { user } = useAuth();
  const location = useLocation();

  const trackEvent = async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: event.event_type,
        event_data: event.event_data || {},
        page_url: event.page_url || window.location.pathname,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const trackPageView = () => {
    trackEvent({
      event_type: 'page_view',
      page_url: location.pathname,
      event_data: {
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const trackClick = (element: string, data?: any) => {
    trackEvent({
      event_type: 'click',
      event_data: {
        element,
        ...data,
      },
    });
  };

  const trackFeatureUsage = (feature: string, action: string, data?: any) => {
    trackEvent({
      event_type: 'feature_usage',
      event_data: {
        feature,
        action,
        ...data,
      },
    });
  };

  const trackConversion = (type: string, value?: number, data?: any) => {
    trackEvent({
      event_type: 'conversion',
      event_data: {
        conversion_type: type,
        value,
        ...data,
      },
    });
  };

  // Track page views automatically
  useEffect(() => {
    if (user) {
      trackPageView();
    }
  }, [location.pathname, user]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackFeatureUsage,
    trackConversion,
  };
};

// Analytics Tracker Component
export const AnalyticsTracker = () => {
  useAnalytics(); // Initialize analytics tracking
  return null; // This component doesn't render anything
};
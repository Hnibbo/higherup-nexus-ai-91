import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics
    const initAnalytics = () => {
      // Google Analytics
      if (typeof window !== 'undefined') {
        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(args);
        }
        (window as any).gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID');
      }
    };

    initAnalytics();
  }, []);

  useEffect(() => {
    // Track page views
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname,
      });
    }

    // Custom analytics tracking
    console.log('Page view:', {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [location]);

  return null;
};
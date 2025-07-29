import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const BehaviorTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    const trackPageView = () => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
          page_path: location.pathname,
        });
      }
    };

    trackPageView();
  }, [location]);

  useEffect(() => {
    // Track user interactions
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        console.log('User interaction:', {
          type: event.type,
          element: target.tagName,
          text: target.textContent,
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('click', trackInteraction);
    return () => document.removeEventListener('click', trackInteraction);
  }, []);

  return null;
};
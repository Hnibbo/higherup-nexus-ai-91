import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface BehaviorEvent {
  page_path: string;
  action_type: 'click' | 'view' | 'scroll' | 'form_submit' | 'navigation' | 'hover' | 'focus' | 'video_play' | 'video_pause';
  element_data: {
    element_type?: string;
    element_id?: string;
    element_class?: string;
    element_text?: string;
    coordinates?: { x: number; y: number };
    scroll_depth?: number;
    form_field?: string;
    video_timestamp?: number;
  };
  interaction_duration?: number;
  device_info: {
    screen_width: number;
    screen_height: number;
    viewport_width: number;
    viewport_height: number;
    device_type: 'mobile' | 'tablet' | 'desktop';
    touch_support: boolean;
  };
  browser_info: {
    user_agent: string;
    browser: string;
    version: string;
    language: string;
    timezone: string;
  };
}

// Generate unique session ID
const getSessionId = () => {
  const sessionKey = 'higherup_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
};

// Detect device type
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Detect browser info
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.includes('Chrome')) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari')) {
    browser = 'Safari';
    version = ua.match(/Safari\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return {
    user_agent: ua,
    browser,
    version,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

export const BehaviorTracker = () => {
  const { user } = useAuth();
  const sessionId = getSessionId();

  const trackEvent = useCallback(async (eventData: Partial<BehaviorEvent>) => {
    if (!user) return;

    const fullEventData = {
      user_id: user.id,
      session_id: sessionId,
      page_path: window.location.pathname,
      action_type: eventData.action_type!,
      element_data: eventData.element_data || {},
      interaction_duration: eventData.interaction_duration || 0,
      device_info: {
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_type: getDeviceType(),
        touch_support: 'ontouchstart' in window
      },
      browser_info: getBrowserInfo(),
      conversion_funnel_step: eventData.page_path?.includes('funnel') ? 'funnel_view' : null,
      user_agent: navigator.userAgent,
      ip_address: null // Will be populated server-side
    };

    try {
      await supabase
        .from('user_behavior_logs')
        .insert(fullEventData);
    } catch (error) {
      console.error('Error tracking behavior:', error);
    }
  }, [user, sessionId]);

  // Track page view
  useEffect(() => {
    trackEvent({
      action_type: 'view',
      element_data: {
        element_type: 'page',
        element_text: document.title
      }
    });
  }, [trackEvent]);

  // Track clicks
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      trackEvent({
        action_type: 'click',
        element_data: {
          element_type: target.tagName.toLowerCase(),
          element_id: target.id,
          element_class: target.className,
          element_text: target.textContent?.substring(0, 100),
          coordinates: { x: event.clientX, y: event.clientY }
        }
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackEvent]);

  // Track scroll behavior
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollDepth = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        trackEvent({
          action_type: 'scroll',
          element_data: {
            element_type: 'page',
            scroll_depth: scrollDepth
          }
        });
      }, 1000); // Throttle scroll events
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [trackEvent]);

  // Track form interactions
  useEffect(() => {
    const handleFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;

      const formData = new FormData(form);
      const fields = Array.from(formData.keys());

      trackEvent({
        action_type: 'form_submit',
        element_data: {
          element_type: 'form',
          element_id: form.id,
          form_field: fields.join(', ')
        }
      });
    };

    const handleFormFocus = (event: FocusEvent) => {
      const target = event.target as HTMLInputElement;
      if (!target || !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      trackEvent({
        action_type: 'focus',
        element_data: {
          element_type: target.tagName.toLowerCase(),
          element_id: target.id,
          form_field: target.name || target.id
        }
      });
    };

    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('focusin', handleFormFocus);
    
    return () => {
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('focusin', handleFormFocus);
    };
  }, [trackEvent]);

  // Track video interactions
  useEffect(() => {
    const handleVideoPlay = (event: Event) => {
      const video = event.target as HTMLVideoElement;
      trackEvent({
        action_type: 'video_play',
        element_data: {
          element_type: 'video',
          video_timestamp: video.currentTime
        }
      });
    };

    const handleVideoPause = (event: Event) => {
      const video = event.target as HTMLVideoElement;
      trackEvent({
        action_type: 'video_pause',
        element_data: {
          element_type: 'video',
          video_timestamp: video.currentTime
        }
      });
    };

    // Add event listeners to all videos
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.addEventListener('play', handleVideoPlay);
      video.addEventListener('pause', handleVideoPause);
    });

    return () => {
      videos.forEach(video => {
        video.removeEventListener('play', handleVideoPlay);
        video.removeEventListener('pause', handleVideoPause);
      });
    };
  }, [trackEvent]);

  // Track hover events on important elements
  useEffect(() => {
    let hoverTimeout: NodeJS.Timeout;
    
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Only track hovers on buttons, links, and important elements
      if (['BUTTON', 'A'].includes(target.tagName) || 
          target.classList.contains('hover-track')) {
        
        const startTime = Date.now();
        
        const handleMouseLeave = () => {
          const hoverDuration = Date.now() - startTime;
          
          trackEvent({
            action_type: 'hover',
            element_data: {
              element_type: target.tagName.toLowerCase(),
              element_id: target.id,
              element_class: target.className,
              element_text: target.textContent?.substring(0, 50)
            },
            interaction_duration: hoverDuration
          });
          
          target.removeEventListener('mouseleave', handleMouseLeave);
        };
        
        target.addEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    return () => document.removeEventListener('mouseenter', handleMouseEnter, true);
  }, [trackEvent]);

  // Track time spent on page
  useEffect(() => {
    const startTime = Date.now();
    
    const trackPageTime = () => {
      const timeSpent = Date.now() - startTime;
      
      trackEvent({
        action_type: 'navigation',
        element_data: {
          element_type: 'page',
          element_text: document.title
        },
        interaction_duration: timeSpent
      });
    };

    // Track page time on beforeunload
    window.addEventListener('beforeunload', trackPageTime);
    
    // Also track every 30 seconds for active sessions
    const interval = setInterval(() => {
      trackPageTime();
    }, 30000);

    return () => {
      window.removeEventListener('beforeunload', trackPageTime);
      clearInterval(interval);
      trackPageTime(); // Final tracking
    };
  }, [trackEvent]);

  return null; // This is a tracking component, no UI
};

// Hook for manual event tracking
export const useBehaviorTracker = () => {
  const { user } = useAuth();
  const sessionId = getSessionId();

  const trackCustomEvent = useCallback(async (
    actionType: string,
    elementData: any = {},
    duration?: number
  ) => {
    if (!user) return;

    const eventData = {
      user_id: user.id,
      session_id: sessionId,
      page_path: window.location.pathname,
      action_type: actionType,
      element_data: elementData,
      interaction_duration: duration || 0,
      device_info: {
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_type: getDeviceType(),
        touch_support: 'ontouchstart' in window
      },
      browser_info: getBrowserInfo(),
      user_agent: navigator.userAgent
    };

    try {
      await supabase
        .from('user_behavior_logs')
        .insert(eventData);
    } catch (error) {
      console.error('Error tracking custom event:', error);
    }
  }, [user, sessionId]);

  return { trackCustomEvent };
};
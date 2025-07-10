import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

export const PerformanceMonitor = () => {
  const { track } = useAnalytics();

  useEffect(() => {
    // Monitor Core Web Vitals
    const observePerformance = () => {
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          track({
            event_type: 'performance_metric',
            event_data: {
              metric: 'LCP',
              value: entry.startTime,
              rating: entry.startTime > 4000 ? 'poor' : entry.startTime > 2500 ? 'needs-improvement' : 'good'
            }
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          track({
            event_type: 'performance_metric',
            event_data: {
              metric: 'FID',
              value: (entry as any).processingStart - entry.startTime,
              rating: (entry as any).processingStart - entry.startTime > 300 ? 'poor' : 
                     (entry as any).processingStart - entry.startTime > 100 ? 'needs-improvement' : 'good'
            }
          });
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        track({
          event_type: 'performance_metric',
          event_data: {
            metric: 'CLS',
            value: clsValue,
            rating: clsValue > 0.25 ? 'poor' : clsValue > 0.1 ? 'needs-improvement' : 'good'
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    };

    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        track({
          event_type: 'page_performance',
          event_data: {
            dns_lookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            connection: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom_processing: navigation.domComplete - navigation.domContentLoadedEventStart,
            total_load_time: navigation.loadEventEnd - navigation.fetchStart
          }
        });

        observePerformance();
      }, 0);
    });

    // Monitor JavaScript errors
    window.addEventListener('error', (event) => {
      track({
        event_type: 'javascript_error',
        event_data: {
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        }
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      track({
        event_type: 'unhandled_rejection',
        event_data: {
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        }
      });
    });

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      track({
        event_type: 'memory_usage',
        event_data: {
          used_js_heap_size: memoryInfo.usedJSHeapSize,
          total_js_heap_size: memoryInfo.totalJSHeapSize,
          js_heap_size_limit: memoryInfo.jsHeapSizeLimit
        }
      });
    }

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      track({
        event_type: 'connection_info',
        event_data: {
          effective_type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          save_data: connection.saveData
        }
      });
    }

  }, [track]);

  return null;
};
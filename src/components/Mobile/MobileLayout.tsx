import React, { useEffect, useState } from 'react';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

/**
 * Mobile Layout Component
 * 
 * Provides responsive layout optimization for mobile devices with touch gestures,
 * offline capabilities, and performance monitoring.
 */

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  enableTouchGestures?: boolean;
  enableOfflineMode?: boolean;
  showPerformanceMetrics?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  className = '',
  enableTouchGestures = true,
  enableOfflineMode = true,
  showPerformanceMetrics = false
}) => {
  const {
    device,
    isOnline,
    performanceMetrics,
    optimizeForDevice,
    enableTouchGesture,
    trackPerformance
  } = useMobileOptimization();

  const [layoutOptimized, setLayoutOptimized] = useState(false);
  const [touchGesturesEnabled, setTouchGesturesEnabled] = useState(false);

  useEffect(() => {
    if (device && !layoutOptimized) {
      optimizeLayout();
    }
  }, [device, layoutOptimized]);

  useEffect(() => {
    if (enableTouchGestures && device?.capabilities.touch && !touchGesturesEnabled) {
      setupTouchGestures();
    }
  }, [enableTouchGestures, device, touchGesturesEnabled]);

  useEffect(() => {
    if (showPerformanceMetrics) {
      startPerformanceTracking();
    }
  }, [showPerformanceMetrics]);

  const optimizeLayout = async () => {
    if (!device) return;

    try {
      await optimizeForDevice(device.id, {
        layout: document.body,
        images: Array.from(document.images),
        fonts: document.fonts,
        interactions: {}
      });
      setLayoutOptimized(true);
    } catch (error) {
      console.error('Failed to optimize layout:', error);
    }
  };

  const setupTouchGestures = async () => {
    if (!device?.capabilities.touch) return;

    try {
      // Enable swipe navigation
      await enableTouchGesture({
        type: 'swipe',
        element_selector: '.mobile-layout',
        action: 'navigate',
        parameters: { min_velocity: 0.5 }
      });

      // Enable pull-to-refresh
      await enableTouchGesture({
        type: 'swipe',
        element_selector: '.mobile-content',
        action: 'refresh',
        parameters: { min_pull_distance: 100 }
      });

      // Enable pinch-to-zoom for zoomable content
      await enableTouchGesture({
        type: 'pinch',
        element_selector: '.zoomable',
        action: 'zoom',
        parameters: { max_scale: 3.0, min_scale: 0.5 }
      });

      setTouchGesturesEnabled(true);
    } catch (error) {
      console.error('Failed to setup touch gestures:', error);
    }
  };

  const startPerformanceTracking = () => {
    if (!device) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        trackPerformance(device.id, {
          page_load_time_ms: entry.duration,
          largest_contentful_paint_ms: entry.startTime,
          cumulative_layout_shift: 0,
          first_input_delay_ms: 0,
          time_to_interactive_ms: entry.duration,
          bundle_size_kb: 0,
          cache_hit_ratio: 0.8,
          offline_usage_percent: isOnline ? 0 : 100
        });
      });
    });

    observer.observe({ entryTypes: ['navigation', 'paint'] });
  };

  const getLayoutClasses = () => {
    if (!device) return 'mobile-layout';

    const baseClasses = ['mobile-layout'];
    
    // Add device-specific classes
    baseClasses.push(`device-${device.device_type}`);
    
    // Add screen size classes
    if (device.screen_size.width < 480) {
      baseClasses.push('screen-small');
    } else if (device.screen_size.width < 768) {
      baseClasses.push('screen-medium');
    } else {
      baseClasses.push('screen-large');
    }

    // Add capability classes
    if (device.capabilities.touch) baseClasses.push('touch-enabled');
    if (device.capabilities.offline_storage) baseClasses.push('offline-capable');
    if (!isOnline) baseClasses.push('offline-mode');

    return baseClasses.join(' ');
  };

  const getLayoutStyles = () => {
    if (!device) return {};

    const styles: React.CSSProperties = {};

    // Optimize for device pixel ratio
    if (device.screen_size.pixel_ratio > 1) {
      styles.imageRendering = 'crisp-edges';
    }

    // Optimize touch targets for mobile
    if (device.capabilities.touch) {
      styles.minHeight = '44px';
      styles.touchAction = 'manipulation';
    }

    // Optimize for network speed
    if (device.performance_metrics.network_type === '2g') {
      styles.willChange = 'auto'; // Reduce animations on slow networks
    }

    return styles;
  };

  return (
    <div 
      className={`${getLayoutClasses()} ${className}`}
      style={getLayoutStyles()}
    >
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="offline-banner">
            <span className="offline-icon">📴</span>
            <span className="offline-text">You're offline</span>
            <span className="offline-status">Some features may be limited</span>
          </div>
        </div>
      )}

      {/* Performance Metrics (Development Only) */}
      {showPerformanceMetrics && performanceMetrics && (
        <div className="performance-metrics">
          <div className="metrics-panel">
            <h4>Performance Metrics</h4>
            <div className="metric">
              <span>Load Time:</span>
              <span>{performanceMetrics.page_load_time_ms}ms</span>
            </div>
            <div className="metric">
              <span>LCP:</span>
              <span>{performanceMetrics.largest_contentful_paint_ms}ms</span>
            </div>
            <div className="metric">
              <span>FID:</span>
              <span>{performanceMetrics.first_input_delay_ms}ms</span>
            </div>
            <div className="metric">
              <span>CLS:</span>
              <span>{performanceMetrics.cumulative_layout_shift}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mobile-content">
        {children}
      </div>

      {/* Touch Gesture Indicators (Development Only) */}
      {enableTouchGestures && touchGesturesEnabled && device?.capabilities.touch && (
        <div className="touch-indicators">
          <div className="gesture-hint swipe-hint">
            <span>👆 Swipe to navigate</span>
          </div>
          <div className="gesture-hint pinch-hint">
            <span>🤏 Pinch to zoom</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-layout {
          width: 100%;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        .device-phone {
          max-width: 100%;
        }

        .device-tablet {
          max-width: 768px;
          margin: 0 auto;
        }

        .device-desktop {
          max-width: 1200px;
          margin: 0 auto;
        }

        .screen-small {
          font-size: 14px;
          padding: 8px;
        }

        .screen-medium {
          font-size: 16px;
          padding: 12px;
        }

        .screen-large {
          font-size: 18px;
          padding: 16px;
        }

        .touch-enabled {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .touch-enabled * {
          min-height: 44px;
          min-width: 44px;
        }

        .offline-mode {
          filter: grayscale(0.3);
        }

        .offline-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9999;
        }

        .offline-banner {
          background: linear-gradient(135deg, #f39c12, #e67e22);
          color: white;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .offline-icon {
          font-size: 16px;
        }

        .offline-text {
          font-weight: 600;
        }

        .offline-status {
          opacity: 0.9;
          font-size: 12px;
        }

        .performance-metrics {
          position: fixed;
          top: 60px;
          right: 16px;
          z-index: 9998;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border-radius: 8px;
          padding: 12px;
          font-size: 12px;
          max-width: 200px;
        }

        .metrics-panel h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #4CAF50;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .metric span:first-child {
          color: #ccc;
        }

        .metric span:last-child {
          color: #fff;
          font-weight: 500;
        }

        .mobile-content {
          position: relative;
          z-index: 1;
        }

        .touch-indicators {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          z-index: 9997;
          pointer-events: none;
        }

        .gesture-hint {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin-bottom: 8px;
          text-align: center;
          opacity: 0.8;
          animation: fadeInOut 3s ease-in-out infinite;
        }

        .swipe-hint {
          animation-delay: 0s;
        }

        .pinch-hint {
          animation-delay: 1.5s;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        /* Responsive breakpoints */
        @media (max-width: 480px) {
          .mobile-layout {
            padding: 8px;
          }
          
          .offline-banner {
            padding: 8px 12px;
            font-size: 12px;
          }
          
          .performance-metrics {
            right: 8px;
            top: 50px;
            font-size: 10px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .mobile-layout {
            padding: 12px;
          }
        }

        @media (min-width: 769px) {
          .mobile-layout {
            padding: 16px;
          }
          
          .touch-indicators {
            display: none; /* Hide touch hints on desktop */
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .offline-banner {
            background: linear-gradient(135deg, #e67e22, #d35400);
          }
          
          .performance-metrics {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .offline-banner {
            background: #000;
            border: 2px solid #fff;
          }
          
          .performance-metrics {
            background: #000;
            border: 1px solid #fff;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .gesture-hint {
            animation: none;
            opacity: 0.6;
          }
        }

        /* Print styles */
        @media print {
          .offline-indicator,
          .performance-metrics,
          .touch-indicators {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileLayout;
import { supabase } from '@/integrations/supabase/client';

/**
 * Mobile Optimization Service
 * 
 * Provides comprehensive mobile experience optimization including responsive design,
 * touch interactions, offline functionality, and performance optimization.
 */

export interface MobileDevice {
  id: string;
  user_agent: string;
  device_type: 'phone' | 'tablet' | 'desktop';
  screen_size: {
    width: number;
    height: number;
    pixel_ratio: number;
  };
  capabilities: {
    touch: boolean;
    camera: boolean;
    gps: boolean;
    push_notifications: boolean;
    offline_storage: boolean;
    service_worker: boolean;
  };
  performance_metrics: {
    cpu_cores: number;
    memory_gb: number;
    network_type: '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';
    connection_speed: number; // Mbps
  };
  detected_at: string;
}

export interface ResponsiveBreakpoint {
  name: string;
  min_width: number;
  max_width?: number;
  layout_config: {
    columns: number;
    sidebar_position: 'left' | 'right' | 'hidden';
    navigation_style: 'horizontal' | 'vertical' | 'hamburger';
    font_scale: number;
    spacing_scale: number;
  };
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'long_press' | 'double_tap';
  element_selector: string;
  action: string;
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface OfflineCapability {
  id: string;
  feature_name: string;
  cache_strategy: 'cache_first' | 'network_first' | 'cache_only' | 'network_only';
  cache_duration_hours: number;
  sync_strategy: 'immediate' | 'background' | 'manual';
  conflict_resolution: 'client_wins' | 'server_wins' | 'merge' | 'prompt_user';
  storage_quota_mb: number;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  actions: NotificationAction[];
  data: Record<string, any>;
  scheduling: {
    send_at?: string;
    timezone?: string;
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
  };
  targeting: {
    user_segments: string[];
    device_types: string[];
    locations?: GeolocationConstraint[];
  };
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface GeolocationConstraint {
  latitude: number;
  longitude: number;
  radius_km: number;
}

export interface MobilePerformanceMetrics {
  device_id: string;
  page_load_time_ms: number;
  largest_contentful_paint_ms: number;
  cumulative_layout_shift: number;
  first_input_delay_ms: number;
  time_to_interactive_ms: number;
  bundle_size_kb: number;
  cache_hit_ratio: number;
  offline_usage_percent: number;
}

export interface DeviceFeatureUsage {
  camera_usage: number;
  gps_usage: number;
  offline_session_duration_ms: number;
  touch_gesture_frequency: Record<string, number>;
  orientation_changes: number;
}

export class MobileOptimizationService {
  private static instance: MobileOptimizationService;
  private deviceRegistry: Map<string, MobileDevice> = new Map();
  private responsiveBreakpoints: ResponsiveBreakpoint[] = [];
  private touchGestures: TouchGesture[] = [];
  private offlineCapabilities: OfflineCapability[] = [];

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): MobileOptimizationService {
    if (!MobileOptimizationService.instance) {
      MobileOptimizationService.instance = new MobileOptimizationService();
    }
    return MobileOptimizationService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('📱 Initializing Mobile Optimization Service');
      
      // Initialize responsive breakpoints
      await this.initializeResponsiveBreakpoints();
      
      // Initialize touch gestures
      await this.initializeTouchGestures();
      
      // Initialize offline capabilities
      await this.initializeOfflineCapabilities();
      
      // Start device detection
      await this.startDeviceDetection();
      
      // Initialize performance monitoring
      await this.initializePerformanceMonitoring();
      
      console.log('✅ Mobile Optimization Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Mobile Optimization Service:', error);
    }
  }

  // Device Detection and Management
  async detectDevice(userAgent: string, screenInfo: any, capabilities: any): Promise<MobileDevice> {
    try {
      console.log('🔍 Detecting mobile device');

      const device: MobileDevice = {
        id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_agent: userAgent,
        device_type: this.determineDeviceType(userAgent, screenInfo.width),
        screen_size: {
          width: screenInfo.width || 0,
          height: screenInfo.height || 0,
          pixel_ratio: screenInfo.pixelRatio || 1
        },
        capabilities: {
          touch: capabilities.touch || false,
          camera: capabilities.camera || false,
          gps: capabilities.gps || false,
          push_notifications: capabilities.pushNotifications || false,
          offline_storage: capabilities.offlineStorage || false,
          service_worker: capabilities.serviceWorker || false
        },
        performance_metrics: {
          cpu_cores: capabilities.cpuCores || 1,
          memory_gb: capabilities.memoryGB || 1,
          network_type: capabilities.networkType || 'unknown',
          connection_speed: capabilities.connectionSpeed || 0
        },
        detected_at: new Date().toISOString()
      };

      // Store device information
      this.deviceRegistry.set(device.id, device);
      await this.storeDeviceInfo(device);

      console.log(`✅ Device detected: ${device.device_type}`);
      return device;

    } catch (error) {
      console.error('❌ Failed to detect device:', error);
      throw error;
    }
  }

  private determineDeviceType(userAgent: string, screenWidth: number): 'phone' | 'tablet' | 'desktop' {
    const ua = userAgent.toLowerCase();

    // Check for mobile indicators in user agent
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      // Distinguish between phone and tablet based on screen size
      if (screenWidth >= 768) {
        return 'tablet';
      }
      return 'phone';
    }

    // Check for tablet indicators
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }

    // Default to desktop
    return 'desktop';
  }

  // Responsive Design Management
  async optimizeForDevice(deviceId: string, content: any): Promise<any> {
    try {
      console.log(`🎨 Optimizing content for device: ${deviceId}`);

      const device = this.deviceRegistry.get(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const breakpoint = this.getBreakpointForDevice(device);
      
      // Apply responsive optimizations
      const optimizedContent = {
        ...content,
        layout: this.optimizeLayout(content.layout, breakpoint, device),
        images: await this.optimizeImages(content.images, device),
        fonts: this.optimizeFonts(content.fonts, breakpoint),
        interactions: this.optimizeInteractions(content.interactions, device),
        performance: await this.optimizePerformance(content, device)
      };

      console.log(`✅ Content optimized for ${device.device_type}`);
      return optimizedContent;

    } catch (error) {
      console.error('❌ Failed to optimize content:', error);
      throw error;
    }
  }

  private getBreakpointForDevice(device: MobileDevice): ResponsiveBreakpoint {
    const screenWidth = device.screen_size.width;
    
    // Find matching breakpoint
    for (const breakpoint of this.responsiveBreakpoints) {
      if (screenWidth >= breakpoint.min_width && 
          (!breakpoint.max_width || screenWidth <= breakpoint.max_width)) {
        return breakpoint;
      }
    }

    // Default to mobile breakpoint
    return this.responsiveBreakpoints.find(bp => bp.name === 'mobile') || this.responsiveBreakpoints[0];
  }

  private optimizeLayout(layout: any, breakpoint: ResponsiveBreakpoint, device: MobileDevice): any {
    const config = breakpoint.layout_config;
    
    return {
      ...layout,
      columns: config.columns,
      sidebar_position: config.sidebar_position,
      navigation_style: config.navigation_style,
      font_size: `${16 * config.font_scale}px`,
      padding: `${16 * config.spacing_scale}px`,
      // Optimize for touch targets on mobile
      min_touch_target: device.capabilities.touch ? '44px' : '24px',
      // Adjust for device pixel ratio
      border_width: `${1 / device.screen_size.pixel_ratio}px`
    };
  }

  private async optimizeImages(images: any[], device: MobileDevice): Promise<any[]> {
    if (!images) return [];

    return images.map(image => {
      const screenWidth = device.screen_size.width;
      const pixelRatio = device.screen_size.pixel_ratio;
      
      // Calculate optimal image dimensions
      const optimalWidth = Math.min(screenWidth * pixelRatio, image.original_width);
      
      return {
        ...image,
        optimized_width: optimalWidth,
        optimized_height: Math.round((optimalWidth / (image.aspect_ratio || 1))),
        format: device.capabilities.offline_storage ? 'webp' : 'jpeg',
        quality: device.performance_metrics.network_type === '2g' ? 60 : 80,
        lazy_loading: true,
        responsive_sizes: this.generateResponsiveSizes(optimalWidth)
      };
    });
  }

  private generateResponsiveSizes(maxWidth: number): string {
    const sizes = [];
    
    // Generate sizes for different viewport widths
    if (maxWidth >= 1200) sizes.push('(min-width: 1200px) 1200px');
    if (maxWidth >= 768) sizes.push('(min-width: 768px) 768px');
    if (maxWidth >= 480) sizes.push('(min-width: 480px) 480px');
    sizes.push('100vw');
    
    return sizes.join(', ');
  }

  private optimizeFonts(fonts: any, breakpoint: ResponsiveBreakpoint): any {
    const scale = breakpoint.layout_config.font_scale;
    
    return {
      ...fonts,
      base_size: `${16 * scale}px`,
      line_height: 1.5,
      headings: {
        h1: `${32 * scale}px`,
        h2: `${24 * scale}px`,
        h3: `${20 * scale}px`,
        h4: `${18 * scale}px`,
        h5: `${16 * scale}px`,
        h6: `${14 * scale}px`
      },
      // Optimize font loading for mobile
      display: 'swap',
      preload: true
    };
  }

  private optimizeInteractions(interactions: any, device: MobileDevice): any {
    if (!device.capabilities.touch) {
      return interactions;
    }

    return {
      ...interactions,
      touch_enabled: true,
      hover_disabled: true, // Disable hover effects on touch devices
      tap_highlight: 'none',
      user_select: 'none',
      momentum_scrolling: true,
      // Add touch-specific interactions
      swipe_navigation: true,
      pull_to_refresh: true,
      pinch_to_zoom: false // Usually disabled for better UX
    };
  }

  private async optimizePerformance(content: any, device: MobileDevice): Promise<any> {
    const networkSpeed = device.performance_metrics.connection_speed;
    const memoryGB = device.performance_metrics.memory_gb;
    
    return {
      // Adjust based on network speed
      preload_strategy: networkSpeed > 10 ? 'aggressive' : 'conservative',
      image_loading: networkSpeed > 5 ? 'eager' : 'lazy',
      
      // Adjust based on device memory
      cache_size_mb: Math.min(memoryGB * 50, 200),
      max_concurrent_requests: memoryGB > 2 ? 6 : 3,
      
      // Code splitting optimizations
      code_splitting: true,
      tree_shaking: true,
      compression: 'gzip',
      
      // Service worker optimizations
      offline_first: device.capabilities.service_worker,
      background_sync: device.capabilities.service_worker
    };
  }

  // Touch Gesture Management
  async registerTouchGesture(gesture: Omit<TouchGesture, 'enabled'>): Promise<TouchGesture> {
    try {
      console.log(`👆 Registering touch gesture: ${gesture.type}`);

      const touchGesture: TouchGesture = {
        ...gesture,
        enabled: true
      };

      this.touchGestures.push(touchGesture);
      await this.storeTouchGesture(touchGesture);

      console.log(`✅ Touch gesture registered: ${gesture.type}`);
      return touchGesture;

    } catch (error) {
      console.error('❌ Failed to register touch gesture:', error);
      throw error;
    }
  }

  async handleTouchGesture(gestureType: string, gestureData: any): Promise<void> {
    try {
      console.log(`👆 Handling touch gesture: ${gestureType}`);

      const gesture = this.touchGestures.find(g => 
        g.type === gestureType && 
        g.enabled
      );

      if (!gesture) {
        console.warn(`No handler found for gesture: ${gestureType}`);
        return;
      }

      // Execute gesture action
      await this.executeTouchAction(gesture, gestureData);

      console.log(`✅ Touch gesture handled: ${gestureType}`);

    } catch (error) {
      console.error('❌ Failed to handle touch gesture:', error);
      throw error;
    }
  }

  private async executeTouchAction(gesture: TouchGesture, gestureData: any): Promise<void> {
    switch (gesture.action) {
      case 'navigate':
        await this.handleNavigationGesture(gesture.parameters, gestureData);
        break;
      case 'scroll':
        await this.handleScrollGesture(gesture.parameters, gestureData);
        break;
      case 'zoom':
        await this.handleZoomGesture(gesture.parameters, gestureData);
        break;
      case 'refresh':
        await this.handleRefreshGesture(gesture.parameters, gestureData);
        break;
      case 'custom':
        await this.handleCustomGesture(gesture.parameters, gestureData);
        break;
      default:
        console.warn(`Unknown gesture action: ${gesture.action}`);
    }
  }

  private async handleNavigationGesture(parameters: any, gestureData: any): Promise<void> {
    const direction = gestureData.direction;
    const velocity = gestureData.velocity;
    
    if (velocity > parameters.min_velocity) {
      switch (direction) {
        case 'left':
          // Navigate forward
          console.log('🔄 Navigating forward');
          break;
        case 'right':
          // Navigate back
          console.log('🔄 Navigating back');
          break;
      }
    }
  }

  private async handleScrollGesture(parameters: any, gestureData: any): Promise<void> {
    const deltaY = gestureData.deltaY;
    const element = document.querySelector(parameters.target_selector);
    
    if (element) {
      element.scrollBy({
        top: deltaY * parameters.scroll_multiplier,
        behavior: 'smooth'
      });
    }
  }

  private async handleZoomGesture(parameters: any, gestureData: any): Promise<void> {
    const scale = gestureData.scale;
    const element = document.querySelector(parameters.target_selector);
    
    if (element && scale !== 1) {
      const currentScale = parseFloat(element.style.transform.match(/scale\(([^)]+)\)/)?.[1] || '1');
      const newScale = Math.max(0.5, Math.min(3, currentScale * scale));
      element.style.transform = `scale(${newScale})`;
    }
  }

  private async handleRefreshGesture(parameters: any, gestureData: any): Promise<void> {
    const pullDistance = gestureData.pullDistance;
    
    if (pullDistance > parameters.min_pull_distance) {
      // Trigger refresh action
      window.location.reload();
    }
  }

  private async handleCustomGesture(parameters: any, gestureData: any): Promise<void> {
    // Execute custom callback if provided
    if (parameters.callback && typeof parameters.callback === 'function') {
      parameters.callback(gestureData);
    }
  }

  // Offline Capabilities
  async enableOfflineCapability(capability: Omit<OfflineCapability, 'id'>): Promise<OfflineCapability> {
    try {
      console.log(`📴 Enabling offline capability: ${capability.feature_name}`);

      const offlineCapability: OfflineCapability = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...capability
      };

      this.offlineCapabilities.push(offlineCapability);
      await this.storeOfflineCapability(offlineCapability);

      // Configure service worker for this capability
      await this.configureServiceWorker(offlineCapability);

      console.log(`✅ Offline capability enabled: ${capability.feature_name}`);
      return offlineCapability;

    } catch (error) {
      console.error('❌ Failed to enable offline capability:', error);
      throw error;
    }
  }

  private async configureServiceWorker(capability: OfflineCapability): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send configuration to service worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'CONFIGURE_CACHE',
          capability: capability
        });
      }

      console.log(`✅ Service worker configured for: ${capability.feature_name}`);
    } catch (error) {
      console.error('Failed to configure service worker:', error);
    }
  }

  async syncOfflineData(): Promise<void> {
    try {
      console.log('🔄 Syncing offline data');

      if (!navigator.onLine) {
        console.log('📴 Device is offline, skipping sync');
        return;
      }

      // Get offline data from local storage
      const offlineData = await this.getOfflineData();
      
      for (const [key, data] of Object.entries(offlineData)) {
        try {
          await this.syncDataItem(key, data);
          await this.removeOfflineData(key);
        } catch (error) {
          console.error(`Failed to sync data item: ${key}`, error);
        }
      }

      console.log('✅ Offline data sync completed');

    } catch (error) {
      console.error('❌ Failed to sync offline data:', error);
      throw error;
    }
  }

  private async getOfflineData(): Promise<Record<string, any>> {
    try {
      const keys = this.getOfflineDataKeys();
      const data: Record<string, any> = {};
      
      for (const key of keys) {
        const item = localStorage.getItem(key);
        if (item) {
          data[key] = JSON.parse(item);
        }
      }
      
      return data;

    } catch (error) {
      console.error('Error getting offline data:', error);
      return {};
    }
  }

  private getOfflineDataKeys(): string[] {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('offline_')) {
        keys.push(key);
      }
    }
    return keys;
  }

  private async syncDataItem(key: string, data: any): Promise<void> {
    // Sync individual data item to server
    const { error } = await supabase
      .from('offline_sync_queue')
      .upsert({
        key: key,
        data: data,
        synced_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }
  }

  private async removeOfflineData(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  // Push Notifications
  async sendPushNotification(notification: Omit<PushNotification, 'id'>): Promise<PushNotification> {
    try {
      console.log(`🔔 Sending push notification: ${notification.title}`);

      const pushNotification: PushNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification
      };

      await this.storePushNotification(pushNotification);

      // Send to targeted devices
      await this.deliverPushNotification(pushNotification);

      console.log(`✅ Push notification sent: ${pushNotification.title}`);
      return pushNotification;

    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      throw error;
    }
  }

  private async deliverPushNotification(notification: PushNotification): Promise<void> {
    const targetDevices = this.getTargetDevices(notification.targeting);
    
    for (const device of targetDevices) {
      try {
        await this.sendToDevice(device, notification);
      } catch (error) {
        console.error(`Failed to send notification to device: ${device.id}`, error);
      }
    }
  }

  private getTargetDevices(targeting: PushNotification['targeting']): MobileDevice[] {
    // Filter devices based on targeting criteria
    const allDevices = Array.from(this.deviceRegistry.values());
    
    return allDevices.filter(device => {
      // Check device type
      if (targeting.device_types.length > 0 && !targeting.device_types.includes(device.device_type)) {
        return false;
      }
      
      // Check push notification capability
      if (!device.capabilities.push_notifications) {
        return false;
      }
      
      // Additional filtering logic would go here
      return true;
    });
  }

  private async sendToDevice(device: MobileDevice, notification: PushNotification): Promise<void> {
    // Simulate sending notification to device
    console.log(`📱 Sending notification to device: ${device.id}`);
    
    // Simulate notification delivery
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Performance Monitoring
  async trackMobilePerformance(deviceId: string, metrics: Omit<MobilePerformanceMetrics, 'device_id'>): Promise<void> {
    try {
      console.log(`📊 Tracking mobile performance for device: ${deviceId}`);

      const performanceMetrics: MobilePerformanceMetrics = {
        device_id: deviceId,
        ...metrics,
        recorded_at: new Date().toISOString()
      } as any;

      await this.storePerformanceMetrics(performanceMetrics);

      // Analyze performance and provide recommendations
      const recommendations = this.analyzePerformance(performanceMetrics);
      if (recommendations.length > 0) {
        console.log('💡 Performance recommendations:', recommendations);
      }

    } catch (error) {
      console.error('❌ Failed to track mobile performance:', error);
      throw error;
    }
  }

  private analyzePerformance(metrics: MobilePerformanceMetrics): string[] {
    const recommendations = [];

    if (metrics.page_load_time_ms && metrics.page_load_time_ms > 3000) {
      recommendations.push('Page load time is slow. Consider optimizing images and reducing bundle size.');
    }

    if (metrics.largest_contentful_paint_ms && metrics.largest_contentful_paint_ms > 2500) {
      recommendations.push('Largest Contentful Paint is slow. Optimize critical rendering path.');
    }

    if (metrics.cumulative_layout_shift && metrics.cumulative_layout_shift > 0.1) {
      recommendations.push('High Cumulative Layout Shift detected. Ensure proper image dimensions.');
    }

    if (metrics.first_input_delay_ms && metrics.first_input_delay_ms > 100) {
      recommendations.push('First Input Delay is high. Reduce JavaScript execution time.');
    }

    if (metrics.cache_hit_ratio && metrics.cache_hit_ratio < 0.8) {
      recommendations.push('Low cache hit ratio. Improve caching strategy.');
    }

    return recommendations;
  }

  // Initialization Methods
  private async initializeResponsiveBreakpoints(): Promise<void> {
    this.responsiveBreakpoints = [
      {
        name: 'mobile',
        min_width: 0,
        max_width: 767,
        layout_config: {
          columns: 1,
          sidebar_position: 'hidden',
          navigation_style: 'hamburger',
          font_scale: 0.9,
          spacing_scale: 0.8
        }
      },
      {
        name: 'tablet',
        min_width: 768,
        max_width: 1023,
        layout_config: {
          columns: 2,
          sidebar_position: 'hidden',
          navigation_style: 'horizontal',
          font_scale: 1.0,
          spacing_scale: 0.9
        }
      },
      {
        name: 'desktop',
        min_width: 1024,
        layout_config: {
          columns: 3,
          sidebar_position: 'left',
          navigation_style: 'horizontal',
          font_scale: 1.0,
          spacing_scale: 1.0
        }
      }
    ];

    console.log(`📐 Initialized ${this.responsiveBreakpoints.length} responsive breakpoints`);
  }

  private async initializeTouchGestures(): Promise<void> {
    // Initialize common touch gestures
    const commonGestures = [
      {
        type: 'swipe' as const,
        element_selector: '.swipeable',
        action: 'navigate',
        parameters: { min_velocity: 0.5 }
      },
      {
        type: 'pinch' as const,
        element_selector: '.zoomable',
        action: 'zoom',
        parameters: { max_scale: 3.0 }
      },
      {
        type: 'long_press' as const,
        element_selector: '.context-menu',
        action: 'custom',
        parameters: { duration_ms: 500 }
      }
    ];

    for (const gesture of commonGestures) {
      await this.registerTouchGesture(gesture);
    }

    console.log(`👆 Initialized ${this.touchGestures.length} touch gestures`);
  }

  private async initializeOfflineCapabilities(): Promise<void> {
    // Initialize common offline capabilities
    const commonCapabilities: Omit<OfflineCapability, 'id'>[] = [
      {
        feature_name: 'Static Assets',
        cache_strategy: 'cache_first',
        cache_duration_hours: 24,
        sync_strategy: 'background',
        conflict_resolution: 'server_wins',
        storage_quota_mb: 50
      },
      {
        feature_name: 'API Responses',
        cache_strategy: 'network_first',
        cache_duration_hours: 1,
        sync_strategy: 'immediate',
        conflict_resolution: 'client_wins',
        storage_quota_mb: 20
      },
      {
        feature_name: 'User Data',
        cache_strategy: 'cache_first',
        cache_duration_hours: 168, // 1 week
        sync_strategy: 'manual',
        conflict_resolution: 'prompt_user',
        storage_quota_mb: 100
      }
    ];

    for (const capability of commonCapabilities) {
      const offlineCapability: OfflineCapability = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...capability
      };
      this.offlineCapabilities.push(offlineCapability);
    }

    console.log(`📴 Initialized ${this.offlineCapabilities.length} offline capabilities`);
  }

  private async startDeviceDetection(): Promise<void> {
    console.log('🔍 Starting device detection');
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange();
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      this.handleNetworkStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkStatusChange(false);
    });
  }

  private handleOrientationChange(): void {
    console.log('📱 Device orientation changed');
    // Update layout based on new orientation
    setTimeout(() => {
      const screenInfo = {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1
      };
      
      // Re-optimize layout for new dimensions
      this.updateLayoutForOrientation(screenInfo);
    }, 100);
  }

  private handleNetworkStatusChange(isOnline: boolean): void {
    console.log(`🌐 Network status changed: ${isOnline ? 'online' : 'offline'}`);
  
    if (isOnline) {
      // Sync offline data when coming back online
      this.syncOfflineData();
    } else {
      // Enable offline mode
      this.enableOfflineMode();
    }
  }

  private updateLayoutForOrientation(screenInfo: any): void {
    // Re-optimize current layout based on new screen dimensions
    const currentDevice = Array.from(this.deviceRegistry.values())[0]; // Get first device for demo
    if (currentDevice) {
      currentDevice.screen_size = {
        width: screenInfo.width,
        height: screenInfo.height,
        pixel_ratio: screenInfo.pixelRatio
      };
      
      // Trigger layout re-optimization
      // This would typically trigger a re-render of the current page
    }
  }

  private enableOfflineMode(): void {
    console.log('📴 Enabling offline mode');
    document.body.classList.add('offline-mode');
    
    // Show offline indicator
    this.showOfflineIndicator();
  }

  private showOfflineIndicator(): void {
    const indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.textContent = 'You are currently offline';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f39c12;
      color: white;
      text-align: center;
      padding: 8px;
      z-index: 9999;
      font-size: 14px;
    `;
    
    document.body.appendChild(indicator);
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    console.log('📊 Initializing performance monitoring');
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor device performance
    this.monitorDevicePerformance();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
  }

  private monitorCoreWebVitals(): void {
    // Monitor Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Monitor Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log('CLS:', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private monitorDevicePerformance(): void {
    // Monitor memory usage
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      console.log('Memory usage:', {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit
      });
    }

    // Monitor frame rate
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        console.log('FPS:', fps);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private monitorNetworkPerformance(): void {
    // Monitor network connection
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      console.log('Network info:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });

      connection.addEventListener('change', () => {
        console.log('Network changed:', connection.effectiveType);
      });
    }
  }

  // Database Operations
  private async storeDeviceInfo(device: MobileDevice): Promise<void> {
    try {
      const { error } = await supabase
        .from('mobile_devices')
        .upsert({
          id: device.id,
          user_agent: device.user_agent,
          device_type: device.device_type,
          screen_size: device.screen_size,
          capabilities: device.capabilities,
          performance_metrics: device.performance_metrics,
          detected_at: device.detected_at
        });

      if (error) {
        console.warn('Could not store device info:', error);
      }
    } catch (error) {
      console.warn('Error storing device info:', error);
    }
  }

  private async storeTouchGesture(gesture: TouchGesture): Promise<void> {
    try {
      const { error } = await supabase
        .from('touch_gestures')
        .upsert({
          type: gesture.type,
          element_selector: gesture.element_selector,
          action: gesture.action,
          parameters: gesture.parameters,
          enabled: gesture.enabled
        });

      if (error) {
        console.warn('Could not store touch gesture:', error);
      }
    } catch (error) {
      console.warn('Error storing touch gesture:', error);
    }
  }

  private async storeOfflineCapability(capability: OfflineCapability): Promise<void> {
    try {
      const { error } = await supabase
        .from('offline_capabilities')
        .upsert({
          id: capability.id,
          feature_name: capability.feature_name,
          cache_strategy: capability.cache_strategy,
          cache_duration_hours: capability.cache_duration_hours,
          sync_strategy: capability.sync_strategy,
          conflict_resolution: capability.conflict_resolution,
          storage_quota_mb: capability.storage_quota_mb
        });

      if (error) {
        console.warn('Could not store offline capability:', error);
      }
    } catch (error) {
      console.warn('Error storing offline capability:', error);
    }
  }

  private async storePushNotification(notification: PushNotification): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_notifications')
        .upsert({
          id: notification.id,
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          badge: notification.badge,
          image: notification.image,
          actions: notification.actions,
          data: notification.data,
          scheduling: notification.scheduling,
          targeting: notification.targeting
        });

      if (error) {
        console.warn('Could not store push notification:', error);
      }
    } catch (error) {
      console.warn('Error storing push notification:', error);
    }
  }

  private async storePerformanceMetrics(metrics: MobilePerformanceMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('mobile_performance_metrics')
        .upsert({
          device_id: metrics.device_id,
          page_load_time_ms: metrics.page_load_time_ms,
          largest_contentful_paint_ms: metrics.largest_contentful_paint_ms,
          cumulative_layout_shift: metrics.cumulative_layout_shift,
          first_input_delay_ms: metrics.first_input_delay_ms,
          time_to_interactive_ms: metrics.time_to_interactive_ms,
          bundle_size_kb: metrics.bundle_size_kb,
          cache_hit_ratio: metrics.cache_hit_ratio,
          offline_usage_percent: metrics.offline_usage_percent,
          recorded_at: (metrics as any).recorded_at
        });

      if (error) {
        console.warn('Could not store performance metrics:', error);
      }
    } catch (error) {
      console.warn('Error storing performance metrics:', error);
    }
  }

  // Public API Methods
  async getMobileDevices(): Promise<MobileDevice[]> {
    try {
      const { data, error } = await supabase
        .from('mobile_devices')
        .select('*')
        .order('detected_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch mobile devices:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error fetching mobile devices:', error);
      return [];
    }
  }

  async getPerformanceMetrics(deviceId?: string): Promise<MobilePerformanceMetrics[]> {
    try {
      let query = supabase
        .from('mobile_performance_metrics')
        .select('*');

      if (deviceId) {
        query = query.eq('device_id', deviceId);
      }

      const { data, error } = await query
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Could not fetch performance metrics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error fetching performance metrics:', error);
      return [];
    }
  }

  async optimizeForCurrentDevice(): Promise<void> {
    try {
      // Detect current device
      const userAgent = navigator.userAgent;
      const screenInfo = {
        width: window.screen.width,
        height: window.screen.height,
        pixelRatio: window.devicePixelRatio || 1
      };
      
      const capabilities = {
        touch: 'ontouchstart' in window,
        camera: 'mediaDevices' in navigator,
        gps: 'geolocation' in navigator,
        pushNotifications: 'Notification' in window,
        offlineStorage: 'localStorage' in window,
        serviceWorker: 'serviceWorker' in navigator
      };

      const device = await this.detectDevice(userAgent, screenInfo, capabilities);
      
      // Apply optimizations
      await this.optimizeForDevice(device.id, {
        layout: document.body,
        images: Array.from(document.images),
        fonts: document.fonts,
        interactions: {}
      });

    } catch (error) {
      console.error('Failed to optimize for current device:', error);
    }
  }

  async enablePushNotifications(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';

    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      return false;
    }
  }

  async installPWA(): Promise<boolean> {
    try {
      // Check if PWA can be installed
      if ('beforeinstallprompt' in window) {
        const event = (window as any).deferredPrompt;
        if (event) {
          event.prompt();
          const result = await event.userChoice;
          return result.outcome === 'accepted';
        }
      }
      return false;

    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }
}

export default MobileOptimizationService;


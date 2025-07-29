/**
 * Advanced Progressive Web App Service
 * Comprehensive PWA functionality with offline capabilities, push notifications,
 * background sync, and native-like features
 */
import { productionDatabaseService } from '@/services/database/ProductionDatabaseService';
import { redisCacheService } from '@/services/database/RedisCache';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  startUrl: string;
  scope: string;
  icons: PWAIcon[];
  categories: string[];
  shortcuts: PWAShortcut[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PWAShortcut {
  name: string;
  shortName?: string;
  description?: string;
  url: string;
  icons?: PWAIcon[];
}

export interface OfflineResource {
  id: string;
  url: string;
  type: 'page' | 'api' | 'asset' | 'data';
  priority: 'high' | 'medium' | 'low';
  strategy: 'cache_first' | 'network_first' | 'stale_while_revalidate' | 'network_only' | 'cache_only';
  maxAge: number; // in seconds
  version: string;
  size: number;
  lastUpdated: Date;
  metadata: Record<string, any>;
}

export interface SyncTask {
  id: string;
  type: 'data_sync' | 'file_upload' | 'api_call' | 'notification' | 'custom';
  action: string;
  payload: any;
  priority: 'high' | 'medium' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
  lastAttempt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  metadata: Record<string, any>;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: {
    marketing: boolean;
    updates: boolean;
    alerts: boolean;
    reminders: boolean;
    social: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface PWAInstallPrompt {
  id: string;
  userId?: string;
  platform: string;
  userAgent: string;
  timestamp: Date;
  action: 'shown' | 'accepted' | 'dismissed' | 'cancelled';
  source: 'automatic' | 'manual' | 'banner';
  metadata: Record<string, any>;
}

export interface DeviceCapabilities {
  online: boolean;
  storage: {
    quota: number;
    usage: number;
    available: number;
  };
  permissions: {
    notifications: 'granted' | 'denied' | 'default';
    camera: 'granted' | 'denied' | 'default';
    microphone: 'granted' | 'denied' | 'default';
    geolocation: 'granted' | 'denied' | 'default';
  };
  features: {
    serviceWorker: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
    webShare: boolean;
    deviceMotion: boolean;
    vibration: boolean;
    fullscreen: boolean;
  };
  network: {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

/**
 * Advanced Progressive Web App Service
 */
export class AdvancedPWAService {
  private static instance: AdvancedPWAService;
  private serviceWorker: ServiceWorkerRegistration | null = null;
  private offlineResources: Map<string, OfflineResource> = new Map();
  private syncTasks: Map<string, SyncTask> = new Map();
  private pushSubscriptions: Map<string, PushSubscription> = new Map();
  private installPrompts: PWAInstallPrompt[] = [];
  private deviceCapabilities: DeviceCapabilities | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  private constructor() {
    this.initializePWAService();
  }

  public static getInstance(): AdvancedPWAService {
    if (!AdvancedPWAService.instance) {
      AdvancedPWAService.instance = new AdvancedPWAService();
    }
    return AdvancedPWAService.instance;
  }

  private async initializePWAService(): Promise<void> {
    console.log('📱 Initializing Advanced PWA Service');
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Initialize offline capabilities
    await this.initializeOfflineCapabilities();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Initialize push notifications
    await this.initializePushNotifications();
    
    // Setup background sync
    await this.setupBackgroundSync();
    
    // Detect device capabilities
    await this.detectDeviceCapabilities();
    
    // Setup install prompt handling
    this.setupInstallPromptHandling();
    
    console.log('✅ Advanced PWA Service initialized');
  }

  /**
   * Register and manage service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return null;
      }

      console.log('🔧 Registering service worker');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.handleServiceWorkerUpdate(registration);
            }
          });
        }
      });

      this.serviceWorker = registration;
      console.log('✅ Service worker registered');
      return registration;
    } catch (error) {
      console.error('❌ Failed to register service worker:', error);
      return null;
    }
  }

  /**
   * Initialize offline capabilities
   */
  async initializeOfflineCapabilities(): Promise<void> {
    try {
      console.log('💾 Initializing offline capabilities');
      
      // Load offline resources configuration
      await this.loadOfflineResources();
      
      // Pre-cache critical resources
      await this.preCacheCriticalResources();
      
      // Setup cache strategies
      await this.setupCacheStrategies();
      
      console.log('✅ Offline capabilities initialized');
    } catch (error) {
      console.error('❌ Failed to initialize offline capabilities:', error);
    }
  }

  /**
   * Cache critical resources for offline use
   */
  async preCacheCriticalResources(): Promise<void> {
    try {
      if (!this.serviceWorker) return;

      console.log('📦 Pre-caching critical resources');
      
      const criticalResources = [
        '/',
        '/dashboard',
        '/offline',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
        // Add critical CSS and JS files
        '/static/css/main.css',
        '/static/js/main.js'
      ];

      // Send cache list to service worker
      if (this.serviceWorker.active) {
        this.serviceWorker.active.postMessage({
          type: 'PRECACHE_RESOURCES',
          resources: criticalResources
        });
      }

      // Store in offline resources map
      criticalResources.forEach((url, index) => {
        const resource: OfflineResource = {
          id: `critical_${index}`,
          url,
          type: url.includes('/api/') ? 'api' : 
                url.includes('.') ? 'asset' : 'page',
          priority: 'high',
          strategy: 'cache_first',
          maxAge: 86400, // 24 hours
          version: '1.0',
          size: 0,
          lastUpdated: new Date(),
          metadata: { critical: true }
        };
        this.offlineResources.set(resource.id, resource);
      });

      console.log(`✅ Pre-cached ${criticalResources.length} critical resources`);
    } catch (error) {
      console.error('❌ Failed to pre-cache resources:', error);
    }
  }

  /**
   * Setup cache strategies for different resource types
   */
  async setupCacheStrategies(): Promise<void> {
    if (!this.serviceWorker?.active) return;

    const strategies = {
      pages: 'network_first',
      api: 'network_first',
      assets: 'cache_first',
      images: 'cache_first',
      fonts: 'cache_first'
    };

    this.serviceWorker.active.postMessage({
      type: 'SETUP_CACHE_STRATEGIES',
      strategies
    });
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring(): void {
    console.log('🌐 Setting up network monitoring');
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🟢 Network connection restored');
      this.isOnline = true;
      this.handleNetworkRestore();
    });

    window.addEventListener('offline', () => {
      console.log('🔴 Network connection lost');
      this.isOnline = false;
      this.handleNetworkLoss();
    });

    // Monitor network quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.handleNetworkChange(connection);
      });
    }
  }

  /**
   * Initialize push notifications
   */
  async initializePushNotifications(): Promise<void> {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Push notifications not supported');
        return;
      }

      console.log('🔔 Initializing push notifications');
      
      // Load existing subscriptions
      await this.loadPushSubscriptions();
      
      console.log('✅ Push notifications initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  /**
   * Request push notification permission and subscribe
   */
  async subscribeToPushNotifications(userId: string, preferences?: NotificationPreferences): Promise<PushSubscription | null> {
    try {
      if (!this.serviceWorker) {
        throw new Error('Service worker not available');
      }

      console.log('🔔 Subscribing to push notifications');
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push service
      const subscription = await this.serviceWorker.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY || '')
      });

      // Create subscription record
      const pushSub: PushSubscription = {
        id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        userAgent: navigator.userAgent,
        isActive: true,
        createdAt: new Date(),
        preferences: preferences || this.getDefaultNotificationPreferences()
      };

      // Store subscription
      this.pushSubscriptions.set(pushSub.id, pushSub);
      await this.storePushSubscription(pushSub);

      console.log('✅ Push notification subscription created');
      return pushSub;
    } catch (error) {
      console.error('❌ Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(subscriptionId: string, notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  }): Promise<boolean> {
    try {
      const subscription = this.pushSubscriptions.get(subscriptionId);
      if (!subscription || !subscription.isActive) {
        throw new Error('Invalid or inactive subscription');
      }

      console.log(`🔔 Sending push notification to ${subscription.userId}`);
      
      // In a real implementation, this would send to a push service
      // For now, we'll simulate the notification
      if ('serviceWorker' in navigator && this.serviceWorker) {
        this.serviceWorker.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          notification
        });
      }

      // Update last used timestamp
      subscription.lastUsed = new Date();
      await this.updatePushSubscription(subscription);

      console.log('✅ Push notification sent');
      return true;
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Setup background sync
   */
  async setupBackgroundSync(): Promise<void> {
    try {
      if (!this.serviceWorker || !('sync' in window.ServiceWorkerRegistration.prototype)) {
        console.warn('Background sync not supported');
        return;
      }

      console.log('🔄 Setting up background sync');
      
      // Load pending sync tasks
      await this.loadSyncTasks();
      
      // Register sync event
      await this.serviceWorker.sync.register('background-sync');
      
      console.log('✅ Background sync setup complete');
    } catch (error) {
      console.error('❌ Failed to setup background sync:', error);
    }
  }

  /**
   * Add task to background sync queue
   */
  async addSyncTask(task: Omit<SyncTask, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<string> {
    try {
      const syncTask: SyncTask = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...task,
        createdAt: new Date(),
        status: 'pending',
        retryCount: 0
      };

      // Store task
      this.syncTasks.set(syncTask.id, syncTask);
      await this.storeSyncTask(syncTask);

      // Trigger sync if online
      if (this.isOnline && this.serviceWorker) {
        await this.serviceWorker.sync.register('background-sync');
      }

      console.log(`📝 Sync task added: ${syncTask.id}`);
      return syncTask.id;
    } catch (error) {
      console.error('❌ Failed to add sync task:', error);
      throw error;
    }
  }

  /**
   * Process background sync tasks
   */
  async processSyncTasks(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    try {
      this.syncInProgress = true;
      console.log('🔄 Processing background sync tasks');

      const pendingTasks = Array.from(this.syncTasks.values())
        .filter(task => task.status === 'pending')
        .sort((a, b) => {
          // Sort by priority and creation time
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      for (const task of pendingTasks) {
        try {
          await this.executeSyncTask(task);
        } catch (error) {
          console.error(`Failed to execute sync task ${task.id}:`, error);
          await this.handleSyncTaskFailure(task, error);
        }
      }

      console.log(`✅ Processed ${pendingTasks.length} sync tasks`);
    } catch (error) {
      console.error('❌ Failed to process sync tasks:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Detect device capabilities
   */
  async detectDeviceCapabilities(): Promise<DeviceCapabilities> {
    try {
      console.log('📱 Detecting device capabilities');
      
      // Storage quota
      let storage = { quota: 0, usage: 0, available: 0 };
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        storage = {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0)
        };
      }

      // Permissions
      const permissions = {
        notifications: await this.checkPermission('notifications'),
        camera: await this.checkPermission('camera'),
        microphone: await this.checkPermission('microphone'),
        geolocation: await this.checkPermission('geolocation')
      };

      // Features
      const features = {
        serviceWorker: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        webShare: 'share' in navigator,
        deviceMotion: 'DeviceMotionEvent' in window,
        vibration: 'vibrate' in navigator,
        fullscreen: 'requestFullscreen' in document.documentElement
      };

      // Network information
      const connection = (navigator as any).connection;
      const network = {
        type: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      };

      this.deviceCapabilities = {
        online: this.isOnline,
        storage,
        permissions,
        features,
        network
      };

      console.log('✅ Device capabilities detected');
      return this.deviceCapabilities;
    } catch (error) {
      console.error('❌ Failed to detect device capabilities:', error);
      throw error;
    }
  }

  /**
   * Setup install prompt handling
   */
  setupInstallPromptHandling(): void {
    console.log('📲 Setting up install prompt handling');
    
    let deferredPrompt: any = null;

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📲 Install prompt available');
      e.preventDefault();
      deferredPrompt = e;
      
      // Log prompt availability
      this.logInstallPrompt({
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        action: 'shown',
        source: 'automatic'
      });
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('📲 App installed');
      deferredPrompt = null;
      
      this.logInstallPrompt({
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        action: 'accepted',
        source: 'automatic'
      });
    });

    // Store deferred prompt for manual triggering
    (window as any).deferredPrompt = deferredPrompt;
  }

  /**
   * Show install prompt manually
   */
  async showInstallPrompt(): Promise<boolean> {
    try {
      const deferredPrompt = (window as any).deferredPrompt;
      if (!deferredPrompt) {
        console.warn('Install prompt not available');
        return false;
      }

      console.log('📲 Showing install prompt');
      
      // Show the prompt
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      // Log the outcome
      this.logInstallPrompt({
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        action: outcome === 'accepted' ? 'accepted' : 'dismissed',
        source: 'manual'
      });

      // Clear the deferred prompt
      (window as any).deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('❌ Failed to show install prompt:', error);
      return false;
    }
  }

  /**
   * Check if app is installed
   */
  isAppInstalled(): boolean {
    // Check if running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Get PWA installation status
   */
  getInstallationStatus(): {
    isInstalled: boolean;
    isInstallable: boolean;
    platform: string;
    displayMode: string;
  } {
    return {
      isInstalled: this.isAppInstalled(),
      isInstallable: !!(window as any).deferredPrompt,
      platform: this.getPlatform(),
      displayMode: this.getDisplayMode()
    };
  }

  /**
   * Get offline status and capabilities
   */
  getOfflineStatus(): {
    isOnline: boolean;
    cachedResources: number;
    pendingSyncTasks: number;
    storageUsage: { quota: number; usage: number; available: number };
  } {
    const storage = this.deviceCapabilities?.storage || { quota: 0, usage: 0, available: 0 };
    
    return {
      isOnline: this.isOnline,
      cachedResources: this.offlineResources.size,
      pendingSyncTasks: Array.from(this.syncTasks.values()).filter(t => t.status === 'pending').length,
      storageUsage: storage
    };
  }

  /**
   * Private helper methods
   */
  private async handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    console.log('🔄 Service worker update available');
    
    // Notify user about update
    if (this.serviceWorker) {
      this.serviceWorker.active?.postMessage({
        type: 'SHOW_UPDATE_NOTIFICATION'
      });
    }
  }

  private async handleNetworkRestore(): void {
    console.log('🔄 Handling network restore');
    
    // Process pending sync tasks
    await this.processSyncTasks();
    
    // Update cached resources
    await this.updateCachedResources();
  }

  private handleNetworkLoss(): void {
    console.log('📴 Handling network loss');
    
    // Show offline indicator
    if (this.serviceWorker) {
      this.serviceWorker.active?.postMessage({
        type: 'SHOW_OFFLINE_INDICATOR'
      });
    }
  }

  private handleNetworkChange(connection: any): void {
    console.log('🌐 Network conditions changed:', {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    });
    
    // Update device capabilities
    if (this.deviceCapabilities) {
      this.deviceCapabilities.network = {
        type: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
  }

  private async executeSyncTask(task: SyncTask): Promise<void> {
    console.log(`🔄 Executing sync task: ${task.id}`);
    
    // Update task status
    task.status = 'running';
    task.lastAttempt = new Date();
    await this.updateSyncTask(task);

    try {
      // Execute based on task type
      switch (task.type) {
        case 'data_sync':
          await this.executeDataSync(task);
          break;
        case 'file_upload':
          await this.executeFileUpload(task);
          break;
        case 'api_call':
          await this.executeAPICall(task);
          break;
        case 'notification':
          await this.executeNotification(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      // Mark as completed
      task.status = 'completed';
      await this.updateSyncTask(task);
      
      console.log(`✅ Sync task completed: ${task.id}`);
    } catch (error) {
      throw error;
    }
  }

  private async executeDataSync(task: SyncTask): Promise<void> {
    // Implement data synchronization logic
    console.log('🔄 Executing data sync');
  }

  private async executeFileUpload(task: SyncTask): Promise<void> {
    // Implement file upload logic
    console.log('📤 Executing file upload');
  }

  private async executeAPICall(task: SyncTask): Promise<void> {
    // Implement API call logic
    console.log('🌐 Executing API call');
  }

  private async executeNotification(task: SyncTask): Promise<void> {
    // Implement notification logic
    console.log('🔔 Executing notification');
  }

  private async handleSyncTaskFailure(task: SyncTask, error: any): void {
    task.retryCount++;
    task.error = error.message;
    
    if (task.retryCount >= task.maxRetries) {
      task.status = 'failed';
      console.error(`❌ Sync task failed permanently: ${task.id}`);
    } else {
      task.status = 'pending';
      // Exponential backoff
      task.scheduledAt = new Date(Date.now() + Math.pow(2, task.retryCount) * 1000);
      console.warn(`⚠️ Sync task failed, will retry: ${task.id}`);
    }
    
    await this.updateSyncTask(task);
  }

  private async checkPermission(name: string): Promise<'granted' | 'denied' | 'default'> {
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: name as PermissionName });
        return result.state;
      }
      return 'default';
    } catch {
      return 'default';
    }
  }

  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  private getDisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    return 'browser';
  }

  private getDefaultNotificationPreferences(): NotificationPreferences {
    return {
      enabled: true,
      types: {
        marketing: false,
        updates: true,
        alerts: true,
        reminders: true,
        social: false
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      frequency: 'immediate'
    };
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private logInstallPrompt(data: Omit<PWAInstallPrompt, 'id' | 'timestamp'>): void {
    const prompt: PWAInstallPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...data,
      timestamp: new Date(),
      metadata: {}
    };
    
    this.installPrompts.push(prompt);
    this.storeInstallPrompt(prompt);
  }

  private async loadOfflineResources(): Promise<void> {
    // Load from storage
    console.log('📥 Loading offline resources');
  }

  private async loadSyncTasks(): Promise<void> {
    // Load from storage
    console.log('📥 Loading sync tasks');
  }

  private async loadPushSubscriptions(): Promise<void> {
    // Load from storage
    console.log('📥 Loading push subscriptions');
  }

  private async updateCachedResources(): Promise<void> {
    // Update cached resources
    console.log('🔄 Updating cached resources');
  }

  private async storePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await redisCacheService.set(`push_sub:${subscription.id}`, JSON.stringify(subscription), 86400);
    } catch (error) {
      console.error('Failed to store push subscription:', error);
    }
  }

  private async updatePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await redisCacheService.set(`push_sub:${subscription.id}`, JSON.stringify(subscription), 86400);
    } catch (error) {
      console.error('Failed to update push subscription:', error);
    }
  }

  private async storeSyncTask(task: SyncTask): Promise<void> {
    try {
      await redisCacheService.set(`sync_task:${task.id}`, JSON.stringify(task), 86400);
    } catch (error) {
      console.error('Failed to store sync task:', error);
    }
  }

  private async updateSyncTask(task: SyncTask): Promise<void> {
    try {
      await redisCacheService.set(`sync_task:${task.id}`, JSON.stringify(task), 86400);
    } catch (error) {
      console.error('Failed to update sync task:', error);
    }
  }

  private async storeInstallPrompt(prompt: PWAInstallPrompt): Promise<void> {
    try {
      console.log(`💾 Storing install prompt: ${prompt.id}`);
    } catch (error) {
      console.error('Failed to store install prompt:', error);
    }
  }
}

// Export singleton instance
export const advancedPWAService = AdvancedPWAService.getInstance();
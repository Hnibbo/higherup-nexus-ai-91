import { supabase } from '@/integrations/supabase/client';

/**
 * Progressive Web App Service
 * 
 * Provides comprehensive PWA functionality including installation management,
 * offline capabilities, background sync, push notifications, and device integration.
 */

export interface PWAInstallPrompt {
  id: string;
  user_id: string;
  platform: string;
  user_agent: string;
  prompted_at: string;
  outcome: 'accepted' | 'dismissed' | 'ignored';
  install_source: 'banner' | 'button' | 'menu' | 'automatic';
}

export interface PWACapabilities {
  installable: boolean;
  standalone: boolean;
  offline_ready: boolean;
  push_notifications: boolean;
  background_sync: boolean;
  device_access: {
    camera: boolean;
    microphone: boolean;
    geolocation: boolean;
    contacts: boolean;
    calendar: boolean;
    files: boolean;
  };
  platform_features: {
    share_api: boolean;
    payment_request: boolean;
    web_locks: boolean;
    persistent_storage: boolean;
    indexed_db: boolean;
    service_worker: boolean;
  };
}

export interface BackgroundSyncTask {
  id: string;
  tag: string;
  data: Record<string, any>;
  created_at: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device_info: {
    user_agent: string;
    platform: string;
    is_mobile: boolean;
  };
  created_at: string;
  last_used: string;
  active: boolean;
}

export interface DeviceIntegration {
  feature: string;
  permission_status: 'granted' | 'denied' | 'prompt';
  last_requested: string;
  usage_count: number;
  error_count: number;
}

export interface OfflineStorage {
  key: string;
  data: any;
  timestamp: string;
  expires_at?: string;
  sync_status: 'pending' | 'synced' | 'conflict';
  conflict_resolution: 'client_wins' | 'server_wins' | 'merge' | 'manual';
}

export class PWAService {
  private static instance: PWAService;
  private installPrompt: any = null;
  private capabilities: PWACapabilities | null = null;
  private backgroundSyncTasks: Map<string, BackgroundSyncTask> = new Map();
  private pushSubscription: PushSubscription | null = null;
  private deviceIntegrations: Map<string, DeviceIntegration> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('📱 Initializing PWA Service');
      
      // Detect PWA capabilities
      await this.detectCapabilities();
      
      // Initialize service worker
      await this.initializeServiceWorker();
      
      // Setup install prompt handling
      await this.setupInstallPrompt();
      
      // Initialize push notifications
      await this.initializePushNotifications();
      
      // Setup background sync
      await this.setupBackgroundSync();
      
      // Initialize device integrations
      await this.initializeDeviceIntegrations();
      
      // Setup offline storage
      await this.setupOfflineStorage();
      
      console.log('✅ PWA Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize PWA Service:', error);
    }
  }

  // PWA Installation Management
  async detectCapabilities(): Promise<PWACapabilities> {
    try {
      console.log('🔍 Detecting PWA capabilities');

      const capabilities: PWACapabilities = {
        installable: false,
        standalone: this.isStandalone(),
        offline_ready: 'serviceWorker' in navigator,
        push_notifications: 'Notification' in window && 'serviceWorker' in navigator,
        background_sync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
        device_access: {
          camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
          microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
          geolocation: 'geolocation' in navigator,
          contacts: 'contacts' in navigator,
          calendar: false, // Not widely supported yet
          files: 'showOpenFilePicker' in window
        },
        platform_features: {
          share_api: 'share' in navigator,
          payment_request: 'PaymentRequest' in window,
          web_locks: 'locks' in navigator,
          persistent_storage: 'storage' in navigator && 'persist' in navigator.storage,
          indexed_db: 'indexedDB' in window,
          service_worker: 'serviceWorker' in navigator
        }
      };

      this.capabilities = capabilities;
      console.log('✅ PWA capabilities detected:', capabilities);
      return capabilities;

    } catch (error) {
      console.error('❌ Failed to detect PWA capabilities:', error);
      throw error;
    }
  }

  private isStandalone(): boolean {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Check iOS standalone mode
    if ((navigator as any).standalone === true) {
      return true;
    }

    // Check Android TWA
    if (document.referrer.includes('android-app://')) {
      return true;
    }

    return false;
  }

  async setupInstallPrompt(): Promise<void> {
    try {
      console.log('📲 Setting up install prompt');

      // Listen for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.installPrompt = e;
        this.capabilities!.installable = true;
        
        console.log('📲 Install prompt available');
        this.notifyInstallAvailable();
      });

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed successfully');
        this.installPrompt = null;
        this.capabilities!.installable = false;
        this.trackInstallEvent('accepted');
      });

    } catch (error) {
      console.error('❌ Failed to setup install prompt:', error);
    }
  }

  async promptInstall(): Promise<boolean> {
    try {
      if (!this.installPrompt) {
        console.warn('⚠️ Install prompt not available');
        return false;
      }

      console.log('📲 Showing install prompt');
      
      // Show the install prompt
      await this.installPrompt.prompt();
      
      // Wait for user response
      const choiceResult = await this.installPrompt.userChoice;
      
      const accepted = choiceResult.outcome === 'accepted';
      console.log(`📲 Install prompt ${accepted ? 'accepted' : 'dismissed'}`);
      
      // Track the outcome
      await this.trackInstallEvent(choiceResult.outcome);
      
      // Clear the prompt
      this.installPrompt = null;
      this.capabilities!.installable = false;
      
      return accepted;

    } catch (error) {
      console.error('❌ Failed to prompt install:', error);
      return false;
    }
  }

  private async trackInstallEvent(outcome: string): Promise<void> {
    try {
      const installPrompt: PWAInstallPrompt = {
        id: `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: 'current_user', // Replace with actual user ID
        platform: navigator.platform,
        user_agent: navigator.userAgent,
        prompted_at: new Date().toISOString(),
        outcome: outcome as 'accepted' | 'dismissed' | 'ignored',
        install_source: 'button' // This could be dynamic based on context
      };

      await this.storeInstallPrompt(installPrompt);
    } catch (error) {
      console.error('Failed to track install event:', error);
    }
  }

  private notifyInstallAvailable(): void {
    // Notify the app that installation is available
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  // Service Worker Management
  async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    try {
      console.log('🔧 Initializing Service Worker');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Service Worker available');
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

    } catch (error) {
      console.error('❌ Failed to register Service Worker:', error);
    }
  }

  private handleServiceWorkerMessage(data: any): void {
    console.log('📨 Message from Service Worker:', data);

    switch (data.type) {
      case 'BACKGROUND_SYNC_SUCCESS':
        this.handleBackgroundSyncSuccess(data.payload);
        break;
      case 'BACKGROUND_SYNC_FAILED':
        this.handleBackgroundSyncFailed(data.payload);
        break;
      case 'CACHE_UPDATED':
        this.handleCacheUpdated(data.payload);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private notifyUpdateAvailable(): void {
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }

  async updateServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  }

  // Push Notifications
  async initializePushNotifications(): Promise<void> {
    if (!this.capabilities?.push_notifications) {
      console.warn('⚠️ Push notifications not supported');
      return;
    }

    try {
      console.log('🔔 Initializing push notifications');

      // Check current permission status
      const permission = Notification.permission;
      console.log('🔔 Notification permission:', permission);

      if (permission === 'granted') {
        await this.setupPushSubscription();
      }

    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported');
        return false;
      }

      console.log('🔔 Requesting notification permission');

      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission result:', permission);

      if (permission === 'granted') {
        await this.setupPushSubscription();
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Failed to request notification permission:', error);
      return false;
    }
  }

  private async setupPushSubscription(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      if (subscription) {
        const pushSubscription: PushSubscription = {
          id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: 'current_user', // Replace with actual user ID
          endpoint: subscription.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
          },
          device_info: {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            is_mobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
          },
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
          active: true
        };

        this.pushSubscription = pushSubscription;
        await this.storePushSubscription(pushSubscription);
        
        console.log('✅ Push subscription created');
      }

    } catch (error) {
      console.error('❌ Failed to setup push subscription:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

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

  // Background Sync
  async setupBackgroundSync(): Promise<void> {
    if (!this.capabilities?.background_sync) {
      console.warn('⚠️ Background sync not supported');
      return;
    }

    try {
      console.log('🔄 Setting up background sync');

      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('🌐 Back online - triggering sync');
        this.triggerBackgroundSync('data-sync');
      });

      window.addEventListener('offline', () => {
        console.log('📴 Gone offline');
      });

    } catch (error) {
      console.error('❌ Failed to setup background sync:', error);
    }
  }

  async scheduleBackgroundSync(tag: string, data: Record<string, any>): Promise<void> {
    try {
      const task: BackgroundSyncTask = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tag,
        data,
        created_at: new Date().toISOString(),
        retry_count: 0,
        max_retries: 3,
        status: 'pending'
      };

      this.backgroundSyncTasks.set(task.id, task);
      await this.storeBackgroundSyncTask(task);

      // Try to sync immediately if online
      if (navigator.onLine) {
        await this.triggerBackgroundSync(tag);
      } else {
        console.log('📴 Offline - sync scheduled for when online');
      }

    } catch (error) {
      console.error('❌ Failed to schedule background sync:', error);
    }
  }

  private async triggerBackgroundSync(tag: string): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('🔄 Background sync triggered:', tag);
    } catch (error) {
      console.error('❌ Failed to trigger background sync:', error);
    }
  }

  private handleBackgroundSyncSuccess(payload: any): void {
    console.log('✅ Background sync successful:', payload);
    
    // Update task status
    const task = this.backgroundSyncTasks.get(payload.taskId);
    if (task) {
      task.status = 'completed';
      this.backgroundSyncTasks.set(task.id, task);
    }

    // Notify the app
    window.dispatchEvent(new CustomEvent('background-sync-success', { detail: payload }));
  }

  private handleBackgroundSyncFailed(payload: any): void {
    console.error('❌ Background sync failed:', payload);
    
    // Update task status and retry count
    const task = this.backgroundSyncTasks.get(payload.taskId);
    if (task) {
      task.retry_count++;
      task.status = task.retry_count >= task.max_retries ? 'failed' : 'pending';
      this.backgroundSyncTasks.set(task.id, task);
    }

    // Notify the app
    window.dispatchEvent(new CustomEvent('background-sync-failed', { detail: payload }));
  }

  // Device Integration
  async initializeDeviceIntegrations(): Promise<void> {
    try {
      console.log('📱 Initializing device integrations');

      // Initialize available device features
      const features = ['camera', 'microphone', 'geolocation', 'contacts', 'files'];
      
      for (const feature of features) {
        if (this.capabilities?.device_access[feature as keyof typeof this.capabilities.device_access]) {
          const integration: DeviceIntegration = {
            feature,
            permission_status: 'prompt',
            last_requested: new Date().toISOString(),
            usage_count: 0,
            error_count: 0
          };
          
          this.deviceIntegrations.set(feature, integration);
        }
      }

      console.log('✅ Device integrations initialized');

    } catch (error) {
      console.error('❌ Failed to initialize device integrations:', error);
    }
  }

  async requestDevicePermission(feature: string): Promise<boolean> {
    try {
      console.log(`📱 Requesting ${feature} permission`);

      const integration = this.deviceIntegrations.get(feature);
      if (!integration) {
        console.warn(`⚠️ ${feature} not supported`);
        return false;
      }

      let granted = false;

      switch (feature) {
        case 'camera':
        case 'microphone':
          granted = await this.requestMediaPermission(feature);
          break;
        case 'geolocation':
          granted = await this.requestGeolocationPermission();
          break;
        case 'contacts':
          granted = await this.requestContactsPermission();
          break;
        case 'files':
          granted = true; // File access doesn't require explicit permission
          break;
        default:
          console.warn(`Unknown feature: ${feature}`);
          return false;
      }

      // Update integration status
      integration.permission_status = granted ? 'granted' : 'denied';
      integration.last_requested = new Date().toISOString();
      if (granted) {
        integration.usage_count++;
      } else {
        integration.error_count++;
      }

      this.deviceIntegrations.set(feature, integration);
      await this.storeDeviceIntegration(integration);

      console.log(`📱 ${feature} permission ${granted ? 'granted' : 'denied'}`);
      return granted;

    } catch (error) {
      console.error(`❌ Failed to request ${feature} permission:`, error);
      return false;
    }
  }

  private async requestMediaPermission(type: 'camera' | 'microphone'): Promise<boolean> {
    try {
      const constraints = type === 'camera' 
        ? { video: true } 
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error(`Media permission denied for ${type}:`, error);
      return false;
    }
  }

  private async requestGeolocationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
      );
    });
  }

  private async requestContactsPermission(): Promise<boolean> {
    try {
      if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
        await (navigator as any).contacts.select(['name'], { multiple: false });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Contacts permission denied:', error);
      return false;
    }
  }

  // Offline Storage
  async setupOfflineStorage(): Promise<void> {
    try {
      console.log('💾 Setting up offline storage');

      // Request persistent storage if available
      if (this.capabilities?.platform_features.persistent_storage) {
        const persistent = await navigator.storage.persist();
        console.log('💾 Persistent storage:', persistent ? 'granted' : 'denied');
      }

      // Initialize IndexedDB for offline data
      await this.initializeIndexedDB();

      console.log('✅ Offline storage setup complete');

    } catch (error) {
      console.error('❌ Failed to setup offline storage:', error);
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HigherUpAI_PWA', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('offline_data')) {
          const store = db.createObjectStore('offline_data', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('sync_status', 'sync_status');
        }

        if (!db.objectStoreNames.contains('background_tasks')) {
          const store = db.createObjectStore('background_tasks', { keyPath: 'id' });
          store.createIndex('tag', 'tag');
          store.createIndex('status', 'status');
        }
      };
    });
  }

  async storeOfflineData(key: string, data: any, expiresIn?: number): Promise<void> {
    try {
      const offlineData: OfflineStorage = {
        key,
        data,
        timestamp: new Date().toISOString(),
        expires_at: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : undefined,
        sync_status: 'pending',
        conflict_resolution: 'client_wins'
      };

      const db = await this.openIndexedDB();
      const transaction = db.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      
      await store.put(offlineData);
      console.log('💾 Data stored offline:', key);

    } catch (error) {
      console.error('❌ Failed to store offline data:', error);
    }
  }

  async getOfflineData(key: string): Promise<any> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      
      const result = await store.get(key);
      
      if (result) {
        // Check if data has expired
        if (result.expires_at && new Date(result.expires_at) < new Date()) {
          await this.removeOfflineData(key);
          return null;
        }
        
        return result.data;
      }
      
      return null;

    } catch (error) {
      console.error('❌ Failed to get offline data:', error);
      return null;
    }
  }

  async removeOfflineData(key: string): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      
      await store.delete(key);
      console.log('🗑️ Offline data removed:', key);

    } catch (error) {
      console.error('❌ Failed to remove offline data:', error);
    }
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HigherUpAI_PWA', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private handleCacheUpdated(payload: any): void {
    console.log('🔄 Cache updated:', payload);
    window.dispatchEvent(new CustomEvent('cache-updated', { detail: payload }));
  }

  // Database Operations
  private async storeInstallPrompt(prompt: PWAInstallPrompt): Promise<void> {
    try {
      const { error } = await supabase
        .from('pwa_install_prompts')
        .upsert({
          id: prompt.id,
          user_id: prompt.user_id,
          platform: prompt.platform,
          user_agent: prompt.user_agent,
          prompted_at: prompt.prompted_at,
          outcome: prompt.outcome,
          install_source: prompt.install_source
        });

      if (error) {
        console.warn('Could not store install prompt:', error);
      }
    } catch (error) {
      console.warn('Error storing install prompt:', error);
    }
  }

  private async storePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          id: subscription.id,
          user_id: subscription.user_id,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          device_info: subscription.device_info,
          created_at: subscription.created_at,
          last_used: subscription.last_used,
          active: subscription.active
        });

      if (error) {
        console.warn('Could not store push subscription:', error);
      }
    } catch (error) {
      console.warn('Error storing push subscription:', error);
    }
  }

  private async storeBackgroundSyncTask(task: BackgroundSyncTask): Promise<void> {
    try {
      const { error } = await supabase
        .from('background_sync_tasks')
        .upsert({
          id: task.id,
          tag: task.tag,
          data: task.data,
          created_at: task.created_at,
          retry_count: task.retry_count,
          max_retries: task.max_retries,
          next_retry_at: task.next_retry_at,
          status: task.status
        });

      if (error) {
        console.warn('Could not store background sync task:', error);
      }
    } catch (error) {
      console.warn('Error storing background sync task:', error);
    }
  }

  private async storeDeviceIntegration(integration: DeviceIntegration): Promise<void> {
    try {
      const { error } = await supabase
        .from('device_integrations')
        .upsert({
          feature: integration.feature,
          permission_status: integration.permission_status,
          last_requested: integration.last_requested,
          usage_count: integration.usage_count,
          error_count: integration.error_count
        });

      if (error) {
        console.warn('Could not store device integration:', error);
      }
    } catch (error) {
      console.warn('Error storing device integration:', error);
    }
  }

  // Public API Methods
  getCapabilities(): PWACapabilities | null {
    return this.capabilities;
  }

  isInstallable(): boolean {
    return this.capabilities?.installable || false;
  }

  isStandaloneMode(): boolean {
    return this.capabilities?.standalone || false;
  }

  async getInstallPrompts(): Promise<PWAInstallPrompt[]> {
    try {
      const { data, error } = await supabase
        .from('pwa_install_prompts')
        .select('*')
        .order('prompted_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch install prompts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error fetching install prompts:', error);
      return [];
    }
  }

  async getPushSubscriptions(): Promise<PushSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch push subscriptions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error fetching push subscriptions:', error);
      return [];
    }
  }

  async getBackgroundSyncTasks(status?: string): Promise<BackgroundSyncTask[]> {
    try {
      let query = supabase
        .from('background_sync_tasks')
        .select('*');

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch background sync tasks:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Error fetching background sync tasks:', error);
      return [];
    }
  }

  async shareContent(shareData: ShareData): Promise<boolean> {
    try {
      if (this.capabilities?.platform_features.share_api && navigator.share) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback to clipboard or other sharing methods
        if (shareData.url) {
          await navigator.clipboard.writeText(shareData.url);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to share content:', error);
      return false;
    }
  }

  async requestPersistentStorage(): Promise<boolean> {
    try {
      if (this.capabilities?.platform_features.persistent_storage) {
        return await navigator.storage.persist();
      }
      return false;
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }

  async getStorageEstimate(): Promise<StorageEstimate | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
      }
      return null;
    } catch (error) {
      console.error('Failed to get storage estimate:', error);
      return null;
    }
  }
}

export default PWAService;
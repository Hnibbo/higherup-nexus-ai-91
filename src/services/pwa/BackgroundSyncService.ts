import { supabase } from '@/integrations/supabase/client';

/**
 * Background Sync Service
 * 
 * Handles offline data synchronization, queuing failed requests,
 * and syncing data when the connection is restored.
 */

export interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface SyncConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  syncInterval: number;
  enablePeriodicSync: boolean;
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private db: IDBDatabase | null = null;
  private syncQueue: SyncItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private config: SyncConfig = {
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 10,
    syncInterval: 30000,
    enablePeriodicSync: true
  };

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('🔄 Initializing Background Sync Service');
      
      await this.initializeDatabase();
      await this.loadQueueFromStorage();
      this.setupEventListeners();
      this.startPeriodicSync();
      
      console.log('✅ Background Sync Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Background Sync Service:', error);
    }
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('higherup-sync', 2);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
        
        // Create sync log store
        if (!db.objectStoreNames.contains('sync_log')) {
          const logStore = db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  private setupEventListeners(): void {
    // Network status changes
    window.addEventListener('online', () => {
      console.log('🌐 Network back online - starting sync');
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Network offline - queuing operations');
      this.isOnline = false;
    });

    // Service Worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'BACKGROUND_SYNC_SUCCESS') {
          this.handleSyncSuccess(event.data.payload);
        } else if (event.data.type === 'BACKGROUND_SYNC_FAILED') {
          this.handleSyncFailure(event.data.payload);
        }
      });
    }

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processQueue();
      }
    });
  }

  private startPeriodicSync(): void {
    if (!this.config.enablePeriodicSync) return;

    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.processQueue();
      }
    }, this.config.syncInterval);
  }

  // Queue Management
  async addToQueue(item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncItem: SyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      ...item
    };

    this.syncQueue.push(syncItem);
    await this.saveToStorage(syncItem);

    console.log(`📝 Added to sync queue: ${syncItem.type} ${syncItem.table}`, syncItem);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  async removeFromQueue(itemId: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
    await this.removeFromStorage(itemId);
  }

  async processQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`🔄 Processing sync queue: ${this.syncQueue.length} items`);

    try {
      // Sort by priority and timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      // Process in batches
      const batches = this.createBatches(sortedQueue, this.config.batchSize);
      
      for (const batch of batches) {
        await this.processBatch(batch);
      }

      console.log('✅ Sync queue processing completed');
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(batch: SyncItem[]): Promise<void> {
    const promises = batch.map(item => this.syncItem(item));
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      const item = batch[index];
      if (result.status === 'fulfilled') {
        this.handleItemSyncSuccess(item);
      } else {
        this.handleItemSyncFailure(item, result.reason);
      }
    });
  }

  private async syncItem(item: SyncItem): Promise<void> {
    console.log(`🔄 Syncing item: ${item.type} ${item.table}`, item.data);

    try {
      switch (item.type) {
        case 'create':
          await this.syncCreate(item);
          break;
        case 'update':
          await this.syncUpdate(item);
          break;
        case 'delete':
          await this.syncDelete(item);
          break;
        default:
          throw new Error(`Unknown sync type: ${item.type}`);
      }

      await this.logSyncOperation(item, 'success');
    } catch (error) {
      await this.logSyncOperation(item, 'failed', error);
      throw error;
    }
  }

  private async syncCreate(item: SyncItem): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .insert(item.data);

    if (error) {
      throw new Error(`Create sync failed: ${error.message}`);
    }
  }

  private async syncUpdate(item: SyncItem): Promise<void> {
    const { id, ...updateData } = item.data;
    
    const { error } = await supabase
      .from(item.table)
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Update sync failed: ${error.message}`);
    }
  }

  private async syncDelete(item: SyncItem): Promise<void> {
    const { error } = await supabase
      .from(item.table)
      .delete()
      .eq('id', item.data.id);

    if (error) {
      throw new Error(`Delete sync failed: ${error.message}`);
    }
  }

  private async handleItemSyncSuccess(item: SyncItem): Promise<void> {
    console.log(`✅ Item synced successfully: ${item.id}`);
    await this.removeFromQueue(item.id);
  }

  private async handleItemSyncFailure(item: SyncItem, error: any): Promise<void> {
    console.error(`❌ Item sync failed: ${item.id}`, error);
    
    item.retryCount++;
    
    if (item.retryCount >= item.maxRetries) {
      console.error(`❌ Max retries reached for item: ${item.id}`);
      await this.removeFromQueue(item.id);
      await this.logSyncOperation(item, 'max_retries_reached', error);
    } else {
      console.log(`🔄 Scheduling retry for item: ${item.id} (attempt ${item.retryCount + 1})`);
      await this.saveToStorage(item);
      
      // Schedule retry with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, item.retryCount - 1);
      setTimeout(() => {
        if (this.isOnline) {
          this.processQueue();
        }
      }, delay);
    }
  }

  private handleSyncSuccess(payload: any): void {
    console.log('✅ Background sync success:', payload);
    // Handle successful background sync from service worker
  }

  private handleSyncFailure(payload: any): void {
    console.error('❌ Background sync failure:', payload);
    // Handle failed background sync from service worker
  }

  // Storage Operations
  private async saveToStorage(item: SyncItem): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromStorage(itemId: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.delete(itemId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async loadQueueFromStorage(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();

      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        console.log(`📚 Loaded ${this.syncQueue.length} items from sync queue`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async logSyncOperation(item: SyncItem, status: string, error?: any): Promise<void> {
    if (!this.db) return;

    const logEntry = {
      item_id: item.id,
      type: item.type,
      table: item.table,
      status,
      timestamp: Date.now(),
      error_message: error ? (error instanceof Error ? error.message : String(error)) : null,
      retry_count: item.retryCount
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_log'], 'readwrite');
      const store = transaction.objectStore('sync_log');
      const request = store.add(logEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Public API
  async queueCreate(table: string, data: Record<string, any>, priority: SyncItem['priority'] = 'normal'): Promise<void> {
    await this.addToQueue({
      type: 'create',
      table,
      data,
      priority,
      maxRetries: this.config.maxRetries
    });
  }

  async queueUpdate(table: string, data: Record<string, any>, priority: SyncItem['priority'] = 'normal'): Promise<void> {
    await this.addToQueue({
      type: 'update',
      table,
      data,
      priority,
      maxRetries: this.config.maxRetries
    });
  }

  async queueDelete(table: string, id: string, priority: SyncItem['priority'] = 'normal'): Promise<void> {
    await this.addToQueue({
      type: 'delete',
      table,
      data: { id },
      priority,
      maxRetries: this.config.maxRetries
    });
  }

  getQueueStatus(): { total: number; pending: number; failed: number } {
    const total = this.syncQueue.length;
    const failed = this.syncQueue.filter(item => item.retryCount >= item.maxRetries).length;
    const pending = total - failed;

    return { total, pending, failed };
  }

  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ Sync queue cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncLog(limit: number = 100): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_log'], 'readonly');
      const store = transaction.objectStore('sync_log');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev');
      
      const results: any[] = [];
      let count = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Background sync config updated:', this.config);
  }

  // Service Worker Integration
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        console.log('✅ Background sync registered with service worker');
      } catch (error) {
        console.error('❌ Failed to register background sync:', error);
      }
    }
  }

  async requestPeriodicSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const status = await (registration as any).periodicSync.register('content-sync', {
          minInterval: 24 * 60 * 60 * 1000 // 24 hours
        });
        console.log('✅ Periodic sync registered:', status);
      } catch (error) {
        console.error('❌ Failed to register periodic sync:', error);
      }
    }
  }
}

export default BackgroundSyncService;
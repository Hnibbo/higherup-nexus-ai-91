/**
 * Advanced Service Worker
 * Comprehensive PWA service worker with advanced caching strategies,
 * background sync, push notifications, and offline capabilities
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAMES = {
  static: `higherup-static-${CACHE_VERSION}`,
  dynamic: `higherup-dynamic-${CACHE_VERSION}`,
  api: `higherup-api-${CACHE_VERSION}`,
  images: `higherup-images-${CACHE_VERSION}`,
  fonts: `higherup-fonts-${CACHE_VERSION}`
};

const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

const CACHE_STRATEGIES = {
  pages: 'networkFirst',
  api: 'networkFirst',
  assets: 'cacheFirst',
  images: 'cacheFirst',
  fonts: 'cacheFirst'
};

const MAX_CACHE_SIZE = {
  static: 50,
  dynamic: 100,
  api: 200,
  images: 50,
  fonts: 20
};

const CACHE_EXPIRY = {
  static: 7 * 24 * 60 * 60 * 1000,    // 7 days
  dynamic: 24 * 60 * 60 * 1000,       // 1 day
  api: 5 * 60 * 1000,                 // 5 minutes
  images: 30 * 24 * 60 * 60 * 1000,   // 30 days
  fonts: 365 * 24 * 60 * 60 * 1000    // 1 year
};

// Background sync queue
let syncQueue = [];
let isOnline = true;

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing');
  
  event.waitUntil(
    Promise.all([
      // Pre-cache static resources
      caches.open(CACHE_NAMES.static).then((cache) => {
        console.log('📦 Pre-caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupOldCaches(),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy based on request type
  const strategy = getCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

/**
 * Background Sync Event Handler
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Push Event Handler
 */
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  let notificationData = {
    title: 'HigherUp.ai',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {}
  };
  
  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      console.error('Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions || [],
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      vibrate: notificationData.vibrate || [200, 100, 200]
    })
  );
});

/**
 * Notification Click Event Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  event.waitUntil(
    handleNotificationClick(action, data)
  );
});

/**
 * Message Event Handler
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'PRECACHE_RESOURCES':
      event.waitUntil(preCacheResources(data.resources));
      break;
      
    case 'SETUP_CACHE_STRATEGIES':
      Object.assign(CACHE_STRATEGIES, data.strategies);
      break;
      
    case 'ADD_TO_SYNC_QUEUE':
      addToSyncQueue(data);
      break;
      
    case 'SHOW_NOTIFICATION':
      event.waitUntil(showNotification(data.notification));
      break;
      
    case 'SHOW_UPDATE_NOTIFICATION':
      event.waitUntil(showUpdateNotification());
      break;
      
    case 'SHOW_OFFLINE_INDICATOR':
      event.waitUntil(showOfflineIndicator());
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      }));
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Network Status Monitoring
 */
self.addEventListener('online', () => {
  console.log('🟢 Network connection restored');
  isOnline = true;
  processSyncQueue();
});

self.addEventListener('offline', () => {
  console.log('🔴 Network connection lost');
  isOnline = false;
});

/**
 * Cache Strategy Implementation
 */
async function handleRequest(request, strategy) {
  try {
    switch (strategy) {
      case 'cacheFirst':
        return await cacheFirst(request);
      case 'networkFirst':
        return await networkFirst(request);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request);
      case 'networkOnly':
        return await networkOnly(request);
      case 'cacheOnly':
        return await cacheOnly(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Request handling failed:', error);
    return await getOfflineFallback(request);
  }
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request) {
  const cacheName = getCacheName(request);
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request) {
  const cacheName = getCacheName(request);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request) {
  const cacheName = getCacheName(request);
  const cachedResponse = await caches.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      await limitCacheSize(cacheName);
    }
    return response;
  }).catch(() => {
    // Network failed, ignore
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network response if no cache
  return await networkResponsePromise;
}

/**
 * Network Only Strategy
 */
async function networkOnly(request) {
  return await fetch(request);
}

/**
 * Cache Only Strategy
 */
async function cacheOnly(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  throw new Error('No cached response available');
}

/**
 * Determine cache strategy based on request
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // API requests
  if (url.pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.api;
  }
  
  // Images
  if (request.destination === 'image') {
    return CACHE_STRATEGIES.images;
  }
  
  // Fonts
  if (request.destination === 'font' || url.pathname.includes('/fonts/')) {
    return CACHE_STRATEGIES.fonts;
  }
  
  // Static assets
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.includes('/static/')) {
    return CACHE_STRATEGIES.assets;
  }
  
  // Pages
  if (request.destination === 'document') {
    return CACHE_STRATEGIES.pages;
  }
  
  return 'networkFirst';
}

/**
 * Get appropriate cache name for request
 */
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return CACHE_NAMES.api;
  }
  
  if (request.destination === 'image') {
    return CACHE_NAMES.images;
  }
  
  if (request.destination === 'font' || url.pathname.includes('/fonts/')) {
    return CACHE_NAMES.fonts;
  }
  
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.includes('/static/')) {
    return CACHE_NAMES.static;
  }
  
  return CACHE_NAMES.dynamic;
}

/**
 * Check if cached response is expired
 */
function isExpired(response) {
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return false;
  
  const age = Date.now() - parseInt(cachedTime);
  const cacheName = response.headers.get('sw-cache-name');
  const maxAge = CACHE_EXPIRY[cacheName] || CACHE_EXPIRY.dynamic;
  
  return age > maxAge;
}

/**
 * Limit cache size
 */
async function limitCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  const maxSize = MAX_CACHE_SIZE[cacheName.split('-')[1]] || MAX_CACHE_SIZE.dynamic;
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const entriesToDelete = keys.length - maxSize;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

/**
 * Clean up old caches
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = Object.values(CACHE_NAMES);
  
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      console.log('🗑️ Deleting old cache:', cacheName);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletePromises);
}

/**
 * Pre-cache resources
 */
async function preCacheResources(resources) {
  console.log('📦 Pre-caching resources:', resources);
  
  const cache = await caches.open(CACHE_NAMES.static);
  
  const cachePromises = resources.map(async (url) => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        // Add timestamp header for expiry checking
        const responseWithTimestamp = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...response.headers,
            'sw-cached-time': Date.now().toString(),
            'sw-cache-name': 'static'
          }
        });
        await cache.put(url, responseWithTimestamp);
      }
    } catch (error) {
      console.error(`Failed to cache ${url}:`, error);
    }
  });
  
  await Promise.all(cachePromises);
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.destination === 'document') {
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return placeholder for images
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">Image Unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // Return error response for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'This request requires an internet connection' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Default offline response
  return new Response('Offline', { status: 503 });
}

/**
 * Background Sync Queue Management
 */
function addToSyncQueue(data) {
  syncQueue.push({
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...data,
    timestamp: Date.now(),
    retries: 0
  });
  
  console.log('📝 Added to sync queue:', data);
}

async function processSyncQueue() {
  if (!isOnline || syncQueue.length === 0) {
    return;
  }
  
  console.log(`🔄 Processing ${syncQueue.length} sync tasks`);
  
  const processedTasks = [];
  
  for (const task of syncQueue) {
    try {
      await processSyncTask(task);
      processedTasks.push(task);
      console.log(`✅ Sync task completed: ${task.id}`);
    } catch (error) {
      task.retries++;
      if (task.retries >= 3) {
        processedTasks.push(task);
        console.error(`❌ Sync task failed permanently: ${task.id}`, error);
      } else {
        console.warn(`⚠️ Sync task failed, will retry: ${task.id}`, error);
      }
    }
  }
  
  // Remove processed tasks
  syncQueue = syncQueue.filter(task => !processedTasks.includes(task));
}

async function processSyncTask(task) {
  switch (task.type) {
    case 'api_call':
      return await fetch(task.url, {
        method: task.method || 'POST',
        headers: task.headers || { 'Content-Type': 'application/json' },
        body: task.body ? JSON.stringify(task.body) : undefined
      });
      
    case 'form_submission':
      const formData = new FormData();
      Object.entries(task.data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      return await fetch(task.url, {
        method: 'POST',
        body: formData
      });
      
    case 'file_upload':
      const uploadFormData = new FormData();
      uploadFormData.append('file', task.file);
      Object.entries(task.metadata || {}).forEach(([key, value]) => {
        uploadFormData.append(key, value);
      });
      return await fetch(task.url, {
        method: 'POST',
        body: uploadFormData
      });
      
    default:
      throw new Error(`Unknown sync task type: ${task.type}`);
  }
}

/**
 * Notification Handlers
 */
async function showNotification(notification) {
  await self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: notification.icon || '/icons/icon-192x192.png',
    badge: notification.badge || '/icons/badge-72x72.png',
    data: notification.data || {},
    actions: notification.actions || [],
    requireInteraction: notification.requireInteraction || false,
    silent: notification.silent || false,
    vibrate: notification.vibrate || [200, 100, 200]
  });
}

async function showUpdateNotification() {
  await self.registration.showNotification('App Update Available', {
    body: 'A new version of HigherUp.ai is available. Click to update.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { action: 'update' },
    actions: [
      { action: 'update', title: 'Update Now' },
      { action: 'dismiss', title: 'Later' }
    ],
    requireInteraction: true
  });
}

async function showOfflineIndicator() {
  await self.registration.showNotification('You are offline', {
    body: 'Some features may be limited while offline.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { action: 'offline' },
    silent: true,
    requireInteraction: false
  });
}

async function handleNotificationClick(action, data) {
  const clients = await self.clients.matchAll({ type: 'window' });
  
  switch (action) {
    case 'update':
      // Trigger app update
      self.skipWaiting();
      break;
      
    case 'open_dashboard':
      const dashboardUrl = '/dashboard';
      const dashboardClient = clients.find(client => client.url.includes('/dashboard'));
      if (dashboardClient) {
        await dashboardClient.focus();
      } else {
        await self.clients.openWindow(dashboardUrl);
      }
      break;
      
    default:
      // Default action - focus or open app
      if (clients.length > 0) {
        await clients[0].focus();
      } else {
        await self.clients.openWindow('/');
      }
  }
}

/**
 * Cache Status
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      size: keys.length,
      urls: keys.map(request => request.url)
    };
  }
  
  return {
    caches: status,
    syncQueue: syncQueue.length,
    isOnline,
    version: CACHE_VERSION
  };
}

console.log('🚀 Advanced Service Worker loaded');
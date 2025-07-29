// Service Worker for HigherUp.ai PWA
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'higherup-ai-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical static files
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    handleFetch(request)
  );
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Handle different types of requests
    if (isStaticAsset(url)) {
      return await handleStaticAsset(request);
    } else if (isAPIRequest(url)) {
      return await handleAPIRequest(request);
    } else if (isNavigationRequest(request)) {
      return await handleNavigationRequest(request);
    } else {
      return await handleDynamicRequest(request);
    }
  } catch (error) {
    console.error('❌ Fetch error:', error);
    return await handleOfflineFallback(request);
  }
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || url.hostname.includes('supabase');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('📦 Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Network error for static asset:', error);
    throw error;
  }
}

// Network-first strategy for API requests
async function handleAPIRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      cache.put(request, networkResponse.clone());
      console.log('🌐 API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📦 Serving API from cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add offline indicator to cached API responses
      const response = cachedResponse.clone();
      const data = await response.json();
      data._offline = true;
      
      return new Response(JSON.stringify(data), {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker-Cache'
        }
      });
    }
    
    throw error;
  }
}

// Cache-first strategy for navigation requests
async function handleNavigationRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('📦 Serving navigation from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Serve offline page for navigation requests
    return await handleOfflineFallback(request);
  }
}

// Stale-while-revalidate strategy for dynamic content
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Serve from cache immediately if available
  if (cachedResponse) {
    console.log('📦 Serving from cache (stale-while-revalidate):', request.url);
    
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      })
      .catch(() => {
        // Ignore network errors for background updates
      });
    
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return await handleOfflineFallback(request);
  }
}

// Handle offline fallbacks
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  if (isNavigationRequest(request)) {
    // Serve offline page for navigation
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/');
    
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  if (isStaticAsset(url)) {
    // Serve placeholder for images
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#999">Offline</text></svg>',
        {
          headers: {
            'Content-Type': 'image/svg+xml',
            'X-Served-By': 'ServiceWorker-Offline'
          }
        }
      );
    }
  }
  
  // Generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline',
      _offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'ServiceWorker-Offline'
      }
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'data-sync') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions());
  } else if (event.tag === 'analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncOfflineData() {
  try {
    console.log('🔄 Syncing offline data');
    
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    for (const item of offlineData) {
      try {
        await syncDataItem(item);
        await removeOfflineDataItem(item.id);
      } catch (error) {
        console.error('❌ Failed to sync data item:', error);
      }
    }
    
    // Notify clients of sync completion
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_SUCCESS',
          payload: { tag: 'data-sync', count: offlineData.length }
        });
      });
    });
    
    console.log('✅ Offline data sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_FAILED',
          payload: { tag: 'data-sync', error: error.message }
        });
      });
    });
  }
}

async function syncOfflineActions() {
  console.log('🔄 Syncing offline actions');
  // Implementation for syncing offline user actions
}

async function syncAnalytics() {
  console.log('📊 Syncing analytics data');
  // Implementation for syncing analytics data
}

async function getOfflineData() {
  // Get offline data from storage
  return [];
}

async function syncDataItem(item) {
  // Sync individual data item to server
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.statusText}`);
  }
}

async function removeOfflineDataItem(id) {
  // Remove synced item from offline storage
  console.log('🗑️ Removing synced offline data item:', id);
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    image: data.image,
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'open') {
    // Open the app
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, config, capability } = event.data;
  
  switch (type) {
    case 'CONFIGURE_BACKGROUND_SYNC':
      console.log('⚙️ Configuring background sync:', config);
      break;
      
    case 'CONFIGURE_PUSH_NOTIFICATIONS':
      console.log('⚙️ Configuring push notifications:', config);
      break;
      
    case 'CONFIGURE_CACHE':
      console.log('⚙️ Configuring cache for capability:', capability);
      configureCacheForCapability(capability);
      break;
      
    case 'NETWORK_STATUS_CHANGED':
      console.log('🌐 Network status changed:', event.data.isOnline);
      break;
      
    case 'CONNECTION_CHANGED':
      console.log('🌐 Connection changed:', event.data.effectiveType);
      break;
      
    default:
      console.log('📨 Unknown message type:', type);
  }
});

function configureCacheForCapability(capability) {
  // Configure caching strategy based on capability settings
  console.log(`⚙️ Configuring cache for: ${capability.feature_name}`);
  
  // This would update the caching strategy for specific features
  // Implementation would depend on the specific capability requirements
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('🔄 Periodic sync triggered:', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  console.log('🔄 Syncing content in background');
  // Implementation for periodic content sync
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});

console.log('🚀 Service Worker loaded and ready');
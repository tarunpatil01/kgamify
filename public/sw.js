/* eslint-env serviceworker */

// Skip all service worker functionality in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  // In development, immediately skip waiting and don't cache anything
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.all([
        // Clear all caches in development
        caches.keys().then((cacheNames) => {
          return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }),
        self.clients.claim()
      ])
    );
  });

  // In development, don't intercept any fetch requests - let them go to the network
  self.addEventListener('fetch', (event) => {
    // Do nothing - let all requests go through normally
    return;
  });

  // Stop executing the rest of the service worker code
  return;
}

const CACHE_NAME = 'kgamify-mobile-v2';
const RUNTIME_CACHE = 'kgamify-runtime-v2';
const IMAGES_CACHE = 'kgamify-images-v2';
const API_CACHE = 'kgamify-api-v2';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/App.css',
  '/src/styles/mobile.css',
  '/src/assets/KLOGO.png',
  '/src/assets/dashboard.png',
  '/manifest.json'
];

// Mobile-specific assets
const MOBILE_ASSETS = [
  '/src/components/MobileComponents.jsx',
  '/src/components/MobileNavigation.jsx',
  '/src/hooks/useMobile.js'
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.kgamify\.com\//,
  /^https:\/\/.*\.cloudinary\.com\//,
  /\/api\//
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache core assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([...PRECACHE_ASSETS, ...MOBILE_ASSETS]);
      }),
      // Initialize other caches
      caches.open(RUNTIME_CACHE),
      caches.open(IMAGES_CACHE),
      caches.open(API_CACHE)
    ]).catch(() => {
      // Silently handle precaching errors
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes('kgamify-mobile-v2') && !cacheName.includes('kgamify-runtime-v2') && 
                !cacheName.includes('kgamify-images-v2') && !cacheName.includes('kgamify-api-v2')) {
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement mobile-optimized caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests that aren't APIs or assets
  if (url.origin !== location.origin && !isApiRequest(url) && !isAssetRequest(url)) {
    return;
  }

  event.respondWith(handleMobileFetch(request));
});

// Mobile-optimized fetch handling
async function handleMobileFetch(request) {
  const url = new URL(request.url);
  
  try {
    // API requests - Network First with cache fallback
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request, API_CACHE);
    }
    
    // Images - Cache First with network fallback (mobile optimization)
    if (isImageRequest(url)) {
      return await cacheFirstStrategy(request, IMAGES_CACHE);
    }
    
    // HTML pages - Stale While Revalidate
    if (isPageRequest(url)) {
      return await staleWhileRevalidateStrategy(request, RUNTIME_CACHE);
    }
    
    // JavaScript, CSS, and mobile components - Cache First
    if (isStaticAsset(url) || isMobileAsset(url)) {
      return await cacheFirstStrategy(request, RUNTIME_CACHE);
    }
    
    // Default to network
    return await fetch(request);
    
  } catch (error) {
    return await handleFetchError(request, error);
  }
}

// Network First Strategy - good for API calls
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses (with mobile-specific headers)
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache First Strategy - good for assets (mobile optimized)
async function cacheFirstStrategy(request, cacheName) {
  // Skip caching for unsupported schemes
  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol)) {
    return fetch(request);
  }
  
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background for mobile assets
    if (isMobileAsset(url)) {
      fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
      }).catch(() => {
        // Ignore background update errors
      });
    }
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Stale While Revalidate Strategy - good for HTML pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch fresh version in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cache
  });
  
  // Return cache immediately if available, otherwise wait for network
  return cachedResponse || await fetchPromise;
}

// Enhanced error handling for mobile
async function handleFetchError(request, error) {
  const url = new URL(request.url);
  
  // For page requests, return offline page if available
  if (isPageRequest(url)) {
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // For image requests, return placeholder if available
  if (isImageRequest(url)) {
    const cache = await caches.open(IMAGES_CACHE);
    const placeholder = await cache.match('/src/assets/placeholder.png');
    if (placeholder) {
      return placeholder;
    }
  }
  
  // For API requests, return cached response or error response
  if (isApiRequest(url)) {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Please check your connection and try again.',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  throw error;
}

// Helper functions to categorize requests
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.href)) ||
         url.pathname.startsWith('/api/');
}

function isAssetRequest(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname) ||
         url.hostname.includes('cloudinary.com');
}

function isPageRequest(url) {
  return url.origin === location.origin && 
         (url.pathname === '/' || 
          url.pathname.endsWith('.html') ||
          !url.pathname.includes('.'));
}

function isStaticAsset(url) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname);
}

function isMobileAsset(url) {
  return url.pathname.includes('Mobile') || 
         url.pathname.includes('mobile') ||
         url.pathname.includes('useMobile');
}

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
  
  if (event.tag === 'job-application-sync') {
    event.waitUntil(syncJobApplications());
  }
  
  if (event.tag === 'email-notification-sync') {
    event.waitUntil(syncEmailNotifications());
  }
});

async function doBackgroundSync() {
  // Handle any pending offline actions
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('offline-action')) {
        // Process offline actions when back online
        await processOfflineAction(request);
      }
    }
  } catch (error) {
    // Background sync failed - handled gracefully
  }
}

async function syncJobApplications() {
  // Sync job applications when back online
  try {
    const response = await fetch('/api/applications/sync');
    if (response.ok) {
      // Job applications synced successfully
    }
  } catch (error) {
    // Job application sync failed - handled
  }
}

async function syncEmailNotifications() {
  // Sync pending email notifications
  try {
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      // Email notifications synced successfully
    }
  } catch (error) {
    // Email notification sync failed - handled
  }
}

async function processOfflineAction(request) {
  // Process offline actions like job applications, form submissions
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Remove from offline cache after successful sync
      const cache = await caches.open(API_CACHE);
      await cache.delete(request);
    }
  } catch (error) {
    // Failed to process offline action - handled
  }
}

// Enhanced push notifications for job portal
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'KGamify', body: event.data.text() };
    }
  }
  
  const options = {
    title: data.title || 'KGamify Job Portal',
    body: data.body || 'New notification',
    icon: '/src/assets/KLOGO.png',
    badge: '/src/assets/KLOGO.png',
    image: data.image || '/src/assets/dashboard.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || Date.now(),
      type: data.type || 'general',
      jobId: data.jobId,
      applicationId: data.applicationId,
      url: data.url || '/'
    },
    actions: getNotificationActions(data.type),
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || 'kgamify-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'job-application':
      return [
        { action: 'view', title: 'View Application', icon: '/src/assets/view-icon.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/src/assets/dismiss-icon.png' }
      ];
    case 'job-posted':
      return [
        { action: 'view', title: 'View Job', icon: '/src/assets/view-icon.png' },
        { action: 'share', title: 'Share', icon: '/src/assets/share-icon.png' }
      ];
    case 'application-status':
      return [
        { action: 'view', title: 'View Details', icon: '/src/assets/view-icon.png' },
        { action: 'apply-more', title: 'Find More Jobs', icon: '/src/assets/search-icon.png' }
      ];
    default:
      return [
        { action: 'view', title: 'View', icon: '/src/assets/view-icon.png' }
      ];
  }
}

// Handle notification clicks with mobile-optimized navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data;
  let url = '/';
  
  // Handle action clicks
  if (event.action) {
    switch (event.action) {
      case 'view':
        if (data.type === 'job-application' && data.applicationId) {
          url = `/applications/${data.applicationId}`;
        } else if (data.type === 'job-posted' && data.jobId) {
          url = `/jobs/${data.jobId}`;
        } else if (data.url) {
          url = data.url;
        }
        break;
      case 'share':
        // Handle sharing (could open share dialog)
        url = data.url || '/';
        break;
      case 'apply-more':
        url = '/jobs';
        break;
      case 'dismiss':
        return; // Just close notification
      default:
        url = data.url || '/';
    }
  } else {
    // Default click action
    url = data.url || '/';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open
      for (const client of clientList) {
        if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window/tab if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  const data = event.notification.data;
  
  // Track notification dismissal for analytics
  if (data && data.type) {
    // Could send analytics data here
    // Notification dismissed - event handled
  }
});

// Message handling for communication with the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CACHE_URLS':
        event.waitUntil(cacheUrls(event.data.payload));
        break;
      case 'CLEAR_CACHE':
        event.waitUntil(clearCache(event.data.payload));
        break;
      case 'GET_CACHE_SIZE':
        event.waitUntil(getCacheSize().then(size => {
          event.ports[0].postMessage({ type: 'CACHE_SIZE', payload: size });
        }));
        break;
    }
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.addAll(urls);
}

async function clearCache(cacheNames) {
  if (cacheNames) {
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
  } else {
    const allCaches = await caches.keys();
    for (const cacheName of allCaches) {
      await caches.delete(cacheName);
    }
  }
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

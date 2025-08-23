/**
 * Service Worker registration and management
 */

// Check if service workers are supported
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.PROD) {
      registerServiceWorker();
    } else {
      // In development mode, unregister any existing service workers
      unregisterServiceWorkers();
    }
  });
}

async function unregisterServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      // Service worker unregistered in development mode
    }
    
    // Force clear all caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      // Cache cleared in development
    }
    
    // No automatic reload in development - let Vite handle it
  } catch {
    // Failed to unregister service workers - error handled
  }
}

async function registerServiceWorker() {
  try {
    // Add cache-busting parameter to force service worker update
    const swUrl = `/sw.js?v=${Date.now()}`;
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    });

    // Update found
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            showUpdateNotification();
          }
        });
      }
    });

    // Service worker activated
    if (registration.active) {
      // Service worker is active and ready
    }

  } catch {
    // Service worker registration failed
  }
}

function showUpdateNotification() {
  // Create a simple notification for updates
  const notification = document.createElement('div');
  notification.id = 'sw-update-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2563eb;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 300px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: 600;">
      Update Available
    </div>
    <div style="margin-bottom: 12px; opacity: 0.9;">
      A new version of the app is ready.
    </div>
    <button id="sw-update-btn" style="
      background: white;
      color: #2563eb;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      margin-right: 8px;
    ">
      Refresh
    </button>
    <button id="sw-dismiss-btn" style="
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    ">
      Later
    </button>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Handle refresh button
  document.getElementById('sw-update-btn').addEventListener('click', () => {
    window.location.reload();
  });

  // Handle dismiss button
  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    hideUpdateNotification();
  });

  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideUpdateNotification();
  }, 10000);
}

function hideUpdateNotification() {
  const notification = document.getElementById('sw-update-notification');
  if (notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// Listen for service worker messages
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Handle cache update notifications
  }
});

// Check for app updates periodically
setInterval(() => {
  navigator.serviceWorker?.ready.then((registration) => {
    registration.update();
  });
}, 60000); // Check every minute

export { registerServiceWorker, unregisterServiceWorkers };

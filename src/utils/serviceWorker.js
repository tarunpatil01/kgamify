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
    // Register service worker without cache-busting; periodic update() will check for new versions
    const swUrl = `/sw.js`;
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/',
    });

  // Update found
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available and a previous SW controls the page
            // Only show when the new worker is actually waiting to activate
            if (registration.waiting) {
        showUpdateNotification(registration);
            }
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

function showUpdateNotification(registration) {
  // Avoid duplicate banners
  if (document.getElementById('sw-update-notification')) return;

  // Respect cooldown after dismiss (10 minutes)
  try {
    const until = parseInt(localStorage.getItem('swUpdateCooldownUntil') || '0', 10);
    if (Date.now() < until) return;
  } catch { /* ignore */ }

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
  z-index: 2147483647; /* Ensure above any app overlays/tooltips */
  pointer-events: auto; /* Guarantee clicks go to this element */
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

  // Handle refresh button: activate waiting SW then reload when controlled
  document.getElementById('sw-update-btn').addEventListener('click', () => {
    let hasReloaded = false;
    const doReload = () => {
      if (!hasReloaded) {
        hasReloaded = true;
        window.location.reload();
      }
    };

    try {
      const waiting = registration?.waiting;
      if (waiting) {
        // When the new SW takes control, reload to use the fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          doReload();
        }, { once: true });
        waiting.postMessage({ type: 'SKIP_WAITING' });
        // Fallback: if controllerchange doesn’t fire in time, reload after 1.5s
        setTimeout(doReload, 1500);
      } else {
        doReload();
      }
    } catch {
      doReload();
    }
  });

  // Handle dismiss button
  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    hideUpdateNotification();
  });
  
  // Dismiss on Escape for accessibility
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      hideUpdateNotification();
      window.removeEventListener('keydown', onKeyDown, true);
    }
  };
  window.addEventListener('keydown', onKeyDown, true);

  // Auto-hide after 15 seconds
  setTimeout(() => {
    hideUpdateNotification();
  }, 15000);
}

function hideUpdateNotification() {
  const notification = document.getElementById('sw-update-notification');
  if (notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  // Set cooldown to prevent immediate re-showing in case an update check runs again soon
  try {
    localStorage.setItem('swUpdateCooldownUntil', String(Date.now() + 10 * 60 * 1000));
  } catch { /* ignore */ }
}

// Listen for service worker messages
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Handle cache update notifications
  }
});

// Check for app updates periodically (every 15 minutes)
setInterval(() => {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) => registration?.update?.())
    .catch(() => {});
}, 15 * 60 * 1000);

export { registerServiceWorker, unregisterServiceWorkers };

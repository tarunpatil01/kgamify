/**
 * Resource preloading and prefetching utilities for better performance
 */
import { config } from '../config/env.js';

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload critical fonts
  preloadFont('/fonts/inter-var.woff2', 'woff2');
  
  // Preload hero images
  preloadImage('/src/assets/KLOGO.png');
  preloadImage('/src/assets/dashboard.png');
  
  // Preload critical API endpoints
  prefetchAPI(`${config.API_URL}/job?featured=true`);
}

/**
 * Preload a font file
 */
export function preloadFont(href, type = 'woff2') {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${type}`;
  link.href = href;
  link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
}

/**
 * Preload an image
 */
export function preloadImage(src, sizes = '') {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  if (sizes) link.sizes = sizes;
  
  document.head.appendChild(link);
  
  // Also create an Image object for immediate loading
  const img = new Image();
  img.src = src;
}

/**
 * Prefetch API data
 */
export function prefetchAPI(url, options = {}) {
  if (typeof fetch === 'undefined') return;
  
  // Only prefetch on good connections
  if (navigator.connection && navigator.connection.effectiveType === 'slow-2g') {
    return;
  }
  
  // Use a low priority fetch to avoid blocking critical resources
  const controller = new AbortController();
  
  fetch(url, {
    ...options,
    signal: controller.signal,
    priority: 'low',
  }).catch(() => {
    // Silently handle prefetch errors
  });
  
  // Cancel prefetch after 5 seconds to avoid wasting bandwidth
  setTimeout(() => controller.abort(), 5000);
}

/**
 * Prefetch a JavaScript module/chunk
 */
export function prefetchModule(modulePath) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = modulePath;
  
  document.head.appendChild(link);
}

/**
 * Intelligent route prefetching based on user interaction
 */
export class RoutePrefetcher {
  constructor() {
    this.prefetchedRoutes = new Set();
    this.intersectionObserver = null;
    this.hoverTimeout = null;
    
    this.initIntersectionObserver();
    this.setupHoverPrefetching();
  }
  
  // Prefetch routes when links come into viewport
  initIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') return;
    
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = entry.target;
            const href = link.getAttribute('href');
            if (href && !this.prefetchedRoutes.has(href)) {
              this.prefetchRoute(href);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Start prefetching 100px before link is visible
      }
    );
  }
  
  // Prefetch routes on hover/focus
  setupHoverPrefetching() {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this.isInternalLink(link)) {
        this.hoverTimeout = setTimeout(() => {
          this.prefetchRoute(link.getAttribute('href'));
        }, 100); // Small delay to avoid prefetching on quick mouse movements
      }
    });
    
    document.addEventListener('mouseout', () => {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
    });
    
    document.addEventListener('focusin', (e) => {
      const link = e.target.closest('a[href]');
      if (link && this.isInternalLink(link)) {
        this.prefetchRoute(link.getAttribute('href'));
      }
    });
  }
  
  // Observe links for viewport-based prefetching
  observeLinks() {
    if (!this.intersectionObserver) return;
    
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      if (this.isInternalLink(link)) {
        this.intersectionObserver.observe(link);
      }
    });
  }
  
  // Prefetch a specific route
  prefetchRoute(href) {
    if (!href || this.prefetchedRoutes.has(href)) return;
    
    // Skip external links and hash links
    if (href.startsWith('http') || href.startsWith('#')) return;
    
    // Skip if on slow connection
    if (navigator.connection && navigator.connection.effectiveType === 'slow-2g') {
      return;
    }
    
    this.prefetchedRoutes.add(href);
    
    // Prefetch the route component
    this.prefetchRouteComponent(href);
    
    // Prefetch potential API data for the route
    this.prefetchRouteData(href);
  }
  
  // Prefetch the JavaScript chunk for a route
  prefetchRouteComponent(href) {
    // Map routes to their component chunks
    const routeChunkMap = {
      '/login': 'pages',
      '/register': 'pages',
      '/dashboard': 'pages',
      '/jobs': 'pages',
      '/post-job': 'pages',
      '/applications': 'pages',
    };
    
    const chunkName = routeChunkMap[href];
    if (chunkName) {
      prefetchModule(`/assets/js/${chunkName}-*.js`);
    }
  }
  
  // Prefetch API data that might be needed for the route
  prefetchRouteData(href) {
    const routeDataMap = {
      '/dashboard': [`${config.API_URL}/user/stats`, `${config.API_URL}/job?recent=true`],
      '/jobs': [`${config.API_URL}/job?page=1`, `${config.API_URL}/companies`],
      '/applications': [`${config.API_URL}/applications`],
    };
    
    const endpoints = routeDataMap[href];
    if (endpoints) {
      endpoints.forEach((endpoint) => {
        prefetchAPI(endpoint);
      });
    }
  }
  
  // Check if link is internal
  isInternalLink(link) {
    const href = link.getAttribute('href');
    return href && 
           !href.startsWith('http') && 
           !href.startsWith('mailto:') && 
           !href.startsWith('tel:') &&
           !href.startsWith('#');
  }
  
  // Cleanup observers
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }
}

/**
 * Network-aware prefetching
 */
export class NetworkAwarePrefetcher {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.prefetchQueue = [];
    this.isProcessing = false;
  }
  
  // Add prefetch task to queue
  addToQueue(task) {
    this.prefetchQueue.push(task);
    this.processQueue();
  }
  
  // Process prefetch queue based on network conditions
  async processQueue() {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.prefetchQueue.length > 0) {
      // Check network conditions
      if (!this.shouldPrefetch()) {
        break;
      }
      
      const task = this.prefetchQueue.shift();
      try {
        await task();
      } catch {
        // Silently handle prefetch errors
      }
      
      // Add delay between prefetches to avoid overwhelming the network
      await this.delay(100);
    }
    
    this.isProcessing = false;
  }
  
  // Determine if we should prefetch based on network conditions
  shouldPrefetch() {
    if (!this.connection) return true; // Assume good connection if not available
    
    const { effectiveType, saveData, downlink } = this.connection;
    
    // Don't prefetch on slow connections
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return false;
    }
    
    // Don't prefetch if user has data saver enabled
    if (saveData) {
      return false;
    }
    
    // Don't prefetch on very slow connections (< 0.5 Mbps)
    if (downlink && downlink < 0.5) {
      return false;
    }
    
    return true;
  }
  
  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global prefetcher instances
let routePrefetcher = null;
let networkPrefetcher = null;

/**
 * Initialize prefetching system
 */
export function initializePrefetching() {
  if (typeof window === 'undefined') return;
  
  routePrefetcher = new RoutePrefetcher();
  networkPrefetcher = new NetworkAwarePrefetcher();
  
  // Start observing links after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      routePrefetcher.observeLinks();
    });
  } else {
    routePrefetcher.observeLinks();
  }
  
  // Re-observe links when new content is added
  const observer = new MutationObserver(() => {
    routePrefetcher.observeLinks();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    routePrefetcher.destroy();
    observer.disconnect();
  });
}

export { routePrefetcher, networkPrefetcher };

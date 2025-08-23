/**
 * Critical CSS extraction and inlining utilities
 * This helps improve first paint performance by inlining critical styles
 */

// Critical CSS for above-the-fold content
export const criticalCSS = `
  /* Reset and base styles for immediate rendering */
  * {
    box-sizing: border-box;
  }
  
  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
  }
  
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background-color: #ffffff;
    color: #1f2937;
  }
  
  /* Critical layout styles */
  .min-h-screen {
    min-height: 100vh;
  }
  
  .flex {
    display: flex;
  }
  
  .flex-col {
    flex-direction: column;
  }
  
  .flex-grow {
    flex-grow: 1;
  }
  
  /* Navigation critical styles */
  .navbar {
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  /* Loading spinner critical styles */
  .loading-spinner {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    border: 2px solid #e5e7eb;
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Hero section critical styles */
  .hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
  }
  
  .hero h1 {
    font-size: 3rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    line-height: 1.2;
  }
  
  .hero p {
    font-size: 1.25rem;
    margin: 0 0 2rem 0;
    opacity: 0.9;
  }
  
  /* Button critical styles */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: #3b82f6;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #2563eb;
  }
  
  /* Form critical styles */
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  /* Grid critical styles */
  .grid {
    display: grid;
  }
  
  .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  @media (min-width: 768px) {
    .md\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  
  @media (min-width: 1024px) {
    .lg\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  
  .gap-4 {
    gap: 1rem;
  }
  
  .gap-6 {
    gap: 1.5rem;
  }
  
  /* Spacing utilities */
  .p-4 {
    padding: 1rem;
  }
  
  .p-6 {
    padding: 1.5rem;
  }
  
  .m-0 {
    margin: 0;
  }
  
  .mb-4 {
    margin-bottom: 1rem;
  }
  
  .mt-8 {
    margin-top: 2rem;
  }
  
  /* Text utilities */
  .text-center {
    text-align: center;
  }
  
  .text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
  
  .text-2xl {
    font-size: 1.5rem;
    line-height: 2rem;
  }
  
  .font-bold {
    font-weight: 700;
  }
  
  .font-semibold {
    font-weight: 600;
  }
  
  /* Background utilities */
  .bg-white {
    background-color: #ffffff;
  }
  
  .bg-gray-50 {
    background-color: #f9fafb;
  }
  
  .bg-gray-100 {
    background-color: #f3f4f6;
  }
  
  /* Border utilities */
  .border {
    border-width: 1px;
  }
  
  .border-gray-200 {
    border-color: #e5e7eb;
  }
  
  .rounded {
    border-radius: 0.25rem;
  }
  
  .rounded-lg {
    border-radius: 0.5rem;
  }
  
  /* Shadow utilities */
  .shadow {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }
  
  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  /* Responsive utilities */
  .hidden {
    display: none;
  }
  
  @media (min-width: 768px) {
    .md\\:block {
      display: block;
    }
    
    .md\\:hidden {
      display: none;
    }
  }
`;

/**
 * Inject critical CSS into the document head
 * This should be called as early as possible in the app lifecycle
 */
export function injectCriticalCSS() {
  if (typeof document === 'undefined') return;
  
  // Check if critical CSS is already injected
  if (document.getElementById('critical-css')) return;
  
  const style = document.createElement('style');
  style.id = 'critical-css';
  style.innerHTML = criticalCSS;
  
  // Insert before any existing stylesheets to ensure proper cascade
  const firstLink = document.head.querySelector('link[rel="stylesheet"]');
  if (firstLink) {
    document.head.insertBefore(style, firstLink);
  } else {
    document.head.appendChild(style);
  }
}

/**
 * Load non-critical CSS asynchronously
 * This prevents render blocking while still loading necessary styles
 */
export function loadNonCriticalCSS(href, media = 'all') {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = function() {
    this.onload = null;
    this.rel = 'stylesheet';
    this.media = media;
  };
  
  document.head.appendChild(link);
  
  // Fallback for browsers that don't support preload
  const fallback = document.createElement('noscript');
  const fallbackLink = document.createElement('link');
  fallbackLink.rel = 'stylesheet';
  fallbackLink.href = href;
  fallbackLink.media = media;
  fallback.appendChild(fallbackLink);
  document.head.appendChild(fallback);
}

/**
 * Get critical CSS for specific components/pages
 */
export const getCriticalCSSForPage = (pageName) => {
  const pageSpecificCSS = {
    login: `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .login-form {
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        width: 100%;
        max-width: 400px;
      }
    `,
    
    dashboard: `
      .dashboard-header {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        padding: 1.5rem 0;
        margin-bottom: 2rem;
      }
      
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }
      
      .dashboard-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
    `,
    
    jobs: `
      .job-filters {
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .job-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        transition: box-shadow 0.2s;
      }
      
      .job-card:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }
    `
  };
  
  return pageSpecificCSS[pageName] || '';
};

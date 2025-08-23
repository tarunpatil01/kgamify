/**
 * Dashboard Configuration
 * Centralized configuration for dashboard components and features
 */

export const DASHBOARD_CONFIG = {
  // Pagination
  DEFAULT_ITEMS_PER_PAGE: 10,
  MAX_ITEMS_PER_PAGE: 50,
  
  // Refresh intervals (in milliseconds)
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  STATS_REFRESH_INTERVAL: 60000, // 1 minute
  
  // Chart configuration
  CHART_COLORS: {
    primary: '#ff6b35',
    secondary: '#1a202c',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  
  // Job status colors
  JOB_STATUS_COLORS: {
    active: '#10b981',
    inactive: '#6b7280',
    closed: '#ef4444',
    draft: '#f59e0b'
  },
  
  // Application status colors
  APPLICATION_STATUS_COLORS: {
    pending: '#f59e0b',
    reviewing: '#3b82f6',
    interviewing: '#8b5cf6',
    offered: '#10b981',
    rejected: '#ef4444',
    withdrawn: '#6b7280'
  },
  
  // Default filters
  DEFAULT_FILTERS: {
    status: 'all',
    type: 'all',
    sortBy: 'datePosted',
    sortOrder: 'desc'
  },
  
  // Date formats
  DATE_FORMATS: {
    short: 'MMM DD, YYYY',
    long: 'MMMM DD, YYYY',
    datetime: 'MMM DD, YYYY h:mm A',
    relative: true // Use relative time (e.g., "2 days ago")
  },
  
  // Dashboard widgets
  DASHBOARD_WIDGETS: {
    jobStats: {
      enabled: true,
      refreshInterval: 60000,
      charts: ['total', 'active', 'recent']
    },
    applicationStats: {
      enabled: true,
      refreshInterval: 30000,
      charts: ['total', 'pending', 'success_rate']
    },
    recentActivity: {
      enabled: true,
      maxItems: 10,
      refreshInterval: 15000
    },
    analytics: {
      enabled: true,
      refreshInterval: 300000, // 5 minutes
      charts: ['views', 'applications', 'conversion']
    }
  },
  
  // Performance settings
  PERFORMANCE: {
    enableVirtualScrolling: true,
    lazyLoadImages: true,
    cacheTimeout: 300000, // 5 minutes
    batchSize: 20
  },
  
  // Mobile breakpoints
  BREAKPOINTS: {
    mobile: 768,
    tablet: 1024,
    desktop: 1280
  },
  
  // Animation settings
  ANIMATIONS: {
    duration: 200,
    easing: 'ease-in-out',
    enableReducedMotion: true
  }
};

export const MOCK_DASHBOARD_DATA = {
  stats: {
    totalJobs: 2,
    totalApplications: 0,
    activeJobs: 2,
    recentJobs: 1
  },
  recentActivity: [
    {
      id: 1,
      type: 'job_posted',
      title: 'New job posted',
      description: 'Software Engineer position',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      icon: 'briefcase'
    }
  ],
  chartData: {
    applications: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [12, 19, 3, 5, 2, 3]
    },
    jobViews: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [45, 52, 38, 65, 71, 43, 28]
    }
  }
};

export default DASHBOARD_CONFIG;

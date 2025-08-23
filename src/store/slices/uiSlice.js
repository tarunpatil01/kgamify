import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for UI operations
export const showNotification = createAsyncThunk(
  'ui/showNotification',
  async ({ message, type = 'info', duration = 5000 }, { dispatch }) => {
    const id = Date.now().toString();
    const notification = { id, message, type, timestamp: Date.now() };
    
    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch(dismissNotification(id));
      }, duration);
    }
    
    return notification;
  }
);

export const preloadRoute = createAsyncThunk(
  'ui/preloadRoute',
  async (route, { rejectWithValue }) => {
    try {
      // Simulate route preloading
      await new Promise(resolve => setTimeout(resolve, 100));
      return route;
    } catch {
      return rejectWithValue(`Failed to preload route: ${route}`);
    }
  }
);

const initialState = {
  // Layout & Navigation
  sidebarOpen: false,
  mobileMenuOpen: false,
  currentRoute: '/',
  previousRoute: null,
  preloadedRoutes: [],
  
  // Theme & Appearance
  theme: 'light', // 'light', 'dark', 'auto'
  colorScheme: 'blue', // 'blue', 'green', 'purple', 'orange'
  fontSize: 'medium', // 'small', 'medium', 'large'
  compactMode: false,
  animations: true,
  
  // Loading States
  globalLoading: false,
  routeLoading: false,
  backgroundTasks: 0,
  loadingQueue: [],
  
  // Notifications & Alerts
  notifications: [],
  alerts: [],
  toasts: [],
  
  // Modals & Dialogs
  modals: {
    jobDetails: { open: false, jobId: null },
    applicationForm: { open: false, jobId: null },
    confirmDialog: { open: false, message: '', onConfirm: null, onCancel: null },
    userProfile: { open: false },
    settings: { open: false },
    help: { open: false }
  },
  
  // Search & Filters UI
  searchBarFocused: false,
  filtersExpanded: false,
  advancedSearchOpen: false,
  recentSearches: [],
  searchSuggestions: [],
  
  // Data Tables & Lists
  tableView: 'grid', // 'grid', 'list', 'table'
  sortDirection: 'desc',
  selectedItems: [],
  bulkActions: false,
  
  // User Preferences
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    autoSave: true,
    confirmDeleteActions: true,
    showWelcomeTour: true,
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  },
  
  // Performance & Caching
  viewportSize: { width: 1920, height: 1080 },
  deviceType: 'desktop', // 'mobile', 'tablet', 'desktop'
  connectionType: 'wifi', // 'wifi', '4g', '3g', 'slow-2g'
  offlineMode: false,
  
  // Error States
  errors: [],
  criticalError: null,
  
  // Feature Flags
  features: {
    virtualScrolling: true,
    lazyLoading: true,
    preloadRoutes: true,
    backgroundSync: true,
    offlineSupport: true,
    betaFeatures: false
  },
  
  // Accessibility
  accessibility: {
    screenReader: false,
    highContrast: false,
    reducedMotion: false,
    fontSize: 'normal',
    keyboardNavigation: false
  },
  
  // Development
  debugMode: false,
  performanceMetrics: {
    renderTime: 0,
    loadTime: 0,
    memoryUsage: 0
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout & Navigation
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    },
    
    setCurrentRoute: (state, action) => {
      state.previousRoute = state.currentRoute;
      state.currentRoute = action.payload;
    },
    
    // Theme & Appearance
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    
    setColorScheme: (state, action) => {
      state.colorScheme = action.payload;
    },
    
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
    },
    
    toggleAnimations: (state) => {
      state.animations = !state.animations;
    },
    
    // Loading States
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },
    
    setRouteLoading: (state, action) => {
      state.routeLoading = action.payload;
    },
    
    incrementBackgroundTasks: (state) => {
      state.backgroundTasks += 1;
    },
    
    decrementBackgroundTasks: (state) => {
      state.backgroundTasks = Math.max(0, state.backgroundTasks - 1);
    },
    
    addToLoadingQueue: (state, action) => {
      state.loadingQueue.push(action.payload);
    },
    
    removeFromLoadingQueue: (state, action) => {
      state.loadingQueue = state.loadingQueue.filter(item => item.id !== action.payload);
    },
    
    // Notifications & Alerts
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    
    dismissNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    addAlert: (state, action) => {
      state.alerts.push(action.payload);
    },
    
    dismissAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
    
    addToast: (state, action) => {
      state.toasts.push(action.payload);
    },
    
    dismissToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    
    // Modals & Dialogs
    openModal: (state, action) => {
      const { modalName, data = {} } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = { ...state.modals[modalName], open: true, ...data };
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName] = { ...initialState.modals[modalName] };
      }
    },
    
    closeAllModals: (state) => {
      state.modals = { ...initialState.modals };
    },
    
    // Search & Filters UI
    setSearchBarFocused: (state, action) => {
      state.searchBarFocused = action.payload;
    },
    
    toggleFiltersExpanded: (state) => {
      state.filtersExpanded = !state.filtersExpanded;
    },
    
    setAdvancedSearchOpen: (state, action) => {
      state.advancedSearchOpen = action.payload;
    },
    
    addRecentSearch: (state, action) => {
      const search = action.payload;
      state.recentSearches = [
        search,
        ...state.recentSearches.filter(s => s !== search)
      ].slice(0, 10); // Keep only last 10 searches
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    
    setSearchSuggestions: (state, action) => {
      state.searchSuggestions = action.payload;
    },
    
    // Data Tables & Lists
    setTableView: (state, action) => {
      state.tableView = action.payload;
    },
    
    setSortDirection: (state, action) => {
      state.sortDirection = action.payload;
    },
    
    setSelectedItems: (state, action) => {
      state.selectedItems = action.payload;
    },
    
    toggleItemSelection: (state, action) => {
      const itemId = action.payload;
      const index = state.selectedItems.indexOf(itemId);
      if (index > -1) {
        state.selectedItems.splice(index, 1);
      } else {
        state.selectedItems.push(itemId);
      }
    },
    
    selectAllItems: (state, action) => {
      state.selectedItems = action.payload;
    },
    
    clearSelection: (state) => {
      state.selectedItems = [];
    },
    
    toggleBulkActions: (state) => {
      state.bulkActions = !state.bulkActions;
    },
    
    // User Preferences
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    resetPreferences: (state) => {
      state.preferences = initialState.preferences;
    },
    
    // Performance & Caching
    setViewportSize: (state, action) => {
      state.viewportSize = action.payload;
    },
    
    setDeviceType: (state, action) => {
      state.deviceType = action.payload;
    },
    
    setConnectionType: (state, action) => {
      state.connectionType = action.payload;
    },
    
    setOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
    },
    
    // Error States
    addError: (state, action) => {
      state.errors.push({
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...action.payload
      });
    },
    
    removeError: (state, action) => {
      state.errors = state.errors.filter(error => error.id !== action.payload);
    },
    
    clearErrors: (state) => {
      state.errors = [];
    },
    
    setCriticalError: (state, action) => {
      state.criticalError = action.payload;
    },
    
    clearCriticalError: (state) => {
      state.criticalError = null;
    },
    
    // Feature Flags
    toggleFeature: (state, action) => {
      const feature = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.features, feature)) {
        state.features[feature] = !state.features[feature];
      }
    },
    
    setFeatures: (state, action) => {
      state.features = { ...state.features, ...action.payload };
    },
    
    // Accessibility
    updateAccessibility: (state, action) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },
    
    toggleHighContrast: (state) => {
      state.accessibility.highContrast = !state.accessibility.highContrast;
    },
    
    toggleReducedMotion: (state) => {
      state.accessibility.reducedMotion = !state.accessibility.reducedMotion;
    },
    
    // Development
    toggleDebugMode: (state) => {
      state.debugMode = !state.debugMode;
    },
    
    updatePerformanceMetrics: (state, action) => {
      state.performanceMetrics = { ...state.performanceMetrics, ...action.payload };
    },
    
    // Utility actions
    resetUI: (state) => {
      // Reset to initial state but preserve user preferences
      const savedPreferences = state.preferences;
      const savedAccessibility = state.accessibility;
      const savedFeatures = state.features;
      
      Object.assign(state, initialState);
      state.preferences = savedPreferences;
      state.accessibility = savedAccessibility;
      state.features = savedFeatures;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Show notification
      .addCase(showNotification.fulfilled, (state, action) => {
        state.notifications.push(action.payload);
      })
      
      // Preload route
      .addCase(preloadRoute.pending, (state) => {
        state.routeLoading = true;
      })
      .addCase(preloadRoute.fulfilled, (state, action) => {
        state.routeLoading = false;
        if (!state.preloadedRoutes.includes(action.payload)) {
          state.preloadedRoutes.push(action.payload);
        }
      })
      .addCase(preloadRoute.rejected, (state, action) => {
        state.routeLoading = false;
        state.errors.push({
          id: Date.now().toString(),
          message: action.payload,
          type: 'error',
          timestamp: Date.now()
        });
      });
  }
});

export const {
  // Layout & Navigation
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setCurrentRoute,
  
  // Theme & Appearance
  setTheme,
  setColorScheme,
  setFontSize,
  toggleCompactMode,
  toggleAnimations,
  
  // Loading States
  setGlobalLoading,
  setRouteLoading,
  incrementBackgroundTasks,
  decrementBackgroundTasks,
  addToLoadingQueue,
  removeFromLoadingQueue,
  
  // Notifications & Alerts
  addNotification,
  dismissNotification,
  clearAllNotifications,
  addAlert,
  dismissAlert,
  addToast,
  dismissToast,
  
  // Modals & Dialogs
  openModal,
  closeModal,
  closeAllModals,
  
  // Search & Filters UI
  setSearchBarFocused,
  toggleFiltersExpanded,
  setAdvancedSearchOpen,
  addRecentSearch,
  clearRecentSearches,
  setSearchSuggestions,
  
  // Data Tables & Lists
  setTableView,
  setSortDirection,
  setSelectedItems,
  toggleItemSelection,
  selectAllItems,
  clearSelection,
  toggleBulkActions,
  
  // User Preferences
  updatePreferences,
  resetPreferences,
  
  // Performance & Caching
  setViewportSize,
  setDeviceType,
  setConnectionType,
  setOfflineMode,
  
  // Error States
  addError,
  removeError,
  clearErrors,
  setCriticalError,
  clearCriticalError,
  
  // Feature Flags
  toggleFeature,
  setFeatures,
  
  // Accessibility
  updateAccessibility,
  toggleHighContrast,
  toggleReducedMotion,
  
  // Development
  toggleDebugMode,
  updatePerformanceMetrics,
  
  // Utility
  resetUI
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectMobileMenuOpen = (state) => state.ui.mobileMenuOpen;
export const selectCurrentRoute = (state) => state.ui.currentRoute;
export const selectPreviousRoute = (state) => state.ui.previousRoute;

export const selectTheme = (state) => state.ui.theme;
export const selectColorScheme = (state) => state.ui.colorScheme;
export const selectFontSize = (state) => state.ui.fontSize;
export const selectCompactMode = (state) => state.ui.compactMode;
export const selectAnimations = (state) => state.ui.animations;

export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectRouteLoading = (state) => state.ui.routeLoading;
export const selectBackgroundTasks = (state) => state.ui.backgroundTasks;
export const selectLoadingQueue = (state) => state.ui.loadingQueue;

export const selectNotifications = (state) => state.ui.notifications;
export const selectAlerts = (state) => state.ui.alerts;
export const selectToasts = (state) => state.ui.toasts;

export const selectModals = (state) => state.ui.modals;
export const selectModalOpen = (state, modalName) => state.ui.modals[modalName]?.open || false;

export const selectSearchBarFocused = (state) => state.ui.searchBarFocused;
export const selectFiltersExpanded = (state) => state.ui.filtersExpanded;
export const selectAdvancedSearchOpen = (state) => state.ui.advancedSearchOpen;
export const selectRecentSearches = (state) => state.ui.recentSearches;
export const selectSearchSuggestions = (state) => state.ui.searchSuggestions;

export const selectTableView = (state) => state.ui.tableView;
export const selectSortDirection = (state) => state.ui.sortDirection;
export const selectSelectedItems = (state) => state.ui.selectedItems;
export const selectBulkActions = (state) => state.ui.bulkActions;

export const selectPreferences = (state) => state.ui.preferences;
export const selectPreference = (state, key) => state.ui.preferences[key];

export const selectViewportSize = (state) => state.ui.viewportSize;
export const selectDeviceType = (state) => state.ui.deviceType;
export const selectConnectionType = (state) => state.ui.connectionType;
export const selectOfflineMode = (state) => state.ui.offlineMode;

export const selectErrors = (state) => state.ui.errors;
export const selectCriticalError = (state) => state.ui.criticalError;
export const selectHasErrors = (state) => state.ui.errors.length > 0 || !!state.ui.criticalError;

export const selectFeatures = (state) => state.ui.features;
export const selectFeature = (state, feature) => state.ui.features[feature];

export const selectAccessibility = (state) => state.ui.accessibility;
export const selectHighContrast = (state) => state.ui.accessibility.highContrast;
export const selectReducedMotion = (state) => state.ui.accessibility.reducedMotion;

export const selectDebugMode = (state) => state.ui.debugMode;
export const selectPerformanceMetrics = (state) => state.ui.performanceMetrics;

// Complex selectors
export const selectIsLoading = (state) => 
  state.ui.globalLoading || state.ui.routeLoading || state.ui.backgroundTasks > 0;

export const selectNotificationsByType = (state, type) =>
  state.ui.notifications.filter(notification => notification.type === type);

export const selectUnreadNotifications = (state) =>
  state.ui.notifications.filter(notification => !notification.read);

export const selectActiveModal = (state) => {
  const modals = state.ui.modals;
  for (const [name, modal] of Object.entries(modals)) {
    if (modal.open) return { name, ...modal };
  }
  return null;
};

export const selectIsMobile = (state) => state.ui.deviceType === 'mobile';
export const selectIsTablet = (state) => state.ui.deviceType === 'tablet';
export const selectIsDesktop = (state) => state.ui.deviceType === 'desktop';

export const selectIsSlowConnection = (state) => 
  ['3g', 'slow-2g'].includes(state.ui.connectionType);

export const selectShouldReduceData = (state) =>
  selectIsSlowConnection(state) || state.ui.offlineMode;

export default uiSlice.reducer;

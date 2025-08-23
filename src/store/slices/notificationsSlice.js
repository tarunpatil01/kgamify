import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

// Async thunks for notification operations
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        unreadOnly = false,
        type = null 
      } = params;

      const response = await apiClient.get('/notifications', {
        params: { page, limit, unreadOnly, type }
      });

      return {
        notifications: response.data.notifications,
        total: response.data.total,
        unreadCount: response.data.unreadCount,
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationIds, { rejectWithValue }) => {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      await apiClient.patch('/notifications/mark-read', { ids });
      
      return ids;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notifications as read');
    }
  }
);

export const markAsUnread = createAsyncThunk(
  'notifications/markAsUnread',
  async (notificationIds, { rejectWithValue }) => {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      await apiClient.patch('/notifications/mark-unread', { ids });
      
      return ids;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notifications as unread');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.patch('/notifications/mark-all-read');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

export const deleteNotifications = createAsyncThunk(
  'notifications/deleteNotifications',
  async (notificationIds, { rejectWithValue }) => {
    try {
      const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
      
      await apiClient.delete('/notifications/bulk-delete', { 
        data: { ids } 
      });
      
      return ids;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notifications');
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch('/notifications/settings', settings);
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notification settings');
    }
  }
);

export const getNotificationSettings = createAsyncThunk(
  'notifications/getSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/notifications/settings');
      return response.data.settings;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get notification settings');
    }
  }
);

export const testNotification = createAsyncThunk(
  'notifications/testNotification',
  async (notificationType, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/notifications/test', { type: notificationType });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send test notification');
    }
  }
);

export const subscribeToNotifications = createAsyncThunk(
  'notifications/subscribe',
  async (subscription, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/notifications/subscribe', subscription);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to subscribe to notifications');
    }
  }
);

export const unsubscribeFromNotifications = createAsyncThunk(
  'notifications/unsubscribe',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/notifications/unsubscribe');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unsubscribe from notifications');
    }
  }
);

const initialState = {
  // Notifications data
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  
  // Filters
  activeFilter: 'all', // 'all', 'unread', 'read', 'application', 'job', 'system'
  
  // Notification settings
  settings: {
    email: {
      enabled: true,
      frequency: 'immediate', // 'immediate', 'daily', 'weekly'
      types: {
        applicationUpdates: true,
        jobMatches: true,
        messages: true,
        systemUpdates: false,
        marketing: false
      }
    },
    push: {
      enabled: true,
      types: {
        applicationUpdates: true,
        jobMatches: true,
        messages: true,
        systemUpdates: false,
        marketing: false
      }
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: true,
      types: {
        applicationUpdates: true,
        jobMatches: true,
        messages: true,
        systemUpdates: true,
        marketing: false
      }
    },
    digest: {
      enabled: true,
      frequency: 'weekly',
      day: 'monday',
      time: '09:00'
    }
  },
  
  // Push notification subscription
  pushSubscription: null,
  
  // Notification types configuration
  notificationTypes: {
    application: {
      label: 'Application Updates',
      description: 'Updates about your job applications',
      icon: 'briefcase',
      color: 'blue'
    },
    job: {
      label: 'Job Matches',
      description: 'New jobs matching your preferences',
      icon: 'work',
      color: 'green'
    },
    message: {
      label: 'Messages',
      description: 'Messages from employers',
      icon: 'message',
      color: 'purple'
    },
    system: {
      label: 'System Updates',
      description: 'Platform updates and maintenance',
      icon: 'settings',
      color: 'gray'
    },
    marketing: {
      label: 'Marketing',
      description: 'Promotional content and offers',
      icon: 'megaphone',
      color: 'orange'
    }
  },
  
  // Loading states
  loading: false,
  settingsLoading: false,
  markingAsRead: false,
  deleting: false,
  subscribing: false,
  
  // UI state
  panelOpen: false,
  selectedNotifications: [],
  bulkActionsVisible: false,
  
  // Real-time state
  isConnected: false,
  lastUpdate: null,
  
  // Cache for performance
  cache: {
    lastFetch: null,
    etag: null
  },
  
  // Error states
  error: null,
  settingsError: null,
  deleteError: null,
  subscriptionError: null,
  
  // Analytics
  analytics: {
    totalReceived: 0,
    totalRead: 0,
    averageReadTime: 0,
    clickThroughRate: 0,
    mostActiveType: null
  }
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Panel management
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    
    setPanelOpen: (state, action) => {
      state.panelOpen = action.payload;
    },
    
    // Filter management
    setActiveFilter: (state, action) => {
      state.activeFilter = action.payload;
      state.currentPage = 1; // Reset pagination when changing filter
    },
    
    // Selection management
    toggleNotificationSelection: (state, action) => {
      const notificationId = action.payload;
      const index = state.selectedNotifications.indexOf(notificationId);
      
      if (index > -1) {
        state.selectedNotifications.splice(index, 1);
      } else {
        state.selectedNotifications.push(notificationId);
      }
      
      state.bulkActionsVisible = state.selectedNotifications.length > 0;
    },
    
    selectAllNotifications: (state) => {
      const visibleNotifications = state.notifications
        .filter(notification => {
          switch (state.activeFilter) {
            case 'unread':
              return !notification.read;
            case 'read':
              return notification.read;
            case 'all':
            default:
              return true;
          }
        })
        .map(notification => notification._id);
      
      state.selectedNotifications = visibleNotifications;
      state.bulkActionsVisible = visibleNotifications.length > 0;
    },
    
    clearSelection: (state) => {
      state.selectedNotifications = [];
      state.bulkActionsVisible = false;
    },
    
    // Real-time updates
    addNotification: (state, action) => {
      const notification = action.payload;
      
      // Add to beginning of array
      state.notifications.unshift(notification);
      
      // Update counts
      if (!notification.read) {
        state.unreadCount += 1;
      }
      state.totalCount += 1;
      
      // Update analytics
      state.analytics.totalReceived += 1;
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n._id === notificationId);
      
      if (notification) {
        // Update counts
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.totalCount = Math.max(0, state.totalCount - 1);
        
        // Remove from array
        state.notifications = state.notifications.filter(n => n._id !== notificationId);
        
        // Remove from selection if selected
        state.selectedNotifications = state.selectedNotifications.filter(id => id !== notificationId);
        state.bulkActionsVisible = state.selectedNotifications.length > 0;
      }
    },
    
    updateNotification: (state, action) => {
      const updatedNotification = action.payload;
      const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
      
      if (index > -1) {
        const oldNotification = state.notifications[index];
        
        // Update read count if read status changed
        if (oldNotification.read !== updatedNotification.read) {
          if (updatedNotification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
            state.analytics.totalRead += 1;
          } else {
            state.unreadCount += 1;
          }
        }
        
        state.notifications[index] = updatedNotification;
      }
    },
    
    // Optimistic updates
    optimisticMarkAsRead: (state, action) => {
      const notificationIds = Array.isArray(action.payload) ? action.payload : [action.payload];
      
      notificationIds.forEach(id => {
        const notification = state.notifications.find(n => n._id === id);
        if (notification && !notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.analytics.totalRead += 1;
        }
      });
    },
    
    optimisticMarkAsUnread: (state, action) => {
      const notificationIds = Array.isArray(action.payload) ? action.payload : [action.payload];
      
      notificationIds.forEach(id => {
        const notification = state.notifications.find(n => n._id === id);
        if (notification && notification.read) {
          notification.read = false;
          delete notification.readAt;
          state.unreadCount += 1;
        }
      });
    },
    
    // Connection status
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
      if (action.payload) {
        state.lastUpdate = Date.now();
      }
    },
    
    // Cache management
    updateCache: (state, action) => {
      state.cache = { ...state.cache, ...action.payload };
    },
    
    clearCache: (state) => {
      state.cache = { lastFetch: null, etag: null };
    },
    
    // Error management
    clearErrors: (state) => {
      state.error = null;
      state.settingsError = null;
      state.deleteError = null;
      state.subscriptionError = null;
    },
    
    // Analytics
    updateAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },
    
    trackNotificationClick: (state, action) => {
      const { notificationId } = action.payload;
      
      // Mark as read if not already
      const notification = state.notifications.find(n => n._id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        notification.clickedAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.analytics.totalRead += 1;
      }
      
      // Update click-through analytics
      state.analytics.clickThroughRate = state.analytics.totalRead > 0 
        ? (state.analytics.totalRead / state.analytics.totalReceived) * 100 
        : 0;
    },
    
    // Settings management
    updateLocalSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    resetSettings: (state) => {
      state.settings = initialState.settings;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, total, unreadCount, currentPage, totalPages } = action.payload;
        
        state.notifications = notifications;
        state.totalCount = total;
        state.unreadCount = unreadCount;
        state.currentPage = currentPage;
        state.totalPages = totalPages;
        
        // Update cache
        state.cache.lastFetch = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markAsRead.pending, (state) => {
        state.markingAsRead = true;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.markingAsRead = false;
        const notificationIds = action.payload;
        
        notificationIds.forEach(id => {
          const notification = state.notifications.find(n => n._id === id);
          if (notification && !notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            state.unreadCount = Math.max(0, state.unreadCount - 1);
            state.analytics.totalRead += 1;
          }
        });
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.markingAsRead = false;
        state.error = action.payload;
      })
      
      // Mark as unread
      .addCase(markAsUnread.fulfilled, (state, action) => {
        const notificationIds = action.payload;
        
        notificationIds.forEach(id => {
          const notification = state.notifications.find(n => n._id === id);
          if (notification && notification.read) {
            notification.read = false;
            delete notification.readAt;
            state.unreadCount += 1;
          }
        });
      })
      
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            state.analytics.totalRead += 1;
          }
        });
        state.unreadCount = 0;
      })
      
      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.deleting = true;
        state.deleteError = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleting = false;
        const notificationId = action.payload;
        
        notificationsSlice.caseReducers.removeNotification(state, { payload: notificationId });
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleting = false;
        state.deleteError = action.payload;
      })
      
      // Delete notifications (bulk)
      .addCase(deleteNotifications.fulfilled, (state, action) => {
        const notificationIds = action.payload;
        
        notificationIds.forEach(id => {
          notificationsSlice.caseReducers.removeNotification(state, { payload: id });
        });
        
        // Clear selection
        state.selectedNotifications = [];
        state.bulkActionsVisible = false;
      })
      
      // Update notification settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload;
      })
      
      // Get notification settings
      .addCase(getNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      
      // Subscribe to notifications
      .addCase(subscribeToNotifications.pending, (state) => {
        state.subscribing = true;
        state.subscriptionError = null;
      })
      .addCase(subscribeToNotifications.fulfilled, (state, action) => {
        state.subscribing = false;
        state.pushSubscription = action.payload.subscription;
        state.settings.push.enabled = true;
      })
      .addCase(subscribeToNotifications.rejected, (state, action) => {
        state.subscribing = false;
        state.subscriptionError = action.payload;
      })
      
      // Unsubscribe from notifications
      .addCase(unsubscribeFromNotifications.fulfilled, (state) => {
        state.pushSubscription = null;
        state.settings.push.enabled = false;
      });
  }
});

export const {
  togglePanel,
  setPanelOpen,
  setActiveFilter,
  toggleNotificationSelection,
  selectAllNotifications,
  clearSelection,
  addNotification,
  removeNotification,
  updateNotification,
  optimisticMarkAsRead,
  optimisticMarkAsUnread,
  setConnectionStatus,
  updateCache,
  clearCache,
  clearErrors,
  updateAnalytics,
  trackNotificationClick,
  updateLocalSettings,
  resetSettings
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectTotalCount = (state) => state.notifications.totalCount;

export const selectNotificationsLoading = (state) => state.notifications.loading;
export const selectSettingsLoading = (state) => state.notifications.settingsLoading;
export const selectMarkingAsRead = (state) => state.notifications.markingAsRead;
export const selectDeleting = (state) => state.notifications.deleting;
export const selectSubscribing = (state) => state.notifications.subscribing;

export const selectNotificationsError = (state) => state.notifications.error;
export const selectSettingsError = (state) => state.notifications.settingsError;
export const selectDeleteError = (state) => state.notifications.deleteError;
export const selectSubscriptionError = (state) => state.notifications.subscriptionError;

export const selectPanelOpen = (state) => state.notifications.panelOpen;
export const selectActiveFilter = (state) => state.notifications.activeFilter;
export const selectSelectedNotifications = (state) => state.notifications.selectedNotifications;
export const selectBulkActionsVisible = (state) => state.notifications.bulkActionsVisible;

export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectPushSubscription = (state) => state.notifications.pushSubscription;
export const selectNotificationTypes = (state) => state.notifications.notificationTypes;

export const selectConnectionStatus = (state) => state.notifications.isConnected;
export const selectLastUpdate = (state) => state.notifications.lastUpdate;

export const selectNotificationAnalytics = (state) => state.notifications.analytics;

export const selectFilteredNotifications = (state) => {
  const { notifications, activeFilter } = state.notifications;
  
  switch (activeFilter) {
    case 'unread':
      return notifications.filter(notification => !notification.read);
    case 'read':
      return notifications.filter(notification => notification.read);
    case 'application':
      return notifications.filter(notification => notification.type === 'application');
    case 'job':
      return notifications.filter(notification => notification.type === 'job');
    case 'message':
      return notifications.filter(notification => notification.type === 'message');
    case 'system':
      return notifications.filter(notification => notification.type === 'system');
    case 'all':
    default:
      return notifications;
  }
};

export const selectUnreadNotifications = (state) => 
  state.notifications.notifications.filter(notification => !notification.read);

export const selectNotificationsByType = (state, type) =>
  state.notifications.notifications.filter(notification => notification.type === type);

export const selectHasUnreadNotifications = (state) => state.notifications.unreadCount > 0;

export const selectNotificationPagination = (state) => ({
  currentPage: state.notifications.currentPage,
  totalPages: state.notifications.totalPages,
  totalCount: state.notifications.totalCount,
  hasNextPage: state.notifications.currentPage < state.notifications.totalPages,
  hasPrevPage: state.notifications.currentPage > 1
});

export const selectNotificationById = (state, notificationId) =>
  state.notifications.notifications.find(notification => notification._id === notificationId);

export const selectIsNotificationSelected = (state, notificationId) =>
  state.notifications.selectedNotifications.includes(notificationId);

export const selectSelectedNotificationsCount = (state) => 
  state.notifications.selectedNotifications.length;

export const selectCanMarkAllAsRead = (state) => {
  const filteredNotifications = selectFilteredNotifications(state);
  return filteredNotifications.some(notification => !notification.read);
};

export default notificationsSlice.reducer;

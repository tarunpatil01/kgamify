import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobsReducer from './slices/jobsSlice';
import applicationsReducer from './slices/applicationsSlice';
import uiReducer from './slices/uiSlice';
import searchReducer from './slices/searchSlice';
import notificationsReducer from './slices/notificationsSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI state
  blacklist: ['applications', 'jobs', 'search', 'notifications'] // Don't persist dynamic data
};

// Auth persist configuration (more specific)
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated', 'preferences'] // Persist user data but not tokens
};

// UI persist configuration
const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['theme', 'preferences', 'accessibility', 'features'] // Persist UI preferences
};

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  applications: applicationsReducer,
  jobs: jobsReducer,
  ui: persistReducer(uiPersistConfig, uiReducer),
  search: searchReducer,
  notifications: notificationsReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Redux Store Configuration
 * Centralized state management with Redux Toolkit and persistence
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PURGE',
          'persist/FLUSH',
          'persist/PAUSE'
        ],
        ignoredPaths: [
          'register',
          'rehydrate',
          'ui.modals.confirmDialog.onConfirm',
          'ui.modals.confirmDialog.onCancel'
        ]
      },
      immutableCheck: {
        ignoredPaths: [
          'ui.modals.confirmDialog.onConfirm',
          'ui.modals.confirmDialog.onCancel'
        ]
      }
    }),
  devTools: import.meta.env.MODE !== 'production'
});

// Create persistor
export const persistor = persistStore(store);

export default store;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';

/**
 * Authentication Slice
 * Manages user authentication state and operations
 */

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
  refreshToken: localStorage.getItem('refreshToken'),
  loginAttempts: 0,
  lastLoginAttempt: null,
  sessionExpiry: null,
  userPreferences: {
    theme: 'light',
    notifications: true,
    language: 'en'
  }
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user, token, refreshToken, expiresIn } = response.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Calculate session expiry
      const sessionExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('sessionExpiry', sessionExpiry.toString());
      
      return { user, token, refreshToken, sessionExpiry };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { user, token, refreshToken, expiresIn } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      const sessionExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('sessionExpiry', sessionExpiry.toString());
      
      return { user, token, refreshToken, sessionExpiry };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: auth.refreshToken
      });
      
      const { token, refreshToken, expiresIn } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      const sessionExpiry = new Date().getTime() + (expiresIn * 1000);
      localStorage.setItem('sessionExpiry', sessionExpiry.toString());
      
      return { token, refreshToken, sessionExpiry };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    try {
      const { auth } = getState();
      if (auth.token) {
        await apiClient.post('/auth/logout', {
          refreshToken: auth.refreshToken
        });
      }
    } catch {
      // Logout anyway even if server request fails
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionExpiry');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user info');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch('/auth/profile', profileData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Profile update failed');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await apiClient.patch('/auth/change-password', passwordData);
      return { message: 'Password changed successfully' };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/forgot-password', { email });
      return { message: 'Password reset email sent' };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      return { message: 'Password reset successfully' };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserPreferences: (state, action) => {
      state.userPreferences = { ...state.userPreferences, ...action.payload };
      // Store preferences in localStorage
      localStorage.setItem('userPreferences', JSON.stringify(state.userPreferences));
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = new Date().toISOString();
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    },
    checkAuthStatus: (state) => {
      const token = localStorage.getItem('token');
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      const preferences = localStorage.getItem('userPreferences');
      
      if (token && sessionExpiry && new Date().getTime() < parseInt(sessionExpiry)) {
        state.token = token;
        state.isAuthenticated = true;
        state.sessionExpiry = parseInt(sessionExpiry);
      } else {
        // Session expired, clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionExpiry');
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      }
      
      if (preferences) {
        try {
          state.userPreferences = JSON.parse(preferences);
        } catch {
          // Keep default preferences if parsing fails
        }
      }
    },
    setSessionExpiry: (state, action) => {
      state.sessionExpiry = action.payload;
      localStorage.setItem('sessionExpiry', action.payload.toString());
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.isAuthenticated = true;
        state.error = null;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.loginAttempts += 1;
        state.lastLoginAttempt = new Date().toISOString();
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Refresh Token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.isAuthenticated = true;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        // Token refresh failed, logout user
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.sessionExpiry = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionExpiry');
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.sessionExpiry = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
      })
      
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // If getting user fails, might need to logout
        if (action.payload?.includes('unauthorized') || action.payload?.includes('token')) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sessionExpiry');
        }
      })
      
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Actions
export const { 
  clearError, 
  updateUserPreferences, 
  incrementLoginAttempts, 
  resetLoginAttempts,
  checkAuthStatus,
  setSessionExpiry,
  updateUser
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectUserPreferences = (state) => state.auth.userPreferences;
export const selectLoginAttempts = (state) => state.auth.loginAttempts;
export const selectSessionExpiry = (state) => state.auth.sessionExpiry;

// Helper selectors
export const selectIsSessionExpired = (state) => {
  const expiry = state.auth.sessionExpiry;
  return expiry ? new Date().getTime() > expiry : false;
};

export const selectTimeUntilExpiry = (state) => {
  const expiry = state.auth.sessionExpiry;
  return expiry ? Math.max(0, expiry - new Date().getTime()) : 0;
};

export const selectCanAttemptLogin = (state) => {
  const attempts = state.auth.loginAttempts;
  const lastAttempt = state.auth.lastLoginAttempt;
  
  if (attempts < 3) return true;
  if (attempts >= 5) return false;
  
  // Check if enough time has passed since last attempt
  if (lastAttempt) {
    const timeSinceLastAttempt = new Date().getTime() - new Date(lastAttempt).getTime();
    const waitTime = Math.pow(2, attempts - 3) * 60 * 1000; // Exponential backoff
    return timeSinceLastAttempt > waitTime;
  }
  
  return true;
};

export default authSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/apiClient';
import { applicationService } from '../../services/applicationService';

/**
 * Applications Slice
 * Manages job applications state and operations
 */

// Initial state
const initialState = {
  applications: [],
  currentApplication: null,
  loading: false,
  submitting: false,
  error: null,
  filters: {
    status: '',
    dateRange: '',
    jobTitle: '',
    company: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  stats: {
    total: 0,
    submitted: 0,
    reviewing: 0,
    shortlisted: 0,
    interviewed: 0,
    offered: 0,
    rejected: 0,
    withdrawn: 0
  },
  statusUpdates: [],
  skillMatches: {},
  resumeParseResults: {}
};

// Async thunks
export const submitApplication = createAsyncThunk(
  'applications/submit',
  async (applicationData, { rejectWithValue }) => {
    try {
      const result = await applicationService.submitApplication(applicationData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  async ({ candidateId, filters = {}, pagination = {} }, { rejectWithValue }) => {
    try {
      const queryParams = {
        ...filters,
        page: pagination.page || 1,
        limit: pagination.limit || 20
      };
      
      const response = await apiClient.get(`/applications/candidate/${candidateId}`, {
        params: queryParams
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  async (applicationId, { rejectWithValue }) => {
    try {
      const application = await applicationService.getApplication(applicationId);
      return application;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'applications/updateStatus',
  async ({ applicationId, status, metadata }, { rejectWithValue }) => {
    try {
      const application = await applicationService.updateApplicationStatus(
        applicationId, 
        status, 
        metadata
      );
      return application;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const withdrawApplication = createAsyncThunk(
  'applications/withdraw',
  async ({ applicationId, reason }, { rejectWithValue }) => {
    try {
      const application = await applicationService.withdrawApplication(applicationId, reason);
      return application;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const parseResume = createAsyncThunk(
  'applications/parseResume',
  async (resumeFile, { rejectWithValue }) => {
    try {
      const result = await applicationService.parseResume(resumeFile);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculateSkillMatch = createAsyncThunk(
  'applications/calculateSkillMatch',
  async ({ candidateSkills, requiredSkills, options }, { rejectWithValue }) => {
    try {
      const { skillMatchingService } = await import('../../services/skillMatchingService');
      const result = await skillMatchingService.calculateMatch(
        candidateSkills,
        requiredSkills,
        options
      );
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchApplicationStats = createAsyncThunk(
  'applications/fetchStats',
  async (candidateId, { rejectWithValue }) => {
    try {
      const stats = await applicationService.getApplicationStats(candidateId);
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const bulkUpdateApplications = createAsyncThunk(
  'applications/bulkUpdate',
  async (updates, { rejectWithValue }) => {
    try {
      const results = await applicationService.bulkUpdateStatus(updates);
      return results;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const retryFailedApplication = createAsyncThunk(
  'applications/retryFailed',
  async (applicationData, { rejectWithValue }) => {
    try {
      const result = await applicationService.submitApplication(applicationData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Applications slice
const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset pagination when filters change
      state.pagination.page = 1;
    },
    clearFilters: (state) => {
      state.filters = {
        status: '',
        dateRange: '',
        jobTitle: '',
        company: ''
      };
      state.pagination.page = 1;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setCurrentApplication: (state, action) => {
      state.currentApplication = action.payload;
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
    },
    addStatusUpdate: (state, action) => {
      const update = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.statusUpdates.unshift(update);
      // Keep only last 50 updates
      if (state.statusUpdates.length > 50) {
        state.statusUpdates = state.statusUpdates.slice(0, 50);
      }
    },
    markAsRead: (state, action) => {
      const { applicationId } = action.payload;
      const application = state.applications.find(app => app.id === applicationId);
      if (application) {
        application.unread = false;
      }
    },
    updateLocalApplication: (state, action) => {
      const { applicationId, updates } = action.payload;
      const index = state.applications.findIndex(app => app.id === applicationId);
      if (index !== -1) {
        state.applications[index] = { ...state.applications[index], ...updates };
      }
      
      if (state.currentApplication?.id === applicationId) {
        state.currentApplication = { ...state.currentApplication, ...updates };
      }
    },
    addApplication: (state, action) => {
      const application = action.payload;
      // Add new application to the beginning of the list
      state.applications.unshift(application);
      // Update total count
      state.stats.total += 1;
      if (application.status === 'submitted') {
        state.stats.submitted += 1;
      }
    },
    updateApplication: (state, action) => {
      const updatedApplication = action.payload;
      const index = state.applications.findIndex(app => app.id === updatedApplication.id);
      if (index !== -1) {
        state.applications[index] = updatedApplication;
      }
      if (state.currentApplication?.id === updatedApplication.id) {
        state.currentApplication = updatedApplication;
      }
    },
    removeApplication: (state, action) => {
      const applicationId = action.payload;
      state.applications = state.applications.filter(app => app.id !== applicationId);
      if (state.currentApplication?.id === applicationId) {
        state.currentApplication = null;
      }
    },
    sortApplications: (state, action) => {
      const { field, order } = action.payload;
      state.applications.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];
        
        // Handle date fields
        if (field.includes('Date') || field.includes('At')) {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        
        if (order === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    },
    cacheSkillMatch: (state, action) => {
      const { key, result } = action.payload;
      // Store skill match results directly in object
      state.skillMatches[key] = result;
    },
    cacheResumeParseResult: (state, action) => {
      const { key, result } = action.payload;
      const resumeResults = Object.fromEntries(state.resumeParseResults);
      resumeResults[key] = result;
      state.resumeParseResults = new Map(Object.entries(resumeResults));
    }
  },
  extraReducers: (builder) => {
    builder
      // Submit Application
      .addCase(submitApplication.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.submitting = false;
        const { application, skillMatch } = action.payload;
        
        // Add new application to the list
        state.applications.unshift(application);
        
        // Update stats
        state.stats.total += 1;
        state.stats.submitted += 1;
        
        // Cache skill match result
        if (skillMatch) {
          state.skillMatches[application.id] = skillMatch;
        }
        
        // Add status update
        state.statusUpdates.unshift({
          id: Date.now(),
          applicationId: application.id,
          status: 'submitted',
          timestamp: new Date().toISOString(),
          message: 'Application submitted successfully'
        });
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Fetch Applications
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        const { applications, pagination, stats } = action.payload;
        
        if (action.meta.arg.pagination?.page === 1) {
          // Replace applications for first page
          state.applications = applications;
        } else {
          // Append for subsequent pages
          state.applications = [...state.applications, ...applications];
        }
        
        state.pagination = pagination;
        if (stats) {
          state.stats = stats;
        }
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Application by ID
      .addCase(fetchApplicationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApplication = action.payload;
        
        // Update in applications list if present
        const index = state.applications.findIndex(app => app.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Application Status
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const updatedApplication = action.payload;
        
        // Update in applications list
        const index = state.applications.findIndex(app => app.id === updatedApplication.id);
        if (index !== -1) {
          const oldStatus = state.applications[index].status;
          state.applications[index] = updatedApplication;
          
          // Update stats
          if (state.stats[oldStatus] > 0) {
            state.stats[oldStatus] -= 1;
          }
          state.stats[updatedApplication.status] = (state.stats[updatedApplication.status] || 0) + 1;
        }
        
        // Update current application
        if (state.currentApplication?.id === updatedApplication.id) {
          state.currentApplication = updatedApplication;
        }
        
        // Add status update
        state.statusUpdates.unshift({
          id: Date.now(),
          applicationId: updatedApplication.id,
          status: updatedApplication.status,
          timestamp: new Date().toISOString(),
          message: `Application status updated to ${updatedApplication.status}`
        });
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Withdraw Application
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        const withdrawnApplication = action.payload;
        
        // Update in applications list
        const index = state.applications.findIndex(app => app.id === withdrawnApplication.id);
        if (index !== -1) {
          const oldStatus = state.applications[index].status;
          state.applications[index] = withdrawnApplication;
          
          // Update stats
          if (state.stats[oldStatus] > 0) {
            state.stats[oldStatus] -= 1;
          }
          state.stats.withdrawn += 1;
        }
        
        // Update current application
        if (state.currentApplication?.id === withdrawnApplication.id) {
          state.currentApplication = withdrawnApplication;
        }
        
        // Add status update
        state.statusUpdates.unshift({
          id: Date.now(),
          applicationId: withdrawnApplication.id,
          status: 'withdrawn',
          timestamp: new Date().toISOString(),
          message: 'Application withdrawn'
        });
      })
      .addCase(withdrawApplication.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Parse Resume
      .addCase(parseResume.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(parseResume.fulfilled, (state, action) => {
        state.loading = false;
        // Cache resume parse result
        const result = action.payload;
        const key = `resume_${Date.now()}`;
        const resumeResults = Object.fromEntries(state.resumeParseResults);
        resumeResults[key] = result;
        state.resumeParseResults = new Map(Object.entries(resumeResults));
      })
      .addCase(parseResume.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Calculate Skill Match
      .addCase(calculateSkillMatch.fulfilled, (state, action) => {
        const result = action.payload;
        const key = `match_${Date.now()}`;
        state.skillMatches[key] = result;
      })
      .addCase(calculateSkillMatch.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Fetch Application Stats
      .addCase(fetchApplicationStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchApplicationStats.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Bulk Update Applications
      .addCase(bulkUpdateApplications.fulfilled, (state, action) => {
        const results = action.payload;
        
        results.forEach(result => {
          if (result.success && result.application) {
            const index = state.applications.findIndex(app => app.id === result.application.id);
            if (index !== -1) {
              state.applications[index] = result.application;
            }
          }
        });
      })
      .addCase(bulkUpdateApplications.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Retry Failed Application
      .addCase(retryFailedApplication.fulfilled, (state, action) => {
        const { application } = action.payload;
        
        // Update or add application
        const index = state.applications.findIndex(app => app.id === application.id);
        if (index !== -1) {
          state.applications[index] = application;
        } else {
          state.applications.unshift(application);
        }
      })
      .addCase(retryFailedApplication.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

// Actions
export const {
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  setCurrentApplication,
  clearCurrentApplication,
  addStatusUpdate,
  markAsRead,
  updateLocalApplication,
  addApplication,
  updateApplication,
  removeApplication,
  sortApplications,
  cacheSkillMatch,
  cacheResumeParseResult
} = applicationsSlice.actions;

// Selectors
export const selectApplications = (state) => state.applications.applications;
export const selectCurrentApplication = (state) => state.applications.currentApplication;
export const selectApplicationsLoading = (state) => state.applications.loading;
export const selectApplicationsSubmitting = (state) => state.applications.submitting;
export const selectApplicationsError = (state) => state.applications.error;
export const selectApplicationsFilters = (state) => state.applications.filters;
export const selectApplicationsPagination = (state) => state.applications.pagination;
export const selectApplicationsStats = (state) => state.applications.stats;
export const selectStatusUpdates = (state) => state.applications.statusUpdates;
export const selectSkillMatches = (state) => state.applications.skillMatches;
export const selectResumeParseResults = (state) => state.applications.resumeParseResults;

// Computed selectors
export const selectFilteredApplications = (state) => {
  const applications = selectApplications(state);
  const filters = selectApplicationsFilters(state);
  
  return applications.filter(app => {
    if (filters.status && app.status !== filters.status) return false;
    if (filters.jobTitle && !app.job?.title?.toLowerCase().includes(filters.jobTitle.toLowerCase())) return false;
    if (filters.company && !app.job?.company?.name?.toLowerCase().includes(filters.company.toLowerCase())) return false;
    
    if (filters.dateRange) {
      const appDate = new Date(app.submittedAt);
      const now = new Date();
      let daysDiff = 0;
      
      switch (filters.dateRange) {
        case '7d':
          daysDiff = 7;
          break;
        case '30d':
          daysDiff = 30;
          break;
        case '90d':
          daysDiff = 90;
          break;
        default:
          return true;
      }
      
      const cutoffDate = new Date(now.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
      if (appDate < cutoffDate) return false;
    }
    
    return true;
  });
};

export const selectApplicationById = (state, applicationId) => {
  return selectApplications(state).find(app => app.id === applicationId);
};

export const selectApplicationsByStatus = (state, status) => {
  return selectApplications(state).filter(app => app.status === status);
};

export const selectUnreadApplications = (state) => {
  return selectApplications(state).filter(app => app.unread);
};

export const selectRecentStatusUpdates = (state, limit = 10) => {
  return selectStatusUpdates(state).slice(0, limit);
};

export const selectApplicationsWithSkillMatch = (state) => {
  const applications = selectApplications(state);
  const skillMatches = selectSkillMatches(state);
  
  return applications.map(app => ({
    ...app,
    skillMatch: skillMatches[app.id]
  }));
};

export const selectApplicationMetrics = (state) => {
  const stats = selectApplicationsStats(state);
  const total = stats.total || 0;
  
  return {
    ...stats,
    successRate: total > 0 ? ((stats.offered || 0) / total * 100).toFixed(1) : 0,
    responseRate: total > 0 ? (((stats.shortlisted || 0) + (stats.interviewed || 0) + (stats.offered || 0)) / total * 100).toFixed(1) : 0,
    rejectionRate: total > 0 ? ((stats.rejected || 0) / total * 100).toFixed(1) : 0
  };
};

export default applicationsSlice.reducer;

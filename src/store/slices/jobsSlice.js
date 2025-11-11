import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

// Async thunks for job operations
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
        includeInactive = false
      } = params;

      // Check cache first
      const state = getState();
      const cacheKey = JSON.stringify({ page, limit, search, filters, sortBy, sortOrder });
      const cached = state.jobs.cache[cacheKey];
      
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
        return cached.data;
      }

      // Backend currently expects 'email' not nested under filters. Pull out email if present.
      const { email, ...restFilters } = filters || {};
      const response = await apiClient.get('/job', {
        params: { page, limit, search, sortBy, sortOrder, includeInactive, email, ...restFilters, _cb: Date.now() },
        // Bypass client cache in our apiClient and any intermediaries
        cache: false,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      // Backend currently returns a raw array (no pagination object). Support both shapes.
      const raw = response.data;
      if (Array.isArray(raw)) {
        return {
          jobs: raw,
          total: raw.length,
          currentPage: page,
          totalPages: 1,
          cacheKey,
          timestamp: Date.now()
        };
      }
      return {
        jobs: raw.jobs || [],
        total: raw.total || (Array.isArray(raw.jobs) ? raw.jobs.length : 0),
        currentPage: raw.currentPage || page,
        totalPages: raw.totalPages || 1,
        cacheKey,
        timestamp: Date.now()
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk(
  'jobs/fetchJobById',
  async (jobId, { rejectWithValue, getState }) => {
    try {
      // Check cache first
      const state = getState();
      const cached = state.jobs.jobDetails[jobId];
      
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) { // 10 minutes cache
        return cached;
      }

      const response = await apiClient.get(`/job/${jobId}`);
      
      return {
        ...response.data,
        timestamp: Date.now()
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job details');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/job', jobData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ jobId, updates }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/job/${jobId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (jobId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/job/${jobId}`);
      return jobId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete job');
    }
  }
);

export const toggleJobStatus = createAsyncThunk(
  'jobs/toggleJobStatus',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/jobs/${jobId}/toggle-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle job status');
    }
  }
);

export const searchJobs = createAsyncThunk(
  'jobs/searchJobs',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/jobs/search', searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const getSimilarJobs = createAsyncThunk(
  'jobs/getSimilarJobs',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/jobs/${jobId}/similar`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch similar jobs');
    }
  }
);

export const getJobStatistics = createAsyncThunk(
  'jobs/getJobStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/jobs/statistics');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch job statistics');
    }
  }
);

const initialState = {
  jobs: [],
  jobDetails: {}, // Cache for individual job details
  similarJobs: {},
  statistics: null,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  total: 0,
  
  // Search & Filters
  searchTerm: '',
  searchResults: [],
  filters: {
    category: '',
    location: '',
    salary: { min: '', max: '' },
    experience: '',
    jobType: '',
    remote: false,
    skills: [],
    postedWithin: ''
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
  
  // Loading states
  loading: false,
  searchLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  
  // Cache
  cache: {},
  lastFetch: null,
  
  // Error states
  error: null,
  searchError: null,
  createError: null,
  updateError: null,
  deleteError: null
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    // Search & Filter actions
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
    },
    
    setSortBy: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    
    // Pagination
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    // Clear errors
    clearErrors: (state) => {
      state.error = null;
      state.searchError = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    
    // Cache management
    clearCache: (state) => {
      state.cache = {};
      state.jobDetails = {};
      state.similarJobs = {};
    },
    
    // Optimistic updates
    optimisticJobUpdate: (state, action) => {
      const { jobId, updates } = action.payload;
      const jobIndex = state.jobs.findIndex(job => job._id === jobId);
      if (jobIndex !== -1) {
        state.jobs[jobIndex] = { ...state.jobs[jobIndex], ...updates };
      }
      if (state.jobDetails[jobId]) {
        state.jobDetails[jobId] = { 
          ...state.jobDetails[jobId], 
          ...updates,
          timestamp: Date.now()
        };
      }
    },
    
    // Real-time updates
    addNewJob: (state, action) => {
      state.jobs.unshift(action.payload);
      state.total += 1;
    },
    
    removeJob: (state, action) => {
      const jobId = action.payload;
      state.jobs = state.jobs.filter(job => job._id !== jobId);
      delete state.jobDetails[jobId];
      delete state.similarJobs[jobId];
      state.total = Math.max(0, state.total - 1);
    },
    
    updateJobInList: (state, action) => {
      const updatedJob = action.payload;
      const jobIndex = state.jobs.findIndex(job => job._id === updatedJob._id);
      if (jobIndex !== -1) {
        state.jobs[jobIndex] = updatedJob;
      }
      if (state.jobDetails[updatedJob._id]) {
        state.jobDetails[updatedJob._id] = {
          ...updatedJob,
          timestamp: Date.now()
        };
      }
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.total = action.payload.total;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.lastFetch = Date.now();
        
        // Cache the result
        if (action.payload.cacheKey) {
          state.cache[action.payload.cacheKey] = {
            data: action.payload,
            timestamp: action.payload.timestamp
          };
        }
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.loading = false;
        state.jobDetails[action.payload._id] = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create job
      .addCase(createJob.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.createLoading = false;
        state.jobs.unshift(action.payload);
        state.total += 1;
        // Clear cache to force refresh
        state.cache = {};
      })
      .addCase(createJob.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      
      // Update job
      .addCase(updateJob.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedJob = action.payload;
        const jobIndex = state.jobs.findIndex(job => job._id === updatedJob._id);
        if (jobIndex !== -1) {
          state.jobs[jobIndex] = updatedJob;
        }
        state.jobDetails[updatedJob._id] = {
          ...updatedJob,
          timestamp: Date.now()
        };
        // Clear cache to force refresh
        state.cache = {};
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Delete job
      .addCase(deleteJob.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const jobId = action.payload;
        state.jobs = state.jobs.filter(job => job._id !== jobId);
        delete state.jobDetails[jobId];
        delete state.similarJobs[jobId];
        state.total = Math.max(0, state.total - 1);
        // Clear cache to force refresh
        state.cache = {};
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      
      // Toggle job status
      .addCase(toggleJobStatus.fulfilled, (state, action) => {
        const updatedJob = action.payload;
        const jobIndex = state.jobs.findIndex(job => job._id === updatedJob._id);
        if (jobIndex !== -1) {
          state.jobs[jobIndex] = updatedJob;
        }
        if (state.jobDetails[updatedJob._id]) {
          state.jobDetails[updatedJob._id] = {
            ...updatedJob,
            timestamp: Date.now()
          };
        }
      })
      
      // Search jobs
      .addCase(searchJobs.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchJobs.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.jobs;
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      
      // Get similar jobs
      .addCase(getSimilarJobs.fulfilled, (state, action) => {
        const { jobId, similarJobs } = action.payload;
        state.similarJobs[jobId] = similarJobs;
      })
      
      // Get job statistics
      .addCase(getJobStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  }
});

export const {
  setSearchTerm,
  setFilters,
  resetFilters,
  setSortBy,
  setCurrentPage,
  clearErrors,
  clearSearchResults,
  clearCache,
  optimisticJobUpdate,
  addNewJob,
  removeJob,
  updateJobInList
} = jobsSlice.actions;

// Selectors
export const selectJobs = (state) => state.jobs.jobs;
export const selectJobById = (state, jobId) => state.jobs.jobDetails[jobId];
export const selectSimilarJobs = (state, jobId) => state.jobs.similarJobs[jobId] || [];
export const selectJobStatistics = (state) => state.jobs.statistics;

export const selectJobsLoading = (state) => state.jobs.loading;
export const selectSearchLoading = (state) => state.jobs.searchLoading;
export const selectCreateLoading = (state) => state.jobs.createLoading;
export const selectUpdateLoading = (state) => state.jobs.updateLoading;
export const selectDeleteLoading = (state) => state.jobs.deleteLoading;

export const selectJobsError = (state) => state.jobs.error;
export const selectSearchError = (state) => state.jobs.searchError;
export const selectCreateError = (state) => state.jobs.createError;
export const selectUpdateError = (state) => state.jobs.updateError;
export const selectDeleteError = (state) => state.jobs.deleteError;

export const selectSearchTerm = (state) => state.jobs.searchTerm;
export const selectSearchResults = (state) => state.jobs.searchResults;
export const selectFilters = (state) => state.jobs.filters;
export const selectSortBy = (state) => state.jobs.sortBy;
export const selectSortOrder = (state) => state.jobs.sortOrder;

export const selectPagination = createSelector(
  (state) => state.jobs.currentPage,
  (state) => state.jobs.totalPages,
  (state) => state.jobs.total,
  (currentPage, totalPages, total) => ({
    currentPage,
    totalPages,
    total
  })
);

export const selectFilteredJobs = (state) => {
  const { jobs, searchTerm, filters } = state.jobs;
  
  if (!searchTerm && Object.values(filters).every(val => 
    val === '' || val === false || (Array.isArray(val) && val.length === 0) ||
    (typeof val === 'object' && Object.values(val).every(v => v === ''))
  )) {
    return jobs;
  }
  
  return jobs.filter(job => {
    // Search term matching
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = job.title?.toLowerCase().includes(searchLower);
      const companyMatch = job.company?.name?.toLowerCase().includes(searchLower);
      const descriptionMatch = job.description?.toLowerCase().includes(searchLower);
      const skillsMatch = job.requiredSkills?.some(skill => 
        skill.toLowerCase().includes(searchLower)
      );
      
      if (!titleMatch && !companyMatch && !descriptionMatch && !skillsMatch) {
        return false;
      }
    }
    
    // Filter matching
    if (filters.category && job.category !== filters.category) return false;
    if (filters.location && !job.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.experience) {
      const toToken = (val) => {
        const v = String(val || '').trim().toLowerCase();
        if (!v) return '';
        if (['entry level', 'entry'].includes(v)) return 'entry';
        if (['junior'].includes(v)) return 'junior';
        if (['mid', 'mid level', 'mid-level', 'midlevel'].includes(v)) return 'mid';
        if (['senior'].includes(v)) return 'senior';
        if (['executive'].includes(v)) return 'executive';
        return v;
      };
      if (toToken(job.experienceLevel) !== toToken(filters.experience)) return false;
    }
    if (filters.jobType && job.jobType !== filters.jobType) return false;
    if (filters.remote && !job.isRemote) return false;
    
    // Salary filter
    if (filters.salary.min && job.salary?.min < parseInt(filters.salary.min)) return false;
    if (filters.salary.max && job.salary?.max > parseInt(filters.salary.max)) return false;
    
    // Skills filter
    if (filters.skills.length > 0) {
      const hasRequiredSkills = filters.skills.some(skill =>
        job.requiredSkills?.some(jobSkill =>
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasRequiredSkills) return false;
    }
    
    // Posted within filter
    if (filters.postedWithin) {
      const daysAgo = {
        '1': 1,
        '7': 7,
        '30': 30
      }[filters.postedWithin];
      
      if (daysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        const jobDate = new Date(job.createdAt);
        if (jobDate < cutoffDate) return false;
      }
    }
    
    return true;
  });
};

export const selectActiveFiltersCount = (state) => {
  const { filters, searchTerm } = state.jobs;
  let count = 0;
  
  if (searchTerm) count++;
  if (filters.category) count++;
  if (filters.location) count++;
  if (filters.experience) count++;
  if (filters.jobType) count++;
  if (filters.remote) count++;
  if (filters.salary.min || filters.salary.max) count++;
  if (filters.skills.length > 0) count++;
  if (filters.postedWithin) count++;
  
  return count;
};

export default jobsSlice.reducer;

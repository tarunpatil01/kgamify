import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

// Async thunks for search operations
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (searchParams, { rejectWithValue, getState }) => {
    try {
      const {
        query,
        filters = {},
        type = 'jobs', // 'jobs', 'companies', 'applications'
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = searchParams;

      // Check cache first
      const state = getState();
      const cacheKey = JSON.stringify({ query, filters, type, page, limit, sortBy, sortOrder });
      const cached = state.search.cache[cacheKey];
      
      if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) { // 2 minutes cache
        return {
          ...cached.data,
          fromCache: true
        };
      }

      const response = await apiClient.post('/search', {
        query,
        filters,
        type,
        page,
        limit,
        sortBy,
        sortOrder
      });

      return {
        ...response.data,
        cacheKey,
        timestamp: Date.now(),
        fromCache: false
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const getSearchSuggestions = createAsyncThunk(
  'search/getSearchSuggestions',
  async ({ query, type = 'jobs' }, { rejectWithValue }) => {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      const response = await apiClient.get('/search/suggestions', {
        params: { query, type, limit: 10 }
      });

      return response.data.suggestions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get suggestions');
    }
  }
);

export const getPopularSearches = createAsyncThunk(
  'search/getPopularSearches',
  async ({ type = 'jobs', limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/search/popular', {
        params: { type, limit }
      });

      return response.data.searches;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get popular searches');
    }
  }
);

export const saveSearch = createAsyncThunk(
  'search/saveSearch',
  async (searchData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/search/save', searchData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save search');
    }
  }
);

export const deleteSavedSearch = createAsyncThunk(
  'search/deleteSavedSearch',
  async (searchId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/search/saved/${searchId}`);
      return searchId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete saved search');
    }
  }
);

export const getSavedSearches = createAsyncThunk(
  'search/getSavedSearches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/search/saved');
      return response.data.searches;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get saved searches');
    }
  }
);

export const getSearchHistory = createAsyncThunk(
  'search/getSearchHistory',
  async ({ limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/search/history', {
        params: { limit }
      });
      return response.data.history;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get search history');
    }
  }
);

export const clearSearchHistory = createAsyncThunk(
  'search/clearSearchHistory',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.delete('/search/history');
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear search history');
    }
  }
);

const initialState = {
  // Current search state
  currentQuery: '',
  currentFilters: {},
  currentType: 'jobs',
  
  // Search results
  results: [],
  totalResults: 0,
  currentPage: 1,
  totalPages: 1,
  facets: {},
  
  // Search suggestions
  suggestions: [],
  popularSearches: [],
  
  // Search history & saved searches
  history: [],
  savedSearches: [],
  recentSearches: [],
  
  // Search configuration
  searchTypes: ['jobs', 'companies', 'applications'],
  sortOptions: [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Date Posted' },
    { value: 'salary', label: 'Salary' },
    { value: 'title', label: 'Job Title' },
    { value: 'company', label: 'Company' },
    { value: 'location', label: 'Location' }
  ],
  
  // Advanced search filters
  availableFilters: {
    jobs: {
      location: { type: 'text', label: 'Location' },
      salary: { type: 'range', label: 'Salary Range' },
      experience: { type: 'select', label: 'Experience Level', options: ['Entry', 'Mid', 'Senior', 'Executive'] },
      jobType: { type: 'select', label: 'Job Type', options: ['Full-time', 'Part-time', 'Contract', 'Freelance'] },
      remote: { type: 'boolean', label: 'Remote Work' },
      skills: { type: 'multiselect', label: 'Skills' },
      company: { type: 'text', label: 'Company' },
      industry: { type: 'select', label: 'Industry' },
      datePosted: { type: 'select', label: 'Date Posted', options: ['1', '7', '30', '90'] }
    },
    companies: {
      industry: { type: 'select', label: 'Industry' },
      size: { type: 'select', label: 'Company Size', options: ['1-10', '11-50', '51-200', '201-1000', '1000+'] },
      location: { type: 'text', label: 'Location' },
      founded: { type: 'range', label: 'Founded Year' }
    },
    applications: {
      status: { type: 'select', label: 'Status', options: ['pending', 'reviewing', 'interviewing', 'offered', 'rejected'] },
      dateApplied: { type: 'daterange', label: 'Date Applied' },
      company: { type: 'text', label: 'Company' }
    }
  },
  
  // Loading states
  loading: false,
  suggestionsLoading: false,
  historyLoading: false,
  savedSearchesLoading: false,
  
  // Cache
  cache: {},
  cacheExpiry: 2 * 60 * 1000, // 2 minutes
  
  // Search analytics
  analytics: {
    totalSearches: 0,
    uniqueQueries: 0,
    averageResultsPerSearch: 0,
    mostSearchedTerms: [],
    searchClickthrough: {},
    searchAbandonment: 0
  },
  
  // Error states
  error: null,
  suggestionsError: null,
  historyError: null,
  savedSearchesError: null,
  
  // UI state
  searchBarExpanded: false,
  filtersVisible: false,
  advancedMode: false,
  
  // Search preferences
  preferences: {
    autoComplete: true,
    saveHistory: true,
    showSuggestions: true,
    resultsPerPage: 20,
    defaultSortBy: 'relevance',
    highlightResults: true
  }
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // Query management
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    },
    
    setCurrentFilters: (state, action) => {
      state.currentFilters = { ...state.currentFilters, ...action.payload };
    },
    
    resetFilters: (state) => {
      state.currentFilters = {};
    },
    
    setCurrentType: (state, action) => {
      state.currentType = action.payload;
      // Reset filters when changing search type
      state.currentFilters = {};
    },
    
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    // Results management
    clearResults: (state) => {
      state.results = [];
      state.totalResults = 0;
      state.currentPage = 1;
      state.totalPages = 1;
      state.facets = {};
    },
    
    // Recent searches management
    addRecentSearch: (state, action) => {
      const search = action.payload;
      // Remove if already exists
      state.recentSearches = state.recentSearches.filter(s => 
        s.query !== search.query || JSON.stringify(s.filters) !== JSON.stringify(search.filters)
      );
      // Add to beginning
      state.recentSearches.unshift({
        ...search,
        timestamp: Date.now(),
        id: Date.now().toString()
      });
      // Keep only last 20 searches
      state.recentSearches = state.recentSearches.slice(0, 20);
    },
    
    removeRecentSearch: (state, action) => {
      const searchId = action.payload;
      state.recentSearches = state.recentSearches.filter(s => s.id !== searchId);
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    
    // Cache management
    clearCache: (state) => {
      state.cache = {};
    },
    
    removeFromCache: (state, action) => {
      const cacheKey = action.payload;
      delete state.cache[cacheKey];
    },
    
    // UI state
    setSearchBarExpanded: (state, action) => {
      state.searchBarExpanded = action.payload;
    },
    
    toggleFiltersVisible: (state) => {
      state.filtersVisible = !state.filtersVisible;
    },
    
    setFiltersVisible: (state, action) => {
      state.filtersVisible = action.payload;
    },
    
    toggleAdvancedMode: (state) => {
      state.advancedMode = !state.advancedMode;
    },
    
    setAdvancedMode: (state, action) => {
      state.advancedMode = action.payload;
    },
    
    // Preferences
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    resetPreferences: (state) => {
      state.preferences = initialState.preferences;
    },
    
    // Analytics
    incrementSearchCount: (state) => {
      state.analytics.totalSearches += 1;
    },
    
    updateSearchAnalytics: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    },
    
    trackSearchClick: (state, action) => {
      const { query, resultId, position } = action.payload;
      const clickKey = `${query}_${resultId}`;
      state.analytics.searchClickthrough[clickKey] = {
        query,
        resultId,
        position,
        timestamp: Date.now()
      };
    },
    
    // Error management
    clearErrors: (state) => {
      state.error = null;
      state.suggestionsError = null;
      state.historyError = null;
      state.savedSearchesError = null;
    },
    
    // Quick search actions
    quickSearch: (state, action) => {
      const { query, type = 'jobs' } = action.payload;
      state.currentQuery = query;
      state.currentType = type;
      state.currentFilters = {};
      state.currentPage = 1;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Perform search
      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        const { results, total, currentPage, totalPages, facets, cacheKey, timestamp, fromCache } = action.payload;
        
        state.results = results;
        state.totalResults = total;
        state.currentPage = currentPage;
        state.totalPages = totalPages;
        state.facets = facets || {};
        
        // Cache the result if not from cache
        if (!fromCache && cacheKey) {
          state.cache[cacheKey] = {
            data: action.payload,
            timestamp
          };
        }
        
        // Add to recent searches if it's a new search
        if (!fromCache && state.currentQuery) {
          searchSlice.caseReducers.addRecentSearch(state, {
            payload: {
              query: state.currentQuery,
              filters: state.currentFilters,
              type: state.currentType,
              resultCount: total
            }
          });
        }
        
        // Update analytics
        state.analytics.totalSearches += 1;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get search suggestions
      .addCase(getSearchSuggestions.pending, (state) => {
        state.suggestionsLoading = true;
        state.suggestionsError = null;
      })
      .addCase(getSearchSuggestions.fulfilled, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(getSearchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestionsError = action.payload;
      })
      
      // Get popular searches
      .addCase(getPopularSearches.fulfilled, (state, action) => {
        state.popularSearches = action.payload;
      })
      
      // Save search
      .addCase(saveSearch.fulfilled, (state, action) => {
        state.savedSearches.push(action.payload);
      })
      
      // Delete saved search
      .addCase(deleteSavedSearch.fulfilled, (state, action) => {
        const searchId = action.payload;
        state.savedSearches = state.savedSearches.filter(search => search._id !== searchId);
      })
      
      // Get saved searches
      .addCase(getSavedSearches.pending, (state) => {
        state.savedSearchesLoading = true;
        state.savedSearchesError = null;
      })
      .addCase(getSavedSearches.fulfilled, (state, action) => {
        state.savedSearchesLoading = false;
        state.savedSearches = action.payload;
      })
      .addCase(getSavedSearches.rejected, (state, action) => {
        state.savedSearchesLoading = false;
        state.savedSearchesError = action.payload;
      })
      
      // Get search history
      .addCase(getSearchHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(getSearchHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(getSearchHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload;
      })
      
      // Clear search history
      .addCase(clearSearchHistory.fulfilled, (state) => {
        state.history = [];
        state.recentSearches = [];
      });
  }
});

export const {
  setCurrentQuery,
  setCurrentFilters,
  resetFilters,
  setCurrentType,
  setCurrentPage,
  clearResults,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  clearCache,
  removeFromCache,
  setSearchBarExpanded,
  toggleFiltersVisible,
  setFiltersVisible,
  toggleAdvancedMode,
  setAdvancedMode,
  updatePreferences,
  resetPreferences,
  incrementSearchCount,
  updateSearchAnalytics,
  trackSearchClick,
  clearErrors,
  quickSearch
} = searchSlice.actions;

// Selectors
export const selectCurrentQuery = (state) => state.search.currentQuery;
export const selectCurrentFilters = (state) => state.search.currentFilters;
export const selectCurrentType = (state) => state.search.currentType;
export const selectCurrentPage = (state) => state.search.currentPage;

export const selectSearchResults = (state) => state.search.results;
export const selectTotalResults = (state) => state.search.totalResults;
export const selectTotalPages = (state) => state.search.totalPages;
export const selectSearchFacets = (state) => state.search.facets;

export const selectSearchSuggestions = (state) => state.search.suggestions;
export const selectPopularSearches = (state) => state.search.popularSearches;
export const selectRecentSearches = (state) => state.search.recentSearches;
export const selectSearchHistory = (state) => state.search.history;
export const selectSavedSearches = (state) => state.search.savedSearches;

export const selectSearchLoading = (state) => state.search.loading;
export const selectSuggestionsLoading = (state) => state.search.suggestionsLoading;
export const selectHistoryLoading = (state) => state.search.historyLoading;
export const selectSavedSearchesLoading = (state) => state.search.savedSearchesLoading;

export const selectSearchError = (state) => state.search.error;
export const selectSuggestionsError = (state) => state.search.suggestionsError;
export const selectHistoryError = (state) => state.search.historyError;
export const selectSavedSearchesError = (state) => state.search.savedSearchesError;

export const selectSearchBarExpanded = (state) => state.search.searchBarExpanded;
export const selectFiltersVisible = (state) => state.search.filtersVisible;
export const selectAdvancedMode = (state) => state.search.advancedMode;

export const selectSearchPreferences = (state) => state.search.preferences;
export const selectSearchAnalytics = (state) => state.search.analytics;

export const selectAvailableFilters = (state) => {
  const currentType = state.search.currentType;
  return state.search.availableFilters[currentType] || {};
};

export const selectActiveFiltersCount = (state) => {
  return Object.values(state.search.currentFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
    }
    return value !== '' && value !== null && value !== undefined && value !== false;
  }).length;
};

export const selectHasSearchQuery = (state) => state.search.currentQuery.trim().length > 0;

export const selectHasSearchResults = (state) => state.search.results.length > 0;

export const selectIsSearching = (state) => 
  state.search.loading || state.search.suggestionsLoading;

export const selectSearchPagination = (state) => ({
  currentPage: state.search.currentPage,
  totalPages: state.search.totalPages,
  totalResults: state.search.totalResults,
  hasNextPage: state.search.currentPage < state.search.totalPages,
  hasPrevPage: state.search.currentPage > 1
});

export const selectSearchState = (state) => ({
  query: state.search.currentQuery,
  filters: state.search.currentFilters,
  type: state.search.currentType,
  page: state.search.currentPage
});

export default searchSlice.reducer;

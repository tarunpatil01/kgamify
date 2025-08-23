import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './usePerformance';

/**
 * Hook for auto-saving form data
 * @param {string} formId - Unique identifier for the form
 * @param {Object} formData - Current form data
 * @param {Function} saveFunction - Function to save data (optional for local storage only)
 * @param {Object} options - Configuration options
 */
export const useAutoSave = (formId, formData, saveFunction = null, options = {}) => {
  const {
    delay = 2000, // Auto-save delay in milliseconds
    enableLocalStorage = true,
    enableServerSave = true,
    onSaveSuccess = null,
    onSaveError = null,
    clearOnSubmit = true,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const saveTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  // Debounced form data to avoid excessive saves
  const debouncedFormData = useDebounce(formData, delay);

  // Local storage key
  const storageKey = `autosave_${formId}`;

  // Save to localStorage
  const saveToLocalStorage = useCallback((data) => {
    if (!enableLocalStorage) return;
    
    try {
      const saveData = {
        data,
        timestamp: new Date().toISOString(),
        formId
      };
      localStorage.setItem(storageKey, JSON.stringify(saveData));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [storageKey, formId, enableLocalStorage]);

  // Save to server
  const saveToServer = useCallback(async (data) => {
    if (!enableServerSave || !saveFunction) return;

    try {
      setIsSaving(true);
      setSaveStatus('saving');
      
      await saveFunction(data);
      
      setLastSaved(new Date());
      setSaveStatus('saved');
      onSaveSuccess?.(data);
      
      // Reset status after a delay
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      onSaveError?.(error);
      
      // Reset error status after a delay
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  }, [enableServerSave, saveFunction, onSaveSuccess, onSaveError]);

  // Main save function
  const performSave = useCallback(async (data) => {
    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedDataRef.current)) {
      return;
    }

    // Skip if data is empty or invalid
    if (!data || Object.keys(data).length === 0) {
      return;
    }

    lastSavedDataRef.current = data;

    // Save to localStorage immediately
    saveToLocalStorage(data);

    // Save to server if enabled
    if (enableServerSave && saveFunction) {
      await saveToServer(data);
    } else {
      setLastSaved(new Date());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [saveToLocalStorage, saveToServer, enableServerSave, saveFunction]);

  // Auto-save effect
  useEffect(() => {
    if (debouncedFormData) {
      performSave(debouncedFormData);
    }
  }, [debouncedFormData, performSave]);

  // Load saved data from localStorage
  const loadSavedData = useCallback(() => {
    if (!enableLocalStorage) return null;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        return parsedData.data;
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  }, [storageKey, enableLocalStorage]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    if (enableLocalStorage) {
      localStorage.removeItem(storageKey);
    }
    lastSavedDataRef.current = null;
    setLastSaved(null);
    setSaveStatus('idle');
  }, [storageKey, enableLocalStorage]);

  // Manual save function
  const forceSave = useCallback(async () => {
    if (formData) {
      await performSave(formData);
    }
  }, [formData, performSave]);

  // Check if there's unsaved data
  const hasUnsavedChanges = useCallback(() => {
    const current = JSON.stringify(formData);
    const lastSaved = JSON.stringify(lastSavedDataRef.current);
    return current !== lastSaved && formData && Object.keys(formData).length > 0;
  }, [formData]);

  // Clear on unmount if specified
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      if (clearOnSubmit && formData) {
        // Save one final time before unmounting
        performSave(formData);
      }
    };
  }, [clearOnSubmit, formData, performSave]);

  return {
    isSaving,
    lastSaved,
    saveStatus,
    loadSavedData,
    clearSavedData,
    forceSave,
    hasUnsavedChanges: hasUnsavedChanges()
  };
};

/**
 * Hook for form state management with auto-save
 */
export const useAutoSaveForm = (formId, initialData = {}, saveFunction = null, options = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [isDirty, setIsDirty] = useState(false);

  const autoSave = useAutoSave(formId, formData, saveFunction, options);

  // Load saved data on mount
  useEffect(() => {
    const savedData = autoSave.loadSavedData();
    if (savedData && Object.keys(savedData).length > 0) {
      setFormData(prev => ({ ...prev, ...savedData }));
      setIsDirty(true);
    }
  }, [autoSave]);

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  }, []);

  // Update multiple fields
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    setIsDirty(true);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);
    autoSave.clearSavedData();
  }, [initialData, autoSave]);

  // Submit form
  const submitForm = useCallback(async (submitFunction) => {
    try {
      if (submitFunction) {
        await submitFunction(formData);
      }
      
      // Clear auto-saved data after successful submission
      autoSave.clearSavedData();
      setIsDirty(false);
      
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [formData, autoSave]);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    submitForm,
    isDirty,
    ...autoSave
  };
};

/**
 * Component for displaying auto-save status
 */
export const AutoSaveStatus = ({ saveStatus, lastSaved, className = '' }) => {
  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return '🔄';
      case 'saved':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '';
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved ${lastSaved ? formatTimeAgo(lastSaved) : ''}`;
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  };

  if (saveStatus === 'idle') return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-lg">{getStatusIcon()}</span>
      <span className={`${
        saveStatus === 'error' ? 'text-red-600' : 
        saveStatus === 'saved' ? 'text-green-600' : 
        'text-gray-600'
      }`}>
        {getStatusText()}
      </span>
    </div>
  );
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
};

export default useAutoSave;

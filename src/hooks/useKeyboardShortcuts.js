import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to functions
 * @param {Object} options - Configuration options
 */
export const useKeyboardShortcuts = (shortcuts, options = {}) => {
  const {
    enabled = true,
    preventDefault = true,
    target = null, // DOM element to attach listeners to (null = window)
    dependencies = [],
  } = options;

  const shortcutsRef = useRef(shortcuts);
  const optionsRef = useRef(options);

  // Update refs when shortcuts or options change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    optionsRef.current = options;
  }, [shortcuts, options]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    const currentShortcuts = shortcutsRef.current;
    const currentOptions = optionsRef.current;

    // Build key combination string
    const keyCombo = buildKeyCombo(event);
    
    // Check if this combination exists in our shortcuts
    const action = currentShortcuts[keyCombo];
    
    if (action && typeof action === 'function') {
      if (currentOptions.preventDefault) {
        event.preventDefault();
      }
      
      // Execute the action
      action(event);
    }
  }, [enabled]);

  useEffect(() => {
    const targetElement = target || window;
    
    if (enabled) {
      targetElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled, target, ...dependencies]);
};

/**
 * Build key combination string from KeyboardEvent
 */
const buildKeyCombo = (event) => {
  const parts = [];
  
  // Add modifiers
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('meta'); // Cmd key on Mac
  
  // Add the main key
  const key = event.key.toLowerCase();
  
  // Handle special keys
  const keyMap = {
    ' ': 'space',
    'arrowup': 'up',
    'arrowdown': 'down',
    'arrowleft': 'left',
    'arrowright': 'right',
    'enter': 'enter',
    'escape': 'esc',
    'backspace': 'backspace',
    'delete': 'del',
    'tab': 'tab',
  };
  
  const mappedKey = keyMap[key] || key;
  parts.push(mappedKey);
  
  return parts.join('+');
};

/**
 * Hook for global application shortcuts
 */
export const useGlobalShortcuts = () => {
  const shortcuts = {
    // Navigation shortcuts
    'ctrl+1': () => navigateTo('/dashboard'),
    'ctrl+2': () => navigateTo('/jobs'),
    'ctrl+3': () => navigateTo('/applications'),
    'ctrl+4': () => navigateTo('/post-job'),
    
    // Form shortcuts
    'ctrl+s': (event) => {
      event.preventDefault();
      triggerAutoSave();
    },
    
    // Search shortcuts
    'ctrl+k': (event) => {
      event.preventDefault();
      focusSearchInput();
    },
    'ctrl+/': (event) => {
      event.preventDefault();
      toggleShortcutsHelp();
    },
    
    // Quick actions
    'ctrl+n': (event) => {
      event.preventDefault();
      createNewItem();
    },
    
    // Accessibility shortcuts
    'alt+m': () => toggleMobileMenu(),
    'alt+t': () => toggleTheme(),
    'esc': () => closeModalsOrDrawers(),
  };

  useKeyboardShortcuts(shortcuts);
};

/**
 * Hook for form-specific shortcuts
 */
export const useFormShortcuts = (formRef, options = {}) => {
  const {
    onSave = null,
    onCancel = null,
    onSubmit = null,
    onReset = null,
  } = options;

  const shortcuts = {
    'ctrl+s': (event) => {
      event.preventDefault();
      onSave?.();
    },
    'ctrl+enter': (event) => {
      event.preventDefault();
      onSubmit?.();
    },
    'esc': () => {
      onCancel?.();
    },
    'ctrl+r': (event) => {
      event.preventDefault();
      onReset?.();
    },
    'tab': (event) => {
      // Enhanced tab navigation
      handleTabNavigation(event, formRef.current);
    },
  };

  useKeyboardShortcuts(shortcuts, {
    target: formRef.current,
    dependencies: [formRef.current],
  });
};

/**
 * Hook for data table shortcuts
 */
export const useTableShortcuts = (tableRef, options = {}) => {
  const {
    onSelectAll = null,
    onDelete = null,
    onEdit = null,
    onRefresh = null,
  } = options;

  const shortcuts = {
    'ctrl+a': (event) => {
      event.preventDefault();
      onSelectAll?.();
    },
    'delete': () => {
      onDelete?.();
    },
    'enter': () => {
      onEdit?.();
    },
    'f5': (event) => {
      event.preventDefault();
      onRefresh?.();
    },
    'up': (event) => {
      event.preventDefault();
      navigateTableRow(tableRef.current, -1);
    },
    'down': (event) => {
      event.preventDefault();
      navigateTableRow(tableRef.current, 1);
    },
  };

  useKeyboardShortcuts(shortcuts, {
    target: tableRef.current,
    dependencies: [tableRef.current],
  });
};

/**
 * Component for displaying keyboard shortcuts help
 */
export const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: ['Ctrl', '1'], description: 'Go to Dashboard' },
      { keys: ['Ctrl', '2'], description: 'Go to Jobs' },
      { keys: ['Ctrl', '3'], description: 'Go to Applications' },
      { keys: ['Ctrl', '4'], description: 'Post New Job' },
    ]},
    { category: 'Search & Actions', items: [
      { keys: ['Ctrl', 'K'], description: 'Focus Search' },
      { keys: ['Ctrl', 'N'], description: 'Create New' },
      { keys: ['Ctrl', 'S'], description: 'Save Form' },
      { keys: ['Ctrl', '/'], description: 'Show This Help' },
    ]},
    { category: 'Forms', items: [
      { keys: ['Ctrl', 'Enter'], description: 'Submit Form' },
      { keys: ['Ctrl', 'R'], description: 'Reset Form' },
      { keys: ['Esc'], description: 'Cancel/Close' },
      { keys: ['Tab'], description: 'Next Field' },
    ]},
    { category: 'Tables', items: [
      { keys: ['Ctrl', 'A'], description: 'Select All' },
      { keys: ['Delete'], description: 'Delete Selected' },
      { keys: ['Enter'], description: 'Edit Selected' },
      { keys: ['↑', '↓'], description: 'Navigate Rows' },
    ]},
    { category: 'General', items: [
      { keys: ['Alt', 'M'], description: 'Toggle Menu' },
      { keys: ['Alt', 'T'], description: 'Toggle Theme' },
      { keys: ['F5'], description: 'Refresh' },
    ]},
  ];

  useKeyboardShortcuts({
    'esc': onClose,
    'ctrl+/': onClose,
  }, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortcuts.map((category) => (
            <div key={category.category} className="space-y-3">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </span>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <kbd
                          key={keyIndex}
                          className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 text-center">
          Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> or{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl</kbd> +{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">/</kbd> to close this help
        </div>
      </div>
    </div>
  );
};

// Helper functions
const navigateTo = (path) => {
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = path;
  }
};

const triggerAutoSave = () => {
  // Trigger auto-save for the currently focused form
  const activeElement = document.activeElement;
  const form = activeElement?.closest('form');
  
  if (form) {
    // Dispatch a custom event that forms can listen to
    form.dispatchEvent(new CustomEvent('autoSave', { bubbles: true }));
  }
};

const focusSearchInput = () => {
  const searchInput = document.querySelector('[data-search-input], input[type="search"], input[placeholder*="search" i]');
  if (searchInput) {
    searchInput.focus();
  }
};

const toggleShortcutsHelp = () => {
  // Dispatch event to toggle shortcuts help modal
  document.dispatchEvent(new CustomEvent('toggleShortcutsHelp'));
};

const createNewItem = () => {
  // Context-aware new item creation
  const currentPath = window.location.pathname;
  
  if (currentPath.includes('/jobs')) {
    navigateTo('/post-job');
  } else if (currentPath.includes('/dashboard')) {
    navigateTo('/post-job');
  } else {
    // Default action
    navigateTo('/post-job');
  }
};

const toggleMobileMenu = () => {
  const menuButton = document.querySelector('[data-mobile-menu-toggle]');
  if (menuButton) {
    menuButton.click();
  }
};

const toggleTheme = () => {
  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.click();
  }
};

const closeModalsOrDrawers = () => {
  // Close any open modals or drawers
  const closeButtons = document.querySelectorAll('[data-modal-close], [data-drawer-close], .modal-close');
  if (closeButtons.length > 0) {
    closeButtons[0].click();
  }
};

const handleTabNavigation = (event, formElement) => {
  if (!formElement) return;
  
  const focusableElements = formElement.querySelectorAll(
    'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.shiftKey) {
    // Shift + Tab (backward)
    if (document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab (forward)
    if (document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

const navigateTableRow = (tableElement, direction) => {
  if (!tableElement) return;
  
  const rows = tableElement.querySelectorAll('tr[data-row-index], .table-row');
  const currentRow = document.activeElement?.closest('tr, .table-row');
  
  if (!currentRow || rows.length === 0) return;
  
  const currentIndex = Array.from(rows).indexOf(currentRow);
  const newIndex = currentIndex + direction;
  
  if (newIndex >= 0 && newIndex < rows.length) {
    const newRow = rows[newIndex];
    const focusableElement = newRow.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])');
    
    if (focusableElement) {
      focusableElement.focus();
    } else {
      newRow.focus();
    }
  }
};

export default useKeyboardShortcuts;

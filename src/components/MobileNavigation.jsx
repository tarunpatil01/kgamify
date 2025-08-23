import { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaChevronDown, FaSearch, FaBars, FaTimes } from 'react-icons/fa';
import { useMobile } from '../hooks/useMobile';
import { MobileButton, MobileInput, MobileDrawer } from './MobileComponents';

/**
 * Mobile-first navigation component with touch gestures
 */
const MobileNavigation = ({ 
  items = [], 
  currentPath = '', 
  onNavigate,
  showSearchProp = true,
  brandLogo,
  brandName = 'KGamify'
}) => {
  const { isMobile, orientation } = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleSearch = () => setShowSearchBar(!showSearchBar);

  const handleNavigate = (path) => {
    onNavigate(path);
    closeMenu();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearchBar(false);
    }
  };

  // Mobile navigation with bottom tabs
  if (isMobile && orientation === 'portrait') {
    return (
      <>
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Brand */}
            <div className="flex items-center space-x-2">
              {brandLogo && (
                <img src={brandLogo} alt={brandName} className="h-8 w-8 rounded-full" />
              )}
              <span className="font-bold text-kgamify-500">{brandName}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {showSearchProp && (
                <MobileButton
                  variant="ghost"
                  size="sm"
                  onClick={toggleSearch}
                  className="p-2"
                >
                  <FaSearch className="h-4 w-4" />
                </MobileButton>
              )}
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(true)}
                className="p-2"
              >
                <FaBars className="h-4 w-4" />
              </MobileButton>
            </div>
          </div>

          {/* Search Bar */}
          {showSearchBar && (
            <div className="px-4 pb-3">
              <form onSubmit={handleSearch}>
                <MobileInput
                  type="search"
                  placeholder="Search jobs, applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<FaSearch className="h-4 w-4 text-gray-400" />}
                />
              </form>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-around py-2">
            {items.slice(0, 4).map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg
                  min-w-[60px] min-h-[60px] touch-manipulation
                  ${currentPath === item.path 
                    ? 'text-kgamify-500 bg-kgamify-50 dark:bg-kgamify-900/20' 
                    : 'text-gray-600 dark:text-gray-400'
                  }
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Side Menu Drawer */}
        <MobileDrawer isOpen={isMenuOpen} onClose={closeMenu} position="right">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <MobileButton
                variant="ghost"
                size="sm"
                onClick={closeMenu}
                className="p-2"
              >
                <FaTimes className="h-4 w-4" />
              </MobileButton>
            </div>
            
            <nav className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`
                    w-full flex items-center space-x-3 p-3 rounded-lg text-left
                    transition-colors touch-manipulation
                    ${currentPath === item.path 
                      ? 'bg-kgamify-500 text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </MobileDrawer>
      </>
    );
  }

  // Desktop/tablet navigation (existing navbar)
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop navigation content */}
          <div className="flex items-center space-x-8">
            {/* Brand */}
            <div className="flex items-center space-x-2">
              {brandLogo && (
                <img src={brandLogo} alt={brandName} className="h-8 w-8 rounded-full" />
              )}
              <span className="font-bold text-kgamify-500 text-xl">{brandName}</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              {items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
                    transition-colors
                    ${currentPath === item.path 
                      ? 'text-kgamify-500 bg-kgamify-50 dark:bg-kgamify-900/20' 
                      : 'text-gray-700 dark:text-gray-300 hover:text-kgamify-500'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          {showSearchProp && (
            <div className="flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch}>
                <MobileInput
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<FaSearch className="h-4 w-4 text-gray-400" />}
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

/**
 * Mobile-optimized dropdown component
 */
const MobileDropdown = ({ 
  trigger, 
  items = [], 
  onSelect,
  position = 'bottom',
  className = '' 
}) => {
  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (item) => {
    onSelect(item);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {trigger}
        <FaChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Mobile: Bottom Sheet */}
          {isMobile ? (
            <div className="fixed inset-0 z-50 flex items-end">
              <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setIsOpen(false)}
              />
              <div className="relative w-full bg-white dark:bg-gray-800 rounded-t-xl shadow-xl max-h-96 overflow-y-auto">
                <div className="p-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </div>
                  {items.map((item, index) => (
                    <button
                      key={item.value || index}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left touch-manipulation"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop: Regular Dropdown */
            <div className={`
              absolute z-50 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
              ${position === 'top' ? 'bottom-full mb-2' : 'top-full'}
            `}>
              <div className="py-1">
                {items.map((item, index) => (
                  <button
                    key={item.value || index}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Mobile-optimized form component with touch-friendly inputs
 */
const MobileForm = ({ 
  children, 
  onSubmit, 
  className = '',
  autoSave = false,
  showProgress = false 
}) => {
  const { isMobile } = useMobile();
  const [isDirty, setIsDirty] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`space-y-4 ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {showProgress && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-kgamify-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      <div className={`space-y-4 ${isMobile ? 'touch-pan-y' : ''}`}>
        {children}
      </div>

      {autoSave && isDirty && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Auto-saving...
        </div>
      )}
    </form>
  );
};

// PropTypes
MobileNavigation.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired
  })),
  currentPath: PropTypes.string,
  onNavigate: PropTypes.func.isRequired,
  showSearchProp: PropTypes.bool,
  brandLogo: PropTypes.string,
  brandName: PropTypes.string
};

MobileDropdown.propTypes = {
  trigger: PropTypes.node.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType
  })),
  onSelect: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['top', 'bottom']),
  className: PropTypes.string
};

MobileForm.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  className: PropTypes.string,
  autoSave: PropTypes.bool,
  showProgress: PropTypes.bool
};

export {
  MobileNavigation,
  MobileDropdown,
  MobileForm
};

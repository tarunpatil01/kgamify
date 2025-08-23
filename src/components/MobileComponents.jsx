import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMobile, useTouchGestures } from '../hooks/useMobile';

/**
 * Mobile-optimized card component with touch gestures
 */
const MobileCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  className = '', 
  touchFeedback = true,
  elevation = 'md'
}) => {
  const { isMobile, touchSupport } = useMobile();
  const [isPressed, setIsPressed] = useState(false);
  
  const touchGestures = useTouchGestures(
    onSwipeLeft,
    onSwipeRight,
    null,
    null
  );

  const elevationClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const handleTouchStart = (e) => {
    if (touchFeedback) setIsPressed(true);
    touchGestures.onTouchStart(e);
  };

  const handleTouchEnd = (e) => {
    if (touchFeedback) setIsPressed(false);
    touchGestures.onTouchEnd(e);
  };

  return (
    <div
      className={`
        card-kgamify
        ${elevationClasses[elevation]}
        ${isMobile ? 'touch-manipulation' : ''}
        ${isPressed && touchFeedback ? 'scale-95 opacity-90' : ''}
        ${touchSupport ? 'cursor-pointer' : ''}
        transition-all duration-150 ease-in-out
        ${className}
      `}
      onTouchStart={touchSupport ? handleTouchStart : undefined}
      onTouchMove={touchSupport ? touchGestures.onTouchMove : undefined}
      onTouchEnd={touchSupport ? handleTouchEnd : undefined}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </div>
  );
};

/**
 * Mobile-optimized button with touch feedback
 */
const MobileButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  fullWidth = false,
  touchFeedback = true,
  className = '',
  ...props
}) => {
  const { isMobile, touchSupport } = useMobile();
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = `
    font-medium rounded-lg transition-all duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${isMobile ? 'touch-manipulation' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${isPressed && touchFeedback && !disabled ? 'scale-95' : ''}
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-kgamify-500 to-kgamify-pink-500 
      text-white shadow-md hover:shadow-lg
      focus:ring-kgamify-500
    `,
    secondary: `
      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
      border border-gray-300 dark:border-gray-600 shadow-sm
      hover:bg-gray-50 dark:hover:bg-gray-700
      focus:ring-gray-500
    `,
    outline: `
      border-2 border-kgamify-500 text-kgamify-500
      hover:bg-kgamify-500 hover:text-white
      focus:ring-kgamify-500
    `,
    ghost: `
      text-kgamify-500 hover:bg-kgamify-50 dark:hover:bg-kgamify-900/20
      focus:ring-kgamify-500
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
    xl: 'px-8 py-4 text-lg min-h-[48px]'
  };

  // Ensure minimum touch target size on mobile (44px)
  const mobileSize = isMobile && size === 'sm' ? 'md' : size;

  const handleTouchStart = () => {
    if (touchFeedback && !disabled) setIsPressed(true);
  };

  const handleTouchEnd = () => {
    if (touchFeedback) setIsPressed(false);
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[mobileSize]}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      onTouchStart={touchSupport ? handleTouchStart : undefined}
      onTouchEnd={touchSupport ? handleTouchEnd : undefined}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span className="ml-2">Loading...</span>
        </div>
      ) : children}
    </button>
  );
};

/**
 * Mobile-optimized input field
 */
const MobileInput = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  icon,
  className = '',
  ...props
}) => {
  const { getMobileInputProps } = useMobile();
  const mobileProps = getMobileInputProps(type);

  return (
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          input-kgamify
          ${icon ? 'pl-10' : ''}
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        style={{
          ...mobileProps.style,
          touchAction: 'manipulation'
        }}
        {...mobileProps}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Mobile-optimized navigation drawer
 */
const MobileDrawer = ({ 
  isOpen, 
  onClose, 
  children, 
  position = 'left',
  overlay = true 
}) => {
  const { isMobile } = useMobile();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isMobile) return null;

  const positionClasses = {
    left: 'left-0 transform -translate-x-full',
    right: 'right-0 transform translate-x-full',
    top: 'top-0 left-0 right-0 transform -translate-y-full',
    bottom: 'bottom-0 left-0 right-0 transform translate-y-full'
  };

  const activePositionClasses = {
    left: 'transform translate-x-0',
    right: 'transform translate-x-0',
    top: 'transform translate-y-0',
    bottom: 'transform translate-y-0'
  };

  return (
    <>
      {/* Overlay */}
      {overlay && (
        <div
          className={`
            fixed inset-0 bg-black transition-opacity duration-300 z-40
            ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
          `}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed z-50 bg-white dark:bg-gray-800 shadow-xl
          transition-transform duration-300 ease-in-out
          ${position === 'left' || position === 'right' ? 'top-0 bottom-0 w-80 max-w-xs' : 'h-auto max-h-96'}
          ${positionClasses[position]}
          ${isOpen ? activePositionClasses[position] : ''}
        `}
        style={{ touchAction: 'none' }}
      >
        {children}
      </div>
    </>
  );
};

/**
 * Mobile-optimized list with swipe actions
 */
const MobileList = ({ 
  items, 
  renderItem, 
  onSwipeLeft, 
  onSwipeRight, 
  className = '' 
}) => {
  const { isMobile } = useMobile();

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <MobileCard
          key={item.id || index}
          onSwipeLeft={() => onSwipeLeft?.(item, index)}
          onSwipeRight={() => onSwipeRight?.(item, index)}
          className="p-4"
        >
          {renderItem(item, index)}
        </MobileCard>
      ))}
    </div>
  );
};

/**
 * Mobile-optimized bottom sheet
 */
const MobileBottomSheet = ({ 
  isOpen, 
  onClose, 
  children, 
  height = 'auto',
  maxHeight = '80vh' 
}) => {
  const { isMobile } = useMobile();
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  const touchGestures = useTouchGestures(
    null,
    null,
    null,
    () => {
      // Swipe down to close
      if (currentY - startY > 100) {
        onClose();
      }
    }
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isMobile) return null;

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.targetTouches[0].clientY);
    touchGestures.onTouchStart(e);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setCurrentY(e.targetTouches[0].clientY);
    touchGestures.onTouchMove(e);
  };

  const handleTouchEnd = (e) => {
    setIsDragging(false);
    touchGestures.onTouchEnd(e);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`
          fixed inset-0 bg-black transition-opacity duration-300 z-40
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-800 rounded-t-xl shadow-xl
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'transform translate-y-0' : 'transform translate-y-full'}
        `}
        style={{
          height,
          maxHeight,
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 40px)' }}>
          {children}
        </div>
      </div>
    </>
  );
};

// PropTypes
MobileCard.propTypes = {
  children: PropTypes.node.isRequired,
  onSwipeLeft: PropTypes.func,
  onSwipeRight: PropTypes.func,
  className: PropTypes.string,
  touchFeedback: PropTypes.bool,
  elevation: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
};

MobileButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  touchFeedback: PropTypes.bool,
  className: PropTypes.string
};

MobileInput.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  error: PropTypes.string,
  icon: PropTypes.node,
  className: PropTypes.string
};

MobileDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  overlay: PropTypes.bool
};

MobileList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  onSwipeLeft: PropTypes.func,
  onSwipeRight: PropTypes.func,
  className: PropTypes.string
};

MobileBottomSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  height: PropTypes.string,
  maxHeight: PropTypes.string
};

export {
  MobileCard,
  MobileButton,
  MobileInput,
  MobileDrawer,
  MobileList,
  MobileBottomSheet
};

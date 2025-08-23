import { useState, useEffect } from 'react';

/**
 * Custom hook for mobile-first responsive design
 * Provides mobile-specific utilities and responsive breakpoint detection
 */
export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  const [orientation, setOrientation] = useState('portrait');
  const [touchSupport, setTouchSupport] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);

  useEffect(() => {
    // Detect mobile device and screen size
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Mobile breakpoints
      if (width <= 640) {
        setScreenSize('mobile');
        setIsMobile(true);
      } else if (width <= 768) {
        setScreenSize('tablet');
        setIsMobile(true);
      } else if (width <= 1024) {
        setScreenSize('laptop');
        setIsMobile(false);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
      }

      // Orientation detection
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    // Touch support detection
    const detectTouch = () => {
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      navigator.msMaxTouchPoints > 0;
      setTouchSupport(hasTouch);
    };

    // Network information (when available)
    const getNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }
    };

    // Initial checks
    checkDevice();
    detectTouch();
    getNetworkInfo();

    // Event listeners
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    // Network change listener
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', getNetworkInfo);
    }

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', getNetworkInfo);
      }
    };
  }, []);

  return {
    isMobile,
    screenSize,
    orientation,
    touchSupport,
    networkInfo,
    isSlowConnection: networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g',
    isSaveDataMode: networkInfo?.saveData || false
  };
};

/**
 * Hook for touch gesture handling
 */
export const useTouchGestures = (onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Determine primary direction
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
      if (isRightSwipe && onSwipeRight) onSwipeRight();
    } else {
      // Vertical swipe
      if (isUpSwipe && onSwipeUp) onSwipeUp();
      if (isDownSwipe && onSwipeDown) onSwipeDown();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

/**
 * Hook for mobile-optimized form handling
 */
export const useMobileForm = () => {
  const { isMobile, touchSupport } = useMobile();

  const getMobileInputProps = (type = 'text') => {
    const baseProps = {
      autoComplete: 'off',
      autoCapitalize: 'off',
      autoCorrect: 'off',
      spellCheck: false
    };

    if (!isMobile) return baseProps;

    // Mobile-specific optimizations
    const mobileProps = {
      ...baseProps,
      // Prevent zoom on iOS
      style: { fontSize: '16px' }
    };

    // Input type specific optimizations
    switch (type) {
      case 'email':
        return {
          ...mobileProps,
          inputMode: 'email',
          autoComplete: 'email'
        };
      case 'tel':
        return {
          ...mobileProps,
          inputMode: 'tel',
          autoComplete: 'tel'
        };
      case 'number':
        return {
          ...mobileProps,
          inputMode: 'numeric',
          pattern: '[0-9]*'
        };
      case 'search':
        return {
          ...mobileProps,
          inputMode: 'search',
          autoComplete: 'off'
        };
      default:
        return mobileProps;
    }
  };

  const getMobileTextareaProps = () => ({
    style: { fontSize: '16px' },
    autoComplete: 'off',
    autoCapitalize: 'sentences',
    autoCorrect: 'on',
    spellCheck: true
  });

  return {
    isMobile,
    touchSupport,
    getMobileInputProps,
    getMobileTextareaProps
  };
};

/**
 * Hook for mobile-optimized image loading
 */
export const useMobileImage = () => {
  const { isMobile, networkInfo } = useMobile();

  const getOptimizedImageProps = (src, alt) => {
    const isSlowConnection = networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g';
    const isSaveData = networkInfo?.saveData;

    return {
      src: isSaveData || isSlowConnection ? generateLowQualityUrl(src) : src,
      alt,
      loading: 'lazy',
      decoding: 'async',
      style: {
        maxWidth: '100%',
        height: 'auto'
      }
    };
  };

  const generateLowQualityUrl = (src) => {
    // If using Cloudinary, add quality parameters
    if (src.includes('cloudinary.com')) {
      return src.replace('/image/upload/', '/image/upload/q_auto:low,f_auto,w_auto,dpr_auto/');
    }
    return src;
  };

  return {
    getOptimizedImageProps,
    isSlowConnection: networkInfo?.effectiveType === 'slow-2g' || networkInfo?.effectiveType === '2g',
    isSaveDataMode: networkInfo?.saveData || false
  };
};

/**
 * Hook for mobile navigation patterns
 */
export const useMobileNavigation = () => {
  const { isMobile, orientation } = useMobile();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithTransition = (navigate, path) => {
    setIsNavigating(true);
    
    // Add navigation transition
    document.body.style.transition = 'opacity 0.2s ease-in-out';
    document.body.style.opacity = '0.9';
    
    setTimeout(() => {
      navigate(path);
      document.body.style.opacity = '1';
      setIsNavigating(false);
    }, 200);
  };

  const getNavStyle = () => ({
    position: isMobile ? 'fixed' : 'relative',
    bottom: isMobile && orientation === 'portrait' ? 0 : 'auto',
    top: isMobile && orientation === 'landscape' ? 0 : 'auto',
    left: 0,
    right: 0,
    zIndex: 50
  });

  return {
    isMobile,
    orientation,
    isNavigating,
    navigateWithTransition,
    getNavStyle
  };
};

export default useMobile;

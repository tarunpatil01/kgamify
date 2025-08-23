import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from '../store/slices/authSlice';
import webSocketService, { initializeWebSocket } from '../services/webSocketService';

/**
 * Service Integration Component
 * Handles initialization of WebSocket and other services based on auth state
 */
const ServiceIntegration = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);

  useEffect(() => {
    // Initialize WebSocket when user is authenticated
    if (isAuthenticated && user && !webSocketService.isConnected()) {
      initializeWebSocket();
    }

    // Cleanup WebSocket when user logs out
    if (!isAuthenticated && webSocketService.isConnected()) {
      webSocketService.disconnect();
    }
  }, [isAuthenticated, user]);

  // This component doesn't render anything
  return null;
};

export default ServiceIntegration;

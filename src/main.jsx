import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import './App.css'
import './index.css'
import App from './App.jsx'
import { store, persistor } from './store'
import LoadingSpinner from './components/LoadingSpinner'
import ServiceIntegration from './components/ServiceIntegration'
import { registerServiceWorker, unregisterServiceWorkers } from './utils/serviceWorker.js'
import { injectCriticalCSS } from './utils/criticalCSS.js'
import { initializePrefetching, preloadCriticalResources } from './utils/prefetching.js'

// Inject critical CSS immediately for faster first paint
injectCriticalCSS();

// Preload critical resources
preloadCriticalResources();

// Initialize intelligent prefetching (production only to avoid conflicts with Vite dev server)
if (import.meta.env.PROD) {
  initializePrefetching();
}

// Register service worker for caching and offline functionality
// Only in production to avoid development conflicts
if (import.meta.env.PROD) {
  registerServiceWorker();
} else {
  // In development mode, unregister any existing service workers to prevent conflicts
  unregisterServiceWorkers();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate 
        loading={<LoadingSpinner fullScreen text="Loading application..." />} 
        persistor={persistor}
      >
        <ServiceIntegration />
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <App />
          </div>
        </div>
      </PersistGate>
    </Provider>
  </StrictMode>,
)

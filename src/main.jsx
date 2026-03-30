import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import './App.css'
import './index.css'
import App from './App.jsx'
import { store, persistor } from './store'
import LoadingSpinner from './components/LoadingSpinner'
import ServiceIntegration from './components/ServiceIntegration'
import { unregisterServiceWorkers } from './utils/serviceWorker.js'
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

// Disable service worker registration for now to avoid stale cached deployments.
// Always unregister existing workers so route changes (like '/' landing page) apply immediately.
unregisterServiceWorkers();

createRoot(document.getElementById('root')).render(
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
  </Provider>,
)

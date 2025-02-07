import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import Footer from './components/Footer'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <App />
      </div>
    </div>
  // </StrictMode>,
)

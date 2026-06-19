import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Intercept fetch calls to dynamically replace localhost API with production API URL
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  const customApiUrl = import.meta.env.VITE_API_URL;
  if (customApiUrl && typeof url === 'string' && url.startsWith('http://localhost:5000/api')) {
    url = url.replace('http://localhost:5000/api', customApiUrl);
  }
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

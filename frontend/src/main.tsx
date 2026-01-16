import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Error handling for mobile debugging
window.onerror = function(message, source, lineno, _colno, _error) {
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:20px;z-index:9999;font-size:14px;'
  errorDiv.innerHTML = `Error: ${message}<br>Source: ${source}<br>Line: ${lineno}`
  document.body.appendChild(errorDiv)
  return false
}

window.addEventListener('unhandledrejection', (event) => {
  const errorDiv = document.createElement('div')
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:orange;color:white;padding:20px;z-index:9999;font-size:14px;'
  errorDiv.innerHTML = `Promise Error: ${event.reason}`
  document.body.appendChild(errorDiv)
})

// Show loading indicator
const root = document.getElementById('root')
if (root) {
  root.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;color:white;font-size:18px;">Загрузка...</div>'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/noto-sans-tamil'
import '@fontsource-variable/noto-serif-tamil'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { LangProvider } from './i18n.jsx'
import './index.css'

// Saved theme / color / language apply pannu (default: bright light + peacock 🦚)
const root = document.documentElement
try {
  root.dataset.theme = localStorage.getItem('thodar-theme') || 'light'
  root.dataset.accent = localStorage.getItem('thodar-accent') || 'peacock'
  root.lang = localStorage.getItem('lang') || 'en'
} catch {
  root.dataset.theme = 'light'
  root.dataset.accent = 'peacock'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)

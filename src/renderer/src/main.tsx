import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { supabaseApi } from './supabaseApi'

// Inject Supabase Cloud & Offline-First API into window.api
// @ts-ignore
window.api = supabaseApi

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)


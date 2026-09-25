import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.tsx'
import UpdateBanner from './app/UpdateBanner.tsx'
import { requestPersistence } from './lib/storage.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdateBanner />
  </StrictMode>,
)

void requestPersistence()

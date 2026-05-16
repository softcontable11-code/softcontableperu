import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { webApiBridge } from './services/apiBridge'

// Inyectar el puente de API si no estamos en Electron
if (!(window as any).electronAPI) {
  console.log('[BRIDGE] Entorno Web detectado. Inyectando puente de API para Railway.');
  (window as any).electronAPI = webApiBridge;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

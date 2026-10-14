import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App.tsx'
import { followSystemCalm } from './lib/calm.ts'
import { t } from './lib/i18n.ts'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

// Set calm mode before the first paint so nothing animates by mistake.
followSystemCalm()
document.title = t('app.name')

// HashRouter keeps routes after "#", so any static host can serve the app
// without server-side rewrite rules. See docs/DECISIONS.md.
createRoot(root).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

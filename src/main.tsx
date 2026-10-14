import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App.tsx'
import { followSystemCalm, setCalmSetting } from './lib/calm.ts'
import { setLang, t } from './lib/i18n.ts'
import { useStore } from './lib/store.ts'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element in index.html')

// Calm mode and language follow the saved settings, starting before the first paint.
// (The store has already loaded from localStorage at this point.)
followSystemCalm()
const applySettings = () => {
  const { settings } = useStore.getState()
  setCalmSetting(settings.calmMotion)
  setLang(settings.lang)
  document.documentElement.lang = settings.lang
}
applySettings()
useStore.subscribe(applySettings)
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

import { Route, Routes } from 'react-router'
import { t } from '@/lib/i18n'

// The empty shell. Real screens and routes arrive in Phase 1.
function Home() {
  return (
    <main>
      <h1>{t('app.name')}</h1>
      <p lang="hi">{t('app.nameHindi')}</p>
      <p>{t('app.tagline')}</p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

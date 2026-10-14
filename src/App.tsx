import { Route, Routes } from 'react-router'
import { t } from '@/lib/i18n'

// The empty shell. Real screens and routes arrive in Phase 1.
function Home() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="max-w-md rounded-card bg-plaster-deep p-8 text-center shadow-soft">
        <h1 className="text-3xl font-semibold text-terracotta-deep">{t('app.name')}</h1>
        <p lang="hi" className="mt-1 text-xl text-brass">
          {t('app.nameHindi')}
        </p>
        <p className="mt-4 text-ink-soft">{t('app.tagline')}</p>
      </div>
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

import { Link, NavLink, Outlet } from 'react-router'
import { t, type StringKey } from '@/lib/i18n'
import { HelpButton } from './HelpButton'
import { SettingsDialog } from './SettingsDialog'

const navItems: { to: string; label: StringKey }[] = [
  { to: '/town', label: 'nav.town' },
  { to: '/book', label: 'nav.book' },
  { to: '/community', label: 'nav.community' },
  { to: '/me', label: 'nav.me' },
]

/**
 * The frame around every screen except the Help Centre:
 * a top bar with the logo, "Need help?" and Settings, and (with `nav`)
 * the main navigation: in the top bar on wide screens, at the bottom on phones.
 */
export function Shell({ nav = false }: { nav?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        onClick={(event) => {
          // HashRouter uses the URL hash for routes, so move focus by hand.
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-button focus:bg-plaster focus:p-3"
      >
        {t('shell.skip')}
      </a>

      <header className="sticky top-0 z-10 border-b border-sand bg-plaster/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <Link
            to="/"
            aria-label={t('shell.home')}
            className="inline-flex min-h-tap items-center text-xl font-semibold text-terracotta-deep"
          >
            {t('app.name')}
          </Link>
          {nav && <NavLinks className="ml-6 hidden gap-1 md:flex" />}
          <div className="ml-auto flex items-center gap-2">
            <HelpButton />
            <SettingsDialog />
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      {nav && (
        <div className="sticky bottom-0 border-t border-sand bg-plaster-deep md:hidden">
          <NavLinks className="mx-auto flex max-w-md justify-around" />
        </div>
      )}
    </div>
  )
}

function NavLinks({ className }: { className: string }) {
  return (
    <nav aria-label={t('nav.label')} className={className}>
      {navItems.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-button px-3 font-semibold text-ink-soft hover:bg-marigold-soft aria-[current=page]:bg-marigold-soft aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4"
        >
          {t(label)}
        </NavLink>
      ))}
    </nav>
  )
}

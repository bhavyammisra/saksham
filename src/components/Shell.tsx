import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { t, type StringKey } from '@/lib/i18n'
import { DemoChip, useDemoMode } from './DemoMode'
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
export function Shell({ nav = false, immersive = false }: { nav?: boolean; immersive?: boolean }) {
  const logoDemo = useDemoMode() // type "demo", or hold the logo for 2 seconds
  // The title menu shows the big logo itself, so the small one in the bar is left out there.
  const onTitle = useLocation().pathname === '/'
  return (
    <div className="relative flex min-h-dvh flex-col">
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

      {/* Immersive screens (the cover screens) sit under a see-through top bar. */}
      <header
        className={
          immersive
            ? 'absolute inset-x-0 top-0 z-20 font-ui'
            : 'sticky top-0 z-10 border-b border-sand bg-plaster/95'
        }
      >
        <div className={`mx-auto flex items-center gap-2 px-4 py-2 ${immersive ? 'max-w-6xl' : 'max-w-5xl'}`}>
          {!onTitle && <Link
            to="/"
            {...logoDemo}
            aria-label={t('shell.home')}
            className={`inline-flex min-h-tap items-center ${immersive ? 'cover-wordmark text-base uppercase text-espresso' : 'text-xl font-semibold text-terracotta-deep'}`}
          >
            {t('app.name')}
          </Link>}
          {nav && <NavLinks className="ml-6 hidden gap-1 md:flex" />}
          <div className="ml-auto flex items-center gap-2">
            <DemoChip />
            <HelpButton />
            {/* The title menu has its own Settings item. */}
            {!onTitle && <SettingsDialog />}
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

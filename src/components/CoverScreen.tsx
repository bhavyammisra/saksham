import type { ReactNode, Ref } from 'react'
import './cover.css'

/**
 * Full-screen layout for the screens before the game (title menu, new game, customiser, players):
 * a plain warm beige page (D-034), with the screen's content in front.
 */
export function CoverScreen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="cover relative isolate min-h-dvh overflow-hidden">
      <main id="main" tabIndex={-1} className={`relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-20 outline-none ${className}`}>
        {children}
      </main>
    </div>
  )
}

/** The h1 of a cover screen (focusable, so multi-step screens can move focus to it). */
export function CoverHeading({ children, headingRef }: { children: ReactNode; headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold tracking-tight text-espresso outline-none md:text-2xl [&:focus-visible]:shadow-none [&:focus-visible]:outline-none">
      {children}
    </h1>
  )
}

/** "Step 1 of 2" with a pip for each step. */
export function Steps({ n, of, label }: { n: number; of: number; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: of }, (_, i) => (
          <span key={i} className={`h-1 rounded-pill ${i < n ? 'w-6 bg-rust' : 'w-3 bg-oat'}`} />
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-umber">{label}</p>
    </div>
  )
}

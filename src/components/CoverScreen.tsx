import type { ReactNode, Ref } from 'react'
import { CoverBackdrop } from '@/art/cover'

/**
 * Full-screen layout for the screens before the game (welcome, name, age, character, players):
 * the painted cover backdrop behind, the screen's content in front.
 * `dim` softens the picture behind forms so they are easy to read.
 */
export function CoverScreen({ children, dim = false, className = '' }: { children: ReactNode; dim?: boolean; className?: string }) {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-[#1a1838] text-white">
      <CoverBackdrop dim={dim} />
      <main id="main" tabIndex={-1} className={`relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-24 outline-none ${className}`}>
        {children}
      </main>
    </div>
  )
}

/** The h1 of a cover screen (focusable, so multi-step screens can move focus to it). */
export function CoverHeading({ children, headingRef }: { children: ReactNode; headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-white outline-none drop-shadow md:text-3xl [&:focus-visible]:shadow-none [&:focus-visible]:outline-none">
      {children}
    </h1>
  )
}

/** "Step 2 of 3" with three pips. */
export function Steps({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 rounded-pill ${i <= n ? 'w-8 bg-marigold' : 'w-4 bg-white/30'}`} />
        ))}
      </div>
      <p className="text-sm font-semibold uppercase tracking-wider text-marigold-soft">{label}</p>
    </div>
  )
}

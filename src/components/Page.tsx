import type { ReactNode } from 'react'

/** Standard screen layout: one h1 and the screen's content, centred with a readable width. */
export function Page({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-terracotta-deep">{title}</h1>
      <div className="mt-4">{children}</div>
    </main>
  )
}

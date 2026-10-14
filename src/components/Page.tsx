import type { ReactNode, Ref } from 'react'

/**
 * Standard screen layout: one h1 and the screen's content, centred with a readable width.
 * `headingRef` lets multi-step screens move focus to the new heading (for screen readers).
 */
export function Page({
  title,
  children,
  headingRef,
}: {
  title: string
  children?: ReactNode
  headingRef?: Ref<HTMLHeadingElement>
}) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto w-full max-w-3xl px-4 py-6 outline-none">
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-terracotta-deep outline-none">
        {title}
      </h1>
      <div className="mt-4">{children}</div>
    </main>
  )
}

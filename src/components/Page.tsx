import type { ReactNode, Ref } from 'react'

/**
 * Standard screen layout: one h1 and the screen's content, centred with a readable width.
 * `headingRef` lets multi-step screens move focus to the new heading (for screen readers).
 * `wide` is for scenes, which need more room than reading text.
 */
export function Page({
  title,
  children,
  headingRef,
  wide = false,
}: {
  title: string
  children?: ReactNode
  headingRef?: Ref<HTMLHeadingElement>
  wide?: boolean
}) {
  return (
    <main id="main" tabIndex={-1} className={`mx-auto w-full ${wide ? 'max-w-6xl' : 'max-w-3xl'} px-4 py-6 outline-none`}>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-terracotta-deep outline-none">
        {title}
      </h1>
      <div className="mt-4">{children}</div>
    </main>
  )
}

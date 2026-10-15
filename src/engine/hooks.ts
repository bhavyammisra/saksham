import { useEffect, useState, useSyncExternalStore, type RefObject } from 'react'

/** True while <html data-calm> is set (reduced motion or the Calm motion setting). */
export function useCalm(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-calm'] })
      return () => observer.disconnect()
    },
    () => document.documentElement.hasAttribute('data-calm'),
  )
}

/** The pixel size of an element, kept up to date when it resizes. */
export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}

/** True on touch-first devices (phones and tablets), where the walk pad is shown. */
export function useCoarsePointer(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia('(pointer: coarse)')
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia('(pointer: coarse)').matches,
  )
}

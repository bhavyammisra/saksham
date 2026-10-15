import { useEffect, useRef, type MouseEvent } from 'react'
import { t } from '@/lib/i18n'
import { isDemoCode, nextDemoBuffer } from '@/lib/rules'
import { sound } from '@/lib/sound'
import { useStore } from '@/lib/store'

const LONG_PRESS_MS = 2000

/**
 * Demo mode (FR-17), for showing the game to a class or in the viva: every playable building
 * opens. Turn it on by typing d-e-m-o anywhere (not in a text box), or by pressing and holding
 * the logo for 2 seconds. The "Demo mode" chip in the top bar turns it off again.
 * Returns the props to spread on the logo link.
 */
export function useDemoMode() {
  const setDemo = useStore((s) => s.setDemo)
  const timer = useRef<number | undefined>(undefined)
  const longPressed = useRef(false)

  // Typing "demo". The last few letters are kept by a pure rule (rules.ts).
  useEffect(() => {
    let buffer = ''
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      buffer = nextDemoBuffer(buffer, event.key)
      if (isDemoCode(buffer)) {
        buffer = ''
        if (!useStore.getState().demo) sound.play('success')
        setDemo(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setDemo])

  const cancel = () => window.clearTimeout(timer.current)
  return {
    onPointerDown: () => {
      longPressed.current = false
      cancel()
      timer.current = window.setTimeout(() => {
        longPressed.current = true
        sound.play('success')
        setDemo(true)
      }, LONG_PRESS_MS)
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    // A long press shouldn't also follow the link.
    onClick: (event: MouseEvent) => {
      if (longPressed.current) {
        event.preventDefault()
        longPressed.current = false
      }
    },
  }
}

/** The "Demo mode" chip: shown while demo mode is on; pressing it turns demo mode off. */
export function DemoChip() {
  const demo = useStore((s) => s.demo)
  const setDemo = useStore((s) => s.setDemo)
  return (
    <>
      {/* Says out loud when demo mode turns on. */}
      <p aria-live="polite" className="sr-only">
        {demo ? t('demo.onNow') : ''}
      </p>
      {demo && (
        <button
          type="button"
          onClick={() => setDemo(false)}
          title={t('demo.off')}
          className="inline-flex min-h-tap shrink-0 items-center gap-2 rounded-pill bg-peacock px-3 text-sm font-semibold text-white hover:bg-help-ink"
        >
          {t('demo.chip')}
          <span aria-hidden="true">×</span>
          <span className="sr-only">: {t('demo.off')}</span>
        </button>
      )}
    </>
  )
}

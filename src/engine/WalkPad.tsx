import { t } from '@/lib/i18n'

/**
 * The on-screen joystick for touch screens: hold ◀ or ▶ to walk.
 * (Keyboard players use A/D or the arrow keys; anyone can use "Things to do here".)
 */
export function WalkPad({ onDir }: { onDir: (dir: -1 | 0 | 1) => void }) {
  const hold = (dir: -1 | 1) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      onDir(dir)
    },
    onPointerUp: () => onDir(0),
    onPointerCancel: () => onDir(0),
    onLostPointerCapture: () => onDir(0),
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  })
  const style =
    'grid size-16 touch-none select-none place-items-center rounded-full bg-plaster/85 text-2xl font-semibold text-ink shadow-lifted active:bg-marigold-soft'
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex justify-between">
      <button type="button" aria-label={t('scene.walkLeft')} className={`pointer-events-auto ${style}`} {...hold(-1)}>
        <span aria-hidden="true">◀</span>
      </button>
      <button type="button" aria-label={t('scene.walkRight')} className={`pointer-events-auto ${style}`} {...hold(1)}>
        <span aria-hidden="true">▶</span>
      </button>
    </div>
  )
}

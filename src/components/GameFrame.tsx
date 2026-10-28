import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { SceneDef } from '@content/types'
import { ScenePicture } from '@/engine/Scene'
import { t } from '@/lib/i18n'
import { DemoChip, useDemoMode } from './DemoMode'
import { HelpButton } from './HelpButton'

/**
 * The full-screen frame around a building's card, quiz and results (D-036): the scene's
 * picture, dimmed, fills the screen; the content sits in front of it. The main menu button
 * is top left and Need help? top right, as in the scene itself.
 */
export function GameFrame({ scene, focusX, children }: { scene: SceneDef; focusX: number; children: ReactNode }) {
  const navigate = useNavigate()
  useDemoMode()
  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-black">
      <ScenePicture scene={scene} focusX={focusX} />
      <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
      {/* The scroll area starts below the corner buttons, so the card never slides under Need help? (P7). */}
      <main id="main" tabIndex={-1} className="absolute inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto px-4 pb-10 pt-2 outline-none">
        <h1 className="sr-only">{scene.title}</h1>
        {children}
      </main>
      <button type="button" onClick={() => navigate('/')} aria-label={t('hud.mainMenu')} className="absolute left-3 top-3 grid size-12 place-items-center text-white/85 hover:text-white">
        <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
      <div className="absolute right-0 top-0 flex items-center gap-2 p-3">
        <DemoChip />
        <HelpButton />
      </div>
    </div>
  )
}

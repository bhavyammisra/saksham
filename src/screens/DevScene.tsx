import { useCallback, useState } from 'react'
import sandboxJson from '@content/scenes/sandbox.json'
import type { Hotspot, SceneDef } from '@content/types'
import { Button } from '@/components/Button'
import { GameFrame } from '@/components/GameFrame'
import { Scene, type SceneResult } from '@/engine/Scene'
import { t } from '@/lib/i18n'

const sandbox = sandboxJson as SceneDef

/** Developer sandbox (/dev/scene): plays the test scene that uses every engine feature. */
export function DevScene() {
  const [run, setRun] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  // Stable callbacks, so the scene doesn't re-run its effects on every render.
  const onComplete = useCallback((r: SceneResult) => setMessage(t('dev.sceneComplete', { retries: r.retries })), [])
  const onExit = useCallback((h: Hotspot) => setMessage(t('dev.sceneExit', { label: h.label })), [])

  return (
    <>
      {message ? (
        <GameFrame scene={sandbox} focusX={sandbox.spawn.x}>
        <div className="mx-auto max-w-xl rounded-card bg-plaster p-6 text-ink">
          <p className="text-lg font-semibold" role="status">
            {message}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              setMessage(null)
              setRun((n) => n + 1)
            }}
          >
            {t('dev.sceneRestart')}
          </Button>
        </div>
        </GameFrame>
      ) : (
        <Scene key={run} scene={sandbox} onComplete={onComplete} onExit={onExit} />
      )}
    </>
  )
}

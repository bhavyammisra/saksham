// The scene player. Draws a SceneDef and turns input into actions for sceneReducer.
// It never refers to a building by id: art comes from the registry by key,
// people from npcs.json, and everything else from the scene JSON.

import { memo, useEffect, useMemo, useReducer, useRef, type PointerEvent, type ReactNode } from 'react'
import type { Hotspot, Layer, Mood, SceneDef } from '@content/types'
import { GROUND_Y, layerArt, propArt, SCENE_HEIGHT, type LayerArt } from '@/art'
import { Character, type Pose } from '@/character/Character'
import { Mitthu } from '@/character/Mitthu'
import { defaultSpec } from '@/character/spec'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { selectActiveProfile, useStore } from '@/lib/store'
import { Dialogue } from './Dialogue'
import { useCalm, useCoarsePointer, useElementSize } from './hooks'
import { layerOffset, layerWidth } from './movement'
import { getNpc, npcSpec } from './people'
import { initialSceneState, sceneReducer } from './sceneState'
import { isObjectiveDone, nearbyHotspot, nextObjective, visibleHotspots } from './story'
import { WalkPad } from './WalkPad'
import './scene.css'

const PLAYER_HEIGHT = 400 // design units (the scene is 1000 tall)
const ADULT_HEIGHT = 470
const MITTHU_SIZE = 80

export interface SceneResult {
  retries: number
}

interface Props {
  scene: SceneDef
  onComplete: (result: SceneResult) => void
  onExit: (hotspot: Hotspot) => void
}

export function Scene({ scene, onComplete, onExit }: Props) {
  const profile = useStore(selectActiveProfile)
  const narration = useStore((s) => s.settings.narration)
  const player = { name: profile?.firstName ?? t('scene.you'), spec: profile?.avatar ?? defaultSpec }
  const calm = useCalm()
  const coarse = useCoarsePointer()

  const viewport = useRef<HTMLDivElement>(null)
  const size = useElementSize(viewport)
  const scale = size.height > 0 ? size.height / SCENE_HEIGHT : 0
  const viewWidth = scale > 0 ? size.width / scale : 1000

  const reducer = useMemo(() => sceneReducer(scene), [scene])
  const [state, dispatch] = useReducer(reducer, scene, initialSceneState)

  // ---------------------------------------------------------------- input and the frame loop
  const keys = useRef({ left: false, right: false, pad: 0 as -1 | 0 | 1 })
  const live = useRef({ viewWidth, calm })
  useEffect(() => {
    live.current = { viewWidth, calm }
  }, [viewWidth, calm])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) // cap, so a slow frame doesn't teleport
      last = now
      const k = keys.current
      const dir = ((k.right || k.pad === 1 ? 1 : 0) - (k.left || k.pad === -1 ? 1 : 0)) as -1 | 0 | 1
      dispatch({ type: 'tick', now, dt, dir, ...live.current })
      frame = requestAnimationFrame(loop) // the browser pauses this when the tab is hidden
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    const set = (event: KeyboardEvent, down: boolean) => {
      if (isTyping(event.target) || document.querySelector('dialog[open]')) return
      const key = event.key.toLowerCase()
      if (key === 'arrowleft' || key === 'a') keys.current.left = down
      else if (key === 'arrowright' || key === 'd') keys.current.right = down
      else if (down && key === 'e') dispatch({ type: 'interactNearby' })
      else if (down && key === 'enter' && (event.target === document.body || event.target === viewport.current)) {
        dispatch({ type: 'interactNearby' })
      } else return
      event.preventDefault()
      if (down) dispatch({ type: 'activity' })
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    const stopAll = () => (keys.current = { left: false, right: false, pad: 0 })
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', stopAll)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', stopAll)
    }
  }, [])

  // ---------------------------------------------------------------- side effects of the state
  useEffect(() => {
    sound.setTone(scene.tone) // gentle scenes play at half volume
    return () => sound.setTone('normal')
  }, [scene.tone])

  const fxPose = state.fx?.pose ?? null
  useEffect(() => {
    if (fxPose) sound.play(fxPose === 'cheer' ? 'success' : 'soft')
  }, [fxPose])

  useEffect(() => {
    if (!state.exit) return
    const h = scene.hotspots.find((x) => x.id === state.exit)
    if (h) onExit(h)
  }, [state.exit, scene, onExit])

  useEffect(() => {
    if (state.completed) onComplete({ retries: state.story.retries })
  }, [state.completed, state.story.retries, onComplete])

  // ---------------------------------------------------------------- drawing
  const flags = state.story.flags
  const hotspots = visibleHotspots(scene, flags)
  const node = state.dialogue ? scene.nodes[state.dialogue.nodeId] : undefined
  const near = state.dialogue ? null : nearbyHotspot(scene, state.x, flags)
  const objective = nextObjective(scene, flags)
  const px = (units: number) => units * scale
  const onGround = px(SCENE_HEIGHT - GROUND_Y)

  const playerPose: Pose = state.fx?.pose ?? (node?.speaker === 'player' ? 'talk' : state.walking ? 'walk' : 'idle')

  const tapToWalk = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a') || state.dialogue || scale === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    dispatch({ type: 'walkTo', x: state.camera + (event.clientX - rect.left) / scale })
  }

  const layerProps = { camera: state.camera, scale, viewWidth, sceneWidth: scene.width, calm }
  const shake = state.shake > 0 ? `translateX(${Math.sin(state.shake * 60) * 4}px)` : undefined

  return (
    <div className="scene" data-tone={scene.tone}>
      <div
        ref={viewport}
        tabIndex={-1}
        role="region"
        aria-label={t('scene.region', { title: scene.title })}
        onPointerDown={tapToWalk}
        className="relative h-[min(68dvh,640px)] min-h-80 w-full touch-none select-none overflow-hidden rounded-card bg-plaster-deep outline-none"
      >
        <div className="absolute inset-0" style={{ transform: shake }}>
          {scale > 0 &&
            scene.layers.filter((l) => !isFront(l)).map((l) => <LayerView key={l.id} layer={l} {...layerProps} />)}

          {/* The stage: everything standing on the ground moves with the camera. */}
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: px(scene.width), transform: `translate3d(${-px(state.camera)}px,0,0)` }}
          >
            {scale > 0 &&
              hotspots.map((h) => (
                <HotspotView
                  key={h.id}
                  hotspot={h}
                  px={px}
                  bottom={onGround}
                  playerX={state.x}
                  talking={node?.speaker !== undefined && node.speaker === h.npc}
                  mood={node?.speaker === h.npc ? node?.mood : undefined}
                  onUse={() => dispatch({ type: 'use', hotspotId: h.id })}
                />
              ))}

            {scale > 0 && (
              <div
                className="scene-mitthu absolute"
                style={{
                  left: px(state.mitthuX),
                  bottom: onGround + px(state.walking ? 300 : 0),
                  width: px(MITTHU_SIZE),
                  height: px(MITTHU_SIZE),
                  transform: 'translateX(-50%)',
                }}
              >
                <Mitthu flying={state.walking} facing={state.facing} className="size-full" />
              </div>
            )}

            {scale > 0 && (
              <div
                className="absolute"
                style={{ left: px(state.x), bottom: onGround, height: px(PLAYER_HEIGHT), width: px(PLAYER_HEIGHT / 3), transform: 'translateX(-50%)' }}
              >
                <Character spec={player.spec} pose={playerPose} mood={node?.speaker === 'player' ? node.mood : 'neutral'} facing={state.facing} className="size-full" />
              </div>
            )}

            {near && scale > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'use', hotspotId: near.id })}
                className="scene-prompt absolute z-10 flex min-h-tap items-center gap-2 whitespace-nowrap rounded-pill bg-plaster px-4 font-semibold text-ink shadow-lifted"
                style={{ left: px(near.x), bottom: onGround + px(hotspotHeight(near) + 30), transform: 'translateX(-50%)' }}
              >
                {near.label}
                <kbd className="rounded border border-sand bg-white px-1.5 text-sm" aria-hidden="true">
                  E
                </kbd>
              </button>
            )}
          </div>

          {scale > 0 &&
            scene.layers.filter(isFront).map((l) => <LayerView key={l.id} layer={l} {...layerProps} />)}
          {/* Film grain on every scene: one shared painted texture. Static, so calm-safe. */}
          <div aria-hidden="true" className="scene-grain pointer-events-none absolute inset-0" />
        </div>

        {/* Mitthu's hint after 20 quiet seconds. */}
        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
          {state.hint && objective && !state.dialogue && (
            <p className="max-w-md rounded-card bg-plaster/95 px-4 py-2 text-center font-semibold shadow-lifted">
              {t('mitthu.hint', { objective: objective.text })}
            </p>
          )}
        </div>

        {coarse && !state.dialogue && <WalkPad onDir={(dir) => (keys.current.pad = dir)} />}

      </div>

      {/* The conversation sits just below the scene, so it never covers the people talking. */}
      {state.dialogue && (
        <Dialogue
          scene={scene}
          dialogue={state.dialogue}
          player={player}
          narration={narration}
          calm={calm}
          onNext={() => dispatch({ type: 'next' })}
          onChoose={(index) => dispatch({ type: 'choose', index })}
        />
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="objectives-title" className="rounded-card bg-plaster-deep p-4">
          <h2 id="objectives-title" className="text-lg font-semibold">
            {t('scene.objectives')}
          </h2>
          <ul className="mt-2 space-y-2">
            {scene.objectives.map((o) => {
              const done = isObjectiveDone(o, flags)
              return (
                <li key={o.id} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${done ? 'border-leaf bg-leaf text-white' : 'border-sand bg-plaster'}`}
                  >
                    {done ? '✓' : ''}
                  </span>
                  <span className={done ? 'text-ink-soft line-through decoration-2' : ''}>
                    {o.text}
                    <span className="sr-only"> ({done ? t('scene.done') : t('scene.notDone')})</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="things-title" className="rounded-card bg-plaster-deep p-4">
          <h2 id="things-title" className="text-lg font-semibold">
            {t('scene.thingsToDo')}
          </h2>
          <p className="text-sm text-ink-soft">{t('scene.thingsToDoHint')}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {hotspots.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  disabled={state.dialogue !== null}
                  onClick={() => dispatch({ type: 'jumpTo', hotspotId: h.id })}
                  className="min-h-tap rounded-button border-2 border-sand bg-plaster px-4 font-semibold hover:bg-marigold-soft disabled:opacity-50"
                >
                  {h.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- pieces

/** Layers in front of the characters: marked front, or nearer than the stage (speed > 1). */
const isFront = (l: Layer) => l.front ?? l.speed > 1

function hotspotHeight(h: Hotspot): number {
  if (h.kind === 'npc') return getNpc(h.npc ?? '')?.adult ? ADULT_HEIGHT : PLAYER_HEIGHT
  return (h.art && propArt[h.art]?.height) || 120
}

const ArtFrame = memo(function ArtFrame({ Art, width }: { Art: LayerArt; width: number }) {
  return <Art width={width} />
})

function LayerView(props: { layer: Layer; camera: number; scale: number; viewWidth: number; sceneWidth: number; calm: boolean }) {
  const { layer, camera, scale, viewWidth, sceneWidth, calm } = props
  const Art = layerArt[layer.art]
  if (!Art) {
    if (import.meta.env.DEV) console.warn(`[scene] no art for layer "${layer.art}"`)
    return null
  }
  // Width in whole design units, so the art only re-draws when the screen size changes.
  const width = layerWidth(layer.speed, Math.round(viewWidth), sceneWidth, calm)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0"
      style={{ width: width * scale, transform: `translate3d(${-layerOffset(camera, layer.speed, calm) * scale}px,0,0)` }}
    >
      <ArtFrame Art={Art} width={width} />
    </div>
  )
}

function HotspotView(props: {
  hotspot: Hotspot
  px: (units: number) => number
  bottom: number
  playerX: number
  talking: boolean
  mood?: Mood
  onUse: () => void
}) {
  const { hotspot: h, px, bottom } = props
  let width: number
  let height: number
  let picture: ReactNode

  const npc = h.kind === 'npc' ? getNpc(h.npc ?? '') : null
  if (npc) {
    height = npc.adult ? ADULT_HEIGHT : PLAYER_HEIGHT
    width = height / 3
    picture = (
      <Character
        spec={npcSpec(npc)}
        adult={npc.adult}
        pose={props.talking ? 'talk' : 'idle'}
        mood={props.mood}
        facing={props.playerX < h.x ? 'left' : 'right'}
        className="size-full"
      />
    )
  } else {
    const art = h.art ? propArt[h.art] : undefined
    width = art?.width ?? 90
    height = art?.height ?? 90
    picture = art ? <art.Art /> : <span className="scene-sparkle block size-full rounded-full" />
  }

  return (
    <button
      type="button"
      aria-label={h.label}
      onClick={props.onUse}
      className="scene-hotspot absolute"
      style={{ left: px(h.x), bottom, width: px(width), height: px(height), transform: 'translateX(-50%)' }}
    >
      {picture}
    </button>
  )
}

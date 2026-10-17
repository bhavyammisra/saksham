// The scene player (D-036): a full-screen game frame. Draws a SceneDef and turns input into
// actions for sceneReducer. It never refers to a building by id: art comes from the registry
// by key, people from npcs.json, the map's places from the hosting screen, and everything
// else from the scene JSON.
//
//   - walk with W A S D or the arrow keys (along the street and nearer or further), or tap the ground,
//   - E (or Enter) talks or looks; the conversation shows in a see-through strip at the bottom,
//   - small menu words along the bottom: Back, History, Things to do, Map, Book, Settings, Exit,
//   - Need help? always in the top-right corner.

import { memo, useEffect, useMemo, useReducer, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { Hotspot, Layer, Mood, SceneDef } from '@content/types'
import { layerArt, propArt, SCENE_HEIGHT, type LayerArt } from '@/art'
import { Character, type Pose } from '@/character/Character'
import { Mitthu } from '@/character/Mitthu'
import { defaultSpec } from '@/character/spec'
import { AreaMap, type MapPlace } from '@/components/AreaMap'
import { DemoChip, useDemoMode } from '@/components/DemoMode'
import { HelpButton } from '@/components/HelpButton'
import { SettingsDialog } from '@/components/SettingsDialog'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { selectActiveProfile, useStore } from '@/lib/store'
import { Dialogue, speakerColour } from './Dialogue'
import { useCalm, useCoarsePointer, useElementSize } from './hooks'
import { FEET_FAR, FEET_NEAR, feetY, layerOffset, layerWidth, personHeight } from './movement'
import { getNpc, npcSpec } from './people'
import { ENTER_SECONDS, hotspotDepth, initialSceneState, sceneReducer } from './sceneState'
import { isObjectiveDone, nearbyHotspot, nextObjective, visibleHotspots } from './story'
import { WalkPad } from './WalkPad'
import './scene.css'

const PLAYER_HEIGHT = 400 // design units at mid depth (the scene is 1000 tall)
const ADULT_HEIGHT = 470
const MITTHU_SIZE = 80
/** How much of the scene's height fills the screen: less than 1000 = the camera is closer. */
const VIEW_HEIGHT = 780

export interface SceneResult {
  retries: number
}

interface Props {
  scene: SceneDef
  onComplete: (result: SceneResult) => void
  onExit: (hotspot: Hotspot) => void
  /** Exit hotspots that are locked right now (keep the same Set between renders). */
  locked?: ReadonlySet<string>
  /** Where the player starts, instead of the scene's spawn point. */
  startX?: number
  /** Flags set from the start, from saved progress (must be listed in the scene's hostFlags). */
  startFlags?: readonly string[]
  /** Leave out the scene's arrival line (e.g. walking back out of a building into the town). */
  skipIntro?: boolean
  /** Mitthu points at this hotspot, and uses this text for his idle hint when there are no objectives. */
  guide?: { hotspotId: string; text: string }
  /** The area map: its places, and what travelling to one does. Without it there is no Map item. */
  map?: { places: MapPlace[]; onTravel: (id: string) => void }
}

const NOTHING_LOCKED: ReadonlySet<string> = new Set()
const NO_FLAGS: ReadonlySet<string> = new Set()

export function Scene({ scene, onComplete, onExit, locked = NOTHING_LOCKED, startX, startFlags, skipIntro, guide, map }: Props) {
  const profile = useStore(selectActiveProfile)
  const player = { name: profile?.firstName ?? t('scene.you'), spec: profile?.avatar ?? defaultSpec }
  const calm = useCalm()
  const coarse = useCoarsePointer()
  const navigate = useNavigate()
  useDemoMode() // typing "demo" works here too (there is no top bar)

  const viewport = useRef<HTMLDivElement>(null)
  const size = useElementSize(viewport)
  // The scene fills the screen's height (VIEW_HEIGHT units of it), or its width on very wide screens.
  const scale = size.height > 0 ? Math.max(size.height / VIEW_HEIGHT, size.width / scene.width) : 0
  const viewWidth = scale > 0 ? size.width / scale : 1000
  const top = size.height - SCENE_HEIGHT * scale // the scene's top edge (above the screen: the camera is close)

  const reducer = useMemo(() => sceneReducer(scene, locked), [scene, locked])
  const [state, dispatch] = useReducer(reducer, scene, (s) => initialSceneState(s, startX, startFlags, skipIntro))
  const [panel, setPanel] = useState<'none' | 'history' | 'map' | 'things'>('none')

  // ---------------------------------------------------------------- input and the frame loop
  const keys = useRef({ left: false, right: false, up: false, down: false, pad: 0 as -1 | 0 | 1 })
  const live = useRef({ viewWidth, calm, paused: false })
  useEffect(() => {
    live.current = { viewWidth, calm, paused: panel === 'map' || panel === 'history' }
  }, [viewWidth, calm, panel])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) // cap, so a slow frame doesn't teleport
      last = now
      const k = keys.current
      const paused = live.current.paused
      const dir = (paused ? 0 : (k.right || k.pad === 1 ? 1 : 0) - (k.left || k.pad === -1 ? 1 : 0)) as -1 | 0 | 1
      const dirDepth = (paused ? 0 : (k.down ? 1 : 0) - (k.up ? 1 : 0)) as -1 | 0 | 1
      dispatch({ type: 'tick', now, dt, dir, dirDepth, viewWidth: live.current.viewWidth, calm: live.current.calm })
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
      else if (key === 'arrowup' || key === 'w') keys.current.up = down
      else if (key === 'arrowdown' || key === 's') keys.current.down = down
      else if (down && key === 'e') dispatch({ type: 'interactNearby' })
      else if (down && key === 'm' && map) setPanel((p) => (p === 'map' ? 'none' : 'map'))
      else if (down && key === 'escape') setPanel('none')
      else if (down && key === 'enter' && (event.target === document.body || event.target === viewport.current)) {
        dispatch({ type: 'interactNearby' })
      } else return
      event.preventDefault()
      if (down) dispatch({ type: 'activity' })
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    const stopAll = () => (keys.current = { left: false, right: false, up: false, down: false, pad: 0 })
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', stopAll)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', stopAll)
    }
  }, [map])

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
  const near = state.dialogue || state.entering ? null : nearbyHotspot(scene, state.x, flags)
  const objective = nextObjective(scene, flags)
  const guided = guide ? hotspots.find((h) => h.id === guide.hotspotId) : undefined
  const px = (units: number) => units * scale
  const speakerName = (speaker: string) => (speaker === 'player' ? player.name : (getNpc(speaker)?.name ?? speaker))

  const playerPose: Pose = state.fx?.pose ?? (node?.speaker === 'player' ? 'talk' : state.walking ? 'walk' : 'idle')
  const playerH = personHeight(PLAYER_HEIGHT, state.depth)
  // Going in through a door (D-039): once at the door, the player turns their back and fades into it.
  const turned = state.entering !== null && state.target === null
  const goneIn = state.entering !== null && state.targetDepth === null ? Math.min(1, state.enterTime / ENTER_SECONDS) : 0

  // Tapping the ground walks there: along the street, and nearer or further.
  const tapToWalk = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, a') || state.dialogue || scale === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const y = (event.clientY - rect.top - top) / scale
    const depth = (y - FEET_FAR) / (FEET_NEAR - FEET_FAR)
    dispatch({ type: 'walkTo', x: state.camera + (event.clientX - rect.left) / scale, depth: y > FEET_FAR - 60 ? depth : undefined })
  }

  const layerProps = { camera: state.camera, scale, viewWidth, sceneWidth: scene.width, calm, flags, top }
  const shake = state.shake > 0 ? `translateX(${Math.sin(state.shake * 60) * 4}px)` : undefined
  const trail = state.dialogue?.trail ?? []

  return (
    <div className="scene game fixed inset-0 z-30 overflow-hidden bg-black text-white" data-tone={scene.tone}>
      <div
        ref={viewport}
        tabIndex={-1}
        role="region"
        aria-label={t('scene.region', { title: scene.title })}
        onPointerDown={tapToWalk}
        className="absolute inset-0 touch-none select-none outline-none"
      >
        <div className="absolute inset-0" style={{ transform: shake }}>
          {scale > 0 && scene.layers.filter((l) => !isFront(l)).map((l) => <LayerView key={l.id} layer={l} {...layerProps} />)}

          {/* The stage: everything standing on the ground moves with the camera. */}
          <div className="absolute left-0" style={{ top, height: px(SCENE_HEIGHT), width: px(scene.width), transform: `translate3d(${-px(state.camera)}px,0,0)` }}>
            {scale > 0 &&
              hotspots.map((h) => (
                <HotspotView
                  key={h.id}
                  hotspot={h}
                  px={px}
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
                  top: px(feetY(state.depth) - MITTHU_SIZE - (state.walking ? 300 : 0)),
                  width: px(MITTHU_SIZE),
                  height: px(MITTHU_SIZE),
                  transform: 'translateX(-50%)',
                  zIndex: depthZ(state.depth) + 1,
                }}
              >
                <Mitthu flying={state.walking} facing={state.facing} className="size-full" />
              </div>
            )}

            {scale > 0 && (
              <>
                <Shadow x={state.x} depth={state.depth} height={playerH} px={px} />
                <div
                  className="game-person absolute"
                  style={{ left: px(state.x), top: px(feetY(state.depth) - playerH * 0.975), height: px(playerH), width: px(playerH / 3), transform: `translateX(-50%) scale(${1 - goneIn * 0.06})`, transformOrigin: 'bottom', opacity: 1 - goneIn, zIndex: depthZ(state.depth) }}
                >
                  <Character spec={player.spec} pose={playerPose} mood={node?.speaker === 'player' ? node.mood : 'neutral'} facing={state.facing} back={turned} className="size-full" />
                </div>
              </>
            )}

            {guided && scale > 0 && (
              <div
                aria-hidden="true"
                className="scene-guide pointer-events-none absolute z-[200] flex flex-col items-center"
                style={{ left: px(guided.x), top: px(feetY(hotspotDepth(guided)) - (guided.kind === 'exit' ? 470 : hotspotHeight(guided) + 120)), transform: 'translateX(-50%)' }}
              >
                <span className="block size-12 rounded-full bg-black/60 p-1 ring-2 ring-marigold">
                  <Mitthu view="portrait" className="size-full" />
                </span>
                <svg viewBox="0 0 24 16" className="mt-1 h-4 w-6">
                  <path d="M2 2 L12 13 L22 2" fill="none" stroke="#e8a33d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}

            {near && scale > 0 && (
              <button
                type="button"
                onClick={() => dispatch({ type: 'use', hotspotId: near.id })}
                className="scene-prompt game-prompt absolute z-[210] flex min-h-tap items-center gap-2 whitespace-nowrap rounded-pill px-4 text-sm font-semibold"
                style={{ left: px(near.x), top: px(feetY(hotspotDepth(near)) - (near.kind === 'npc' ? hotspotHeight(near) : hotspotHeight(near) + 40) - 70), transform: 'translateX(-50%)' }}
              >
                <kbd className="rounded bg-white/90 px-1.5 text-xs font-bold text-black" aria-hidden="true">
                  E
                </kbd>
                {locked.has(near.id) && <LockIcon />}
                {near.label}
                {locked.has(near.id) && <span className="sr-only"> ({t('scene.locked')})</span>}
              </button>
            )}
          </div>

          {scale > 0 && scene.layers.filter(isFront).map((l) => <LayerView key={l.id} layer={l} {...layerProps} />)}
          {/* The colour grade: darker corners and a heavier sky, so the eye goes to the middle. */}
          <div aria-hidden="true" className="game-grade pointer-events-none absolute inset-0" />
        </div>

        {coarse && !state.dialogue && <WalkPad onDir={(dir) => (keys.current.pad = dir)} />}
      </div>

      {/* Top left: main menu, the place, and what to do next. */}
      <div className="pointer-events-none absolute left-0 top-0 flex max-w-[min(26rem,70vw)] items-start gap-2 p-3">
        <button type="button" onClick={() => navigate('/')} aria-label={t('hud.mainMenu')} className="pointer-events-auto grid size-12 shrink-0 place-items-center text-white/85 hover:text-white">
          <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <div className="game-hud pt-1">
          <h1 className="text-lg font-semibold leading-tight">{scene.title}</h1>
          {scene.objectives.length > 0 && (
            <section aria-labelledby="objectives-title" className="mt-1">
              <h2 id="objectives-title" className="sr-only">
                {t('scene.objectives')}
              </h2>
              <ul className="space-y-0.5 text-sm">
                {scene.objectives.map((o) => {
                  const done = isObjectiveDone(o, flags)
                  return (
                    <li key={o.id} className={`flex items-start gap-1.5 ${done ? 'text-white/55 line-through' : o === objective ? 'text-white' : 'text-white/75'}`}>
                      <span aria-hidden="true" className={`mt-1 grid size-3.5 shrink-0 place-items-center rounded-sm border ${done ? 'border-[#8fd88a] bg-[#8fd88a] text-black' : 'border-white/70'}`}>
                        {done && <span className="text-[0.6rem] leading-none">✓</span>}
                      </span>
                      <span>
                        {o.text}
                        <span className="sr-only"> ({done ? t('scene.done') : t('scene.notDone')})</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Top right: Need help? is always there. */}
      <div className="absolute right-0 top-0 flex items-center gap-2 p-3">
        <DemoChip />
        <HelpButton />
      </div>

      {/* Mitthu's hint after 20 quiet seconds. */}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
        {state.hint && (objective || guide) && !state.dialogue && (
          <p className="game-toast max-w-md rounded-pill px-4 py-2 text-center text-sm font-semibold">
            {objective ? t('mitthu.hint', { objective: objective.text }) : guide?.text}
          </p>
        )}
      </div>

      {/* "Things to do here": every visible hotspot, to go there at once (no walking needed). */}
      {panel === 'things' && (
        <section id="things-panel" aria-labelledby="things-title" className="game-panel absolute bottom-12 left-1/2 z-30 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl p-4">
          <h2 id="things-title" className="font-semibold">
            {t('scene.thingsToDo')}
          </h2>
          <p className="text-sm text-white/75">{t('scene.thingsToDoHint')}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hotspots.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  disabled={state.dialogue !== null}
                  onClick={() => {
                    setPanel('none')
                    dispatch({ type: 'jumpTo', hotspotId: h.id })
                  }}
                  className="game-choice inline-flex min-h-tap items-center gap-2 rounded-pill px-4 text-sm disabled:opacity-50"
                >
                  {locked.has(h.id) && <LockIcon />}
                  {h.label}
                  {locked.has(h.id) && <span className="sr-only"> ({t('scene.locked')})</span>}
                  {guided?.id === h.id && <span className="rounded-pill bg-marigold px-2 text-xs text-ink">{t('scene.suggested')}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The dialogue strip, just above the menu words. */}
      <div className="absolute inset-x-0 bottom-9 z-20">
        {state.dialogue ? (
          <Dialogue
            scene={scene}
            dialogue={state.dialogue}
            player={player}
            calm={calm}
            onNext={() => dispatch({ type: 'next' })}
            onChoose={(index) => dispatch({ type: 'choose', index })}
          />
        ) : (
          panel === 'none' && <p className="game-hint pb-3 text-center text-sm text-white/85">{t('hud.controls')}</p>
        )}
      </div>

      {/* Small menu words along the bottom, like a visual novel. */}
      <nav aria-label={t('hud.menu')} className="absolute inset-x-0 bottom-0 z-30 flex h-9 items-center justify-start gap-x-1 overflow-x-auto whitespace-nowrap bg-black/85 px-2 text-sm sm:justify-center">
        <button type="button" onClick={() => dispatch({ type: 'back' })} disabled={trail.length === 0} className="game-menu">
          {t('hud.back')}
        </button>
        <button type="button" onClick={() => setPanel('history')} className="game-menu">
          {t('hud.history')}
        </button>
        <button type="button" aria-expanded={panel === 'things'} aria-controls="things-panel" onClick={() => setPanel((p) => (p === 'things' ? 'none' : 'things'))} className="game-menu">
          {t('hud.things')}
        </button>
        {map && (
          <button type="button" onClick={() => setPanel('map')} className="game-menu">
            {t('hud.map')}
          </button>
        )}
        <button type="button" onClick={() => navigate('/book')} className="game-menu">
          {t('nav.book')}
        </button>
        <SettingsDialog menuItem={{ label: t('settings.open'), className: 'game-menu' }} />
        <button type="button" onClick={() => navigate('/')} className="game-menu">
          {t('hud.exit')}
        </button>
      </nav>

      {panel === 'history' && (
        <History
          lines={state.seen.flatMap((id) => {
            const n = scene.nodes[id]
            return n ? [{ id, speaker: n.speaker, name: speakerName(n.speaker), text: n.text }] : []
          })}
          onClose={() => setPanel('none')}
        />
      )}
      {panel === 'map' && map && <AreaMap places={map.places} onClose={() => setPanel('none')} onTravel={map.onTravel} />}
    </div>
  )
}

/**
 * A still picture of a scene's backdrop (no people), with `focusX` in the middle: behind the
 * rights card, quiz and results, and on the title screen. Fills its positioned parent.
 */
export function ScenePicture({ scene, focusX, viewHeight = VIEW_HEIGHT }: { scene: SceneDef; focusX: number; viewHeight?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const size = useElementSize(box)
  const scale = size.height > 0 ? Math.max(size.height / viewHeight, size.width / scene.width) : 0
  const viewWidth = scale > 0 ? size.width / scale : 1000
  const camera = Math.min(Math.max(0, focusX - viewWidth / 2), Math.max(0, scene.width - viewWidth))
  const props = { camera, scale, viewWidth, sceneWidth: scene.width, calm: true, flags: NO_FLAGS, top: size.height - SCENE_HEIGHT * scale }
  return (
    <div ref={box} aria-hidden="true" className="game absolute inset-0 overflow-hidden">
      {scale > 0 && scene.layers.filter((l) => !isFront(l)).map((l) => <LayerView key={l.id} layer={l} {...props} />)}
      <div className="game-grade pointer-events-none absolute inset-0" />
    </div>
  )
}

// ---------------------------------------------------------------- pieces

/** People nearer the viewer are drawn in front. */
const depthZ = (depth: number) => 10 + Math.round(depth * 100)

/** A small padlock shown on locked doors (the words also say "locked", for screen readers). */
function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <rect x="2.5" y="7" width="11" height="8" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

/** A person's shadow on the ground, cast to the right by the low sun on the left. */
function Shadow({ x, depth, height, px }: { x: number; depth: number; height: number; px: (u: number) => number }) {
  return (
    <div
      aria-hidden="true"
      className="game-shadow absolute"
      style={{ left: px(x - height * 0.08), top: px(feetY(depth) - height * 0.035), width: px(height * 0.62), height: px(height * 0.07), zIndex: depthZ(depth) - 1 }}
    />
  )
}

function History({ lines, onClose }: { lines: { id: string; name: string; speaker: string; text: string }[]; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => closeButton.current?.focus(), [])
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="history-title" className="game-overlay absolute inset-0 z-40 flex flex-col p-6">
      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto">
        <h2 id="history-title" className="text-xl font-semibold">
          {t('hud.history')}
        </h2>
        {lines.length === 0 && <p className="mt-4 text-white/75">{t('hud.historyEmpty')}</p>}
        <ul className="mt-4 space-y-3">
          {lines.map((l, i) => (
            <li key={`${l.id}-${i}`}>
              <span className="font-semibold" style={{ color: speakerColour(l.speaker) }}>
                {l.name}
              </span>
              <p className="text-white/90">{l.text}</p>
            </li>
          ))}
        </ul>
      </div>
      <button ref={closeButton} type="button" onClick={onClose} className="game-menu mx-auto mt-4">
        {t('hud.close')}
      </button>
    </div>
  )
}

/** Layers in front of the characters: marked front, or nearer than the stage (speed > 1). */
const isFront = (l: Layer) => l.front ?? l.speed > 1

function hotspotHeight(h: Hotspot): number {
  if (h.kind === 'npc') return personHeight(getNpc(h.npc ?? '')?.adult ? ADULT_HEIGHT : PLAYER_HEIGHT, hotspotDepth(h))
  return (h.art && propArt[h.art]?.height) || 120
}

const ArtFrame = memo(function ArtFrame({ Art, width, flags }: { Art: LayerArt; width: number; flags: ReadonlySet<string> }) {
  return <Art width={width} flags={flags} />
})

function LayerView(props: { layer: Layer; camera: number; scale: number; viewWidth: number; sceneWidth: number; calm: boolean; flags: ReadonlySet<string>; top: number }) {
  const { layer, camera, scale, viewWidth, sceneWidth, calm } = props
  const Art = layerArt[layer.art]
  if (!Art) {
    if (import.meta.env.DEV) console.warn(`[scene] no art for layer "${layer.art}"`)
    return null
  }
  // Width in whole design units, so the art only re-draws when the screen size changes.
  // A drifting layer is a little wider, so it never shows its edge while it slides.
  const width = layerWidth(layer.speed, Math.round(viewWidth), sceneWidth, calm) + (layer.drift ? 600 : 0)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0"
      style={{ top: props.top, height: SCENE_HEIGHT * scale, width: width * scale, transform: `translate3d(${-layerOffset(camera, layer.speed, calm) * scale}px,0,0)` }}
    >
      <div className={`size-full ${layer.drift ? 'game-drift' : ''}`}>
        <ArtFrame Art={Art} width={width} flags={props.flags} />
      </div>
    </div>
  )
}

function HotspotView(props: { hotspot: Hotspot; px: (units: number) => number; playerX: number; talking: boolean; mood?: Mood; onUse: () => void }) {
  const { hotspot: h, px } = props
  const depth = hotspotDepth(h)
  let width: number
  let height: number
  let picture: ReactNode
  let person = false

  const npc = h.kind === 'npc' ? getNpc(h.npc ?? '') : null
  if (npc) {
    person = true
    height = personHeight(npc.adult ? ADULT_HEIGHT : PLAYER_HEIGHT, depth)
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
    // Without a picture (a door in the street): a soft, flat glow on the ground in front of it.
    width = art?.width ?? 220
    height = art?.height ?? 50
    picture = art ? <art.Art /> : <span className="scene-sparkle block size-full rounded-full" />
  }

  return (
    <>
      {person && <Shadow x={h.x} depth={depth} height={height} px={px} />}
      <button
        type="button"
        aria-label={h.label}
        onClick={props.onUse}
        className={`scene-hotspot absolute ${person ? 'game-person' : ''}`}
        style={{ left: px(h.x), top: px(feetY(depth) - height * (person ? 0.975 : 1)), width: px(width), height: px(height), transform: 'translateX(-50%)', zIndex: depthZ(depth) }}
      >
        {picture}
      </button>
    </>
  )
}

// PROTOTYPE (D-035) for the owner's approval, before the real scenes are rebuilt.
// One full-screen scene (the School yard in the new look) that shows:
//   - walking with W A S D (or the arrow keys), in two directions: along the yard and nearer or further,
//     or by tapping the ground,
//   - talking with E, in a see-through strip at the bottom (name, then the line; click to go on),
//   - a row of small menu words under it: Back, History, Map, Book, Settings, Exit,
//   - an area map to travel to the places that are open.
// It plays the real School lines from content/scenes/school.json. Nothing here is saved.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import school from '@content/scenes/school.json'
import type { StoryNode } from '@content/types'
import { Clouds, SchoolYardArt, YARD_H, YARD_W, YardSky } from '@/art/schoolYard'
import { Character } from '@/character/Character'
import { defaultSpec, type CharacterSpec } from '@/character/spec'
import { HelpButton } from '@/components/HelpButton'
import { SettingsDialog } from '@/components/SettingsDialog'
import { getNpc, npcSpec } from '@/engine/people'
import { t, type StringKey } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { selectActiveProfile, useStore } from '@/lib/store'
import { AreaMap, type PlaceId } from './AreaMap'
import './proto.css'

const nodes = school.nodes as unknown as Record<string, StoryNode>

// Feet positions: depth 0 is the far edge of the yard, 1 the near edge.
const FEET_FAR = 712
const FEET_NEAR = 865
const MIN_X = 120
const MAX_X = YARD_W - 120
const SPEED_X = 380 // world units per second
const SPEED_DEPTH = 0.8 // depth per second
const VIEW_H = 690 // how much of the world's height fills the screen: less = closer (D-035 zoom)
const CLOUD_H = 480 // the cloud layer covers the sky down to this world height (behind the school)

interface Person {
  id: string
  x: number
  depth: number
  facing: 'left' | 'right'
  spec: CharacterSpec
  node: string
}

const PEOPLE: Person[] = [
  { id: 'lata', x: 560, depth: 0.45, facing: 'right', spec: npcSpec(getNpc('lata')!), node: 'lata-hello' },
  { id: 'ravi', x: 1180, depth: 0.3, facing: 'left', spec: npcSpec(getNpc('ravi')!), node: 'ravi-hello' },
]

// Name colours in the dialogue strip, so you can tell who is speaking at a glance.
const NAME_COLOUR: Record<string, string> = { player: '#f5d76e', mitthu: '#8fd88a', ravi: '#5cc8e0', lata: '#f2a65a' }

const feetY = (depth: number) => FEET_FAR + (FEET_NEAR - FEET_FAR) * depth
const height = (depth: number) => 255 + 70 * depth // nearer people look a little bigger

/** How big the world is drawn: VIEW_H world units fill the screen height (or the yard fills the width). */
function scaleFor(view: { w: number; h: number }) {
  return Math.max(view.h / VIEW_H, view.w / YARD_W)
}

/** Where the camera wants to be: the player in the middle, without showing past the yard's ends. */
function cameraFor(x: number, view: { w: number; h: number }) {
  const scale = scaleFor(view)
  return Math.min(Math.max(x * scale - view.w / 2, 0), YARD_W * scale - view.w)
}

export function GameProto() {
  const profile = useStore(selectActiveProfile)
  const playerSpec = profile?.avatar ?? defaultSpec
  const playerName = profile?.firstName ?? t('scene.you')
  const navigate = useNavigate()

  const [view, setView] = useState({ w: window.innerWidth, h: window.innerHeight })
  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])
  // Position, speed (it eases in and out instead of starting and stopping at once) and the camera.
  const [me, setMe] = useState(() => ({ x: 1650, depth: 0.7, vx: 0, vd: 0, facing: 'left' as 'left' | 'right', moving: false, cam: cameraFor(1650, view) }))
  const pos = useRef(me)
  const keys = useRef({ left: false, right: false, up: false, down: false })
  const target = useRef<{ x: number; depth: number } | null>(null)

  // The conversation: the current line, and the lines seen so far (for Back and History).
  const [line, setLine] = useState<string | null>(null)
  const [trail, setTrail] = useState<string[]>([])
  const [history, setHistory] = useState<{ who: string; text: string }[]>([])
  const [panel, setPanel] = useState<'none' | 'history' | 'map'>('none')
  const [away, setAway] = useState<PlaceId | null>(null)

  const busy = line !== null || panel !== 'none' || away !== null
  const node = line ? nodes[line] : null

  const speakerName = (speaker: string) => (speaker === 'player' ? playerName : (getNpc(speaker)?.name ?? speaker))

  const show = useCallback(
    (id: string) => {
      const n = nodes[id]
      if (!n) return
      setLine(id)
      setTrail((tr) => [...tr, id])
      setHistory((h) => [...h, { who: n.speaker === 'player' ? playerName : (getNpc(n.speaker)?.name ?? n.speaker), text: n.text }])
    },
    [playerName],
  )

  const startTalk = (p: Person) => {
    sound.play('tap')
    setTrail([])
    show(p.node)
  }

  const advance = useCallback(() => {
    if (!node || node.choices) return
    sound.play('tap')
    if (node.next) show(node.next)
    else setLine(null)
  }, [node, show])

  const back = () => {
    if (trail.length < 2) return
    const previous = trail[trail.length - 2]!
    setTrail((tr) => tr.slice(0, -1))
    setLine(previous)
  }

  // Who is close enough to talk to.
  const near = PEOPLE.find((p) => Math.abs(p.x - me.x) < 170 && Math.abs(p.depth - me.depth) < 0.45) ?? null

  // Keys: W A S D or arrows to walk, E to talk, Space or Enter to go on, M for the map, Escape to close.
  useEffect(() => {
    const set = (event: KeyboardEvent, down: boolean) => {
      const key = event.key.toLowerCase()
      const onPage = event.target === document.body
      if (key === 'a' || key === 'arrowleft') keys.current.left = down
      else if (key === 'd' || key === 'arrowright') keys.current.right = down
      else if (key === 'w' || key === 'arrowup') keys.current.up = down
      else if (key === 's' || key === 'arrowdown') keys.current.down = down
      else if (!down) return
      else if (key === 'escape') setPanel('none')
      else if (key === 'm') setPanel((p) => (p === 'map' ? 'none' : 'map'))
      else if (key === 'e' && near && !busy) startTalk(near)
      else if ((key === ' ' || key === 'enter') && onPage && line) {
        event.preventDefault()
        advance()
      }
      if (['w', 'a', 's', 'd', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) target.current = null
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    const onResize = () => setView({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('resize', onResize)
    }
  })

  // The walking loop: once per frame, move by the keys held (or towards a tapped spot).
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = keys.current
      let dx = (k.right ? 1 : 0) - (k.left ? 1 : 0)
      let dd = (k.down ? 1 : 0) - (k.up ? 1 : 0)
      const p = pos.current
      if (target.current) {
        const tx = target.current.x - p.x
        const td = target.current.depth - p.depth
        if (Math.abs(tx) < 8 && Math.abs(td) < 0.03) target.current = null
        else {
          dx = Math.abs(tx) < 8 ? 0 : Math.sign(tx)
          dd = Math.abs(td) < 0.03 ? 0 : Math.sign(td)
        }
      }
      if (busy) dx = dd = 0
      // Ease the speed towards what the keys ask for, so steps start and stop softly.
      const ease = Math.min(1, dt * 9)
      const vx = p.vx + (dx * SPEED_X - p.vx) * ease
      const vd = p.vd + (dd * SPEED_DEPTH - p.vd) * ease
      const x = Math.min(MAX_X, Math.max(MIN_X, p.x + vx * dt))
      const depth = Math.min(1, Math.max(0, p.depth + vd * dt))
      // The camera glides after the player instead of being fixed to them.
      const goal = cameraFor(x, viewRef.current)
      const cam = Math.abs(goal - p.cam) < 0.5 ? goal : p.cam + (goal - p.cam) * Math.min(1, dt * 4)
      const moving = Math.abs(vx) > 40 || Math.abs(vd) > 0.08
      if (moving || p.moving || Math.abs(vx) > 1 || Math.abs(vd) > 0.005 || cam !== p.cam) {
        const next = { x, depth, vx, vd, cam, moving, facing: dx < 0 ? ('left' as const) : dx > 0 ? ('right' as const) : p.facing }
        pos.current = next
        setMe(next)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [busy])

  const scale = scaleFor(view)
  const camX = me.cam
  const camY = view.h - YARD_H * scale

  const tapGround = (event: React.MouseEvent) => {
    if (busy) return
    const wx = (event.clientX + camX) / scale
    const wy = (event.clientY - camY) / scale
    if (wy < FEET_FAR - 40) return
    target.current = { x: wx, depth: Math.min(1, Math.max(0, (wy - FEET_FAR) / (FEET_NEAR - FEET_FAR))) }
  }

  const everyone = [
    ...PEOPLE.map((p) => ({ ...p, moving: false, isMe: false })),
    { id: 'player', x: me.x, depth: me.depth, facing: me.facing, spec: playerSpec, node: '', moving: me.moving, isMe: true },
  ].sort((a, b) => a.depth - b.depth)

  return (
    <div className="proto fixed inset-0 overflow-hidden bg-black text-white">
      {/* The world. Clicking (or tapping) the ground walks there. */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: YARD_W, height: YARD_H, transform: `translate(${-camX}px, ${camY}px) scale(${scale})` }}
        onClick={tapGround}
        aria-hidden="true"
      >
        {/* Back to front: the sky, the clouds (their own layer, sliding slower than the yard because
            they are far away, and drifting), then the yard and the school. */}
        <div className="absolute left-0 top-0" style={{ width: YARD_W, height: 640 }}>
          <YardSky />
        </div>
        <div className="absolute left-0 top-0 overflow-hidden" style={{ width: YARD_W, height: CLOUD_H }}>
          <div className="cloud-drift absolute top-0" style={{ left: camX / scale / 1.6 - 200, width: 3200, height: CLOUD_H }}>
            <Clouds />
          </div>
        </div>
        <div className="absolute inset-0">
          <SchoolYardArt sky={false} />
        </div>
        {everyone.map((p) => {
          const h = height(p.depth)
          return (
            <div key={p.id}>
              {/* Each person's shadow, cast to the right by the low sun on the left. */}
              <div className="proto-shadow absolute" style={{ left: p.x - h * 0.08, top: feetY(p.depth) - h * 0.03, width: h * 0.62, height: h * 0.07 }} />
              <div className="proto-person absolute" style={{ left: p.x - h / 6, top: feetY(p.depth) - h * 0.97, width: h / 3, height: h, zIndex: Math.round(p.depth * 100) }}>
                <Character spec={p.spec} pose={p.moving ? 'walk' : 'idle'} facing={p.facing} mood="happy" className="size-full" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Colour grade: darker edges and a slightly heavier sky, so the eye goes to the middle. */}
      <div className="proto-grade pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* "Talk to …" above the person you are standing next to. */}
      {near && !busy && (
        <button
          type="button"
          onClick={() => startTalk(near)}
          className="proto-prompt absolute -translate-x-1/2 rounded-pill px-3 py-1.5 text-sm"
          style={{ left: near.x * scale - camX, top: camY + (feetY(near.depth) - height(near.depth) - 50) * scale }}
        >
          <kbd className="mr-2 rounded bg-white/90 px-1.5 text-xs font-bold text-black">E</kbd>
          {t('hud.talk', { name: getNpc(near.id)?.name ?? near.id })}
        </button>
      )}

      {/* Top corners: the main menu, the place name, and Need help? (always there). */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/')} aria-label={t('hud.mainMenu')} className="grid size-12 place-items-center text-white/80 hover:text-white">
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">{t('hud.prototype')}</p>
            <h1 className="text-lg font-semibold drop-shadow">{school.title}</h1>
          </div>
        </div>
        <HelpButton />
      </div>

      {/* The dialogue strip: who is speaking, then the line. Click it (or press Space) to go on. */}
      <div className="absolute inset-x-0 bottom-9" aria-live="polite">
        {node ? (
          <div className="proto-strip px-4 pb-4 pt-10 text-center">
            <p className="text-lg font-semibold" style={{ color: NAME_COLOUR[node.speaker] ?? '#ffffff' }}>
              {speakerName(node.speaker)}
            </p>
            {node.choices ? (
              <>
                <p className="mx-auto mt-1 max-w-3xl text-lg">{node.text}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {node.choices.map((c) => (
                    <button key={c.to} type="button" onClick={() => show(c.to)} className="proto-choice min-h-tap rounded-pill px-5 text-base">
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button type="button" onClick={advance} className="mx-auto block w-full max-w-3xl cursor-pointer text-lg">
                {node.text}
                <span className="sr-only"> {t('hud.continue')}</span>
              </button>
            )}
          </div>
        ) : (
          !busy && <p className="proto-hint pb-3 text-center text-sm text-white/80">{t('hud.controls')}</p>
        )}
      </div>

      {/* The small menu words along the bottom, like a visual novel. */}
      <nav aria-label={t('hud.menu')} className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center gap-1 bg-black/85 text-sm">
        <button type="button" onClick={back} disabled={!line || trail.length < 2} className="proto-menu">
          {t('hud.back')}
        </button>
        <button type="button" onClick={() => setPanel('history')} className="proto-menu">
          {t('hud.history')}
        </button>
        <button type="button" onClick={() => setPanel('map')} className="proto-menu">
          {t('hud.map')}
        </button>
        <button type="button" onClick={() => navigate('/book')} disabled={!profile} className="proto-menu">
          {t('nav.book')}
        </button>
        <SettingsDialog menuItem={{ label: t('settings.open'), className: 'proto-menu' }} />
        <button type="button" onClick={() => navigate('/')} className="proto-menu">
          {t('hud.exit')}
        </button>
      </nav>

      {panel === 'history' && (
        <div role="dialog" aria-modal="true" aria-label={t('hud.history')} className="absolute inset-0 z-20 flex flex-col bg-black/85 p-6">
          <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto">
            <h2 className="text-xl font-semibold">{t('hud.history')}</h2>
            <ul className="mt-4 space-y-3">
              {history.map((h, i) => (
                <li key={i}>
                  <span className="font-semibold text-[#5cc8e0]">{h.who}</span>
                  <p className="text-white/90">{h.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <button type="button" onClick={() => setPanel('none')} className="proto-menu mx-auto mt-4">
            {t('hud.close')}
          </button>
        </div>
      )}

      {panel === 'map' && (
        <AreaMap
          here="school"
          onClose={() => setPanel('none')}
          onTravel={(place) => {
            setPanel('none')
            if (place === 'help') navigate('/help', { state: { from: '/proto' } })
            else if (place !== 'school') setAway(place)
          }}
        />
      )}

      {/* Prototype only: the other places aren't drawn yet. */}
      {away && (
        <div role="dialog" aria-modal="true" className="absolute inset-0 z-20 grid place-items-center bg-black/90 p-6 text-center">
          <div>
            <p className="text-2xl font-semibold">{t(`map.${away}` as StringKey)}</p>
            <p className="mt-2 text-white/75">{t('map.notDrawn')}</p>
            <button type="button" onClick={() => setAway(null)} className="proto-choice mt-6 min-h-tap rounded-pill px-6">
              {t('map.backToSchool')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

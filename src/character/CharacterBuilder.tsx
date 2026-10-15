import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button } from '@/components/Button'
import { t, type StringKey } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { Character, type Pose } from './Character'
import {
  hairColors,
  hairStyles,
  headwearColors,
  headwears,
  outfitColors,
  outfits,
  randomSpec,
  skinTones,
  type CharacterSpec,
  type ColorOption,
  type StyleOption,
} from './spec'
import './builder.css'

type Tab = 'face' | 'hair' | 'outfit' | 'headwear' | 'extras'

const TABS: { id: Tab; label: StringKey; icon: ReactNode }[] = [
  { id: 'face', label: 'builder.face', icon: <FaceIcon /> },
  { id: 'hair', label: 'builder.hair', icon: <HairIcon /> },
  { id: 'outfit', label: 'builder.outfit', icon: <ShirtIcon /> },
  { id: 'headwear', label: 'builder.headwear', icon: <ScarfIcon /> },
  { id: 'extras', label: 'builder.extras', icon: <StarIcon /> },
]

const POSES: { pose: Pose; label: StringKey }[] = [
  { pose: 'wave', label: 'builder.poseWave' },
  { pose: 'cheer', label: 'builder.poseCheer' },
  { pose: 'walk', label: 'builder.poseWalk' },
]

/**
 * Character builder, laid out like a game's character customiser:
 * a row of part tabs, the character large on a lit stage, and a panel of item tiles.
 * Controlled: the parent keeps the spec and decides what "done" does
 * (onboarding creates the profile, Me saves the change).
 */
export function CharacterBuilder({
  value,
  onChange,
  onDone,
}: {
  value: CharacterSpec
  onChange: (spec: CharacterSpec) => void
  onDone: () => void
}) {
  const [tab, setTab] = useState<Tab>('face')
  // The preview waves for a moment after each change, or plays the pose the player picked.
  const [pose, setPose] = useState<Pose>('idle')
  useEffect(() => {
    if (pose === 'idle') return
    const timer = window.setTimeout(() => setPose('idle'), pose === 'walk' ? 2400 : 1400)
    return () => window.clearTimeout(timer)
  }, [pose, value])

  const change = (changes: Partial<CharacterSpec>) => {
    sound.play('tap')
    onChange({ ...value, ...changes })
    setPose('wave')
  }

  return (
    <div className="builder relative overflow-hidden rounded-card text-white shadow-lifted">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_26rem]">
        {/* Stage: the character under a spotlight, on a glowing platform. */}
        <div className="builder-stage relative flex min-h-[22rem] flex-col items-center justify-end px-4 pb-4 pt-6 lg:min-h-[38rem]">
          <div className="builder-platform" aria-hidden="true" />
          <div className="relative z-[1] h-72 w-24 sm:h-96 sm:w-32 lg:h-[30rem] lg:w-40">
            <Character spec={value} pose={pose} mood="happy" label={t('builder.preview')} className="size-full" />
          </div>
          <div role="group" aria-label={t('builder.poses')} className="relative z-[1] mt-3 flex flex-wrap justify-center gap-2">
            {POSES.map((p) => (
              <button
                key={p.pose}
                type="button"
                onClick={() => {
                  sound.play('tap')
                  setPose(p.pose)
                }}
                className="min-h-tap rounded-pill border border-white/25 bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Items: part tabs, then the tiles for the chosen part. */}
        <div className="builder-panel flex flex-col border-t border-white/10 lg:border-l lg:border-t-0">
          <Tabs tab={tab} onTab={setTab} />
          <div
            id={`builder-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`builder-tab-${tab}`}
            className="flex-1 space-y-5 p-4 lg:max-h-[30rem] lg:overflow-y-auto"
          >
            {tab === 'face' && <SwatchRow title="builder.skin" options={skinTones} selected={value.skin} onPick={(skin) => change({ skin })} />}
            {tab === 'hair' && (
              <>
                <StyleRow
                  title="builder.style"
                  options={hairStyles}
                  selected={value.hair}
                  onPick={(hair) => change({ hair })}
                  preview={(hair) => ({ ...value, hair, headwear: 'none' })}
                  view="portrait"
                />
                <SwatchRow title="builder.hairColor" options={hairColors} selected={value.hairColor} onPick={(hairColor) => change({ hairColor })} />
              </>
            )}
            {tab === 'outfit' && (
              <>
                <StyleRow
                  title="builder.style"
                  options={outfits}
                  selected={value.outfit}
                  onPick={(outfit) => change({ outfit })}
                  preview={(outfit) => ({ ...value, outfit, bag: false })}
                  view="full"
                />
                <SwatchRow
                  title="builder.outfitColor"
                  hint="builder.outfitColorHint"
                  options={outfitColors}
                  selected={value.outfitColor}
                  onPick={(outfitColor) => change({ outfitColor })}
                />
              </>
            )}
            {tab === 'headwear' && (
              <>
                <StyleRow
                  title="builder.style"
                  options={headwears}
                  selected={value.headwear}
                  onPick={(headwear) => change({ headwear })}
                  preview={(headwear) => ({ ...value, headwear, bag: false })}
                  view="portrait"
                />
                {value.headwear !== 'none' && (
                  <SwatchRow
                    title="builder.headwearColor"
                    options={headwearColors}
                    selected={value.headwearColor}
                    onPick={(headwearColor) => change({ headwearColor })}
                  />
                )}
              </>
            )}
            {tab === 'extras' && (
              <>
                <YesNoRow title="builder.glasses" on={value.glasses} onPick={(glasses) => change({ glasses })} />
                <YesNoRow title="builder.bag" on={value.bag} onPick={(bag) => change({ bag })} />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-black/20 p-4">
            <Button
              look="secondary"
              className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20"
              onClick={() => {
                onChange(randomSpec())
                setPose('cheer')
              }}
            >
              <DiceIcon />
              <span className="ml-2">{t('builder.surprise')}</span>
            </Button>
            <Button onClick={onDone} className="builder-done text-lg">
              {t('builder.done')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- tabs

/** Part tabs (a WAI-ARIA tab list: arrow keys move between tabs). */
function Tabs({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const onKey = (event: KeyboardEvent) => {
    const i = TABS.findIndex((x) => x.id === tab)
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = TABS[(i + step + TABS.length) % TABS.length]!.id
    onTab(next)
    refs.current[next]?.focus()
  }
  return (
    <div role="tablist" aria-label={t('builder.parts')} className="grid grid-cols-5 border-b border-white/10 bg-black/25">
      {TABS.map((x) => (
        <button
          key={x.id}
          ref={(el) => {
            refs.current[x.id] = el
          }}
          id={`builder-tab-${x.id}`}
          type="button"
          role="tab"
          aria-selected={tab === x.id}
          aria-controls={`builder-panel-${x.id}`}
          tabIndex={tab === x.id ? 0 : -1}
          onKeyDown={onKey}
          onClick={() => {
            sound.play('tap')
            onTab(x.id)
          }}
          className="builder-tab flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-semibold text-white/70 hover:bg-white/5 hover:text-white aria-selected:text-white"
        >
          <span className="size-6" aria-hidden="true">
            {x.icon}
          </span>
          <span className="text-center leading-tight">{t(x.label)}</span>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- rows

function Row({ title, hint, children }: { title: StringKey; hint?: StringKey; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold uppercase tracking-wider text-marigold-soft">{t(title)}</legend>
      {hint && <p className="text-sm text-white/65">{t(hint)}</p>}
      <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2">{children}</div>
    </fieldset>
  )
}

// Selected tiles get a gold frame, a glow AND a tick, so selection is never shown by colour alone.
const tile =
  'builder-tile relative flex flex-col items-center justify-center rounded-button border-2 border-white/10 bg-white/5 hover:border-white/40 aria-pressed:border-marigold'

function SwatchRow(props: {
  title: StringKey
  hint?: StringKey
  options: ColorOption[]
  selected: string
  onPick: (id: string) => void
}) {
  return (
    <Row title={props.title} hint={props.hint}>
      {props.options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === props.selected}
          aria-label={t(o.label)}
          title={t(o.label)}
          onClick={() => props.onPick(o.id)}
          className={`${tile} aspect-square p-2`}
        >
          <span className="size-full rounded-md shadow-inner" style={{ background: `linear-gradient(135deg, ${o.color} 55%, rgb(0 0 0 / 0.35))`, backgroundColor: o.color }} />
          {o.id === props.selected && <Tick />}
        </button>
      ))}
    </Row>
  )
}

function StyleRow(props: {
  title: StringKey
  options: StyleOption[]
  selected: string
  onPick: (id: string) => void
  preview: (id: string) => CharacterSpec
  view: 'full' | 'portrait'
}) {
  return (
    <Row title={props.title}>
      {props.options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === props.selected} onClick={() => props.onPick(o.id)} className={`${tile} p-1 pb-2`}>
          <span className={`builder-thumb block w-full rounded-md ${props.view === 'full' ? 'h-32' : 'h-20'}`}>
            <Character spec={props.preview(o.id)} view={props.view} className="size-full" />
          </span>
          <span className="mt-1 text-center text-xs font-semibold leading-tight">{t(o.label)}</span>
          {o.id === props.selected && <Tick />}
        </button>
      ))}
    </Row>
  )
}

function YesNoRow({ title, on, onPick }: { title: StringKey; on: boolean; onPick: (on: boolean) => void }) {
  return (
    <Row title={title}>
      {[true, false].map((choice) => (
        <button key={String(choice)} type="button" aria-pressed={on === choice} onClick={() => onPick(choice)} className={`${tile} min-h-tap px-4 font-semibold`}>
          {t(choice ? 'builder.yes' : 'builder.no')}
          {on === choice && <Tick />}
        </button>
      ))}
    </Row>
  )
}

function Tick() {
  return (
    <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-marigold text-ink shadow-soft">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
    </span>
  )
}

// ---------------------------------------------------------------- icons (decorative)

const icon = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'size-full' }

function FaceIcon() {
  return (
    <svg {...icon}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10.5h.01M15 10.5h.01M9 15c1.6 1.4 4.4 1.4 6 0" />
    </svg>
  )
}
function HairIcon() {
  return (
    <svg {...icon}>
      <path d="M5 14c-1-6 2.5-10 7-10s8 4 7 10M5 14c1-3 4-5 7-5.5M19 14c-.6-2.4-2.4-4-4.5-5" />
      <path d="M7 14v5M17 14v5" />
    </svg>
  )
}
function ShirtIcon() {
  return (
    <svg {...icon}>
      <path d="M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4Z" />
    </svg>
  )
}
function ScarfIcon() {
  return (
    <svg {...icon}>
      <path d="M5 12a7 7 0 0 1 14 0v3c0 2-1 4-3 5M5 12v3c0 2 1 4 3 5" />
      <path d="M8.5 12.5a3.5 3.5 0 0 1 7 0V14a3.5 3.5 0 0 1-7 0Z" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg {...icon}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
    </svg>
  )
}
function DiceIcon() {
  return (
    <svg {...icon} className="size-5" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8.5 8.5h.01M15.5 15.5h.01M12 12h.01M15.5 8.5h.01M8.5 15.5h.01" strokeWidth="2.6" />
    </svg>
  )
}

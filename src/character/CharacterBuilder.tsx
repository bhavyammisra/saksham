import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { t, type StringKey } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { Character, type Pose } from './Character'
import {
  bottomColors,
  bottoms,
  genders,
  hairColors,
  hairFor,
  headwearColors,
  playerHeadwears,
  playerTopColors,
  playerTops,
  randomSpec,
  skinTones,
  withGender,
  type CharacterSpec,
  type ColorOption,
  type StyleOption,
} from './spec'
import './builder.css'

type Tab = 'skin' | 'hair' | 'top' | 'bottom' | 'extras'

const TABS: { id: Tab; label: StringKey }[] = [
  { id: 'skin', label: 'builder.skin' },
  { id: 'hair', label: 'builder.hair' },
  { id: 'top', label: 'builder.top' },
  { id: 'bottom', label: 'builder.bottom' },
  { id: 'extras', label: 'builder.extras' },
]

/**
 * Character customiser (D-034): the character large on the left; on the right,
 * boy or girl, then a tab for each part with plain word chips and colour dots.
 * Controlled: the parent keeps the spec and decides what "done" does
 * (a new game creates the profile, Me saves the change).
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
  const [tab, setTab] = useState<Tab>('skin')
  // The preview waves for a moment after each change.
  const [pose, setPose] = useState<Pose>('idle')
  useEffect(() => {
    if (pose === 'idle') return
    const timer = window.setTimeout(() => setPose('idle'), 1400)
    return () => window.clearTimeout(timer)
  }, [pose, value])

  const change = (next: CharacterSpec) => {
    sound.play('tap')
    onChange(next)
    setPose('wave')
  }
  const set = (changes: Partial<CharacterSpec>) => change({ ...value, ...changes })

  return (
    <div className="builder grid overflow-hidden rounded-2xl border border-oat lg:grid-cols-[minmax(0,1fr)_28rem]">
      {/* The character on a soft circle. */}
      <div className="builder-stage relative flex min-h-[24rem] items-end justify-center overflow-hidden px-4 pb-8 pt-8 lg:min-h-[36rem]">
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-linen lg:size-[26rem]" />
        <div aria-hidden="true" className="absolute bottom-6 left-1/2 h-4 w-56 -translate-x-1/2 rounded-[50%] bg-oat/60" />
        <div className="relative h-80 w-[6.7rem] sm:h-96 sm:w-32 lg:h-[30rem] lg:w-40">
          <Character spec={value} pose={pose} mood="happy" label={t('builder.preview')} className="size-full" />
        </div>
      </div>

      <div className="flex flex-col border-t border-oat bg-[#fbf8f2] lg:border-l lg:border-t-0">
        <div className="px-5 pt-5">
          <Choice title="builder.gender" options={genders} selected={value.gender} onPick={(g) => change(withGender(value, g as CharacterSpec['gender']))} wide />
        </div>

        <Tabs tab={tab} onTab={setTab} />

        <div id={`builder-panel-${tab}`} role="tabpanel" aria-labelledby={`builder-tab-${tab}`} className="flex-1 space-y-6 p-5">
          {tab === 'skin' && <Swatches title="builder.skin" options={skinTones} selected={value.skin} onPick={(skin) => set({ skin })} />}
          {tab === 'hair' && (
            <>
              <Choice title="builder.style" options={hairFor(value.gender)} selected={value.hair} onPick={(hair) => set({ hair })} />
              <Swatches title="builder.colour" options={hairColors} selected={value.hairColor} onPick={(hairColor) => set({ hairColor })} />
            </>
          )}
          {tab === 'top' && (
            <>
              <Choice title="builder.style" options={playerTops} selected={value.outfit} onPick={(outfit) => set({ outfit })} />
              <Swatches title="builder.colour" options={playerTopColors} selected={value.outfitColor} onPick={(outfitColor) => set({ outfitColor })} />
            </>
          )}
          {tab === 'bottom' && (
            <>
              <Choice title="builder.style" options={bottoms} selected={value.bottom} onPick={(bottom) => set({ bottom })} />
              <Swatches title="builder.colour" options={bottomColors} selected={value.bottomColor} onPick={(bottomColor) => set({ bottomColor })} />
            </>
          )}
          {tab === 'extras' && (
            <>
              <YesNo title="builder.glasses" on={value.glasses} onPick={(glasses) => set({ glasses })} />
              <YesNo title="builder.bag" on={value.bag} onPick={(bag) => set({ bag })} />
              <Choice title="builder.headwear" options={playerHeadwears} selected={value.headwear} onPick={(headwear) => set({ headwear })} />
              {value.headwear !== 'none' && (
                <Swatches title="builder.headwearColor" options={headwearColors} selected={value.headwearColor} onPick={(headwearColor) => set({ headwearColor })} />
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-oat p-5">
          <button
            type="button"
            onClick={() => change(randomSpec(Math.random, value.gender))}
            className="cover-secondary min-h-tap rounded-button px-4 text-sm font-medium"
          >
            {t('builder.surprise')}
          </button>
          <button type="button" onClick={onDone} className="cover-primary min-h-tap rounded-button px-4 text-base font-semibold">
            {t('builder.done')}
          </button>
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
    <div role="tablist" aria-label={t('builder.parts')} className="mt-5 flex border-b border-oat px-3">
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
          className="builder-tab min-h-tap flex-1 px-1 text-sm font-medium text-umber hover:text-espresso aria-selected:text-espresso"
        >
          {t(x.label)}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- rows

function Row({ title, children }: { title: StringKey; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-umber">{t(title)}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

/** Word chips. Selected: dark fill and a tick, so it never relies on colour alone. */
function Choice(props: { title: StringKey; options: StyleOption[]; selected: string; onPick: (id: string) => void; wide?: boolean }) {
  return (
    <Row title={props.title}>
      {props.options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === props.selected}
          onClick={() => props.onPick(o.id)}
          className={`chip inline-flex min-h-tap items-center justify-center gap-1.5 rounded-button border border-oat bg-white px-4 text-sm font-medium hover:border-espresso ${props.wide ? 'flex-1' : ''}`}
        >
          {o.id === props.selected && <Tick />}
          {t(o.label)}
        </button>
      ))}
    </Row>
  )
}

function Swatches(props: { title: StringKey; options: ColorOption[]; selected: string; onPick: (id: string) => void }) {
  return (
    <Row title={props.title}>
      {props.options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === props.selected}
          aria-label={t(o.label)}
          title={t(o.label)}
          onClick={() => props.onPick(o.id)}
          className="swatch grid size-12 place-items-center rounded-full border border-oat bg-white"
        >
          <span className="grid size-9 place-items-center rounded-full text-white shadow-inner" style={{ backgroundColor: o.color }}>
            {o.id === props.selected && (
              <span className="grid size-5 place-items-center rounded-full bg-espresso">
                <Tick />
              </span>
            )}
          </span>
        </button>
      ))}
    </Row>
  )
}

function YesNo({ title, on, onPick }: { title: StringKey; on: boolean; onPick: (on: boolean) => void }) {
  const options: StyleOption[] = [
    { id: 'yes', label: 'builder.yes' },
    { id: 'no', label: 'builder.no' },
  ]
  return <Choice title={title} options={options} selected={on ? 'yes' : 'no'} onPick={(id) => onPick(id === 'yes')} />
}

function Tick() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 8.5 6.5 12 13 4.5" />
    </svg>
  )
}

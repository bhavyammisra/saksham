import { useEffect, useState, type ReactNode } from 'react'
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

/**
 * Character builder: a live preview, a row of choices per part, and "Surprise me".
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
  // The preview waves for a moment after each change.
  const [pose, setPose] = useState<Pose>('idle')
  useEffect(() => {
    if (pose !== 'wave') return
    const timer = window.setTimeout(() => setPose('idle'), 1200)
    return () => window.clearTimeout(timer)
  }, [pose, value])

  const change = (changes: Partial<CharacterSpec>) => {
    sound.play('tap')
    onChange({ ...value, ...changes })
    setPose('wave')
  }

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <div className="md:sticky md:top-20 md:self-start">
        <div className="mx-auto h-56 w-28 md:h-96 md:w-48">
          <Character spec={value} pose={pose} mood="happy" label={t('builder.preview')} className="size-full" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            look="secondary"
            onClick={() => {
              onChange(randomSpec())
              setPose('wave')
            }}
          >
            {t('builder.surprise')}
          </Button>
          <Button onClick={onDone}>{t('builder.done')}</Button>
        </div>
      </div>

      <div className="space-y-6">
        <SwatchRow title="builder.skin" options={skinTones} selected={value.skin} onPick={(skin) => change({ skin })} />
        <StyleRow
          title="builder.hair"
          options={hairStyles}
          selected={value.hair}
          onPick={(hair) => change({ hair })}
          preview={(hair) => ({ ...value, hair, headwear: 'none' })}
          view="portrait"
        />
        <SwatchRow title="builder.hairColor" options={hairColors} selected={value.hairColor} onPick={(hairColor) => change({ hairColor })} />
        <StyleRow
          title="builder.outfit"
          options={outfits}
          selected={value.outfit}
          onPick={(outfit) => change({ outfit })}
          preview={(outfit) => ({ ...value, outfit })}
          view="full"
        />
        <SwatchRow
          title="builder.outfitColor"
          hint="builder.outfitColorHint"
          options={outfitColors}
          selected={value.outfitColor}
          onPick={(outfitColor) => change({ outfitColor })}
        />
        <StyleRow
          title="builder.headwear"
          options={headwears}
          selected={value.headwear}
          onPick={(headwear) => change({ headwear })}
          preview={(headwear) => ({ ...value, headwear })}
          view="full" // full body, so the dupatta (worn on the shoulders) is visible
        />
        {value.headwear !== 'none' && (
          <SwatchRow
            title="builder.headwearColor"
            options={headwearColors}
            selected={value.headwearColor}
            onPick={(headwearColor) => change({ headwearColor })}
          />
        )}
        <YesNoRow title="builder.glasses" on={value.glasses} onPick={(glasses) => change({ glasses })} />
        <YesNoRow title="builder.bag" on={value.bag} onPick={(bag) => change({ bag })} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- rows

function Row({ title, hint, children }: { title: StringKey; hint?: StringKey; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-lg font-semibold">{t(title)}</legend>
      {hint && <p className="text-sm text-ink-soft">{t(hint)}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

// Selected choices get a thick dark ring AND a tick, so selection is never shown by colour alone.
const choiceRing = 'border-4 border-transparent aria-pressed:border-ink'

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
          className={`relative size-12 rounded-full shadow-soft ${choiceRing}`}
          style={{ backgroundColor: o.color }}
        >
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
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === props.selected}
          onClick={() => props.onPick(o.id)}
          className={`relative flex w-24 flex-col items-center rounded-card bg-plaster-deep p-1 ${choiceRing}`}
        >
          <span className={props.view === 'full' ? 'h-28 w-14' : 'size-16'}>
            <Character spec={props.preview(o.id)} view={props.view} className="size-full" />
          </span>
          <span className="mt-1 text-center text-sm leading-tight">{t(o.label)}</span>
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
        <button
          key={String(choice)}
          type="button"
          aria-pressed={on === choice}
          onClick={() => onPick(choice)}
          className={`relative min-h-tap min-w-24 rounded-button bg-plaster-deep px-4 font-semibold ${choiceRing}`}
        >
          {t(choice ? 'builder.yes' : 'builder.no')}
          {on === choice && <Tick />}
        </button>
      ))}
    </Row>
  )
}

function Tick() {
  return (
    <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-ink text-white">
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
    </span>
  )
}

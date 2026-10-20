import { useEffect, useRef, useState } from 'react'
import type { SceneDef } from '@content/types'
import type { CharacterSpec } from '@/character/spec'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { blipsOn } from '@/lib/synth'
import { getNpc } from './people'
import type { DialogueState } from './story'

const CHARS_PER_SECOND = 45

// Name colours, so you can tell who is speaking at a glance (D-036). The player is gold,
// Mitthu green, and everyone else gets one of these, always the same for the same person.
const PLAYER_COLOUR = '#f5d76e'
const PARROT_COLOUR = '#8fd88a'
const COLOURS = ['#5cc8e0', '#f2a65a', '#e58fb0', '#a8b8ff', '#7fd6b5', '#e0c07a']

export function speakerColour(speaker: string): string {
  if (speaker === 'player') return PLAYER_COLOUR
  if (getNpc(speaker)?.kind === 'parrot') return PARROT_COLOUR
  let sum = 0
  for (const ch of speaker) sum += ch.charCodeAt(0)
  return COLOURS[sum % COLOURS.length]!
}

interface Props {
  scene: SceneDef
  dialogue: DialogueState
  player: { name: string; spec: CharacterSpec }
  calm: boolean
  onNext: () => void
  onChoose: (index: number) => void
}

/**
 * The dialogue strip (D-036): a see-through band across the bottom of the scene, like film
 * subtitles. The speaker's name in their colour, the line below it (typed out, except in calm
 * mode), then Next or the choices. Clicking anywhere on the strip also goes on.
 * Screen readers get each full line once through an aria-live region.
 */
export function Dialogue(props: Props) {
  const node = props.scene.nodes[props.dialogue.nodeId]
  if (!node) return null
  const npc = node.speaker === 'player' ? null : getNpc(node.speaker)
  const name = node.speaker === 'player' ? props.player.name : (npc?.name ?? node.speaker)

  return (
    <section aria-label={t('scene.conversation')} className="game-strip px-4 pb-3 pt-12 text-center">
      <p className="sr-only" aria-live="polite">
        {name}: {node.text}
      </p>
      <span className="block text-lg font-semibold drop-shadow" style={{ color: speakerColour(node.speaker) }} aria-hidden="true">
        {name}
      </span>
      {/* key: a new line restarts the typewriter */}
      <Line key={props.dialogue.nodeId} {...props} text={node.text} choices={node.choices} speaker={node.speaker} />
    </section>
  )
}

function Line(props: Props & { text: string; choices?: { label: string }[]; speaker: string }) {
  const { text, calm, speaker } = props
  const parts = splitGraphemes(text)
  const [shown, setShown] = useState(calm ? parts.length : 0)
  const done = shown >= parts.length
  const firstButton = useRef<HTMLButtonElement>(null)

  // Typewriter (none in calm mode).
  useEffect(() => {
    if (done) return
    const timer = window.setInterval(() => setShown((n) => Math.min(parts.length, n + 1)), 1000 / CHARS_PER_SECOND)
    return () => window.clearInterval(timer)
  }, [done, parts.length])

  // A typing blip as letters appear, in the speaker's own pitch (Sound v2, D-051).
  useEffect(() => {
    const index = shown - 1
    if (calm || index < 0 || !blipsOn(parts[index] ?? '', index)) return
    sound.blip(speaker, getNpc(speaker)?.kind === 'parrot' ? 'parrot' : undefined)
  }, [shown]) // eslint-disable-line react-hooks/exhaustive-deps -- once per new letter

  // Keyboard users land on the next thing to press (Enter or Space then goes on).
  useEffect(() => {
    firstButton.current?.focus({ preventScroll: true })
  }, [done])

  const next = () => {
    sound.play('tap')
    if (done) props.onNext()
    else setShown(parts.length) // first press shows the whole line
  }

  return (
    <>
      {/* Clicking the line itself also goes on (the Next button below does the same for keyboards). */}
      <p className="mx-auto mt-1 min-h-[2lh] max-w-3xl cursor-pointer text-lg leading-snug drop-shadow" aria-hidden="true" onClick={props.choices && done ? undefined : next}>
        {parts.slice(0, shown).join('')}
        {/* Reserve the space of the hidden rest, so the strip doesn't jump. */}
        <span className="invisible">{parts.slice(shown).join('')}</span>
      </p>

      <div className="mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-center gap-2">
        {done && props.choices ? (
          <ul className="flex w-full flex-col items-center gap-2">
            {props.choices.map((choice, i) => (
              <li key={choice.label} className="w-full max-w-xl">
                <button
                  ref={i === 0 ? firstButton : undefined}
                  type="button"
                  onClick={() => {
                    sound.play('tap')
                    props.onChoose(i)
                  }}
                  className="game-choice min-h-tap w-full rounded-pill px-5 py-2 text-base"
                >
                  {choice.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button ref={firstButton} type="button" onClick={next} className="game-next min-h-tap rounded-pill px-5 text-sm font-semibold">
            {t('scene.next')}
          </button>
        )}
      </div>
    </>
  )
}

/** Splits text into what readers see as single characters (keeps Hindi letters whole). */
function splitGraphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment)
  }
  return [...text]
}

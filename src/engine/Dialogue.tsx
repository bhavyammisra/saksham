import { useEffect, useRef, useState } from 'react'
import type { SceneDef } from '@content/types'
import { Mitthu } from '@/character/Mitthu'
import { Portrait } from '@/character/Portrait'
import type { CharacterSpec } from '@/character/spec'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { getNpc, npcSpec } from './people'
import { canSpeak, speak, stopSpeaking } from './speech'
import type { DialogueState } from './story'

const CHARS_PER_SECOND = 45

interface Props {
  scene: SceneDef
  dialogue: DialogueState
  player: { name: string; spec: CharacterSpec }
  narration: boolean // the "Read aloud" setting: read each line automatically
  calm: boolean
  onNext: () => void
  onChoose: (index: number) => void
}

/**
 * The conversation panel: portrait, name, typewriter text, Next and choices.
 * Screen readers get each full line once through an aria-live region
 * (the letter-by-letter text is hidden from them).
 */
export function Dialogue(props: Props) {
  const node = props.scene.nodes[props.dialogue.nodeId]
  const box = useRef<HTMLElement>(null)
  // Bring the conversation into view when it opens (it sits below the scene).
  useEffect(() => {
    box.current?.scrollIntoView({ block: 'nearest', behavior: props.calm ? 'auto' : 'smooth' })
  }, [props.calm])
  if (!node) return null
  const npc = node.speaker === 'player' ? null : getNpc(node.speaker)
  const name = node.speaker === 'player' ? props.player.name : (npc?.name ?? node.speaker)

  return (
    <section
      ref={box}
      aria-label={t('scene.conversation')}
      className="scene-dialogue mt-3 rounded-card border-2 border-sand bg-plaster p-3 shadow-soft sm:p-4"
    >
      <p className="sr-only" aria-live="polite">
        {name}: {node.text}
      </p>
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {npc?.kind === 'parrot' ? (
            <div className="size-16 overflow-hidden rounded-full bg-gradient-to-b from-marigold-soft to-plaster-deep shadow-soft sm:size-20">
              <Mitthu view="portrait" className="size-full" />
            </div>
          ) : (
            <Portrait
              spec={node.speaker === 'player' ? props.player.spec : npc ? npcSpec(npc) : props.player.spec}
              mood={node.mood}
              talking
              className="size-16 sm:size-20"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-terracotta-deep">{name}</p>
          {/* key: a new line restarts the typewriter */}
          <Line key={props.dialogue.nodeId} {...props} text={node.text} choices={node.choices} />
        </div>
      </div>
    </section>
  )
}

function Line(props: Props & { text: string; choices?: { label: string }[] }) {
  const { text, calm, narration } = props
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

  // Read the line aloud automatically when the setting is on.
  useEffect(() => {
    if (narration) speak(text)
    return () => stopSpeaking()
  }, [narration, text])

  // Keyboard users land on the next thing to press.
  useEffect(() => {
    firstButton.current?.focus()
  }, [done])

  return (
    <>
      <p className="mt-1 min-h-[2lh] text-lg" aria-hidden="true">
        {parts.slice(0, shown).join('')}
        {/* Reserve the space of the hidden rest, so the box doesn't jump. */}
        <span className="invisible">{parts.slice(shown).join('')}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {done && props.choices ? (
          <ul className="flex w-full flex-col gap-2">
            {props.choices.map((choice, i) => (
              <li key={choice.label}>
                <button
                  ref={i === 0 ? firstButton : undefined}
                  type="button"
                  onClick={() => {
                    sound.play('tap')
                    props.onChoose(i)
                  }}
                  className="min-h-tap w-full rounded-button border-2 border-sand bg-white px-4 py-2 text-left font-semibold hover:border-ink hover:bg-marigold-soft"
                >
                  {choice.label}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <button
            ref={firstButton}
            type="button"
            onClick={() => {
              sound.play('tap')
              if (done) props.onNext()
              else setShown(parts.length) // first press shows the whole line
            }}
            className="min-h-tap rounded-button bg-terracotta px-6 font-semibold text-white hover:bg-terracotta-deep"
          >
            {t('scene.next')}
          </button>
        )}
        {canSpeak() && (
          <button
            type="button"
            onClick={() => speak(text)}
            className="ml-auto min-h-tap rounded-button px-3 font-semibold text-peacock underline underline-offset-4"
          >
            {t('scene.readAloud')}
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

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { classMission } from '@/lib/classroom'
import { getCommunity } from '@/lib/scenes'
import { QUESTION_MAX } from '@/lib/rules'
import { selectActiveData, useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

// One shared empty list, so the store selectors below return the same value when there is nothing yet.
const NONE: never[] = []

/**
 * Community (FR-10, D-042): the Pledge Wall, the Class Mission, Ask an Expert and Places that help.
 * All local. Pledges are presets and questions stay with the player who wrote them (safety rules).
 * The Class Mission is cooperative: one total for everyone, no names. For a player in a class it is the
 * real class total (D-047); otherwise it counts this device's players and is labelled "Sample".
 * (RequireProfile guarantees there is an active profile here.)
 */
export function Community() {
  return (
    <Page title={t('community.title')}>
      <p className="text-ink-soft">{t('community.intro')}</p>
      <Pledges />
      <Mission />
      <AskAnExpert />
      <Places />
    </Page>
  )
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      {hint && <p className="text-ink-soft">{hint}</p>}
      {children}
    </section>
  )
}

function Pledges() {
  const taken = useStore((s) => selectActiveData(s)?.extras.pledges ?? NONE)
  const addExtra = useStore((s) => s.addExtra)
  return (
    <Section id="community-pledges" title={t('community.pledges')} hint={t('community.pledgesHint')}>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {getCommunity().pledges.map((p) => {
          const has = taken.includes(p.id)
          return (
            <li key={p.id} className={`flex flex-col rounded-card p-4 ${has ? 'bg-plaster-deep' : 'border-2 border-dashed border-sand'}`}>
              <p className="flex-1 font-semibold">{p.text}</p>
              {has ? (
                <p className="mt-3 flex min-h-tap items-center gap-2 font-semibold text-leaf">
                  <span aria-hidden="true">✓</span>
                  {t('community.pledged')}
                </p>
              ) : (
                <Button look="secondary" className="mt-3 self-start" onClick={() => addExtra('pledges', p.id)} aria-label={`${t('community.pledge')}: ${p.text}`}>
                  {t('community.pledge')}
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

function Mission() {
  // Every player on this device together: one total, never split by player (no comparing children).
  const deviceStars = useStore((s) => Object.values(s.data).reduce((sum, d) => sum + Object.values(d.progress).reduce((n, p) => n + p.stars, 0), 0))
  const inClass = useStore((s) => Boolean(selectActiveData(s)?.classInfo))
  const [live, setLive] = useState<{ className: string; target: number; total: number } | null>(null)
  useEffect(() => {
    let current = true
    if (supabase && inClass) void classMission(supabase).then((m) => current && setLive(m))
    return () => {
      current = false
    }
  }, [inClass])

  const stars = live?.total ?? deviceStars
  const target = live?.target ?? getCommunity().mission.target
  const shown = Math.min(stars, target)
  return (
    <Section id="community-mission" title={t('community.mission')}>
      <div className="mt-3 rounded-card bg-plaster-deep p-4">
        {!live && <p className="inline-block rounded-button border-2 border-brass px-2 text-sm font-semibold uppercase tracking-wider">{t('community.sample')}</p>}
        <p className="mt-2 text-lg font-semibold">{live ? t('community.classGoal', { name: live.className, target }) : getCommunity().mission.goal}</p>
        <div className="mt-3 h-3 rounded-pill bg-sand/50" aria-hidden="true">
          <div className="h-3 rounded-pill bg-marigold" style={{ width: `${(shown / target) * 100}%` }} />
        </div>
        <p className="mt-2">{stars >= target ? t('community.missionDone') : t('community.missionProgress', { n: shown, target })}</p>
        {!live && <p className="mt-2 text-sm text-ink-soft">{t('community.sampleNote')}</p>}
      </div>
    </Section>
  )
}

function AskAnExpert() {
  const questions = useStore((s) => selectActiveData(s)?.questions ?? NONE)
  const addQuestion = useStore((s) => s.addQuestion)
  const removeQuestion = useStore((s) => s.removeQuestion)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!addQuestion(text)) return setStatus('error')
    setText('')
    setStatus('saved')
  }

  return (
    <Section id="community-ask" title={t('community.ask')} hint={t('community.askHint')}>
      <p className="mt-3 rounded-card bg-plaster-deep p-3">
        {t('community.askDanger')}{' '}
        <Link to="/help" className="inline-flex min-h-tap items-center font-semibold text-peacock underline underline-offset-4">
          {t('community.askDangerLink')}
        </Link>
      </p>
      <form onSubmit={save} className="mt-3">
        <label htmlFor="ask-question" className="font-semibold">
          {t('community.askLabel')}
        </label>
        <textarea
          id="ask-question"
          value={text}
          maxLength={QUESTION_MAX}
          rows={3}
          onChange={(event) => {
            setText(event.target.value)
            setStatus('idle')
          }}
          aria-describedby="ask-status"
          className="mt-1 block w-full rounded-card border-2 border-sand bg-plaster p-3"
        />
        <Button type="submit" className="mt-3">
          {t('community.askSave')}
        </Button>
        <p id="ask-status" aria-live="polite" className="mt-2 font-semibold">
          {status === 'error' && t('community.askError', { max: QUESTION_MAX })}
          {status === 'saved' && t('community.askSaved')}
        </p>
      </form>
      {questions.length > 0 && (
        <>
          <h3 className="mt-4 font-semibold">{t('community.askMine')}</h3>
          <ul className="mt-2 grid gap-2">
            {questions.map((q) => (
              <li key={q.id} className="flex flex-col gap-2 rounded-card bg-plaster-deep p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 break-words sm:flex-1">{q.text}</p>
                <Button look="secondary" className="self-start sm:self-auto" onClick={() => removeQuestion(q.id)} aria-label={`${t('community.askRemove')}: ${q.text}`}>
                  {t('community.askRemove')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  )
}

function Places() {
  return (
    <Section id="community-places" title={t('community.places')} hint={t('community.placesHint')}>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {getCommunity().places.map((p) => (
          <li key={p.id} className="rounded-card bg-plaster-deep p-4">
            <p className="font-semibold">{p.name}</p>
            <p className="mt-1">{p.what}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

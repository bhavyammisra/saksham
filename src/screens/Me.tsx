import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CharacterBuilder } from '@/character/CharacterBuilder'
import { Portrait } from '@/character/Portrait'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { SettingsControls } from '@/components/SettingsDialog'
import { t, type StringKey } from '@/lib/i18n'
import { joinClass, leaveClass, type ClassProblem } from '@/lib/classroom'
import { BADGES } from '@/lib/rules'
import { supabase, type Supabase } from '@/lib/supabase'
import { BADGE_TEXT } from '@/play/badgeText'
import { selectActiveData, selectActiveProfile, useStore } from '@/lib/store'

/**
 * Me: the player's character, their own badges and stars, settings, and switching player.
 * Only this player's things, never compared with anyone else (safety rule: no leaderboards).
 * (RequireProfile guarantees there is an active profile here.)
 */
export function Me() {
  const profile = useStore(selectActiveProfile)
  const data = useStore(selectActiveData)
  const navigate = useNavigate()
  if (!profile) return null

  const earned = new Set(data?.extras.badges ?? [])
  const stars = Object.values(data?.progress ?? {}).reduce((sum, p) => sum + p.stars, 0)

  return (
    <Page title={t('me.title')}>
      <div className="flex flex-wrap items-center gap-4">
        <Portrait spec={profile.avatar} mood="happy" className="size-32" label={t('builder.preview')} />
        <div>
          <p className="text-xl font-semibold">{profile.firstName}</p>
          <p className="text-ink-soft">{t('me.stars', { n: stars })}</p>
        </div>
      </div>
      <Link
        to="/me/character"
        className="mt-6 inline-flex min-h-tap items-center rounded-button bg-terracotta px-5 font-semibold text-white hover:bg-terracotta-deep"
      >
        {t('me.changeCharacter')}
      </Link>

      <section aria-labelledby="me-badges" className="mt-10">
        <h2 id="me-badges" className="text-xl font-semibold">
          {t('me.badges')}
        </h2>
        <p className="text-ink-soft">{t('me.badgesHint')}</p>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {BADGES.map((b) => {
            const has = earned.has(b)
            return (
              <li key={b} className={`rounded-card p-3 text-center ${has ? 'bg-plaster-deep' : 'border-2 border-dashed border-sand text-ink-soft'}`}>
                <span
                  aria-hidden="true"
                  className={`mx-auto grid size-12 place-items-center rounded-full border-2 text-2xl ${has ? 'border-brass bg-marigold-soft' : 'border-sand'}`}
                >
                  {has ? '✦' : '?'}
                </span>
                <span className="mt-1 block font-semibold">{t(BADGE_TEXT[b].name)}</span>
                <span className="block text-sm">{t(BADGE_TEXT[b].about)}</span>
                <span className="mt-1 block text-sm font-semibold">{has ? t('me.earned') : t('me.notYet')}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {supabase && <MyClass db={supabase} firstName={profile.firstName} />}

      <section aria-labelledby="me-settings" className="mt-10 max-w-xl">
        <h2 id="me-settings" className="text-xl font-semibold">
          {t('me.settings')}
        </h2>
        <SettingsControls />
      </section>

      <button
        type="button"
        // The player list sets the new player when one is picked. (Clearing the player here would
        // make this screen's guard jump to the title menu first.)
        onClick={() => navigate('/profiles')}
        className="mt-10 min-h-tap rounded-button border-2 border-sand bg-plaster px-5 font-semibold hover:bg-marigold-soft"
      >
        {t('me.switchPlayer')}
      </button>
      <p className="mt-6">
        <Link to="/credits" className="inline-flex min-h-tap items-center font-semibold text-peacock underline underline-offset-4">
          {t('credits.title')}
        </Link>
      </p>
    </Page>
  )
}

/** /me/character: change the character, saved on "This is me!". */
export function MeCharacter() {
  const profile = useStore(selectActiveProfile)
  const setAvatar = useStore((s) => s.setAvatar)
  const navigate = useNavigate()
  const [draft, setDraft] = useState(profile?.avatar)
  if (!profile || !draft) return null
  return (
    <Page title={t('builder.title')}>
      <CharacterBuilder
        value={draft}
        onChange={setDraft}
        onDone={() => {
          setAvatar(draft)
          navigate('/me')
        }}
      />
    </Page>
  )
}

const PROBLEM_TEXT: Record<ClassProblem, StringKey> = {
  code: 'class.problemCode',
  offline: 'class.problemOffline',
  general: 'class.problemGeneral',
}

/**
 * My class (FR-11, D-045): joining is optional. The child types the code their teacher gives them;
 * their first name, age band and character go with it, nothing else. Shown only when the class
 * server is set up. Leaving asks once more first.
 */
function MyClass({ db, firstName }: { db: Supabase; firstName: string }) {
  const classInfo = useStore((s) => selectActiveData(s)?.classInfo ?? null)
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<ClassProblem | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const run = async (action: () => Promise<ClassProblem | null>) => {
    setBusy(true)
    setProblem(null)
    const result = await action()
    setProblem(result)
    setBusy(false)
    if (!result) {
      setCode('')
      setConfirmLeave(false)
    }
  }

  return (
    <section aria-labelledby="me-class" className="mt-10 max-w-xl">
      <h2 id="me-class" className="text-xl font-semibold">
        {t('class.title')}
      </h2>
      {classInfo ? (
        <>
          <p className="mt-2 text-lg">{t('class.inClass', { name: classInfo.name })}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {confirmLeave ? (
              <>
                <Button disabled={busy} onClick={() => void run(() => leaveClass(db))}>
                  {t('class.leaveYes')}
                </Button>
                <Button look="secondary" onClick={() => setConfirmLeave(false)}>
                  {t('class.leaveNo')}
                </Button>
              </>
            ) : (
              <Button look="secondary" onClick={() => setConfirmLeave(true)}>
                {t('class.leave')}
              </Button>
            )}
          </div>
          {confirmLeave && <p className="mt-2 text-ink-soft">{t('class.leaveNote')}</p>}
        </>
      ) : (
        <form
          className="mt-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (code.trim()) void run(() => joinClass(db, code))
          }}
        >
          <p className="text-ink-soft">{t('class.hint', { name: firstName })}</p>
          <label className="mt-3 grid gap-1 font-semibold">
            {t('class.code')}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="min-h-tap w-64 max-w-full rounded-button border-2 border-sand bg-plaster px-3 font-mono text-2xl tracking-[0.3em]"
            />
          </label>
          <Button type="submit" disabled={busy} className="mt-3">
            {t('class.join')}
          </Button>
        </form>
      )}
      <p aria-live="polite" className="mt-2 font-semibold">
        {problem && t(PROBLEM_TEXT[problem])}
      </p>
    </section>
  )
}

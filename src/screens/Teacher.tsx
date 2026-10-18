import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { t, type StringKey } from '@/lib/i18n'
import { supabase, type Supabase } from '@/lib/supabase'

/**
 * For teachers (FR-13, D-044): sign up, sign in and out, and manage classes with their join codes.
 * Everything goes through Supabase; the database's row level security decides what a teacher may
 * see or change (D-043), so this screen never checks rights itself. Without a configured backend
 * it only says so: the children's game never needs it.
 */
export function Teacher() {
  if (!supabase) {
    return (
      <Page title={t('teacher.title')}>
        <p>{t('teacher.offline')}</p>
      </Page>
    )
  }
  return <TeacherOnline db={supabase} />
}

function TeacherOnline({ db }: { db: Supabase }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined: still checking
  useEffect(() => {
    void db.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = db.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [db])

  // A child's anonymous session on a shared device is not a teacher: show the sign-in form.
  const teacher = session && !session.user.is_anonymous ? session : null
  return (
    <Page title={t('teacher.title')}>
      {session === undefined ? null : teacher ? <Classes db={db} email={teacher.user.email ?? ''} /> : <SignIn db={db} />}
    </Page>
  )
}

// ---------------------------------------------------------------- signing in

/** Supabase's error codes, in words a teacher understands. Anything else gets a general message. */
const AUTH_ERRORS: Record<string, StringKey> = {
  invalid_credentials: 'teacher.errorCredentials',
  email_not_confirmed: 'teacher.errorNotConfirmed',
  user_already_exists: 'teacher.errorExists',
  weak_password: 'teacher.errorWeak',
  over_email_send_rate_limit: 'teacher.errorRateLimit',
}
const authError = (code: string | undefined): StringKey => (code && AUTH_ERRORS[code]) || 'teacher.errorGeneral'

function SignIn({ db }: { db: Supabase }) {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<StringKey | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    if (mode === 'signIn') {
      const { error } = await db.auth.signInWithPassword({ email, password })
      if (error) setMessage(authError(error.code))
    } else {
      // The confirmation link comes back to the app's address; main.tsx sends it on to this page.
      const { error } = await db.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}${location.pathname}` } })
      setMessage(error ? authError(error.code) : 'teacher.checkEmail')
    }
    setBusy(false)
  }

  return (
    <div className="max-w-md">
      <p className="text-ink-soft">{t('teacher.intro')}</p>
      <div role="group" aria-label={t('teacher.accountMode')} className="mt-4 grid grid-cols-2 gap-2">
        {(['signIn', 'signUp'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m)
              setMessage(null)
            }}
            className={`min-h-tap rounded-button border-2 px-3 font-semibold ${mode === m ? 'border-ink bg-ink text-plaster' : 'border-sand bg-plaster'}`}
          >
            {t(m === 'signIn' ? 'teacher.signIn' : 'teacher.signUp')}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <label className="grid gap-1 font-semibold">
          {t('teacher.email')}
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-tap rounded-button border-2 border-sand bg-plaster px-3 font-normal" />
        </label>
        <label className="grid gap-1 font-semibold">
          {t('teacher.password')}
          <input
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-tap rounded-button border-2 border-sand bg-plaster px-3 font-normal"
          />
        </label>
        {mode === 'signUp' && <p className="text-sm text-ink-soft">{t('teacher.passwordHint')}</p>}
        <Button type="submit" disabled={busy} className="justify-self-start">
          {t(mode === 'signIn' ? 'teacher.signIn' : 'teacher.createAccount')}
        </Button>
        <p aria-live="polite" className="font-semibold">
          {message && t(message)}
        </p>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------- classes

interface ClassRow {
  id: string
  name: string
  join_code: string
  code_active: boolean
}

function Classes({ db, email }: { db: Supabase; email: string }) {
  const [classes, setClasses] = useState<ClassRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [name, setName] = useState('')
  const [version, setVersion] = useState(0) // bumped after every change, to load the list again

  useEffect(() => {
    let live = true
    void db
      .from('classes')
      .select('id, name, join_code, code_active')
      .order('created_at')
      .then(({ data, error }) => {
        if (!live) return
        if (error) setFailed(true)
        if (data) setClasses(data)
      })
    return () => {
      live = false
    }
  }, [db, version])

  /** Runs one change, then reloads the list (the server is the source of truth). */
  const change = async (run: () => PromiseLike<{ error: unknown }>) => {
    const { error } = await run()
    setFailed(Boolean(error))
    setVersion((v) => v + 1)
  }

  const create = (event: FormEvent) => {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) return
    void change(() => db.from('classes').insert({ name: clean })).then(() => setName(''))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-ink-soft">{t('teacher.signedInAs', { email })}</p>
        <Button look="secondary" onClick={() => void db.auth.signOut()}>
          {t('teacher.signOut')}
        </Button>
      </div>

      <form onSubmit={create} className="mt-8 flex flex-wrap items-end gap-3">
        <label className="grid flex-1 gap-1 font-semibold">
          {t('teacher.newClass')}
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="min-h-tap rounded-button border-2 border-sand bg-plaster px-3 font-normal" />
        </label>
        <Button type="submit">{t('teacher.create')}</Button>
      </form>

      <p aria-live="polite" className="mt-3 font-semibold">
        {failed && t('teacher.errorSave')}
      </p>

      <h2 className="mt-6 text-xl font-semibold">{t('teacher.classes')}</h2>
      {classes?.length === 0 && <p className="mt-2 text-ink-soft">{t('teacher.noClasses')}</p>}
      <ul className="mt-3 grid gap-4">
        {classes?.map((c) => (
          <ClassCard key={c.id} row={c} db={db} change={change} />
        ))}
      </ul>
    </div>
  )
}

function ClassCard({ row, db, change }: { row: ClassRow; db: Supabase; change: (run: () => PromiseLike<{ error: unknown }>) => Promise<void> }) {
  const [name, setName] = useState(row.name)
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(row.join_code)
      setCopied(true)
    } catch {
      setCopied(false) // no clipboard (old browser or blocked): the code is still on screen to read out
    }
  }

  return (
    <li className="rounded-card bg-plaster-deep p-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim() && name.trim() !== row.name) void change(() => db.from('classes').update({ name: name.trim() }).eq('id', row.id))
        }}
      >
        <label className="grid flex-1 gap-1 font-semibold">
          {t('teacher.className')}
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className="min-h-tap rounded-button border-2 border-sand bg-plaster px-3 text-lg" />
        </label>
        <Button type="submit" look="secondary">
          {t('teacher.rename')}
        </Button>
      </form>

      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-ink-soft">{t('teacher.joinCode')}</p>
      {/* Big enough to read out to a class; spelled out letter by letter for screen readers. */}
      <p className={`font-mono text-5xl font-bold tracking-[0.3em] ${row.code_active ? '' : 'text-ink-soft line-through'}`} aria-label={row.join_code.split('').join(' ')}>
        {row.join_code}
      </p>
      <p className="mt-1">{t(row.code_active ? 'teacher.codeOn' : 'teacher.codeOff')}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button look="secondary" onClick={() => void copy()}>
          {t(copied ? 'teacher.copied' : 'teacher.copy')}
        </Button>
        <Button look="secondary" onClick={() => void change(() => db.from('classes').update({ code_active: !row.code_active }).eq('id', row.id))}>
          {t(row.code_active ? 'teacher.turnOff' : 'teacher.turnOn')}
        </Button>
        <Button look="secondary" onClick={() => void change(() => db.rpc('rotate_join_code', { class: row.id }))}>
          {t('teacher.newCode')}
        </Button>
        {confirmDelete ? (
          <>
            <Button onClick={() => void change(() => db.rpc('delete_class', { class: row.id }))}>{t('teacher.deleteYes', { name: row.name })}</Button>
            <Button look="secondary" onClick={() => setConfirmDelete(false)}>
              {t('teacher.deleteNo')}
            </Button>
          </>
        ) : (
          <Button look="secondary" onClick={() => setConfirmDelete(true)}>
            {t('teacher.delete')}
          </Button>
        )}
      </div>
    </li>
  )
}

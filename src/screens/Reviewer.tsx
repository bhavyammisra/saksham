import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { t, type StringKey } from '@/lib/i18n'
import { readable, sha256, type ReviewItem } from '@/lib/review'
import { reviewableContent } from '@/lib/scenes'
import { supabase, type Supabase } from '@/lib/supabase'
import { SignIn, useAdultSession } from './Teacher'

/**
 * Content review (FR-15, D-049), for reviewers only. The reviewer sends this build's content for
 * review, reads each item's exact text next to its hash, and publishes it, rejects it with a note,
 * or sends it back. The class server only ever holds the hash; the database lets only a reviewer
 * change anything (D-043), so this screen checks nothing itself beyond showing the right message.
 */
export function Reviewer() {
  if (!supabase) {
    return (
      <Page title={t('reviewer.title')}>
        <p>{t('teacher.offline')}</p>
      </Page>
    )
  }
  return <ReviewerOnline db={supabase} />
}

function ReviewerOnline({ db }: { db: Supabase }) {
  const session = useAdultSession(db)
  return (
    <Page title={t('reviewer.title')}>
      {session === undefined ? null : session ? <Queue db={db} email={session.user.email ?? ''} /> : <SignIn db={db} />}
    </Page>
  )
}

type Item = ReviewItem & { hash: string }
interface Row {
  status: string
  content_hash: string
  reviewer_note: string | null
}
/** Where an item stands: never sent, sent but changed since, or the server's status. */
type State = 'notSent' | 'changed' | 'in_review' | 'published' | 'rejected'
const STATE_TEXT: Record<State, StringKey> = {
  notSent: 'reviewer.notSent',
  changed: 'reviewer.changed',
  in_review: 'reviewer.inReview',
  published: 'reviewer.published',
  rejected: 'reviewer.rejected',
}
const stateOf = (item: Item, row: Row | undefined): State =>
  !row ? 'notSent' : row.content_hash !== item.hash ? 'changed' : (row.status as State) === 'in_review' || row.status === 'published' || row.status === 'rejected' ? (row.status as State) : 'notSent'

function Queue({ db, email }: { db: Supabase; email: string }) {
  const [isReviewer, setIsReviewer] = useState<boolean | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [rows, setRows] = useState<Map<string, Row>>(new Map())
  const [version, setVersion] = useState(0)
  const [filter, setFilter] = useState<State | 'all'>('all')
  const [lang, setLang] = useState('all')
  const [message, setMessage] = useState<string | null>(null)

  // This build's items and their hashes (computed once).
  useEffect(() => {
    let live = true
    void Promise.all(reviewableContent().map(async (i) => ({ ...i, hash: await sha256(i.text) }))).then((all) => live && setItems(all))
    return () => {
      live = false
    }
  }, [])

  // Who this is, and what the server holds.
  useEffect(() => {
    let live = true
    void Promise.all([db.from('user_roles').select('role'), db.from('content_items').select('id, status, content_hash, reviewer_note')]).then(([roles, content]) => {
      if (!live) return
      setIsReviewer((roles.data ?? []).some((r) => r.role === 'reviewer'))
      setRows(new Map((content.data ?? []).map((r) => [r.id, r])))
      if (roles.error || content.error) setMessage(t('dashboard.failed'))
    })
    return () => {
      live = false
    }
  }, [db, version])

  const sendChanged = async () => {
    const changed = items.filter((i) => stateOf(i, rows.get(i.id)) === 'notSent' || stateOf(i, rows.get(i.id)) === 'changed')
    let failed = false
    for (const i of changed) {
      const { error } = await db.rpc('submit_content_for_review', { item: i.id, item_kind: i.kind, item_lang: i.lang, hash: i.hash })
      failed ||= Boolean(error)
    }
    setMessage(failed ? t('teacher.errorSave') : changed.length ? t('reviewer.sent', { n: changed.length }) : t('reviewer.nothingNew'))
    setVersion((v) => v + 1)
  }

  const decide = async (item: Item, decision: 'published' | 'rejected' | 'in_review', note?: string) => {
    const { error } = await db.rpc('review_content', { item: item.id, decision, note })
    setMessage(error ? t('teacher.errorSave') : null)
    setVersion((v) => v + 1)
  }

  if (isReviewer === null) return null
  if (!isReviewer) {
    return (
      <div>
        <p>{t('reviewer.notReviewer', { email })}</p>
        <SignOut db={db} />
      </div>
    )
  }

  const shown = items.filter((i) => (filter === 'all' || stateOf(i, rows.get(i.id)) === filter) && (lang === 'all' || i.lang === lang))
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-ink-soft">{t('teacher.signedInAs', { email })}</p>
        <SignOut db={db} />
      </div>
      <p className="mt-4 text-ink-soft">{t('reviewer.intro')}</p>
      <Button className="mt-3" onClick={() => void sendChanged()}>
        {t('reviewer.send')}
      </Button>
      <p aria-live="polite" className="mt-2 font-semibold">
        {message}
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="grid min-w-0 max-w-full gap-1 font-semibold">
          {t('reviewer.status')}
          <select value={filter} onChange={(e) => setFilter(e.target.value as State | 'all')} className="min-h-tap min-w-0 max-w-full rounded-button border-2 border-sand bg-plaster px-3">
            <option value="all">{t('reviewer.all')}</option>
            {(Object.keys(STATE_TEXT) as State[]).map((s) => (
              <option key={s} value={s}>
                {t(STATE_TEXT[s])}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-semibold">
          {t('reviewer.language')}
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="min-h-tap rounded-button border-2 border-sand bg-plaster px-3">
            <option value="all">{t('reviewer.all')}</option>
            <option value="en">{t('reviewer.english')}</option>
            <option value="hi">{t('reviewer.hindi')}</option>
          </select>
        </label>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-4">
        {shown.map((item) => (
          <ItemCard key={item.id} item={item} row={rows.get(item.id)} decide={decide} />
        ))}
      </ul>
    </div>
  )
}

function ItemCard({ item, row, decide }: { item: Item; row: Row | undefined; decide: (item: Item, decision: 'published' | 'rejected' | 'in_review', note?: string) => Promise<void> }) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const state = stateOf(item, row)
  return (
    <li className="rounded-card bg-plaster-deep p-4">
      <h2 className="text-lg font-semibold">{item.title}</h2>
      <p className="text-sm text-ink-soft">
        {item.id} · {t('reviewer.english')}
      </p>
      <p className="mt-2 font-semibold">{t(STATE_TEXT[state])}</p>
      {state === 'rejected' && row?.reviewer_note && <p className="mt-1">{t('reviewer.note', { note: row.reviewer_note })}</p>}
      <p className="mt-2 break-all font-mono text-sm">
        {t('reviewer.hash')}: {item.hash}
      </p>
      <details className="mt-2">
        <summary className="min-h-tap cursor-pointer py-3 font-semibold text-peacock underline">{t('reviewer.read')}</summary>
        {/* The hashed text, laid out for reading (real quotes and line breaks), so the reviewer approves what children read. */}
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-card bg-plaster p-3 font-sans text-sm">{readable(JSON.parse(item.text))}</pre>
      </details>

      <div className="mt-3 flex flex-wrap gap-2">
        {state === 'in_review' && <Button onClick={() => void decide(item, 'published')}>{t('reviewer.publish')}</Button>}
        {(state === 'in_review' || state === 'published') && !rejecting && (
          <Button look="secondary" onClick={() => setRejecting(true)}>
            {t('reviewer.reject')}
          </Button>
        )}
        {(state === 'published' || state === 'rejected') && (
          <Button look="secondary" onClick={() => void decide(item, 'in_review')}>
            {t('reviewer.sendBack')}
          </Button>
        )}
      </div>
      {rejecting && (
        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (note.trim()) void decide(item, 'rejected', note.trim()).then(() => setRejecting(false))
          }}
        >
          <label className="grid gap-1 font-semibold">
            {t('reviewer.noteLabel')}
            <textarea value={note} maxLength={500} rows={3} required onChange={(e) => setNote(e.target.value)} className="rounded-card border-2 border-sand bg-plaster p-3 font-normal" />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="submit">{t('reviewer.rejectYes')}</Button>
            <Button look="secondary" onClick={() => setRejecting(false)}>
              {t('dashboard.removeNo')}
            </Button>
          </div>
        </form>
      )}
    </li>
  )
}

function SignOut({ db }: { db: Supabase }) {
  return (
    <Button look="secondary" onClick={() => void db.auth.signOut()}>
      {t('teacher.signOut')}
    </Button>
  )
}

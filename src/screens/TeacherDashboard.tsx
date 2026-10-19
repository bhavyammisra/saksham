import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { t } from '@/lib/i18n'
import { buildings, getScene } from '@/lib/scenes'
import type { Supabase } from '@/lib/supabase'

const POLL_MS = 30_000
const places = buildings.filter((b) => !b.teaser)

interface ClassData {
  students: { id: string; first_name: string }[]
  stars: Map<string, number> // `${studentId}:${buildingId}` -> stars, for places a student has finished
  averages: Map<string, { stars: number; completed: number }> // by building
  mistakes: { buildingId: string; questionId: string; answered: number; wrong: number }[]
  mission: { total: number; target: number }
}

/** The words of a quiz question or sort card, from content (never anything a child typed). */
function questionText(buildingId: string, questionId: string): string {
  for (const game of getScene(buildingId)?.games ?? []) {
    const found = game.kind === 'quiz' ? game.questions.find((q) => q.id === questionId) : game.items.find((i) => i.id === questionId)
    if (found) return found.text
  }
  return questionId
}

/**
 * One class's live dashboard (FR-14, D-047): every student's stars by place, the class averages,
 * the questions most often answered wrong on the first try, removing a student, and the
 * cooperative Class Mission. It loads again every 30 seconds and when "Refresh" is pressed.
 * The database decides what a teacher may read (D-043); this only shows it.
 */
export function TeacherDashboard({ db, classId }: { db: Supabase; classId: string }) {
  const [data, setData] = useState<ClassData | null>(null)
  const [failed, setFailed] = useState(false)
  const [version, setVersion] = useState(0)
  const [removing, setRemoving] = useState<string | null>(null) // student waiting for "Yes, remove"

  useEffect(() => {
    const timer = setInterval(() => setVersion((v) => v + 1), POLL_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let live = true
    void Promise.all([
      db.from('students').select('id, first_name').eq('class_id', classId).order('first_name'),
      db.from('class_progress_summary').select('building_id, average_stars, completed_count').eq('class_id', classId),
      db.from('class_question_stats').select('building_id, question_id, answered, wrong').eq('class_id', classId),
      db.from('class_mission').select('total_stars, mission_target').eq('class_id', classId).maybeSingle(),
    ]).then(async ([students, summary, stats, mission]) => {
      const ids = (students.data ?? []).map((s) => s.id)
      const progress = ids.length ? await db.from('progress').select('student_id, building_id, stars').in('student_id', ids) : { data: [], error: null }
      if (!live) return
      const error = students.error ?? summary.error ?? stats.error ?? mission.error ?? progress.error
      setFailed(Boolean(error))
      if (error) return
      setData({
        students: students.data ?? [],
        stars: new Map((progress.data ?? []).map((p) => [`${p.student_id}:${p.building_id}`, p.stars])),
        averages: new Map((summary.data ?? []).map((s) => [s.building_id ?? '', { stars: Number(s.average_stars ?? 0), completed: Number(s.completed_count ?? 0) }])),
        mistakes: (stats.data ?? [])
          .filter((s) => (s.wrong ?? 0) > 0)
          .map((s) => ({ buildingId: s.building_id ?? '', questionId: s.question_id ?? '', answered: Number(s.answered ?? 0), wrong: Number(s.wrong ?? 0) }))
          .sort((a, b) => b.wrong / b.answered - a.wrong / a.answered || b.wrong - a.wrong)
          .slice(0, 5),
        mission: { total: mission.data?.total_stars ?? 0, target: mission.data?.mission_target ?? 20 },
      })
    })
    return () => {
      live = false
    }
  }, [db, classId, version])

  const remove = async (studentId: string) => {
    const { error } = await db.from('students').delete().eq('id', studentId)
    setFailed(Boolean(error))
    setRemoving(null)
    setVersion((v) => v + 1)
  }

  return (
    <div className="mt-4 border-t-2 border-sand pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button look="secondary" onClick={() => setVersion((v) => v + 1)}>
          {t('dashboard.refresh')}
        </Button>
        <p className="text-sm text-ink-soft">{t('dashboard.auto')}</p>
      </div>
      <p aria-live="polite" className="mt-2 font-semibold">
        {failed && t('dashboard.failed')}
      </p>
      {data && <Mission {...data.mission} />}

      {data && data.students.length === 0 && <p className="mt-4">{t('dashboard.empty')}</p>}
      {data && data.students.length > 0 && (
        <>
          {/* The heatmap: one row per student, one column per place. Stars are said in words too. */}
          <div className="relative mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="mb-2 text-left text-lg font-semibold">{t('dashboard.progress')}</caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2">
                    {t('dashboard.student')}
                  </th>
                  {places.map((b) => (
                    <th key={b.id} scope="col" className="p-2 text-center text-sm">
                      {b.name}
                    </th>
                  ))}
                  <th scope="col" className="p-2">
                    <span className="sr-only">{t('dashboard.remove')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s.id} className="border-t border-sand">
                    <th scope="row" className="p-2 font-semibold">
                      {s.first_name}
                    </th>
                    {places.map((b) => (
                      <StarCell key={b.id} stars={data.stars.get(`${s.id}:${b.id}`)} />
                    ))}
                    <td className="p-2">
                      {removing === s.id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => void remove(s.id)}>{t('dashboard.removeYes', { name: s.first_name })}</Button>
                          <Button look="secondary" onClick={() => setRemoving(null)}>
                            {t('dashboard.removeNo')}
                          </Button>
                        </div>
                      ) : (
                        <Button look="secondary" onClick={() => setRemoving(s.id)} aria-label={t('dashboard.removeName', { name: s.first_name })}>
                          {t('dashboard.remove')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-sand">
                  <th scope="row" className="p-2">
                    {t('dashboard.average')}
                  </th>
                  {places.map((b) => {
                    const a = data.averages.get(b.id)
                    return (
                      <td key={b.id} className="p-2 text-center text-sm">
                        {a ? t('dashboard.averageCell', { stars: a.stars.toFixed(1), done: a.completed }) : '–'}
                      </td>
                    )
                  })}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <h3 className="mt-6 text-lg font-semibold">{t('dashboard.mistakes')}</h3>
          {data.mistakes.length === 0 ? (
            <p className="text-ink-soft">{t('dashboard.noMistakes')}</p>
          ) : (
            <ol className="mt-2 grid list-decimal gap-2 pl-6">
              {data.mistakes.map((m) => (
                <li key={`${m.buildingId}:${m.questionId}`}>
                  <span className="font-semibold">{buildings.find((b) => b.id === m.buildingId)?.name}:</span> {questionText(m.buildingId, m.questionId)}{' '}
                  <span className="text-ink-soft">{t('dashboard.wrongCount', { wrong: m.wrong, answered: m.answered })}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}

/** One heatmap cell: darker for more stars, with the number in words for screen readers. */
function StarCell({ stars }: { stars: number | undefined }) {
  const shade = stars === undefined ? 'bg-plaster' : ['bg-sand/40', 'bg-marigold-soft', 'bg-marigold/70', 'bg-leaf/50'][stars]
  return (
    <td className={`p-2 text-center ${shade}`}>
      <span aria-hidden="true">{stars === undefined ? '–' : '★'.repeat(stars) + '☆'.repeat(3 - stars)}</span>
      <span className="sr-only">{stars === undefined ? t('dashboard.notStarted') : t('results.stars', { n: stars })}</span>
    </td>
  )
}

function Mission({ total, target }: { total: number; target: number }) {
  const shown = Math.min(total, target)
  return (
    <div className="mt-4 rounded-card bg-plaster p-4">
      <p className="font-semibold">{t('community.mission')}</p>
      <div className="mt-2 h-3 rounded-pill bg-sand/50" aria-hidden="true">
        <div className="h-3 rounded-pill bg-marigold" style={{ width: `${(shown / target) * 100}%` }} />
      </div>
      <p className="mt-2">{total >= target ? t('community.missionDone') : t('community.missionProgress', { n: shown, target })}</p>
    </div>
  )
}

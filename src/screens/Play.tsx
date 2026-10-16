import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { GameFrame } from '@/components/GameFrame'
import { Page } from '@/components/Page'
import { Scene, type SceneResult } from '@/engine/Scene'
import { t } from '@/lib/i18n'
import { badgesFor, isUnlocked, questionsForBand, starsFor, type BuildingResult, type Score } from '@/lib/rules'
import { buildings, getScene, nextBuilding } from '@/lib/scenes'
import { selectActiveData, selectActiveProfile, useStore } from '@/lib/store'
import { CardReveal } from '@/play/CardReveal'
import { Quiz } from '@/play/Quiz'
import type { Celebration } from '@/components/ReturnCelebration'
import { Results, type Summary } from '@/play/Results'
import { useMap } from '@/play/useMap'

type Stage = 'scene' | 'card' | 'quiz' | 'results'

/** /play/:id. Travelling from one building to another (the map) starts the new one afresh. */
export function Play() {
  const { id = '' } = useParams()
  return <PlayBuilding key={id} id={id} />
}

/**
 * Playing one building, the core loop from BUILD_PLAN §2: the scene (full screen, D-036),
 * then its rights card, the quiz, and the results, which are saved.
 * Leaving through the scene's exit before finishing goes back to the town without saving.
 */
function PlayBuilding({ id }: { id: string }) {
  const scene = getScene(id)
  // A building needs its card; a hub scene (the town) has none and isn't played here.
  const card = scene?.card
  const profile = useStore(selectActiveProfile)
  const data = useStore(selectActiveData)
  const demo = useStore((s) => s.demo)
  const navigate = useNavigate()
  const map = useMap(id)

  const [stage, setStage] = useState<Stage>('scene')
  const [run, setRun] = useState(0) // bumping this restarts the scene ("Play again")
  const [retries, setRetries] = useState(0)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)

  const onComplete = useCallback((result: SceneResult) => {
    setRetries(result.retries)
    setStage('card')
  }, [])
  const onExit = useCallback(() => navigate('/town', { state: { from: id } }), [navigate, id])

  if (!profile) return null
  const unlocked = isUnlocked(id, buildings, data?.progress ?? {}, demo)
  if (!scene || !card || !unlocked) {
    return (
      <Page title={t('play.title')}>
        <p>{unlocked ? t('play.notFound') : t('play.locked')}</p>
        <Link to="/town" className="mt-4 inline-flex min-h-tap items-center font-semibold text-peacock underline">
          {t('play.backToTown')}
        </Link>
      </Page>
    )
  }

  /** The quiz is over: save the result, the card and any new badges, then show the results. */
  const finish = (score: Score) => {
    const store = useStore.getState()
    const before = selectActiveData(store)
    const next = nextBuilding(id)
    const wasOpen = next !== null && isUnlocked(next, buildings, before?.progress ?? {}, store.demo)

    const result: BuildingResult = { completed: true, retries, score }
    store.recordResult(id, result)
    store.addExtra('cards', card.id)
    const after = selectActiveData(useStore.getState())
    const newBadges = badgesFor(result, after?.progress ?? {}, buildings).filter((b) => !before?.extras.badges.includes(b))
    newBadges.forEach((b) => store.addExtra('badges', b))

    const nowOpen = next !== null && isUnlocked(next, buildings, after?.progress ?? {}, store.demo)
    const stars = starsFor(result)
    const name = (buildingId: string | null) => buildings.find((b) => b.id === buildingId)?.name ?? null
    // Only announce a place as open if its story exists, so the door really opens.
    const opened = !wasOpen && nowOpen && next !== null && getScene(next) !== null ? name(next) : null
    setSummary({ stars, score, retries, newBadges, unlocked: opened !== null })
    // What the town celebrates when the player walks back out (shown once).
    setCelebration({ place: name(id) ?? scene.title, stars, opened, tone: scene.tone })
    setStage('results')
  }

  const again = () => {
    setStage('scene')
    setSummary(null)
    setCelebration(null)
    setRetries(0)
    setRun((n) => n + 1)
  }

  if (stage === 'scene') return <Scene key={run} scene={scene} onComplete={onComplete} onExit={onExit} map={map} />

  // The card, quiz and results sit in front of the scene's picture.
  return (
    <GameFrame scene={scene} focusX={scene.width / 2}>
      <div className="mx-auto max-w-3xl rounded-2xl bg-plaster p-5 text-ink shadow-2xl md:p-8">
        {stage === 'card' && <CardReveal card={card} band={profile.band} right={scene.right} onNext={() => setStage('quiz')} />}
        {stage === 'quiz' && <Quiz questions={questionsForBand(scene.games?.[0]?.questions ?? [], profile.band)} onDone={finish} />}
        {stage === 'results' && summary && (
          <Results from={id} celebration={celebration} name={profile.firstName} avatar={profile.avatar} summary={summary} tone={scene.tone} onAgain={again} />
        )}
      </div>
    </GameFrame>
  )
}

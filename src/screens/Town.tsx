import { Link } from 'react-router'
import type { BuildingInfo } from '@content/types'
import { Mitthu } from '@/character/Mitthu'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { isUnlocked, recommendedBuilding, type BuildingProgress } from '@/lib/rules'
import { buildings, getScene } from '@/lib/scenes'
import { selectActiveData, useStore } from '@/lib/store'

/**
 * The town, for now a simple list of buildings (BUILD_PLAN P3, temporary hub).
 * Phase 4 replaces it with a walkable town scene. Each building shows its lock state,
 * stars, and Mitthu's suggestion. Everything comes from content/buildings.json and rules.ts.
 */
export function Town() {
  const data = useStore(selectActiveData)
  const demo = useStore((s) => s.demo)
  const progress = data?.progress ?? {}
  const playable = buildings.filter((b) => !b.teaser)
  // Mitthu only suggests a place that can actually be played right now.
  const suggested = recommendedBuilding(buildings, progress, demo)
  const suggestion = suggested && getScene(suggested) ? buildings.find((b) => b.id === suggested) : undefined

  return (
    <Page title={t('town.title')} wide>
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-lg">{t('town.intro')}</p>
        {demo && <span className="rounded-pill bg-peacock px-3 py-1 text-sm font-semibold text-white">{t('town.demo')}</span>}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-card bg-plaster-deep p-3">
        <div className="size-14 shrink-0 rounded-full bg-gradient-to-b from-marigold-soft to-leaf/40 p-1">
          <Mitthu view="portrait" className="size-full" />
        </div>
        <p className="font-semibold">{suggestion ? t('town.mitthuNext', { name: suggestion.name }) : t('town.mitthuAllDone')}</p>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {buildings.map((b) => {
          const index = playable.findIndex((p) => p.id === b.id)
          const previous = index > 0 ? playable[index - 1] : undefined
          return (
            <li key={b.id}>
              <BuildingCard
                building={b}
                progress={progress[b.id]}
                unlocked={isUnlocked(b.id, buildings, progress, demo)}
                ready={getScene(b.id) !== null}
                suggested={b.id === suggestion?.id}
                previousName={previous?.name}
              />
            </li>
          )
        })}
      </ul>
    </Page>
  )
}

function BuildingCard(props: {
  building: BuildingInfo
  progress: BuildingProgress | undefined
  unlocked: boolean
  ready: boolean // its scene has been written
  suggested: boolean
  previousName: string | undefined
}) {
  const { building: b, progress, unlocked, ready, suggested, previousName } = props
  const stars = progress?.stars ?? 0
  const open = unlocked && ready

  return (
    <article
      className={`relative flex h-full flex-col rounded-card border-2 p-4 shadow-soft ${
        open ? 'border-sand bg-plaster' : 'border-dashed border-sand bg-plaster-deep/60 text-ink-soft'
      } ${suggested ? 'ring-4 ring-marigold/60' : ''}`}
    >
      {suggested && (
        <span className="absolute -top-3 left-4 rounded-pill bg-marigold px-3 py-0.5 text-sm font-semibold text-ink">{t('town.suggest')}</span>
      )}
      <div className="flex items-start gap-3">
        <BuildingIcon locked={!unlocked} />
        <div>
          <h2 className="text-xl font-semibold text-ink">{b.name}</h2>
          <p className="text-sm">{b.right}</p>
        </div>
      </div>

      {open && (
        <p className="mt-3 flex items-center gap-1">
          {progress?.completed ? (
            <>
              <span className="sr-only">{t('town.stars', { n: stars })}</span>
              {[0, 1, 2].map((i) => (
                <span key={i} aria-hidden="true" className={`text-xl ${i < stars ? 'text-brass' : 'text-sand'}`}>
                  {i < stars ? '★' : '☆'}
                </span>
              ))}
            </>
          ) : (
            <span className="text-sm">{t('town.notStarted')}</span>
          )}
        </p>
      )}

      <div className="mt-auto pt-4">
        {b.teaser ? (
          <p className="font-semibold">{t('town.comingSoon')}</p>
        ) : !unlocked ? (
          <p className="font-semibold">{t('town.lockedAfter', { name: previousName ?? '' })}</p>
        ) : !ready ? (
          <p className="font-semibold">{t('town.beingBuilt')}</p>
        ) : (
          <Link
            to={`/play/${b.id}`}
            className="inline-flex min-h-tap items-center rounded-button bg-terracotta px-5 font-semibold text-white hover:bg-terracotta-deep"
          >
            {progress?.completed ? t('town.playAgain', { name: b.name }) : t('town.visit', { name: b.name })}
          </Link>
        )}
      </div>
    </article>
  )
}

/** A small building drawing; a padlock when locked (the words also say "Locked", never the icon alone). */
function BuildingIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="size-12 shrink-0" aria-hidden="true">
      <path d="M6 42 L6 20 L24 8 L42 20 L42 42 Z" fill={locked ? '#d9bc8c' : '#eab36a'} stroke="#3a2230" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 42 L19 30 Q24 24 29 30 L29 42" fill={locked ? '#a99a80' : '#2c6a94'} stroke="#3a2230" strokeWidth="2" />
      <path d="M4 21 L24 7 L44 21" fill="none" stroke="#a8401f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {locked && (
        <g>
          <rect x="30" y="28" width="14" height="12" rx="2" fill="#5c4a3a" stroke="#3a2230" strokeWidth="1.5" />
          <path d="M33 28 L33 25 A4 4 0 0 1 41 25 L41 28" fill="none" stroke="#3a2230" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}

import creditsJson from '@content/credits.json'
import type { CreditsContent } from '@content/types'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { cardsInTown } from '@/lib/scenes'

const credits = creditsJson as CreditsContent

/**
 * Credits: where everything in Saksham comes from. The assets (all art and sound is made in
 * code; the fonts are open-licensed) and the legal source of every rights card, shown exactly
 * as written in content.
 */
export function Credits() {
  const cards = cardsInTown().filter((s) => s.card !== null)
  return (
    <Page title={t('credits.title')}>
      <p className="text-lg">{t('credits.intro')}</p>

      <section aria-labelledby="credits-art" className="mt-8">
        <h2 id="credits-art" className="text-xl font-semibold">
          {t('credits.artTitle')}
        </h2>
        <p className="mt-2">{t('credits.art')}</p>
      </section>

      <section aria-labelledby="credits-fonts" className="mt-8">
        <h2 id="credits-fonts" className="text-xl font-semibold">
          {t('credits.fontsTitle')}
        </h2>
        <ul className="mt-2 space-y-3">
          {credits.fonts.map((f) => (
            <li key={f.name} className="rounded-card bg-plaster-deep p-4">
              <p className="font-semibold">{f.name}</p>
              <p className="text-sm">
                {f.by}. {f.use}.
              </p>
              <p className="text-sm text-ink-soft">{t('credits.licence', { licence: f.licence })}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="credits-law" className="mt-8">
        <h2 id="credits-law" className="text-xl font-semibold">
          {t('credits.lawTitle')}
        </h2>
        <p className="mt-1 text-ink-soft">{t('credits.lawHint')}</p>
        <ul className="mt-3 space-y-3">
          {cards.map(({ building, card }) => (
            <li key={building.id} className="rounded-card bg-plaster-deep p-4">
              <p className="font-semibold">
                {building.name}: {card!.title}
              </p>
              <p className="mt-1 text-sm">{card!.source}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The Hindi is machine-written and unreviewed (BUILD_PLAN P6, D-054): say so until a fluent speaker has checked it. */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t('credits.hindiTitle')}</h2>
        <p className="mt-1">{t('credits.hindi')}</p>
      </section>
    </Page>
  )
}

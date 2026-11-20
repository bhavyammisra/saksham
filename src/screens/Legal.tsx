import { Page } from '@/components/Page'
import { t, type StringKey } from '@/lib/i18n'

/** One page of plain sections: a heading and a paragraph each, all from the strings files. */
function LegalPage({ title, sections }: { title: StringKey; sections: [StringKey, StringKey][] }) {
  return (
    <Page title={t(title)}>
      {sections.map(([heading, body]) => (
        <section key={heading} className="mt-6">
          <h2 className="text-xl font-semibold">{t(heading)}</h2>
          <p className="mt-2">{t(body)}</p>
        </section>
      ))}
      <p className="mt-8 text-sm text-ink-soft">{t('legal.updated')}</p>
    </Page>
  )
}

/** What Saksham keeps about children and teachers, and where (the launch checklist's privacy page). */
export function Privacy() {
  return (
    <LegalPage
      title="privacy.title"
      sections={[
        ['privacy.introTitle', 'privacy.intro'],
        ['privacy.playerTitle', 'privacy.player'],
        ['privacy.classTitle', 'privacy.class'],
        ['privacy.teacherTitle', 'privacy.teacher'],
        ['privacy.neverTitle', 'privacy.never'],
        ['privacy.removeTitle', 'privacy.remove'],
      ]}
    />
  )
}

/** The terms of use (the launch checklist's terms page). */
export function Terms() {
  return (
    <LegalPage
      title="terms.title"
      sections={[
        ['terms.introTitle', 'terms.intro'],
        ['terms.adviceTitle', 'terms.advice'],
        ['terms.helpTitle', 'terms.help'],
        ['terms.useTitle', 'terms.use'],
        ['terms.asIsTitle', 'terms.asIs'],
      ]}
    />
  )
}

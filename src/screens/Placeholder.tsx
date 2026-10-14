import { Page } from '@/components/Page'
import { t, type StringKey } from '@/lib/i18n'

/** Stand-in for a screen that a later phase builds. */
export function Placeholder({ title }: { title: StringKey }) {
  return (
    <Page title={t(title)}>
      <p className="text-ink-soft">{t('placeholder.body')}</p>
    </Page>
  )
}

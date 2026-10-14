import { Link, useLocation } from 'react-router'
import helpJson from '@content/help.json'
import type { HelpContent } from '@content/types'
import { t } from '@/lib/i18n'

const help = helpJson as HelpContent

/**
 * The Help Centre (FR-08, NFR-06). Safety rules:
 * - calm: no animation, no sound, no rewards or points, never red (help-* colours only);
 * - every word of help comes from content/help.json exactly as written;
 * - it sits outside the Shell, so it has no "Need help?" button of its own.
 */
export function HelpCentre() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  return (
    <div data-help-centre className="min-h-dvh bg-help-bg text-help-ink">
      <header className="border-b border-help-border bg-help-surface">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-2">
          <Link
            to={from}
            className="inline-flex min-h-tap items-center rounded-button px-3 font-semibold text-help-accent underline underline-offset-4"
          >
            {t('help.back')}
          </Link>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-6 outline-none">
        <h1 className="text-2xl font-semibold">{help.title}</h1>
        <p className="mt-2">{help.intro}</p>
        <p className="mt-4 rounded-card border-l-8 border-help-accent bg-help-surface p-4 text-lg font-semibold">
          {help.urgent}
        </p>

        <h2 className="mt-8 text-xl font-semibold">{help.helplinesTitle}</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {help.helplines.map((line) => (
            <li key={line.id} className="rounded-card border border-help-border bg-help-surface p-4">
              <p className="font-semibold">{line.name}</p>
              <p className="text-3xl font-semibold tracking-wide">{line.number}</p>
              <p className="mt-2">{line.when}</p>
              <p className="mt-1 text-sm">{line.hours}</p>
              <a
                href={`tel:${line.number}`}
                className="mt-3 inline-flex min-h-tap items-center rounded-button bg-help-accent px-4 font-semibold text-white"
              >
                {t('help.call', { number: line.number })}
              </a>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-xl font-semibold">{help.trustedAdult.title}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6">
          {help.trustedAdult.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2 className="mt-8 text-xl font-semibold">{help.rights.title}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6">
          {help.rights.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="mt-8 border-t border-help-border pt-4 text-sm">{help.disclaimer}</p>
      </main>
    </div>
  )
}

import { Link, useLocation } from 'react-router'
import { t } from '@/lib/i18n'

/**
 * "Need help?" — on every screen except the Help Centre (safety rule, FR-08).
 * Calm teal, never red, so it reads as support rather than alarm.
 * It remembers where the child came from, so Help's "Back" returns there.
 */
export function HelpButton() {
  const location = useLocation()
  return (
    <Link
      to="/help"
      state={{ from: location.pathname }}
      data-testid="help-button"
      className="inline-flex min-h-tap shrink-0 items-center whitespace-nowrap rounded-pill bg-help-accent px-4 font-semibold text-white shadow-soft hover:bg-help-ink"
    >
      {t('help.button')}
    </Link>
  )
}

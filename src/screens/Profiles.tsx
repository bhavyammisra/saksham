import { Navigate, useNavigate } from 'react-router'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { useStore } from '@/lib/store'

/**
 * "Who is playing?" Lists the players saved on this device.
 * Only first names are shown, and only here, so a shared device can switch players.
 */
export function Profiles() {
  const profiles = useStore((s) => s.profiles)
  const setActiveProfile = useStore((s) => s.setActiveProfile)
  const navigate = useNavigate()

  if (profiles.length === 0) return <Navigate to="/onboarding" replace />

  return (
    <Page title={t('profiles.title')}>
      <ul className="flex flex-wrap gap-3">
        {profiles.map((p) => (
          <li key={p.id}>
            <Button
              onClick={() => {
                setActiveProfile(p.id)
                navigate('/town')
              }}
              className="min-w-40 text-lg"
            >
              {t('profiles.playAs', { name: p.firstName })}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        look="secondary"
        onClick={() => {
          setActiveProfile(null)
          navigate('/onboarding')
        }}
        className="mt-6"
      >
        {t('profiles.new')}
      </Button>
    </Page>
  )
}

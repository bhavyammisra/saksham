import { Link, Navigate, useNavigate } from 'react-router'
import { Portrait } from '@/character/Portrait'
import { CoverHeading, CoverScreen } from '@/components/CoverScreen'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { useStore } from '@/lib/store'

/**
 * "Who is playing?" Lists the players saved on this device as cards.
 * Only first names are shown, and only here, so a shared device can switch players.
 */
export function Profiles() {
  const profiles = useStore((s) => s.profiles)
  const setActiveProfile = useStore((s) => s.setActiveProfile)
  const navigate = useNavigate()

  if (profiles.length === 0) return <Navigate to="/onboarding" replace />

  const card = 'flex min-h-48 w-40 flex-col items-center justify-center gap-3 rounded-2xl border p-4'

  return (
    <CoverScreen className="flex min-h-dvh flex-col justify-center">
      <div>
        <CoverHeading>{t('profiles.title')}</CoverHeading>
        <p className="mt-1 text-umber">{t('profiles.hint')}</p>
        <ul className="mt-8 flex flex-wrap gap-4">
          {profiles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-label={t('profiles.playAs', { name: p.firstName })}
                onClick={() => {
                  sound.play('tap')
                  setActiveProfile(p.id)
                  navigate('/town')
                }}
                className={`${card} border-oat bg-[#fbf8f2] hover:border-espresso`}
              >
                <Portrait spec={p.avatar} mood="happy" className="size-24" />
                <span className="text-lg font-semibold">{p.firstName}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                sound.play('tap')
                setActiveProfile(null)
                navigate('/onboarding')
              }}
              className={`${card} border-dashed border-oat hover:border-espresso`}
            >
              <span aria-hidden="true" className="grid size-16 place-items-center rounded-full border border-oat text-3xl font-light leading-none text-umber">
                +
              </span>
              <span className="text-base font-medium">{t('profiles.new')}</span>
            </button>
          </li>
        </ul>
        <Link to="/" className="mt-8 inline-flex min-h-tap items-center text-sm font-medium text-umber underline-offset-4 hover:text-espresso hover:underline">
          {t('onboarding.back')}
        </Link>
      </div>
    </CoverScreen>
  )
}

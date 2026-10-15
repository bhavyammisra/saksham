import { Navigate, useNavigate } from 'react-router'
import { Portrait } from '@/character/Portrait'
import { CoverHeading, CoverScreen } from '@/components/CoverScreen'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { useStore } from '@/lib/store'

/**
 * "Who is playing?" Lists the players saved on this device as character cards.
 * Only first names are shown, and only here, so a shared device can switch players.
 */
export function Profiles() {
  const profiles = useStore((s) => s.profiles)
  const setActiveProfile = useStore((s) => s.setActiveProfile)
  const navigate = useNavigate()

  if (profiles.length === 0) return <Navigate to="/onboarding" replace />

  const card = 'flex min-h-56 w-44 flex-col items-center justify-center gap-3 rounded-card p-4'

  return (
    <CoverScreen className="flex min-h-dvh flex-col justify-center">
      <div className="cover-enter">
        <p className="cover-title text-5xl font-bold">{t('app.name')}</p>
        <div className="mt-4">
          <CoverHeading>{t('profiles.title')}</CoverHeading>
          <p className="mt-1 text-white/85">{t('profiles.hint')}</p>
        </div>
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
                className={`cover-glass ${card} border-2 !bg-[#1d1630]/75 hover:-translate-y-1 hover:border-marigold`}
              >
                <Portrait spec={p.avatar} mood="happy" className="size-28 ring-4 ring-marigold/50" />
                <span className="text-xl font-bold">{p.firstName}</span>
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
              className={`${card} border-2 border-dashed border-white/40 bg-[#1d1630]/70 backdrop-blur-md hover:border-marigold`}
            >
              <span aria-hidden="true" className="grid size-20 place-items-center rounded-full border-2 border-white/50 text-5xl leading-none">
                +
              </span>
              <span className="text-lg font-semibold">{t('profiles.new')}</span>
            </button>
          </li>
        </ul>
      </div>
    </CoverScreen>
  )
}

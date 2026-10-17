import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Character } from '@/character/Character'
import { Mitthu } from '@/character/Mitthu'
import type { CharacterSpec } from '@/character/spec'
import { CoverScreen } from '@/components/CoverScreen'
import { ScenePicture } from '@/engine/Scene'
import { getScene } from '@/lib/scenes'
import { SettingsDialog } from '@/components/SettingsDialog'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { selectActiveProfile, useStore } from '@/lib/store'

// The two explorers shown before anyone has made a character.
const PAIR: CharacterSpec[] = [
  { gender: 'girl', skin: 'skin-4', hair: 'long', hairColor: 'soft-black', outfit: 'hoodie', outfitColor: 'sage', bottom: 'jeans', bottomColor: 'denim', headwear: 'none', headwearColor: 'navy', glasses: false, bag: false },
  { gender: 'boy', skin: 'skin-6', hair: 'fade', hairColor: 'black', outfit: 'jacket', outfitColor: 'rust', bottom: 'trousers', bottomColor: 'charcoal', headwear: 'none', headwearColor: 'navy', glasses: false, bag: false },
]

/**
 * The title screen ("/"), like a game's main menu (owner feedback, D-034):
 * the logo and a short line on top, the menu below it on the left, the characters on the right.
 * Continue and Change character appear once a player exists on this device.
 */
export function Title() {
  const active = useStore(selectActiveProfile)
  const hasProfiles = useStore((s) => s.profiles.length > 0)
  const setActiveProfile = useStore((s) => s.setActiveProfile)
  const navigate = useNavigate()

  const go = (to: string) => () => {
    sound.play('tap')
    navigate(to)
  }

  return (
    <CoverScreen className="grid min-h-dvh items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        {/* Mitthu, the parrot guide, perched on the title. */}
        <div aria-hidden="true" className="-mb-3 ml-1 h-20 w-20">
          <Mitthu className="size-full" />
        </div>
        <h1 className="cover-wordmark text-5xl uppercase text-espresso md:text-6xl">{t('app.name')}</h1>
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          <span className="h-1 w-10 rounded-pill bg-rust" />
          <span className="h-1 w-5 rounded-pill bg-peacock" />
          <span className="h-1 w-2.5 rounded-pill bg-marigold" />
        </div>
        <p className="mt-4 text-lg text-peacock">{t('title.tagline')}</p>

        <nav aria-label={t('title.menu')} className="mt-12">
          <ul className="space-y-1">
            {active && (
              <MenuItem onClick={go('/town')} main note={t('title.continueAs', { name: active.firstName })}>
                {t('title.continue')}
              </MenuItem>
            )}
            <MenuItem
              main={!active}
              onClick={() => {
                sound.play('tap')
                setActiveProfile(null)
                navigate('/onboarding')
              }}
            >
              {t('title.newGame')}
            </MenuItem>
            {active && <MenuItem onClick={go('/me/character')}>{t('title.changeCharacter')}</MenuItem>}
            {hasProfiles && <MenuItem onClick={go('/profiles')}>{t('title.switchPlayer')}</MenuItem>}
            <li>
              <SettingsDialog menuItem={{ label: t('title.settings'), className: menuClass(false) }} />
            </li>
          </ul>
        </nav>

        <p className="mt-14 text-sm text-umber">
          {t('title.footer')} ·{' '}
          <Link to="/credits" className="underline underline-offset-4 hover:text-espresso">
            {t('credits.title')}
          </Link>
        </p>
      </div>

      {/* A picture of the School yard, with the player's character (or two explorers) in front. Decorative. */}
      <div aria-hidden="true" className="relative hidden h-[34rem] items-end justify-center md:flex">
        <div className="cover-picture absolute inset-x-0 top-0 h-[27rem] overflow-hidden rounded-3xl">
          <ScenePicture scene={getScene('school')!} focusX={2450} viewHeight={620} />
        </div>
        <div className="absolute bottom-3 left-1/2 h-5 w-72 -translate-x-1/2 rounded-[50%] bg-espresso/15" />
        {active ? (
          <div className="relative h-[30rem] w-40">
            <Character spec={active.avatar} pose="idle" mood="happy" className="size-full" />
          </div>
        ) : (
          <div className="relative flex items-end gap-6">
            <div className="h-[27rem] w-36">
              <Character spec={PAIR[0]!} pose="idle" mood="happy" className="size-full" />
            </div>
            <div className="h-[29rem] w-[9.7rem]">
              <Character spec={PAIR[1]!} pose="idle" mood="happy" facing="left" className="size-full" />
            </div>
          </div>
        )}
      </div>
    </CoverScreen>
  )
}

function MenuItem({ children, ...props }: { children: ReactNode; onClick: () => void; main?: boolean; note?: string }) {
  return (
    <li>
      <MenuButton {...props}>{children}</MenuButton>
    </li>
  )
}

const menuClass = (main: boolean) =>
  `menu-item flex min-h-tap items-baseline gap-3 py-1.5 text-left text-xl ${main ? 'font-semibold text-espresso' : 'font-normal text-umber'}`

function MenuButton({ children, onClick, main = false, note }: { children: ReactNode; onClick: () => void; main?: boolean; note?: string }) {
  return (
    <button type="button" onClick={onClick} className={menuClass(main)}>
      {children}
      {note && <span className="text-sm font-normal text-umber">{note}</span>}
    </button>
  )
}

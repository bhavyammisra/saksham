import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Band } from '@content/types'
import { Character } from '@/character/Character'
import { CharacterBuilder } from '@/character/CharacterBuilder'
import { Mitthu } from '@/character/Mitthu'
import { Portrait } from '@/character/Portrait'
import { randomSpec, type CharacterSpec } from '@/character/spec'
import { Button } from '@/components/Button'
import { CoverHeading, CoverScreen, Steps } from '@/components/CoverScreen'
import { t } from '@/lib/i18n'
import { cleanFirstName, isValidFirstName } from '@/lib/rules'
import { sound } from '@/lib/sound'
import { useStore } from '@/lib/store'

type Step = 'hello' | 'name' | 'band' | 'character'

// The three explorers standing on the rooftop on the welcome screen.
const LINEUP: CharacterSpec[] = [
  { skin: 'skin-4', hair: 'two-plaits', hairColor: 'black', outfit: 'salwar', outfitColor: 'peacock', headwear: 'dupatta', headwearColor: 'saffron', glasses: false, bag: false },
  { skin: 'skin-7', hair: 'side-part', hairColor: 'soft-black', outfit: 'casual', outfitColor: 'maroon', headwear: 'none', headwearColor: 'navy', glasses: false, bag: true },
  { skin: 'skin-3', hair: 'short', hairColor: 'black', outfit: 'kurta', outfitColor: 'marigold', headwear: 'patka', headwearColor: 'navy', glasses: true, bag: false },
]

/**
 * New player (FR-01): hello -> first name -> age band -> character.
 * The only personal data asked for is a first name (NFR-01). It stays on this device.
 */
export function Onboarding() {
  const [step, setStep] = useState<Step>('hello')
  const [name, setName] = useState('')
  const [showError, setShowError] = useState(false)
  const [band, setBand] = useState<Band>('young')
  // Start from a random character, so every new player looks a little different.
  const [avatar, setAvatar] = useState<CharacterSpec>(() => randomSpec())
  const heading = useRef<HTMLHeadingElement>(null)
  const hasProfiles = useStore((s) => s.profiles.length > 0)
  const addProfile = useStore((s) => s.addProfile)
  const navigate = useNavigate()

  // Move focus to the new question on each step, so screen readers announce it.
  // (Compared with the last step, not "first render", so React's development double-run doesn't focus on load.)
  const lastStep = useRef(step)
  useEffect(() => {
    if (lastStep.current === step) return
    lastStep.current = step
    heading.current?.focus()
  }, [step])

  const submitName = (event: FormEvent) => {
    event.preventDefault()
    if (!isValidFirstName(name)) {
      setShowError(true)
      return
    }
    setName(cleanFirstName(name))
    setShowError(false)
    setStep('band')
  }

  const chooseBand = (chosen: Band) => {
    setBand(chosen)
    setStep('character')
  }

  const finish = () => {
    if (addProfile(name, band, avatar)) navigate('/town')
  }

  const back = (to: Step) => (
    <Button look="secondary" onClick={() => setStep(to)} className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
      {t('onboarding.back')}
    </Button>
  )

  if (step === 'hello') {
    return (
      <CoverScreen className="flex min-h-dvh flex-col justify-center">
        {/* Explorers on the rooftop, and Mitthu flying. Decorative. */}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[3vh] right-0 hidden items-end gap-[1.5vw] pr-[4vw] md:flex">
          <div className="h-[46vh] w-[15.3vh]">
            <Character spec={LINEUP[0]!} pose="idle" mood="happy" className="size-full" />
          </div>
          <div className="mb-[1vh] h-[52vh] w-[17.3vh]">
            <Character spec={LINEUP[1]!} pose="wave" mood="happy" className="size-full" />
          </div>
          <div className="h-[49vh] w-[16.3vh]">
            <Character spec={LINEUP[2]!} pose="idle" mood="happy" facing="left" className="size-full" />
          </div>
        </div>

        <div className="cover-enter max-w-xl">
          <p className="cover-title text-7xl font-bold tracking-tight md:text-8xl" lang="en">
            {t('app.name')}
          </p>
          <p className="mt-1 text-2xl font-semibold text-marigold-soft" lang="hi">
            {t('app.nameHindi')}
          </p>
          <p className="mt-3 text-lg text-white/90">{t('cover.tagline')}</p>

          <div className="cover-glass mt-8 flex items-start gap-4 rounded-card p-5">
            <div className="size-20 shrink-0 rounded-full bg-gradient-to-b from-marigold-soft/80 to-leaf/60 p-1 shadow-soft">
              <Mitthu view="portrait" label={t('cover.mitthu')} className="size-full" />
            </div>
            <div>
              <CoverHeading headingRef={heading}>{t('onboarding.title')}</CoverHeading>
              <p className="mt-1 text-lg">{t('onboarding.hello')}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                sound.play('tap')
                setStep('name')
              }}
              className="cover-cta inline-flex min-h-16 items-center rounded-pill px-10 text-xl font-bold">
              {t('onboarding.start')}
            </button>
            {hasProfiles && (
              <Link to="/profiles" className="inline-flex min-h-tap items-center rounded-button px-4 font-semibold text-white underline underline-offset-4 hover:text-marigold-soft">
                {t('onboarding.backToPlayers')}
              </Link>
            )}
          </div>
        </div>

        {/* On phones the explorers stand below the text. */}
        <div aria-hidden="true" className="pointer-events-none mt-6 flex items-end justify-center gap-3 md:hidden">
          {LINEUP.map((spec, i) => (
            <div key={i} className="h-48 w-16">
              <Character spec={spec} pose={i === 1 ? 'wave' : 'idle'} mood="happy" className="size-full" />
            </div>
          ))}
        </div>
      </CoverScreen>
    )
  }

  if (step === 'character') {
    return (
      <CoverScreen dim>
        <Steps n={3} label={t('onboarding.step', { n: 3 })} />
        <CoverHeading headingRef={heading}>{t('builder.title')}</CoverHeading>
        <div className="mt-4">
          <CharacterBuilder value={avatar} onChange={setAvatar} onDone={finish} />
        </div>
        <div className="mt-6">{back('band')}</div>
      </CoverScreen>
    )
  }

  if (step === 'name') {
    return (
      <CoverScreen dim className="flex min-h-dvh items-center justify-center">
        <Card>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="mx-auto size-32 shrink-0 sm:mx-0" aria-hidden="true">
              <Portrait spec={avatar} mood="happy" className="size-32 ring-4 ring-marigold/60" />
            </div>
            <form onSubmit={submitName} noValidate className="flex-1">
              <Steps n={1} label={t('onboarding.step', { n: 1 })} />
              <CoverHeading headingRef={heading}>{t('onboarding.nameTitle')}</CoverHeading>
              <label htmlFor="first-name" className="mt-4 block font-semibold">
                {t('onboarding.nameLabel')}
              </label>
              <p id="first-name-hint" className="text-sm text-white/75">
                {t('onboarding.nameHint')}
              </p>
              <input
                id="first-name"
                name="firstName"
                type="text"
                autoComplete="off"
                autoCapitalize="words"
                spellCheck={false}
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={showError}
                aria-describedby={showError ? 'first-name-hint first-name-error' : 'first-name-hint'}
                className="mt-2 block min-h-14 w-full rounded-button border-2 border-white/40 bg-white/95 px-4 text-xl text-ink shadow-inner aria-invalid:border-marigold"
              />
              {showError && (
                <p id="first-name-error" role="alert" className="mt-2 rounded-button bg-black/30 px-3 py-2 font-semibold text-marigold-soft">
                  {t('onboarding.nameError')}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="submit" onClick={() => sound.play('tap')} className="cover-cta inline-flex min-h-tap items-center rounded-pill px-8 text-lg font-bold">
                  {t('onboarding.next')}
                </button>
                {back('hello')}
              </div>
            </form>
          </div>
        </Card>
      </CoverScreen>
    )
  }

  return (
    <CoverScreen dim className="flex min-h-dvh items-center justify-center">
      <Card>
        <Steps n={2} label={t('onboarding.step', { n: 2 })} />
        <CoverHeading headingRef={heading}>{t('onboarding.bandTitle', { name })}</CoverHeading>
        <p className="mt-1 text-white/80">{t('onboarding.bandHint')}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {(
            [
              ['young', 'onboarding.bandYoung', 'onboarding.bandYoungNote', 'h-40'],
              ['teen', 'onboarding.bandTeen', 'onboarding.bandTeenNote', 'h-48'],
            ] as const
          ).map(([id, label, note, height]) => (
            <button
              key={id}
              type="button"
              onClick={() => chooseBand(id)}
              className="group flex min-h-tap items-end gap-4 rounded-card border-2 border-white/20 bg-white/10 p-4 text-left hover:border-marigold hover:bg-white/15"
            >
              <span className={`w-16 shrink-0 ${height}`} aria-hidden="true">
                <Character spec={avatar} pose="idle" mood="happy" className="size-full" />
              </span>
              <span>
                <span className="block text-3xl font-bold text-white">{t(label)}</span>
                <span className="block text-sm text-white/75">{t(note)}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="mt-6">{back('name')}</div>
      </Card>
    </CoverScreen>
  )
}

function Card({ children }: { children: ReactNode }) {
  return <div className="cover-glass cover-enter w-full max-w-2xl rounded-card p-6 md:p-8">{children}</div>
}

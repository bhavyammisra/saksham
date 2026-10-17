import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Band } from '@content/types'
import { CharacterBuilder } from '@/character/CharacterBuilder'
import { randomSpec, type CharacterSpec } from '@/character/spec'
import { CoverHeading, CoverScreen, Steps } from '@/components/CoverScreen'
import { t } from '@/lib/i18n'
import { cleanFirstName, isValidFirstName } from '@/lib/rules'
import { sound } from '@/lib/sound'
import { useStore } from '@/lib/store'

type Step = 'name' | 'character'

const BANDS: { id: Band; label: 'onboarding.bandYoung' | 'onboarding.bandTeen' }[] = [
  { id: 'young', label: 'onboarding.bandYoung' },
  { id: 'teen', label: 'onboarding.bandTeen' },
]

/**
 * New game (FR-01): first name with the age group below it, then the character (D-034).
 * The only personal data asked for is a first name (NFR-01). It stays on this device.
 */
export function Onboarding() {
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [band, setBand] = useState<Band | null>(null)
  const [showError, setShowError] = useState(false)
  // Start from a random character, so every new player looks a little different.
  const [avatar, setAvatar] = useState<CharacterSpec>(() => randomSpec())
  const heading = useRef<HTMLHeadingElement>(null)
  const addProfile = useStore((s) => s.addProfile)
  const navigate = useNavigate()

  // Move focus to the new heading on each step, so screen readers announce it.
  // (Compared with the last step, not "first render", so React's development double-run doesn't focus on load.)
  const lastStep = useRef(step)
  useEffect(() => {
    if (lastStep.current === step) return
    lastStep.current = step
    heading.current?.focus()
  }, [step])

  const nameOk = isValidFirstName(name)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!nameOk || !band) {
      setShowError(true)
      return
    }
    sound.play('tap')
    setName(cleanFirstName(name))
    setShowError(false)
    setStep('character')
  }

  const finish = () => {
    if (band && addProfile(name, band, avatar)) navigate('/town')
  }

  if (step === 'character') {
    return (
      <CoverScreen>
        <div>
          <Steps n={2} of={2} label={t('onboarding.step', { n: 2 })} />
          <CoverHeading headingRef={heading}>{t('builder.title')}</CoverHeading>
          <div className="mt-5">
            <CharacterBuilder value={avatar} onChange={setAvatar} onDone={finish} />
          </div>
          <button type="button" onClick={() => setStep('name')} className="cover-secondary mt-5 min-h-tap rounded-button px-5 text-sm font-medium">
            {t('onboarding.back')}
          </button>
        </div>
      </CoverScreen>
    )
  }

  return (
    <CoverScreen className="flex min-h-dvh items-center justify-center">
      <form onSubmit={submit} noValidate className="cover-card w-full max-w-md p-6 md:p-8">
        <Steps n={1} of={2} label={t('onboarding.step', { n: 1 })} />
        <CoverHeading headingRef={heading}>{t('onboarding.nameTitle')}</CoverHeading>

        <label htmlFor="first-name" className="mt-6 block text-sm font-medium">
          {t('onboarding.nameLabel')}
        </label>
        <input
          id="first-name"
          name="firstName"
          type="text"
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={showError && !nameOk}
          aria-describedby={showError && !nameOk ? 'first-name-hint first-name-error' : 'first-name-hint'}
          className="mt-2 block min-h-tap w-full rounded-button border border-oat bg-white px-4 text-lg text-espresso aria-invalid:border-rust"
        />
        <p id="first-name-hint" className="mt-1.5 text-sm text-umber">
          {t('onboarding.nameHint')}
        </p>
        {showError && !nameOk && (
          <p id="first-name-error" role="alert" className="mt-2 text-sm font-medium text-rust">
            {t('onboarding.nameError')}
          </p>
        )}

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">{t('onboarding.bandTitle')}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {BANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-pressed={band === b.id}
                onClick={() => {
                  sound.play('tap')
                  setBand(b.id)
                }}
                className="chip min-h-tap rounded-button border border-oat bg-white px-4 text-base font-medium hover:border-espresso"
              >
                {t(b.label)}
              </button>
            ))}
          </div>
          {showError && !band && (
            <p role="alert" className="mt-2 text-sm font-medium text-rust">
              {t('onboarding.bandError')}
            </p>
          )}
        </fieldset>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex min-h-tap items-center text-sm font-medium text-umber underline-offset-4 hover:text-espresso hover:underline">
            {t('onboarding.back')}
          </Link>
          <button type="submit" className="cover-primary min-h-tap rounded-button px-8 text-base font-semibold">
            {t('onboarding.next')}
          </button>
        </div>
      </form>
    </CoverScreen>
  )
}

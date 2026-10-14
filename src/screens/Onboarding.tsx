import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import type { Band } from '@content/types'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { cleanFirstName, isValidFirstName } from '@/lib/rules'
import { useStore } from '@/lib/store'

type Step = 'hello' | 'name' | 'band'

/**
 * New player (FR-01): hello -> first name -> age band.
 * The only personal data asked for is a first name (NFR-01). It stays on this device.
 * The character builder step is added in Phase 2.
 */
export function Onboarding() {
  const [step, setStep] = useState<Step>('hello')
  const [name, setName] = useState('')
  const [showError, setShowError] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const hasProfiles = useStore((s) => s.profiles.length > 0)
  const addProfile = useStore((s) => s.addProfile)
  const navigate = useNavigate()

  // Move focus to the new question on each step, so screen readers announce it.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
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

  const chooseBand = (band: Band) => {
    if (addProfile(name, band)) navigate('/town')
  }

  if (step === 'hello') {
    return (
      <Page title={t('onboarding.title')} headingRef={heading}>
        <p className="text-lg">{t('onboarding.hello')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setStep('name')}>{t('onboarding.start')}</Button>
          {hasProfiles && (
            <Link
              to="/profiles"
              className="inline-flex min-h-tap items-center rounded-button px-4 font-semibold text-peacock underline"
            >
              {t('onboarding.backToPlayers')}
            </Link>
          )}
        </div>
      </Page>
    )
  }

  if (step === 'name') {
    return (
      <Page title={t('onboarding.nameTitle')} headingRef={heading}>
        <form onSubmit={submitName} noValidate>
          <label htmlFor="first-name" className="block font-semibold">
            {t('onboarding.nameLabel')}
          </label>
          <p id="first-name-hint" className="text-sm text-ink-soft">
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
            className="mt-2 block min-h-tap w-full max-w-sm rounded-button border-2 border-sand bg-white px-3 text-lg aria-invalid:border-ink"
          />
          {showError && (
            <p id="first-name-error" role="alert" className="mt-2 font-semibold text-ink">
              {t('onboarding.nameError')}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit">{t('onboarding.next')}</Button>
            <Button look="secondary" onClick={() => setStep('hello')}>
              {t('onboarding.back')}
            </Button>
          </div>
        </form>
      </Page>
    )
  }

  return (
    <Page title={t('onboarding.bandTitle', { name })} headingRef={heading}>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => chooseBand('young')} className="min-w-40 text-lg">
          {t('onboarding.bandYoung')}
        </Button>
        <Button onClick={() => chooseBand('teen')} className="min-w-40 text-lg">
          {t('onboarding.bandTeen')}
        </Button>
      </div>
      <Button look="secondary" onClick={() => setStep('name')} className="mt-6">
        {t('onboarding.back')}
      </Button>
    </Page>
  )
}

import { useRef } from 'react'
import { t, type Lang, type StringKey } from '@/lib/i18n'
import { useStore, type Settings } from '@/lib/store'

type Toggle = 'sound' | 'music' | 'calmMotion'

const toggles: { key: Toggle; label: StringKey; hint?: StringKey }[] = [
  { key: 'sound', label: 'settings.sound' },
  { key: 'music', label: 'settings.music' },
  { key: 'calmMotion', label: 'settings.calmMotion', hint: 'settings.calmMotionHint' },
]

// Hindi is added in Phase 6.
// Each language is named in its own script, so a child can find theirs whichever is showing.
const languages: { lang: Lang; label: StringKey }[] = [
  { lang: 'en', label: 'lang.en' },
  { lang: 'hi', label: 'lang.hi' },
]

/**
 * The settings button and its dialog. Uses the browser's <dialog>, which
 * traps focus, closes on Escape and returns focus to the button by itself.
 * `menuItem` draws it as a plain word instead of the gear button (the title menu's "Settings").
 */
export function SettingsDialog({ menuItem }: { menuItem?: { label: string; className: string } }) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      {menuItem && (
        <button type="button" onClick={() => dialog.current?.showModal()} className={menuItem.className}>
          {menuItem.label}
        </button>
      )}
      <button
        type="button"
        hidden={!!menuItem}
        onClick={() => dialog.current?.showModal()}
        className="inline-flex min-h-tap min-w-tap shrink-0 items-center justify-center gap-2 rounded-pill border-2 border-sand bg-plaster px-3 font-semibold text-ink hover:bg-marigold-soft sm:px-4"
      >
        <GearIcon />
        {/* On phones only the icon shows; the word is still read by screen readers. */}
        <span className="sr-only sm:not-sr-only">{t('settings.open')}</span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="settings-title"
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-card bg-plaster p-6 text-ink shadow-lifted backdrop:bg-ink/40"
      >
        <h2 id="settings-title" className="text-xl font-semibold">
          {t('settings.title')}
        </h2>

        <SettingsControls />

        <form method="dialog" className="mt-6 text-right">
          <button
            type="submit"
            className="min-h-tap rounded-button bg-terracotta px-6 font-semibold text-white hover:bg-terracotta-deep"
          >
            {t('settings.done')}
          </button>
        </form>
      </dialog>
    </>
  )
}

/** The settings switches and language choice. Used in the Settings dialog and on the Me page. */
export function SettingsControls() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  return (
    <>
      <ul className="mt-4 space-y-2">
        {toggles.map(({ key, label, hint }) => (
          <li key={key}>
            <SwitchRow
              label={t(label)}
              hint={hint ? t(hint) : undefined}
              on={settings[key]}
              onChange={(on) => updateSettings({ [key]: on } as Partial<Settings>)}
            />
          </li>
        ))}
      </ul>

      <fieldset className="mt-6">
        <legend className="font-semibold">{t('settings.language')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {languages.map(({ lang, label }) => (
            <button
              key={lang}
              type="button"
              aria-pressed={settings.lang === lang}
              onClick={() => updateSettings({ lang })}
              className="min-h-tap rounded-button border-2 border-sand px-4 aria-pressed:border-ink aria-pressed:bg-marigold-soft aria-pressed:font-semibold"
            >
              {t(label)}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  )
}

function GearIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  )
}

/** An on/off switch. The words "On"/"Off" are shown too, so state is never colour-only. */
function SwitchRow(props: { label: string; hint?: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.on}
      onClick={() => props.onChange(!props.on)}
      className="flex min-h-tap w-full items-center justify-between gap-4 rounded-button px-3 py-2 text-left hover:bg-plaster-deep"
    >
      <span>
        <span className="block">{props.label}</span>
        {props.hint && <span className="block text-sm text-ink-soft">{props.hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`shrink-0 rounded-pill border-2 px-3 py-1 text-sm font-semibold ${
          props.on ? 'border-leaf bg-leaf text-white' : 'border-sand bg-plaster text-ink-soft'
        }`}
      >
        {props.on ? t('settings.on') : t('settings.off')}
      </span>
    </button>
  )
}

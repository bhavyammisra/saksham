// Calm mode: <html data-calm> turns off motion everywhere (see src/index.css).
// It is on when EITHER the system asks for reduced motion OR the child turns on
// the "Calm motion" setting.

let systemCalm = false
let settingCalm = false

function apply(): void {
  if (systemCalm || settingCalm) document.documentElement.dataset.calm = ''
  else delete document.documentElement.dataset.calm
}

/** Reads the system "reduce motion" preference now and whenever it changes. Call once at start-up. */
export function followSystemCalm(): void {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  systemCalm = media.matches
  media.addEventListener('change', (event) => {
    systemCalm = event.matches
    apply()
  })
  apply()
}

/** Called whenever the "Calm motion" setting changes. */
export function setCalmSetting(on: boolean): void {
  settingCalm = on
  apply()
}

/** True when calm mode is on. Engine code checks this before any movement. */
export function isCalm(): boolean {
  return document.documentElement.hasAttribute('data-calm')
}

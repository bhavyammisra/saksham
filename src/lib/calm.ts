// Calm mode: <html data-calm> turns off motion everywhere (see src/index.css).
//
// Phase 0: follows the system "reduce motion" preference only.
// Phase 1: the "Calm motion" setting will also switch it on.

const query = '(prefers-reduced-motion: reduce)'

export function setCalm(on: boolean): void {
  if (on) document.documentElement.dataset.calm = ''
  else delete document.documentElement.dataset.calm
}

/** Sets data-calm from the system preference and keeps it in sync if it changes. */
export function followSystemCalm(): void {
  const media = window.matchMedia(query)
  setCalm(media.matches)
  media.addEventListener('change', (event) => setCalm(event.matches))
}

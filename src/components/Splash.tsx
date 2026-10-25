import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router'
import { Mitthu } from '@/character/Mitthu'
import { HelpButton } from '@/components/HelpButton'
import { useCalm } from '@/engine/hooks'
import { t } from '@/lib/i18n'
import './splash.css'

// Splash v2 (BUILD_PLAN P6, D-050): a pop-up storybook opens, the town rises out of its pages,
// lanterns light one by one and Mitthu flies in with the banner. Shown only when the game opens
// on the title menu, so never over the Help Centre. Always skippable.

const SEEN_KEY = 'saksham-splash'
const FIRST_SECONDS = 4 // the whole show on the very first load
const LATER_SECONDS = 1 // the same show, four times faster, after that
const CALM_MS = 1200 // calm mode: a still picture, then a fade
const FADE_MS = 400

function seenBefore() {
  try {
    const seen = localStorage.getItem(SEEN_KEY) === 'seen'
    localStorage.setItem(SEEN_KEY, 'seen')
    return seen
  } catch {
    return false // private windows can refuse storage; then every load is a first load
  }
}

export function Splash() {
  const location = useLocation()
  const [open, setOpen] = useState(() => location.pathname === '/')
  const [unit] = useState(() => (open ? (seenBefore() ? LATER_SECONDS : FIRST_SECONDS) / FIRST_SECONDS : 1))
  const calm = useCalm()
  const root = useRef<HTMLDivElement>(null)
  const leaving = useRef(false)

  const finish = () => {
    if (leaving.current) return
    leaving.current = true
    // Web Animations, not CSS, so the fade still happens in calm mode (it is not movement).
    const fade = root.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: 'ease-out' })
    if (fade) fade.onfinish = () => setOpen(false)
    else setOpen(false)
  }

  // Ends by itself once the show is over.
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(finish, calm ? CALM_MS : unit * FIRST_SECONDS * 1000)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, calm, unit])

  // While it shows, the title menu behind it can't be reached by keyboard or screen reader.
  useEffect(() => {
    const behind = [...(root.current?.parentElement?.children ?? [])].filter((el) => el !== root.current)
    behind.forEach((el) => el.setAttribute('inert', ''))
    return () => behind.forEach((el) => el.removeAttribute('inert'))
  }, [open])

  // Leaving the title menu (for example through Need help?) closes it at once, and for good.
  if (open && location.pathname !== '/') setOpen(false)
  if (!open || location.pathname !== '/') return null

  return (
    <div ref={root} className="splash" style={{ '--u': `${unit}s` } as CSSProperties} data-testid="splash">
      <button type="button" className="splash-skip" onClick={finish} aria-label={t('splash.label')} />

      <div className="splash-stage" aria-hidden>
        <div className="splash-flight">
          <div className="splash-mitthu">
            <Mitthu flying className="h-full w-full" />
          </div>
          <svg className="splash-banner" viewBox="0 0 300 70">
            <path d="M150 4 L120 22 M150 4 L180 22" stroke="#6b4528" strokeWidth="1.5" fill="none" />
            <path d="M8 22 H292 L280 44 L292 66 H8 L20 44 Z" fill="#9a4b2c" stroke="#2b2118" strokeWidth="2" />
            <path d="M22 28 H278" stroke="#e8a33d" strokeWidth="1" opacity="0.7" />
            <path d="M22 60 H278" stroke="#e8a33d" strokeWidth="1" opacity="0.7" />
            <text x="150" y="52" textAnchor="middle" className="splash-banner-text">
              {t('app.name').toUpperCase()}
            </text>
          </svg>
        </div>

        <div className="splash-book">
          <div className="splash-spread">
            <TownPopUp />
          </div>
          <div className="splash-cover">
            <span className="splash-cover-title">{t('app.name').toUpperCase()}</span>
            <span className="splash-cover-rule" />
          </div>
        </div>

        <p className="splash-tagline">{t('title.tagline')}</p>
        <p className="splash-hint">{t('splash.tap')}</p>
      </div>

      <div className="splash-help">
        <HelpButton testId="splash-help-button" />
      </div>
    </div>
  )
}

const INK = '#2b2118'
const LANTERNS = [90, 190, 290, 400, 510, 610, 710]

/** The little town that pops up out of the book: hills, four buildings, trees, then lanterns. */
function TownPopUp() {
  return (
    <svg viewBox="0 0 800 500" className="h-full w-full">
      <defs>
        <radialGradient id="splash-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The pages: two halves and a soft fold down the middle. */}
      <rect width="800" height="500" fill="#f6efe2" />
      <rect x="370" width="60" height="500" fill="#e6dac4" opacity="0.6" />
      <path d="M400 0 V500" stroke="#d6c7ae" strokeWidth="2" />

      <g className="splash-pop" style={{ '--i': 0 } as CSSProperties}>
        <path d="M0 440 Q110 330 250 385 Q380 300 520 372 Q660 318 800 395 V440 Z" fill="#a9bba3" />
        <path d="M0 440 Q160 370 320 410 Q520 350 800 420 V440 Z" fill="#8fa68a" />
      </g>

      <g className="splash-pop" style={{ '--i': 1 } as CSSProperties} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        {/* School */}
        <rect x="70" y="300" width="190" height="140" fill="#e9dfcc" />
        <rect x="62" y="288" width="206" height="16" fill="#3b4a55" />
        {[90, 140, 190].map((x) => (
          <rect key={x} x={x} y="318" width="38" height="34" fill="#5d7686" />
        ))}
        <rect x="145" y="378" width="40" height="62" fill="#2f6f73" />
        {/* Dhaba */}
        <rect x="280" y="352" width="110" height="88" fill="#efd9b0" />
        <path d="M272 352 L398 352 L388 330 L282 330 Z" fill="#b5532f" />
        <path d="M300 330 V352 M320 330 V352 M340 330 V352 M360 330 V352 M380 330 V352" stroke="#f6efe2" strokeWidth="5" />
        <rect x="292" y="400" width="86" height="12" fill="#6b4528" />
      </g>

      <g className="splash-pop" style={{ '--i': 2 } as CSSProperties} stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        {/* Home */}
        <rect x="415" y="340" width="110" height="100" fill="#f1e2c8" />
        <path d="M405 342 L470 292 L535 342 Z" fill="#9a4b2c" />
        <rect x="455" y="386" width="30" height="54" fill="#6b4528" />
        <rect x="428" y="356" width="22" height="22" fill="#e8a33d" />
        <rect x="492" y="356" width="22" height="22" fill="#e8a33d" />
        {/* Panchayat */}
        <rect x="550" y="318" width="190" height="122" fill="#ead8b8" />
        <path d="M540 320 H750 L735 296 H555 Z" fill="#a9822f" />
        {[570, 610, 650, 690].map((x) => (
          <rect key={x} x={x} y="336" width="18" height="104" fill="#f6efe2" />
        ))}
        <rect x="612" y="282" width="66" height="16" fill="#2f6f73" />
      </g>

      <g className="splash-pop" style={{ '--i': 3 } as CSSProperties} stroke={INK} strokeWidth="2.5">
        <rect y="436" width="800" height="64" fill="#c9a77a" />
        <path d="M0 452 H800" stroke="#b08d60" strokeWidth="2" />
        <rect x="26" y="380" width="8" height="58" fill="#6b4528" />
        <circle cx="30" cy="368" r="30" fill="#5f7a4a" />
        <rect x="766" y="384" width="8" height="54" fill="#6b4528" />
        <circle cx="770" cy="372" r="26" fill="#5f7a4a" />
      </g>

      {/* A string of lanterns that light one after another. */}
      <path d="M30 96 Q400 190 770 96" stroke="#6b4528" strokeWidth="2" fill="none" className="splash-string" />
      {LANTERNS.map((x, i) => {
        const along = (x - 30) / 740 // where this lantern sits on the curved string, 0 to 1
        const y = 96 + 188 * along * (1 - along)
        return (
          <g key={x} className="splash-lantern" style={{ '--i': i } as CSSProperties}>
            <circle cx={x} cy={y + 22} r="34" fill="url(#splash-glow)" className="splash-lantern-glow" />
            <path d={`M${x} ${y} V${y + 8}`} stroke="#6b4528" strokeWidth="2" />
            <rect x={x - 10} y={y + 8} width="20" height="28" rx="8" stroke={INK} strokeWidth="2" className="splash-lantern-body" />
          </g>
        )
      })}
    </svg>
  )
}

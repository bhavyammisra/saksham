// Mitthu, the parrot guide: the only slightly stylised character (BUILD_PLAN §2).
// A rose-ringed parakeet in leaf greens with a warm orange beak.
// Design space 100 x 100, perched on a point at the bottom centre.

import './mitthu.css'

export function Mitthu({
  flying = false,
  facing = 'right',
  view = 'full',
  label,
  className,
}: {
  flying?: boolean
  facing?: 'left' | 'right'
  view?: 'full' | 'portrait'
  label?: string
  className?: string
}) {
  return (
    <svg
      viewBox={view === 'portrait' ? '30 8 56 56' : '0 0 100 100'}
      className={`mitthu ${className ?? ''}`}
      data-flying={flying}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={facing === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        <linearGradient id="mitthu-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fcf6a" />
          <stop offset="0.6" stopColor="#5f9e3f" />
          <stop offset="1" stopColor="#3d6f2a" />
        </linearGradient>
      </defs>
      {/* Long tail */}
      <path d="M38 70 Q22 88 10 98 Q28 90 44 76 Z" fill="#4f8a37" />
      <path d="M40 72 Q30 86 22 96 Q34 88 46 78 Z" fill="#7bb257" />
      {/* Body */}
      <ellipse cx="52" cy="58" rx="20" ry="24" fill="url(#mitthu-body)" />
      {/* Wing */}
      <g className="mitthu-wing">
        <path d="M44 50 Q34 66 42 80 Q56 74 60 56 Z" fill="#4a8434" />
        <path d="M46 58 Q42 68 46 76" stroke="#3a6a28" strokeWidth="1.2" fill="none" />
      </g>
      {/* Head */}
      <circle cx="60" cy="34" r="15" fill="url(#mitthu-body)" />
      {/* Neck ring, soft and dark (not red) */}
      <path d="M48 44 Q60 52 72 42" stroke="#2f4a2a" strokeWidth="2" fill="none" opacity="0.7" />
      {/* Beak */}
      <path d="M71 30 Q82 32 79 42 Q75 38 70 38 Z" fill="#e3893a" />
      <path d="M70 38 Q75 38 77 41 Q73 43 70 41 Z" fill="#b8652a" />
      {/* Eye */}
      <circle cx="65" cy="30" r="3.4" fill="#fdf7ea" />
      <circle cx="65.8" cy="30.2" r="2" fill="#1d150f" />
      <circle cx="66.4" cy="29.4" r="0.6" fill="#fff" />
      {/* Feet */}
      {view === 'full' && (
        <g stroke="#9a7a55" strokeWidth="2" strokeLinecap="round">
          <path d="M48 80 L46 88 M56 80 L58 88" />
        </g>
      )}
    </svg>
  )
}

import type { CSSProperties } from 'react'

const E = 'var(--zt-edge)'
const FLAGS = ['var(--zt-bubble)', 'var(--zt-sun)', 'var(--zt-sky)', 'var(--zt-mint)', 'var(--zt-tangerine)', 'var(--zt-grape)']

/*
 * Bunting geometry (shared with .bunting CSS): the string hangs in `swags` quadratic swags,
 * pinned at y = PIN px and sagging to PIN + SAG px in the middle of each swag.
 * The SVG is SAG-true vertically (viewBox height = CSS height), so flags computed from the same
 * formula sit exactly on the string at every width; CSS rotates each flag to the string's slope.
 */
const PIN = 6
const DROP = 44 // control-point drop: the curve's lowest point is PIN + DROP / 2

function Garland({ swags, perSwag, variant }: { swags: number; perSwag: number; variant: 'd' | 'm' }) {
  const W = 1200
  const step = W / swags
  const d = Array.from({ length: swags }, (_, s) => `Q${step * s + step / 2} ${PIN + DROP} ${step * (s + 1)} ${PIN}`).join(' ')
  let n = 0
  return (
    <div className={`garland garland-${variant}`} style={{ ['--n' as string]: swags } as CSSProperties}>
      <svg viewBox={`0 0 ${W} 40`} preserveAspectRatio="none">
        <path d={`M0 ${PIN} ${d}`} fill="none" stroke={E} strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: swags + 1 }, (_, s) => (
        <i key={`k${s}`} className="knot" style={{ left: `${(s / swags) * 100}%` }} />
      ))}
      {Array.from({ length: swags }, (_, s) =>
        Array.from({ length: perSwag }, (_, k) => {
          const t = (k + 0.5) / perSwag
          const i = n++
          return (
            <span key={`${s}-${k}`} style={{ ['--s' as string]: s, ['--t' as string]: t.toFixed(4), animationDelay: `${(i % 7) * -0.45}s` } as CSSProperties}>
              <svg viewBox="0 0 34 42"><path d="M2 2 H32 L17 39Z" fill={FLAGS[i % FLAGS.length]} stroke={E} strokeWidth="3" strokeLinejoin="round" /><path d="M8 8 h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".55" /></svg>
            </span>
          )
        }),
      )}
    </div>
  )
}

/** Toy-shop bunting: sagging swags of triangle flags that hang exactly on the string at any width. */
export function Bunting({ className = '' }: { className?: string }) {
  return (
    <div className={`bunting ${className}`} aria-hidden="true">
      <Garland swags={3} perSwag={7} variant="d" />
      <Garland swags={2} perSwag={4} variant="m" />
    </div>
  )
}

export function Cloud({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    // the top puff's arc rises above y=0 — the viewBox starts at -10 so its outline is never clipped
    <svg className={`cloud ${className}`} style={style} viewBox="0 -10 200 100" aria-hidden="true">
      <path d="M40 80 h120 a30 30 0 0 0 4 -59 a38 38 0 0 0 -70 -6 a30 30 0 0 0 -50 22 a22 22 0 0 0 -4 43z" fill="var(--zt-cloud, #fff)" stroke={E} strokeWidth="4" strokeLinejoin="round" />
      <path d="M60 46 q10 -8 20 0" fill="none" stroke="var(--zt-sky)" strokeWidth="4" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

/**
 * Day sun that turns into a sleepy moon in the night theme: the rays fold away, the disc fades to
 * moonlight, craters and closed eyes appear and a little "z" floats up — all CSS transitions (home.css).
 */
export function Sun({ className = '' }: { className?: string }) {
  return (
    <svg className={`sun ${className}`} viewBox="0 0 200 200" aria-hidden="true">
      <g className="sun-rays-fold">
        <g className="sun-rays">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="94" y="6" width="12" height="34" rx="6" fill="var(--zt-sun)" stroke={E} strokeWidth="3" transform={`rotate(${i * 30} 100 100)`} />
          ))}
        </g>
      </g>
      <circle className="sun-glow" cx="100" cy="100" r="66" />
      <circle className="sun-disc" cx="100" cy="100" r="52" stroke={E} strokeWidth="4" />
      <g className="moon-craters">
        <circle cx="74" cy="78" r="9" />
        <circle cx="128" cy="70" r="6" />
        <circle cx="124" cy="128" r="10" />
        <circle cx="82" cy="132" r="5" />
      </g>
      <g className="sun-face">
        <circle cx="84" cy="94" r="5" fill="#1F1A3D" />
        <circle cx="116" cy="94" r="5" fill="#1F1A3D" />
        <path d="M84 114 q16 14 32 0" fill="none" stroke={E} strokeWidth="4" strokeLinecap="round" />
      </g>
      <g className="moon-face" fill="none" stroke="#1F1A3D" strokeWidth="4" strokeLinecap="round">
        <path d="M76 96 q8 7 16 0 M108 96 q8 7 16 0" />
        <path d="M92 116 q8 6 16 0" />
      </g>
      <ellipse className="sun-cheek" cx="72" cy="112" rx="7" ry="4" fill="var(--zt-bubble)" />
      <ellipse className="sun-cheek" cx="128" cy="112" rx="7" ry="4" fill="var(--zt-bubble)" />
      <g className="moon-z" fill="var(--zt-grape)" fontFamily="FiraGO, sans-serif" fontWeight="900">
        <text x="150" y="58" fontSize="22">z</text>
        <text x="166" y="38" fontSize="28">Z</text>
      </g>
    </svg>
  )
}

/** Wavy edge between colour bands. `flip` puts the wave on the bottom edge. */
export function Wave({ color, flip = false, className = '' }: { color: string; flip?: boolean; className?: string }) {
  return (
    <svg className={`wave ${flip ? 'wave-flip' : ''} ${className}`} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 30 C120 0 240 0 360 30 S600 60 720 30 960 0 1080 30 1320 60 1440 30 V60 H0Z" fill={color} />
    </svg>
  )
}

/** Confetti sprinkles for section backgrounds — kept to the side gutters so they never sit on text. */
export function Sprinkles({ seed = 1, count = 12 }: { seed?: number; count?: number }) {
  const colors = ['var(--zt-bubble)', 'var(--zt-sun)', 'var(--zt-sky)', 'var(--zt-mint)', 'var(--zt-tangerine)', 'var(--zt-grape)']
  const items = Array.from({ length: count }, (_, i) => {
    const r = Math.abs(Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % 1
    const r2 = Math.abs(Math.sin((i + 3) * 78.233 * seed) * 12345.678) % 1
    const side = i % 2 // alternate left / right gutter
    return { left: side ? 93 + r * 6 : 1 + r * 6, top: 6 + r2 * 88, c: colors[i % colors.length], rot: Math.round(r * 180), shape: i % 3, d: (r2 * -6).toFixed(2) }
  })
  return (
    <div className="sprinkles" aria-hidden="true">
      {items.map((s, i) => (
        <i key={i} className={`sp sp-${s.shape}`} style={{ left: `${s.left}%`, top: `${s.top}%`, background: s.c, rotate: `${s.rot}deg`, animationDelay: `${s.d}s` }} />
      ))}
    </div>
  )
}

/** Twinkling four-point stars (pure decoration). */
export function Twinkles({ className = '' }: { className?: string }) {
  return (
    <div className={`twinkles ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`tw tw${i}`} viewBox="0 0 24 24"><path d="M12 1 C13 9 15 11 23 12 C15 13 13 15 12 23 C11 15 9 13 1 12 C9 11 11 9 12 1Z" fill="var(--zt-sun)" stroke={E} strokeWidth="2" strokeLinejoin="round" /></svg>
      ))}
    </div>
  )
}

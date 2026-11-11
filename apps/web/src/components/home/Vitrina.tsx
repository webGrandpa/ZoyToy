import Link from 'next/link'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import { GiraffeTall } from '@zoytoy/ui/Giraffe'
import { Cloud } from './Decor'
import type { Accent } from '../../lib/data'

type Cat = { id: number; title: string; slug: string; icon: ToyKind; color?: Accent }
const E = 'var(--zt-edge)'
const WIN_TINT: Accent[] = ['sky', 'sun', 'mint', 'bubble']

/* fronds: [rotation, mirrored, length] — one leaf shape, rotated and mirrored around the crown */
const FRONDS: [number, boolean, number][] = [
  [-62, false, 0.82], [-62, true, 0.82], [-22, false, 1], [-22, true, 1], [18, false, 0.96], [18, true, 0.96], [-92, false, 0.7],
]

/** Cartoon palm: tapered, ringed trunk with soft shading, glossy leaves and coconuts. */
function Palm() {
  return (
    <svg className="vit-palm" viewBox="0 0 280 330" aria-hidden="true">
      <defs>
        <linearGradient id="vp-trunk" x1="0" x2="1">
          <stop offset="0" stopColor="#C98C55" />
          <stop offset=".45" stopColor="#B07440" />
          <stop offset="1" stopColor="#8A5530" />
        </linearGradient>
        <linearGradient id="vp-leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6BE3A4" />
          <stop offset=".6" stopColor="#2FBF7E" />
          <stop offset="1" stopColor="#1E9A64" />
        </linearGradient>
        <radialGradient id="vp-nut" cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#A9714A" />
          <stop offset="1" stopColor="#6B4226" />
        </radialGradient>
      </defs>
      <ellipse cx="112" cy="318" rx="62" ry="9" fill="rgb(31 26 61 / .16)" />
      <g className="vit-trunk">
        <path d="M92 320 C96 250 112 168 146 92 L170 98 C140 170 126 250 128 320 Z" fill="url(#vp-trunk)" stroke={E} strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 312 C104 250 118 176 148 104" fill="none" stroke="#E2B07C" strokeWidth="5" strokeLinecap="round" opacity=".7" />
        {[296, 266, 236, 207, 180, 154, 130, 108].map((y, i) => {
          const t = i / 7
          const x1 = 94 + t * 52
          const x2 = 127 + t * 40
          return <path key={y} d={`M${x1.toFixed(1)} ${y} Q${((x1 + x2) / 2).toFixed(1)} ${y + 7} ${x2.toFixed(1)} ${y - 2}`} fill="none" stroke="#7A4A28" strokeWidth="3" strokeLinecap="round" opacity=".75" />
        })}
      </g>
      <g className="vit-fronds">
        {FRONDS.map(([r, mirror, k], i) => (
          <g key={i} transform={`translate(158 88) rotate(${r}) scale(${mirror ? -k : k} ${k})`}>
            <path d="M0 -2 C36 -36 92 -34 126 10 C110 0 96 -2 84 2 C62 -6 34 -4 0 10 Z" fill="url(#vp-leaf)" stroke={E} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M6 2 C40 -16 86 -18 118 6" fill="none" stroke="#A6F2C9" strokeWidth="3" strokeLinecap="round" opacity=".9" />
            {[30, 54, 78, 100].map((x) => (
              <path key={x} d={`M${x} ${-14 + Math.abs(x - 60) / 6} l7 ${10 - Math.abs(x - 60) / 10}`} fill="none" stroke="#1E9A64" strokeWidth="2.5" strokeLinecap="round" />
            ))}
          </g>
        ))}
        <circle cx="148" cy="100" r="11" fill="url(#vp-nut)" stroke={E} strokeWidth="3.5" />
        <circle cx="166" cy="104" r="10" fill="url(#vp-nut)" stroke={E} strokeWidth="3.5" />
        <circle cx="157" cy="114" r="10" fill="url(#vp-nut)" stroke={E} strokeWidth="3.5" />
        <circle cx="144" cy="96" r="3" fill="#fff" opacity=".7" />
        <circle cx="162" cy="100" r="2.6" fill="#fff" opacity=".7" />
      </g>
    </svg>
  )
}

/**
 * The Batumi shop as an illustrated storefront (docs/05 §11.2): each window is a category link.
 * Built from HTML + small SVG pieces so the window labels stay real, readable text on any screen.
 */
export function Vitrina({ locale, sign, cats }: { locale: string; sign: string; cats: Cat[] }) {
  const wins = cats.slice(0, 4)
  return (
    <div className="vit">
      <span className="vit-sun" aria-hidden="true" />
      <Cloud className="vit-cloud k1" />
      <Cloud className="vit-cloud k2" />
      <Palm />
      <div className="vit-shop">
        <div className="vit-sign"><span>{sign}</span></div>
        {/* Zoy stands behind the shop and looks over the roof — the long neck always stays hidden behind the building */}
        <GiraffeTall className="vit-zoy" />
        <div className="vit-roof" aria-hidden="true" />
        <div className="vit-awning" aria-hidden="true" />
        <div className="vit-wins">
          {wins.map((c, i) => (
            <Link key={c.id} href={`/${locale}/shop?c=${c.slug}`} className={`vit-win tint-${WIN_TINT[i % WIN_TINT.length]}`}>
              <span className="vit-glass" aria-hidden="true">
                <ToyArt kind={c.icon} className="vit-toy" />
              </span>
              <span className="vit-sill" aria-hidden="true" />
              <b>{c.title}</b>
            </Link>
          ))}
        </div>
      </div>
      <div className="vit-ground" aria-hidden="true">
        <span className="vit-sand">
          <svg className="vit-star" viewBox="0 0 40 40"><path d="M20 3 L25 15 L38 16 L28 25 L31 38 L20 31 L9 38 L12 25 L2 16 L15 15 Z" fill="#FF8A5C" stroke={E} strokeWidth="3" strokeLinejoin="round" /><circle cx="20" cy="21" r="2" fill="#fff" opacity=".8" /></svg>
          <svg className="vit-shell" viewBox="0 0 40 32"><path d="M20 30 L4 12 C8 2 32 2 36 12 Z" fill="#FFD1E0" stroke={E} strokeWidth="3" strokeLinejoin="round" /><path d="M20 30 L12 8 M20 30 L20 5 M20 30 L28 8" stroke="#FF8FB5" strokeWidth="2.5" strokeLinecap="round" /></svg>
        </span>
        <span className="vit-sea">
          <span className="sea-back" />
          <svg className="vit-boat" viewBox="0 0 64 56"><path d="M30 6 L30 38 L8 38 Z" fill="#fff" stroke={E} strokeWidth="3" strokeLinejoin="round" /><path d="M34 12 L34 38 L52 38 Z" fill="var(--zt-bubble)" stroke={E} strokeWidth="3" strokeLinejoin="round" /><path d="M4 40 H60 L52 52 H12 Z" fill="var(--zt-grape)" stroke={E} strokeWidth="3" strokeLinejoin="round" /></svg>
          <span className="sea-front" />
          <i className="sea-spark s1" /><i className="sea-spark s2" /><i className="sea-spark s3" />
        </span>
      </div>
    </div>
  )
}

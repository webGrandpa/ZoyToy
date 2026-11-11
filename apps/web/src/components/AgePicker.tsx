'use client'

import Link from 'next/link'
import { useState } from 'react'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { useI18n, useShop } from './Providers'

const NECK = [0.3, 0.55, 0.8, 1.05, 1.3]
const SIZE = [0.62, 0.72, 0.82, 0.92, 1]

/** Zoy grows as the age slider moves (docs/05 §11.3). */
export function AgePicker({ counts }: { counts: number[] }) {
  const { locale, m, f } = useI18n()
  const { blip } = useShop()
  const [v, setV] = useState(2)
  return (
    <div className="age zt-sticker">
      <div className="age-stage" aria-hidden="true">
        <svg viewBox="0 0 140 180">
          <g className="age-root" style={{ transform: `scale(${SIZE[v]})` }}>
            <ellipse cx="70" cy="174" rx="36" ry="5" fill="var(--zt-edge)" opacity=".15" />
            <rect x="48" y="146" width="10" height="26" rx="5" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="3" />
            <rect x="82" y="146" width="10" height="26" rx="5" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="3" />
            <ellipse cx="70" cy="146" rx="32" ry="17" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="3.5" />
            <circle cx="58" cy="142" r="4" fill="var(--zt-tangerine)" />
            <circle cx="80" cy="148" r="5" fill="var(--zt-tangerine)" />
            <g className="age-neck" style={{ transform: `scaleY(${NECK[v]})` }}>
              <rect x="60" y="72" width="20" height="70" rx="9" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="3.5" />
              <circle cx="67" cy="94" r="3.5" fill="var(--zt-tangerine)" />
              <circle cx="73" cy="118" r="4" fill="var(--zt-tangerine)" />
            </g>
            <g className="age-head" style={{ transform: `translateY(${((1 - NECK[v]) * 70).toFixed(1)}px)` }}>
              <GiraffeHead x={36} y={22} width={68} height={68} />
            </g>
          </g>
        </svg>
      </div>
      <div className="age-ctl">
        <label htmlFor="age-range" className="age-label">{m.age.groups[v]}</label>
        <input
          id="age-range"
          type="range"
          min={0}
          max={4}
          step={1}
          value={v}
          onChange={(e) => {
            setV(Number(e.target.value))
            blip(400 + 120 * Number(e.target.value), 0.05)
          }}
          aria-valuetext={m.age.groups[v]}
        />
        <div className="age-ticks" aria-hidden="true">
          {m.age.groups.map((g) => (
            <span key={g}>{g.split(' ')[0]}</span>
          ))}
        </div>
        <Link className="zt-btn" href={`/${locale}/shop?age=${v}`}>
          {f(m.age.show, { n: counts[v] ?? 0 })}
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import type { Season } from '../lib/season'
import { useShop } from './Providers'

const E = 'var(--zt-edge)'
const INK = '#1F1A3D'
const RED = '#E63946'
const EYES: [number, number][] = [[96, 52], [124, 52]]

/**
 * Zoy the giraffe living in a toy box (docs/05 §2, §11.1).
 * Follows the pointer, dives and pops out on tap, falls asleep when the visitor is idle,
 * wears a seasonal outfit chosen in the admin.
 */
export function Mascot({ season, label, hint }: { season: Season; label: string; hint: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const pupils = useRef<(SVGCircleElement | null)[]>([])
  const [party, setParty] = useState(false)
  const partyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [sleeping, setSleeping] = useState(false)
  const { blip } = useShop()

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMove = (e: PointerEvent) => {
      if (reduce.matches || !ref.current) return
      const r = ref.current.getBoundingClientRect()
      if (!r.width) return
      const s = r.width / 220
      EYES.forEach(([cx, cy], i) => {
        const el = pupils.current[i]
        if (!el) return
        const dx = e.clientX - (r.left + cx * s)
        const dy = e.clientY - (r.top + cy * s)
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(5, d / 40)
        el.setAttribute('cx', (cx + (dx / d) * k).toFixed(1))
        el.setAttribute('cy', (cy + (dy / d) * k).toFixed(1))
      })
    }
    let idle: ReturnType<typeof setTimeout>
    const wake = () => {
      setSleeping(false)
      clearTimeout(idle)
      idle = setTimeout(() => setSleeping(true), 20000)
    }
    const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'] as const
    window.addEventListener('pointermove', onMove, { passive: true })
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }))
    wake()
    return () => {
      window.removeEventListener('pointermove', onMove)
      events.forEach((ev) => window.removeEventListener(ev, wake))
      clearTimeout(idle)
    }
  }, [])

  const onTap = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setParty(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setParty(true)))
    clearTimeout(partyTimer.current)
    partyTimer.current = setTimeout(() => setParty(false), 1900)
    blip(300, 0.12)
    setTimeout(() => blip(1040, 0.16), 260)
  }

  const ny = season === 'ny'
  const summer = season === 'summer'
  const june = season === 'june1'
  const school = season === 'school'

  return (
    <button ref={ref} type="button" className={`mascot${sleeping ? ' sleep' : ''}${party ? ' party' : ''}`} aria-label={label} onClick={onTap}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <ellipse cx="110" cy="206" rx="70" ry="9" fill={E} opacity=".18" />
        <g className="balloons">
          <path d="M168 126 C176 100 160 80 172 52 M168 126 C182 104 196 92 196 70 M168 126 C162 98 146 84 150 60" fill="none" stroke={E} strokeWidth="2" />
          <ellipse cx="172" cy="40" rx="13" ry="15" fill="var(--zt-bubble)" stroke={E} strokeWidth="3.5" />
          <ellipse cx="197" cy="58" rx="12" ry="14" fill="var(--zt-sky)" stroke={E} strokeWidth="3.5" />
          <ellipse cx="149" cy="50" rx="11" ry="13" fill="var(--zt-mint)" stroke={E} strokeWidth="3.5" />
          {june && <ellipse cx="128" cy="66" rx="10" ry="12" fill="var(--zt-sun)" stroke={E} strokeWidth="3.5" />}
          <path d="M167 33 q3 -4 7 -3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className="pop p1"><circle cx="58" cy="108" r="14" fill="var(--zt-bubble)" stroke={E} strokeWidth="4" /><path d="M45 104 q13 9 26 0" fill="none" stroke={E} strokeWidth="3" /></g>
        <g className="pop p2"><rect x="140" y="92" width="26" height="26" rx="6" fill="var(--zt-mint)" stroke={E} strokeWidth="4" transform="rotate(10 153 105)" /><text x="153" y="112" textAnchor="middle" fontFamily="FiraGO, sans-serif" fontWeight="900" fontSize="17" fill={INK} transform="rotate(10 153 105)">ა</text></g>
        <g className="pop p3"><path d="M40 70 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" fill="var(--zt-sun)" stroke={E} strokeWidth="3.5" strokeLinejoin="round" /></g>
        <g className="giraffe">
          <rect x="94" y="78" width="32" height="70" rx="14" fill="var(--zt-sun)" stroke={E} strokeWidth="5" />
          <circle cx="104" cy="96" r="5" fill="var(--zt-tangerine)" />
          <circle cx="117" cy="110" r="6" fill="var(--zt-tangerine)" />
          <circle cx="103" cy="124" r="4.5" fill="var(--zt-tangerine)" />
          {ny && (
            <g>
              <rect x="88" y="86" width="44" height="14" rx="7" fill={RED} stroke={E} strokeWidth="3.5" />
              <rect x="114" y="94" width="13" height="32" rx="5" fill={RED} stroke={E} strokeWidth="3.5" />
              <path d="M98 87 v12 M108 87 v12 M117 108 h8 M117 116 h8" stroke="#fff" strokeWidth="3" />
            </g>
          )}
          <g className="head">
            <path d="M96 36 L91 16 M124 36 L129 16" stroke={E} strokeWidth="5" strokeLinecap="round" />
            <circle cx="91" cy="15" r="6" fill="var(--zt-tangerine)" stroke={E} strokeWidth="3.5" />
            <circle cx="129" cy="15" r="6" fill="var(--zt-tangerine)" stroke={E} strokeWidth="3.5" />
            <ellipse cx="70" cy="46" rx="14" ry="7.5" fill="var(--zt-sun)" stroke={E} strokeWidth="4" transform="rotate(-22 70 46)" />
            <ellipse cx="150" cy="46" rx="14" ry="7.5" fill="var(--zt-sun)" stroke={E} strokeWidth="4" transform="rotate(22 150 46)" />
            <ellipse cx="110" cy="58" rx="36" ry="31" fill="var(--zt-sun)" stroke={E} strokeWidth="5" />
            <circle cx="86" cy="42" r="6" fill="var(--zt-tangerine)" />
            <circle cx="134" cy="40" r="4.5" fill="var(--zt-tangerine)" />
            <circle cx="128" cy="30" r="3" fill="var(--zt-tangerine)" />
            <ellipse cx="110" cy="76" rx="25" ry="15" fill="var(--zt-muzzle)" stroke={E} strokeWidth="4" />
            <circle cx="102" cy="72" r="2.6" fill={INK} />
            <circle cx="118" cy="72" r="2.6" fill={INK} />
            <path d="M101 81 q9 7 18 0" fill="none" stroke={E} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="96" cy="52" r="11" fill="#fff" stroke={E} strokeWidth="3.5" />
            <circle cx="124" cy="52" r="11" fill="#fff" stroke={E} strokeWidth="3.5" />
            <circle ref={(el) => { pupils.current[0] = el }} className="pupil" cx="96" cy="52" r="5" fill={INK} />
            <circle ref={(el) => { pupils.current[1] = el }} className="pupil" cx="124" cy="52" r="5" fill={INK} />
            <ellipse cx="80" cy="66" rx="6" ry="4" fill="var(--zt-bubble)" opacity=".8" />
            <ellipse cx="140" cy="66" rx="6" ry="4" fill="var(--zt-bubble)" opacity=".8" />
            <g className="lids">
              <circle cx="96" cy="52" r="11" fill="var(--zt-sun)" stroke={E} strokeWidth="3.5" />
              <circle cx="124" cy="52" r="11" fill="var(--zt-sun)" stroke={E} strokeWidth="3.5" />
              <path d="M88 54 q8 6 16 0 M116 54 q8 6 16 0" fill="none" stroke={E} strokeWidth="3" strokeLinecap="round" />
            </g>
            {summer && (
              <g>
                <rect x="81" y="42" width="29" height="19" rx="8" fill={INK} />
                <rect x="110" y="42" width="29" height="19" rx="8" fill={INK} />
                <path d="M106 49 h8" stroke={INK} strokeWidth="4" />
                <path d="M86 48 l7 -2 M115 48 l7 -2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".85" />
              </g>
            )}
            {ny && (
              <g>
                <path d="M80 32 C86 6 118 -4 136 6 C130 14 136 24 140 30 Z" fill={RED} stroke={E} strokeWidth="4" strokeLinejoin="round" />
                <rect x="76" y="25" width="68" height="13" rx="6.5" fill="#fff" stroke={E} strokeWidth="3.5" />
                <circle cx="138" cy="6" r="7" fill="#fff" stroke={E} strokeWidth="3.5" />
              </g>
            )}
            {(june || school) && (
              <g>
                <path d="M92 30 L110 0 L128 30 Z" fill={june ? 'var(--zt-bubble)' : 'var(--zt-grape)'} stroke={E} strokeWidth="4" strokeLinejoin="round" />
                <circle cx="110" cy="0" r="5" fill="var(--zt-sun)" stroke={E} strokeWidth="3" />
              </g>
            )}
          </g>
        </g>
        <g className="zzz">
          <text x="150" y="34" fontFamily="FiraGO, sans-serif" fontWeight="900" fontSize="18" fill="var(--zt-grape)">z</text>
          <text x="164" y="20" fontFamily="FiraGO, sans-serif" fontWeight="900" fontSize="24" fill="var(--zt-grape)">Z</text>
        </g>
        <rect x="44" y="132" width="132" height="66" rx="18" fill="var(--zt-grape)" stroke={E} strokeWidth="5" />
        <rect x="36" y="122" width="148" height="20" rx="10" fill="var(--zt-grape-deep)" stroke={E} strokeWidth="5" />
        <path d="M62 160 h20 a5 5 0 1 1 8 0 h20 v12 a5 5 0 1 0 0 8 v12 h-48z" fill="var(--zt-sun)" stroke={E} strokeWidth="3.5" strokeLinejoin="round" />
        <text x="148" y="178" textAnchor="middle" fontFamily="FiraGO, sans-serif" fontWeight="900" fontSize="20" fill="#fff" stroke={E} strokeWidth="1">ZOY</text>
      </svg>
      <span className="mascot-hint">{hint}</span>
    </button>
  )
}

// React in scope: the seed script renders these with the classic JSX runtime
import React, { type SVGProps } from 'react'

const E = 'var(--zt-edge)'
const INK = '#1F1A3D'

/** Zoy's head — logo mark, avatars, stickers. Original drawing (docs/05 §2). */
export function GiraffeHead(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="50 2 120 120" aria-hidden="true" {...props}>
      <path d="M96 36 L91 16 M124 36 L129 16" stroke={E} strokeWidth={5} strokeLinecap="round" />
      <circle cx="91" cy="15" r="6" fill="var(--zt-tangerine)" stroke={E} strokeWidth={3.5} />
      <circle cx="129" cy="15" r="6" fill="var(--zt-tangerine)" stroke={E} strokeWidth={3.5} />
      <ellipse cx="70" cy="46" rx="14" ry="7.5" fill="var(--zt-sun)" stroke={E} strokeWidth={4} transform="rotate(-22 70 46)" />
      <ellipse cx="150" cy="46" rx="14" ry="7.5" fill="var(--zt-sun)" stroke={E} strokeWidth={4} transform="rotate(22 150 46)" />
      <rect x="94" y="80" width="32" height="40" rx="12" fill="var(--zt-sun)" stroke={E} strokeWidth={5} />
      <ellipse cx="110" cy="58" rx="36" ry="31" fill="var(--zt-sun)" stroke={E} strokeWidth={5} />
      <circle cx="86" cy="42" r="6" fill="var(--zt-tangerine)" />
      <circle cx="134" cy="40" r="4.5" fill="var(--zt-tangerine)" />
      <ellipse cx="110" cy="76" rx="25" ry="15" fill="var(--zt-muzzle)" stroke={E} strokeWidth={4} />
      <circle cx="102" cy="72" r="2.6" fill={INK} />
      <circle cx="118" cy="72" r="2.6" fill={INK} />
      <path d="M101 81 q9 7 18 0" fill="none" stroke={E} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="96" cy="52" r="11" fill="#fff" stroke={E} strokeWidth={3.5} />
      <circle cx="124" cy="52" r="11" fill="#fff" stroke={E} strokeWidth={3.5} />
      <circle cx="98" cy="50" r="5" fill={INK} />
      <circle cx="126" cy="50" r="5" fill={INK} />
    </svg>
  )
}

/**
 * Zoy with a long neck — for peeking over walls and roofs. The neck runs far below the head,
 * so whatever covers the lower part always hides it: no cut-off neck is ever visible.
 */
export function GiraffeTall(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="50 2 120 330" aria-hidden="true" {...props}>
      <rect x="94" y="72" width="32" height="270" rx="12" fill="var(--zt-sun)" stroke={E} strokeWidth={5} />
      <circle cx="104" cy="118" r="6" fill="var(--zt-tangerine)" />
      <circle cx="117" cy="146" r="7" fill="var(--zt-tangerine)" />
      <circle cx="103" cy="178" r="5" fill="var(--zt-tangerine)" />
      <circle cx="116" cy="212" r="6.5" fill="var(--zt-tangerine)" />
      <circle cx="104" cy="248" r="5.5" fill="var(--zt-tangerine)" />
      <circle cx="117" cy="286" r="6" fill="var(--zt-tangerine)" />
      <path d="M96 36 L91 16 M124 36 L129 16" stroke={E} strokeWidth={5} strokeLinecap="round" />
      <circle cx="91" cy="15" r="6" fill="var(--zt-tangerine)" stroke={E} strokeWidth={3.5} />
      <circle cx="129" cy="15" r="6" fill="var(--zt-tangerine)" stroke={E} strokeWidth={3.5} />
      <ellipse cx="70" cy="46" rx="14" ry="7.5" fill="var(--zt-sun)" stroke={E} strokeWidth={4} transform="rotate(-22 70 46)" />
      <ellipse cx="150" cy="46" rx="14" ry="7.5" fill="var(--zt-sun)" stroke={E} strokeWidth={4} transform="rotate(22 150 46)" />
      <ellipse cx="110" cy="58" rx="36" ry="31" fill="var(--zt-sun)" stroke={E} strokeWidth={5} />
      <circle cx="86" cy="42" r="6" fill="var(--zt-tangerine)" />
      <circle cx="134" cy="40" r="4.5" fill="var(--zt-tangerine)" />
      <ellipse cx="110" cy="76" rx="25" ry="15" fill="var(--zt-muzzle)" stroke={E} strokeWidth={4} />
      <circle cx="102" cy="72" r="2.6" fill={INK} />
      <circle cx="118" cy="72" r="2.6" fill={INK} />
      <path d="M101 81 q9 7 18 0" fill="none" stroke={E} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="96" cy="52" r="11" fill="#fff" stroke={E} strokeWidth={3.5} />
      <circle cx="124" cy="52" r="11" fill="#fff" stroke={E} strokeWidth={3.5} />
      <circle className="zoy-pupil" cx="98" cy="50" r="5" fill={INK} />
      <circle className="zoy-pupil" cx="126" cy="50" r="5" fill={INK} />
      <ellipse cx="80" cy="66" rx="6" ry="4" fill="var(--zt-bubble)" opacity=".8" />
      <ellipse cx="140" cy="66" rx="6" ry="4" fill="var(--zt-bubble)" opacity=".8" />
    </svg>
  )
}


// React in scope: the seed script renders these with the classic JSX runtime
import React, { type SVGProps } from 'react'

/** Original toy illustrations (no franchise characters). Used for categories, placeholders and games. */
export type ToyKind = 'rocket' | 'teddy' | 'blocks' | 'car' | 'duck' | 'ball' | 'train' | 'puzzle'
export const TOY_KINDS: ToyKind[] = ['rocket', 'teddy', 'blocks', 'car', 'duck', 'ball', 'train', 'puzzle']

const E = 'var(--zt-edge)'
const INK = '#1F1A3D'

export function ToyArt({ kind, ...props }: { kind: ToyKind } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" {...props}>
      {kind === 'rocket' && (
        <g strokeLinejoin="round">
          <path d="M50 92 Q60 116 70 92Z" fill="var(--zt-tangerine)" stroke={E} strokeWidth={4} />
          <path d="M42 70 L26 94 L46 90Z" fill="var(--zt-bubble)" stroke={E} strokeWidth={4} />
          <path d="M78 70 L94 94 L74 90Z" fill="var(--zt-bubble)" stroke={E} strokeWidth={4} />
          <path d="M60 10 C82 28 86 62 78 92 L42 92 C34 62 38 28 60 10Z" fill="#fff" stroke={E} strokeWidth={4} />
          <path d="M48 26 Q60 16 72 26" fill="none" stroke="var(--zt-bubble)" strokeWidth={6} strokeLinecap="round" />
          <circle cx="60" cy="52" r="11" fill="var(--zt-sky)" stroke={E} strokeWidth={4} />
          <circle cx="56" cy="48" r="3" fill="#fff" />
          <rect x="46" y="76" width="28" height="7" rx="3.5" fill="var(--zt-grape)" stroke={E} strokeWidth={3} />
        </g>
      )}
      {kind === 'teddy' && (
        <g>
          <circle cx="34" cy="30" r="14" fill="#C98A5A" stroke={E} strokeWidth={4} />
          <circle cx="86" cy="30" r="14" fill="#C98A5A" stroke={E} strokeWidth={4} />
          <circle cx="34" cy="30" r="6" fill="#F2C9A0" />
          <circle cx="86" cy="30" r="6" fill="#F2C9A0" />
          <ellipse cx="60" cy="96" rx="30" ry="20" fill="#C98A5A" stroke={E} strokeWidth={4} />
          <circle cx="60" cy="56" r="32" fill="#C98A5A" stroke={E} strokeWidth={4} />
          <ellipse cx="60" cy="68" rx="15" ry="11" fill="#F2C9A0" stroke={E} strokeWidth={3} />
          <circle cx="48" cy="50" r="4.5" fill={INK} />
          <circle cx="72" cy="50" r="4.5" fill={INK} />
          <path d="M56 63 h8 l-4 5z" fill={INK} />
          <path d="M44 86 l16 6 16 -6 -6 10 6 8 -16 -4 -16 4 6 -8z" fill="var(--zt-sky)" stroke={E} strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
      {kind === 'blocks' && (
        <g fontFamily="FiraGO, 'Noto Sans Georgian', sans-serif" fontWeight={900} fontSize={28} textAnchor="middle" fill={INK}>
          <rect x="14" y="62" width="44" height="44" rx="8" fill="var(--zt-sun)" stroke={E} strokeWidth={4} />
          <rect x="62" y="62" width="44" height="44" rx="8" fill="var(--zt-bubble)" stroke={E} strokeWidth={4} />
          <rect x="38" y="16" width="44" height="44" rx="8" fill="var(--zt-sky)" stroke={E} strokeWidth={4} transform="rotate(-8 60 38)" />
          <text x="36" y="94">ა</text>
          <text x="84" y="94">ბ</text>
          <text x="60" y="48" transform="rotate(-8 60 38)">გ</text>
        </g>
      )}
      {kind === 'car' && (
        <g strokeLinejoin="round">
          <path d="M14 80 q0 -14 14 -16 l14 -18 q4 -5 10 -5 h22 q7 0 11 6 l11 17 q16 2 16 16 v6 q0 4 -4 4 h-90 q-4 0 -4 -4z" fill="#EF4444" stroke={E} strokeWidth={4} />
          <path d="M46 62 l9 -13 q2 -3 6 -3 h7 v16z M74 46 h4 q4 0 6 3 l8 13 h-18z" fill="var(--zt-sky)" stroke={E} strokeWidth={3} />
          <circle cx="36" cy="90" r="12" fill={INK} stroke={E} strokeWidth={3} />
          <circle cx="36" cy="90" r="5" fill="#fff" />
          <circle cx="88" cy="90" r="12" fill={INK} stroke={E} strokeWidth={3} />
          <circle cx="88" cy="90" r="5" fill="#fff" />
          <circle cx="62" cy="74" r="7" fill="#fff" stroke={E} strokeWidth={2.5} />
          <text x="62" y="78.5" textAnchor="middle" fontFamily="FiraGO, sans-serif" fontWeight={900} fontSize={11} fill={INK}>7</text>
        </g>
      )}
      {kind === 'duck' && (
        <g strokeLinejoin="round">
          <path d="M94 68 l14 -12 l-2 18z" fill="var(--zt-sun)" stroke={E} strokeWidth={4} />
          <ellipse cx="64" cy="80" rx="38" ry="22" fill="var(--zt-sun)" stroke={E} strokeWidth={4} />
          <path d="M58 76 q16 -6 26 6 q-14 8 -26 -6z" fill="#FFB020" stroke={E} strokeWidth={3} />
          <circle cx="44" cy="46" r="20" fill="var(--zt-sun)" stroke={E} strokeWidth={4} />
          <path d="M26 48 l-16 4 l16 7z" fill="var(--zt-tangerine)" stroke={E} strokeWidth={3} />
          <circle cx="40" cy="41" r="3.5" fill={INK} />
          <circle cx="39" cy="40" r="1.1" fill="#fff" />
        </g>
      )}
      {kind === 'ball' && (
        <g>
          <circle cx="60" cy="62" r="42" fill="var(--zt-bubble)" stroke={E} strokeWidth={4} />
          <path d="M18 62 q42 22 84 0" fill="none" stroke={E} strokeWidth={4} />
          <path d="M60 20 q-20 42 0 84" fill="none" stroke="var(--zt-sun)" strokeWidth={8} />
          <path d="M40 34 q8 -8 18 -10" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
        </g>
      )}
      {kind === 'train' && (
        <g strokeLinejoin="round">
          <rect x="16" y="48" width="58" height="40" rx="8" fill="var(--zt-mint)" stroke={E} strokeWidth={4} />
          <rect x="24" y="30" width="30" height="22" rx="5" fill="var(--zt-grape)" stroke={E} strokeWidth={4} />
          <rect x="74" y="58" width="32" height="30" rx="6" fill="var(--zt-sun)" stroke={E} strokeWidth={4} />
          <rect x="84" y="40" width="10" height="18" rx="3" fill={INK} />
          <rect x="30" y="58" width="16" height="14" rx="3" fill="var(--zt-sky)" stroke={E} strokeWidth={3} />
          {[32, 62, 92].map((x) => (
            <g key={x}>
              <circle cx={x} cy="94" r="10" fill={INK} stroke={E} strokeWidth={3} />
              <circle cx={x} cy="94" r="4" fill="#fff" />
            </g>
          ))}
        </g>
      )}
      {kind === 'puzzle' && (
        <g strokeLinejoin="round">
          <path d="M20 30 h28 a9 9 0 1 1 16 0 h26 v26 a9 9 0 1 0 0 16 v28 h-70z" fill="var(--zt-sun)" stroke={E} strokeWidth={4} />
          <path d="M44 56 h20 v20 h-20z" fill="var(--zt-bubble)" stroke={E} strokeWidth={3} transform="rotate(12 54 66)" />
        </g>
      )}
    </svg>
  )
}

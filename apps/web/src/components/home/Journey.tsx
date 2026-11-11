import type { Messages } from '../../i18n'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { IconCheck } from '../Icons'

const E = 'var(--zt-edge)'
/* Three equal hops whose landing points sit exactly over the four step columns (12.5 / 37.5 / 62.5 / 87.5 %). */
const ROUTE = 'M125 134 C210 16 290 16 375 134 C460 16 540 16 625 134 C710 16 790 16 875 134'
const PINS = [125, 375, 625, 875]

/** A toy's journey USA/Europe → Batumi → checked → your home; the little plane really flies the dashed route. */
export function Journey({ m }: { m: Messages }) {
  const icons = [
    <svg key="0" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18" fill="var(--zt-sky)" stroke={E} strokeWidth="3" /><path d="M10 20 q8 -6 14 2 t14 0 M12 32 q6 4 12 -2 t12 2" fill="none" stroke="var(--zt-mint)" strokeWidth="5" strokeLinecap="round" /></svg>,
    <svg key="1" viewBox="0 0 48 48"><path d="M6 38 q6 -6 12 0 t12 0 t12 0" fill="none" stroke="var(--zt-sky)" strokeWidth="5" strokeLinecap="round" /><path d="M16 34 v-20 l8 -6 l8 6 v20" fill="var(--zt-sun)" stroke={E} strokeWidth="3" strokeLinejoin="round" /><rect x="21" y="22" width="6" height="12" fill={E} /></svg>,
    <span key="2" className="j-check"><IconCheck /></span>,
    <svg key="3" viewBox="0 0 48 48"><path d="M8 24 L24 10 L40 24 V40 H8Z" fill="var(--zt-bubble)" stroke={E} strokeWidth="3" strokeLinejoin="round" /><rect x="19" y="27" width="10" height="13" fill="var(--zt-surface)" stroke={E} strokeWidth="3" /></svg>,
  ]
  return (
    <div className="journey">
      <svg className="j-route" viewBox="0 0 1000 140" aria-hidden="true">
        <path id="j-route-path" d={ROUTE} fill="none" stroke={E} strokeWidth="4" strokeDasharray="10 12" strokeLinecap="round" />
        {PINS.map((x) => (
          <g key={x} className="j-pin">
            <circle cx={x} cy="134" r="11" fill="var(--zt-sun)" stroke={E} strokeWidth="4" />
            <circle cx={x} cy="134" r="4" fill={E} />
          </g>
        ))}
        <g className="j-plane">
          <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" calcMode="spline" keyPoints="0;0.3333;0.6667;1" keyTimes="0;0.3333;0.6667;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1">
            <mpath href="#j-route-path" />
          </animateMotion>
          <g className="j-plane-body">
            <path d="M-28 -5 L-36 -24 L-24 -24 L-14 -9Z" fill="var(--zt-bubble)" stroke={E} strokeWidth="3" strokeLinejoin="round" />
            <path d="M-32 0 C-32 -8 -25 -10 -16 -10 L18 -10 C30 -10 36 -5 36 0 C36 6 30 9 18 9 L-16 9 C-25 9 -32 8 -32 0Z" fill="#fff" stroke={E} strokeWidth="3" />
            <circle cx="0" cy="-2" r="2.6" fill="var(--zt-sky)" />
            <circle cx="9" cy="-2" r="2.6" fill="var(--zt-sky)" />
            <circle cx="18" cy="-2" r="2.6" fill="var(--zt-sky)" />
            <path d="M-8 3 L8 3 L-1 18 L-12 18Z" fill="var(--zt-grape)" stroke={E} strokeWidth="3" strokeLinejoin="round" />
            <ellipse cx="39" cy="0" rx="2.5" ry="11" fill="var(--zt-ink-soft)">
              <animate attributeName="ry" values="11;2;11" dur="0.24s" repeatCount="indefinite" />
            </ellipse>
          </g>
        </g>
      </svg>
      <ol className="j-steps">
        {m.journey.steps.map((s, i) => (
          <li key={s.t} className="j-step" style={{ ['--i' as string]: i }}>
            <span className="j-icon">{icons[i]}</span>
            <b>{s.t}</b>
            <p>{s.d}</p>
            {i === m.journey.steps.length - 1 ? <GiraffeHead className="j-zoy" /> : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

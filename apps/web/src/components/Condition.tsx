import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import type { Messages } from '../i18n'
import type { Condition as C } from '../lib/data'

export const CONDITION_ORDER: C[] = ['new', 'new_open_box', 'like_new', 'very_good', 'good', 'fair']

export function ConditionBadge({ condition, m }: { condition: C; m: Messages }) {
  const hint = m.condition[`hint_${condition}` as keyof Messages['condition']] as string
  return (
    <span className={`zt-badge zt-badge--c-${condition}`} title={hint}>
      {m.condition[condition]}
    </span>
  )
}

/** Six-step bar with Zoy marking the current level (docs/05 §11.4). */
export function ConditionScale({ condition, m }: { condition: C; m: Messages }) {
  const level = CONDITION_ORDER.indexOf(condition)
  return (
    <div className="cscale-wrap">
      <div className="cscale" role="img" aria-label={`${m.condition.title}: ${m.condition[condition]} (${level + 1}/6)`}>
        {CONDITION_ORDER.map((c, i) => (
          <i key={c} className={i <= level ? 'on' : undefined} />
        ))}
        <GiraffeHead className="paw" style={{ left: `calc(${level + 0.5} / 6 * 100%)` }} />
      </div>
      <div className="cscale-labels">
        <span>{m.condition.scaleFrom}</span>
        <span>{m.condition.scaleTo}</span>
      </div>
    </div>
  )
}

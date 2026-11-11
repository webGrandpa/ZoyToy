import Link from 'next/link'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import type { Messages } from '../../i18n'
import { money } from '../../i18n/format'
import type { CardVM } from '../../lib/data'
import { ConditionBadge } from '../Condition'

/** "Find of the week": the item with the biggest saving, on a spinning sunburst. */
export function Spotlight({ locale, m, p }: { locale: string; m: Messages; p: CardVM }) {
  const save = p.retailPriceNew && p.retailPriceNew > p.price ? p.retailPriceNew - p.price : null
  return (
    <div className={`spot tint-${p.color}`}>
      <div className="spot-art">
        <div className="sunburst" aria-hidden="true" />
        {p.image ? <img src={p.image.src} srcSet={p.image.srcSet} sizes="(max-width: 860px) 80vw, 480px" alt={p.image.alt || p.title} loading="lazy" decoding="async" /> : <ToyArt kind={p.art} />}
        <div className="spot-tag" aria-hidden="true">
          <span>{money(p.price)}</span>
        </div>
      </div>
      <div className="spot-copy">
        <p className="eyebrow">{m.spotlight.eyebrow}</p>
        <h2>{p.title}</h2>
        <div className="spot-meta">
          <ConditionBadge condition={p.condition} m={m} />
          {p.origin ? <span className="zt-badge">{m.origin[p.origin]}</span> : null}
        </div>
        {save ? (
          <p className="spot-save">
            <span>{m.spotlight.save}</span>
            <b>{money(save)}</b>
          </p>
        ) : null}
        <Link className="zt-btn" href={`/${locale}/p/${p.slug}`}>{m.spotlight.cta}</Link>
      </div>
    </div>
  )
}

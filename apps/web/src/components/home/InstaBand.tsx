import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import type { Messages } from '../../i18n'
import type { CardVM } from '../../lib/data'

const HIGHLIGHTS: ToyKind[] = ['rocket', 'teddy', 'car', 'puzzle']

/** Phone mock-up of the shop's Instagram profile with the newest items in the grid. */
export function InstaBand({ m, href, items }: { m: Messages; href: string; items: CardVM[] }) {
  return (
    <div className="insta">
      <div className="insta-copy">
        <p className="eyebrow">{m.insta.eyebrow}</p>
        <h2>{m.insta.title}</h2>
        <p className="lede">{m.insta.lede}</p>
        <a className="zt-btn zt-btn--ig" href={href} target="_blank" rel="noopener">{m.insta.cta}</a>
      </div>
      <div className="phone-stage">
        <span className="phone-heart h1" aria-hidden="true">♥</span>
        <span className="phone-heart h2" aria-hidden="true">♥</span>
        <span className="phone-heart h3" aria-hidden="true">♥</span>
        <a className="phone" href={href} target="_blank" rel="noopener" aria-label={m.insta.cta}>
          <span className="phone-notch" aria-hidden="true" />
          <span className="phone-bar"><b>zoy.toy</b><i aria-hidden="true" /></span>
          <span className="phone-profile">
            <span className="phone-avatar"><GiraffeHead /></span>
            <span className="phone-bio">
              <b>Zoy Toy</b>
              <small>{m.footer.tagline}</small>
            </span>
          </span>
          <span className="phone-follow">{m.insta.follow}</span>
          <span className="phone-hl" aria-hidden="true">
            {HIGHLIGHTS.map((k) => (
              <span key={k}><ToyArt kind={k} /></span>
            ))}
          </span>
          <span className="phone-grid">
            {items.slice(0, 9).map((p) => (
              <span key={p.id} className={`tint-${p.color}`}>
                {p.image ? <img src={p.image.src} srcSet={p.image.srcSet} sizes="(max-width: 640px) 33vw, 180px" alt="" loading="lazy" decoding="async" /> : <ToyArt kind={p.art} />}
              </span>
            ))}
          </span>
          <span className="phone-nav" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        </a>
      </div>
    </div>
  )
}

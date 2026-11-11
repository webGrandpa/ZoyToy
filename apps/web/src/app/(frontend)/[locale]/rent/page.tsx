import type { Metadata } from 'next'
import { alternates } from '../../../../lib/seo'
import Link from 'next/link'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import { isLocale, type Locale } from '../../../../i18n/config'
import { getMessages } from '../../../../i18n'
import { getRentable } from '../../../../lib/data'
import { ProductCard } from '../../../../components/ProductCard'
import { Bunting, Sprinkles, Wave } from '../../../../components/home/Decor'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const l = isLocale(locale) ? locale : 'ka'
  const m = getMessages(l)
  return { title: m.rentPage.title, description: m.rentPage.lede, alternates: alternates(l, '/rent') }
}

const STEP_ART: ToyKind[] = ['train', 'teddy', 'rocket', 'blocks']

export default async function RentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: l } = await params
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const m = getMessages(locale)
  const items = await getRentable(locale)
  return (
    <>
      <section className="rent-hero">
        <Bunting />
        <Sprinkles seed={7} />
        <div className="wrap rent-hero-in">
          <p className="eyebrow">{m.rentPage.eyebrow}</p>
          <h1>{m.rentPage.title}</h1>
          <p className="lede">{m.rentPage.lede}</p>
          <span className="count-pill">📍 {m.rentPage.only}</span>
        </div>
        <div className="hill" aria-hidden="true"><Wave color="var(--zt-canvas)" /></div>
      </section>

      <section className="sec doodles">
        <div className="wrap">
          <ol className="rent-steps">
            {m.rentPage.steps.map((s, i) => (
              <li key={s.t} className="rent-step">
                <span className="rent-num">{i + 1}</span>
                <ToyArt kind={STEP_ART[i]} className="rent-art" />
                <b>{s.t}</b>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band band-sky" aria-labelledby="rules-title">
        <Wave color="var(--band)" />
        <div className="wrap band-inner">
          <div className="sec-head center"><h2 id="rules-title">{m.rentPage.rulesTitle}</h2></div>
          <dl className="rules">
            {m.rentPage.rules.map((r) => (
              <div key={r.t} className="rule">
                <dt>{r.t}</dt>
                <dd>{r.d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Wave color="var(--band)" flip />
      </section>

      <section className="sec doodles dd-3" aria-labelledby="rent-items">
        <div className="wrap">
          <div className="sec-head row-head">
            <h2 id="rent-items">{m.rentPage.itemsTitle}</h2>
            <Link className="zt-btn zt-btn--secondary zt-btn--sm" href={`/${locale}/shop?rent=1`}>{m.arrivals.all} →</Link>
          </div>
          {items.length ? (
            <div className="cards">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          ) : (
            <p className="muted">{m.rentPage.empty}</p>
          )}
        </div>
      </section>
    </>
  )
}

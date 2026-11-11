import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isLocale, type Locale } from '../../../../../i18n/config'
import { dateText, fmt, getMessages } from '../../../../../i18n'
import { getProduct, getSettings, getSimilar } from '../../../../../lib/data'
import { contactLinks } from '../../../../../lib/contact'
import { ConditionBadge, ConditionScale } from '../../../../../components/Condition'
import { Gallery } from '../../../../../components/Gallery'
import { BuyRent } from '../../../../../components/BuyRent'
import { ProductCard } from '../../../../../components/ProductCard'
import { IconTruck } from '../../../../../components/Icons'

type Params = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const p = await getProduct(locale, slug)
  if (!p) return {}
  return {
    title: p.seo.title ?? p.title,
    description: p.seo.description ?? p.shortDescription ?? undefined,
    openGraph: { images: p.image ? [{ url: p.image.src }] : undefined },
  }
}

export default async function ProductPage({ params }: Params) {
  const { locale: l, slug } = await params
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const m = getMessages(locale)
  const p = await getProduct(locale, slug)
  if (!p) notFound()
  const [settings, similar] = await Promise.all([getSettings(locale), getSimilar(locale, p)])
  const ask = contactLinks(settings, fmt(locale, m.product.askText, { name: p.title, sku: p.sku }))
  const age = p.ageMin != null ? (p.ageMax ? fmt(locale, m.product.ageRange, { min: Math.floor(p.ageMin / 12), max: Math.floor(p.ageMax / 12) }) : fmt(locale, m.product.ageFrom, { min: Math.floor(p.ageMin / 12) })) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.title,
    sku: p.sku,
    image: p.gallery.map((g) => g.large),
    itemCondition: p.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
    offers: { '@type': 'Offer', price: p.price.toFixed(2), priceCurrency: 'GEL', availability: p.status === 'published' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' },
  }

  return (
    <>
      <section className="sec pdp-sec">
        <div className="wrap">
          <nav className="crumbs" aria-label="breadcrumbs">
            <Link href={`/${locale}/shop`}>{m.nav.shop}</Link>
            {p.categories[0] ? <> / <Link href={`/${locale}/shop?c=${p.categories[0].slug}`}>{p.categories[0].title}</Link></> : null}
          </nav>
          <div className="pdp zt-sticker">
            <Gallery p={p} />
            <div className="pdp-info">
              <div className="pdp-sub">
                <ConditionBadge condition={p.condition} m={m} />
                {p.origin ? <span>{m.origin[p.origin]}</span> : null}
                {age ? <span>· {age}</span> : null}
                {p.status === 'published' ? <span className="ok-text">{m.product.only}{p.locations[0] ? ` · ${p.locations[0]}` : ''}</span> : null}
              </div>
              <h1>{p.title}</h1>
              {p.shortDescription ? <p className="lede">{p.shortDescription}</p> : null}
              <BuyRent p={p} settings={settings} />

              <div className="cond-panel">
                <b>{m.condition.title}: {m.condition[p.condition]}</b>
                <ConditionScale condition={p.condition} m={m} />
                <ul>
                  {p.back.tested ? <li><span className="ok">✓</span><span><b>{m.condition.tested}</b></span></li> : null}
                  {p.back.cleanedAt ? <li><span className="ok">✓</span><span>{fmt(locale, m.condition.cleaned, { date: dateText(locale, p.back.cleanedAt) })}</span></li> : null}
                  <li><span className={p.back.complete ? 'ok' : 'warn'}>{p.back.complete ? '✓' : '•'}</span><span>{p.back.complete ? m.condition.complete : fmt(locale, m.condition.missing, { parts: p.back.missingParts ?? '' })}</span></li>
                  <li><span className="warn">•</span><span>{p.back.hasBox ? m.condition.withBox : m.condition.noBox}{p.hasManual ? ` · ${m.condition.manual}` : ''}</span></li>
                  {p.defects.map((d, i) => (
                    <li key={i}><span className="warn">{i + 1}</span><span>{d.text}</span></li>
                  ))}
                </ul>
                {p.back.notes ? <p className="muted">{p.back.notes}</p> : null}
              </div>

              <p className="delivery"><IconTruck /> {m.product.delivery}</p>
              <div className="ask">
                <span>{m.product.ask}:</span>
                <a className="zt-btn zt-btn--wa zt-btn--sm" href={ask.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
                {ask.telegram ? <a className="zt-btn zt-btn--tg zt-btn--sm" href={ask.telegram} target="_blank" rel="noopener">Telegram</a> : null}
                <a className="zt-btn zt-btn--ig zt-btn--sm" href={ask.instagram} target="_blank" rel="noopener">Instagram</a>
              </div>
            </div>
          </div>

          <div className="pdp-more">
            {p.description ? (
              <div className="zt-sticker prose">
                <RichText data={p.description} />
              </div>
            ) : null}
            <dl className="specs zt-sticker">
              <h2>{m.product.details}</h2>
              <div><dt>{m.product.sku}</dt><dd>{p.sku}</dd></div>
              {p.brand ? <div><dt>{m.product.brand}</dt><dd>{p.brand}</dd></div> : null}
              {p.franchises.length ? <div><dt>{m.product.franchise}</dt><dd>{p.franchises.join(', ')}</dd></div> : null}
              {p.categories.length ? <div><dt>{m.product.category}</dt><dd>{p.categories.map((c) => c.title).join(', ')}</dd></div> : null}
              {age ? <div><dt>{m.product.age}</dt><dd>{age}</dd></div> : null}
              {p.origin ? <div><dt>{m.product.origin}</dt><dd>{m.origin[p.origin]}</dd></div> : null}
              {p.batteries ? <div><dt>{m.product.batteries}</dt><dd>{p.batteries}</dd></div> : null}
            </dl>
          </div>
        </div>
      </section>

      {similar.length ? (
        <section className="sec" aria-labelledby="similar-title">
          <div className="wrap">
            <div className="sec-head"><h2 id="similar-title">{m.product.similar}</h2></div>
            <div className="cards">
              {similar.map((s) => (
                <ProductCard key={s.id} p={s} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </>
  )
}

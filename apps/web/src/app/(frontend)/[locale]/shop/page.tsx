import type { Metadata } from 'next'
import Link from 'next/link'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import { Wave } from '../../../../components/home/Decor'
import { isLocale, type Locale } from '../../../../i18n/config'
import { fmt, getMessages } from '../../../../i18n'
import { getCategories, getShop, type ShopQuery } from '../../../../lib/data'
import { ProductCard } from '../../../../components/ProductCard'
import { CONDITION_ORDER } from '../../../../components/Condition'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const m = getMessages(isLocale(locale) ? locale : 'ka')
  return { title: m.shop.title, description: m.shop.lede }
}

export default async function Shop({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<ShopQuery> }) {
  const { locale: l } = await params
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const q = await searchParams
  const m = getMessages(locale)
  const [{ items, total, page, pages }, categories] = await Promise.all([getShop(locale, q), getCategories(locale)])

  const href = (patch: Partial<ShopQuery>) => {
    const next = { ...q, ...patch, page: patch.page ?? undefined }
    const sp = new URLSearchParams(Object.entries(next).filter(([, v]) => v !== undefined && v !== '') as [string, string][])
    const s = sp.toString()
    return `/${locale}/shop${s ? `?${s}` : ''}`
  }
  const activeCat = categories.find((c) => c.slug === q.c)

  return (
    <>
    <section className={`shop-hero tint-${activeCat?.color ?? 'sky'}`}>
      <div className="wrap">
        <div>
          <p className="eyebrow">{activeCat ? m.shop.category : 'Zoy Toy'}</p>
          <h1>{activeCat?.title ?? m.shop.title}</h1>
          <p className="lede">{activeCat?.description ?? m.shop.lede}</p>
          <span className="count-pill">{fmt(locale, m.shop.results, { n: total })}</span>
        </div>
        <ToyArt kind={activeCat?.icon ?? 'blocks'} className="shop-hero-art" />
      </div>
      <div className="hill" aria-hidden="true"><Wave color="var(--zt-canvas)" /></div>
    </section>
    <section className="sec shop">
      <div className="wrap">
        <div className="filters" aria-label={m.shop.filters}>
          <div className="filter-row" role="group" aria-label={m.shop.category}>
            <Link className="zt-chip" aria-current={!q.c ? 'true' : undefined} href={href({ c: undefined })}>{m.categories.all}</Link>
            {categories.map((c) => (
              <Link key={c.id} className="zt-chip" aria-current={q.c === c.slug ? 'true' : undefined} href={href({ c: c.slug })}>{c.title}</Link>
            ))}
          </div>
          <div className="filter-row" role="group" aria-label={m.shop.age}>
            <span className="filter-label">{m.shop.age}</span>
            <Link className="zt-chip" aria-current={!q.age ? 'true' : undefined} href={href({ age: undefined })}>{m.shop.any}</Link>
            {m.age.groups.map((g, i) => (
              <Link key={g} className="zt-chip" aria-current={q.age === String(i) ? 'true' : undefined} href={href({ age: String(i) })}>{g}</Link>
            ))}
          </div>
          <div className="filter-row" role="group" aria-label={m.shop.condition}>
            <span className="filter-label">{m.shop.condition}</span>
            <Link className="zt-chip" aria-current={!q.cond ? 'true' : undefined} href={href({ cond: undefined })}>{m.shop.any}</Link>
            {CONDITION_ORDER.map((c) => (
              <Link key={c} className="zt-chip" aria-current={q.cond === c ? 'true' : undefined} href={href({ cond: c })}>{m.condition[c]}</Link>
            ))}
          </div>
          <div className="filter-row filter-bottom">
            <Link className="zt-chip" aria-current={q.rent === '1' ? 'true' : undefined} href={href({ rent: q.rent === '1' ? undefined : '1' })}>{m.shop.rentOnly}</Link>
            <span className="filter-label">{m.shop.sort}</span>
            {[['', m.shop.sortNew], ['price-asc', m.shop.sortPriceAsc], ['price-desc', m.shop.sortPriceDesc]].map(([k, label]) => (
              <Link key={k} className="zt-chip" aria-current={(q.sort ?? '') === k ? 'true' : undefined} href={href({ sort: k || undefined })}>{label}</Link>
            ))}
            <span className="results">{fmt(locale, m.shop.results, { n: total })}</span>
          </div>
        </div>

        {items.length ? (
          <div className="cards">
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="empty zt-sticker">
            <GiraffeHead className="empty-art" />
            <h2>{m.shop.emptyTitle}</h2>
            <p>{m.shop.emptyText}</p>
            <Link className="zt-btn zt-btn--secondary" href={`/${locale}/shop`}>{m.shop.reset}</Link>
          </div>
        )}

        {pages > 1 ? (
          <nav className="pager" aria-label={fmt(locale, m.shop.page, { n: page, total: pages })}>
            {page > 1 ? <Link className="zt-btn zt-btn--secondary zt-btn--sm" href={href({ page: String(page - 1) })}>{m.shop.prev}</Link> : <span />}
            <span>{fmt(locale, m.shop.page, { n: page, total: pages })}</span>
            {page < pages ? <Link className="zt-btn zt-btn--secondary zt-btn--sm" href={href({ page: String(page + 1) })}>{m.shop.next}</Link> : <span />}
          </nav>
        ) : null}
      </div>
    </section>
    </>
  )
}

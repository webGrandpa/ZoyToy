import type { Metadata } from 'next'
import { alternates } from '../../../../lib/seo'
import Link from 'next/link'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import { Wave } from '../../../../components/home/Decor'
import { isLocale, type Locale } from '../../../../i18n/config'
import { fmt, getMessages } from '../../../../i18n'
import { getCategories, getShop, type ShopQuery } from '../../../../lib/data'
import { ProductCard } from '../../../../components/ProductCard'
import { CONDITION_ORDER } from '../../../../components/Condition'

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const { locale } = await params
  const l = isLocale(locale) ? locale : 'ka'
  const m = getMessages(l)
  // a category is a page of its own for search engines; the other filters all point back to it
  const c = [(await searchParams).c].flat()[0]
  const cat = c ? (await getCategories(l)).find((x) => x.slug === c) : undefined
  return {
    title: cat?.title ?? m.shop.title,
    description: cat?.description ?? m.shop.lede,
    alternates: alternates(l, cat ? `/shop?c=${encodeURIComponent(cat.slug)}` : '/shop'),
  }
}

type Raw = Record<string, string | string[] | undefined>
/** One value per filter, even when a link repeats a parameter (?cond=a&cond=b used to crash the page). */
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 60)

export default async function Shop({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<Raw> }) {
  const { locale: l } = await params
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const raw = await searchParams
  const q: ShopQuery = { c: one(raw.c), cond: one(raw.cond), age: one(raw.age), sort: one(raw.sort), rent: one(raw.rent), page: one(raw.page) }
  const m = getMessages(locale)
  const [{ items, total, page, pages }, categories] = await Promise.all([getShop(locale, q), getCategories(locale)])

  const href = (patch: Partial<ShopQuery>) => {
    const next = { ...q, ...patch, page: patch.page ?? undefined }
    const sp = new URLSearchParams(Object.entries(next).filter(([, v]) => v !== undefined && v !== '') as [string, string][])
    const s = sp.toString()
    return `/${locale}/shop${s ? `?${s}` : ''}`
  }
  const activeCat = categories.find((c) => c.slug === q.c)
  const cond = CONDITION_ORDER.find((c) => c === q.cond)
  const ageIdx = q.age !== undefined && m.age.groups[Number(q.age)] ? Number(q.age) : null
  const sorts = [['', m.shop.sortNew], ['price-asc', m.shop.sortPriceAsc], ['price-desc', m.shop.sortPriceDesc]] as const
  const sortLabel = sorts.find(([k]) => k === (q.sort ?? ''))?.[1] ?? m.shop.sortNew
  // what is switched on, each with its own way out
  const active = [
    activeCat ? { key: 'c', label: activeCat.title, clear: href({ c: undefined }) } : null,
    ageIdx !== null ? { key: 'age', label: `${m.shop.age}: ${m.age.groups[ageIdx]}`, clear: href({ age: undefined }) } : null,
    cond ? { key: 'cond', label: m.condition[cond], clear: href({ cond: undefined }) } : null,
    q.rent === '1' ? { key: 'rent', label: m.shop.rentOnly, clear: href({ rent: undefined }) } : null,
  ].filter((a): a is { key: string; label: string; clear: string } => Boolean(a))

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
    <section className="sec shop doodles dd-2">
      <div className="wrap">
        <div className="shopf">
          {/* the main choice: which shelf — little toy tiles, each in its category colour */}
          <nav className="shopf-cats" aria-label={m.shop.category}>
            <Link className="cat-tile tint-grape" aria-current={!q.c ? 'page' : undefined} href={href({ c: undefined })}>
              <span className="cat-tile-art" aria-hidden="true"><GiraffeHead /></span>
              <b>{m.categories.all}</b>
            </Link>
            {categories.map((c) => (
              <Link key={c.id} className={`cat-tile tint-${c.color}`} aria-current={q.c === c.slug ? 'page' : undefined} href={href({ c: c.slug })}>
                <span className="cat-tile-art" aria-hidden="true"><ToyArt kind={c.icon} /></span>
                <b>{c.title}</b>
              </Link>
            ))}
          </nav>

          {/* everything else on one tidy bar */}
          <div className="shopf-bar" aria-label={m.shop.filters} role="group">
            <div className="shopf-age" role="group" aria-label={m.shop.age}>
              <span className="shopf-label">{m.shop.age}</span>
              <div className="seg">
                <Link aria-current={ageIdx === null ? 'true' : undefined} href={href({ age: undefined })}>{m.shop.any}</Link>
                {m.age.groups.map((g, i) => (
                  <Link key={g} aria-current={ageIdx === i ? 'true' : undefined} href={href({ age: String(i) })}>{g.replace(/\s.*$/, '')}</Link>
                ))}
              </div>
            </div>
            <details className="shopf-menu" key={`cond-${cond ?? ''}`}>
              <summary>
                <span className="shopf-label">{m.shop.condition}</span>
                <b>{cond ? <><i className={`cdot cdot--${cond}`} aria-hidden="true" />{m.condition[cond]}</> : m.shop.any}</b>
              </summary>
              <div className="shopf-pop">
                <Link className="shopf-opt" aria-current={!cond ? 'true' : undefined} href={href({ cond: undefined })}>{m.shop.any}</Link>
                {CONDITION_ORDER.map((c) => (
                  <Link key={c} className="shopf-opt" aria-current={cond === c ? 'true' : undefined} href={href({ cond: c })}>
                    <i className={`cdot cdot--${c}`} aria-hidden="true" />
                    {m.condition[c]}
                  </Link>
                ))}
              </div>
            </details>
            <details className="shopf-menu shopf-sort" key={`sort-${q.sort ?? ''}`}>
              <summary aria-label={`${m.shop.sort}: ${sortLabel}`}>
                <span className="shopf-label">{m.shop.sort}</span>
                <b>{sortLabel}</b>
              </summary>
              <div className="shopf-pop shopf-pop--end">
                {sorts.map(([k, label]) => (
                  <Link key={k} className="shopf-opt" aria-current={(q.sort ?? '') === k ? 'true' : undefined} href={href({ sort: k || undefined })}>{label}</Link>
                ))}
              </div>
            </details>
            <Link className="shopf-switch" aria-current={q.rent === '1' ? 'true' : undefined} href={href({ rent: q.rent === '1' ? undefined : '1' })}>
              <span className="knob" aria-hidden="true" />
              {m.shop.rentOnly}
            </Link>
          </div>

          <div className="shopf-active" aria-live="polite">
            {active.map((a) => (
              <Link key={a.key} className="shopf-tag" href={a.clear} aria-label={`${a.label} ×`}>
                {a.label}
                <span aria-hidden="true">×</span>
              </Link>
            ))}
            {active.length > 1 ? <Link className="shopf-reset" href={`/${locale}/shop`}>{m.shop.reset}</Link> : null}
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

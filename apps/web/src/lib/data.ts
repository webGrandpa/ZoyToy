import { cache } from 'react'
import type { Where } from 'payload'
import type { Category, Media, Product, Location, SiteSetting } from '../payload-types'
import type { ToyKind } from '@zoytoy/ui/ToyArt'
import { TOY_KINDS } from '@zoytoy/ui/ToyArt'
import type { Locale } from '../i18n/config'
import { payloadClient } from './payload'
import { cutOf, type Cut } from './backdrop'

export type Accent = 'grape' | 'sun' | 'sky' | 'bubble' | 'mint' | 'tangerine'
/** cut: the photo's background was removed — it stands on a drawn backdrop (lib/backdrop.ts) */
export type Img = { src: string; srcSet: string; width: number; height: number; alt: string; cut: Cut | null }
export type Condition = Product['condition']

export type CardVM = {
  id: number
  slug: string
  sku: string
  title: string
  status: Product['status']
  condition: Condition
  price: number
  compareAtPrice: number | null
  retailPriceNew: number | null
  rentDaily: number | null
  image: Img | null
  art: ToyKind
  color: Accent
  ageMin: number | null
  ageMax: number | null
  origin: Product['origin'] | null
  back: { tested: boolean; cleanedAt: string | null; hasBox: boolean; complete: boolean; missingParts: string | null; defects: string[]; notes: string | null }
}

export type ProductVM = CardVM & {
  shortDescription: string | null
  description: Product['description'] | null
  gallery: (Img & { large: string; role: string })[]
  defects: { text: string; x: number | null; y: number | null }[]
  categories: { title: string; slug: string }[]
  batteries: string | null
  hasManual: boolean
  locations: string[]
  rental: { enabled: boolean; dailyRate: number; deposit: number; minDays: number; maxDays: number } | null
  seo: { title: string | null; description: string | null }
  updatedAt: string
}

// ---------- mapping helpers ----------
const asMedia = (m: unknown): Media | null => (m && typeof m === 'object' ? (m as Media) : null)

export function toImg(m: unknown): (Img & { large: string }) | null {
  const media = asMedia(m)
  if (!media?.url) return null
  const card = media.sizes?.card
  const large = media.sizes?.large
  const cut = cutOf(media)
  // a cut-out uses its own shape (tile) instead of the padded square, and never the square thumb — that
  // is a centre crop and would cut a tall toy in half
  const tile = cut && media.sizes?.tile?.url ? media.sizes.tile : null
  const thumb = cut ? null : media.sizes?.thumb
  const small = tile ?? card
  const parts = [
    thumb?.url && thumb.width ? `${thumb.url} ${thumb.width}w` : null,
    small?.url && small.width ? `${small.url} ${small.width}w` : null,
    large?.url && large.width ? `${large.url} ${large.width}w` : null,
  ].filter(Boolean)
  return {
    src: small?.url ?? media.url,
    srcSet: parts.join(', '),
    width: card?.width ?? media.width ?? 600,
    height: card?.height ?? media.height ?? 600,
    alt: media.alt ?? '',
    cut,
    large: large?.url ?? media.url,
  }
}

const firstCategory = (p: Product): Category | null => {
  const c = p.categories?.[0]
  return c && typeof c === 'object' ? c : null
}

export function toCard(p: Product): CardVM {
  const cat = firstCategory(p)
  const icon = cat?.icon as ToyKind | undefined
  const main = p.gallery?.find((g) => g.role === 'main') ?? p.gallery?.[0]
  return {
    id: p.id,
    slug: p.slug ?? String(p.id),
    sku: p.sku ?? '',
    title: p.title,
    status: p.status,
    condition: p.condition,
    price: Number(p.price ?? 0),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    retailPriceNew: p.retailPriceNew ? Number(p.retailPriceNew) : null,
    rentDaily: p.rental?.enabled && p.rental.dailyRate ? Number(p.rental.dailyRate) : null,
    image: main ? toImg(main.image) : null,
    art: icon && TOY_KINDS.includes(icon) ? icon : 'blocks',
    color: (cat?.color as Accent) ?? 'grape',
    ageMin: p.ageMinMonths ?? null,
    ageMax: p.ageMaxMonths ?? null,
    origin: p.origin ?? null,
    back: {
      tested: Boolean(p.tested),
      cleanedAt: p.cleanedAt ?? null,
      hasBox: Boolean(p.hasBox),
      complete: p.completeness !== 'incomplete',
      missingParts: p.missingParts ?? null,
      defects: (p.defects ?? []).map((d) => d.text),
      notes: p.conditionNotes ?? null,
    },
  }
}

function toProduct(p: Product): ProductVM {
  const card = toCard(p)
  const gallery = (p.gallery ?? [])
    .map((g) => {
      const img = toImg(g.image)
      return img ? { ...img, role: g.role ?? 'gallery' } : null
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
  const locNames = (p.stock ?? [])
    .filter((s) => (s.qty ?? 0) > 0 && typeof s.location === 'object')
    .map((s) => (s.location as Location).title)
  return {
    ...card,
    shortDescription: p.shortDescription ?? null,
    description: p.description ?? null,
    gallery,
    defects: (p.defects ?? []).map((d) => ({ text: d.text, x: d.x ?? null, y: d.y ?? null })),
    categories: (p.categories ?? []).filter((c): c is Category => typeof c === 'object').map((c) => ({ title: c.title, slug: c.slug ?? '' })),
    batteries: p.batteries ?? null,
    hasManual: Boolean(p.hasManual),
    locations: locNames,
    rental: p.rental?.enabled
      ? { enabled: true, dailyRate: Number(p.rental.dailyRate ?? 0), deposit: Number(p.rental.deposit ?? p.price ?? 0), minDays: p.rental.minDays ?? 1, maxDays: p.rental.maxDays ?? 30 }
      : null,
    seo: { title: p.seo?.title ?? null, description: p.seo?.description ?? null },
    updatedAt: p.updatedAt,
  }
}

// ---------- queries ----------
const PUBLIC_LIST: Where = { status: { in: ['published', 'reserved'] } }

/** Once per request, however many components ask (React cache). */
export const getSettings = cache(async function getSettings(locale: Locale): Promise<SiteSetting> {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'site-settings', locale, depth: 0 })
})

export const getMainLocation = cache(async function getMainLocation(locale: Locale): Promise<Location | null> {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'locations', locale, limit: 1, where: { active: { equals: true } }, depth: 0 })
  return res.docs[0] ?? null
})

export const getCategories = cache(async function getCategories(locale: Locale) {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'categories', locale, limit: 50, sort: 'order', depth: 0 })
  return res.docs.map((c) => ({ id: c.id, title: c.title, slug: c.slug ?? String(c.id), color: (c.color as Accent) ?? 'grape', icon: (TOY_KINDS.includes(c.icon as ToyKind) ? c.icon : 'blocks') as ToyKind, theme: c.theme ?? null, description: c.description ?? null }))
})

export async function getNewArrivals(locale: Locale, limit = 8): Promise<CardVM[]> {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'products', locale, limit, sort: '-publishedAt', where: PUBLIC_LIST, depth: 1 })
  return res.docs.map(toCard)
}

/** Age groups in months, matching the age picker (0–2, 3–5, 6–8, 9–12, 12+). */
export const AGE_GROUPS: [number, number][] = [[0, 35], [36, 71], [72, 107], [108, 155], [156, 240]]

const ageWhere = (g: number): Where => {
  const [min, max] = AGE_GROUPS[g]
  return {
    and: [
      { or: [{ ageMinMonths: { less_than_equal: max } }, { ageMinMonths: { exists: false } }] },
      { or: [{ ageMaxMonths: { greater_than_equal: min } }, { ageMaxMonths: { exists: false } }] },
    ],
  }
}

export async function getAgeCounts(): Promise<number[]> {
  const payload = await payloadClient()
  return Promise.all(AGE_GROUPS.map((_, g) => payload.count({ collection: 'products', where: { and: [PUBLIC_LIST, ageWhere(g)] } }).then((r) => r.totalDocs)))
}

export type ShopQuery = { c?: string; cond?: string; age?: string; sort?: string; rent?: string; page?: string }

export async function getShop(locale: Locale, q: ShopQuery) {
  const payload = await payloadClient()
  const and: Where[] = [PUBLIC_LIST]
  if (q.c) {
    const cat = await payload.find({ collection: 'categories', where: { slug: { equals: q.c } }, limit: 1, depth: 0 })
    if (cat.docs[0]) and.push({ categories: { in: [cat.docs[0].id] } })
  }
  if (q.cond) and.push({ condition: { in: q.cond.split(',') } })
  const age = Number(q.age)
  if (q.age !== undefined && q.age !== '' && Number.isInteger(age) && age >= 0 && age < AGE_GROUPS.length) and.push(ageWhere(age))
  if (q.rent === '1') and.push({ 'rental.enabled': { equals: true } })
  const sort = q.sort === 'price-asc' ? 'price' : q.sort === 'price-desc' ? '-price' : '-publishedAt'
  const page = Math.max(1, Number(q.page) || 1)
  const res = await payload.find({ collection: 'products', locale, where: { and }, sort, limit: 24, page, depth: 1 })
  return { items: res.docs.map(toCard), total: res.totalDocs, page: res.page ?? 1, pages: res.totalPages }
}

export const getProduct = cache(async function getProduct(locale: Locale, slug: string): Promise<ProductVM | null> {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'products', locale, where: { and: [{ slug: { equals: slug } }, { status: { in: ['published', 'reserved', 'sold'] } }] }, limit: 1, depth: 2 })
  return res.docs[0] ? toProduct(res.docs[0]) : null
})

export async function getSimilar(locale: Locale, p: ProductVM, limit = 4): Promise<CardVM[]> {
  const payload = await payloadClient()
  const catSlugs = p.categories.map((c) => c.slug)
  const cats = catSlugs.length ? await payload.find({ collection: 'categories', where: { slug: { in: catSlugs } }, depth: 0, limit: 10 }) : { docs: [] }
  const res = await payload.find({
    collection: 'products',
    locale,
    limit,
    depth: 1,
    sort: '-publishedAt',
    where: { and: [PUBLIC_LIST, { id: { not_equals: p.id } }, ...(cats.docs.length ? [{ categories: { in: cats.docs.map((c) => c.id) } }] : [])] },
  })
  return res.docs.map(toCard)
}

/** Honest shop numbers for the stats band — computed from real sales, never typed in by hand. */
export async function getStats() {
  const payload = await payloadClient()
  const [sold, onShelf] = await Promise.all([
    payload.find({ collection: 'products', where: { status: { equals: 'sold' } }, limit: 1000, depth: 0, select: { price: true, retailPriceNew: true } }),
    payload.count({ collection: 'products', where: PUBLIC_LIST }),
  ])
  const saved = sold.docs.reduce((sum, p) => sum + Math.max(0, Number(p.retailPriceNew ?? 0) - Number(p.price ?? 0)), 0)
  return { homes: sold.totalDocs, saved: Math.round(saved), onShelf: onShelf.totalDocs }
}

/** Item with the biggest saving among the newest ones — the "find of the week". */
export async function getSpotlight(locale: Locale): Promise<CardVM | null> {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'products', locale, where: { status: { equals: 'published' } }, sort: '-publishedAt', limit: 30, depth: 1 })
  const best = res.docs
    .map((p) => ({ p, save: Number(p.retailPriceNew ?? 0) - Number(p.price ?? 0) }))
    .sort((a, b) => b.save - a.save)[0]
  return best ? toCard(best.p) : null
}

export async function getRentable(locale: Locale, limit = 24): Promise<CardVM[]> {
  const payload = await payloadClient()
  const res = await payload.find({ collection: 'products', locale, where: { and: [{ status: { equals: 'published' } }, { 'rental.enabled': { equals: true } }] }, sort: '-publishedAt', limit, depth: 1 })
  return res.docs.map(toCard)
}

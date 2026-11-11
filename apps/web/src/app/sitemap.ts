import type { MetadataRoute } from 'next'
import { LOCALES } from '../i18n/config'
import { payloadClient } from '../lib/payload'
import { metadataBase } from '../lib/seo'

// rebuilt at most hourly; search engines don't need it fresher
export const revalidate = 3600

/**
 * /sitemap.xml — every page in all three languages, each listing its translations: home, catalogue,
 * category shelves, rent, play, contact and every item a visitor can open (on sale, reserved or sold).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = metadataBase().toString().replace(/\/$/, '')
  const payload = await payloadClient()
  const [products, categories] = await Promise.all([
    payload.find({ collection: 'products', where: { status: { in: ['published', 'reserved', 'sold'] } }, limit: 5000, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
    payload.find({ collection: 'categories', limit: 200, pagination: false, depth: 0, select: { slug: true, updatedAt: true } }),
  ])
  const entry = (path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap =>
    LOCALES.map((l) => ({
      url: `${base}/${l}${path}`,
      lastModified,
      priority,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}${path}`])) },
    }))
  return [
    ...entry('', undefined, 1),
    ...entry('/shop', undefined, 0.9),
    ...categories.docs.filter((c) => c.slug).flatMap((c) => entry(`/shop?c=${encodeURIComponent(c.slug!)}`, c.updatedAt, 0.8)),
    ...entry('/rent'),
    ...entry('/play', undefined, 0.5),
    ...entry('/contact', undefined, 0.5),
    ...products.docs.filter((p) => p.slug).flatMap((p) => entry(`/p/${encodeURIComponent(p.slug!)}`, p.updatedAt, 0.7)),
  ]
}

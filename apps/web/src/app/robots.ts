import type { MetadataRoute } from 'next'
import { metadataBase } from '../lib/seo'

/** /robots.txt — the shop is open to search engines, the admin and API are not; points at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  const base = metadataBase().toString().replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${base}/sitemap.xml`,
  }
}

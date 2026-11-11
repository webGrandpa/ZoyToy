import type { Metadata } from 'next'
import { LOCALES, type Locale } from '../i18n/config'
import { siteUrl } from './site'

/** Absolute base for canonical, hreflang and Open Graph URLs: SITE_URL, the Vercel production domain, or local. */
export const metadataBase = () => new URL(siteUrl() ?? `http://localhost:${process.env.PORT || 3000}`)

export const OG_LOCALE: Record<Locale, string> = { ka: 'ka_GE', ru: 'ru_RU', en: 'en_US' }

/**
 * Canonical address of this page and the same page in the other languages (slugs are shared between
 * languages, so `path` is the same everywhere). Georgian is the default for visitors of no language.
 */
export function alternates(locale: Locale, path = ''): Metadata['alternates'] {
  return {
    canonical: `/${locale}${path}`,
    languages: { ...Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`])), 'x-default': `/ka${path}` },
  }
}

/** Open Graph basics every page repeats (a page's own `openGraph` replaces the layout's, it doesn't merge). */
export const ogBase = (locale: Locale) => ({ siteName: 'Zoy Toy', locale: OG_LOCALE[locale], type: 'website' as const })

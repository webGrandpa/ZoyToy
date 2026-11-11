import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import '@zoytoy/ui/tokens.css'
import '@zoytoy/ui/components.css'
import '../site.css'
import '../home.css'
import { HTML_LANG, isLocale, LOCALES, type Locale } from '../../../i18n/config'
import { alternates, metadataBase, ogBase } from '../../../lib/seo'
import { getMessages } from '../../../i18n'
import { getMainLocation, getSettings } from '../../../lib/data'
import { Providers } from '../../../components/Providers'
import { Header } from '../../../components/Header'
import { Footer } from '../../../components/Footer'
import { TabBar } from '../../../components/TabBar'
import { contactLinks } from '../../../lib/contact'
import { IconChat } from '../../../components/Icons'
import { CartDrawer } from '../../../components/Cart'
import { NavProgress } from '../../../components/NavProgress'

const SCRIPT: Record<Locale, 'georgian' | 'cyrillic' | 'latin'> = { ka: 'georgian', ru: 'cyrillic', en: 'latin' }

// edits refresh the pages at once (lib/refresh.ts); the hourly rebuild only catches what changes with time —
// season, campaign dates, reservations running out — and the daily job refreshes once more in the morning
export const revalidate = 3600

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getMessages(locale)
  return {
    title: { default: m.meta.title, template: `%s — Zoy Toy` },
    description: m.meta.description,
    metadataBase: metadataBase(),
    alternates: alternates(locale),
    openGraph: { ...ogBase(locale), images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Zoy Toy' }] },
    twitter: { card: 'summary_large_image' },
    // .ico for browsers without SVG favicons (listed first with a size so others still prefer the SVG),
    // a 180² PNG for iPhone home screens and Safari tabs
    icons: { icon: [{ url: '/favicon.ico', sizes: '48x48' }, { url: '/favicon.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' },
  }
}

export const viewport: Viewport = {
  themeColor: '#8FDBFF',
  viewportFit: 'cover',
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const m = getMessages(locale)
  const [settings, location] = await Promise.all([getSettings(locale), getMainLocation(locale)])
  const links = contactLinks(settings)
  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        {/* the page language's FiraGO subsets (site.css) start downloading with the HTML: headings (900) and body (400);
            Latin (digits, prices, "Zoy Toy") comes too. ~55 KB on a Georgian page instead of 723 KB of full fonts */}
        {[...new Set([`${SCRIPT[locale]}-900`, `${SCRIPT[locale]}-400`, 'latin-400'])].map((f) => (
          <link key={f} rel="preload" href={`/fonts/firago-${f}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>
        {/* apply the saved night theme before paint — no flash of the wrong colours */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('zt-theme')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}" }} />
        <Providers locale={locale} messages={m}>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <a className="skip" href="#main">{m.a11y.skip}</a>
          <Header locale={locale} m={m} announcement={settings.announcement} />
          <main id="main">{children}</main>
          <Footer locale={locale} m={m} settings={settings} location={location} />
          <a className="float-contact" href={links.whatsapp} target="_blank" rel="noopener" aria-label={m.contact.float}>
            <IconChat />
          </a>
          <TabBar />
          <CartDrawer contact={{ whatsapp: settings.whatsapp, telegram: settings.telegram, instagram: settings.instagram, phone: settings.phone }} />
        </Providers>
      </body>
    </html>
  )
}

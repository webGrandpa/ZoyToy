import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Suspense, type ReactNode } from 'react'
import '@zoytoy/ui/tokens.css'
import '@zoytoy/ui/components.css'
import '../site.css'
import '../home.css'
import { HTML_LANG, isLocale, LOCALES } from '../../../i18n/config'
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

export const revalidate = 120

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
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])) },
    openGraph: { siteName: 'Zoy Toy', locale, type: 'website' },
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
        {/* our FiraGO files (site.css @font-face) start downloading together with the HTML — no late font swap on a cold load */}
        {[900, 400, 700].map((w) => (
          <link key={w} rel="preload" href={`/fonts/firago-latin-${w}-normal.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
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

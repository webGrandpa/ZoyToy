import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, isLocale, type Locale } from './i18n/config'

/** Sends visitors without a language prefix to /ka, /ru or /en (cookie → browser language → Georgian). */
function pickLocale(req: NextRequest): Locale {
  const saved = req.cookies.get('NEXT_LOCALE')?.value
  if (isLocale(saved)) return saved
  const header = req.headers.get('accept-language') ?? ''
  for (const part of header.split(',')) {
    const code = part.split(';')[0].trim().slice(0, 2).toLowerCase()
    if (isLocale(code)) return code
  }
  return DEFAULT_LOCALE
}

/**
 * The admin opens in Georgian for everyone — the shop's team is Georgian, whatever language their
 * browser is set to. Payload reads the language from its `payload-lng` cookie first and the browser's
 * Accept-Language second, so without a choice we hand it Georgian; a language picked in the admin
 * (side menu or Account) sets the cookie and wins.
 */
function adminInGeorgian(req: NextRequest) {
  if (req.cookies.get('payload-lng')?.value) return NextResponse.next()
  const headers = new Headers(req.headers)
  headers.set('accept-language', 'ka')
  return NextResponse.next({ request: { headers } })
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return adminInGeorgian(req)
  const first = pathname.split('/')[1]
  if (isLocale(first)) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = `/${pickLocale(req)}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // the admin (its language), and the storefront: everything except the API, Next internals and files with an extension
  matcher: ['/admin', '/admin/:path*', '/((?!admin|api|_next|.*\\..*).*)'],
}


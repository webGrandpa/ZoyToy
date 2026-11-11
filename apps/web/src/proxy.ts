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

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const first = pathname.split('/')[1]
  if (isLocale(first)) return NextResponse.next()
  const url = req.nextUrl.clone()
  url.pathname = `/${pickLocale(req)}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // everything except the admin, the API, Next internals and files with an extension
  matcher: ['/((?!admin|api|_next|.*\\..*).*)'],
}


/** Public https address of the site, for links in messages and on printed labels (Telegram refuses localhost links). */
export function siteUrl() {
  const own = process.env.SITE_URL?.trim().replace(/\/$/, '')
  if (own?.startsWith('https://')) return own
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  return host ? `https://${host}` : null
}

/** siteUrl(), or the address this request came in on (local development, previews without SITE_URL). */
export function siteUrlFor(headers: Headers) {
  const own = siteUrl()
  if (own) return own
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3000'
  const proto = headers.get('x-forwarded-proto') ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https')
  return `${proto}://${host}`
}

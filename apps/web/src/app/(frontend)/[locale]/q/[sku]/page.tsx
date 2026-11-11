import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { isLocale } from '../../../../../i18n/config'
import { payloadClient } from '../../../../../lib/payload'
import { normalizeSku } from '../../../../../lib/store'

type Params = { params: Promise<{ locale: string; sku: string }> }

export const metadata: Metadata = { robots: { index: false, follow: false } }

const PUBLIC = ['published', 'reserved', 'sold']

/**
 * Target of the QR code on printed labels (/q/ZT-000123; the proxy adds the visitor's language).
 * Customers land on the item page; someone logged in to the admin lands on the counter screen.
 */
export default async function LabelScan({ params }: Params) {
  const { locale, sku: raw } = await params
  const sku = normalizeSku(decodeURIComponent(raw))
  if (!isLocale(locale) || !sku) notFound()
  const payload = await payloadClient()
  const [{ user }, found] = await Promise.all([
    payload.auth({ headers: await headers() }).catch(() => ({ user: null })),
    payload.find({ collection: 'products', where: { sku: { equals: sku } }, limit: 1, depth: 0, overrideAccess: true, select: { slug: true, status: true } }),
  ])
  const item = found.docs[0]
  const team = (user as { roles?: string[] } | null)?.roles?.some((r) => r === 'admin' || r === 'staff')
  if (item && team) redirect(`${payload.config.routes.admin}/store-sale?id=${item.id}`)
  if (!item?.slug || !PUBLIC.includes(item.status)) notFound()
  redirect(`/${locale}/p/${item.slug}`)
}

/**
 * Selling in the shop and printed QR labels (docs/04 „მაღაზიაში გაყიდვა“, docs/08 §5 S2).
 * Pure helpers shared by the admin screens, the API and the tests — safe to import in the browser.
 */

export const SALE_PAYMENTS = ['cash', 'card', 'transfer'] as const
export type SalePayment = (typeof SALE_PAYMENTS)[number]

/** Staff can take back their own mistake for this long; the owner can always. */
export const UNDO_MINUTES = 15

/** Path printed in the label's QR code: short, survives title/slug edits, and works in any language. */
export const labelPath = (sku: string) => `/q/${encodeURIComponent(sku)}`

/** "zt-123", "ZT000123", "123" → "ZT-000123"; anything else → null. */
export function normalizeSku(input: string): string | null {
  const m = input.trim().toUpperCase().match(/^(?:ZT)?[-\s]?0*(\d{1,9})$/)
  return m ? `ZT-${m[1].padStart(6, '0')}` : null
}

export type Scan = { sku: string } | { slug: string } | { text: string }

/** What a scanned QR code or a typed search means: a label link, a product page link, a SKU, or words. */
export function parseScan(raw: string): Scan {
  const input = raw.trim().slice(0, 300)
  const label = input.match(/\/q\/([^/?#\s]+)/i)
  if (label) {
    const sku = normalizeSku(decodeSafe(label[1]))
    if (sku) return { sku }
  }
  const page = input.match(/\/p\/([^/?#\s]+)/i)
  if (page) return { slug: decodeSafe(page[1]) }
  const sku = normalizeSku(input)
  if (sku) return { sku }
  return { text: input }
}

function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Georgia keeps UTC+4 all year (no daylight saving since 2005). */
const TBILISI_OFFSET = 4 * 3600 * 1000

/** Midnight in Batumi of the day `now` falls on, as an instant. */
export function shopDayStart(now = new Date()) {
  const local = new Date(now.getTime() + TBILISI_OFFSET)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - TBILISI_OFFSET)
}

export type SaleLike = { price?: number | null; payment?: string | null }

/** Day report numbers: how many, how much, and how it was paid. */
export function saleTotals(sales: SaleLike[]) {
  const byPayment: Record<SalePayment, number> = { cash: 0, card: 0, transfer: 0 }
  let sum = 0
  for (const s of sales) {
    const price = Number(s.price ?? 0)
    sum += price
    const way = (SALE_PAYMENTS as readonly string[]).includes(s.payment ?? '') ? (s.payment as SalePayment) : 'cash'
    byPayment[way] += price
  }
  const round = (n: number) => Math.round(n * 100) / 100
  return { count: sales.length, sum: round(sum), byPayment: { cash: round(byPayment.cash), card: round(byPayment.card), transfer: round(byPayment.transfer) } }
}

/** Whole-percent discount of the sold price against the shelf price (0 when sold at or above it). */
export function discountPercent(listPrice?: number | null, price?: number | null) {
  const list = Number(listPrice ?? 0)
  const sold = Number(price ?? 0)
  if (!(list > 0) || sold >= list) return 0
  return Math.round(((list - sold) / list) * 100)
}

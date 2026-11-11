// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Order, Product } from '@/payload-types'
import { discountPercent, labelPath, normalizeSku, parseScan, saleTotals, shopDayStart } from '@/lib/store'
import { moveProducts } from '@/lib/stock'

describe('labels and scanning', () => {
  it('normalises what people type or scan into a SKU', () => {
    expect(normalizeSku('zt-123')).toBe('ZT-000123')
    expect(normalizeSku('ZT000123')).toBe('ZT-000123')
    expect(normalizeSku(' 42 ')).toBe('ZT-000042')
    expect(normalizeSku('ZT-000123')).toBe('ZT-000123')
    expect(normalizeSku('lego')).toBeNull()
    expect(normalizeSku('')).toBeNull()
  })

  it('understands label links, product links, SKUs and words', () => {
    expect(parseScan('https://zoytoy.ge/q/ZT-000123')).toEqual({ sku: 'ZT-000123' })
    expect(parseScan('https://zoytoy.ge/ka/q/zt-7?x=1')).toEqual({ sku: 'ZT-000007' })
    expect(parseScan('https://zoytoy.ge/ru/p/lego-castle#top')).toEqual({ slug: 'lego-castle' })
    expect(parseScan('ZT-55')).toEqual({ sku: 'ZT-000055' })
    expect(parseScan('  дракон ')).toEqual({ text: 'дракон' })
    expect(labelPath('ZT-000001')).toBe('/q/ZT-000001')
  })

  it('counts the shop day from Batumi midnight', () => {
    // 23:30 UTC on Nov 10 is already 03:30 on Nov 11 in Batumi
    expect(shopDayStart(new Date('2026-11-10T23:30:00Z')).toISOString()).toBe('2026-11-10T20:00:00.000Z')
    // 19:59 UTC is still Nov 10 there
    expect(shopDayStart(new Date('2026-11-10T19:59:00Z')).toISOString()).toBe('2026-11-09T20:00:00.000Z')
  })

  it('totals the day by payment and shows discounts', () => {
    const t = saleTotals([{ price: 10.1, payment: 'cash' }, { price: 20.2, payment: 'card' }, { price: 5, payment: 'cash' }, { price: 1, payment: null }])
    expect(t).toEqual({ count: 4, sum: 36.3, byPayment: { cash: 16.1, card: 20.2, transfer: 0 } })
    expect(discountPercent(40, 30)).toBe(25)
    expect(discountPercent(40, 40)).toBe(0)
    expect(discountPercent(0, 10)).toBe(0)
  })
})

describe('selling in the shop', () => {
  let payload: Payload
  let product: Product
  let original: Product['status']
  const orders: number[] = []
  const savedToken = process.env.TELEGRAM_BOT_TOKEN

  const status = async () => (await payload.findByID({ collection: 'products', id: product.id, depth: 0, overrideAccess: true })).status
  // straight in the database, like the order and sale hooks do — a hand edit of a held item is refused by design
  const setStatus = (s: Product['status']) => moveProducts(payload, undefined, [product.id], ['draft', 'published', 'reserved', 'sold', 'archived'], s)
  const makeOrder = async (s: Order['status']) => {
    const o = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: { status: s, name: 'Test', phone: '555000111', items: [{ product: product.id, title: product.title, sku: product.sku ?? '', price: product.price }], total: product.price },
    })
    orders.push(o.id)
    return o
  }
  const sell = (price?: number) => payload.create({ collection: 'store-sales', overrideAccess: true, data: { product: product.id, price: price as number, payment: 'card' } })

  beforeAll(async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    payload = await getPayload({ config: await config })
    const found = await payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 1, depth: 0, overrideAccess: true })
    product = found.docs[0]
    expect(product, 'needs one published item in the local database (pnpm seed)').toBeTruthy()
    original = product.status
  })

  afterAll(async () => {
    const sales = await payload.find({ collection: 'store-sales', where: { product: { equals: product.id } }, limit: 50, depth: 0, overrideAccess: true })
    for (const s of sales.docs) await payload.db.deleteOne({ collection: 'store-sales', where: { id: { equals: s.id } } })
    for (const id of orders) await payload.db.deleteOne({ collection: 'orders', where: { id: { equals: id } } })
    await setStatus(original)
    if (savedToken) process.env.TELEGRAM_BOT_TOKEN = savedToken
  })

  it('marks the item sold, keeps a snapshot, refuses a second sale, and undoes', async () => {
    const sale = await sell(product.price - 1)
    expect(sale.sku).toBe(product.sku)
    expect(sale.listPrice).toBe(product.price)
    expect(sale.price).toBe(product.price - 1)
    expect(sale.previousStatus).toBe('published')
    const sold = await payload.findByID({ collection: 'products', id: product.id, depth: 0, overrideAccess: true })
    expect(sold.status).toBe('sold')
    expect(sold.soldAt).toBeTruthy()
    await expect(sell()).rejects.toThrow('already_sold')
    await payload.delete({ collection: 'store-sales', id: sale.id, overrideAccess: true })
    expect(await status()).toBe('published')
  })

  it('takes the shelf price when none is given', async () => {
    const sale = await sell()
    expect(sale.price).toBe(product.price)
    await payload.delete({ collection: 'store-sales', id: sale.id, overrideAccess: true })
  })

  it('can sell an item an unpaid request holds, notes it on the order, and undo puts the hold back', async () => {
    const o = await makeOrder('requested')
    await setStatus('reserved')
    const sale = await sell()
    expect(sale.order && typeof sale.order === 'object' ? sale.order.id : sale.order).toBe(o.id)
    expect(await status()).toBe('sold')
    const after = await payload.findByID({ collection: 'orders', id: o.id, depth: 0, overrideAccess: true })
    expect(after.notes).toContain(`${product.sku} გაიყიდა მაღაზიაში`)
    await payload.delete({ collection: 'store-sales', id: sale.id, overrideAccess: true })
    expect(await status()).toBe('reserved')
    await payload.update({ collection: 'orders', id: o.id, data: { status: 'cancelled' }, overrideAccess: true })
    expect(await status()).toBe('published')
  })

  it('refuses an item a customer already paid for online', async () => {
    const o = await makeOrder('paid')
    await setStatus('sold')
    await expect(sell()).rejects.toThrow(`paid_online:${o.number}`)
    await setStatus('published')
  })
})

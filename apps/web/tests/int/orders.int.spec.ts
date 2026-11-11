// @vitest-environment node
import { createLocalReq, getPayload, type Endpoint, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Product } from '@/payload-types'
import { hashIp, MAX_ITEMS, releaseExpired } from '@/collections/Orders'
import { moveProducts } from '@/lib/stock'

/**
 * Order requests and item availability (audit 2026-11-11): one toy can't be reserved twice, limits
 * hold without in-memory state, a valid reward lowers what is paid, and items follow every status change.
 */
describe('order requests and item availability', () => {
  let payload: Payload
  let handler: Endpoint['handler']
  let shelf: Product[] = []
  const originals = new Map<number, Product['status']>()
  const orders: number[] = []
  const rewards: number[] = []
  const savedToken = process.env.TELEGRAM_BOT_TOKEN
  const run = Date.now().toString(36)
  let ipSeq = 0
  let phoneSeq = 100

  const ip = () => `10.${run.length}.${++ipSeq}.${Math.floor(Math.random() * 250)}`
  const phone = () => `5${String(++phoneSeq).padStart(8, '0')}`
  const status = async (id: number) => (await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: true })).status

  async function request(body: Record<string, unknown>, from = ip()) {
    const req = await createLocalReq({ req: { headers: new Headers({ 'x-real-ip': from }) } }, payload)
    req.json = async () => ({ name: 'Test', phone: phone(), locale: 'ka', ...body })
    const res = (await handler(req)) as Response
    const data = await res.json()
    if (data.number) {
      const o = await payload.find({ collection: 'orders', where: { number: { equals: data.number } }, limit: 1, depth: 0, overrideAccess: true })
      if (o.docs[0]) orders.push(o.docs[0].id)
    }
    return { status: res.status, data }
  }
  const orderOf = async (number: string) => (await payload.find({ collection: 'orders', where: { number: { equals: number } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]

  beforeAll(async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    payload = await getPayload({ config: await config })
    handler = payload.collections.orders.config.endpoints ? (payload.collections.orders.config.endpoints as Endpoint[]).find((e) => e.path === '/request')!.handler : (null as never)
    const found = await payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 6, depth: 0, overrideAccess: true, sort: 'id' })
    shelf = found.docs
    for (const p of shelf) originals.set(p.id, p.status)
    expect(shelf.length, 'needs 6 published items in the local database (pnpm seed)').toBeGreaterThanOrEqual(6)
  })

  afterAll(async () => {
    for (const id of orders) await payload.db.deleteOne({ collection: 'orders', where: { id: { equals: id } } })
    for (const id of rewards) await payload.db.deleteOne({ collection: 'rewards', where: { id: { equals: id } } })
    for (const [id, s] of originals) await moveProducts(payload, undefined, [id], ['draft', 'published', 'reserved', 'sold', 'archived'], s)
    if (savedToken) process.env.TELEGRAM_BOT_TOKEN = savedToken
  })

  it('gives a toy to only one of two customers asking at the same moment', async () => {
    const [a, b] = await Promise.all([request({ items: [shelf[0].id] }), request({ items: [shelf[0].id] })])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    expect((a.status === 409 ? a : b).data).toMatchObject({ error: 'unavailable', ids: [shelf[0].id] })
    expect(await status(shelf[0].id)).toBe('reserved')
    // numbers stay unique under load
    const [c, d] = await Promise.all([request({ items: [shelf[1].id] }), request({ items: [shelf[2].id] })])
    expect(c.status).toBe(200)
    expect(d.status).toBe(200)
    expect(c.data.number).not.toBe(d.data.number)
  })

  it('cancelling puts items back; an expired request lets go of them too', async () => {
    const reserved = await orderOf((await payload.find({ collection: 'orders', where: { id: { in: orders } }, sort: 'createdAt', limit: 1, depth: 0, overrideAccess: true })).docs[0].number!)
    await payload.update({ collection: 'orders', id: reserved.id, data: { status: 'cancelled' }, overrideAccess: true })
    expect(await status(shelf[0].id)).toBe('published')

    const r = await request({ items: [shelf[0].id] })
    const o = await orderOf(r.data.number)
    await payload.db.updateOne({ collection: 'orders', id: o.id, data: { reservedUntil: new Date(Date.now() - 60_000).toISOString() } })
    expect(await releaseExpired(payload)).toBeGreaterThanOrEqual(1)
    expect((await orderOf(r.data.number)).status).toBe('expired')
    expect(await status(shelf[0].id)).toBe('published')
  })

  it('limits requests per network and open requests per phone, and the basket size', async () => {
    const tooMany = await request({ items: Array.from({ length: MAX_ITEMS + 1 }, (_, i) => i + 1) })
    expect(tooMany).toMatchObject({ status: 422, data: { error: 'too_many' } })

    const same = phone()
    const first = await request({ items: [shelf[3].id], phone: same })
    const second = await request({ items: [shelf[4].id], phone: same })
    const third = await request({ items: [shelf[5].id], phone: same })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(third).toMatchObject({ status: 409, data: { error: 'open_request' } })

    const busy = ip()
    for (let i = 0; i < 5; i++) {
      const o = await payload.create({ collection: 'orders', overrideAccess: true, data: { status: 'cancelled', name: 'x', phone: phone(), ipHash: hashIp(busy) } })
      orders.push(o.id)
    }
    expect(await request({ items: [shelf[5].id] }, busy)).toMatchObject({ status: 429 })
    for (const n of [first, second]) await payload.update({ collection: 'orders', id: (await orderOf(n.data.number)).id, data: { status: 'cancelled' }, overrideAccess: true })
  })

  it('applies a valid game reward to what the customer pays, and ignores an expired one', async () => {
    const make = async (code: string, expiresAt: string) => {
      const r = await payload.create({ collection: 'rewards', overrideAccess: true, data: { code, percent: 20, status: 'issued', expiresAt } })
      rewards.push(r.id)
    }
    await make(`ZOY-T${run.slice(-4).toUpperCase()}`, new Date(Date.now() + 3600e3).toISOString())
    await make(`ZOY-X${run.slice(-4).toUpperCase()}`, new Date(Date.now() - 3600e3).toISOString())
    const ok = await request({ items: [shelf[3].id], rewardCode: `zoy-t${run.slice(-4)}` })
    expect(ok.status).toBe(200)
    expect(ok.data.payable).toBe(Math.round(shelf[3].price * 80) / 100)
    expect((await orderOf(ok.data.number)).discountPercent).toBe(20)
    const old = await request({ items: [shelf[4].id], rewardCode: `ZOY-X${run.slice(-4).toUpperCase()}` })
    expect(old.data.payable).toBe(old.data.total)
    for (const n of [ok, old]) await payload.update({ collection: 'orders', id: (await orderOf(n.data.number)).id, data: { status: 'cancelled' }, overrideAccess: true })
  })

  it('follows paid → sold → cancelled, and hand edits of the items', async () => {
    const r = await request({ items: [shelf[3].id, shelf[4].id] })
    const o = await orderOf(r.data.number)
    await payload.update({ collection: 'orders', id: o.id, data: { status: 'paid' }, overrideAccess: true })
    expect(await status(shelf[3].id)).toBe('sold')
    await payload.update({ collection: 'orders', id: o.id, data: { status: 'cancelled' }, overrideAccess: true })
    expect(await status(shelf[3].id)).toBe('published')
    expect(await status(shelf[4].id)).toBe('published')

    // an order typed into the admin reserves its items; removing one frees it, adding one reserves it
    const typed = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: { status: 'confirmed', name: 'Phone order', phone: phone(), items: [{ product: shelf[3].id, price: 1 }, { product: shelf[4].id, price: 2 }] },
    })
    orders.push(typed.id)
    expect(await status(shelf[3].id)).toBe('reserved')
    const edited = await payload.update({ collection: 'orders', id: typed.id, data: { items: [{ product: shelf[3].id, price: 1 }, { product: shelf[5].id, price: 4 }] }, overrideAccess: true })
    expect(await status(shelf[4].id)).toBe('published')
    expect(await status(shelf[5].id)).toBe('reserved')
    expect(edited.total).toBe(5)

    // another order can't take what this one holds…
    await expect(
      payload.create({ collection: 'orders', overrideAccess: true, data: { status: 'requested', name: 'x', phone: phone(), items: [{ product: shelf[3].id }] } }),
    ).rejects.toThrow('აღარ არის თავისუფალი')
    // …and a product form saved by hand can't put it back on sale
    await expect(payload.update({ collection: 'products', id: shelf[3].id, data: { status: 'published' }, overrideAccess: true })).rejects.toThrow(typed.number!)
    await payload.update({ collection: 'orders', id: typed.id, data: { status: 'cancelled' }, overrideAccess: true })
    expect(await status(shelf[3].id)).toBe('published')
    expect(await status(shelf[5].id)).toBe('published')
  })

  it('a duplicated item is a new draft with its own SKU and slug', async () => {
    const copy = await payload.duplicate({ collection: 'products', id: shelf[0].id, overrideAccess: true })
    try {
      expect(copy.status).toBe('draft')
      expect(copy.sku).toMatch(/^ZT-\d{6}$/)
      expect(copy.sku).not.toBe(shelf[0].sku)
      expect(copy.slug).not.toBe(shelf[0].slug)
      expect(copy.publishedAt ?? null).toBeNull()
    } finally {
      await payload.delete({ collection: 'products', id: copy.id, overrideAccess: true })
    }
  })
})

// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Endpoint } from 'payload'
import { createLocalReq } from 'payload'
import type { Product } from '@/payload-types'
import { checkReward, normalizeCode } from '@/lib/rewards'

/** The cart's „check the code“ (docs/03): what a game reward is worth for the toys in a cart. */
describe('reward codes', () => {
  let payload: Payload
  let items: Product[] = []
  let campaign: number
  const rewards: number[] = []
  const run = Date.now().toString(36).slice(-5).toUpperCase()
  const code = (tag: string) => `ZOY-${tag}${run}`

  const reward = async (tag: string, data: Record<string, unknown>) => {
    const r = await payload.create({ collection: 'rewards', overrideAccess: true, data: { code: code(tag), percent: 20, status: 'issued', expiresAt: new Date(Date.now() + 3600e3).toISOString(), ...data } })
    rewards.push(r.id)
    return r
  }

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    items = (await payload.find({ collection: 'products', where: { status: { equals: 'published' } }, limit: 3, depth: 0, overrideAccess: true, sort: 'id' })).docs
    expect(items.length, 'needs 3 published items in the local database (pnpm seed)').toBe(3)
    // switched off: it must not show on the site while the test runs
    campaign = (await payload.create({ collection: 'game-campaigns', overrideAccess: true, data: { title: `test ${run}`, active: false, tiers: [{ minScore: 1, percent: 20 }], products: [items[0].id, items[1].id] } })).id
  })

  afterAll(async () => {
    for (const id of rewards) await payload.db.deleteOne({ collection: 'rewards', where: { id: { equals: id } } })
    if (campaign) await payload.db.deleteOne({ collection: 'game-campaigns', where: { id: { equals: campaign } } })
  })

  it('normalises what people type', () => {
    expect(normalizeCode(' zoy-ab 12c ')).toBe('ZOY-AB12C')
    expect(normalizeCode(null)).toBe('')
  })

  it('works on every item when the campaign picks none', async () => {
    await reward('A', {})
    const r = await checkReward(payload, code('A').toLowerCase(), items)
    expect(r).toMatchObject({ ok: true, percent: 20, everything: true, eligible: items.map((p) => p.id) })
    const base = items.reduce((s, p) => s + p.price, 0)
    if (r.ok) expect(r.amount).toBeCloseTo(Math.round(base * 20) / 100, 2)
  })

  it('counts only the toys the campaign ticked', async () => {
    await reward('B', { campaign })
    const r = await checkReward(payload, code('B'), items)
    expect(r).toMatchObject({ ok: true, everything: false, eligible: [items[0].id, items[1].id] })
    if (r.ok) expect(r.amount).toBeCloseTo(Math.round((items[0].price + items[1].price) * 20) / 100, 2)
    expect(await checkReward(payload, code('B'), [items[2]])).toMatchObject({ ok: false, reason: 'no_items', percent: 20 })
  })

  it('says why a code does not work', async () => {
    await reward('C', { status: 'redeemed' })
    await reward('D', { expiresAt: new Date(Date.now() - 1000).toISOString() })
    await reward('E', { status: 'replaced' })
    expect(await checkReward(payload, code('C'), items)).toMatchObject({ ok: false, reason: 'used' })
    expect(await checkReward(payload, code('D'), items)).toMatchObject({ ok: false, reason: 'expired' })
    expect(await checkReward(payload, code('E'), items)).toMatchObject({ ok: false, reason: 'expired' })
    expect(await checkReward(payload, 'ZOY-NOPE0', items)).toMatchObject({ ok: false, reason: 'not_found' })
    expect(await checkReward(payload, '', items)).toMatchObject({ ok: false, reason: 'empty' })
  })

  it('answers the cart through POST /api/rewards/check on the server’s own prices', async () => {
    const handler = (payload.collections.rewards.config.endpoints as Endpoint[]).find((e) => e.path === '/check')!.handler
    const req = await createLocalReq({ req: { headers: new Headers({ 'x-forwarded-for': `10.9.${run.length}.7` }) } }, payload)
    req.json = async () => ({ code: code('B'), items: [items[0].id, items[2].id, 'nonsense', -4] })
    const res = (await handler(req)) as Response
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, eligible: [items[0].id], amount: Math.round(items[0].price * 20) / 100 })
  })
})

// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Order } from '@/payload-types'
import { canMove, digestCard, orderCard, orderKeyboard, parseCallback, parseCommand, rewardState, type OrderCardData } from '@/lib/telegram/cards'
import { fillTemplate, intlPhone, money, templateFor, templateText, whatsappLink } from '@/lib/telegram/templates'
import { sameSecret, webhookSecret } from '@/lib/telegram/secret'
import { handleUpdate, notifyNewOrder, sendDigest } from '@/lib/telegram/bot'

const order = (over: Partial<OrderCardData> = {}): OrderCardData => ({
  id: 7,
  number: 'ZT-0007',
  status: 'requested',
  name: 'Nino',
  phone: '555 12 34 56',
  delivery: 'pickup',
  payment: 'cash',
  total: 63,
  locale: 'ka',
  items: [{ title: 'Rocket', price: 45, sku: 'R-1' }, { title: 'Teddy', price: 18 }],
  ...over,
})

describe('customer messages', () => {
  it('normalises phone numbers for WhatsApp', () => {
    expect(intlPhone('555 12 34 56')).toBe('995555123456')
    expect(intlPhone('0555123456')).toBe('995555123456')
    expect(intlPhone('+995 555 123 456')).toBe('995555123456')
    expect(intlPhone('+7 912 345-67-89')).toBe('79123456789')
    expect(intlPhone('0044 20 7946 0958')).toBe('442079460958')
  })

  it('fills templates in the customer language', () => {
    const text = fillTemplate('{name}: {number} · {items} · {total} · {tracking}', order({ total: 50.4 }), 'ru')
    expect(text).toBe('Nino: ZT-0007 · Rocket, Teddy · 50,40 ₾ · —')
    expect(money(50.4, 'en')).toBe('50.40 ₾')
    expect(money(63)).toBe('63 ₾')
  })

  it('uses the saved text, or the default when the owner left it empty', () => {
    expect(templateText({ msgPickup: 'Come by, {name}!' }, 'pickup', 'en')).toBe('Come by, {name}!')
    expect(templateText({ msgPickup: '   ' }, 'pickup', 'ru')).toContain('готов к выдаче')
    expect(templateText(null, 'confirmed', 'ka')).toContain('დადასტურებულია')
  })

  it('picks the message that fits the order status', () => {
    expect(templateFor({ status: 'requested' })).toBe('confirmed')
    expect(templateFor({ status: 'confirmed', payment: 'transfer' })).toBe('payment')
    expect(templateFor({ status: 'confirmed', payment: 'cash', delivery: 'pickup' })).toBe('pickup')
    expect(templateFor({ status: 'paid', delivery: 'post' })).toBe('shipped')
    expect(templateFor({ status: 'expired' })).toBe('cancelled')
    expect(templateFor({ status: 'completed' })).toBeNull()
  })
})

describe('order cards and buttons', () => {
  it('offers the next steps, and cancelling only before payment', () => {
    expect(canMove(order(), 'confirmed')).toBe(true)
    expect(canMove(order(), 'paid')).toBe(false)
    expect(canMove(order({ status: 'paid', delivery: 'pickup' }), 'completed')).toBe(true)
    expect(canMove(order({ status: 'paid', delivery: 'pickup' }), 'shipped')).toBe(false)
    expect(canMove(order({ status: 'paid', delivery: 'post' }), 'shipped')).toBe(true)
    expect(canMove(order({ status: 'confirmed' }), 'cancelled')).toBe(true)
    expect(canMove(order({ status: 'paid' }), 'cancelled')).toBe(false)
  })

  it('builds the keyboard for the status', () => {
    const kb = orderKeyboard(order(), { whatsappText: 'hi' })
    expect(kb[0].map((b) => b.callback_data)).toEqual(['s:confirmed:7', 'x:7'])
    expect(kb[1][0].url).toBe('https://wa.me/995555123456?text=hi')
    expect(kb.flat().some((b) => b.text.includes('დარეკვა'))).toBe(false)
    const done = orderKeyboard(order({ status: 'completed' }), { site: 'https://shop.test', call: 'https://shop.test/api/telegram/call/7?sig=x' })
    expect(done.flat().some((b) => b.callback_data?.startsWith('s:'))).toBe(false)
    expect(done.flat().map((b) => b.url)).toContain('https://shop.test/admin/collections/orders/7')
  })

  it('escapes customer text and shows a usable reward with the discounted total', () => {
    const text = orderCard(order({ name: '<b>Nino</b>', comment: 'a & b', rewardCode: 'ZOY-AB12C' }), {
      reward: { id: 1, code: 'ZOY-AB12C', percent: 20, status: 'issued', expiresAt: new Date(Date.now() + 3600e3).toISOString() },
    })
    expect(text).toContain('&lt;b&gt;Nino&lt;/b&gt;')
    expect(text).toContain('a &amp; b')
    expect(text).toContain('−20%')
    expect(text).toContain('50,40 ₾')
  })

  it('knows when a reward cannot be used', () => {
    expect(rewardState(null).usable).toBe(false)
    expect(rewardState({ id: 1, code: 'Z', percent: 10, status: 'redeemed' }).usable).toBe(false)
    expect(rewardState({ id: 1, code: 'Z', percent: 10, status: 'issued', expiresAt: '2020-01-01T00:00:00Z' }).usable).toBe(false)
    expect(rewardState({ id: 1, code: 'Z', percent: 10, status: 'issued' }).usable).toBe(true)
  })

  it('parses only well-formed buttons and commands', () => {
    expect(parseCallback('s:confirmed:12')).toEqual({ kind: 'status', status: 'confirmed', id: 12 })
    expect(parseCallback('r:3:0')).toEqual({ kind: 'redeem', rewardId: 3, orderId: 0 })
    expect(parseCallback('l')).toEqual({ kind: 'list' })
    for (const bad of ['s:bogus:1', 's:confirmed:0', 'x:1:2', 'v:abc', 'drop table', '', undefined]) expect(parseCallback(bad)).toBeNull()
    expect(parseCommand('/code@ZoyToyBot zoy-ab12c')).toEqual({ command: 'code', args: 'zoy-ab12c' })
    expect(parseCommand('hello')).toBeNull()
  })

  it('writes a calm digest on quiet days and buttons for open requests', () => {
    const quiet = digestCard({ requested: [], confirmed: [], toShip: [], last24h: { orders: 0, rewards: 2 }, shelf: { published: 9, reserved: 0 } })
    expect(quiet.text).toContain('მშვიდი დღე')
    expect(quiet.keyboard).toHaveLength(0)
    const busy = digestCard({ requested: [order()], confirmed: [], toShip: [], last24h: { orders: 1, rewards: 0 }, shelf: { published: 8, reserved: 2 } })
    expect(busy.keyboard[0][0].url).toBe(whatsappLink('555 12 34 56'))
    expect(busy.keyboard.at(-1)?.[0].callback_data).toBe('l')
  })

  it('derives a webhook secret per bot token', () => {
    const a = webhookSecret('token-a')
    expect(a).toMatch(/^[a-f0-9]{64}$/)
    expect(webhookSecret('token-b')).not.toBe(a)
    expect(sameSecret(a, webhookSecret('token-a'))).toBe(true)
    expect(sameSecret('short', a)).toBe(false)
  })
})

describe('bot against the database (fake Telegram)', () => {
  let payload: Payload
  let created: Order
  const OWNER = 424242
  const calls: { method: string; body: Record<string, unknown> }[] = []
  const env = { token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID }

  const methods = () => calls.map((c) => c.method)
  const last = (method: string) => [...calls].reverse().find((c) => c.method === method)?.body
  const press = (data: string, chat = OWNER) =>
    handleUpdate(payload, { callback_query: { id: 'cb', from: { id: 1, first_name: 'Ana' }, data, message: { message_id: 77, chat: { id: chat, type: 'private' }, text: 'card' } } })
  const say = (text: string, chat = OWNER) => handleUpdate(payload, { message: { message_id: 5, chat: { id: chat, type: 'private' }, text } })
  const statusNow = async () => (await payload.findByID({ collection: 'orders', id: created.id, depth: 0, overrideAccess: true })).status

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    process.env.TELEGRAM_BOT_TOKEN = 'test-token'
    process.env.TELEGRAM_CHAT_ID = String(OWNER)
    vi.stubGlobal('fetch', async (url: string | URL, init?: RequestInit) => {
      const href = String(url)
      if (!href.startsWith('https://api.telegram.org/bottest-token/')) throw new Error(`unexpected fetch: ${href}`)
      calls.push({ method: href.split('/').pop() ?? '', body: typeof init?.body === 'string' ? JSON.parse(init.body) : {} })
      return new Response(JSON.stringify({ ok: true, result: { message_id: 78, username: 'zoytoy_test_bot' } }), { headers: { 'Content-Type': 'application/json' } })
    })
    created = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        status: 'requested',
        name: 'Тест <script>',
        phone: '555 12 34 56',
        delivery: 'pickup',
        payment: 'cash',
        locale: 'ru',
        items: [{ title: 'Тестовая ракета', price: 45 }],
        total: 45,
        reservedUntil: new Date(Date.now() + 86400e3).toISOString(),
      },
    })
  })

  afterAll(async () => {
    if (created) await payload.delete({ collection: 'orders', id: created.id, overrideAccess: true })
    vi.unstubAllGlobals()
    process.env.TELEGRAM_BOT_TOKEN = env.token
    process.env.TELEGRAM_CHAT_ID = env.chat
    if (env.token === undefined) delete process.env.TELEGRAM_BOT_TOKEN
    if (env.chat === undefined) delete process.env.TELEGRAM_CHAT_ID
  })

  beforeEach(() => {
    calls.length = 0
  })

  it('sends a new order to the shop chat with buttons and a Russian WhatsApp text', async () => {
    await notifyNewOrder(payload, created)
    const msg = last('sendMessage')!
    expect(msg.chat_id).toBe(String(OWNER))
    expect(String(msg.text)).toContain(created.number!)
    expect(String(msg.text)).toContain('&lt;script&gt;')
    const kb = (msg.reply_markup as { inline_keyboard: { callback_data?: string; url?: string }[][] }).inline_keyboard
    expect(kb[0].map((b) => b.callback_data)).toEqual([`s:confirmed:${created.id}`, `x:${created.id}`])
    const wa = decodeURIComponent(kb[1][0].url!)
    expect(wa).toContain('https://wa.me/995555123456?text=')
    expect(wa).toContain('Здравствуйте')
  })

  it('ignores buttons pressed outside the shop chat', async () => {
    await press(`s:confirmed:${created.id}`, 999)
    expect(await statusNow()).toBe('requested')
    expect(last('answerCallbackQuery')?.show_alert).toBe(true)
  })

  it('confirms an order from its button and redraws the card', async () => {
    await press(`s:confirmed:${created.id}`)
    expect(await statusNow()).toBe('confirmed')
    expect(String(last('editMessageText')?.text)).toContain('დადასტურებული')
    expect(String(last('editMessageText')?.text)).toContain('Ana')
    expect(methods()).toContain('answerCallbackQuery')
  })

  it('refuses a step that no longer fits (stale button)', async () => {
    await press(`s:shipped:${created.id}`)
    expect(await statusNow()).toBe('confirmed')
    expect(last('answerCallbackQuery')?.show_alert).toBe(true)
  })

  it('asks before cancelling, then cancels', async () => {
    await press(`x:${created.id}`)
    const kb = (last('editMessageReplyMarkup')?.reply_markup as { inline_keyboard: { callback_data?: string }[][] }).inline_keyboard
    expect(kb[0].map((b) => b.callback_data)).toEqual([`s:cancelled:${created.id}`, `b:${created.id}`])
    expect(await statusNow()).toBe('confirmed')
    await press(`s:cancelled:${created.id}`)
    expect(await statusNow()).toBe('cancelled')
  })

  it('tells strangers their chat id on /start and nothing else', async () => {
    await say('/start', 31337)
    expect(last('sendMessage')?.chat_id).toBe(31337)
    expect(String(last('sendMessage')?.text)).toContain('31337')
    calls.length = 0
    await say('/orders', 31337)
    expect(calls).toHaveLength(0)
  })

  it('answers the owner: open orders, reward codes, digest', async () => {
    await say('/orders')
    expect(String(last('sendMessage')?.text)).toMatch(/შეკვეთ/)
    await say('ZOY-NOPE1 please check')
    expect(String(last('sendMessage')?.text)).toContain('ვერ მოიძებნა')
    expect(await sendDigest(payload, { force: true })).toBe('sent')
    expect(String(last('sendMessage')?.text)).toContain('დილა მშვიდობისა')
  })
})

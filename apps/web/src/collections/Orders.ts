import crypto from 'crypto'
import { APIError, commitTransaction, initTransaction, killTransaction, type CollectionBeforeChangeHook, type CollectionConfig, type Endpoint, type Payload } from 'payload'
import type { Order, Product } from '../payload-types'
import { isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { HOLD, highestNumber, itemIds, lockNumbers, moveProducts, releaseItems, relId } from '../lib/stock'
import { inBackground, notifyNewOrder } from '../lib/telegram/bot'

const RESERVE_HOURS = 24
/** One request holds at most this many toys — enough for a real basket, too few to empty the shelf. */
export const MAX_ITEMS = 6
/** Requests per network address per 24 h, and open (unanswered) requests per phone — counted in the database. */
const MAX_PER_IP = 5
const MAX_OPEN_PER_PHONE = 2
const DELIVERY = ['pickup', 'courier', 'post', 'bus'] as const
const PAYMENT = ['cash', 'transfer', 'link'] as const
const round = (n: number) => Math.round(n * 100) / 100
export const hashIp = (ip: string) => crypto.createHmac('sha256', process.env.PAYLOAD_SECRET || 'dev').update(`order-ip:${ip}`).digest('hex').slice(0, 16)

/** Puts reserved items back on the shelf when a request was never confirmed (docs/08 §4). */
export async function releaseExpired(payload: Payload) {
  const expired = await payload.find({
    collection: 'orders',
    where: { and: [{ status: { equals: 'requested' } }, { reservedUntil: { less_than: new Date().toISOString() } }] },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  let released = 0
  for (const o of expired.docs) {
    try {
      // conditional: a request the owner confirmed a moment ago stays as it is
      const res = await payload.update({ collection: 'orders', where: { and: [{ id: { equals: o.id } }, { status: { equals: 'requested' } }] }, data: { status: 'expired' }, overrideAccess: true })
      released += res.docs.length
      for (const e of res.errors ?? []) payload.logger.warn(`Expiring ${o.number} failed: ${e.message}`)
    } catch (e) {
      // one broken order must not stop the others, nor the customer request that triggered this
      payload.logger.warn(`Expiring ${o.number} failed: ${String(e)}`)
    }
  }
  return released
}

/**
 * Keeps the items in step with the order (docs/08 §3.2): an open request holds them `reserved`, a paid
 * order `sold`; cancelled/expired lets them go unless another order holds them. Works for status
 * changes, items added or removed by hand, and orders typed into the admin. Runs before the save, in
 * the same transaction, so an item that is no longer free stops the save with a clear message.
 */
const syncItems: CollectionBeforeChangeHook<Order> = async ({ data, originalDoc, operation, req, context }) => {
  if (context?.itemsClaimed) return data // POST /request reserved them already, atomically
  const payload = req.payload
  const prevStatus = operation === 'update' ? originalDoc?.status : undefined
  const nextStatus = data.status ?? prevStatus ?? 'requested'
  const before = prevStatus ? HOLD[prevStatus] : undefined
  const after = HOLD[nextStatus]
  const prevIds = operation === 'update' ? itemIds(originalDoc?.items) : []
  const nextIds = data.items ? itemIds(data.items) : prevIds
  const self = originalDoc?.id

  const dropped = before ? (after ? prevIds.filter((id) => !nextIds.includes(id)) : prevIds) : []
  if (dropped.length) await releaseItems(payload, req, dropped, before!, self)

  if (after) {
    const fresh = before ? nextIds.filter((id) => !prevIds.includes(id)) : nextIds
    const kept = before ? nextIds.filter((id) => prevIds.includes(id)) : []
    if (kept.length && before !== after) await moveProducts(payload, req, kept, [before!], after)
    if (fresh.length) {
      const got = await moveProducts(payload, req, fresh, ['published', 'draft'], after)
      const missing = fresh.filter((id) => !got.includes(id))
      if (missing.length) {
        const items = data.items ?? originalDoc?.items ?? []
        const names = missing.map((id) => items.find((i) => relId(i.product) === id)?.sku || `#${id}`).join(', ')
        throw new APIError(`ნივთი აღარ არის თავისუფალი (სხვა შეკვეთაშია ან გაყიდულია): ${names}`, 409, null, true)
      }
    }
  }
  // hand edits of the items keep the total right, unless the total was changed in the same save
  if (operation === 'update' && data.items && (data.total == null || data.total === originalDoc?.total)) {
    data.total = round(data.items.reduce((s, i) => s + Number(i.price ?? 0), 0))
  }
  return data
}

/** ZT-0001, ZT-0002… — under a lock, so two requests at the same moment can't take the same number. */
const assignNumber: CollectionBeforeChangeHook<Order> = async ({ data, operation, req }) => {
  if (operation !== 'create' || data.number) return data
  await lockNumbers(req.payload, req, 'orders.number')
  const n = (await highestNumber(req.payload, req, 'orders', 'number')) + 1
  return { ...data, number: `ZT-${String(n).padStart(4, '0')}` }
}

/** A valid game reward lowers what the customer pays — only on the campaign's categories, if it names any. */
async function rewardDiscount(payload: Payload, code: string, items: Product[]) {
  if (!code) return null
  const found = await payload.find({
    collection: 'rewards',
    where: { and: [{ code: { equals: code } }, { status: { equals: 'issued' } }, { or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: new Date().toISOString() } }] }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const reward = found.docs[0]
  if (!reward) return null
  const campaign = reward.campaign && typeof reward.campaign === 'object' ? reward.campaign : null
  const cats = (campaign?.categories ?? []).map(relId).filter(Boolean)
  const eligible = cats.length ? items.filter((p) => (p.categories ?? []).some((c) => cats.includes(relId(c)))) : items
  const base = eligible.reduce((s, p) => s + Number(p.price ?? 0), 0)
  return { percent: reward.percent, amount: round((base * reward.percent) / 100) }
}

const requestEndpoint: Endpoint = {
  path: '/request',
  method: 'post',
  handler: async (req) => {
    const payload = req.payload
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    const body = (await req.json?.().catch(() => null)) as Record<string, unknown> | null
    if (!body) return Response.json({ error: 'bad_request' }, { status: 400 })

    const name = String(body.name ?? '').trim().slice(0, 80)
    const phone = String(body.phone ?? '').replace(/[^\d+]/g, '').slice(0, 16)
    const raw = Array.isArray(body.items) ? body.items.map(Number).filter((n) => Number.isInteger(n) && n > 0) : []
    const ids = [...new Set(raw)]
    const delivery = DELIVERY.includes(body.delivery as never) ? (body.delivery as string) : 'pickup'
    const payment = PAYMENT.includes(body.payment as never) ? (body.payment as string) : 'cash'
    const locale = ['ka', 'ru', 'en'].includes(String(body.locale)) ? String(body.locale) : 'ka'
    if (!name) return Response.json({ error: 'name' }, { status: 422 })
    if (phone.replace(/\D/g, '').length < 9) return Response.json({ error: 'phone' }, { status: 422 })
    if (!ids.length) return Response.json({ error: 'empty' }, { status: 422 })
    if (ids.length > MAX_ITEMS) return Response.json({ error: 'too_many', max: MAX_ITEMS }, { status: 422 })

    await releaseExpired(payload).catch((e) => payload.logger.warn(`releaseExpired: ${String(e)}`))
    // limits live in the database: serverless instances share no memory
    const ipHash = hashIp(ip)
    const [fromIp, open] = await Promise.all([
      payload.count({ collection: 'orders', where: { and: [{ ipHash: { equals: ipHash } }, { createdAt: { greater_than: new Date(Date.now() - 24 * 3600e3).toISOString() } }] }, overrideAccess: true }),
      payload.find({ collection: 'orders', where: { and: [{ phone: { equals: phone } }, { status: { equals: 'requested' } }] }, sort: '-createdAt', limit: MAX_OPEN_PER_PHONE, depth: 0, overrideAccess: true }),
    ])
    if (fromIp.totalDocs >= MAX_PER_IP) return Response.json({ error: 'rate_limited' }, { status: 429 })
    if (open.docs.length >= MAX_OPEN_PER_PHONE) return Response.json({ error: 'open_request', number: open.docs[0].number }, { status: 409 })

    const found = await payload.find({ collection: 'products', where: { id: { in: ids } }, locale: locale as 'ka', depth: 0, limit: MAX_ITEMS, overrideAccess: true })
    const items = ids.map((id) => found.docs.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))
    const total = round(items.reduce((s, p) => s + Number(p.price ?? 0), 0))
    const rewardCode = String(body.rewardCode ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20)
    const discount = await rewardDiscount(payload, rewardCode, items).catch(() => null)
    const reservedUntil = new Date(Date.now() + RESERVE_HOURS * 3600 * 1000).toISOString()

    let order: Order
    await initTransaction(req)
    try {
      // reserve first, in one statement: of two customers asking for the same toy, only one gets it
      const claimed = await moveProducts(payload, req, items.map((p) => p.id), ['published'], 'reserved')
      const unavailable = ids.filter((id) => !claimed.includes(id))
      if (unavailable.length) {
        await killTransaction(req)
        return Response.json({ error: 'unavailable', ids: unavailable }, { status: 409 })
      }
      order = await payload.create({
        collection: 'orders',
        overrideAccess: true,
        req,
        context: { itemsClaimed: true },
        data: {
          status: 'requested',
          name,
          phone,
          city: String(body.city ?? '').slice(0, 60),
          delivery: delivery as never,
          payment: payment as never,
          gift: Boolean(body.gift),
          giftNote: String(body.giftNote ?? '').slice(0, 300),
          comment: String(body.comment ?? '').slice(0, 600),
          rewardCode,
          discountPercent: discount?.percent ?? null,
          payable: discount ? round(total - discount.amount) : null,
          locale: locale as never,
          items: items.map((p) => ({ product: p.id, title: p.title, sku: p.sku ?? '', price: Number(p.price ?? 0) })),
          total,
          reservedUntil,
          ipHash,
        },
      })
      await commitTransaction(req)
    } catch (e) {
      await killTransaction(req)
      throw e
    }
    // the shop's Telegram hears about it after the customer already has the answer
    inBackground(
      () => notifyNewOrder(payload, order),
      (e) => payload.logger.warn(`Telegram notify failed: ${String(e)}`),
    )
    return Response.json({ number: order.number, reservedUntil, total, payable: order.payable ?? total })
  },
}

const releaseEndpoint: Endpoint = {
  path: '/release-expired',
  method: 'get',
  handler: async (req) => {
    const secret = process.env.CRON_SECRET
    const auth = req.headers.get('authorization')
    if (!req.user && (!secret || auth !== `Bearer ${secret}`)) return Response.json({ error: 'forbidden' }, { status: 403 })
    return Response.json({ released: await releaseExpired(req.payload) })
  },
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: L('შეკვეთის მოთხოვნა', 'Запрос заказа', 'Order request'), plural: L('შეკვეთები', 'Заказы', 'Orders') },
  admin: {
    useAsTitle: 'number',
    defaultColumns: ['number', 'status', 'name', 'phone', 'total', 'createdAt'],
    listSearchableFields: ['number', 'name', 'phone'],
    group: L('გაყიდვები', 'Продажи', 'Sales'),
  },
  access: { read: isTeam, create: isTeam, update: isTeam, delete: ({ req }) => Boolean(req.user?.roles?.includes('admin')) },
  endpoints: [requestEndpoint, releaseEndpoint],
  hooks: {
    beforeChange: [assignNumber, syncItems],
  },
  fields: [
    { name: 'number', type: 'text', unique: true, index: true, label: L('ნომერი', 'Номер', 'Number'), admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      index: true,
      label: L('სტატუსი', 'Статус', 'Status'),
      admin: { position: 'sidebar', description: L('„გადახდილი“ ნივთს გაყიდულად ნიშნავს, „გაუქმებული“ — თაროზე აბრუნებს', '«Оплачен» отмечает товар проданным, «Отменён» — возвращает на полку', '“Paid” marks items sold, “Cancelled” puts them back on the shelf') },
      options: [
        { value: 'requested', label: L('ახალი მოთხოვნა', 'Новый запрос', 'New request') },
        { value: 'confirmed', label: L('დადასტურებული', 'Подтверждён', 'Confirmed') },
        { value: 'paid', label: L('გადახდილი', 'Оплачен', 'Paid') },
        { value: 'shipped', label: L('გაგზავნილი', 'Отправлен', 'Shipped') },
        { value: 'completed', label: L('დასრულებული', 'Завершён', 'Completed') },
        { value: 'cancelled', label: L('გაუქმებული', 'Отменён', 'Cancelled') },
        { value: 'expired', label: L('ვადაგასული (24 სთ)', 'Истёк (24 ч)', 'Expired (24 h)') },
      ],
    },
    { name: 'reservedUntil', type: 'date', label: L('დაჯავშნილია მდე', 'Бронь до', 'Reserved until'), admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    // ready-made messages to the customer: WhatsApp / Telegram / copy (docs/08 §3.2)
    { name: 'customerMessages', type: 'ui', admin: { position: 'sidebar', components: { Field: '/components/admin/OrderMessages#OrderMessages' } } },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, label: L('სახელი', 'Имя', 'Name') },
        { name: 'phone', type: 'text', required: true, label: L('ტელეფონი', 'Телефон', 'Phone') },
        { name: 'city', type: 'text', label: L('ქალაქი', 'Город', 'City') },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'delivery', type: 'select', defaultValue: 'pickup', label: L('მიწოდება', 'Доставка', 'Delivery'),
          options: [
            { value: 'pickup', label: L('გატანა მაღაზიიდან', 'Самовывоз', 'Pickup') },
            { value: 'courier', label: L('კურიერი ბათუმში', 'Курьер по Батуми', 'Courier in Batumi') },
            { value: 'post', label: L('საქართველოს ფოსტა', 'Почта Грузии', 'Georgian Post') },
            { value: 'bus', label: L('ავტობუსით', 'Автобусом', 'By bus') },
          ],
        },
        {
          name: 'payment', type: 'select', defaultValue: 'cash', label: L('გადახდა', 'Оплата', 'Payment'),
          options: [
            { value: 'cash', label: L('ნაღდი', 'Наличные', 'Cash') },
            { value: 'transfer', label: L('გადარიცხვა', 'Перевод', 'Bank transfer') },
            { value: 'link', label: L('ბანკის ბმული', 'Ссылка банка', 'Bank payment link') },
          ],
        },
        { name: 'tracking', type: 'text', label: L('თრექინგი / მძღოლის ნომერი', 'Трекинг / телефон водителя', 'Tracking / driver phone') },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: L('ნივთები', 'Товары', 'Items'),
      labels: { singular: L('ნივთი', 'Товар', 'Item'), plural: L('ნივთები', 'Товары', 'Items') },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products', label: L('ნივთი', 'Товар', 'Item') },
            { name: 'title', type: 'text', label: L('სახელი (შეკვეთისას)', 'Название (на момент заказа)', 'Title (at order time)') },
            { name: 'sku', type: 'text', label: 'SKU' },
            { name: 'price', type: 'number', label: L('ფასი ₾', 'Цена ₾', 'Price ₾') },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'total', type: 'number', label: L('ჯამი ₾', 'Итого ₾', 'Total ₾'), admin: { width: '33%' } },
        { name: 'discountPercent', type: 'number', min: 0, max: 100, label: L('ჯილდოს ფასდაკლება %', 'Скидка по награде %', 'Reward discount %'), admin: { width: '33%', readOnly: true, condition: (d) => Boolean(d?.discountPercent) } },
        { name: 'payable', type: 'number', label: L('გადასახდელი ₾ (ფასდაკლებით)', 'К оплате ₾ (со скидкой)', 'To pay ₾ (discounted)'), admin: { width: '33%', condition: (d) => d?.payable != null } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'gift', type: 'checkbox', label: L('საჩუქარია', 'Подарок', 'Gift') },
        { name: 'rewardCode', type: 'text', label: L('თამაშის ჯილდოს კოდი', 'Код награды из игры', 'Game reward code') },
        { name: 'locale', type: 'select', defaultValue: 'ka', label: L('ენა', 'Язык', 'Language'), options: ['ka', 'ru', 'en'] },
      ],
    },
    { name: 'giftNote', type: 'textarea', label: L('მისალოცი', 'Поздравление', 'Gift note') },
    { name: 'comment', type: 'textarea', label: L('კომენტარი', 'Комментарий', 'Comment') },
    { name: 'notes', type: 'textarea', label: L('შიდა შენიშვნა', 'Внутренняя заметка', 'Internal note') },
    // which network a website request came from (keyed hash, not the address) — for the per-day limit
    { name: 'ipHash', type: 'text', index: true, admin: { hidden: true }, access: { read: () => false, update: () => false } },
  ],
}

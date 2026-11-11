import type { CollectionAfterChangeHook, CollectionConfig, Endpoint, Payload } from 'payload'
import { isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { inBackground, notifyNewOrder } from '../lib/telegram/bot'

const RESERVE_HOURS = 24
const DELIVERY = ['pickup', 'courier', 'post', 'bus'] as const
const PAYMENT = ['cash', 'transfer', 'link'] as const

/** Puts reserved items back on the shelf when a request was never confirmed (docs/08 §4). */
export async function releaseExpired(payload: Payload) {
  const expired = await payload.find({
    collection: 'orders',
    where: { and: [{ status: { equals: 'requested' } }, { reservedUntil: { less_than: new Date().toISOString() } }] },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  for (const o of expired.docs) {
    await payload.update({ collection: 'orders', id: o.id, data: { status: 'expired' }, overrideAccess: true })
  }
  return expired.totalDocs
}

/** Keep product status in step with the order: reserved → sold, or back on the shelf. */
const syncProducts: CollectionAfterChangeHook = async ({ doc, previousDoc, req, operation }) => {
  if (operation !== 'update' || doc.status === previousDoc?.status) return doc
  const ids = (doc.items ?? []).map((i: { product?: number | { id: number } }) => (typeof i.product === 'object' ? i.product?.id : i.product)).filter(Boolean)
  const next = ['paid', 'shipped', 'completed'].includes(doc.status) ? 'sold' : ['cancelled', 'expired'].includes(doc.status) ? 'published' : null
  if (!next) return doc
  for (const id of ids) {
    const p = await req.payload.findByID({ collection: 'products', id, depth: 0, req, overrideAccess: true }).catch(() => null)
    if (!p) continue
    // only touch items this order is holding
    if (next === 'published' && p.status !== 'reserved') continue
    if (next === 'sold' && p.status === 'sold') continue
    await req.payload.update({ collection: 'products', id, data: { status: next }, req, overrideAccess: true })
  }
  return doc
}

const hits = new Map<string, number[]>()
function rateLimited(key: string, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now()
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  list.push(now)
  hits.set(key, list)
  return list.length > max
}

const requestEndpoint: Endpoint = {
  path: '/request',
  method: 'post',
  handler: async (req) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
    if (rateLimited(ip)) return Response.json({ error: 'rate_limited' }, { status: 429 })
    const body = (await req.json?.().catch(() => null)) as Record<string, unknown> | null
    if (!body) return Response.json({ error: 'bad_request' }, { status: 400 })

    const name = String(body.name ?? '').trim().slice(0, 80)
    const phone = String(body.phone ?? '').replace(/[^\d+]/g, '').slice(0, 16)
    const ids = Array.isArray(body.items) ? body.items.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 20) : []
    const delivery = DELIVERY.includes(body.delivery as never) ? (body.delivery as string) : 'pickup'
    const payment = PAYMENT.includes(body.payment as never) ? (body.payment as string) : 'cash'
    const locale = ['ka', 'ru', 'en'].includes(String(body.locale)) ? String(body.locale) : 'ka'
    if (!name) return Response.json({ error: 'name' }, { status: 422 })
    if (phone.replace(/\D/g, '').length < 9) return Response.json({ error: 'phone' }, { status: 422 })
    if (!ids.length) return Response.json({ error: 'empty' }, { status: 422 })

    await releaseExpired(req.payload)
    const found = await req.payload.find({ collection: 'products', where: { id: { in: ids } }, locale: locale as 'ka', depth: 0, limit: 20, overrideAccess: true })
    const available = found.docs.filter((p) => p.status === 'published')
    const unavailable = ids.filter((id) => !available.some((p) => p.id === id))
    if (unavailable.length) return Response.json({ error: 'unavailable', ids: unavailable }, { status: 409 })

    const total = available.reduce((s, p) => s + Number(p.price ?? 0), 0)
    const reservedUntil = new Date(Date.now() + RESERVE_HOURS * 3600 * 1000).toISOString()
    const order = await req.payload.create({
      collection: 'orders',
      overrideAccess: true,
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
        rewardCode: String(body.rewardCode ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20),
        locale: locale as never,
        items: available.map((p) => ({ product: p.id, title: p.title, sku: p.sku ?? '', price: Number(p.price ?? 0) })),
        total,
        reservedUntil,
      },
    })
    for (const p of available) {
      await req.payload.update({ collection: 'products', id: p.id, data: { status: 'reserved' }, overrideAccess: true })
    }
    // the shop's Telegram hears about it after the customer already has the answer
    inBackground(
      () => notifyNewOrder(req.payload, order),
      (e) => req.payload.logger.warn(`Telegram notify failed: ${String(e)}`),
    )
    return Response.json({ number: order.number, reservedUntil, total })
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
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.number) {
          const last = await req.payload.find({ collection: 'orders', sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true })
          const n = (Number(String(last.docs[0]?.number ?? '0').replace(/\D/g, '')) || 0) + 1
          data.number = `ZT-${String(n).padStart(4, '0')}`
        }
        return data
      },
    ],
    afterChange: [syncProducts],
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
    { name: 'total', type: 'number', label: L('ჯამი ₾', 'Итого ₾', 'Total ₾') },
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
  ],
}

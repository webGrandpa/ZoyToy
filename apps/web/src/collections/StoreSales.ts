import {
  APIError,
  type Access,
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Endpoint,
  type PayloadRequest,
  type Where,
} from 'payload'
import type { Order, Product, StoreSale, User } from '../payload-types'
import { isAdmin, isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { discountPercent, parseScan, SALE_PAYMENTS, saleTotals, shopDayStart, UNDO_MINUTES } from '../lib/store'
import { when } from '../lib/telegram/cards'
import { moveProducts } from '../lib/stock'
import { inBackground, notifyStoreSaleConflict } from '../lib/telegram/bot'
import { asLang } from '../lib/telegram/templates'
import { CONDITIONS } from './Products'

/**
 * Sales at the counter (docs/04 „მაღაზიაში გაყიდვა“). One record per item: the item goes `sold` on the
 * site at once, the online and the shop sale can't both happen — an item an online customer has
 * already paid for is refused — and the records make the day report. Deleting a record is the undo.
 */

const UNPAID = ['requested', 'confirmed']
const PAID = ['paid', 'shipped', 'completed']

const relId = (v: unknown): number | undefined => (v && typeof v === 'object' ? (v as { id: number }).id : typeof v === 'number' ? v : Number(v) || undefined)
const roles = (u: unknown) => ((u as { roles?: string[] } | null)?.roles ?? [])
const isTeamUser = (u: unknown) => roles(u).some((r) => r === 'admin' || r === 'staff')

async function holdingOrder(req: PayloadRequest, productId: number, statuses: string[]) {
  const found = await req.payload.find({
    collection: 'orders',
    where: { and: [{ 'items.product': { equals: productId } }, { status: { in: statuses } }] },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    req,
    overrideAccess: true,
  })
  return (found.docs[0] as Order | undefined) ?? null
}

/** Fills in the snapshot (title, SKU, shelf price, who) and refuses items that are already gone. */
const prepare: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  const id = relId(data.product)
  if (!id) throw new APIError('product', 400, null, true)
  const p = await req.payload.findByID({ collection: 'products', id, depth: 0, locale: 'ka', req, overrideAccess: true }).catch(() => null)
  if (!p) throw new APIError('not_found', 404, null, true)
  if (p.status === 'sold') {
    const paid = await holdingOrder(req, id, PAID)
    throw new APIError(paid ? `paid_online:${paid.number ?? paid.id}` : 'already_sold', 409, null, true)
  }
  const open = p.status === 'reserved' ? await holdingOrder(req, id, UNPAID) : null
  const asked = data.price === '' || data.price == null ? NaN : Number(data.price)
  return {
    ...data,
    product: id,
    title: p.title,
    sku: p.sku ?? '',
    listPrice: Number(p.price ?? 0),
    price: Number.isFinite(asked) && asked >= 0 ? Math.round(asked * 100) / 100 : Number(p.price ?? 0),
    payment: (SALE_PAYMENTS as readonly string[]).includes(String(data.payment)) ? data.payment : 'cash',
    phone: String(data.phone ?? '').replace(/[^\d+]/g, '').slice(0, 16),
    note: String(data.note ?? '').slice(0, 300),
    order: open?.id ?? null,
    previousStatus: p.status,
    soldBy: req.user?.id ?? null,
  }
}

/** The item leaves the site; an online request that was holding it gets a note, and the owner a Telegram message. */
const settle: CollectionAfterChangeHook<StoreSale> = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  const productId = relId(doc.product)
  // straight in the database: a half-filled product form must not block the till (lib/stock.ts)
  if (productId) {
    const moved = await moveProducts(req.payload, req, [productId], ['published', 'reserved', 'draft', 'archived'], 'sold')
    if (!moved.length) throw new APIError('already_sold', 409, null, true) // sold online a moment ago
  }
  const orderId = relId(doc.order)
  const order = orderId ? await req.payload.findByID({ collection: 'orders', id: orderId, depth: 0, req, overrideAccess: true }).catch(() => null) : null
  if (order) {
    const line = `🛒 ${doc.sku} გაიყიდა მაღაზიაში ${when(doc.createdAt)} — მყიდველს აცნობე`
    await req.payload.update({ collection: 'orders', id: order.id, data: { notes: [order.notes, line].filter(Boolean).join('\n') }, req, overrideAccess: true })
    inBackground(
      () => notifyStoreSaleConflict(req.payload, doc, order),
      (e) => req.payload.logger.warn(`Telegram store-sale notice failed: ${String(e)}`),
    )
  }
  return doc
}

/** Undo: the item goes back to where it was — reserved again if its online request is still open. */
const restore: CollectionAfterDeleteHook<StoreSale> = async ({ doc, req }) => {
  const id = relId(doc.product)
  if (!id) return doc
  const p = await req.payload.findByID({ collection: 'products', id, depth: 0, req, overrideAccess: true }).catch(() => null)
  if (!p || p.status !== 'sold') return doc
  if (await holdingOrder(req, id, PAID)) return doc // sold online in the meantime
  const open = await holdingOrder(req, id, UNPAID)
  const before = doc.previousStatus
  const next = open ? 'reserved' : before === 'draft' || before === 'archived' ? before : 'published'
  await moveProducts(req.payload, req, [id], ['sold'], next)
  return doc
}

/** Owner: any time. Staff: only a fresh mistake. */
const canUndo: Access = ({ req }) => {
  const r = roles(req.user)
  if (r.includes('admin')) return true
  if (r.includes('staff')) return { createdAt: { greater_than: new Date(Date.now() - UNDO_MINUTES * 60_000).toISOString() } }
  return false
}

const forbidden = () => Response.json({ error: 'forbidden' }, { status: 403 })

/** GET /api/store-sales/lookup?q=ZT-000123 | label/page link | words  (or ?id=12) — items with their sale state. */
const lookup: Endpoint = {
  path: '/lookup',
  method: 'get',
  handler: async (req) => {
    if (!isTeamUser(req.user)) return forbidden()
    const lang = asLang(req.searchParams.get('lang'))
    const id = Number(req.searchParams.get('id'))
    let where: Where
    if (Number.isInteger(id) && id > 0) where = { id: { equals: id } }
    else {
      const scan = parseScan(String(req.searchParams.get('q') ?? ''))
      if ('sku' in scan) where = { sku: { equals: scan.sku } }
      else if ('slug' in scan) where = { slug: { equals: scan.slug } }
      else if (scan.text.length >= 2) where = { or: [{ title: { like: scan.text } }, { sku: { like: scan.text } }] }
      else return Response.json({ items: [] })
    }
    const found = await req.payload.find({ collection: 'products', where, limit: 8, depth: 1, locale: lang, sort: '-updatedAt', req, overrideAccess: true })
    const items = await Promise.all(found.docs.map((p) => describe(req, p, lang)))
    return Response.json({ items })
  },
}

async function describe(req: PayloadRequest, p: Product, lang: 'ka' | 'ru' | 'en') {
  const main = p.gallery?.find((g) => g.role === 'main') ?? p.gallery?.[0]
  const media = main?.image && typeof main.image === 'object' ? main.image : null
  let order: Order | null = null
  let sale: StoreSale | null = null
  if (p.status === 'reserved') order = await holdingOrder(req, p.id, UNPAID)
  if (p.status === 'sold') {
    order = await holdingOrder(req, p.id, PAID)
    if (!order) {
      const last = await req.payload.find({ collection: 'store-sales', where: { product: { equals: p.id } }, sort: '-createdAt', limit: 1, depth: 0, req, overrideAccess: true })
      sale = last.docs[0] ?? null
    }
  }
  return {
    id: p.id,
    title: p.title,
    sku: p.sku ?? '',
    slug: p.slug ?? '',
    price: Number(p.price ?? 0),
    status: p.status,
    condition: CONDITIONS.find((c) => c.value === p.condition)?.label[lang] ?? p.condition,
    image: media?.sizes?.thumb?.url ?? media?.url ?? null,
    order: order ? { id: order.id, number: order.number ?? `#${order.id}`, status: order.status } : null,
    sale: sale ? { id: sale.id, price: sale.price, at: sale.createdAt } : null,
  }
}

/** GET /api/store-sales/today — the counter's day report (Batumi day). */
const today: Endpoint = {
  path: '/today',
  method: 'get',
  handler: async (req) => {
    if (!isTeamUser(req.user)) return forbidden()
    const admin = roles(req.user).includes('admin')
    const since = shopDayStart()
    const found = await req.payload.find({
      collection: 'store-sales',
      where: { createdAt: { greater_than_equal: since.toISOString() } },
      sort: '-createdAt',
      limit: 500,
      pagination: false,
      depth: 1,
      req,
      overrideAccess: true,
    })
    const fresh = Date.now() - UNDO_MINUTES * 60_000
    const sales = found.docs.map((s) => {
      const by = s.soldBy && typeof s.soldBy === 'object' ? (s.soldBy as User) : null
      return {
        id: s.id,
        title: s.title,
        sku: s.sku,
        price: s.price,
        listPrice: s.listPrice,
        discount: discountPercent(s.listPrice, s.price),
        payment: s.payment,
        at: s.createdAt,
        by: by ? by.name || by.email.split('@')[0] : null,
        canUndo: admin || new Date(s.createdAt).getTime() > fresh,
      }
    })
    return Response.json({ since: since.toISOString(), sales, totals: saleTotals(found.docs) })
  },
}

export const StoreSales: CollectionConfig = {
  slug: 'store-sales',
  labels: { singular: L('გაყიდვა მაღაზიაში', 'Продажа в магазине', 'In-store sale'), plural: L('მაღაზიაში გაყიდვები', 'Продажи в магазине', 'In-store sales') },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'price', 'payment', 'soldBy', 'createdAt'],
    listSearchableFields: ['title', 'sku', 'phone'],
    group: L('გაყიდვები', 'Продажи', 'Sales'),
    description: L(
      'ახალი გაყიდვა — „🛒 მაღაზიაში გაყიდვა“ ეკრანიდან (QR სკანერით). ჩანაწერის წაშლა გაყიდვას აუქმებს და ნივთს თაროზე აბრუნებს.',
      'Новая продажа — с экрана «🛒 Продажа в магазине» (со сканером QR). Удаление записи отменяет продажу и возвращает товар на полку.',
      'New sales come from the “🛒 In-store sale” screen (with the QR scanner). Deleting a record undoes the sale and puts the item back on the shelf.',
    ),
  },
  access: { read: isTeam, create: isTeam, update: isAdmin, delete: canUndo },
  endpoints: [lookup, today],
  hooks: { beforeValidate: [prepare], afterChange: [settle], afterDelete: [restore] },
  fields: [
    // not required at the database level: deleting a product keeps its sale history (title and SKU are snapshots);
    // the beforeValidate hook still refuses a new sale without one
    { name: 'product', type: 'relationship', relationTo: 'products', index: true, label: L('ნივთი', 'Товар', 'Item') },
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', label: L('სახელი (გაყიდვისას)', 'Название (на момент продажи)', 'Title (at sale)'), admin: { readOnly: true } },
        { name: 'sku', type: 'text', index: true, label: 'SKU', admin: { readOnly: true } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', min: 0, required: true, label: L('გაიყიდა ₾', 'Продано за ₾', 'Sold for ₾'), admin: { step: 0.01 } },
        { name: 'listPrice', type: 'number', label: L('თაროს ფასი ₾', 'Цена на полке ₾', 'Shelf price ₾'), admin: { readOnly: true } },
        {
          name: 'payment',
          type: 'select',
          required: true,
          defaultValue: 'cash',
          label: L('გადახდა', 'Оплата', 'Payment'),
          options: [
            { value: 'cash', label: L('ნაღდი', 'Наличные', 'Cash') },
            { value: 'card', label: L('ბარათი', 'Карта', 'Card') },
            { value: 'transfer', label: L('გადარიცხვა', 'Перевод', 'Bank transfer') },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', label: L('მყიდველის ტელეფონი', 'Телефон покупателя', 'Customer phone') },
        { name: 'note', type: 'text', label: L('შენიშვნა', 'Заметка', 'Note') },
      ],
    },
    { name: 'soldBy', type: 'relationship', relationTo: 'users', label: L('გაყიდა', 'Продал', 'Sold by'), admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: L('ონლაინ მოთხოვნა, რომელშიც იყო', 'Онлайн-запрос, в котором был', 'Online request it was in'),
      admin: { readOnly: true, position: 'sidebar', condition: (data) => Boolean(data?.order) },
    },
    { name: 'previousStatus', type: 'text', admin: { hidden: true } },
  ],
}

/**
 * Item availability, done in the database itself. Every product is one physical toy, so "reserve",
 * "sell" and "put back" are conditional single-statement updates: two customers asking for the same
 * toy at the same moment can't both get it, and a status change never runs the product's form
 * validation (a deleted photo or category must not block orders). Product hooks don't run here,
 * so the storefront refresh and the sold/published stamps are done in this file.
 */
import type { Payload, PayloadRequest } from 'payload'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'
import { refreshStorefront } from './refresh'

export type ProductStatus = 'draft' | 'published' | 'reserved' | 'sold' | 'archived'

/** Order statuses that keep their items reserved / sold. */
export const OPEN_ORDER = ['requested', 'confirmed']
export const PAID_ORDER = ['paid', 'shipped', 'completed']
export const HOLD: Record<string, 'reserved' | 'sold' | undefined> = { requested: 'reserved', confirmed: 'reserved', paid: 'sold', shipped: 'sold', completed: 'sold' }

export const relId = (v: unknown): number | undefined => (v && typeof v === 'object' ? (v as { id?: number }).id : typeof v === 'number' ? v : Number(v) || undefined)
export const itemIds = (items?: { product?: unknown }[] | null) => [...new Set((items ?? []).map((i) => relId(i.product)).filter((n): n is number => Boolean(n)))]

/** The connection of the request's transaction when there is one, so everything commits or rolls back together. */
async function dbOf(payload: Payload, req?: Partial<PayloadRequest>) {
  const adapter = payload.db as unknown as PostgresAdapter
  const id = req?.transactionID ? await req.transactionID : undefined
  return (id !== undefined && adapter.sessions?.[id]?.db) || adapter.drizzle
}

/** One array parameter ('{1,2,3}') — drizzle would spread a JS array into separate parameters. Values are ints or our own status names. */
const pgArray = (values: (number | string)[]) => `{${values.join(',')}}`

const rows = (res: unknown) => ((res as { rows?: Record<string, unknown>[] }).rows ?? [])

/** Moves the products that are still in one of `from` to `to`; returns the ids that moved. */
export async function moveProducts(payload: Payload, req: Partial<PayloadRequest> | undefined, ids: number[], from: ProductStatus[], to: ProductStatus) {
  const list = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))]
  if (!list.length || !from.length) return []
  const db = await dbOf(payload, req)
  const res = await db.execute(sql`
    UPDATE "products" SET
      "status" = ${to}::"enum_products_status",
      "sold_at" = CASE WHEN ${to}::text = 'sold' THEN now() ELSE NULL END,
      "published_at" = COALESCE("published_at", CASE WHEN ${to}::text IN ('published', 'reserved', 'sold') THEN now() END),
      "updated_at" = now()
    WHERE "id" = ANY(${pgArray(list)}::int[]) AND "status"::text = ANY(${pgArray(from)}::text[])
    RETURNING "id"`)
  const moved = rows(res).map((r) => Number(r.id))
  if (moved.length) refreshStorefront()
  return moved
}

/** Products (of `ids`) that some other order in `statuses` lists. */
export async function heldByOrders(payload: Payload, req: Partial<PayloadRequest> | undefined, ids: number[], statuses: string[], exceptOrder?: number) {
  const held = new Set<number>()
  if (!ids.length) return held
  const found = await payload.find({
    collection: 'orders',
    where: { and: [{ 'items.product': { in: ids } }, { status: { in: statuses } }, ...(exceptOrder ? [{ id: { not_equals: exceptOrder } }] : [])] },
    limit: 200,
    pagination: false,
    depth: 0,
    req: req as PayloadRequest,
    overrideAccess: true,
  })
  for (const o of found.docs) for (const id of itemIds(o.items)) if (ids.includes(id)) held.add(id)
  return held
}

/** Products (of `ids`) that were sold at the counter. */
export async function soldInShop(payload: Payload, req: Partial<PayloadRequest> | undefined, ids: number[]) {
  const found = ids.length
    ? await payload.find({ collection: 'store-sales', where: { product: { in: ids } }, limit: 200, pagination: false, depth: 0, req: req as PayloadRequest, overrideAccess: true })
    : { docs: [] }
  return new Set(found.docs.map((s) => relId(s.product)).filter((n): n is number => Boolean(n)))
}

/**
 * An order lets go of items: reserved ones go back on the shelf unless another open request holds
 * them; sold ones (a paid order cancelled) unless another paid order holds them or they were sold in the shop.
 */
export async function releaseItems(payload: Payload, req: Partial<PayloadRequest> | undefined, ids: number[], from: 'reserved' | 'sold', order?: number) {
  if (!ids.length) return []
  const held = await heldByOrders(payload, req, ids, from === 'reserved' ? OPEN_ORDER : PAID_ORDER, order)
  const shop = from === 'sold' ? await soldInShop(payload, req, ids) : new Set<number>()
  return moveProducts(payload, req, ids.filter((id) => !held.has(id) && !shop.has(id)), [from], 'published')
}

/** Serialises number generation (order ZT-0001…, SKU ZT-000001…) until the transaction ends. */
export async function lockNumbers(payload: Payload, req: Partial<PayloadRequest> | undefined, key: string) {
  const db = await dbOf(payload, req)
  await db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${key}))`)
}

/** The highest number used so far in a "ZT-…" text column (numeric, so ZT-10000 beats ZT-9999). */
export async function highestNumber(payload: Payload, req: Partial<PayloadRequest> | undefined, table: 'orders' | 'products', column: 'number' | 'sku') {
  const db = await dbOf(payload, req)
  const res = await db.execute(sql`SELECT COALESCE(MAX(NULLIF(regexp_replace(${sql.identifier(column)}, '[^0-9]', '', 'g'), '')::bigint), 0) AS n FROM ${sql.identifier(table)}`)
  return Number(rows(res)[0]?.n ?? 0)
}

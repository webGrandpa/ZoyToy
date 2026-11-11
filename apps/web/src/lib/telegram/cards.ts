/**
 * What the owner sees in Telegram: order cards, their buttons, lists, the morning digest and reward
 * checks. Pure formatting — no database, no network — so every message is unit-tested.
 * Texts are Georgian (the owner's language); messages to customers come from ./templates.
 */
import type { InlineButton, Keyboard } from './api'
import { asLang, fillTemplate, intlPhone, money, templateFor, templateText, whatsappLink, type Lang } from './templates'

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const TZ = 'Asia/Tbilisi'
const timeFmt = new Intl.DateTimeFormat('ka-GE', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
const dayFmt = new Intl.DateTimeFormat('ka-GE', { timeZone: TZ, day: 'numeric', month: 'short' })
const longDayFmt = new Intl.DateTimeFormat('ka-GE', { timeZone: TZ, day: 'numeric', month: 'long' })
export const clock = (d: Date | string) => timeFmt.format(new Date(d))
export const when = (d: Date | string) => `${dayFmt.format(new Date(d))}, ${clock(d)}`
export const today = (d = new Date()) => longDayFmt.format(d)

export type Status = 'requested' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'expired'
export const STATUS: Record<Status, { icon: string; label: string }> = {
  requested: { icon: '🆕', label: 'ახალი მოთხოვნა' },
  confirmed: { icon: '✅', label: 'დადასტურებული' },
  paid: { icon: '💰', label: 'გადახდილი' },
  shipped: { icon: '📦', label: 'გაგზავნილი' },
  completed: { icon: '🏁', label: 'დასრულებული' },
  cancelled: { icon: '❌', label: 'გაუქმებული' },
  expired: { icon: '⌛', label: 'ვადაგასული' },
}
const isStatus = (s: unknown): s is Status => typeof s === 'string' && s in STATUS

const DELIVERY: Record<string, string> = { pickup: '🏪 გატანა მაღაზიიდან', courier: '🛵 კურიერი ბათუმში', post: '📮 ფოსტა', bus: '🚌 ავტობუსით' }
const PAYMENT: Record<string, string> = { cash: '💵 ნაღდი', transfer: '🏦 გადარიცხვა', link: '🔗 ბანკის ბმული' }
const LANG_NAME: Record<Lang, string> = { ka: 'ქართული', ru: 'русский', en: 'English' }

export type OrderCardData = {
  id: number
  number?: string | null
  status?: string | null
  name: string
  phone: string
  city?: string | null
  delivery?: string | null
  payment?: string | null
  total?: number | null
  discountPercent?: number | null
  payable?: number | null
  tracking?: string | null
  gift?: boolean | null
  giftNote?: string | null
  comment?: string | null
  rewardCode?: string | null
  locale?: string | null
  reservedUntil?: string | null
  items?: { title?: string | null; sku?: string | null; price?: number | null }[] | null
}

export type RewardData = {
  id: number
  code: string
  percent: number
  status?: string | null
  expiresAt?: string | null
  score?: number | null
  phone?: string | null
  createdAt?: string | null
}

/** The reward as the owner needs it at the till: can it be used, and for how much. */
export function rewardState(r: RewardData | null | undefined, now = new Date()) {
  if (!r) return { usable: false, line: '❓ ასეთი კოდი ვერ მოიძებნა' }
  if (r.status === 'redeemed') return { usable: false, line: `☑️ უკვე გამოყენებულია${r.phone ? ` · ${esc(r.phone)}` : ''}` }
  if (r.status === 'replaced') return { usable: false, line: '↪️ შეიცვალა უკეთესი ჯილდოთი' }
  if (r.status === 'revoked') return { usable: false, line: '⛔ გაუქმებულია' }
  if (r.expiresAt && new Date(r.expiresAt) < now) return { usable: false, line: `⌛ ვადა გავიდა ${when(r.expiresAt)}` }
  return { usable: true, line: `✅ მოქმედია · −${r.percent}%${r.expiresAt ? ` · ${when(r.expiresAt)}-მდე` : ''}` }
}

/** The status buttons the bot offers next (the admin can still set any status by hand). */
export function nextSteps(o: Pick<OrderCardData, 'status' | 'delivery'>): { status: Status; text: string }[] {
  switch (o.status) {
    case 'requested':
      return [{ status: 'confirmed', text: '✅ დადასტურება' }]
    case 'confirmed':
      return [{ status: 'paid', text: '💰 გადახდილია' }]
    case 'paid':
      return o.delivery === 'pickup' ? [{ status: 'completed', text: '🏁 გაიტანა' }] : [{ status: 'shipped', text: '📦 გაიგზავნა' }]
    case 'shipped':
      return [{ status: 'completed', text: '🏁 ჩაბარდა' }]
    default:
      return []
  }
}

/** Cancelling is offered until the money arrives; after that it is a refund, handled in the admin. */
export const cancellable = (status?: string | null) => status === 'requested' || status === 'confirmed'

export const canMove = (o: Pick<OrderCardData, 'status' | 'delivery'>, to: string) =>
  to === 'cancelled' ? cancellable(o.status) : nextSteps(o).some((s) => s.status === to)

export type CardLinks = {
  /** https base of the site; links back to it are left out when it is not public (local development) */
  site?: string | null
  /** signed /api/telegram/call/:id?sig=… link */
  call?: string | null
  /** customer message for the WhatsApp button, already filled in */
  whatsappText?: string | null
}

export function orderCard(o: OrderCardData, extra: { reward?: RewardData | null; by?: string | null; at?: Date } = {}) {
  const status = isStatus(o.status) ? STATUS[o.status] : { icon: '•', label: o.status ?? '' }
  const lang = asLang(o.locale)
  const lines = [`${status.icon} <b>${esc(o.number ?? `#${o.id}`)}</b> · ${status.label}`, '']
  for (const i of o.items ?? []) lines.push(`• ${esc(i.title ?? '')} — ${money(i.price)}${i.sku ? ` · <code>${esc(i.sku)}</code>` : ''}`)
  const pay = o.payment && PAYMENT[o.payment] ? ` · ${PAYMENT[o.payment]}` : ''
  // the discount was worked out when the request came in (valid code, campaign categories) — it stays with the order
  const discounted = o.payable != null && Number(o.payable) < Number(o.total ?? 0)
  lines.push(discounted ? `💰 <s>${money(o.total)}</s> → <b>${money(o.payable)}</b> (−${o.discountPercent ?? 0}%)${pay}` : `💰 <b>${money(o.total)}</b>${pay}`)
  if (o.rewardCode) {
    const r = rewardState(extra.reward)
    const note = discounted ? '' : o.discountPercent ? ' · ამ ნივთებზე არ ვრცელდება' : r.usable ? ' · ⚠️ შეკვეთისას არ მოქმედებდა' : ''
    lines.push(`🎮 <code>${esc(o.rewardCode)}</code> — ${r.line}${note}`)
  }
  lines.push(`👤 ${esc(o.name)} · ${esc(prettyPhone(o.phone))}`)
  const where = [o.city?.trim() ? esc(o.city.trim()) : null, o.delivery ? DELIVERY[o.delivery] : null].filter(Boolean)
  if (where.length) lines.push(`📍 ${where.join(' · ')}`)
  if (o.tracking?.trim()) lines.push(`🚚 ${esc(o.tracking.trim())}`)
  if (o.gift) lines.push(`🎁 საჩუქარია${o.giftNote?.trim() ? `: „${esc(clip(o.giftNote.trim(), 160))}“` : ''}`)
  if (o.comment?.trim()) lines.push(`💬 „${esc(clip(o.comment.trim(), 300))}“`)
  if (o.status === 'requested' && o.reservedUntil) lines.push(`⏳ ჯავშანი ${when(o.reservedUntil)}-მდე`)
  if (lang !== 'ka') lines.push(`🌐 მყიდველის ენა: ${LANG_NAME[lang]}`)
  if (extra.by) lines.push('', `✏️ ${esc(extra.by)} · ${clock(extra.at ?? new Date())}`)
  return lines.join('\n')
}

export function orderKeyboard(o: OrderCardData, links: CardLinks, reward?: RewardData | null): Keyboard {
  const rows: Keyboard = []
  const steps: InlineButton[] = nextSteps(o).map((s) => ({ text: s.text, callback_data: `s:${s.status}:${o.id}` }))
  if (cancellable(o.status)) steps.push({ text: '❌ გაუქმება', callback_data: `x:${o.id}` })
  if (steps.length) rows.push(steps)
  const contact: InlineButton[] = [{ text: '💬 WhatsApp', url: whatsappLink(o.phone, links.whatsappText ?? undefined) }]
  if (links.call) contact.push({ text: '📞 დარეკვა', url: links.call })
  rows.push(contact)
  if (o.rewardCode && reward && rewardState(reward).usable) rows.push([{ text: `🎟 ჯილდო გამოყენებულია (−${reward.percent}%)`, callback_data: `r:${reward.id}:${o.id}` }])
  if (links.site) rows.push([{ text: '🔗 ადმინში გახსნა', url: `${links.site}/admin/collections/orders/${o.id}` }])
  return rows
}

export const cancelKeyboard = (id: number): Keyboard => [[{ text: '❌ დიახ, გაუქმდეს', callback_data: `s:cancelled:${id}` }, { text: '↩️ არა', callback_data: `b:${id}` }]]

/** The customer message that fits the order now, in the customer's language (`saved`: site settings read in that language). */
export function customerMessage(o: OrderCardData, saved: object | null | undefined) {
  const key = templateFor(o)
  if (!key) return null
  const lang = asLang(o.locale)
  return fillTemplate(templateText(saved, key, lang), o, lang)
}

export type Action =
  | { kind: 'status'; id: number; status: Status }
  | { kind: 'ask-cancel'; id: number }
  | { kind: 'back'; id: number }
  | { kind: 'view'; id: number }
  | { kind: 'redeem'; rewardId: number; orderId: number }
  | { kind: 'list' }

const posInt = (s: string | undefined) => (s && /^\d{1,10}$/.test(s) && Number(s) > 0 ? Number(s) : null)

/** Button payloads are short `kind:args` strings (Telegram allows 64 bytes); anything else is ignored. */
export function parseCallback(data: string | undefined): Action | null {
  if (!data) return null
  const [kind, a, b] = data.split(':')
  if (kind === 'l' && a === undefined) return { kind: 'list' }
  if (kind === 's' && isStatus(a) && posInt(b)) return { kind: 'status', status: a, id: posInt(b)! }
  if (kind === 'x' && posInt(a) && b === undefined) return { kind: 'ask-cancel', id: posInt(a)! }
  if (kind === 'b' && posInt(a) && b === undefined) return { kind: 'back', id: posInt(a)! }
  if (kind === 'v' && posInt(a) && b === undefined) return { kind: 'view', id: posInt(a)! }
  if (kind === 'r' && posInt(a) && b !== undefined && /^\d{1,10}$/.test(b)) return { kind: 'redeem', rewardId: posInt(a)!, orderId: Number(b) }
  return null
}

/** `/command@BotName args` → { command, args }; plain text → null. */
export function parseCommand(text: string | undefined) {
  const m = text?.trim().match(/^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i)
  return m ? { command: m[1].toLowerCase(), args: (m[2] ?? '').trim() } : null
}

export const REWARD_CODE = /\bZOY-[A-Z0-9]{4,12}\b/i

export const COMMANDS = [
  { command: 'orders', description: 'ღია შეკვეთები' },
  { command: 'digest', description: 'დღის შეჯამება ახლავე' },
  { command: 'code', description: 'ჯილდოს კოდის შემოწმება: /code ZOY-XXXXX' },
  { command: 'help', description: 'რას აკეთებს ბოტი' },
]

export const HELP = [
  '🦒 <b>ზოი თოის ბოტი</b>',
  'ახალი შეკვეთა აქ მოვა ფოტოთი და ღილაკებით: დადასტურება → გადახდა → გაგზავნა/გატანა, ან გაუქმება. ნივთის სტატუსი საიტზე თავისით იცვლება.',
  '💬 WhatsApp ღილაკი მყიდველის ჩატს ხსნის მზა ტექსტით, მისსავე ენაზე (ტექსტები: ადმინი → საიტის პარამეტრები → შეტყობინებები).',
  '',
  '/orders — ღია შეკვეთები',
  '/digest — დღის შეჯამება ახლავე (ავტომატურად ყოველ დილას)',
  '/code ZOY-XXXXX — ჯილდოს კოდის შემოწმება, ან უბრალოდ ჩაწერე კოდი',
].join('\n')

export const setupText = (chatId: number | string) =>
  [
    '👋 გამარჯობა! ეს ზოი თოის მაღაზიის ბოტია.',
    '',
    `ამ ჩატის ნომერია: <code>${esc(String(chatId))}</code>`,
    'დასაკავშირებლად: ადმინი → საიტის პარამეტრები → Telegram → „ჩატის ნომერი“ — ჩაწერე ეს ნომერი და შეინახე.',
    'შემდეგ აქ მოვა ყველა ახალი შეკვეთა.',
  ].join('\n')

export function rewardCard(code: string, r: RewardData | null) {
  const state = rewardState(r)
  const lines = [`🎟 <b>${esc(r?.code ?? code.toUpperCase())}</b>`, state.line]
  if (r?.score != null) lines.push(`🎮 ${r.score} ქულა${r.createdAt ? ` · მოიგო ${when(r.createdAt)}` : ''}`)
  const keyboard: Keyboard = r && state.usable ? [[{ text: '🎟 გამოყენებულად მონიშვნა', callback_data: `r:${r.id}:0` }]] : []
  return { text: lines.join('\n'), keyboard }
}

export type ListedOrder = Pick<OrderCardData, 'id' | 'number' | 'status' | 'name' | 'total' | 'reservedUntil' | 'phone'>

const short = (o: ListedOrder) => `${isStatus(o.status) ? STATUS[o.status].icon : '•'} ${esc(o.number ?? `#${o.id}`)} · ${esc(clip(o.name, 24))} · ${money(o.total)}`

export function openOrdersCard(orders: ListedOrder[]) {
  if (!orders.length) return { text: '📋 ღია შეკვეთა არ არის — ყველაფერი გაკეთებულია 🦒', keyboard: [] as Keyboard }
  const keyboard: Keyboard = []
  for (let i = 0; i < orders.length; i += 2) keyboard.push(orders.slice(i, i + 2).map((o) => ({ text: `${isStatus(o.status) ? STATUS[o.status].icon : '•'} ${o.number ?? `#${o.id}`}`, callback_data: `v:${o.id}` })))
  return { text: [`📋 <b>ღია შეკვეთები</b> — ${orders.length}`, '', ...orders.map(short)].join('\n'), keyboard }
}

export type DigestData = {
  requested: ListedOrder[]
  confirmed: ListedOrder[]
  toShip: ListedOrder[]
  /** storeSum is already formatted (₾) — sales made at the counter, docs/04 „მაღაზიაში გაყიდვა“ */
  last24h: { orders: number; rewards: number; storeSales?: number; storeSum?: string }
  shelf: { published: number; reserved: number }
  now?: Date
}

/** Morning summary (docs/08 §3.2): what needs the owner today, each request with a WhatsApp button. */
export function digestCard(d: DigestData) {
  const lines = [`☀️ <b>დილა მშვიდობისა!</b> ზოი თოი · ${today(d.now)}`, '']
  if (d.requested.length) {
    lines.push(`🆕 დაუდასტურებელი — ${d.requested.length}`)
    for (const o of d.requested) lines.push(`${short(o)}${o.reservedUntil ? ` · ⏳ ${when(o.reservedUntil)}-მდე` : ''}`)
  }
  if (d.confirmed.length) lines.push(`✅ დადასტურებული, გადაუხდელი — ${d.confirmed.map((o) => esc(o.number ?? `#${o.id}`)).join(', ')}`)
  if (d.toShip.length) lines.push(`📦 გასაგზავნი — ${d.toShip.map((o) => esc(o.number ?? `#${o.id}`)).join(', ')}`)
  if (!d.requested.length && !d.confirmed.length && !d.toShip.length) lines.push('🦒 ახალი საქმე არ არის — მშვიდი დღე!')
  lines.push('', `📊 ბოლო 24 სთ: ${d.last24h.orders} მოთხოვნა · 🎮 ${d.last24h.rewards} ჯილდო`)
  if (d.last24h.storeSales) lines.push(`🛒 მაღაზიაში გაიყიდა: ${d.last24h.storeSales} · ${esc(d.last24h.storeSum ?? '')}`)
  lines.push(`🧸 თაროზე ${d.shelf.published} · დაჯავშნილი ${d.shelf.reserved}`)
  const keyboard: Keyboard = d.requested.slice(0, 6).map((o) => [
    { text: `💬 ${o.number ?? `#${o.id}`} · ${clip(o.name, 16)}`, url: whatsappLink(o.phone) },
    { text: '📋 გახსნა', callback_data: `v:${o.id}` },
  ])
  if (d.requested.length + d.confirmed.length + d.toShip.length) keyboard.push([{ text: '📋 ყველა ღია შეკვეთა', callback_data: 'l' }])
  return { text: lines.join('\n'), keyboard }
}

/** +995 555 12 34 56 for Georgian mobiles, the digits as typed otherwise. */
export function prettyPhone(raw: string) {
  const d = intlPhone(raw)
  const m = d.match(/^995(\d{3})(\d{2})(\d{2})(\d{2})$/)
  return m ? `+995 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : raw
}

function clip(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

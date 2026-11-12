/**
 * The shop's Telegram bot (docs/08 §3.2): new orders arrive with a photo and buttons, the owner moves
 * them along (confirm → paid → shipped/picked up, or cancel) and messages the customer in one tap.
 * Product statuses follow through the Orders hooks. Only the shop's chat — Site settings → Telegram,
 * or TELEGRAM_CHAT_ID — can use it; any other chat just learns its own id from /start. The admin's
 * one-tap link (t.me/<bot>?start=<signed token>) connects a chat without copying its number.
 */
import { after } from 'next/server'
import type { Payload } from 'payload'
import sharp from 'sharp'
import type { Media, Order, Reward, SiteSetting } from '../../payload-types'
import { botToken, tg, TelegramError, tgPhoto, unchanged, type Keyboard, type TgChat, type TgMessage, type TgUpdate, type TgUser } from './api'
import {
  cancelKeyboard,
  canMove,
  connectedText,
  customerMessage,
  digestCard,
  esc,
  expiredLinkText,
  HELP,
  openOrdersCard,
  orderCard,
  orderKeyboard,
  parseCallback,
  parseCommand,
  REWARD_CODE,
  rewardCard,
  rewardState,
  setupText,
  STATUS,
  testText,
  type ListedOrder,
  type OrderCardData,
  type RewardData,
} from './cards'
import { checkConnectToken, connectToken, signLink } from './secret'
import { asLang, intlPhone, money, type Lang } from './templates'
import { siteUrl } from '../site'
import { saleTotals } from '../store'

const OPEN = ['requested', 'confirmed', 'paid', 'shipped']
const DAY = 24 * 3600 * 1000

export { siteUrl }

/** Runs after the response is sent (Next.js `after`), or right away outside a request (scripts, tests). */
export function inBackground(task: () => Promise<unknown>, onError: (e: unknown) => void) {
  const run = () => task().catch(onError)
  try {
    after(run)
  } catch {
    void run()
  }
}

/** Settings in one language without falling back to Georgian, so an unset Russian message uses the Russian default. */
const settings = (payload: Payload, lang: Lang = 'ka') =>
  payload.findGlobal({ slug: 'site-settings', depth: 0, locale: lang, fallbackLocale: false, overrideAccess: true }) as Promise<SiteSetting>

export async function ownerChat(payload: Payload, s?: SiteSetting) {
  const saved = (s ?? (await settings(payload))).telegramChatId?.trim()
  return saved || process.env.TELEGRAM_CHAT_ID?.trim() || null
}

const saveOwnerChat = (payload: Payload, id: number | string) =>
  payload.updateGlobal({ slug: 'site-settings', data: { telegramChatId: String(id) }, overrideAccess: true })

const isGroup = (chat: Pick<TgChat, 'type'>) => chat.type !== 'private'

/** What went wrong with the saved chat, in words the admin can act on. */
export type ChatProblem = 'not_found' | 'blocked' | 'removed' | 'moved' | 'other'
export function chatProblem(e: unknown): ChatProblem {
  const d = e instanceof TelegramError ? e.description : String(e)
  if (/chat not found|user not found|PEER_ID_INVALID/i.test(d)) return 'not_found'
  if (/blocked by the user|user is deactivated/i.test(d)) return 'blocked'
  if (/kicked|not a member|was deleted/i.test(d)) return 'removed'
  if (/upgraded to a supergroup/i.test(d)) return 'moved'
  return 'other'
}

export type Connection = {
  configured: boolean
  bot?: string
  links?: { private: string; group: string }
  chat?: { id: string; name: string; group: boolean } | null
  problem?: ChatProblem | 'token'
}

let botName: string | null = null
async function botUsername() {
  if (!botName) botName = (await tg<{ username?: string }>('getMe', {}).catch(() => null))?.username ?? null
  return botName
}

/**
 * Admin → Site settings → Telegram: is the bot set up, which chat it writes to, and — for those who may
 * change Site settings (admins) — fresh one-tap connect links.
 */
export async function connection(payload: Payload, opts: { links: boolean }): Promise<Connection> {
  if (!botToken()) return { configured: false }
  const bot = await botUsername()
  if (!bot) return { configured: true, problem: 'token' }
  const token = connectToken()
  const links = opts.links ? { private: `https://t.me/${bot}?start=${token}`, group: `https://t.me/${bot}?startgroup=${token}` } : undefined
  const id = await ownerChat(payload)
  if (!id) return { configured: true, bot, links, chat: null }
  try {
    const c = await tg<TgChat>('getChat', { chat_id: id })
    const name = c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || (c.username ? `@${c.username}` : id)
    return { configured: true, bot, links, chat: { id, name, group: isGroup(c) } }
  } catch (e) {
    return { configured: true, bot, links, chat: { id, name: '', group: id.startsWith('-') }, problem: chatProblem(e) }
  }
}

/** The admin's “send a test message” button. */
export async function sendTest(payload: Payload): Promise<{ ok: true } | { ok: false; problem: ChatProblem | 'no_chat' }> {
  const id = await ownerChat(payload)
  if (!id) return { ok: false, problem: 'no_chat' }
  try {
    await send(id, testText)
    return { ok: true }
  } catch (e) {
    return { ok: false, problem: chatProblem(e) }
  }
}

const toCard = (o: Order): OrderCardData => ({ ...o, items: o.items ?? [] })

const findOrder = (payload: Payload, id: number) => payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true }).catch(() => null)

async function findReward(payload: Payload, code: string): Promise<RewardData | null> {
  const found = await payload.find({ collection: 'rewards', where: { code: { equals: code.trim().toUpperCase() } }, limit: 1, depth: 0, overrideAccess: true })
  return (found.docs[0] as Reward | undefined) ?? null
}

const callLink = (id: number) => {
  const site = siteUrl()
  return site ? `${site}/api/telegram/call/${id}?sig=${signLink(String(id))}` : null
}

async function card(payload: Payload, order: Order, by?: TgUser) {
  const data = toCard(order)
  const [reward, saved] = await Promise.all([order.rewardCode ? findReward(payload, order.rewardCode) : null, settings(payload, asLang(order.locale))])
  const links = { site: siteUrl(), call: callLink(order.id), whatsappText: customerMessage(data, saved) }
  return { text: orderCard(data, { reward, by: by?.first_name ?? by?.username ?? null }), keyboard: orderKeyboard(data, links, reward) }
}

const markup = (keyboard: Keyboard) => ({ inline_keyboard: keyboard })
const send = (chat: string | number, text: string, keyboard: Keyboard = []) =>
  tg('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true }, ...(keyboard.length ? { reply_markup: markup(keyboard) } : {}) })

/** The first item's photo as JPEG (Telegram's sendPhoto is picky about WebP, and localhost URLs are unreachable for it). */
async function orderPhoto(payload: Payload, order: Order) {
  const first = (order.items ?? []).find((i) => i.product)
  const productId = typeof first?.product === 'object' ? first.product?.id : first?.product
  if (!productId) return null
  const product = await payload.findByID({ collection: 'products', id: productId, depth: 1, overrideAccess: true }).catch(() => null)
  const gallery = product?.gallery ?? []
  const media = (gallery.find((g) => g.role === 'main') ?? gallery[0])?.image as Media | number | undefined
  if (!media || typeof media !== 'object') return null
  const path = media.sizes?.card?.url ?? media.url
  if (!path) return null
  const url = path.startsWith('http') ? path : `${siteUrl() ?? `http://127.0.0.1:${process.env.PORT || 3000}`}${path}`
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
  if (!res.ok) return null
  const data = await sharp(Buffer.from(await res.arrayBuffer())).flatten({ background: '#ffffff' }).jpeg({ quality: 86 }).toBuffer()
  return { data, name: 'zoytoy.jpg', type: 'image/jpeg' }
}

const plainLength = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt);/g, '_').length

/** A new order request → the shop's chat, with the first item's photo when there is one. */
export async function notifyNewOrder(payload: Payload, order: Order) {
  if (!botToken()) return
  const chat = await ownerChat(payload)
  if (!chat) return
  const c = await card(payload, order)
  const photo = plainLength(c.text) <= 1000 ? await orderPhoto(payload, order).catch(() => null) : null
  if (photo) {
    try {
      await tgPhoto({ chat_id: chat, caption: c.text, parse_mode: 'HTML', reply_markup: markup(c.keyboard) }, photo)
      return
    } catch (e) {
      payload.logger.warn(`Telegram photo failed, sending text: ${String(e)}`)
    }
  }
  await send(chat, c.text, c.keyboard)
}

/**
 * An item that an unpaid online request was holding got sold at the counter — the owner has to tell
 * that customer. The order's card follows with its usual buttons (WhatsApp, cancel…).
 */
export async function notifyStoreSaleConflict(payload: Payload, sale: { sku?: string | null; title?: string | null }, order: Order) {
  if (!botToken()) return
  const chat = await ownerChat(payload)
  if (!chat) return
  const c = await card(payload, order)
  const head = `⚠️ <b>${esc(sale.sku ?? '')}</b> ${esc(sale.title ?? '')} — გაიყიდა მაღაზიაში, მაგრამ შეკვეთა <b>${esc(order.number ?? `#${order.id}`)}</b>-ში იყო დაჯავშნილი. მყიდველს აცნობე.`
  await send(chat, `${head}\n\n${c.text}`, c.keyboard)
}

/** Redraws a card in place — caption for photo messages, text otherwise. */
async function redraw(message: TgMessage, text: string, keyboard: Keyboard) {
  const target = { chat_id: message.chat.id, message_id: message.message_id, parse_mode: 'HTML', reply_markup: markup(keyboard) }
  try {
    if (message.photo) await tg('editMessageCaption', { ...target, caption: text })
    else await tg('editMessageText', { ...target, text, link_preview_options: { is_disabled: true } })
  } catch (e) {
    if (!unchanged(e)) throw e
  }
}

const answer = (id: string, text?: string, alert = false) => tg('answerCallbackQuery', { callback_query_id: id, ...(text ? { text, show_alert: alert } : {}) })

async function sendOpenOrders(payload: Payload, chat: string) {
  const found = await payload.find({ collection: 'orders', where: { status: { in: OPEN } }, sort: '-createdAt', limit: 20, depth: 0, overrideAccess: true })
  const c = openOrdersCard(found.docs as ListedOrder[])
  await send(chat, c.text, c.keyboard)
}

async function sendReward(payload: Payload, chat: string, code: string) {
  const c = rewardCard(code, await findReward(payload, code))
  await send(chat, c.text, c.keyboard)
}

type Callback = NonNullable<TgUpdate['callback_query']>

async function onButton(payload: Payload, cq: Callback, owner: string | null) {
  const message = cq.message
  if (!owner || !message || String(message.chat.id) !== owner) return answer(cq.id, 'ეს ღილაკი მხოლოდ მაღაზიის ჩატში მუშაობს', true)
  const action = parseCallback(cq.data)
  if (!action) return answer(cq.id)

  if (action.kind === 'list') {
    await sendOpenOrders(payload, owner)
    return answer(cq.id)
  }
  if (action.kind === 'redeem') {
    const reward = (await payload.findByID({ collection: 'rewards', id: action.rewardId, depth: 0, overrideAccess: true }).catch(() => null)) as Reward | null
    const order = action.orderId ? await findOrder(payload, action.orderId) : null
    if (!reward || !rewardState(reward).usable) {
      if (order) {
        const c = await card(payload, order)
        await redraw(message, c.text, c.keyboard)
      }
      return answer(cq.id, 'ეს კოდი უკვე აღარ მოქმედებს', true)
    }
    await payload.update({ collection: 'rewards', id: reward.id, data: { status: 'redeemed', ...(order ? { order: order.id, phone: order.phone } : {}) }, overrideAccess: true })
    if (order) {
      const c = await card(payload, order, cq.from)
      await redraw(message, c.text, c.keyboard)
    } else {
      const c = rewardCard(reward.code, { ...reward, status: 'redeemed' })
      await redraw(message, c.text, c.keyboard)
    }
    return answer(cq.id, '🎟 ჯილდო გამოყენებულად მოინიშნა')
  }

  const order = await findOrder(payload, action.id)
  if (!order) return answer(cq.id, 'შეკვეთა ვერ მოიძებნა', true)

  if (action.kind === 'view') {
    const c = await card(payload, order)
    await send(owner, c.text, c.keyboard)
    return answer(cq.id)
  }
  if (action.kind === 'back') {
    const c = await card(payload, order)
    await redraw(message, c.text, c.keyboard)
    return answer(cq.id)
  }
  if (action.kind === 'ask-cancel') {
    if (!canMove(order, 'cancelled')) {
      const c = await card(payload, order)
      await redraw(message, c.text, c.keyboard)
      return answer(cq.id, 'ამ ეტაპზე გაუქმება მხოლოდ ადმინიდან შეიძლება', true)
    }
    await tg('editMessageReplyMarkup', { chat_id: message.chat.id, message_id: message.message_id, reply_markup: markup(cancelKeyboard(order.id)) }).catch((e) => {
      if (!unchanged(e)) throw e
    })
    return answer(cq.id, 'გავაუქმო? ნივთები თაროზე დაბრუნდება')
  }

  // status change
  if (order.status === action.status) {
    const c = await card(payload, order)
    await redraw(message, c.text, c.keyboard)
    return answer(cq.id, 'უკვე ასეა')
  }
  if (!canMove(order, action.status)) {
    const c = await card(payload, order)
    await redraw(message, c.text, c.keyboard)
    const now = STATUS[order.status as keyof typeof STATUS]?.label ?? order.status
    return answer(cq.id, `შეკვეთა ახლა „${now}“ — ეს ნაბიჯი აღარ ჯდება`, true)
  }
  const updated = await payload.update({ collection: 'orders', id: order.id, data: { status: action.status }, overrideAccess: true })
  const c = await card(payload, updated, cq.from)
  await redraw(message, c.text, c.keyboard)
  return answer(cq.id, `${STATUS[action.status].icon} ${STATUS[action.status].label}`)
}

/** One webhook update from Telegram. */
export async function handleUpdate(payload: Payload, update: TgUpdate) {
  const owner = await ownerChat(payload)
  if (update.callback_query) return onButton(payload, update.callback_query, owner)

  const msg = update.message
  // Telegram turned the shop's group into a supergroup: follow it to its new id
  if (msg?.migrate_from_chat_id && owner && String(msg.migrate_from_chat_id) === owner) {
    await saveOwnerChat(payload, msg.chat.id)
    return
  }
  if (!msg?.text) return
  const cmd = parseCommand(msg.text)
  // the admin's one-tap link: /start <signed token> connects this chat (private or group)
  if (cmd?.command === 'start' && cmd.args) {
    if (!checkConnectToken(cmd.args)) return send(msg.chat.id, expiredLinkText)
    await saveOwnerChat(payload, msg.chat.id)
    return send(msg.chat.id, connectedText(isGroup(msg.chat)))
  }
  if (!owner || String(msg.chat.id) !== owner) {
    // strangers only learn their chat id, which the owner pastes into the admin to connect a chat
    if (cmd?.command === 'start') await send(msg.chat.id, setupText(msg.chat.id))
    return
  }
  if (cmd) {
    switch (cmd.command) {
      case 'start':
      case 'help':
        return send(owner, HELP)
      case 'orders':
        return sendOpenOrders(payload, owner)
      case 'digest':
        return sendDigest(payload, { force: true })
      case 'code': {
        const code = cmd.args.match(REWARD_CODE)?.[0]
        return code ? sendReward(payload, owner, code) : send(owner, 'ჩაწერე კოდიც: <code>/code ZOY-XXXXX</code>')
      }
      default:
        return send(owner, 'ასეთი ბრძანება არ ვიცი 🙂 /help — რას ვაკეთებ')
    }
  }
  const code = msg.text.match(REWARD_CODE)?.[0]
  if (code) return sendReward(payload, owner, code)
  if (msg.chat.type === 'private') return send(owner, 'ჩაწერე ჯილდოს კოდი (ZOY-…) ან /help')
}

/**
 * Morning digest (docs/08 §3.2). Sent at most once per 20 hours unless forced (/digest), and not at
 * all when switched off in Site settings → Telegram.
 */
export async function sendDigest(payload: Payload, opts: { force?: boolean; now?: Date } = {}) {
  if (!botToken()) return 'no-bot' as const
  const s = await settings(payload)
  const chat = await ownerChat(payload, s)
  if (!chat) return 'no-chat' as const
  const now = opts.now ?? new Date()
  if (!opts.force) {
    if (s.telegramDigest === false) return 'off' as const
    if (s.telegramDigestAt && now.getTime() - new Date(s.telegramDigestAt).getTime() < 20 * 3600 * 1000) return 'already-sent' as const
  }
  const since = new Date(now.getTime() - DAY).toISOString()
  const list = (status: string) => payload.find({ collection: 'orders', where: { status: { equals: status } }, sort: 'createdAt', limit: 30, depth: 0, overrideAccess: true })
  const count = (collection: 'orders' | 'rewards', where: object) => payload.count({ collection, where: where as never, overrideAccess: true })
  const [requested, confirmed, paid, newOrders, newRewards, published, reserved, storeSales] = await Promise.all([
    list('requested'),
    list('confirmed'),
    list('paid'),
    count('orders', { createdAt: { greater_than: since } }),
    count('rewards', { createdAt: { greater_than: since } }),
    payload.count({ collection: 'products', where: { status: { equals: 'published' } }, overrideAccess: true }),
    payload.count({ collection: 'products', where: { status: { equals: 'reserved' } }, overrideAccess: true }),
    payload.find({ collection: 'store-sales', where: { createdAt: { greater_than: since } }, limit: 500, depth: 0, pagination: false, select: { price: true, payment: true }, overrideAccess: true }),
  ])
  const store = saleTotals(storeSales.docs)
  const c = digestCard({
    requested: requested.docs as ListedOrder[],
    confirmed: confirmed.docs as ListedOrder[],
    toShip: paid.docs as ListedOrder[],
    last24h: { orders: newOrders.totalDocs, rewards: newRewards.totalDocs, storeSales: store.count, storeSum: money(store.sum, 'ka') },
    shelf: { published: published.totalDocs, reserved: reserved.totalDocs },
    now,
  })
  await send(chat, c.text, c.keyboard)
  if (!opts.force) await payload.updateGlobal({ slug: 'site-settings', data: { telegramDigestAt: now.toISOString() }, overrideAccess: true })
  return 'sent' as const
}

/** Where the “📞 call” button lands: the customer's number for the phone's dialer. */
export async function callTarget(payload: Payload, id: number) {
  const order = await findOrder(payload, id)
  return order?.phone ? `tel:+${intlPhone(order.phone)}` : null
}

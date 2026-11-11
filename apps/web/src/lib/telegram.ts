/**
 * New order request → the owner's Telegram (free Bot API, docs/08 §3.2).
 * Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID; silently skipped when they are not set.
 */
type OrderLike = { number?: string | null; name: string; phone: string; city?: string | null; delivery?: string | null; payment?: string | null; total?: number | null; gift?: boolean | null; rewardCode?: string | null; comment?: string | null; items?: { title?: string | null; sku?: string | null; price?: number | null }[] | null }

const DELIVERY: Record<string, string> = { pickup: 'გატანა', courier: 'კურიერი ბათუმში', post: 'ფოსტა', bus: 'ავტობუსი' }
const PAYMENT: Record<string, string> = { cash: 'ნაღდი', transfer: 'გადარიცხვა', link: 'ბანკის ბმული' }

export async function notifyTelegram(o: OrderLike) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return
  const lines = [
    `🆕 <b>მოთხოვნა ${o.number ?? ''}</b>`,
    ...(o.items ?? []).map((i) => `• ${esc(i.title ?? '')} — ${i.price ?? 0} ₾ <code>${esc(i.sku ?? '')}</code>`),
    `💰 ჯამი: <b>${o.total ?? 0} ₾</b>`,
    `👤 ${esc(o.name)} · ${esc(o.phone)}`,
    `📍 ${esc(o.city ?? '')} · ${DELIVERY[o.delivery ?? ''] ?? ''} · ${PAYMENT[o.payment ?? ''] ?? ''}`,
    o.gift ? '🎁 საჩუქარია' : '',
    o.rewardCode ? `🎮 ჯილდოს კოდი: <code>${esc(o.rewardCode)}</code>` : '',
    o.comment ? `💬 ${esc(o.comment)}` : '',
    '⏳ დაჯავშნილია 24 საათით',
  ].filter(Boolean)
  const digits = o.phone.replace(/\D/g, '')
  const intl = digits.startsWith('995') ? digits : `995${digits.replace(/^0/, '')}`
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '💬 WhatsApp', url: `https://wa.me/${intl}` }]] },
    }),
  })
  if (!res.ok) throw new Error(`Telegram ${res.status}`)
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

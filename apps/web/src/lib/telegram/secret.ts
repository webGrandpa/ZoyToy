import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Secrets derived from PAYLOAD_SECRET, so the bot needs no extra environment variables:
 * - the webhook secret Telegram repeats in `X-Telegram-Bot-Api-Secret-Token` on every update
 *   (set by scripts/telegram-setup.ts, checked by the webhook endpoint);
 * - short signatures for links the bot hands out (the “call” button), so order ids cannot be guessed;
 * - the one-tap connect link in the admin (Site settings → Telegram), valid for CONNECT_MINUTES.
 */
const key = () => process.env.PAYLOAD_SECRET || ''

export const webhookSecret = (token = process.env.TELEGRAM_BOT_TOKEN?.trim() || '') => createHmac('sha256', key()).update(`telegram-webhook:${token}`).digest('hex')

export const signLink = (value: string) => createHmac('sha256', key()).update(`telegram-link:${value}`).digest('base64url').slice(0, 22)

export function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** How long the admin's “connect” link stays good. */
export const CONNECT_MINUTES = 30

/** Deep-link payload for t.me/<bot>?start=… — the minute it was made, signed (Telegram allows 64 chars of [A-Za-z0-9_-]). */
export function connectToken(now = Date.now()) {
  const minute = Math.floor(now / 60_000).toString(36)
  return `c${minute}_${signLink(`telegram-connect:${minute}`)}`
}

export function checkConnectToken(token: string, now = Date.now()) {
  const m = token.trim().match(/^c([0-9a-z]{1,10})_([A-Za-z0-9_-]{22})$/)
  if (!m) return false
  const age = Math.floor(now / 60_000) - parseInt(m[1], 36)
  return age >= 0 && age <= CONNECT_MINUTES && sameSecret(m[2], signLink(`telegram-connect:${m[1]}`))
}

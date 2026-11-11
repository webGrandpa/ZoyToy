import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Secrets derived from PAYLOAD_SECRET, so the bot needs no extra environment variables:
 * - the webhook secret Telegram repeats in `X-Telegram-Bot-Api-Secret-Token` on every update
 *   (set by scripts/telegram-setup.ts, checked by the webhook endpoint);
 * - short signatures for links the bot hands out (the “call” button), so order ids cannot be guessed.
 */
const key = () => process.env.PAYLOAD_SECRET || ''

export const webhookSecret = (token = process.env.TELEGRAM_BOT_TOKEN?.trim() || '') => createHmac('sha256', key()).update(`telegram-webhook:${token}`).digest('hex')

export const signLink = (value: string) => createHmac('sha256', key()).update(`telegram-link:${value}`).digest('base64url').slice(0, 22)

export function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

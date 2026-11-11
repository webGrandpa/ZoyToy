/**
 * Points the Telegram bot at the production site: webhook URL + secret, and the command menu.
 * Run by scripts/vercel-build.sh on production builds when TELEGRAM_BOT_TOKEN is set; safe to repeat.
 * By hand: `SITE_URL=https://… pnpm exec tsx scripts/telegram-setup.ts` with the token and PAYLOAD_SECRET set.
 */
import { tg } from '../src/lib/telegram/api'
import { COMMANDS } from '../src/lib/telegram/cards'
import { webhookSecret } from '../src/lib/telegram/secret'

const host = process.env.SITE_URL?.replace(/^https:\/\//, '').replace(/\/$/, '') || process.env.VERCEL_PROJECT_PRODUCTION_URL
if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.PAYLOAD_SECRET || !host) {
  console.log('Telegram: TELEGRAM_BOT_TOKEN, PAYLOAD_SECRET or the site address is missing — skipped')
  process.exit(0)
}
const url = `https://${host}/api/telegram/webhook`
await tg('setWebhook', { url, secret_token: webhookSecret(), allowed_updates: ['message', 'callback_query'] })
await tg('setMyCommands', { commands: COMMANDS })
const me = await tg<{ username?: string }>('getMe', {})
console.log(`Telegram: @${me.username ?? 'bot'} → ${url}`)

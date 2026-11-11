import type { Endpoint } from 'payload'
import { releaseExpired } from '../collections/Orders'
import { botToken } from '../lib/telegram/api'
import { callTarget, handleUpdate, sendDigest } from '../lib/telegram/bot'
import { sameSecret, signLink, webhookSecret } from '../lib/telegram/secret'

/** Telegram → POST /api/telegram/webhook (registered by scripts/telegram-setup.ts with the derived secret). */
export const telegramWebhook: Endpoint = {
  path: '/telegram/webhook',
  method: 'post',
  handler: async (req) => {
    if (!botToken()) return Response.json({ ok: false, error: 'not_configured' }, { status: 503 })
    if (!sameSecret(req.headers.get('x-telegram-bot-api-secret-token') ?? '', webhookSecret())) return Response.json({ ok: false }, { status: 401 })
    const update = await req.json?.().catch(() => null)
    if (update && typeof update === 'object') {
      try {
        await handleUpdate(req.payload, update)
      } catch (e) {
        // answer 200 anyway: Telegram would otherwise resend the same update again and again
        req.payload.logger.error(`Telegram update failed: ${String(e)}`)
      }
    }
    return Response.json({ ok: true })
  },
}

/** “📞 call” button → the phone's dialer. Signed, so order ids cannot be walked to collect numbers. */
export const telegramCall: Endpoint = {
  path: '/telegram/call/:id',
  method: 'get',
  handler: async (req) => {
    const id = String(req.routeParams?.id ?? '')
    const sig = req.searchParams.get('sig') ?? ''
    if (!/^\d{1,10}$/.test(id) || !sameSecret(sig, signLink(id))) return Response.json({ error: 'forbidden' }, { status: 403 })
    const target = await callTarget(req.payload, Number(id))
    if (!target) return Response.json({ error: 'not_found' }, { status: 404 })
    return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store' } })
  },
}

/**
 * Daily job (Vercel Cron, apps/web/vercel.json — 06:00 UTC = 10:00 in Batumi): put expired reservations
 * back on the shelf, then send the morning digest. With CRON_SECRET set only Vercel (or a logged-in team
 * member) may call it; without one it stays harmless — releasing is idempotent and the digest goes out at
 * most once per 20 hours, only in the morning window.
 */
export const dailyJob: Endpoint = {
  path: '/cron/daily',
  method: 'get',
  handler: async (req) => {
    const secret = process.env.CRON_SECRET
    const fromCron = Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
    if (secret && !fromCron && !req.user) return Response.json({ error: 'forbidden' }, { status: 403 })
    const released = await releaseExpired(req.payload)
    const hour = new Date().getUTCHours()
    const force = Boolean(req.user) && req.searchParams.get('force') === '1'
    const inWindow = fromCron || Boolean(req.user) || (hour >= 5 && hour < 12)
    const digest = inWindow ? await sendDigest(req.payload, { force }).catch((e) => `failed: ${String(e)}`) : 'outside-window'
    return Response.json({ released, digest })
  },
}

export const telegramEndpoints = [telegramWebhook, telegramCall, dailyJob]

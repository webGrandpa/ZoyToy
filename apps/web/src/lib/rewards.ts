import type { Payload } from 'payload'
import type { GameCampaign } from '../payload-types'

const round = (n: number) => Math.round(n * 100) / 100
const idOf = (v: unknown) => (v && typeof v === 'object' ? Number((v as { id?: unknown }).id) : Number(v))

export const normalizeCode = (raw: unknown) =>
  String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 20)

export type RewardCheck =
  | { ok: true; code: string; percent: number; amount: number; base: number; eligible: number[]; expiresAt: string | null; everything: boolean }
  | { ok: false; code: string; reason: 'empty' | 'not_found' | 'used' | 'expired' | 'no_items'; percent?: number }

/**
 * What a game reward code is worth for these items (docs/03): the campaign's chosen toys, or every
 * item when it names none. Used by the cart's „check the code“ button and again, on the server's own
 * prices, when the order is placed — the cart's figure is never trusted.
 */
export async function checkReward(payload: Payload, rawCode: unknown, items: { id: number; price?: number | null }[], now = new Date()): Promise<RewardCheck> {
  const code = normalizeCode(rawCode)
  if (!code) return { ok: false, code, reason: 'empty' }
  const found = await payload.find({ collection: 'rewards', where: { code: { equals: code } }, limit: 1, depth: 1, overrideAccess: true })
  const reward = found.docs[0]
  if (!reward) return { ok: false, code, reason: 'not_found' }
  if (reward.status === 'redeemed') return { ok: false, code, reason: 'used' }
  if (reward.status !== 'issued' || (reward.expiresAt && new Date(reward.expiresAt) <= now)) return { ok: false, code, reason: 'expired' }

  const campaign = reward.campaign && typeof reward.campaign === 'object' ? (reward.campaign as GameCampaign) : null
  const chosen = (campaign?.products ?? []).map(idOf).filter((n) => Number.isInteger(n) && n > 0)
  const eligibleItems = chosen.length ? items.filter((p) => chosen.includes(p.id)) : items
  if (!eligibleItems.length) return { ok: false, code, reason: 'no_items', percent: reward.percent }
  const base = round(eligibleItems.reduce((s, p) => s + Number(p.price ?? 0), 0))
  return {
    ok: true,
    code,
    percent: reward.percent,
    amount: round((base * reward.percent) / 100),
    base,
    eligible: eligibleItems.map((p) => p.id),
    expiresAt: reward.expiresAt ?? null,
    everything: !chosen.length,
  }
}

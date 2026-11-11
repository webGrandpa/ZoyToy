/**
 * "Zoy's Memory" — find the 8 pairs of toy cards in 60 seconds.
 *
 * The deck order comes from the server seed. The browser records every flip (time + card) and
 * the server replays the same flips with the same rules, so the score can't be invented.
 */
import { mulberry32 } from './rng'

export const MEM = { PAIRS: 8, COLS: 4, LIMIT_MS: 60_000, FLIP_BACK_MS: 650, MIN_GAP_MS: 90, MAX_FLIPS: 400 } as const
/**
 * Fair-play limits checked on the server. Even perfect memory has to see a card before it can match it,
 * so only a few matches can be lucky first sights (the last unseen pair often is one); and nobody
 * finds all 8 pairs in under 10 seconds.
 */
export const MEM_FAIR = { MAX_BLIND: 4, MIN_DONE_MS: 10_000 } as const
export const MEM_POINTS = { match: 30, streak: 10, miss: -10, perSecondLeft: 3 } as const

/** One flip: `t` = milliseconds since the round started, `i` = card index (0…15). */
export type Flip = { t: number; i: number }
export type MemEvent = { kind: 'open' | 'match' | 'miss'; a?: number; b?: number; points: number; bonus?: number }
export type MemState = {
  deck: number[]
  matched: boolean[]
  open: number[]
  score: number
  streak: number
  pairs: number
  misses: number
  lockUntil: number
  lastT: number
  flips: number
  doneAt: number | null
  /** cards turned face up at least once — a match whose second card was never seen before is luck (or cheating) */
  seen: Set<number>
  blind: number
}

/** Shuffled deck: card values 0…7, each twice (Fisher–Yates with the seeded RNG). */
export function deal(seed: number): number[] {
  const r = mulberry32(seed)
  const deck = Array.from({ length: MEM.PAIRS * 2 }, (_, i) => i % MEM.PAIRS)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export function createMemory(seed: number): MemState {
  const deck = deal(seed)
  return { deck, matched: deck.map(() => false), open: [], score: 0, streak: 0, pairs: 0, misses: 0, lockUntil: 0, lastT: -Infinity, flips: 0, doneAt: null, seen: new Set(), blind: 0 }
}

/** Apply one flip. Returns `null` when the flip isn't allowed (the browser never records those). */
export function flip(s: MemState, f: Flip): MemEvent | null {
  if (s.doneAt !== null || s.flips >= MEM.MAX_FLIPS) return null
  if (!Number.isInteger(f.i) || f.i < 0 || f.i >= s.deck.length) return null
  if (!Number.isFinite(f.t) || f.t < 0 || f.t > MEM.LIMIT_MS) return null
  if (f.t < s.lastT + MEM.MIN_GAP_MS || f.t < s.lockUntil) return null
  if (s.matched[f.i] || s.open.includes(f.i)) return null
  s.lastT = f.t
  s.flips++
  const firstSight = !s.seen.has(f.i)
  s.seen.add(f.i)
  s.open.push(f.i)
  if (s.open.length < 2) return { kind: 'open', a: f.i, points: 0 }
  const [a, b] = s.open
  s.open = []
  if (s.deck[a] === s.deck[b]) {
    if (firstSight) s.blind++
    s.matched[a] = s.matched[b] = true
    s.pairs++
    const points = MEM_POINTS.match + MEM_POINTS.streak * s.streak
    s.streak++
    s.score += points
    let bonus = 0
    if (s.pairs === MEM.PAIRS) {
      s.doneAt = f.t
      bonus = Math.floor((MEM.LIMIT_MS - f.t) / 1000) * MEM_POINTS.perSecondLeft
      s.score += bonus
    }
    return { kind: 'match', a, b, points, bonus }
  }
  s.streak = 0
  s.misses++
  s.score = Math.max(0, s.score + MEM_POINTS.miss)
  s.lockUntil = f.t + MEM.FLIP_BACK_MS
  return { kind: 'miss', a, b, points: MEM_POINTS.miss }
}

/** Server-side replay of the recorded flips. */
export function replayMemory(seed: number, flips: Flip[]) {
  const s = createMemory(seed)
  let invalid = 0
  for (const f of flips) if (!flip(s, { t: Number(f?.t), i: Number(f?.i) })) invalid++
  return { score: s.score, invalid, pairs: s.pairs, lastT: Number.isFinite(s.lastT) ? s.lastT : 0, done: s.doneAt !== null, doneAt: s.doneAt, blind: s.blind }
}

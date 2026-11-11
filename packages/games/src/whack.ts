/**
 * "Peek-a-Zoy" — Zoy pops out of 9 toy boxes; tap him before he hides. A golden Zoy is worth
 * more, the grumpy rain cloud costs points, and so do taps on empty boxes.
 *
 * The whole pop-up schedule is derived from the server seed. The browser records taps as
 * (tick, box) pairs on a fixed 60 fps clock; the server replays them against the same schedule.
 */
import { mulberry32 } from './rng'

export const WH = { HOLES: 9, DUR: 30, FPS: 60, MAX_TAPS: 420 } as const
export const WH_TICKS = WH.DUR * WH.FPS
export const WH_POINTS = { zoy: 10, gold: 30, cloud: -15, miss: -3, streakEvery: 5, streakBonus: 6 } as const

export type MoleKind = 'zoy' | 'gold' | 'cloud'
export type Mole = { id: number; hole: number; kind: MoleKind; start: number; dur: number }
export type Tap = { t: number; h: number }
export type WhackHit = { kind: MoleKind | 'miss'; points: number; bonus: number; hole: number; id?: number }

/** The full pop-up plan for one round. Pops get shorter and more frequent as the round goes on. */
export function schedule(seed: number): Mole[] {
  const r = mulberry32(seed)
  const moles: Mole[] = []
  const busyUntil: number[] = new Array(WH.HOLES).fill(0)
  let t = 45
  let id = 1
  while (t < WH_TICKS - 30) {
    const k = t / WH_TICKS
    const roll = r()
    const kind: MoleKind = roll < 0.07 ? 'gold' : roll < 0.22 ? 'cloud' : 'zoy'
    const dur = Math.round((kind === 'gold' ? 48 : 74) * (1 - 0.36 * k) * (0.85 + r() * 0.3))
    let hole = Math.floor(r() * WH.HOLES)
    for (let n = 0; n < WH.HOLES && busyUntil[hole] > t; n++) hole = (hole + 1) % WH.HOLES
    if (busyUntil[hole] <= t) {
      moles.push({ id: id++, hole, kind, start: t, dur })
      busyUntil[hole] = t + dur + 14
    }
    t += Math.round((40 - 17 * k) * (0.7 + r() * 0.6))
  }
  return moles
}

export type WhackState = { moles: Mole[]; hit: Set<number>; score: number; streak: number; hits: number; lastT: number; taps: number }

export function createWhack(seed: number): WhackState {
  return { moles: schedule(seed), hit: new Set(), score: 0, streak: 0, hits: 0, lastT: -1, taps: 0 }
}

/** Is `m` sticking out of its box at tick `t` (and not already booped)? */
export const isUp = (s: WhackState, m: Mole, t: number) => !s.hit.has(m.id) && t >= m.start && t < m.start + m.dur

/** Apply one tap. Returns `null` for impossible taps (time going backwards, bad box, too many taps). */
export function tap(s: WhackState, p: Tap): WhackHit | null {
  if (!Number.isInteger(p.t) || !Number.isInteger(p.h) || p.h < 0 || p.h >= WH.HOLES) return null
  if (p.t < s.lastT || p.t < 0 || p.t >= WH_TICKS || s.taps >= WH.MAX_TAPS) return null
  s.lastT = p.t
  s.taps++
  const m = s.moles.find((x) => x.hole === p.h && isUp(s, x, p.t))
  if (!m) {
    s.streak = 0
    s.score = Math.max(0, s.score + WH_POINTS.miss)
    return { kind: 'miss', points: WH_POINTS.miss, bonus: 0, hole: p.h }
  }
  s.hit.add(m.id)
  const points = WH_POINTS[m.kind]
  let bonus = 0
  if (m.kind === 'cloud') {
    s.streak = 0
  } else {
    s.hits++
    s.streak++
    if (s.streak % WH_POINTS.streakEvery === 0) bonus = WH_POINTS.streakBonus
  }
  s.score = Math.max(0, s.score + points + bonus)
  return { kind: m.kind, points, bonus, hole: p.h, id: m.id }
}

/** Server-side replay of the recorded taps. */
export function replayWhack(seed: number, taps: Tap[]) {
  const s = createWhack(seed)
  let invalid = 0
  for (const p of taps) if (!tap(s, { t: Number(p?.t), h: Number(p?.h) })) invalid++
  return { score: s.score, invalid, hits: s.hits, lastT: Math.max(0, s.lastT) }
}

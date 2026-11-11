/**
 * "Toy Drop" — catch falling toys in a basket (docs/03 §2–4).
 *
 * The whole game is a pure, fixed-timestep simulation driven by a server-issued seed and the
 * player's basket position per tick. The browser renders it; the server replays the recorded
 * inputs with the same seed and recomputes the score, so a forged score is detected.
 */
import { mulberry32 } from './rng'

// Difficulty (2026-11): basket 84→80, gold 8%→7.2%, rain clouds 17%→20.3%, catch margin .35→.30 r —
// calibrated with simulated players: average score −6.8%, the 30 % tier reached by 33 % instead of 44 %.
export const TD = { W: 360, H: 480, DUR: 30, FPS: 60, BASKET_Y: 438, BASKET_W: 80 } as const
export const TICKS = TD.DUR * TD.FPS
const DT = 1 / TD.FPS

export type Kind = 'toy' | 'gold' | 'cloud'
export type Item = { id: number; x: number; y: number; vy: number; rot: number; spin: number; r: number; kind: Kind; toy: number; v: number; glow: number; done: boolean }
export type Hit = { kind: Kind; points: number; x: number }
export type State = { tick: number; score: number; caught: number; items: Item[]; bx: number; spawnAcc: number; nextId: number; rng: () => number }

export const POINTS: Record<Kind, number> = { toy: 10, gold: 50, cloud: -20 }

export function createState(seed: number): State {
  return { tick: 0, score: 0, caught: 0, items: [], bx: TD.W / 2, spawnAcc: 0.5, nextId: 1, rng: mulberry32(seed) }
}

export const clampX = (x: number) => Math.max(TD.BASKET_W / 2, Math.min(TD.W - TD.BASKET_W / 2, x))

function spawn(s: State) {
  const r = s.rng
  const roll = r()
  const k = Math.min(1, s.tick / TICKS)
  const it: Item = { id: s.nextId++, x: 26 + r() * (TD.W - 52), y: -30, vy: (150 + 130 * k) * (0.85 + r() * 0.3), rot: 0, spin: (r() - 0.5) * 3, r: 16, kind: 'toy', toy: 0, v: 0, glow: 0, done: false }
  if (roll < 0.072) {
    it.kind = 'gold'; it.r = 20; it.vy *= 1.15; it.spin = 0.6
  } else if (roll < 0.275) {
    it.kind = 'cloud'; it.r = 20; it.spin = 0
  } else {
    it.toy = Math.floor(r() * 4); it.v = Math.floor(r() * 21)
  }
  s.items.push(it)
}

/** Advance one tick with the basket aiming at `targetX`. Returns what was caught this tick. */
export function step(s: State, targetX: number): Hit[] {
  const hits: Hit[] = []
  if (s.tick >= TICKS) return hits
  const k = Math.min(1, s.tick / TICKS)
  s.spawnAcc += DT
  const interval = 0.78 - 0.36 * k
  while (s.spawnAcc >= interval) {
    s.spawnAcc -= interval
    spawn(s)
  }
  s.bx += (clampX(targetX) - s.bx) * Math.min(1, DT * 16)
  for (const it of s.items) {
    it.y += it.vy * DT
    it.rot += it.spin * DT
    it.glow += DT
    if (!it.done && it.y + it.r >= TD.BASKET_Y - 6 && it.y - it.r <= TD.BASKET_Y + 12 && Math.abs(it.x - s.bx) <= TD.BASKET_W / 2 + it.r * 0.3) {
      it.done = true
      const pts = POINTS[it.kind]
      s.score = Math.max(0, s.score + pts)
      if (pts > 0) s.caught++
      hits.push({ kind: it.kind, points: pts, x: it.x })
    }
  }
  s.items = s.items.filter((it) => !it.done && it.y - it.r < TD.H + 10)
  s.tick++
  return hits
}

/** Server-side replay: recompute the score from the seed and the recorded basket targets. */
export function replay(seed: number, inputs: number[]): { score: number; caught: number; complete: boolean } {
  const s = createState(seed)
  let last = TD.W / 2
  for (let i = 0; i < TICKS; i++) {
    const v = inputs[i]
    if (typeof v === 'number' && Number.isFinite(v)) last = v
    step(s, last)
  }
  return { score: s.score, caught: s.caught, complete: inputs.length >= TICKS }
}

export type Tier = { minScore: number; percent: number }
export const tierFor = (score: number, tiers: Tier[]) => [...tiers].sort((a, b) => b.minScore - a.minScore).find((t) => score >= t.minScore)?.percent ?? 0

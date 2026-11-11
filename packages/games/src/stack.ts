/**
 * "Toy Tower" — a block slides back and forth above the tower; tap to drop it. Whatever hangs
 * over the edge is cut off, so the next block is narrower. A near-perfect drop keeps the width.
 *
 * Block movement is a pure function of the tick, the level and the seed, so the server replays
 * the recorded drop ticks and gets exactly the same tower and score.
 */
import { mulberry32 } from './rng'

export const ST = { W: 360, H: 480, FPS: 60, LIMIT: 40, BLOCK_H: 26, BASE_W: 200, PERFECT: 4, SPAWN_DELAY: 18, MAX_LEVELS: 80 } as const
export const ST_TICKS = ST.LIMIT * ST.FPS
export const ST_POINTS = { block: 13, perfect: 9, perfectStreak: 3 } as const

export type Block = { x: number; w: number; level: number; perfect: boolean; toy: number }
export type StackState = {
  rng: () => number
  tower: Block[]
  /** the block currently moving */
  cur: { level: number; w: number; spawn: number; fromLeft: boolean; speed: number; toy: number } | null
  score: number
  perfectRun: number
  over: boolean
  lastDrop: number
}
export type DropResult = { kind: 'place' | 'perfect' | 'fall'; x: number; w: number; cut: number; cutX: number; points: number }

const base = (): Block => ({ x: (ST.W - ST.BASE_W) / 2, w: ST.BASE_W, level: 0, perfect: false, toy: 0 })

function spawn(s: StackState, at: number) {
  const top = s.tower[s.tower.length - 1]
  const level = top.level + 1
  s.cur = { level, w: top.w, spawn: at, fromLeft: s.rng() < 0.5, speed: Math.min(300, 120 + level * 7) * (0.94 + s.rng() * 0.12), toy: Math.floor(s.rng() * 8) }
}

export function createStack(seed: number): StackState {
  const s: StackState = { rng: mulberry32(seed), tower: [base()], cur: null, score: 0, perfectRun: 0, over: false, lastDrop: 0 }
  spawn(s, 0)
  return s
}

/** Left edge of the moving block at tick `t` (it bounces between the walls). */
export function movingX(s: StackState, t: number): number {
  const c = s.cur
  if (!c) return 0
  const range = ST.W - c.w
  if (range <= 0) return 0
  const d = (c.speed * Math.max(0, t - c.spawn)) / ST.FPS
  const p = d % (2 * range)
  const pos = p <= range ? p : 2 * range - p
  return c.fromLeft ? pos : range - pos
}

/** Drop the moving block at tick `t`. Returns `null` for impossible drops (before it appeared, after time). */
export function drop(s: StackState, t: number): DropResult | null {
  const c = s.cur
  if (s.over || !c || !Number.isInteger(t) || t < c.spawn || t >= ST_TICKS) return null
  const top = s.tower[s.tower.length - 1]
  let x = movingX(s, t)
  const left = Math.max(x, top.x)
  const right = Math.min(x + c.w, top.x + top.w)
  s.lastDrop = t
  if (right - left <= 0) {
    s.over = true
    s.cur = null
    return { kind: 'fall', x, w: c.w, cut: c.w, cutX: x, points: 0 }
  }
  let w = right - left
  let kind: DropResult['kind'] = 'place'
  let cut = c.w - w
  let cutX = x < top.x ? x : left + w
  let points: number = ST_POINTS.block
  if (Math.abs(x - top.x) <= ST.PERFECT) {
    kind = 'perfect'
    x = top.x
    w = c.w
    cut = 0
    cutX = x
    points += ST_POINTS.perfect + ST_POINTS.perfectStreak * s.perfectRun
    s.perfectRun++
  } else {
    x = left
    s.perfectRun = 0
  }
  s.tower.push({ x, w, level: c.level, perfect: kind === 'perfect', toy: c.toy })
  s.score += points
  if (c.level >= ST.MAX_LEVELS) {
    s.over = true
    s.cur = null
  } else spawn(s, t + ST.SPAWN_DELAY)
  return { kind, x, w, cut, cutX, points }
}

/** Server-side replay of the recorded drop ticks. */
export function replayStack(seed: number, drops: number[]) {
  const s = createStack(seed)
  let invalid = 0
  for (const t of drops) if (!drop(s, Math.round(Number(t)))) invalid++
  return { score: s.score, invalid, blocks: s.tower.length - 1, lastT: s.lastDrop }
}

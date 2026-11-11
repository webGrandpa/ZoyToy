/**
 * The game catalogue: one place that knows every mini-game, how long a fair round takes and how
 * the server re-checks a finished round. Scores of all games share one scale (a typical round
 * lands around 300–450, an excellent one 600+), so the same reward tiers work for any game.
 */
import { replay as replayToyDrop, TD, TICKS } from './toy-drop'
import { MEM, MEM_FAIR, replayMemory, type Flip } from './memory'
import { WH, WH_FAIR, WH_TICKS, replayWhack, type Tap } from './whack'
import { ST, ST_TICKS, replayStack } from './stack'

export const GAME_IDS = ['toy-drop', 'memory', 'whack', 'stack'] as const
export type GameId = (typeof GAME_IDS)[number]
export const isGameId = (v: unknown): v is GameId => typeof v === 'string' && (GAME_IDS as readonly string[]).includes(v)

export type Verdict = { score: number; reasons: string[] }

/**
 * Replay a finished round on the server.
 * `elapsedMs` = real time between the server handing out the seed and the result arriving
 * (it includes the 2-second countdown and the network).
 */
export function verifyRound(game: GameId, seed: number, input: unknown, claimed: number, elapsedMs: number): Verdict {
  const reasons: string[] = []
  let score = 0
  const list = Array.isArray(input) ? input : []
  if (!Array.isArray(input)) reasons.push('bad_input')
  if (game === 'toy-drop') {
    const inputs = list.slice(0, TICKS).map((v) => Math.max(0, Math.min(TD.W, Math.round(Number(v)))))
    const r = replayToyDrop(seed, inputs)
    score = r.score
    if (!r.complete) reasons.push('incomplete')
    if (elapsedMs < TD.DUR * 1000 - 2000) reasons.push('too_fast')
  } else if (game === 'memory') {
    if (list.length > MEM.MAX_FLIPS) reasons.push('too_many')
    const r = replayMemory(seed, list.slice(0, MEM.MAX_FLIPS) as Flip[])
    score = r.score
    if (r.invalid) reasons.push('invalid_moves')
    if (elapsedMs < r.lastT - 1500) reasons.push('too_fast')
    if (r.blind > MEM_FAIR.MAX_BLIND) reasons.push('lucky_matches')
    if (r.doneAt !== null && r.doneAt < MEM_FAIR.MIN_DONE_MS) reasons.push('too_quick')
  } else if (game === 'whack') {
    if (list.length > WH.MAX_TAPS) reasons.push('too_many')
    const r = replayWhack(seed, list.slice(0, WH.MAX_TAPS) as Tap[])
    score = r.score
    if (r.invalid) reasons.push('invalid_moves')
    if (elapsedMs < (WH_TICKS / WH.FPS) * 1000 - 2000) reasons.push('too_fast')
    if (r.quick > WH_FAIR.MAX_QUICK_HITS) reasons.push('inhuman_reactions')
  } else if (game === 'stack') {
    if (list.length > ST.MAX_LEVELS + 1) reasons.push('too_many')
    const r = replayStack(seed, list.slice(0, ST.MAX_LEVELS + 1) as number[])
    score = r.score
    if (r.invalid) reasons.push('invalid_moves')
    if (elapsedMs < (r.lastT / ST.FPS) * 1000 - 1500) reasons.push('too_fast')
    if (r.lastT > ST_TICKS) reasons.push('too_long')
  }
  if (elapsedMs > 15 * 60 * 1000) reasons.push('too_slow')
  if (Number(claimed) !== score) reasons.push('score_mismatch')
  return { score, reasons }
}

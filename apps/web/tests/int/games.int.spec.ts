import { describe, it, expect } from 'vitest'
import { createMemory, deal, flip, MEM, MEM_POINTS, replayMemory, type Flip } from '@zoytoy/games/memory'
import { createWhack, schedule, tap, WH, WH_POINTS, replayWhack } from '@zoytoy/games/whack'
import { createStack, drop, movingX, ST, ST_POINTS, replayStack } from '@zoytoy/games/stack'
import { verifyRound, isGameId, GAME_IDS } from '@zoytoy/games/catalog'

/** Solve the memory board perfectly (knowing the deck), one flip every `gap` ms. */
function perfectMemory(seed: number, gap = 400): Flip[] {
  const deck = deal(seed)
  const flips: Flip[] = []
  let t = 0
  for (let v = 0; v < MEM.PAIRS; v++) {
    const [a, b] = deck.flatMap((x, i) => (x === v ? [i] : []))
    flips.push({ t: (t += gap), i: a }, { t: (t += gap), i: b })
  }
  return flips
}

/** A player with perfect memory who still has to look: turns unseen cards, matches what it has seen. */
function humanMemory(seed: number, gap = 600): Flip[] {
  const deck = deal(seed)
  const seen = new Map<number, number[]>()
  const done = new Set<number>()
  const flips: Flip[] = []
  let t = 0
  let next = 0
  const look = (i: number) => {
    flips.push({ t: (t += gap), i })
    seen.set(deck[i], [...(seen.get(deck[i]) ?? []).filter((x) => x !== i), i])
  }
  while (done.size < deck.length) {
    const known = [...seen.entries()].find(([v, idx]) => idx.length === 2 && !done.has(idx[0]) && v >= 0)
    if (known) {
      look(known[1][0])
      look(known[1][1])
      known[1].forEach((i) => done.add(i))
      continue
    }
    while (done.has(next) || (seen.get(deck[next]) ?? []).includes(next)) next++
    const a = next++
    look(a)
    const partner = (seen.get(deck[a]) ?? []).find((i) => i !== a)
    if (partner !== undefined) {
      look(partner)
      done.add(a).add(partner)
      continue
    }
    while (done.has(next) || (seen.get(deck[next]) ?? []).includes(next)) next++
    const b = next++
    look(b)
    if (deck[a] === deck[b]) done.add(a).add(b)
    else t += 700 // cards turn back
  }
  return flips
}

describe('memory', () => {
  it('deals every toy exactly twice, the same way for the same seed', () => {
    const d = deal(42)
    expect(d).toHaveLength(16)
    for (let v = 0; v < MEM.PAIRS; v++) expect(d.filter((x) => x === v)).toHaveLength(2)
    expect(deal(42)).toEqual(d)
    expect(deal(43)).not.toEqual(d)
  })

  it('scores a perfect game: matches, streak bonus and seconds left', () => {
    const flips = perfectMemory(7)
    const r = replayMemory(7, flips)
    const streak = MEM_POINTS.streak * (0 + 1 + 2 + 3 + 4 + 5 + 6 + 7)
    const left = Math.floor((MEM.LIMIT_MS - flips[flips.length - 1].t) / 1000)
    expect(r.invalid).toBe(0)
    expect(r.done).toBe(true)
    expect(r.score).toBe(MEM.PAIRS * MEM_POINTS.match + streak + left * MEM_POINTS.perSecondLeft)
  })

  it('rejects impossible flips: too fast, while cards turn back, or the same card twice', () => {
    const s = createMemory(9)
    const deck = s.deck
    const a = 0
    const b = deck.findIndex((x, i) => i !== a && x !== deck[a])
    expect(flip(s, { t: 100, i: a })).not.toBeNull()
    expect(flip(s, { t: 120, i: b })).toBeNull() // faster than a human can click
    expect(flip(s, { t: 300, i: a })).toBeNull() // already face up
    expect(flip(s, { t: 300, i: b })?.kind).toBe('miss')
    expect(flip(s, { t: 400, i: a })).toBeNull() // cards are still turning back
    expect(flip(s, { t: 300 + MEM.FLIP_BACK_MS, i: a })).not.toBeNull()
  })
})

describe('peek-a-zoy (whack)', () => {
  it('builds the same pop-up plan from the same seed, never two pops in one box at once', () => {
    const plan = schedule(5)
    expect(schedule(5)).toEqual(plan)
    for (const m of plan) {
      const clash = plan.find((o) => o !== m && o.hole === m.hole && o.start < m.start + m.dur && m.start < o.start + o.dur)
      expect(clash).toBeUndefined()
    }
  })

  it('scores taps by what is up in that box at that tick', () => {
    const s = createWhack(11)
    const zoy = s.moles.find((m) => m.kind === 'zoy')!
    const hit = tap(s, { t: zoy.start + 5, h: zoy.hole })
    expect(hit?.kind).toBe('zoy')
    expect(hit?.points).toBe(WH_POINTS.zoy)
    const again = tap(s, { t: zoy.start + 6, h: zoy.hole }) // already booped → a miss
    expect(again?.kind).toBe('miss')
    expect(tap(s, { t: zoy.start + 1, h: zoy.hole })).toBeNull() // time can't go backwards
  })

  it('replays the same taps to the same score', () => {
    const plan = schedule(23)
    const taps = plan.filter((m) => m.kind !== 'cloud').map((m) => ({ t: m.start + 10, h: m.hole }))
    const live = createWhack(23)
    for (const p of taps) tap(live, p)
    const r = replayWhack(23, taps)
    expect(r.invalid).toBe(0)
    expect(r.score).toBe(live.score)
    expect(r.score).toBeGreaterThan(400)
  })
})

describe('toy tower (stack)', () => {
  it('a perfect drop keeps the width and pays the bonus', () => {
    const s = createStack(3)
    const top = s.tower[0]
    let t = s.cur!.spawn
    while (Math.abs(movingX(s, t) - top.x) > ST.PERFECT && t < 10_000) t++
    const r = drop(s, t)
    expect(r?.kind).toBe('perfect')
    expect(r?.w).toBe(ST.BASE_W)
    expect(s.score).toBe(ST_POINTS.block + ST_POINTS.perfect)
  })

  it('cuts the overhang and ends when the block misses the tower', () => {
    const s = createStack(4)
    const until = (pred: (t: number) => boolean, from: number) => {
      for (let t = from; t < from + 5000; t++) if (pred(t)) return t
      throw new Error('never happened')
    }
    // drop the first block at the far right end of its path: a big overhang gets cut off
    const t1 = until((t) => movingX(s, t) >= ST.W - ST.BASE_W - 0.5, s.cur!.spawn)
    const r = drop(s, t1)
    expect(r?.kind).toBe('place')
    expect(r!.w).toBeLessThan(ST.BASE_W)
    // the next, narrower block can now pass completely beside the tower — dropping there is a fall
    const top = s.tower[s.tower.length - 1]
    const t2 = until((t) => movingX(s, t) + s.cur!.w < top.x - 1, s.cur!.spawn)
    expect(drop(s, t2)?.kind).toBe('fall')
    expect(s.over).toBe(true)
  })

  it('replays recorded drop ticks to the same tower', () => {
    const live = createStack(8)
    const drops: number[] = []
    for (let i = 0; i < 6 && live.cur; i++) {
      const t = live.cur.spawn + 30 + i * 7
      drops.push(t)
      drop(live, t)
    }
    const r = replayStack(8, drops)
    expect(r.invalid).toBe(0)
    expect(r.score).toBe(live.score)
    expect(r.blocks).toBe(live.tower.length - 1)
  })
})

describe('server verification (catalog)', () => {
  it('knows all four games', () => {
    expect(GAME_IDS).toEqual(['toy-drop', 'memory', 'whack', 'stack'])
    expect(isGameId('memory')).toBe(true)
    expect(isGameId('chess')).toBe(false)
  })

  it('accepts an honest memory round and rejects a forged score', () => {
    const flips = humanMemory(31)
    const real = replayMemory(31, flips).score
    const lastT = flips[flips.length - 1].t
    expect(verifyRound('memory', 31, flips, real, lastT + 2500).reasons).toEqual([])
    expect(verifyRound('memory', 31, flips, real + 100, lastT + 2500).reasons).toContain('score_mismatch')
    expect(verifyRound('memory', 31, flips, real, lastT - 5000).reasons).toContain('too_fast')
  })

  it('rejects a memory round solved from the seed: every pair found at first sight, too quickly', () => {
    for (const seed of [12345, 987654321, 42]) {
      const flips = perfectMemory(seed, 90)
      const r = verifyRound('memory', seed, flips, replayMemory(seed, flips).score, 5000)
      expect(r.reasons).toContain('lucky_matches')
      expect(r.reasons).toContain('too_quick')
      // slowing the script down doesn't help: it still never looked at a card before matching it
      const slow = perfectMemory(seed, 1500)
      expect(verifyRound('memory', seed, slow, replayMemory(seed, slow).score, 30_000).reasons).toContain('lucky_matches')
    }
  })

  it('rejects a whack round that finished faster than the round lasts, or hits with inhuman reactions', () => {
    const honest = schedule(2).slice(0, 5).map((m) => ({ t: m.start + 14, h: m.hole }))
    const score = replayWhack(2, honest).score
    expect(verifyRound('whack', 2, honest, score, 10_000).reasons).toContain('too_fast')
    expect(verifyRound('whack', 2, honest, score, (WH.DUR + 2) * 1000).reasons).toEqual([])
    const bot = schedule(2).filter((m) => m.kind !== 'cloud').map((m) => ({ t: m.start + 2, h: m.hole }))
    expect(verifyRound('whack', 2, bot, replayWhack(2, bot).score, (WH.DUR + 2) * 1000).reasons).toContain('inhuman_reactions')
  })
})

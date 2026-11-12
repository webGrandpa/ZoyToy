'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { POINTS, type Tier } from '@zoytoy/games/toy-drop'
import { MEM_POINTS } from '@zoytoy/games/memory'
import { WH_POINTS } from '@zoytoy/games/whack'
import { ST_POINTS } from '@zoytoy/games/stack'
import type { GameId } from '@zoytoy/games/catalog'
import { dateText } from '../../i18n/format'
import { contactLinks } from '../../lib/contact'
import { useI18n, useShop } from '../Providers'
import { confetti } from '../confetti'
import { ToyDropEngine } from './ToyDropEngine'
import { MemoryEngine } from './MemoryEngine'
import { WhackEngine } from './WhackEngine'
import { StackEngine } from './StackEngine'
import type { EngineProps, Hud } from './types'

export type Contact = { whatsapp?: string | null; telegram?: string | null; instagram?: string | null; phone?: string | null }
type Phase = 'idle' | 'loading' | 'count' | 'playing' | 'sending' | 'done' | 'limit' | 'error'
type Result = { score: number; percent: number; code?: string; expiresAt?: string; kept?: boolean; verdict?: string; practice: boolean }

const MAX_SCALE = 650
const ENGINES: Record<GameId, (p: EngineProps) => React.ReactNode> = {
  'toy-drop': (p) => <ToyDropEngine {...p} />,
  memory: (p) => <MemoryEngine {...p} />,
  whack: (p) => <WhackEngine {...p} />,
  stack: (p) => <StackEngine {...p} />,
}
/** legend chips: swatch class + points, in the order of the game's legend labels */
const LEGEND: Record<GameId, [string, string][]> = {
  'toy-drop': [['lg-toy', `+${POINTS.toy}`], ['lg-gold', `+${POINTS.gold}`], ['lg-cloud', `${POINTS.cloud}`]],
  memory: [['lg-pair', `+${MEM_POINTS.match}`], ['lg-streak', `+${MEM_POINTS.streak}`], ['lg-miss', `${MEM_POINTS.miss}`], ['lg-time', `+${MEM_POINTS.perSecondLeft}`]],
  whack: [['lg-zoy', `+${WH_POINTS.zoy}`], ['lg-gold', `+${WH_POINTS.gold}`], ['lg-cloud', `${WH_POINTS.cloud}`], ['lg-miss', `${WH_POINTS.miss}`]],
  stack: [['lg-block', `+${ST_POINTS.block}`], ['lg-perfect', `+${ST_POINTS.perfect}`], ['lg-streak', `+${ST_POINTS.perfectStreak}`]],
}

function deviceId() {
  try {
    let id = localStorage.getItem('zt-device')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('zt-device', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

/**
 * Everything around a round that is the same for every game: the server session (seed + token),
 * countdown, score bar with reward tiers, sending the recorded moves for verification and the
 * reward ticket. The game itself is a pluggable engine (docs/03).
 */
export function GameShell({ game, tiers, practice, contact }: { game: GameId; tiers: Tier[]; practice: boolean; contact: Contact }) {
  const { locale, m, f } = useI18n()
  const shop = useShop()
  const g = m.games.list[game]
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(3)
  const [hud, setHud] = useState<Hud>({ score: 0, left: 0 })
  const [result, setResult] = useState<Result | null>(null)
  const [round, setRound] = useState<{ id: number; token: string; seed: number; practice: boolean } | null>(null)

  const onHud = useCallback((h: Hud) => setHud((o) => (o.score === h.score && o.left === h.left && o.info === h.info ? o : h)), [])

  const onEnd = useCallback(
    async (input: unknown[], score: number) => {
      if (!round) return
      setPhase('sending')
      try {
        const res = await fetch('/api/game-sessions/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: round.id, token: round.token, inputs: input, score, deviceId: deviceId() }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const r: Result = { score: data.score, percent: data.percent ?? 0, code: data.code, expiresAt: data.expiresAt, kept: data.kept, verdict: data.verdict, practice: round.practice }
        setResult(r)
        setPhase('done')
        // the cart fills the won code in and checks it by itself (Cart.tsx)
        if (r.code)
          try {
            localStorage.setItem('zt-reward', JSON.stringify({ code: r.code, expiresAt: r.expiresAt ?? null }))
          } catch {}
        if (r.percent && !r.kept) {
          confetti(0.4)
          shop.blip(660, 0.1)
          setTimeout(() => shop.blip(990, 0.18), 110)
        }
      } catch {
        setPhase('error')
      }
    },
    [round, shop],
  )

  const start = async () => {
    document.querySelector('.td-shell')?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    setPhase('loading')
    setResult(null)
    try {
      const res = await fetch('/api/game-sessions/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId: deviceId(), game }) })
      if (res.status === 429) return setPhase('limit')
      const data = await res.json()
      if (!res.ok) throw new Error()
      setRound({ id: data.id, token: data.token, seed: data.seed, practice: data.practice })
      setHud({ score: 0, left: 0 })
      setPhase('count')
      let n = 3
      setCount(n)
      shop.blip(440, 0.1)
      const tick = () => {
        n -= 1
        if (n === 0) {
          setPhase('playing')
          shop.blip(880, 0.14)
          return
        }
        setCount(n)
        shop.blip(440 + (3 - n) * 120, 0.1)
        setTimeout(tick, 650)
      }
      setTimeout(tick, 650)
    } catch {
      setPhase('error')
    }
  }

  const sortedTiers = [...tiers].sort((a, b) => a.minScore - b.minScore)
  const best = Math.max(hud.score, result?.score ?? 0)
  const next = sortedTiers.find((t) => (result?.score ?? 0) < t.minScore)
  const sendText = result?.code ? f(m.play.sendText, { code: result.code, p: result.percent }) : ''
  const links = contactLinks(contact, sendText)
  const legend = LEGEND[game]

  return (
    <div className="td" data-game={game}>
      <div className="td-shell">
        <div className="td-hud">
          <span className="td-score" aria-live="off">{hud.score}</span>
          <div className="td-bar" aria-hidden="true">
            <i style={{ width: `${Math.min(100, (best / MAX_SCALE) * 100)}%` }} />
            {sortedTiers.map((t) => (
              <b key={t.minScore} style={{ left: `${(t.minScore / MAX_SCALE) * 100}%` }}><span>−{t.percent}%</span></b>
            ))}
          </div>
          <span className="td-time">{phase === 'playing' || phase === 'sending' ? f(m.play.time, { n: hud.left }) : '⏱'}</span>
        </div>
        <div className="td-stage">
          {ENGINES[game]({ seed: round?.seed ?? null, running: phase === 'playing', onHud, onEnd, blip: shop.blip, label: g.aria, perfectText: m.games.perfect })}
          {phase === 'idle' || phase === 'loading' || phase === 'limit' || phase === 'error' ? (
            <div className="td-over">
              <GiraffeHead className="td-zoy" />
              <h2>{phase === 'limit' ? m.play.limit : phase === 'error' ? m.play.error : g.name}</h2>
              {phase === 'idle' || phase === 'loading' ? (
                <>
                  <p>{g.ready}</p>
                  <ul className="td-mini" aria-label={m.play.score}>
                    {legend.map(([cls, pts], i) => <li key={cls + i}><i className={`lg ${cls}`} />{pts}</li>)}
                  </ul>
                </>
              ) : null}
              {practice && phase === 'idle' ? <p className="td-note">{m.play.practice}</p> : null}
              {phase !== 'limit' ? (
                <button type="button" className="zt-btn zt-btn--game zt-btn--lg" onClick={start} disabled={phase === 'loading'}>
                  {phase === 'loading' ? m.play.loading : m.play.start}
                </button>
              ) : (
                <Link className="zt-btn" href={`/${locale}/shop`}>{m.play.toShop}</Link>
              )}
            </div>
          ) : null}
          {phase === 'count' ? <div className="td-over td-count"><span key={count}>{count}</span></div> : null}
          {phase === 'sending' ? <div className="td-over"><GiraffeHead className="td-zoy spin" /><p>…</p></div> : null}
          {phase === 'done' && result ? (
            <div className="td-over">
              {result.verdict === 'rejected' ? (
                <h2>{m.play.rejected}</h2>
              ) : result.percent ? (
                <>
                  <h2>{f(result.kept ? m.play.kept : m.play.win, { score: result.score })}</h2>
                  <p>{result.kept ? m.play.keptText : m.play.winText}</p>
                  <div className="td-ticket">
                    <span className="pct">−{result.percent}%</span>
                    <span>
                      <b className="code">{result.code}</b>
                      {result.expiresAt ? <small>{f(m.play.validUntil, { date: dateText(locale, result.expiresAt) })}</small> : null}
                    </span>
                  </div>
                  <div className="td-actions">
                    <a className="zt-btn zt-btn--wa zt-btn--sm" href={links.whatsapp} target="_blank" rel="noopener">{m.play.send}</a>
                    <button type="button" className="zt-btn zt-btn--secondary zt-btn--sm" onClick={() => navigator.clipboard?.writeText(result.code ?? '').then(() => shop.toast(m.play.copied), () => undefined)}>{m.play.copy}</button>
                  </div>
                  <p className="td-note">{m.play.howUse}</p>
                </>
              ) : (
                <>
                  <GiraffeHead className="td-zoy" />
                  <h2>{f(result.practice ? m.play.practiceDone : m.play.lose, { score: result.score })}</h2>
                  {!result.practice && next ? <p>{f(m.play.loseText, { n: next.minScore - result.score, p: next.percent })}</p> : null}
                </>
              )}
              <div className="td-actions">
                <button type="button" className="zt-btn zt-btn--game zt-btn--sm" onClick={start}>{m.play.again}</button>
                <Link className="zt-btn zt-btn--ghost zt-btn--sm" href={`/${locale}/shop`}>{m.play.toShop}</Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="td-side">
        <ol className="td-tiers">
          {sortedTiers.map((t, i) => (
            <li key={t.minScore} className={best >= t.minScore ? 'reached' : undefined}>
              <span className={`medal m${i}`}>−{t.percent}%</span>
              <b>{m.play.tiers[i] ?? m.play.tiers[m.play.tiers.length - 1]}</b>
              <span className="pts">{t.minScore}+</span>
            </li>
          ))}
        </ol>
        <div className="td-legend">
          {legend.map(([cls, pts], i) => (
            <span key={cls + i}><i className={`lg ${cls}`} />{g.legend[i]} <b>{pts}</b></span>
          ))}
        </div>
        <div className="td-fair">
          <h3>{m.play.fairTitle}</h3>
          <ol>{m.play.fair.map((x) => <li key={x}>{x}</li>)}</ol>
        </div>
      </div>
    </div>
  )
}

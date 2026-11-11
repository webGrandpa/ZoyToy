'use client'

import { useEffect, useRef, useState } from 'react'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { createWhack, isUp, tap, WH, WH_TICKS, type Mole, type Tap, type WhackState } from '@zoytoy/games/whack'
import { tickAt, type EngineProps } from './types'
import { useLatest } from './useLatest'

const BOX = ['bubble', 'sun', 'sky', 'mint', 'grape', 'tangerine', 'sky', 'bubble', 'sun']
const RISE = 7 // ticks to pop up / to hide again
type Fx = { key: number; hole: number; txt: string; kind: string }

/** A grumpy rain cloud — the one you must not tap. */
function RainCloud() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <path d="M30 70 h62 a20 20 0 0 0 2 -40 a27 27 0 0 0 -50 -6 a21 21 0 0 0 -30 16 a16 16 0 0 0 16 30z" fill="#9AA3C7" stroke="var(--zt-edge)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M44 42 l12 5 M78 42 l-12 5" stroke="var(--zt-edge)" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="51" cy="52" r="3.6" fill="var(--zt-edge)" />
      <circle cx="71" cy="52" r="3.6" fill="var(--zt-edge)" />
      <path d="M52 64 q9 -6 18 0" fill="none" stroke="var(--zt-edge)" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 80 l-4 12 M62 82 l-4 12 M82 80 l-4 12" stroke="var(--zt-sky)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

/** Peek-a-Zoy — 3×3 toy boxes; tap Zoy when he pops out. Taps are recorded as (tick, box) for the server. */
export function WhackEngine({ seed, running, onHud, onEnd, blip, label }: EngineProps) {
  const cb = useLatest({ onHud, onEnd, blip })
  const st = useRef<WhackState | null>(null)
  const taps = useRef<Tap[]>([])
  const start = useRef(0)
  const boops = useRef(new Map<number, { mole: Mole; at: number }>())
  const fxKey = useRef(0)
  const [tick, setTick] = useState(-1)
  const [fx, setFx] = useState<Fx[]>([])

  useEffect(() => {
    if (seed === null) return
    st.current = createWhack(seed)
    taps.current = []
    boops.current.clear()
    setTick(-1)
    setFx([])
  }, [seed])

  useEffect(() => {
    const s = st.current
    if (!running || !s) return
    start.current = performance.now()
    let raf = 0
    const loop = () => {
      const t = tickAt(start.current)
      setTick(t)
      cb.current.onHud({ score: s.score, left: Math.max(0, Math.ceil(WH.DUR - t / WH.FPS)) })
      if (t >= WH_TICKS) return cb.current.onEnd(taps.current, s.score)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, cb])

  const hit = (h: number) => {
    const s = st.current
    if (!running || !s) return
    const t = tickAt(start.current)
    if (t >= WH_TICKS) return
    const r = tap(s, { t, h })
    if (!r) return
    taps.current.push({ t, h })
    if (r.id) {
      const mole = s.moles.find((m) => m.id === r.id)
      if (mole) boops.current.set(mole.id, { mole, at: t })
    }
    const key = ++fxKey.current
    const txt = r.kind === 'miss' ? `${r.points}` : `${r.points > 0 ? '+' : ''}${r.points}${r.bonus ? ` +${r.bonus}` : ''}`
    setFx((f) => [...f, { key, hole: h, txt, kind: r.kind }])
    setTimeout(() => setFx((f) => f.filter((x) => x.key !== key)), 800)
    if (r.kind === 'zoy') cb.current.blip(820, 0.07)
    else if (r.kind === 'gold') { cb.current.blip(1180, 0.12); if (navigator.vibrate) navigator.vibrate(15) }
    else if (r.kind === 'cloud') { cb.current.blip(180, 0.2, 'sawtooth'); if (navigator.vibrate) navigator.vibrate([20, 40, 20]) }
    else cb.current.blip(300, 0.05, 'square')
  }

  useEffect(() => {
    if (!running) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= 9) { e.preventDefault(); hit(n - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // re-bound every render on purpose: `hit` reads the latest state

  const s = st.current
  return (
    <div className={`wh${running ? ' live' : ''}`} role="group" aria-label={label}>
      <div className="wh-sky" aria-hidden="true" />
      {Array.from({ length: WH.HOLES }, (_, h) => {
        let up: Mole | undefined
        let p = 0
        let booped: { mole: Mole; at: number } | undefined
        if (s && tick >= 0) {
          up = s.moles.find((m) => m.hole === h && isUp(s, m, tick))
          if (up) p = Math.min(1, (tick - up.start) / RISE, (up.start + up.dur - tick) / RISE)
          for (const b of boops.current.values()) if (b.mole.hole === h && tick - b.at < 16) booped = b
        } else if (!running && seed === null && (h === 1 || h === 5)) {
          // attract picture before the first round
          up = { id: -h, hole: h, kind: h === 1 ? 'zoy' : 'gold', start: 0, dur: 1 }
          p = 1
        }
        const shown = booped ? booped.mole : up
        const kind = shown?.kind
        return (
          <button key={h} type="button" className={`wh-hole tint-${BOX[h]}`} onPointerDown={(e) => { e.preventDefault(); hit(h) }} disabled={!running} aria-label={`${h + 1}`}>
            <span className="wh-mask">
              {shown ? (
                <span
                  className={`wh-pop k-${kind}${booped ? ' booped' : ''}`}
                  style={booped ? undefined : { transform: `translateY(${((1 - p) * 105).toFixed(1)}%)` }}
                  key={shown.id}
                >
                  {kind === 'cloud' ? <RainCloud /> : <GiraffeHead />}
                  {kind === 'gold' ? <i className="wh-crown" /> : null}
                </span>
              ) : null}
            </span>
            <span className="wh-box"><span className="wh-rim" /><b>{h + 1}</b></span>
            {fx.filter((f) => f.hole === h).map((f) => <em key={f.key} className={`wh-fx fx-${f.kind}`}>{f.txt}</em>)}
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { ToyArt, TOY_KINDS } from '@zoytoy/ui/ToyArt'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { createMemory, flip, MEM, type Flip, type MemState } from '@zoytoy/games/memory'
import type { EngineProps } from './types'
import { useLatest } from './useLatest'

const TINTS = ['bubble', 'sun', 'sky', 'mint', 'tangerine', 'grape', 'sky', 'bubble']
type Pop = { key: number; i: number; txt: string; neg: boolean }
type View = { deck: number[]; up: Set<number>; matched: Set<number>; wrong: number[] }

/** Zoy's memory — 16 cards, 8 pairs, 60 seconds. Every accepted flip is recorded for the server replay. */
export function MemoryEngine({ seed, running, onHud, onEnd, blip, label }: EngineProps) {
  const cb = useLatest({ onHud, onEnd, blip })
  const st = useRef<MemState | null>(null)
  const flips = useRef<Flip[]>([])
  const start = useRef(0)
  const popKey = useRef(0)
  const [view, setView] = useState<View>({ deck: Array.from({ length: MEM.PAIRS * 2 }, () => -1), up: new Set(), matched: new Set(), wrong: [] })
  const [pops, setPops] = useState<Pop[]>([])

  useEffect(() => {
    if (seed === null) return
    st.current = createMemory(seed)
    flips.current = []
    setView({ deck: st.current.deck, up: new Set(), matched: new Set(), wrong: [] })
    setPops([])
  }, [seed])

  useEffect(() => {
    const s = st.current
    if (!running || !s) return
    start.current = performance.now()
    let raf = 0
    let ended = false
    const loop = () => {
      const t = performance.now() - start.current
      cb.current.onHud({ score: s.score, left: Math.max(0, Math.ceil((MEM.LIMIT_MS - t) / 1000)), info: `${s.pairs}/${MEM.PAIRS}` })
      if (s.doneAt !== null || t >= MEM.LIMIT_MS) {
        if (!ended) {
          ended = true
          // let the last pair celebrate for a moment before the result card covers the board
          setTimeout(() => cb.current.onEnd(flips.current, s.score), s.doneAt !== null ? 750 : 0)
        }
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running, cb])

  const pop = (i: number, txt: string, neg = false) => {
    const key = ++popKey.current
    setPops((p) => [...p, { key, i, txt, neg }])
    setTimeout(() => setPops((p) => p.filter((x) => x.key !== key)), 900)
  }

  const onCard = (i: number) => {
    const s = st.current
    if (!running || !s) return
    const t = Math.round(performance.now() - start.current)
    const ev = flip(s, { t, i })
    if (!ev) return
    flips.current.push({ t, i })
    if (ev.kind === 'open') {
      cb.current.blip(560, 0.05)
      setView((v) => ({ ...v, up: new Set(v.up).add(i) }))
    } else if (ev.kind === 'match') {
      cb.current.blip(880, 0.1)
      setTimeout(() => cb.current.blip(1320, 0.12), 90)
      if (navigator.vibrate) navigator.vibrate(12)
      setView((v) => ({ ...v, up: new Set(v.up).add(i), matched: new Set(v.matched).add(ev.a!).add(ev.b!) }))
      pop(i, `+${ev.points}`)
      if (ev.bonus) setTimeout(() => pop(i, `+${ev.bonus} ⏱`), 350)
    } else {
      cb.current.blip(220, 0.14, 'sawtooth')
      setView((v) => ({ ...v, up: new Set(v.up).add(i), wrong: [ev.a!, ev.b!] }))
      pop(i, `${ev.points}`, true)
      setTimeout(() => {
        setView((v) => {
          const up = new Set(v.up)
          up.delete(ev.a!)
          up.delete(ev.b!)
          return { ...v, up, wrong: [] }
        })
      }, MEM.FLIP_BACK_MS - 60)
    }
  }

  return (
    <div className={`mem${running ? ' live' : ''}`} role="group" aria-label={label}>
      {view.deck.map((v, i) => {
        const up = view.up.has(i) || view.matched.has(i)
        const cls = `mem-card${up ? ' up' : ''}${view.matched.has(i) ? ' done' : ''}${view.wrong.includes(i) ? ' wrong' : ''}`
        return (
          <button key={i} type="button" className={cls} style={{ ['--i' as string]: i }} onClick={() => onCard(i)} disabled={!running || view.matched.has(i)} aria-label={`${i + 1}`} aria-pressed={up}>
            <span className="mem-inner">
              <span className="mem-back"><GiraffeHead /></span>
              <span className={`mem-front tint-${TINTS[v] ?? 'sun'}`}>{v >= 0 ? <ToyArt kind={TOY_KINDS[v]} /> : null}</span>
            </span>
            {pops.filter((p) => p.i === i).map((p) => <b key={p.key} className={`mem-pop${p.neg ? ' neg' : ''}`}>{p.txt}</b>)}
          </button>
        )
      })}
    </div>
  )
}

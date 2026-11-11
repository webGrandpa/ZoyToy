'use client'

import { useEffect, useRef, useState } from 'react'
import { useI18n, useShop } from './Providers'
import { confetti } from './confetti'

const COLORS = ['var(--zt-bubble)', 'var(--zt-sun)', 'var(--zt-sky)', 'var(--zt-mint)', 'var(--zt-tangerine)', 'var(--zt-grape)']

/** 404 page toy: balloons float up, tap to pop (docs/05 §11.7). Just for fun — no rewards. */
export function Balloons() {
  const { m, f } = useI18n()
  const { blip } = useShop()
  const [list, setList] = useState<{ id: number; left: number; dur: number; color: string }[]>([])
  const [popped, setPopped] = useState(0)
  const nextId = useRef(0)
  useEffect(() => {
    // ids come from a ref (not from inside the state updater) and every timer is cleared on unmount,
    // so a re-mount can never produce two balloons with the same key
    const add = () => {
      const id = nextId.current++
      const balloon = { id, left: 5 + Math.random() * 85, dur: 6 + Math.random() * 5, color: COLORS[id % COLORS.length] }
      setList((l) => [...l.slice(-14), balloon])
    }
    const first = Array.from({ length: 6 }, (_, i) => setTimeout(add, i * 400))
    const t = setInterval(add, 1100)
    return () => {
      first.forEach(clearTimeout)
      clearInterval(t)
    }
  }, [])
  const pop = (bid: number) => {
    setList((l) => l.filter((b) => b.id !== bid))
    setPopped((n) => {
      const next = n + 1
      if (next % 10 === 0) confetti(0.5)
      return next
    })
    blip(900 + Math.random() * 300, 0.06)
  }
  return (
    <div className="balloons-game">
      <p className="bg-hint">{m.balloons.hint} <b>{f(m.balloons.popped, { n: popped })}</b></p>
      <div className="bg-sky" aria-hidden="true">
        {list.map((b) => (
          <button key={b.id} type="button" tabIndex={-1} className="bg-balloon" style={{ left: `${b.left}%`, animationDuration: `${b.dur}s`, ['--c' as string]: b.color }} onPointerDown={() => pop(b.id)} onAnimationEnd={() => setList((l) => l.filter((x) => x.id !== b.id))} />
        ))}
      </div>
    </div>
  )
}

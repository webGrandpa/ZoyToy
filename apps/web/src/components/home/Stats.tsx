'use client'

import { useEffect, useRef, useState } from 'react'

/** Counts up mechanically when it scrolls into view. */
export function CountUp({ value, currency = false }: { value: number; currency?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(value)
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / 1400)
        setV(value * (1 - Math.pow(1 - k, 3)))
        if (k < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return <span ref={ref} className="count">{Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}{currency ? '\u00a0₾' : ''}</span>
}

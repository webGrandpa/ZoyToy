'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { money } from '../i18n'
import type { CardVM } from '../lib/data'
import { ConditionBadge } from './Condition'
import { useI18n, useShop } from './Providers'

const DURATION = 4500

/** New arrivals as Instagram-style stories (docs/05 §11.2). */
export function Stories({ items }: { items: CardVM[] }) {
  const { locale, m, f } = useI18n()
  const { blip } = useShop()
  const [open, setOpen] = useState<number | null>(null)
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const bar = useRef<HTMLElement | null>(null)
  const raf = useRef(0)
  const opener = useRef<HTMLElement | null>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    cancelAnimationFrame(raf.current)
    setOpen(null)
    opener.current?.focus({ preventScroll: true })
  }, [])
  const go = useCallback((i: number) => (i >= 0 && i < items.length ? setOpen(i) : close()), [items.length, close])

  useEffect(() => {
    if (open === null) return
    setSeen((s) => new Set(s).add(open))
    closeBtn.current?.focus({ preventScroll: true })
    const start = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / DURATION)
      if (bar.current) bar.current.style.width = `${k * 100}%`
      if (k < 1) raf.current = requestAnimationFrame(tick)
      else go(open + 1)
    }
    raf.current = requestAnimationFrame(tick)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(open + 1)
      if (e.key === 'ArrowLeft') go(Math.max(0, open - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, go, close])

  if (!items.length) return null
  const cur = open !== null ? items[open] : null

  return (
    <>
      <div className="stories" role="list">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="listitem"
            className={`story${seen.has(i) ? ' seen' : ''}`}
            aria-label={f(m.stories.open, { name: p.title })}
            onClick={(e) => {
              opener.current = e.currentTarget
              blip(700, 0.06)
              setOpen(i)
            }}
          >
            <span className="story-ring">
              <span className={`tint-${p.color}`}>{p.image ? <img src={p.image.src} alt="" loading="lazy" /> : <ToyArt kind={p.art} />}</span>
            </span>
            <small>{p.title}</small>
          </button>
        ))}
      </div>
      {cur ? (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={cur.title} onClick={(e) => e.target === e.currentTarget && close()}>
          <div className={`viewer-card tint-${cur.color}`}>
            <div>
              <div className="viewer-bars">
                {items.map((p, j) => (
                  <i key={p.id}>
                    <b ref={j === open ? (el) => { bar.current = el } : undefined} style={{ width: j < (open ?? 0) ? '100%' : '0%' }} />
                  </i>
                ))}
              </div>
              <div className="viewer-top">
                <GiraffeHead />
                <span>zoy.toy</span>
                <button ref={closeBtn} className="viewer-close" type="button" aria-label={m.a11y.close} onClick={close}>✕</button>
              </div>
            </div>
            <div className="viewer-art" key={cur.id}>
              {cur.image ? <img src={cur.image.src} srcSet={cur.image.srcSet} sizes="400px" alt={cur.image.alt || cur.title} /> : <ToyArt kind={cur.art} />}
            </div>
            <div className="viewer-info">
              <ConditionBadge condition={cur.condition} m={m} />
              <h3>{cur.title}</h3>
              <p className="muted">{m.stories.only}</p>
              <div className="row">
                <span className="price">{money(cur.price)}</span>
                <Link className="zt-btn zt-btn--sm" href={`/${locale}/p/${cur.slug}`} onClick={() => cancelAnimationFrame(raf.current)}>{m.stories.view}</Link>
              </div>
            </div>
            <button className="viewer-tap prev" type="button" aria-label={m.a11y.prev} onClick={() => go(Math.max(0, (open ?? 0) - 1))} />
            <button className="viewer-tap next" type="button" aria-label={m.a11y.next} onClick={() => go((open ?? 0) + 1)} />
          </div>
        </div>
      ) : null}
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { money } from '../i18n'
import type { ProductVM } from '../lib/data'
import { contactLinks } from '../lib/contact'
import type { SiteSetting } from '../payload-types'
import { IconLock } from './Icons'
import { useI18n, useShop } from './Providers'
import { flyToCart } from './fly'

const DAYS = [3, 7, 14]
const rentTotal = (rate: number, d: number) => Math.round(rate * d * (d >= 14 ? 0.75 : d >= 7 ? 0.85 : 1) * 100) / 100

/** Buy / rent switch with rolling price, savings jar and the rental day picker (docs/02 §7, docs/05 §5). */
export function BuyRent({ p, settings }: { p: ProductVM; settings: Pick<SiteSetting, 'whatsapp' | 'telegram' | 'instagram' | 'phone'> }) {
  const { m, f } = useI18n()
  const shop = useShop()
  const [mode, setMode] = useState<'buy' | 'rent'>('buy')
  const [days, setDays] = useState(7)
  const actionsRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = actionsRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const rental = p.rental
  const target = mode === 'buy' || !rental ? p.price : rentTotal(rental.dailyRate, days)
  const shown = useRolling(target)
  const sold = p.status === 'sold'
  const reserved = p.status === 'reserved'
  const save = mode === 'buy' && p.retailPriceNew && p.retailPriceNew > p.price ? p.retailPriceNew - p.price : null
  const ratio = save && p.retailPriceNew ? Math.min(1, save / p.retailPriceNew) : 0

  const add = (from: HTMLElement | null) => {
    const ok = shop.add({ id: p.id, slug: p.slug, title: p.title, price: p.price, img: p.image?.src ?? null, art: p.art, color: p.color })
    if (!ok) return shop.toast(f(m.product.added, { name: p.title }))
    flyToCart(from, () => {
      shop.toast(f(m.product.added, { name: p.title }))
      shop.blip(990, 0.12)
    })
  }
  const rentText = `${f(m.product.askText, { name: p.title, sku: p.sku })} ${m.product.rent}: ${f(m.product.days, { n: days })}.`

  return (
    <div className={`buyrent mode-${mode}`}>
      {rental && !sold ? (
        <div className="toggle" role="radiogroup" aria-label={m.product.buyOrRent} data-mode={mode}>
          <span className="thumb" aria-hidden="true" />
          {(['buy', 'rent'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={mode === k} onClick={() => { setMode(k); shop.blip(k === 'rent' ? 520 : 660, 0.07) }}>
              {k === 'buy' ? m.product.buy : m.product.rent}
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'rent' && rental ? (
        <div className="plans" role="radiogroup" aria-label={m.product.rent}>
          {DAYS.filter((d) => d >= rental.minDays && d <= rental.maxDays).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={days === d} className="plan" onClick={() => setDays(d)}>
              <b>{f(m.product.days, { n: d })}</b>
              <span>{money(rentTotal(rental.dailyRate, d))}</span>
              <small>{d >= 14 ? '−25%' : d >= 7 ? '−15%' : `${money(rental.dailyRate)}${m.product.perDay}`}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className="big-price" aria-live="polite">
        <span className={sold ? 'is-sold' : undefined}>{money(shown)}</span>
        {mode === 'buy' && p.compareAtPrice && p.compareAtPrice > p.price ? <s>{money(p.compareAtPrice)}</s> : null}
        {mode === 'rent' ? <small>/ {f(m.product.days, { n: days })}</small> : null}
        {sold ? <span className="zt-badge zt-badge--sold">{m.product.sold}</span> : null}
        {reserved ? <span className="zt-badge zt-badge--sold">{m.product.reserved}</span> : null}
      </div>

      {save ? (
        <div className="savings">
          <svg viewBox="0 0 60 70" aria-hidden="true">
            <defs><clipPath id={`jar-${p.id}`}><path d="M14 20 h32 q8 4 8 14 v24 q0 8 -8 8 h-32 q-8 0 -8 -8 v-24 q0 -10 8 -14z" /></clipPath></defs>
            {/* the clip sits on a still group — only the liquid inside it moves, so it can never leak out of the jar */}
            <g clipPath={`url(#jar-${p.id})`}>
              <rect className="jar-fill" x="0" y="0" width="60" height="70" fill="var(--zt-mint)" style={{ transform: `translateY(${(66 - ratio * 46).toFixed(1)}px)` }} />
              <path className="jar-wave" d="M-30 0 q7.5 -4 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 V8 H-30Z" fill="var(--zt-mint)" style={{ transform: `translateY(${(62 - ratio * 46).toFixed(1)}px)` }} />
            </g>
            <g className="coin c1"><circle cx="22" cy="58" r="6" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="2" /></g>
            <g className="coin c2"><circle cx="37" cy="59" r="6" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="2" /></g>
            <g className="coin c3"><circle cx="30" cy="48" r="6" fill="var(--zt-sun)" stroke="var(--zt-edge)" strokeWidth="2" /></g>
            <path d="M14 20 h32 q8 4 8 14 v24 q0 8 -8 8 h-32 q-8 0 -8 -8 v-24 q0 -10 8 -14z" fill="none" stroke="var(--zt-edge)" strokeWidth="3" />
            <rect x="12" y="10" width="36" height="10" rx="3" fill="var(--zt-grape)" stroke="var(--zt-edge)" strokeWidth="3" />
          </svg>
          <div>
            <b>{f(m.product.save, { amount: money(save) })}</b>
            <span>{f(m.product.newPrice, { price: money(p.retailPriceNew ?? 0) })} · {m.product.saveNote}</span>
          </div>
        </div>
      ) : null}

      {mode === 'rent' && rental ? (
        <div className="deposit">
          <IconLock />
          <span>
            <b>{f(m.product.deposit, { amount: money(rental.deposit) })}</b> {m.product.depositNote} {m.product.rentNote}
          </span>
        </div>
      ) : null}

      {!sold ? (
        <div className="buy-actions" ref={actionsRef}>
          {mode === 'buy' ? (
            <button type="button" className="zt-btn" disabled={reserved} onClick={() => add(document.querySelector<HTMLElement>('.gallery-main'))}>
              {m.product.addToCart}
            </button>
          ) : (
            <a className="zt-btn zt-btn--rent" href={contactLinks(settings, rentText).whatsapp} target="_blank" rel="noopener">
              {m.product.bookRent}
            </a>
          )}
        </div>
      ) : (
        <p className="muted">{m.product.soldNote}</p>
      )}
      {!sold && !reserved ? (
        <div className={`sticky-buy${stuck ? ' show' : ''}`} aria-hidden={!stuck}>
          <span className="sb-title">{p.title}</span>
          <span className="sb-price">{money(target)}</span>
          {mode === 'buy' ? (
            <button type="button" className="zt-btn zt-btn--sm" tabIndex={stuck ? 0 : -1} onClick={() => add(document.querySelector<HTMLElement>('.gallery-main'))}>{m.product.addToCart}</button>
          ) : (
            <a className="zt-btn zt-btn--rent zt-btn--sm" tabIndex={stuck ? 0 : -1} href={contactLinks(settings, rentText).whatsapp} target="_blank" rel="noopener">{m.product.bookRent}</a>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Mechanical-counter style number roll between prices. */
function useRolling(target: number) {
  const [v, setV] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    if (start === target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target
      setV(target)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 650)
      const e = 1 - Math.pow(1 - k, 3)
      const val = start + (target - start) * e
      from.current = val
      setV(val)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  return v
}

'use client'

import Link from 'next/link'
import { useRef, useState, type PointerEvent } from 'react'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import { dateText, money } from '../i18n'
import type { CardVM } from '../lib/data'
import { ConditionBadge, ConditionScale } from './Condition'
import { IconPlus } from './Icons'
import { useI18n, useShop } from './Providers'
import { flyToCart } from './fly'

export function ProductCard({ p }: { p: CardVM }) {
  const { locale, m, f } = useI18n()
  const shop = useShop()
  const [flipped, setFlipped] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLAnchorElement>(null)
  const href = `/${locale}/p/${p.slug}`

  const tilt = (e: PointerEvent) => {
    const el = cardRef.current
    if (!el || e.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(800px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`
  }
  const add = () => {
    const ok = shop.add({ id: p.id, slug: p.slug, title: p.title, price: p.price, img: p.image?.src ?? null, art: p.art, color: p.color })
    if (!ok) return shop.toast(f(m.product.added, { name: p.title }))
    flyToCart(imgRef.current, () => {
      shop.toast(f(m.product.added, { name: p.title }))
      shop.blip(990, 0.12)
      if (navigator.vibrate) navigator.vibrate(18)
    })
  }
  const flip = () => {
    setFlipped((v) => !v)
    shop.blip(flipped ? 520 : 640, 0.08)
  }

  const save = p.retailPriceNew && p.retailPriceNew > p.price ? p.retailPriceNew : null
  return (
    <article ref={cardRef} className={`card${flipped ? ' flipped' : ''}`} onPointerMove={tilt} onPointerLeave={() => cardRef.current && (cardRef.current.style.transform = '')}>
      <div className="card-inner">
        <div className="face front" aria-hidden={flipped}>
          <div className="card-media">
            <Link ref={imgRef} href={href} className={`card-img tint-${p.color}`} tabIndex={-1} aria-hidden="true">
              {p.image ? <img src={p.image.src} srcSet={p.image.srcSet} sizes="(max-width: 600px) 50vw, 300px" width={p.image.width} height={p.image.height} alt="" loading="lazy" decoding="async" /> : <ToyArt kind={p.art} className="card-art" />}
            </Link>
            <div className="badges">
              <ConditionBadge condition={p.condition} m={m} />
              {p.compareAtPrice && p.compareAtPrice > p.price ? <span className="zt-badge zt-badge--sale">−{Math.round((1 - p.price / p.compareAtPrice) * 100)}%</span> : null}
              {p.status === 'reserved' ? <span className="zt-badge zt-badge--sold">{m.product.reserved}</span> : null}
            </div>
            <button className="flip-btn" type="button" aria-pressed={flipped} aria-label={`${p.title}: ${m.condition.details}`} onClick={flip} tabIndex={flipped ? -1 : 0}>
              i
            </button>
            {p.status === 'published' ? (
              <button className="card-add" type="button" aria-label={`${p.title} — ${m.product.addToCart}`} onClick={add} tabIndex={flipped ? -1 : 0}>
                <IconPlus />
              </button>
            ) : null}
          </div>
          <Link href={href} className="card-link">
            <h3>{p.title}</h3>
          </Link>
          <p className="meta">
            {p.ageMin != null ? (p.ageMax ? f(m.product.ageRange, { min: Math.floor(p.ageMin / 12), max: Math.floor(p.ageMax / 12) }) : f(m.product.ageFrom, { min: Math.floor(p.ageMin / 12) })) : null}
            {p.origin ? ` · ${m.origin[p.origin]}` : null}
          </p>
          <div className="prices">
            <span className="price">
              <b>{money(p.price)}</b>
              {p.compareAtPrice && p.compareAtPrice > p.price ? <s>{money(p.compareAtPrice)}</s> : null}
            </span>
            {save ? <span className="was">{f(m.product.newPrice, { price: money(save) })}</span> : null}
            {p.rentDaily ? <span className="rent-from">{f(m.product.rentFrom, { price: money(p.rentDaily) })}</span> : null}
          </div>
        </div>
        <div className="face back" aria-hidden={!flipped}>
          <button className="flip-btn" type="button" aria-pressed={flipped} aria-label={m.condition.back} onClick={flip} tabIndex={flipped ? 0 : -1}>
            ↩
          </button>
          <h4>{m.condition[p.condition]}</h4>
          <ConditionScale condition={p.condition} m={m} />
          <ul>
            {p.back.tested ? <li><span className="ok">✓</span><span><b>{m.condition.tested}</b></span></li> : null}
            {p.back.cleanedAt ? <li><span className="ok">✓</span><span>{f(m.condition.cleaned, { date: dateText(locale, p.back.cleanedAt) })}</span></li> : null}
            <li><span className={p.back.complete ? 'ok' : 'warn'}>{p.back.complete ? '✓' : '•'}</span><span>{p.back.complete ? m.condition.complete : f(m.condition.missing, { parts: p.back.missingParts ?? '' })}</span></li>
            <li><span className="warn">•</span><span>{p.back.hasBox ? m.condition.withBox : m.condition.noBox}</span></li>
            {p.back.defects.slice(0, 3).map((d) => (
              <li key={d}><span className="warn">•</span><span>{d}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}

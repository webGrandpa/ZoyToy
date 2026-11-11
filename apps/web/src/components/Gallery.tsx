'use client'

import { useEffect, useState } from 'react'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import type { ProductVM } from '../lib/data'
import { useI18n, useShop } from './Providers'

/** Product photos with flaw hotspots and a magnifying loupe (docs/05 §11.4). */
export function Gallery({ p }: { p: Pick<ProductVM, 'gallery' | 'defects' | 'title' | 'color'> & { art: ToyKind } }) {
  const { m, f } = useI18n()
  const { blip } = useShop()
  const [i, setI] = useState(0)
  const [spot, setSpot] = useState<number | null>(null)
  const img = p.gallery[i]
  const spots = i === 0 ? p.defects.map((d, n) => ({ ...d, n })).filter((d) => d.x != null && d.y != null) : []

  useEffect(() => {
    if (spot === null) return
    const off = (e: MouseEvent) => !(e.target as Element).closest?.('.hotspot, .loupe') && setSpot(null)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setSpot(null)
    document.addEventListener('click', off)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('click', off)
      document.removeEventListener('keydown', esc)
    }
  }, [spot])

  const cur = spot !== null ? spots.find((s) => s.n === spot) : null
  return (
    <div className="gallery">
      <div className={`gallery-main tint-${p.color}`}>
        {img ? <img src={img.large} srcSet={img.srcSet} sizes="(max-width: 860px) 100vw, 560px" width={img.width} height={img.height} fetchPriority={i === 0 ? 'high' : 'auto'} alt={img.alt || p.title} /> : <ToyArt kind={p.art} className="gallery-art" />}
        {!img ? <span className="gallery-note">{m.product.noPhoto}</span> : null}
        {spots.map((s) => (
          <button
            key={s.n}
            type="button"
            className="hotspot"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            aria-expanded={spot === s.n}
            aria-label={f(m.condition.defectSpot, { n: s.n + 1, text: s.text })}
            onClick={() => {
              setSpot(spot === s.n ? null : s.n)
              blip(880, 0.07)
            }}
          />
        ))}
        {cur && img ? (
          <div className="loupe" role="status">
            <div className="loupe-lens" style={{ backgroundImage: `url(${img.large})`, backgroundPosition: `${cur.x}% ${cur.y}%` }} />
            <p>{cur.text}</p>
          </div>
        ) : null}
      </div>
      {p.gallery.length > 1 ? (
        <div className="thumbs" role="tablist" aria-label={m.product.gallery.replace('{n}', '').replace('{total}', '')}>
          {p.gallery.map((g, n) => (
            <button key={g.src + n} type="button" role="tab" aria-selected={n === i} aria-label={f(m.product.gallery, { n: n + 1, total: p.gallery.length })} onClick={() => { setI(n); setSpot(null) }}>
              <img src={g.src} srcSet={g.srcSet} sizes="64px" alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

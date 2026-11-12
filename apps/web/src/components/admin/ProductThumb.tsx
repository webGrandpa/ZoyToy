'use client'

import { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import { ACCENT_HEX, cutOf, soften, tintOf } from '../../lib/backdrop'

type MediaLite = { id: number; url?: string; cutout?: boolean; backdrop?: string; scene?: string; sizes?: { thumb?: { url?: string }; tile?: { url?: string }; card?: { url?: string } } }
type GalleryRow = { image?: number | MediaLite | null; role?: string | null }

// one request for all the photos on a list page instead of one per row
const cache = new Map<number, Promise<MediaLite | null>>()
let queue: { id: number; resolve: (m: MediaLite | null) => void }[] = []
let timer: ReturnType<typeof setTimeout> | null = null

function loadMedia(id: number): Promise<MediaLite | null> {
  const hit = cache.get(id)
  if (hit) return hit
  const p = new Promise<MediaLite | null>((resolve) => {
    queue.push({ id, resolve })
    if (!timer)
      timer = setTimeout(async () => {
        const batch = queue
        queue = []
        timer = null
        const ids = [...new Set(batch.map((b) => b.id))]
        const qs = ids.map((x, i) => `where[id][in][${i}]=${x}`).join('&')
        const res = await fetch(`/api/media?${qs}&limit=${ids.length}&depth=0`, { credentials: 'include' }).catch(() => null)
        const docs: MediaLite[] = res?.ok ? ((await res.json()) as { docs: MediaLite[] }).docs : []
        for (const b of batch) b.resolve(docs.find((d) => d.id === b.id) ?? null)
      }, 30)
  })
  cache.set(id, p)
  return p
}

type Row = { id?: number | string; gallery?: GalleryRow[] | null }

/** Link to the row's own form — Payload links only the first column, and that is the photo now. */
function useRowHref(rowData: Row | undefined, collectionSlug = 'products') {
  const { config } = useConfig()
  return rowData?.id != null ? `${config.routes?.admin ?? '/admin'}/collections/${collectionSlug}/${rowData.id}` : undefined
}

/** Items list: the item's name, opening the item — like the first column did before the photo took its place. */
export function LinkCell({ cellData, rowData, collectionSlug }: { cellData?: unknown; rowData?: Row; collectionSlug?: string }) {
  const href = useRowHref(rowData, collectionSlug)
  const text = typeof cellData === 'string' && cellData ? cellData : '—'
  return href ? <a href={href}>{text}</a> : <span>{text}</span>
}

/** Items list: the main photo of each item, so the owner recognises a toy by its picture. */
export function ProductThumbCell({ rowData, collectionSlug }: { rowData?: Row; collectionSlug?: string }) {
  const href = useRowHref(rowData, collectionSlug)
  const rows = rowData?.gallery ?? []
  const main = rows.find((g) => g.role === 'main') ?? rows[0]
  const ref = main?.image
  const [media, setMedia] = useState<MediaLite | null>(ref && typeof ref === 'object' ? ref : null)
  useEffect(() => {
    if (typeof ref === 'number') void loadMedia(ref).then(setMedia)
  }, [ref])
  const cut = media ? cutOf(media) : null
  const src = media ? ((cut ? media.sizes?.tile?.url : media.sizes?.thumb?.url) ?? media.sizes?.card?.url ?? media.url) : null
  const box = media ? (
    <span className={`zt-thumb${cut ? ' zt-thumb--cut' : ''}`} style={cut ? { background: soften(ACCENT_HEX[tintOf(cut, 'sun')], 0.3) } : undefined}>
      {src ? <img src={src} alt="" loading="lazy" /> : null}
    </span>
  ) : (
    <span className="zt-thumb zt-thumb--none">📷</span>
  )
  return href ? (
    <a href={href} tabIndex={-1} aria-hidden="true">
      {box}
    </a>
  ) : (
    box
  )
}

/** The photo column has nothing to show inside the item form itself. */
export function Nothing() {
  return null
}

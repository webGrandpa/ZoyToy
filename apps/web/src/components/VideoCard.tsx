'use client'

import { useEffect, useRef, useState } from 'react'
import type { Video } from '../lib/video'
import { useI18n } from './Providers'

/**
 * Item page, under the details card (owner, 2026-11): „Watch the video at the link“. The button plays
 * the review in a window over the page when the site lets us embed it (YouTube, Facebook, Instagram,
 * TikTok), otherwise it opens the link in a new tab.
 */
export function VideoCard({ video, title }: { video: Video; title: string }) {
  const { m } = useI18n()
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.documentElement.style.overflow = ''
    }
  }, [open])

  return (
    <section className="zt-sticker video-card" aria-labelledby="video-card-title">
      <h2 id="video-card-title">🎬 {m.product.video}</h2>
      {video.embed ? (
        <button type="button" className="zt-btn video-card__play" onClick={() => setOpen(true)}>
          <span aria-hidden="true">▶</span> {m.product.watchVideo}
        </button>
      ) : (
        <a className="zt-btn video-card__play" href={video.url} target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">▶</span> {m.product.watchVideo}
        </a>
      )}
      <a className="video-card__link" href={video.url} target="_blank" rel="noopener noreferrer">
        🔗 {m.product.openVideo}
      </a>

      {open && video.embed ? (
        <div className="video-modal" role="dialog" aria-modal="true" aria-label={`${m.product.video}: ${title}`} onClick={() => setOpen(false)}>
          <div className={`video-modal__box${video.tall ? ' is-tall' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} type="button" className="zt-icon-btn video-modal__close" aria-label={m.a11y.close} onClick={() => setOpen(false)}>
              ✕
            </button>
            <iframe
              src={`${video.embed}${video.embed.includes('?') ? '&' : '?'}autoplay=1`}
              title={`${m.product.video}: ${title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

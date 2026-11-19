'use client'

import { useState, type FormEvent } from 'react'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { useI18n } from './Providers'

/**
 * „What toy would you like us to add?“ (owner, 2026-11) — on the home page, at the end of the catalogue
 * and when a search finds nothing. Goes to Admin → Customer wishes and to the shop's Telegram chat.
 */
export function WishForm({ source, compact = false }: { source: 'home' | 'catalog' | 'empty'; compact?: boolean }) {
  const { locale, m } = useI18n()
  const t = m.wish
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const text = String(fd.get('text') ?? '').trim()
    const phone = String(fd.get('phone') ?? '').trim()
    if (text.length < 3) return setError(t.errText)
    if (phone && phone.replace(/\D/g, '').length < 9) return setError(t.errPhone)
    setState('busy')
    setError(null)
    try {
      const res = await fetch('/api/wishes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, phone, locale, source, website: fd.get('website') ?? '' }),
      })
      if (res.status === 429) throw new Error(t.errRate)
      if (!res.ok) throw new Error(t.errGeneric)
      setState('done')
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t.errGeneric)
      setState('idle')
    }
  }

  return (
    <section className={`wish zt-sticker${compact ? ' wish--compact' : ''}`} aria-labelledby={`wish-${source}`}>
      <GiraffeHead className="wish-art" />
      <div className="wish-body">
        <h2 id={`wish-${source}`}>{source === 'empty' ? t.emptyTitle : t.title}</h2>
        <p className="wish-lede">{t.lede}</p>
        {state === 'done' ? (
          <p className="wish-done" role="status">{t.done}</p>
        ) : (
          <form className="wish-form" onSubmit={submit} noValidate>
            <label className="field">
              {t.text}
              <textarea name="text" rows={2} maxLength={500} placeholder={t.textPh} required />
            </label>
            <label className="field">
              {t.phone}
              <input name="phone" inputMode="tel" autoComplete="tel" placeholder={t.phonePh} />
            </label>
            {/* people never see this field; spam bots fill it in */}
            <input className="wish-hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button type="submit" className="zt-btn" disabled={state === 'busy'}>
              {state === 'busy' ? t.sending : t.send}
            </button>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </form>
        )}
      </div>
    </section>
  )
}

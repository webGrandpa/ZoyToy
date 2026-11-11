'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ToyArt, type ToyKind } from '@zoytoy/ui/ToyArt'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { money } from '../i18n'
import { contactLinks } from '../lib/contact'
import { IconGift, IconX } from './Icons'
import { useI18n, useShop, type CartItem } from './Providers'
import { confetti } from './confetti'

type Contact = { whatsapp?: string | null; telegram?: string | null; instagram?: string | null; phone?: string | null }
type Done = { number: string; text: string; items: CartItem[] }
const DELIVERY = ['pickup', 'courier', 'post', 'bus'] as const
const PAYMENT = ['cash', 'transfer', 'link'] as const

/** Cart drawer → order request → packing celebration with ready-made messages (docs/08 §3–4, docs/05 §11.5). */
export function CartDrawer({ contact }: { contact: Contact }) {
  const { locale, m, f } = useI18n()
  const shop = useShop()
  const [view, setView] = useState<'cart' | 'form'>('cart')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const [city, setCity] = useState(m.cart.cities[0])
  const [delivery, setDelivery] = useState<(typeof DELIVERY)[number]>('pickup')
  const [payment, setPayment] = useState<(typeof PAYMENT)[number]>('cash')
  const [gift, setGift] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = shop.cartOpen
  const total = shop.items.reduce((s, i) => s + i.price, 0)
  const isBatumi = city === m.cart.cities[0]
  const deliveries = DELIVERY.filter((d) => (isBatumi ? d !== 'bus' : d !== 'courier' && d !== 'pickup'))

  useEffect(() => {
    if (!deliveries.includes(delivery)) setDelivery(deliveries[0])
  }, [city]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && shop.setCartOpen(false)
    window.addEventListener('keydown', esc)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.documentElement.style.overflow = ''
    }
  }, [open, shop])

  useEffect(() => {
    if (!open) {
      setView('cart')
      setError(null)
    }
  }, [open])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') ?? '').trim()
    const phone = String(fd.get('phone') ?? '')
    if (!name) return setError(m.cart.errName)
    if (phone.replace(/\D/g, '').length < 9) return setError(m.cart.errPhone)
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/orders/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: shop.items.map((i) => i.id), name, phone, city, delivery, payment, gift,
          giftNote: fd.get('giftNote') ?? '', comment: fd.get('comment') ?? '', rewardCode: fd.get('rewardCode') ?? '', locale,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409 && Array.isArray(data.ids)) {
        data.ids.forEach((id: number) => shop.remove(id))
        setError(m.cart.errUnavailable)
        return
      }
      if (res.status === 429) return setError(m.cart.errRate)
      if (!res.ok) return setError(m.cart.errGeneric)
      const items = [...shop.items]
      const text = [
        f(m.cart.msgHello, { n: data.number }),
        ...items.map((i) => `• ${i.title} — ${money(i.price)}`),
        f(m.cart.msgTotal, { total: money(total) }),
        f(m.cart.msgWhere, { city, delivery: m.cart.deliveryOpts[delivery] }),
        gift ? m.cart.msgGift : '',
      ].filter(Boolean).join('\n')
      shop.clear()
      shop.setCartOpen(false)
      setDone({ number: data.number, text, items })
    } catch {
      setError(m.cart.errGeneric)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={`scrim${open ? ' show' : ''}`} onClick={() => shop.setCartOpen(false)} aria-hidden="true" />
      <aside className={`drawer${open ? ' open' : ''}${gift && view === 'form' ? ' gift' : ''}`} role="dialog" aria-modal="true" aria-label={view === 'cart' ? m.cart.title : m.cart.formTitle} aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <h2>{view === 'cart' ? m.cart.title : m.cart.formTitle}</h2>
          <button ref={closeRef} type="button" className="zt-icon-btn" aria-label={m.a11y.close} onClick={() => shop.setCartOpen(false)}>
            <IconX />
          </button>
        </div>
        <div className="drawer-body">
          {view === 'cart' ? (
            shop.items.length ? (
              <ul className="lines">
                {shop.items.map((i) => (
                  <li key={i.id} className="line">
                    <Link href={`/${locale}/p/${i.slug}`} className={`line-thumb tint-${i.color}`} onClick={() => shop.setCartOpen(false)}>
                      {i.img ? <img src={i.img} alt="" /> : <ToyArt kind={i.art as ToyKind} />}
                    </Link>
                    <span className="line-title">{i.title}</span>
                    <span className="line-price">{money(i.price)}</span>
                    <button type="button" className="line-remove" aria-label={`${m.cart.remove}: ${i.title}`} onClick={() => shop.remove(i.id)}>
                      <IconX />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="cart-empty">
                <GiraffeHead className="cart-empty-art" />
                <b>{m.cart.empty}</b>
                <p>{m.cart.emptyText}</p>
                <Link className="zt-btn zt-btn--secondary" href={`/${locale}/shop`} onClick={() => shop.setCartOpen(false)}>{m.cart.browse}</Link>
              </div>
            )
          ) : (
            <form id="order-form" className="order-form" onSubmit={submit} noValidate>
              <label className="field" htmlFor="o-name">{m.cart.name}<input id="o-name" name="name" autoComplete="given-name" placeholder={m.cart.namePh} required /></label>
              <label className="field" htmlFor="o-phone">{m.cart.phone}<input id="o-phone" name="phone" inputMode="tel" autoComplete="tel" placeholder={m.cart.phonePh} required /></label>
              <label className="field" htmlFor="o-city">
                {m.cart.city}
                <select id="o-city" name="city" value={city} onChange={(e) => setCity(e.target.value)}>
                  {m.cart.cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <fieldset className="field">
                <legend>{m.cart.delivery}</legend>
                <div className="chips" role="radiogroup" aria-label={m.cart.delivery}>
                  {deliveries.map((d) => (
                    <button key={d} type="button" role="radio" aria-checked={delivery === d} className="zt-chip" onClick={() => setDelivery(d)}>{m.cart.deliveryOpts[d]}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="field">
                <legend>{m.cart.payment}</legend>
                <div className="chips" role="radiogroup" aria-label={m.cart.payment}>
                  {PAYMENT.map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={payment === p} className="zt-chip" onClick={() => setPayment(p)}>{m.cart.paymentOpts[p]}</button>
                  ))}
                </div>
              </fieldset>
              <div className="switch-row">
                <span><IconGift /> {m.cart.gift}</span>
                <button type="button" role="switch" aria-checked={gift} className="zt-chip" onClick={() => { setGift(!gift); shop.blip(gift ? 520 : 990, 0.08) }}>{gift ? m.cart.yes : m.cart.no}</button>
              </div>
              {gift ? <label className="field" htmlFor="o-gift">{m.cart.giftNote}<textarea id="o-gift" name="giftNote" rows={2} /></label> : null}
              <label className="field" htmlFor="o-reward">{m.cart.reward}<input id="o-reward" name="rewardCode" autoCapitalize="characters" placeholder="ZOY-XXXX" /></label>
              <label className="field" htmlFor="o-comment">{m.cart.comment}<textarea id="o-comment" name="comment" rows={2} /></label>
              <ul className="lines mini">
                {shop.items.map((i) => (
                  <li key={i.id} className="line">
                    <span className={`line-thumb tint-${i.color}`}>{i.img ? <img src={i.img} alt="" /> : <ToyArt kind={i.art as ToyKind} />}</span>
                    <span className="line-title">{i.title}</span>
                    <span className="line-price">{money(i.price)}</span>
                  </li>
                ))}
              </ul>
            </form>
          )}
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        {shop.items.length ? (
          <div className="drawer-foot">
            <div className="total"><span>{m.cart.total}</span><span>{money(total)}</span></div>
            {view === 'cart' ? (
              <button type="button" className="zt-btn" onClick={() => { setView('form'); setError(null) }}>{m.cart.request}</button>
            ) : (
              <>
                <button type="submit" form="order-form" className="zt-btn" disabled={busy}>{busy ? m.cart.sending : m.cart.send}</button>
                <button type="button" className="zt-btn zt-btn--ghost zt-btn--sm" onClick={() => setView('cart')}>{m.cart.back}</button>
              </>
            )}
            <p className="muted small">{m.cart.note}</p>
          </div>
        ) : null}
      </aside>
      {done ? <Packed done={done} contact={contact} onClose={() => setDone(null)} /> : null}
    </>
  )
}

/** Items drop into a kraft box, the lid lands, tape, ZOY stamp — then ready-made messages. */
function Packed({ done, contact, onClose }: { done: Done; contact: Contact; onClose: () => void }) {
  const { m, f } = useI18n()
  const shop = useShop()
  const items = done.items.slice(0, 4)
  const step = 0.22
  const tLid = items.length * step + 0.35
  const tTape = tLid + 0.45
  const tStamp = tTape + 0.4
  const tMsg = tStamp + 0.35
  const links = contactLinks(contact, done.text)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const t1 = setTimeout(() => {
      confetti(0.35)
      shop.blip(660, 0.1)
      setTimeout(() => shop.blip(990, 0.18), 120)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
    }, tStamp * 1000 + 100)
    const t2 = setTimeout(() => closeRef.current?.focus(), tMsg * 1000 + 300)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('keydown', esc)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const pos = [[28, -8], [92, 7], [56, -3], [128, 11]]
  return (
    <div className="pack" role="dialog" aria-modal="true" aria-label={f(m.cart.doneTitle, { n: done.number })}>
      <div className="pack-card">
        <div className="pack-stage" aria-hidden="true">
          {items.map((it, i) => (
            <div key={it.id} className="pack-item" style={{ ['--d' as string]: `${(i * step).toFixed(2)}s`, ['--r' as string]: `${pos[i][1]}deg`, left: pos[i][0] }}>
              {it.img ? <img src={it.img} alt="" /> : <ToyArt kind={it.art as ToyKind} />}
            </div>
          ))}
          <div className="box-front">♻ Zoy Toy</div>
          <div className="box-lid" style={{ ['--d' as string]: `${tLid.toFixed(2)}s` }} />
          <div className="box-tape" style={{ ['--d' as string]: `${tTape.toFixed(2)}s` }} />
          <div className="box-stamp" style={{ ['--d' as string]: `${tStamp.toFixed(2)}s` }}>ZOY</div>
        </div>
        <div className="pack-msg" style={{ ['--d' as string]: `${tMsg.toFixed(2)}s` }}>
          <h2>{f(m.cart.doneTitle, { n: done.number })}</h2>
          <p>{m.cart.doneText}</p>
          <div className="pack-actions">
            <a className="zt-btn zt-btn--wa" href={links.whatsapp} target="_blank" rel="noopener">WhatsApp</a>
            {links.telegram ? <a className="zt-btn zt-btn--tg" href={links.telegram} target="_blank" rel="noopener">Telegram</a> : null}
            <a
              className="zt-btn zt-btn--ig"
              href={links.instagram}
              target="_blank"
              rel="noopener"
              onClick={() => {
                navigator.clipboard?.writeText(done.text).then(() => shop.toast(m.cart.copied), () => undefined)
              }}
            >
              {m.cart.igCopy}
            </a>
            <button ref={closeRef} type="button" className="zt-btn zt-btn--ghost zt-btn--sm" onClick={onClose}>{m.cart.close}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

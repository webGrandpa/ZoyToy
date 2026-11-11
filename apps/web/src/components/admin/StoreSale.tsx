'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useConfig, useTranslation } from '@payloadcms/ui'
import { asLang, money, type Lang } from '../../lib/telegram/templates'
import { discountPercent, SALE_PAYMENTS, type SalePayment } from '../../lib/store'

type Item = {
  id: number
  title: string
  sku: string
  slug: string
  price: number
  status: 'draft' | 'published' | 'reserved' | 'sold' | 'archived'
  condition: string
  image: string | null
  order: { id: number; number: string; status: string } | null
  sale: { id: number; price: number; at: string } | null
}
type Sale = { id: number; title: string; sku: string; price: number; listPrice: number; discount: number; payment: SalePayment; at: string; by: string | null; canUndo: boolean }
type Today = { sales: Sale[]; totals: { count: number; sum: number; byPayment: Record<SalePayment, number> } }
type Done = { saleId: number; item: Item; price: number }

const T = {
  ka: {
    title: 'მაღაზიაში გაყიდვა',
    intro: 'დაასკანერე ეტიკეტის QR ან ჩაწერე SKU / სახელი.',
    phoneCam: 'ტელეფონზე უბრალოდ გახსენი კამერა და მიუშვირე ეტიკეტს — ბმული პირდაპირ აქ მოგიყვანს.',
    ph: 'ZT-000123 ან სახელი',
    find: 'ძებნა',
    scan: '📷 სკანირება',
    close: 'დახურვა',
    camErr: 'კამერა ვერ ჩაირთო — ნება დართე ბრაუზერში ან ჩაწერე SKU.',
    none: 'ვერაფერი ვიპოვე',
    pick: 'რომელი?',
    free: '🟢 თავისუფალია',
    draft: '⚪ საიტზე არ ჩანს (დრაფტი) — გაყიდვა შეიძლება',
    archived: '⚪ არქივშია — გაყიდვა შეიძლება',
    reserved: '🟡 დაჯავშნილია ონლაინ მოთხოვნით {n} (ჯერ გადაუხდელი). თუ გაყიდი, მყიდველს აცნობე — ბოტიც შეგახსენებს.',
    paid: '🔴 ონლაინ გადახდილია — შეკვეთა {n}. არ გაყიდო, გადადე!',
    sold: '⚪ უკვე გაყიდულია მაღაზიაში — {d}',
    soldOnline: '⚪ უკვე გაყიდულია',
    price: 'ფასი ₾',
    off: 'ფასდაკლება {p}%',
    pay: 'გადახდა',
    cash: '💵 ნაღდი',
    card: '💳 ბარათი',
    transfer: '🏦 გადარიცხვა',
    phone: 'მყიდველის ტელეფონი (არჩევითი)',
    sell: '✅ გაიყიდა · {sum}',
    saving: 'ინახება…',
    done: 'გაიყიდა! საიტიდან მოიხსნა.',
    undo: '↩︎ გაუქმება',
    undone: 'გაუქმდა — ნივთი თავის ადგილას დაბრუნდა.',
    next: 'შემდეგი ნივთი',
    today: 'დღეს მაღაზიაში',
    todayNone: 'დღეს ჯერ არაფერი გაყიდულა.',
    total: 'სულ',
    openItem: 'ნივთის გახსნა',
    openOrder: 'შეკვეთის გახსნა',
    onSite: 'საიტზე',
    err: 'ვერ შეინახა — სცადე თავიდან.',
    errSold: 'ეს ნივთი უკვე გაყიდულია.',
    errPaid: 'ეს ნივთი ონლაინ შეკვეთა {n}-შია გადახდილი — გადადე!',
    labels: '🏷️ ეტიკეტები',
  },
  ru: {
    title: 'Продажа в магазине',
    intro: 'Отсканируйте QR на этикетке или введите SKU / название.',
    phoneCam: 'На телефоне просто откройте камеру и наведите на этикетку — ссылка приведёт сюда.',
    ph: 'ZT-000123 или название',
    find: 'Найти',
    scan: '📷 Сканировать',
    close: 'Закрыть',
    camErr: 'Камера не включилась — разрешите её в браузере или введите SKU.',
    none: 'Ничего не найдено',
    pick: 'Какой?',
    free: '🟢 Свободен',
    draft: '⚪ Не на сайте (черновик) — можно продать',
    archived: '⚪ В архиве — можно продать',
    reserved: '🟡 В брони по онлайн-запросу {n} (не оплачен). Если продаёте — сообщите покупателю, бот напомнит.',
    paid: '🔴 Оплачен онлайн — заказ {n}. Не продавайте, отложите!',
    sold: '⚪ Уже продан в магазине — {d}',
    soldOnline: '⚪ Уже продан',
    price: 'Цена ₾',
    off: 'Скидка {p}%',
    pay: 'Оплата',
    cash: '💵 Наличные',
    card: '💳 Карта',
    transfer: '🏦 Перевод',
    phone: 'Телефон покупателя (необязательно)',
    sell: '✅ Продано · {sum}',
    saving: 'Сохраняю…',
    done: 'Продано! Снято с сайта.',
    undo: '↩︎ Отменить',
    undone: 'Отменено — товар вернулся на место.',
    next: 'Следующий товар',
    today: 'Сегодня в магазине',
    todayNone: 'Сегодня продаж ещё не было.',
    total: 'Итого',
    openItem: 'Открыть товар',
    openOrder: 'Открыть заказ',
    onSite: 'На сайте',
    err: 'Не сохранилось — попробуйте ещё раз.',
    errSold: 'Этот товар уже продан.',
    errPaid: 'Товар оплачен онлайн в заказе {n} — отложите!',
    labels: '🏷️ Этикетки',
  },
  en: {
    title: 'In-store sale',
    intro: 'Scan the label’s QR code or type the SKU / name.',
    phoneCam: 'On a phone, just open the camera and point it at the label — the link brings you here.',
    ph: 'ZT-000123 or a name',
    find: 'Find',
    scan: '📷 Scan',
    close: 'Close',
    camErr: 'The camera did not start — allow it in the browser or type the SKU.',
    none: 'Nothing found',
    pick: 'Which one?',
    free: '🟢 Available',
    draft: '⚪ Not on the site (draft) — can be sold',
    archived: '⚪ Archived — can be sold',
    reserved: '🟡 Held by online request {n} (not paid). If you sell it, tell that customer — the bot will remind you.',
    paid: '🔴 Paid online — order {n}. Don’t sell it, set it aside!',
    sold: '⚪ Already sold in the shop — {d}',
    soldOnline: '⚪ Already sold',
    price: 'Price ₾',
    off: '{p}% off',
    pay: 'Payment',
    cash: '💵 Cash',
    card: '💳 Card',
    transfer: '🏦 Transfer',
    phone: 'Customer phone (optional)',
    sell: '✅ Sold · {sum}',
    saving: 'Saving…',
    done: 'Sold! It is off the site.',
    undo: '↩︎ Undo',
    undone: 'Undone — the item is back where it was.',
    next: 'Next item',
    today: 'Today in the shop',
    todayNone: 'No sales yet today.',
    total: 'Total',
    openItem: 'Open item',
    openOrder: 'Open order',
    onSite: 'On the site',
    err: 'Could not save — try again.',
    errSold: 'This item is already sold.',
    errPaid: 'Paid online in order {n} — set it aside!',
    labels: '🏷️ Labels',
  },
} satisfies Record<Lang, Record<string, string>>

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ''))
const LOCALE: Record<Lang, string> = { ka: 'ka-GE', ru: 'ru-RU', en: 'en-GB' }

// BarcodeDetector is in Chrome/Android but not in TypeScript's DOM types (nor in Safari)
type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> }
type DetectorCtor = new (o: { formats: string[] }) => Detector
const noop = () => () => {}
const hasDetector = () => typeof window !== 'undefined' && 'BarcodeDetector' in window

/**
 * The counter screen: scan or search → the item with its online state → price, payment → sold.
 * Below, today's sales with cash/card totals and an undo for fresh mistakes.
 */
export function StoreSale({ initialId, initialQuery }: { initialId?: number; initialQuery?: string }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const t = T[lang]
  const api = config.routes?.api ?? '/api'
  const admin = config.routes?.admin ?? '/admin'
  const canScan = useSyncExternalStore(noop, hasDetector, () => false)

  const [q, setQ] = useState(initialQuery ?? '')
  const [items, setItems] = useState<Item[] | null>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [price, setPrice] = useState('')
  const [payment, setPayment] = useState<SalePayment>('cash')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [today, setToday] = useState<Today | null>(null)
  const [scanning, setScanning] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  const loadToday = useCallback(() => {
    fetch(`${api}/store-sales/today`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Today | null) => d && setToday(d))
      .catch(() => {})
  }, [api])

  const choose = useCallback((it: Item) => {
    setItem(it)
    setPrice(String(it.price))
    setPayment('cash')
    setPhone('')
    setError(null)
  }, [])

  const lookup = useCallback(
    async (params: Record<string, string>) => {
      setError(null)
      setNotice(null)
      setDone(null)
      setItem(null)
      setItems(null)
      const qs = new URLSearchParams({ ...params, lang }).toString()
      const res = await fetch(`${api}/store-sales/lookup?${qs}`, { credentials: 'include' }).catch(() => null)
      const data = res?.ok ? ((await res.json()) as { items: Item[] }) : { items: [] }
      setItems(data.items)
      if (data.items.length === 1) choose(data.items[0])
    },
    [api, lang, choose],
  )

  useEffect(() => {
    loadToday()
    if (initialId) void lookup({ id: String(initialId) })
    else if (initialQuery) void lookup({ q: initialQuery })
  }, [initialId, initialQuery, lookup, loadToday])

  // camera scanning where the browser can decode QR codes itself (Chrome on Android, desktop Chrome)
  useEffect(() => {
    if (!scanning) return
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let alive = true
    const stop = () => {
      alive = false
      clearTimeout(timer)
      stream?.getTracks().forEach((tr) => tr.stop())
    }
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        if (!alive || !video.current) return stop()
        video.current.srcObject = stream
        await video.current.play()
        const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector
        const detector = new Ctor({ formats: ['qr_code'] })
        const tick = async () => {
          if (!alive || !video.current) return
          const codes = await detector.detect(video.current).catch(() => [])
          if (codes[0]?.rawValue) {
            stop()
            setScanning(false)
            setQ(codes[0].rawValue)
            void lookup({ q: codes[0].rawValue })
            return
          }
          timer = setTimeout(tick, 220)
        }
        void tick()
      } catch {
        stop()
        setScanning(false)
        setError(t.camErr)
      }
    })()
    return stop
  }, [scanning, lookup, t.camErr])

  const sell = async () => {
    if (!item || busy) return
    setBusy(true)
    setError(null)
    const res = await fetch(`${api}/store-sales`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: item.id, price: price.replace(',', '.'), payment, phone }),
    }).catch(() => null)
    setBusy(false)
    const body = res ? await res.json().catch(() => null) : null
    if (!res?.ok) {
      const msg = String(body?.errors?.[0]?.message ?? '')
      setError(msg === 'already_sold' ? t.errSold : msg.startsWith('paid_online:') ? fill(t.errPaid, { n: msg.split(':')[1] }) : t.err)
      return
    }
    setDone({ saleId: body.doc.id, item, price: body.doc.price })
    setItem(null)
    setItems(null)
    setQ('')
    loadToday()
  }

  const undo = async (saleId: number) => {
    if (busy) return
    setBusy(true)
    const res = await fetch(`${api}/store-sales/${saleId}`, { method: 'DELETE', credentials: 'include' }).catch(() => null)
    setBusy(false)
    if (!res?.ok) return setError(t.err)
    setDone(null)
    setNotice(t.undone)
    loadToday()
  }

  const stateLine = (it: Item) => {
    if (it.status === 'published') return { cls: 'free', text: t.free, sellable: true }
    if (it.status === 'draft') return { cls: 'free', text: t.draft, sellable: true }
    if (it.status === 'archived') return { cls: 'free', text: t.archived, sellable: true }
    if (it.status === 'reserved') return { cls: 'held', text: fill(t.reserved, { n: it.order?.number ?? '—' }), sellable: true }
    if (it.order) return { cls: 'paid', text: fill(t.paid, { n: it.order.number }), sellable: false }
    return { cls: 'sold', text: it.sale ? fill(t.sold, { d: new Date(it.sale.at).toLocaleString(LOCALE[lang], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }) : t.soldOnline, sellable: false }
  }

  const asked = Number(price.replace(',', '.'))
  const off = item ? discountPercent(item.price, Number.isFinite(asked) ? asked : item.price) : 0

  return (
    <div className="zt-sale">
      <div className="zt-sale__head">
        <h1>🛒 {t.title}</h1>
        <a className="zt-sale__aside" href={`${admin}/labels`}>{t.labels}</a>
      </div>
      <p className="zt-sale__intro">{t.intro} {!canScan ? t.phoneCam : null}</p>

      <form
        className="zt-sale__search"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) void lookup({ q })
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} aria-label={t.ph} inputMode="search" autoComplete="off" />
        <button type="submit" className="zt-sale__btn">{t.find}</button>
        {canScan ? (
          <button type="button" className="zt-sale__btn zt-sale__btn--scan" onClick={() => setScanning((s) => !s)}>
            {scanning ? t.close : t.scan}
          </button>
        ) : null}
      </form>

      {scanning ? (
        <div className="zt-sale__cam">
          <video ref={video} playsInline muted />
          <span className="zt-sale__frame" aria-hidden="true" />
        </div>
      ) : null}

      {error ? <p className="zt-sale__msg zt-sale__msg--err" role="alert">{error}</p> : null}
      {notice ? <p className="zt-sale__msg" role="status">{notice}</p> : null}

      {done ? (
        <div className="zt-sale__done" role="status">
          <b>✅ {t.done}</b>
          <span>{done.item.title} · {done.item.sku} · {money(done.price, lang)}</span>
          <div className="zt-sale__row">
            <button type="button" className="zt-sale__btn" onClick={() => undo(done.saleId)} disabled={busy}>{t.undo}</button>
            <button type="button" className="zt-sale__btn zt-sale__btn--go" onClick={() => setDone(null)}>{t.next}</button>
          </div>
        </div>
      ) : null}

      {items && !items.length ? <p className="zt-sale__msg">{t.none}</p> : null}
      {items && items.length > 1 && !item ? (
        <div className="zt-sale__pick">
          <p>{t.pick}</p>
          {items.map((it) => (
            <button key={it.id} type="button" className="zt-sale__option" onClick={() => choose(it)}>
              {it.image ? <img src={it.image} alt="" width={44} height={44} /> : <span className="zt-sale__noimg" />}
              <span><b>{it.title}</b><small>{it.sku} · {money(it.price, lang)}</small></span>
            </button>
          ))}
        </div>
      ) : null}

      {item ? (() => {
        const st = stateLine(item)
        return (
          <div className={`zt-sale__item zt-sale__item--${st.cls}`}>
            <div className="zt-sale__card">
              {item.image ? <img src={item.image} alt="" width={96} height={96} /> : <span className="zt-sale__noimg" />}
              <div>
                <b className="zt-sale__name">{item.title}</b>
                <small>{item.sku} · {item.condition}</small>
                <strong>{money(item.price, lang)}</strong>
              </div>
            </div>
            <p className="zt-sale__state">{st.text}</p>
            <div className="zt-sale__links">
              <a href={`${admin}/collections/products/${item.id}`}>{t.openItem}</a>
              {item.order ? <a href={`${admin}/collections/orders/${item.order.id}`}>{t.openOrder} {item.order.number}</a> : null}
              {item.slug && item.status !== 'draft' && item.status !== 'archived' ? <a href={`/${lang}/p/${item.slug}`} target="_blank" rel="noopener">{t.onSite} ↗</a> : null}
            </div>
            {st.sellable ? (
              <div className="zt-sale__form">
                <label>
                  <span>{t.price} {off ? <em>{fill(t.off, { p: off })}</em> : null}</span>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
                </label>
                <div role="group" aria-label={t.pay} className="zt-sale__pay">
                  {SALE_PAYMENTS.map((p) => (
                    <button key={p} type="button" aria-pressed={payment === p} className={payment === p ? 'is-on' : ''} onClick={() => setPayment(p)}>
                      {t[p]}
                    </button>
                  ))}
                </div>
                <label>
                  <span>{t.phone}</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" />
                </label>
                <button type="button" className="zt-sale__sell" onClick={sell} disabled={busy || !Number.isFinite(asked) || asked < 0}>
                  {busy ? t.saving : fill(t.sell, { sum: money(Number.isFinite(asked) ? asked : item.price, lang) })}
                </button>
              </div>
            ) : null}
          </div>
        )
      })() : null}

      <section className="zt-sale__today">
        <h2>{t.today}</h2>
        {!today?.sales.length ? (
          <p className="zt-sale__muted">{t.todayNone}</p>
        ) : (
          <>
            <ul>
              {today.sales.map((s) => (
                <li key={s.id}>
                  <time>{new Date(s.at).toLocaleTimeString(LOCALE[lang], { hour: '2-digit', minute: '2-digit' })}</time>
                  <span className="zt-sale__what"><b>{s.title}</b><small>{s.sku}{s.by ? ` · ${s.by}` : ''}</small></span>
                  <span className="zt-sale__sum">
                    {money(s.price, lang)}
                    {s.discount ? <small> −{s.discount}%</small> : null}
                    <small> {t[s.payment].split(' ')[0]}</small>
                  </span>
                  {s.canUndo ? <button type="button" className="zt-sale__undo" onClick={() => undo(s.id)} disabled={busy} aria-label={`${t.undo} ${s.sku}`}>↩︎</button> : <span />}
                </li>
              ))}
            </ul>
            <p className="zt-sale__totals">
              <b>{t.total}: {money(today.totals.sum, lang)}</b> ({today.totals.count})
              {SALE_PAYMENTS.filter((p) => today.totals.byPayment[p]).map((p) => (
                <span key={p}> · {t[p]} {money(today.totals.byPayment[p], lang)}</span>
              ))}
            </p>
          </>
        )}
      </section>
    </div>
  )
}

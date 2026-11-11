import type { AdminViewServerProps, Where } from 'payload'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import type { Product } from '../../payload-types'
import { CONDITIONS } from '../../collections/Products'
import { siteUrlFor } from '../../lib/site'
import { labelPath } from '../../lib/store'
import { asLang, money, type Lang } from '../../lib/telegram/templates'
import { PrintButton } from './PrintButton'

const T = {
  ka: {
    title: 'QR ეტიკეტები', pickIntro: 'მონიშნე ნივთები და დაბეჭდე. QR-ს მყიდველი ტელეფონით ასკანერებს და ნივთის გვერდი თავის ენაზე ეხსნება; თანამშრომელს — გაყიდვის ეკრანი.',
    today: 'დღეს დამატებული', week: 'ბოლო 7 დღე', print: '🏷️ მონიშნულის ბეჭდვა', none: 'ნივთები არ არის.', back: '← ადმინი', choose: '← სხვა ნივთები',
    a4: 'A4 ფურცელი (3×8, 70×37 მმ)', roll: 'ეტიკეტების პრინტერი (50×30 მმ)', count: '{n} ეტიკეტი', hint: 'ბეჭდვისას: მასშტაბი 100%, კიდეები — არა.',
  },
  ru: {
    title: 'QR-этикетки', pickIntro: 'Отметьте товары и распечатайте. Покупатель сканирует QR телефоном — открывается страница товара на его языке; сотрудник — экран продажи.',
    today: 'Добавлены сегодня', week: 'Последние 7 дней', print: '🏷️ Печать отмеченных', none: 'Товаров нет.', back: '← Админка', choose: '← Другие товары',
    a4: 'Лист A4 (3×8, 70×37 мм)', roll: 'Принтер этикеток (50×30 мм)', count: '{n} этикеток', hint: 'При печати: масштаб 100%, без полей.',
  },
  en: {
    title: 'QR labels', pickIntro: 'Tick the items and print. Customers scan the QR with a phone and get the item page in their language; the team gets the sale screen.',
    today: 'Added today', week: 'Last 7 days', print: '🏷️ Print selected', none: 'No items.', back: '← Admin', choose: '← Other items',
    a4: 'A4 sheet (3×8, 70×37 mm)', roll: 'Label printer (50×30 mm)', count: '{n} labels', hint: 'When printing: scale 100%, no margins.',
  },
} satisfies Record<Lang, Record<string, string>>

type SP = Record<string, string | string[] | undefined> | undefined
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(','))
const DAY = 24 * 3600 * 1000

/**
 * /admin/labels — pick items (or ?ids=1,2 / ?recent=7), then a print-ready sheet of QR labels: QR to
 * /q/<SKU>, title, condition, price, SKU. A4 sticker sheets or a 50×30 mm label printer.
 */
export async function LabelsView({ initPageResult, searchParams }: AdminViewServerProps) {
  const { req } = initPageResult
  const admin = req.payload.config.routes.admin
  const team = req.user?.roles?.some((r) => r === 'admin' || r === 'staff')
  if (!team) redirect(`${admin}/login?redirect=${encodeURIComponent(`${admin}/labels`)}`)
  const lang = asLang(req.i18n.language)
  const t = T[lang]
  const sp = searchParams as SP
  const ids = [...new Set(list(sp?.ids).concat(list(sp?.id)).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 120)
  const recent = Math.min(Math.max(Number(sp?.recent) || 0, 0), 60)
  const size = sp?.size === 'roll' ? 'roll' : 'a4'

  const onShelf: Where = { status: { not_in: ['sold', 'archived'] } }
  if (!ids.length && !recent) {
    const [items, todayCount, weekCount] = await Promise.all([
      req.payload.find({ collection: 'products', where: onShelf, sort: '-createdAt', limit: 80, depth: 1, locale: lang, overrideAccess: true }),
      req.payload.count({ collection: 'products', where: { and: [onShelf, { createdAt: { greater_than: new Date(Date.now() - DAY).toISOString() } }] }, overrideAccess: true }),
      req.payload.count({ collection: 'products', where: { and: [onShelf, { createdAt: { greater_than: new Date(Date.now() - 7 * DAY).toISOString() } }] }, overrideAccess: true }),
    ])
    return (
      <div className="zt-labels-page">
        <div className="zt-labels-bar">
          <a href={admin}>{t.back}</a>
          <h1>🏷️ {t.title}</h1>
        </div>
        <p className="zt-labels-intro">{t.pickIntro}</p>
        <div className="zt-labels-quick">
          <a href={`${admin}/labels?recent=1&size=${size}`}>{t.today} ({todayCount.totalDocs})</a>
          <a href={`${admin}/labels?recent=7&size=${size}`}>{t.week} ({weekCount.totalDocs})</a>
        </div>
        {items.docs.length ? (
          <form method="get" action={`${admin}/labels`} className="zt-labels-pick">
            <fieldset className="zt-labels-size">
              <label><input type="radio" name="size" value="a4" defaultChecked={size === 'a4'} /> {t.a4}</label>
              <label><input type="radio" name="size" value="roll" defaultChecked={size === 'roll'} /> {t.roll}</label>
            </fieldset>
            <ul>
              {items.docs.map((p) => {
                const img = thumb(p)
                return (
                  <li key={p.id}>
                    <label>
                      <input type="checkbox" name="id" value={p.id} />
                      {img ? <img src={img} alt="" width={40} height={40} /> : <span className="zt-labels-noimg" />}
                      <span><b>{p.title}</b><small>{p.sku} · {money(p.price, lang)}</small></span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <button type="submit" className="zt-labels-btn">{t.print}</button>
          </form>
        ) : (
          <p>{t.none}</p>
        )}
      </div>
    )
  }

  const where: Where = ids.length ? { id: { in: ids } } : { and: [onShelf, { createdAt: { greater_than: new Date(Date.now() - recent * DAY).toISOString() } }] }
  const found = await req.payload.find({ collection: 'products', where, sort: '-createdAt', limit: 120, depth: 0, locale: 'ka', overrideAccess: true })
  const base = siteUrlFor(req.headers)
  const labels = await Promise.all(
    found.docs
      .filter((p) => p.sku)
      .map(async (p) => ({
        p,
        qr: await QRCode.toString(`${base}${labelPath(p.sku!)}`, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }),
      })),
  )
  const keep = new URLSearchParams()
  if (ids.length) keep.set('ids', ids.join(','))
  else keep.set('recent', String(recent))
  const sizeLink = (s: string) => `${admin}/labels?${new URLSearchParams([...keep, ['size', s]]).toString()}`

  return (
    <div className={`zt-labels-page zt-labels-page--${size}`}>
      <style>{size === 'roll' ? '@page { size: 50mm 30mm; margin: 0 }' : '@page { size: A4; margin: 0 }'}</style>
      <div className="zt-labels-bar zt-noprint">
        <a href={`${admin}/labels`}>{t.choose}</a>
        <h1>🏷️ {t.title}</h1>
        <span className="zt-labels-count">{t.count.replace('{n}', String(labels.length))}</span>
        <span className="zt-labels-sizes">
          <a href={sizeLink('a4')} aria-current={size === 'a4' ? 'true' : undefined}>{t.a4}</a>
          <a href={sizeLink('roll')} aria-current={size === 'roll' ? 'true' : undefined}>{t.roll}</a>
        </span>
        <PrintButton />
      </div>
      <p className="zt-labels-intro zt-noprint">{t.hint}</p>
      <div className={`zt-sheet zt-sheet--${size}`}>
        {labels.map(({ p, qr }) => (
          <div className="zt-label" key={p.id}>
            {/* generated by `qrcode` from our own URL — no user markup */}
            <div className="zt-label__qr" dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="zt-label__txt">
              <b className="zt-label__title">{p.title}</b>
              <span className="zt-label__cond">{CONDITIONS.find((c) => c.value === p.condition)?.label.ka}</span>
              <strong className="zt-label__price">{money(p.price, 'ka')}</strong>
              <span className="zt-label__sku">ZOY TOY · {p.sku}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function thumb(p: Product) {
  const main = p.gallery?.find((g) => g.role === 'main') ?? p.gallery?.[0]
  const m = main?.image && typeof main.image === 'object' ? main.image : null
  return m?.sizes?.thumb?.url ?? m?.url ?? null
}

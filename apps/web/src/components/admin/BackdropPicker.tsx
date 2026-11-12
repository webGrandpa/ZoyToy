'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useDocumentInfo, useField, useTranslation } from '@payloadcms/ui'
import { ACCENT_HEX, BACKDROP_LABEL, BACKDROPS, CUTOUT_MIN_CLEAR, SCENE_LABEL, SCENES, soften, tintOf, type Backdrop, type Scene } from '../../lib/backdrop'
import { asLang, type Lang } from '../../lib/telegram/templates'

const UI: Record<Lang, { title: string; color: string; scene: string; none: string; checking: string; cut: string; photo: string; auto: string; how: string; tips: string[] }> = {
  ka: {
    title: 'ფონი საიტზე',
    color: 'ფერი',
    scene: 'ნახატი',
    none: 'ჯერ ფოტო აირჩიე. ფონი მოშორებულ ფოტოზე აისახება.',
    checking: 'ვამოწმებ ფოტოს…',
    cut: '✅ ფონი მოშორებულია — სათამაშო საიტზე ამ ფონზე გამოჩნდება.',
    photo: 'ℹ️ ამ ფოტოს საკუთარი ფონი აქვს და საიტზე ისე გამოჩნდება, როგორც არის. ფონის ასარჩევად ატვირთე ფონმოშორებული ფოტო (PNG).',
    auto: 'ფერი — ნივთის კატეგორიის მიხედვით',
    how: 'როგორ მოვაშორო ფონი?',
    tips: [
      'iPhone: „ფოტოებში“ სათამაშოზე თითი დიდხანს → „გაზიარება“ → „სურათის შენახვა“ — ინახება ფონის გარეშე.',
      'Samsung: გალერეაში სათამაშოზე თითი დიდხანს → „სურათად შენახვა“.',
      'ნებისმიერ ტელეფონზე ან კომპიუტერზე: remove.bg ან Photoroom (უფასოდ).',
      'ატვირთე PNG ფორმატში — JPG გამჭვირვალე ფონს ვერ ინახავს. ცარიელ კიდეებს საიტი თავისით მოაჭრის.',
    ],
  },
  ru: {
    title: 'Фон на сайте',
    color: 'Цвет',
    scene: 'Рисунок',
    none: 'Сначала выберите фото. Фон применяется к фото без фона.',
    checking: 'Проверяю фото…',
    cut: '✅ Фон удалён — игрушка встанет на сайте на этот фон.',
    photo: 'ℹ️ У этого фото свой фон, на сайте оно будет как есть. Чтобы выбрать фон, загрузите фото без фона (PNG).',
    auto: 'Цвет — по категории товара',
    how: 'Как удалить фон?',
    tips: [
      'iPhone: в «Фото» удерживайте палец на игрушке → «Поделиться» → «Сохранить изображение» — сохранится без фона.',
      'Samsung: в Галерее удерживайте палец на игрушке → «Сохранить как изображение».',
      'На любом телефоне или компьютере: remove.bg или Photoroom (бесплатно).',
      'Загружайте PNG — JPG не хранит прозрачность. Пустые края сайт обрежет сам.',
    ],
  },
  en: {
    title: 'Backdrop on the site',
    color: 'Colour',
    scene: 'Scene',
    none: 'Choose a photo first. The backdrop applies to photos with the background removed.',
    checking: 'Checking the photo…',
    cut: '✅ Background removed — the toy will stand on this backdrop on the site.',
    photo: 'ℹ️ This photo has its own background and shows on the site as it is. To pick a backdrop, upload a photo with the background removed (PNG).',
    auto: 'Colour — from the item’s category',
    how: 'How do I remove the background?',
    tips: [
      'iPhone: in Photos, touch and hold the toy → Share → Save Image — it saves without the background.',
      'Samsung: in Gallery, touch and hold the toy → Save as image.',
      'Any phone or computer: remove.bg or Photoroom (free).',
      'Upload a PNG — JPG cannot keep transparency. The site trims empty edges by itself.',
    ],
  },
}

/**
 * The same look the server takes (lib/cutout.ts) for a file not uploaded yet: is enough of it see-through,
 * and if so a copy cropped to the toy, so the preview shows the toy as big as the site will.
 */
async function inspectInBrowser(file: File): Promise<{ cut: boolean; url: string | null }> {
  if (!/^image\/(png|webp|avif)$/.test(file.type)) return { cut: false, url: null }
  try {
    const bmp = await createImageBitmap(file)
    const side = 256
    const scale = Math.min(1, side / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const probe = document.createElement('canvas')
    probe.width = w
    probe.height = h
    const pctx = probe.getContext('2d')
    if (!pctx) return { cut: false, url: null }
    pctx.drawImage(bmp, 0, 0, w, h)
    const px = pctx.getImageData(0, 0, w, h).data
    let clear = 0
    let [x0, y0, x1, y1] = [w, h, -1, -1]
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const a = px[(y * w + x) * 4 + 3]
        if (a < 16) clear++
        else {
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
      }
    if (clear / (w * h) < CUTOUT_MIN_CLEAR || x1 < 0) return { cut: false, url: null }
    // crop the full-size picture to the toy (one probe pixel of margin)
    const sx = Math.max(0, (x0 - 1) / scale)
    const sy = Math.max(0, (y0 - 1) / scale)
    const sw = Math.min(bmp.width - sx, (x1 - x0 + 3) / scale)
    const sh = Math.min(bmp.height - sy, (y1 - y0 + 3) / scale)
    const fit = Math.min(1, 600 / Math.max(sw, sh))
    const out = document.createElement('canvas')
    out.width = Math.round(sw * fit)
    out.height = Math.round(sh * fit)
    out.getContext('2d')?.drawImage(bmp, sx, sy, sw, sh, 0, 0, out.width, out.height)
    const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'))
    return { cut: true, url: blob ? URL.createObjectURL(blob) : null }
  } catch {
    return { cut: false, url: null }
  }
}

const vars = (bd: Backdrop): CSSProperties => {
  const hex = ACCENT_HEX[tintOf({ bd, sc: 'plain' }, 'sun')]
  return { ['--bd-soft' as string]: soften(hex, 0.3), ['--bd-deep' as string]: soften(hex, 0.5), ['--bd-hex' as string]: hex }
}

/**
 * Photo form: the backdrop a cut-out stands on, chosen on colour swatches and scene tiles with a live
 * preview of this very photo — drawn like the site's cards (site.css „cut-out photos“). Also says whether
 * the photo counts as a cut-out, and how to make one.
 */
export function BackdropPicker({ path = 'backdrop' }: { path?: string }) {
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const ui = UI[lang]
  const base = path.replace(/backdrop$/, '')
  const { value: bdValue, setValue: setBd } = useField<string>({ path })
  const { value: scValue, setValue: setSc } = useField<string>({ path: `${base}scene` })
  const { value: savedCut } = useField<boolean>({ path: `${base}cutout` })
  const { value: file } = useField<File | null>({ path: 'file' })
  const { savedDocumentData, data } = useDocumentInfo()
  const doc = (savedDocumentData ?? data) as { url?: string; sizes?: { card?: { url?: string } } } | undefined

  const bd = ((BACKDROPS as readonly string[]).includes(bdValue ?? '') ? bdValue : 'auto') as Backdrop
  const sc = ((SCENES as readonly string[]).includes(scValue ?? '') ? scValue : 'halo') as Scene

  // a freshly chosen file: preview it and test it here; otherwise the stored photo and the server's verdict
  const fresh = typeof File !== 'undefined' && file instanceof File ? file : null
  const [freshUrl, setFreshUrl] = useState<string | null>(null)
  const [freshCut, setFreshCut] = useState<boolean | null>(null)
  useEffect(() => {
    if (!fresh) {
      setFreshUrl(null)
      setFreshCut(null)
      return
    }
    const raw = URL.createObjectURL(fresh)
    let cropped: string | null = null
    let alive = true
    setFreshUrl(raw)
    setFreshCut(null)
    void inspectInBrowser(fresh).then((r) => {
      cropped = r.url
      if (!alive) return
      setFreshCut(r.cut)
      if (r.url) setFreshUrl(r.url)
    })
    return () => {
      alive = false
      URL.revokeObjectURL(raw)
      if (cropped) URL.revokeObjectURL(cropped)
    }
  }, [fresh])

  const src = freshUrl ?? doc?.sizes?.card?.url ?? doc?.url ?? null
  const cut = fresh ? freshCut : Boolean(savedCut)
  const state = !src ? ui.none : cut === null ? ui.checking : cut ? ui.cut : ui.photo

  return (
    <div className={`zt-bdp${src && cut === false ? ' zt-bdp--photo' : ''}`}>
      <div className={`zt-bd zt-bd--${cut ? sc : 'photo'}`} style={vars(bd)} aria-hidden="true">
        {src ? <img src={src} alt="" /> : <span className="zt-bd__empty">🧸</span>}
      </div>
      <div className="zt-bdp__side">
        <p className="zt-bdp__title">{ui.title}</p>
        <p className={`zt-bdp__state${src && cut === false ? ' zt-bdp__state--photo' : ''}`} role="status">
          {state}
        </p>
        <div className="zt-bdp__row">
          <span>{ui.color}</span>
          <div className="zt-bdp__swatches" role="radiogroup" aria-label={ui.color}>
            {BACKDROPS.map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={bd === b}
                title={BACKDROP_LABEL[b][lang]}
                aria-label={BACKDROP_LABEL[b][lang]}
                className={`zt-bdp__swatch${b === 'auto' ? ' zt-bdp__swatch--auto' : ''}`}
                style={b === 'auto' ? undefined : { background: ACCENT_HEX[b] }}
                onClick={() => setBd(b)}
              >
                {b === 'auto' ? 'A' : null}
              </button>
            ))}
          </div>
        </div>
        {bd === 'auto' ? <p className="zt-bdp__hint">{ui.auto}</p> : null}
        <div className="zt-bdp__row">
          <span>{ui.scene}</span>
          <div className="zt-bdp__scenes" role="radiogroup" aria-label={ui.scene}>
            {SCENES.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={sc === s} className="zt-bdp__scene" onClick={() => setSc(s)}>
                <span className={`zt-bd zt-bd--${s} zt-bd--mini`} style={vars(bd)} aria-hidden="true" />
                {SCENE_LABEL[s][lang]}
              </button>
            ))}
          </div>
        </div>
        <details className="zt-bdp__how">
          <summary>{ui.how}</summary>
          <ul>
            {ui.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useConfig, useField, useTranslation } from '@payloadcms/ui'
import { asLang, type Lang } from '../../lib/telegram/templates'

type Img = { url?: string; sizes?: { thumb?: { url?: string }; tile?: { url?: string } }; cutout?: boolean }
type Item = { id: number; title?: string; sku?: string; price?: number; status?: string; categories?: ({ id: number; title?: string } | number)[]; gallery?: { image?: Img | number | null; role?: string }[] }

const UI: Record<Lang, Record<string, string>> = {
  ka: {
    title: 'რომელ ნივთებზე მოქმედებს ფასდაკლება',
    all: 'ყველა ნივთზე',
    some: 'მხოლოდ მონიშნულ ნივთებზე',
    allHint: 'მოგებული კოდი კალათის ყველა ნივთზე იმოქმედებს.',
    noneYet: 'მონიშნე მინიმუმ ერთი ნივთი — სანამ არაფერია მონიშნული, ფასდაკლება ყველაზე მოქმედებს.',
    search: 'ძებნა: სახელი ან SKU',
    anyCat: 'ყველა კატეგორია',
    tickShown: '✓ ნაჩვენების მონიშვნა',
    untickShown: '✕ ნაჩვენების მოხსნა',
    chosen: 'მონიშნულია: {n}',
    onlyChosen: 'მხოლოდ მონიშნულები',
    empty: 'ასეთი ნივთი ვერ მოიძებნა.',
    loading: 'ნივთები იტვირთება…',
  },
  ru: {
    title: 'На какие товары действует скидка',
    all: 'На все товары',
    some: 'Только на отмеченные',
    allHint: 'Выигранный код действует на все товары в корзине.',
    noneYet: 'Отметьте хотя бы один товар — пока ничего не отмечено, скидка действует на всё.',
    search: 'Поиск: название или SKU',
    anyCat: 'Все категории',
    tickShown: '✓ Отметить показанные',
    untickShown: '✕ Снять показанные',
    chosen: 'Отмечено: {n}',
    onlyChosen: 'Только отмеченные',
    empty: 'Ничего не найдено.',
    loading: 'Загрузка товаров…',
  },
  en: {
    title: 'Items the discount applies to',
    all: 'Every item',
    some: 'Only the ticked items',
    allHint: 'A won code works on every item in the cart.',
    noneYet: 'Tick at least one item — while nothing is ticked the discount works on everything.',
    search: 'Search: name or SKU',
    anyCat: 'All categories',
    tickShown: '✓ Tick shown',
    untickShown: '✕ Untick shown',
    chosen: 'Ticked: {n}',
    onlyChosen: 'Only ticked',
    empty: 'Nothing found.',
    loading: 'Loading items…',
  },
}

const idOf = (v: unknown) => (v && typeof v === 'object' ? Number((v as { id?: unknown }).id) : Number(v))
const thumbOf = (p: Item) => {
  const g = p.gallery?.find((x) => x.role === 'main') ?? p.gallery?.[0]
  const img = g?.image && typeof g.image === 'object' ? g.image : null
  return img ? ((img.cutout ? img.sizes?.tile?.url : img.sizes?.thumb?.url) ?? img.url ?? null) : null
}

/**
 * Campaign form: which toys a won discount applies to — the shop's items with photos and tick boxes,
 * searchable and filterable by category (feedback 2026-11-12: whole categories were too coarse).
 * Nothing ticked = every item.
 */
export function ProductPicker({ path = 'products' }: { path?: string }) {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const ui = UI[lang]
  const api = config.routes?.api ?? '/api'
  const { value, setValue } = useField<unknown[]>({ path })
  const chosen = useMemo(() => new Set((Array.isArray(value) ? value : []).map(idOf).filter((n) => Number.isInteger(n) && n > 0)), [value])

  const [mode, setMode] = useState<'all' | 'some'>(chosen.size ? 'some' : 'all')
  const [items, setItems] = useState<Item[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [onlyChosen, setOnlyChosen] = useState(false)

  useEffect(() => {
    if (mode !== 'some' || items) return
    const qs = 'limit=500&depth=1&sort=-createdAt&where[status][in][0]=published&where[status][in][1]=reserved&where[status][in][2]=draft'
    fetch(`${api}/products?${qs}&locale=${lang}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs: Item[] }) => setItems(d.docs))
      .catch(() => setItems([]))
  }, [mode, items, api, lang])

  const cats = useMemo(() => {
    const m = new Map<number, string>()
    for (const p of items ?? []) for (const c of p.categories ?? []) if (typeof c === 'object') m.set(c.id, c.title ?? `#${c.id}`)
    return [...m]
  }, [items])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return (items ?? []).filter(
      (p) =>
        (!needle || `${p.title ?? ''} ${p.sku ?? ''}`.toLowerCase().includes(needle)) &&
        (!cat || (p.categories ?? []).some((c) => idOf(c) === Number(cat))) &&
        (!onlyChosen || chosen.has(p.id)),
    )
  }, [items, q, cat, onlyChosen, chosen])

  const save = (next: Set<number>) => setValue([...next])
  const toggle = (id: number) => {
    const next = new Set(chosen)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    save(next)
  }

  return (
    <div className="zt-pp">
      <p className="zt-pp__title">🎯 {ui.title}</p>
      <div className="zt-pp__modes" role="radiogroup" aria-label={ui.title}>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'all'}
          onClick={() => {
            setMode('all')
            save(new Set())
          }}
        >
          {ui.all}
        </button>
        <button type="button" role="radio" aria-checked={mode === 'some'} onClick={() => setMode('some')}>
          {ui.some}
        </button>
      </div>
      {mode === 'all' ? (
        <p className="zt-pp__hint">{ui.allHint}</p>
      ) : (
        <>
          {!chosen.size ? <p className="zt-pp__warn">{ui.noneYet}</p> : null}
          <div className="zt-pp__tools">
            <input type="search" value={q} placeholder={ui.search} onChange={(e) => setQ(e.target.value)} />
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">{ui.anyCat}</option>
              {cats.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
            <label className="zt-pp__only">
              <input type="checkbox" checked={onlyChosen} onChange={(e) => setOnlyChosen(e.target.checked)} />
              {ui.onlyChosen}
            </label>
          </div>
          <div className="zt-pp__bulk">
            <b>{ui.chosen.replace('{n}', String(chosen.size))}</b>
            <button type="button" onClick={() => save(new Set([...chosen, ...shown.map((p) => p.id)]))} disabled={!shown.length}>
              {ui.tickShown}
            </button>
            <button
              type="button"
              onClick={() => {
                const drop = new Set(shown.map((p) => p.id))
                save(new Set([...chosen].filter((id) => !drop.has(id))))
              }}
              disabled={!shown.length}
            >
              {ui.untickShown}
            </button>
          </div>
          {!items ? (
            <p className="zt-pp__hint">{ui.loading}</p>
          ) : !shown.length ? (
            <p className="zt-pp__hint">{ui.empty}</p>
          ) : (
            <ul className="zt-pp__list">
              {shown.map((p) => {
                const src = thumbOf(p)
                return (
                  <li key={p.id}>
                    <label className={chosen.has(p.id) ? 'is-on' : undefined}>
                      <input type="checkbox" checked={chosen.has(p.id)} onChange={() => toggle(p.id)} />
                      <span className="zt-pp__img">{src ? <img src={src} alt="" loading="lazy" /> : '🧸'}</span>
                      <span className="zt-pp__name">
                        <b>{p.title}</b>
                        <small>
                          {p.sku} · {p.price ?? 0} ₾
                        </small>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

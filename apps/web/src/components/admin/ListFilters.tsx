'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConfig, useListQuery, useTableColumns, useTranslation } from '@payloadcms/ui'
import type { Where } from 'payload'
import { asLang, type Lang } from '../../lib/telegram/templates'

type L3 = Record<Lang, string>
type Chip = { key: string; label: L3; where: Where | null }
type Preset = { chips: Chip[]; categories?: boolean; toggles?: Chip[] }

const L = (ka: string, ru: string, en: string): L3 => ({ ka, ru, en })
const ALL = (label = L('ყველა', 'Все', 'All')): Chip => ({ key: 'all', label, where: null })
const status = (value: string, label: L3): Chip => ({ key: value, label, where: { status: { equals: value } } })

const dayStart = (daysBack: number) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - daysBack)
  return d.toISOString()
}

/** Quick filters per collection: one tap instead of Payload's field → operator → value builder. */
const PRESETS: Record<string, Preset> = {
  products: {
    chips: [
      ALL(),
      status('published', L('🟢 თაროზე', '🟢 В продаже', '🟢 On sale')),
      status('reserved', L('🟡 დაჯავშნილი', '🟡 Забронирован', '🟡 Reserved')),
      status('sold', L('🔴 გაყიდული', '🔴 Продан', '🔴 Sold')),
      status('draft', L('📝 დრაფტი', '📝 Черновик', '📝 Draft')),
      status('archived', L('📦 არქივი', '📦 Архив', '📦 Archived')),
    ],
    categories: true,
    toggles: [{ key: 'rent', label: L('🔑 ქირავდება', '🔑 Сдаётся', '🔑 For rent'), where: { 'rental.enabled': { equals: true } } }],
  },
  orders: {
    chips: [
      ALL(),
      status('requested', L('🆕 ახალი', '🆕 Новые', '🆕 New')),
      status('confirmed', L('✅ დადასტურებული', '✅ Подтверждён', '✅ Confirmed')),
      status('paid', L('💰 გადახდილი', '💰 Оплачен', '💰 Paid')),
      status('shipped', L('📦 გაგზავნილი', '📦 Отправлен', '📦 Shipped')),
      status('completed', L('🏁 დასრულებული', '🏁 Завершён', '🏁 Completed')),
      status('cancelled', L('❌ გაუქმებული', '❌ Отменён', '❌ Cancelled')),
    ],
  },
  rewards: {
    chips: [
      ALL(),
      status('issued', L('🎟 მოქმედი', '🎟 Действует', '🎟 Active')),
      status('redeemed', L('✅ გამოყენებული', '✅ Использован', '✅ Used')),
      status('expired', L('⌛ ვადაგასული', '⌛ Истёк', '⌛ Expired')),
    ],
  },
  'store-sales': {
    chips: [
      ALL(),
      { key: 'today', label: L('📅 დღეს', '📅 Сегодня', '📅 Today'), where: { createdAt: { greater_than_equal: dayStart(0) } } },
      { key: 'week', label: L('🗓 ბოლო 7 დღე', '🗓 7 дней', '🗓 Last 7 days'), where: { createdAt: { greater_than_equal: dayStart(6) } } },
    ],
  },
  media: {
    chips: [ALL(), { key: 'cut', label: L('✂️ ფონმოშორებული', '✂️ Без фона', '✂️ Cut-outs'), where: { cutout: { equals: true } } }],
  },
}

const UI: Record<Lang, { cat: string; anyCat: string; reset: string; columns: string }> = {
  ka: { cat: 'კატეგორია', anyCat: 'ყველა კატეგორია', reset: 'ფილტრის მოხსნა', columns: '↺ სვეტები თავიდან' },
  ru: { cat: 'Категория', anyCat: 'Все категории', reset: 'Сбросить', columns: '↺ Столбцы по умолчанию' },
  en: { cat: 'Category', anyCat: 'All categories', reset: 'Clear filters', columns: '↺ Default columns' },
}

/** Every plain condition inside a where (our own filters are a flat `and` list). */
function conditions(where: Where | undefined): Where[] {
  if (!where || typeof where !== 'object') return []
  const out: Where[] = []
  for (const [k, v] of Object.entries(where)) {
    if ((k === 'and' || k === 'or') && Array.isArray(v)) v.forEach((w) => out.push(...conditions(w as Where)))
    else out.push({ [k]: v } as Where)
  }
  return out
}
const same = (a: Where | null, b: Where) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Above each list (Products, Orders, Rewards, Sales, Photos): one-tap filter chips with counts and, for
 * items, a category menu. Replaces Payload's column picker and filter builder, which the owner found
 * impossible to use (feedback 2026-11-12). Works through the list's own URL query, so paging and search
 * keep working and a filtered list can be bookmarked.
 */
export function ListFilters({ collection }: { collection: string }) {
  const preset = PRESETS[collection]
  const { query, handleWhereChange } = useListQuery()
  const { resetColumnsState } = useTableColumns()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const ui = UI[lang]
  const api = config.routes?.api ?? '/api'

  const current = useMemo(() => conditions(query?.where as Where | undefined), [query?.where])
  const activeChip = preset?.chips.find((c) => c.where && current.some((w) => same(c.where, w)))?.key ?? 'all'
  const activeToggles = new Set((preset?.toggles ?? []).filter((t) => current.some((w) => same(t.where, w))).map((t) => t.key))
  const catCond = current.find((w) => 'categories' in w) as { categories?: { in?: (string | number)[] } } | undefined
  const activeCat = catCond?.categories?.in?.[0] != null ? String(catCond.categories.in[0]) : ''

  const apply = useCallback(
    (next: { chip?: string; cat?: string; toggles?: Set<string> }) => {
      if (!preset || !handleWhereChange) return
      const chip = preset.chips.find((c) => c.key === (next.chip ?? activeChip))
      const cat = next.cat ?? activeCat
      const toggles = next.toggles ?? activeToggles
      const and: Where[] = []
      if (chip?.where) and.push(chip.where)
      if (cat) and.push({ categories: { in: [Number(cat)] } })
      for (const t of preset.toggles ?? []) if (toggles.has(t.key) && t.where) and.push(t.where)
      void handleWhereChange(and.length ? { and } : {})
    },
    [preset, handleWhereChange, activeChip, activeCat, activeToggles],
  )

  // how many in each chip — the owner sees at a glance where work is waiting
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [cats, setCats] = useState<{ id: number; title: string }[]>([])
  useEffect(() => {
    if (!preset) return
    let alive = true
    const count = async (where: Where | null) => {
      const qs = new URLSearchParams({ limit: '1', depth: '0' })
      const res = await fetch(`${api}/${collection}?${qs}&${toQuery(where)}`, { credentials: 'include' }).catch(() => null)
      return res?.ok ? ((await res.json()) as { totalDocs?: number }).totalDocs ?? 0 : 0
    }
    void Promise.all(preset.chips.map(async (c) => [c.key, await count(c.where)] as const)).then((pairs) => alive && setCounts(Object.fromEntries(pairs)))
    if (preset.categories)
      void fetch(`${api}/categories?limit=100&depth=0&sort=order&locale=${lang}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { docs: [] }))
        .then((d: { docs: { id: number; title: string }[] }) => alive && setCats(d.docs))
        .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [api, collection, preset, lang])

  if (!preset) return null
  const filtered = activeChip !== 'all' || activeCat || activeToggles.size > 0
  return (
    <div className="zt-lf" role="group" aria-label="filters">
      <div className="zt-lf__chips">
        {preset.chips.map((c) => (
          <button key={c.key} type="button" className="zt-lf__chip" aria-pressed={activeChip === c.key} onClick={() => apply({ chip: c.key })}>
            {c.label[lang]}
            {counts[c.key] != null ? <em>{counts[c.key]}</em> : null}
          </button>
        ))}
        {(preset.toggles ?? []).map((t) => (
          <button
            key={t.key}
            type="button"
            className="zt-lf__chip zt-lf__chip--toggle"
            aria-pressed={activeToggles.has(t.key)}
            onClick={() => {
              const next = new Set(activeToggles)
              if (next.has(t.key)) next.delete(t.key)
              else next.add(t.key)
              apply({ toggles: next })
            }}
          >
            {t.label[lang]}
          </button>
        ))}
      </div>
      <div className="zt-lf__side">
        {preset.categories ? (
          <label className="zt-lf__cat">
            <span>{ui.cat}</span>
            <select value={activeCat} onChange={(e) => apply({ cat: e.target.value })}>
              <option value="">{ui.anyCat}</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {filtered ? (
          <button type="button" className="zt-lf__reset" onClick={() => apply({ chip: 'all', cat: '', toggles: new Set() })}>
            ✕ {ui.reset}
          </button>
        ) : null}
        <button type="button" className="zt-lf__reset" onClick={() => void resetColumnsState?.()}>
          {ui.columns}
        </button>
      </div>
    </div>
  )
}

/** where → `where[status][equals]=x` query string (qs-style, as Payload's REST API reads it). */
function toQuery(where: Where | null, prefix = 'where'): string {
  if (!where) return ''
  const parts: string[] = []
  const walk = (value: unknown, key: string) => {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${key}[${i}]`))
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, `${key}[${k}]`)
    else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  walk(where, prefix)
  return parts.join('&')
}

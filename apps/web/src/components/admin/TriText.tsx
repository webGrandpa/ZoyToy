'use client'

import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { TextareaField, TextField, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'

const LOCALES = ['ka', 'ru', 'en'] as const
const NAME: Record<string, string> = { ka: '🇬🇪 ქართული', ru: '🇷🇺 Русский', en: '🇬🇧 English' }

// one request per document (all languages at once), shared by every field of the form
const cache = new Map<string, Promise<Record<string, unknown> | null>>()
const loadAll = (url: string) => {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    )
  return cache.get(url)!
}

/** The value of one language at a form path (`seo.title`, `defects.0.text`) in a `locale=all` document. */
function readAt(doc: unknown, path: string, locale: string): string {
  let node: unknown = doc
  for (const step of path.split('.')) {
    if (node == null) return ''
    node = Array.isArray(node) ? node[Number(step)] : (node as Record<string, unknown>)[step]
  }
  if (node && typeof node === 'object') node = (node as Record<string, unknown>)[locale]
  return typeof node === 'string' ? node : ''
}

type Props = Omit<ComponentProps<typeof TextField>, 'field'> & { field: { type?: string; admin?: { rows?: number } } }

/**
 * A translatable text field with all three languages on screen (owner, 2026-11-19): the language chosen
 * at the top as Payload's own field (validation, required…), the other two right under it. Their text is
 * sent with the save in the hidden `i18n` field and written by lib/i18nFields.ts; array rows are keyed by
 * their id, so adding or removing rows cannot shift a translation onto the wrong row.
 */
export function TriText(props: Props) {
  const { field, path } = props
  const p = String(path ?? '')
  const { config } = useConfig()
  const api = config.routes?.api ?? '/api'
  const { code: current } = useLocale()
  const { id, collectionSlug, globalSlug, savedDocumentData } = useDocumentInfo()
  const form = useForm()
  const { setValue: setDraft } = useField<Record<string, Record<string, string>>>({ path: 'i18n' })
  const others = LOCALES.filter((l) => l !== current)
  const isArea = field?.type === 'textarea'

  const stamp = String((savedDocumentData as { updatedAt?: string } | undefined)?.updatedAt ?? '')
  const url = globalSlug ? `${api}/globals/${globalSlug}?locale=all&depth=0&t=${stamp}` : id ? `${api}/${collectionSlug}/${id}?locale=all&depth=0&t=${stamp}` : null

  // array rows by id: `defects.0.text` → `defects.@6af4….text`
  const key = useMemo(() => {
    const steps = p.split('.')
    return steps
      .map((s, i) => {
        if (!/^\d+$/.test(s)) return s
        const rowId = form.getDataByPath(`${steps.slice(0, i + 1).join('.')}.id`)
        return rowId ? `@${String(rowId)}` : s
      })
      .join('.')
  }, [p, form])

  const [values, setValues] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState(false)
  useEffect(() => {
    if (!url) return
    let alive = true
    void loadAll(url).then((doc) => {
      if (!alive || !doc || touched) return
      setValues(Object.fromEntries(others.map((l) => [l, readAt(doc, p, l)])))
    })
    return () => {
      alive = false
    }
  }, [url, p, current]) // eslint-disable-line react-hooks/exhaustive-deps

  const change = (locale: string, text: string) => {
    setTouched(true)
    setValues((v) => ({ ...v, [locale]: text }))
    const draft = (form.getDataByPath('i18n') as Record<string, Record<string, string>> | undefined) ?? {}
    setDraft({ ...draft, [locale]: { ...(draft[locale] ?? {}), [key]: text } })
  }

  const Own = isArea ? TextareaField : TextField
  // required only in Georgian (lib/i18nFields.ts): the star shows when Georgian is the language on top
  const custom = (field as { admin?: { custom?: { requiredInMain?: boolean; placeholders?: Record<string, string> } } })?.admin?.custom
  const hint = custom?.placeholders
  const own = {
    ...props,
    field: { ...field, required: Boolean(custom?.requiredInMain) && current === 'ka', admin: { ...(field as { admin?: object }).admin, ...(hint?.[current] ? { placeholder: hint[current] } : {}) } },
  }
  return (
    <div className="zt-tri">
      <Own {...(own as unknown as ComponentProps<typeof TextareaField> & ComponentProps<typeof TextField>)} />
      <div className="zt-tri__others">
        {others.map((l) => (
          <label key={l} className="zt-tri__lang">
            <span>{NAME[l]}</span>
            {isArea ? (
              <textarea rows={Math.max(2, Math.min(field?.admin?.rows ?? 3, 4))} value={values[l] ?? ''} placeholder={hint?.[l]} onChange={(e) => change(l, e.target.value)} readOnly={Boolean(props.readOnly)} />
            ) : (
              <input type="text" value={values[l] ?? ''} placeholder={hint?.[l]} onChange={(e) => change(l, e.target.value)} readOnly={Boolean(props.readOnly)} />
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

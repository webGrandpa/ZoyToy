import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig, Field, GlobalAfterChangeHook, GlobalBeforeChangeHook, GlobalConfig, PayloadRequest } from 'payload'
import { text, textarea } from 'payload/shared'
import { DEFAULT_LOCALE, LOCALES } from '../i18n/config'

/**
 * Every language at once (owner, 2026-11-19: „three fields everywhere“). A translatable text field shows
 * the current language as usual and the two others right under it (components/admin/TriText.tsx). The
 * other two travel with the save in the hidden virtual field `i18n` — `{ ru: { title: '…', 'defects.@rowId.text': '…' } }`
 * — and are written into their own languages right after the save, in the same transaction.
 */
const DRAFT = 'i18n'
type Draft = Record<string, Record<string, string>>

const draftField: Field = { name: DRAFT, type: 'json', virtual: true, admin: { hidden: true } }

type Validate = (value: unknown, args: { req?: PayloadRequest } & Record<string, unknown>) => true | string | Promise<true | string>

/**
 * While the side languages are written, a required text that is still empty in that language is fine —
 * the visitor sees the Georgian one instead (localization fallback). The main save validates as usual.
 */
const lenient = (field: Field & { validate?: Validate }, base: Validate, requiredInMain: boolean): Validate => (value, args) => {
  if (args?.req?.context?.applyingI18n) return true
  // „required“ means: in Georgian, the shop's main language. A translation may stay empty — the site
  // falls back to the Georgian text (and the database allows the empty translation, see the migration)
  const empty = value == null || (typeof value === 'string' && !value.trim())
  if (requiredInMain && empty && (args?.req?.locale ?? DEFAULT_LOCALE) === DEFAULT_LOCALE) return args?.req?.t ? String(args.req.t('validation:required')) : 'required'
  return (field.validate ?? base)(value, args)
}

function walk(fields: Field[]): Field[] {
  return fields.map((f) => {
    let next = f as Field & { admin?: { hidden?: boolean; components?: Record<string, unknown> }; fields?: Field[]; tabs?: { fields: Field[] }[]; validate?: Validate }
    if ((f.type === 'text' || f.type === 'textarea') && 'localized' in f && f.localized) {
      const requiredInMain = Boolean((f as { required?: boolean }).required)
      next = {
        ...next,
        required: false,
        validate: lenient(next, (f.type === 'text' ? text : textarea) as unknown as Validate, requiredInMain),
        admin: { ...next.admin, custom: { ...(next.admin as { custom?: Record<string, unknown> } | undefined)?.custom, requiredInMain } },
      } as typeof next
      if (!next.admin?.hidden && !next.admin?.components?.Field)
        next = { ...next, admin: { ...next.admin, components: { ...next.admin?.components, Field: '/components/admin/TriText#TriText' } } } as typeof next
    }
    if ('tabs' in next && Array.isArray(next.tabs)) next = { ...next, tabs: next.tabs.map((t) => ({ ...t, fields: walk(t.fields) })) } as typeof next
    if ('fields' in next && Array.isArray(next.fields)) next = { ...next, fields: walk(next.fields) } as typeof next
    return next as Field
  })
}

/** Path → value inside a document of one language; `@id` steps pick an array row by its id. */
function setAt(target: Record<string, unknown>, key: string, value: string) {
  const steps = key.split('.')
  let node: unknown = target
  for (let i = 0; i < steps.length - 1; i++) {
    const step = steps[i]
    if (Array.isArray(node)) node = step.startsWith('@') ? node.find((row) => row && (row as { id?: unknown }).id === step.slice(1)) : node[Number(step)]
    else if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      if (obj[step] == null) obj[step] = /^\d+$|^@/.test(steps[i + 1]) ? [] : {}
      node = obj[step]
    } else return
    if (node == null) return // the row is gone (removed before saving)
  }
  if (node && typeof node === 'object' && !Array.isArray(node)) (node as Record<string, unknown>)[steps[steps.length - 1]] = value
}

const takeDraft = (data: Record<string, unknown> | undefined, req: PayloadRequest) => {
  if (!data || !(DRAFT in data)) return
  const draft = data[DRAFT]
  delete data[DRAFT]
  if (draft && typeof draft === 'object' && !req.context.applyingI18n) req.context.i18nDraft = draft
}

/** The languages written in the side fields, as one update per language built on that language's saved values. */
async function applyDraft(req: PayloadRequest, load: (locale: string) => Promise<Record<string, unknown>>, save: (locale: string, data: Record<string, unknown>) => Promise<unknown>) {
  const draft = req.context.i18nDraft as Draft | undefined
  if (!draft || req.context.applyingI18n) return
  delete req.context.i18nDraft
  req.context.applyingI18n = true
  const mainLocale = req.locale
  const mainFallback = req.fallbackLocale
  // and must not fall back to Georgian: an update starts from the saved document read in that language,
  // and a fallback would copy the Georgian text into every empty Russian / English field
  req.fallbackLocale = false as typeof req.fallbackLocale
  try {
    for (const [locale, values] of Object.entries(draft)) {
      if (!(LOCALES as readonly string[]).includes(locale) || locale === mainLocale || !values || typeof values !== 'object') continue
      // the shared request must speak the language being written: defaults (e.g. the Russian message
      // templates) and fallbacks are chosen from req.locale, not only from the `locale` argument
      req.locale = locale as typeof req.locale
      const current = await load(locale)
      const data: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(values)) {
        const top = key.split('.')[0]
        if (!(top in data)) data[top] = current[top] == null ? undefined : structuredClone(current[top])
        if (!key.includes('.')) data[top] = String(value ?? '')
        else setAt(data, key, String(value ?? ''))
      }
      await save(locale, data)
    }
  } finally {
    req.locale = mainLocale
    req.fallbackLocale = mainFallback
    delete req.context.applyingI18n
  }
}

export function withTranslations(collection: CollectionConfig): CollectionConfig {
  const before: CollectionBeforeChangeHook = ({ data, req }) => {
    takeDraft(data, req)
    return data
  }
  const after: CollectionAfterChangeHook = async ({ doc, req }) => {
    await applyDraft(
      req,
      (locale) => req.payload.findByID({ collection: collection.slug as 'products', id: doc.id, locale: locale as 'ka', fallbackLocale: false, depth: 0, req, overrideAccess: true }) as unknown as Promise<Record<string, unknown>>,
      (locale, data) => req.payload.update({ collection: collection.slug as 'products', id: doc.id, locale: locale as 'ka', fallbackLocale: false, data, req, overrideAccess: true }),
    )
    return doc
  }
  const hooks = collection.hooks ?? {}
  return {
    ...collection,
    fields: [...walk(collection.fields), draftField],
    hooks: { ...hooks, beforeChange: [...(hooks.beforeChange ?? []), before], afterChange: [after, ...(hooks.afterChange ?? [])] },
  }
}

/** Names of a global's translatable texts that sit at its top level (tabs and collapsibles have no name). */
function topLocalized(fields: Field[], out: string[] = []) {
  for (const f of fields) {
    if ((f.type === 'text' || f.type === 'textarea') && 'localized' in f && f.localized && 'name' in f) out.push(f.name)
    else if (f.type === 'tabs') for (const t of f.tabs) if (!('name' in t && t.name)) topLocalized(t.fields, out)
    if ((f.type === 'row' || f.type === 'collapsible') && 'fields' in f) topLocalized(f.fields, out)
  }
  return out
}

export function withGlobalTranslations(global: GlobalConfig): GlobalConfig {
  const names = topLocalized(global.fields)
  const before: GlobalBeforeChangeHook = async ({ data, req }) => {
    takeDraft(data, req)
    // a save in Russian / English can start from the Georgian text shown as fallback in empty fields; that
    // text must not become the Russian one (seen with the message templates) — an untouched empty field stays empty
    if (req.locale && req.locale !== DEFAULT_LOCALE && !req.context.applyingI18n && names.length) {
      const read = (locale: string) =>
        req.payload.findGlobal({ slug: global.slug as 'site-settings', locale: locale as 'ka', fallbackLocale: false, depth: 0, overrideAccess: true }) as unknown as Promise<Record<string, unknown>>
      const [own, main] = await Promise.all([read(req.locale), read(DEFAULT_LOCALE)])
      for (const name of names) if ((own[name] == null || own[name] === '') && data[name] != null && data[name] === main[name]) data[name] = null
    }
    return data
  }
  const after: GlobalAfterChangeHook = async ({ doc, req }) => {
    await applyDraft(
      req,
      (locale) => req.payload.findGlobal({ slug: global.slug as 'site-settings', locale: locale as 'ka', fallbackLocale: false, depth: 0, req, overrideAccess: true }) as unknown as Promise<Record<string, unknown>>,
      (locale, data) => req.payload.updateGlobal({ slug: global.slug as 'site-settings', locale: locale as 'ka', fallbackLocale: false, data, req, overrideAccess: true }),
    )
    return doc
  }
  const hooks = global.hooks ?? {}
  return {
    ...global,
    fields: [...walk(global.fields), draftField],
    hooks: { ...hooks, beforeChange: [...(hooks.beforeChange ?? []), before], afterChange: [after, ...(hooks.afterChange ?? [])] },
  }
}

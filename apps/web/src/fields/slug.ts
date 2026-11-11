import type { Field, PayloadRequest } from 'payload'
import { slugify } from '../lib/slug'
import { L } from '../lib/labels'

/** `base`, or `base-2`, `base-3`… — the first one no other document of the collection uses. */
async function unique(req: PayloadRequest, collection: string, base: string, self?: number | string) {
  for (let i = 1; i <= 50; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`
    const taken = await req.payload.count({
      collection: collection as 'products',
      where: { and: [{ slug: { equals: candidate } }, ...(self ? [{ id: { not_equals: self } }] : [])] },
      req,
      overrideAccess: true,
    })
    if (!taken.totalDocs) return candidate
  }
  return `${base}-${Date.now().toString(36)}`
}

/**
 * Unique URL slug, filled from `from` (in the default locale) when left empty. Two toys with the same
 * name get `name` and `name-2`; a slug typed by hand is kept as typed.
 */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  label: L('ბმული (slug)', 'Ссылка (slug)', 'Slug'),
  admin: { position: 'sidebar', description: L('ცარიელი დატოვე — ავტომატურად შეიქმნება', 'Оставьте пустым — создастся автоматически', 'Leave empty to generate automatically') },
  hooks: {
    // a copy gets its own slug from the title
    beforeDuplicate: [() => null],
    beforeValidate: [
      async ({ value, data, originalDoc, req, collection }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = data?.[from] ?? originalDoc?.[from]
        const text = typeof source === 'string' ? source : source?.ka ?? source?.en ?? source?.ru
        if (!text) return value
        const base = slugify(text)
        return collection && base ? unique(req, collection.slug, base, originalDoc?.id) : base
      },
    ],
  },
})

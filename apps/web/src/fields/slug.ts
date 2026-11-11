import type { Field } from 'payload'
import { slugify } from '../lib/slug'
import { L } from '../lib/labels'

/** Unique URL slug, filled from `from` (in the default locale) when left empty. */
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  unique: true,
  index: true,
  label: L('ბმული (slug)', 'Ссылка (slug)', 'Slug'),
  admin: { position: 'sidebar', description: L('ცარიელი დატოვე — ავტომატურად შეიქმნება', 'Оставьте пустым — создастся автоматически', 'Leave empty to generate automatically') },
  hooks: {
    beforeValidate: [
      ({ value, data, originalDoc }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = data?.[from] ?? originalDoc?.[from]
        const text = typeof source === 'string' ? source : source?.ka ?? source?.en ?? source?.ru
        return text ? slugify(text) : value
      },
    ],
  },
})

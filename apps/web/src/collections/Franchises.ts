import type { CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { slugField } from '../fields/slug'

/** Franchise names are shown as text only — no logos (docs/00 §7.1). */
export const Franchises: CollectionConfig = {
  slug: 'franchises',
  labels: { singular: L('ფრენჩაიზი', 'Франшиза', 'Franchise'), plural: L('ფრენჩაიზები', 'Франшизы', 'Franchises') },
  admin: { useAsTitle: 'title', group: L('კატალოგი', 'Каталог', 'Catalogue') },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
    { name: 'description', type: 'textarea', localized: true, label: L('აღწერა', 'Описание', 'Description') },
    slugField(),
  ],
}

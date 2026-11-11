import type { CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { slugField } from '../fields/slug'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: L('ბრენდი', 'Бренд', 'Brand'), plural: L('ბრენდები', 'Бренды', 'Brands') },
  admin: { useAsTitle: 'title', group: L('კატალოგი', 'Каталог', 'Catalogue') },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  fields: [{ name: 'title', type: 'text', required: true, label: L('სახელი', 'Название', 'Title') }, slugField()],
}

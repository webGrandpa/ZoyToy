import type { CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { GROUP } from '../lib/groups'
import { slugField } from '../fields/slug'
import { THEMES, THEME_LABEL } from '../components/home/Bouquet'

export const ACCENTS = ['grape', 'sun', 'sky', 'bubble', 'mint', 'tangerine'] as const

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: L('კატეგორია', 'Категория', 'Category'), plural: L('კატეგორიები', 'Категории', 'Categories') },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'theme', 'order'], group: GROUP.catalogue },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
    { name: 'description', type: 'textarea', localized: true, label: L('მოკლე აღწერა', 'Краткое описание', 'Short description') },
    // picture group + colour, chosen on tiles with a preview of the home-page box (components/admin/CategoryLook.tsx)
    {
      name: 'theme',
      type: 'select',
      label: L('სურათი', 'Картинка', 'Picture'),
      options: THEMES.map((t) => ({ value: t, label: THEME_LABEL[t] })),
      admin: { components: { Field: '/components/admin/CategoryLook#CategoryLook', Cell: '/components/admin/CategoryLook#CategoryLookCell' } },
    },
    { name: 'color', type: 'select', required: true, defaultValue: 'grape', label: L('ფერი', 'Цвет', 'Colour'), options: ACCENTS.map((c) => ({ value: c, label: c })), admin: { hidden: true } },
    // set by the picture picker: the toy drawn on cards without a photo
    { name: 'icon', type: 'text', label: L('იკონა', 'Иконка', 'Icon'), admin: { hidden: true } },
    { name: 'parent', type: 'relationship', relationTo: 'categories', label: L('მშობელი კატეგორია', 'Родительская категория', 'Parent') },
    { name: 'order', type: 'number', defaultValue: 0, label: L('რიგითობა', 'Порядок', 'Order'), admin: { position: 'sidebar' } },
    slugField(),
  ],
}

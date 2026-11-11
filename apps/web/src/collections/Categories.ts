import type { CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { slugField } from '../fields/slug'

export const ACCENTS = ['grape', 'sun', 'sky', 'bubble', 'mint', 'tangerine'] as const

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: L('კატეგორია', 'Категория', 'Category'), plural: L('კატეგორიები', 'Категории', 'Categories') },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'color', 'order'], group: L('კატალოგი', 'Каталог', 'Catalogue') },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  defaultSort: 'order',
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
    { name: 'description', type: 'textarea', localized: true, label: L('მოკლე აღწერა', 'Краткое описание', 'Short description') },
    {
      name: 'color',
      type: 'select',
      required: true,
      defaultValue: 'grape',
      label: L('ფერი', 'Цвет', 'Colour'),
      options: ACCENTS.map((c) => ({ value: c, label: c })),
      admin: { description: L('კატეგორიის „სამყაროს“ ფერი საიტზე', 'Цвет «мира» категории на сайте', 'Colour of the category “world” on the site') },
    },
    { name: 'icon', type: 'text', label: L('იკონა', 'Иконка', 'Icon'), admin: { description: L('ილუსტრაციის სახელი (rocket, teddy, blocks, car, duck…)', 'Имя иллюстрации', 'Illustration key') } },
    { name: 'parent', type: 'relationship', relationTo: 'categories', label: L('მშობელი კატეგორია', 'Родительская категория', 'Parent') },
    { name: 'order', type: 'number', defaultValue: 0, label: L('რიგითობა', 'Порядок', 'Order'), admin: { position: 'sidebar' } },
    slugField(),
  ],
}

import type { CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { L } from '../lib/labels'
import { slugField } from '../fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: L('თეგი', 'Тег', 'Tag'), plural: L('თეგები', 'Теги', 'Tags') },
  admin: { useAsTitle: 'title', group: L('კატალოგი', 'Каталог', 'Catalogue') },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true, label: L('სახელი', 'Название', 'Title') },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'theme',
      label: L('ტიპი', 'Тип', 'Kind'),
      options: [
        { value: 'theme', label: L('თემა', 'Тема', 'Theme') },
        { value: 'skill', label: L('უნარი', 'Навык', 'Skill') },
        { value: 'occasion', label: L('შემთხვევა', 'Повод', 'Occasion') },
      ],
    },
    slugField(),
  ],
}

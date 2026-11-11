import type { CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { L } from '../lib/labels'

/**
 * Photos. Sizes follow docs/08 §4: card 600² (1:1), large 1600, thumb 200 — all WebP.
 * TODO(S1): move resizing to the admin's browser before upload to save server compute on the free tier.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: L('ფოტო', 'Фото', 'Photo'), plural: L('ფოტოები', 'Фото', 'Photos') },
  admin: { group: L('კატალოგი', 'Каталог', 'Catalogue') },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      label: L('აღწერა (alt)', 'Описание (alt)', 'Alt text'),
      admin: { description: L('რა ჩანს ფოტოზე — უსინათლო მომხმარებლებისთვის და Google-ისთვის', 'Что на фото — для незрячих и для Google', 'What the photo shows — for screen readers and search') },
    },
  ],
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    crop: true,
    formatOptions: { format: 'webp', options: { quality: 82 } },
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    imageSizes: [
      { name: 'thumb', width: 200, height: 200, position: 'centre', formatOptions: { format: 'webp', options: { quality: 75 } } },
      { name: 'card', width: 600, height: 600, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1600, withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumb',
  },
}

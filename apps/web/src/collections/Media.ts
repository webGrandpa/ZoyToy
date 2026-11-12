import type { CollectionBeforeOperationHook, CollectionConfig } from 'payload'
import { anyone, isTeam } from '../lib/access'
import { BACKDROP_LABEL, BACKDROPS, SCENE_LABEL, SCENES } from '../lib/backdrop'
import { inspectCutout } from '../lib/cutout'
import { L } from '../lib/labels'
import { GROUP } from '../lib/groups'
import { listFilters } from '../lib/listFilters'

/**
 * A new file: a photo with its background removed is marked as a cut-out (it then stands on the chosen
 * backdrop on the site) and cropped to the toy before the sizes are made. Runs before Payload's own
 * image processing, which reads req.file — also for client uploads straight to Blob, which Payload
 * fetches back into req.file first.
 */
const markCutout: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if (operation !== 'create' && operation !== 'update') return args
  const set = (cutout: boolean) => ({ ...args, data: { ...(args.data as Record<string, unknown> | undefined), cutout } }) as unknown as typeof args
  const file = req.file
  const source = file?.data?.length ? file.data : file?.tempFilePath
  if (!file || !source || !/^image\/(png|webp|avif)$/.test(file.mimetype ?? '')) {
    return file ? set(false) : args
  }
  const look = await inspectCutout(source).catch(() => ({ cutout: false as const }))
  if (look.cutout && look.trimmed) {
    file.data = look.trimmed
    file.size = look.trimmed.length
    file.mimetype = 'image/png'
    delete file.tempFilePath
  }
  return set(look.cutout)
}

/**
 * Photos. Sizes follow docs/08 §4: card 600² (1:1), large 1600, thumb 200 — all WebP.
 * TODO(S1): move resizing to the admin's browser before upload to save server compute on the free tier.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: L('ფოტო', 'Фото', 'Photo'), plural: L('ფოტოები', 'Фото', 'Photos') },
  admin: { group: GROUP.catalogue, components: listFilters('media') },
  access: { read: anyone, create: isTeam, update: isTeam, delete: isTeam },
  // payload.config wraps Media in withRefresh: a new backdrop or photo shows on cached pages right away
  hooks: { beforeOperation: [markCutout] },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      label: L('აღწერა (alt)', 'Описание (alt)', 'Alt text'),
      admin: { description: L('რა ჩანს ფოტოზე — უსინათლო მომხმარებლებისთვის და Google-ისთვის', 'Что на фото — для незрячих и для Google', 'What the photo shows — for screen readers and search') },
    },
    // backdrop for a cut-out (background removed): picked on swatches with a preview (components/admin/BackdropPicker.tsx)
    {
      name: 'backdrop',
      type: 'select',
      defaultValue: 'auto',
      label: L('ფონი საიტზე', 'Фон на сайте', 'Backdrop on the site'),
      options: BACKDROPS.map((value) => ({ value, label: BACKDROP_LABEL[value] })),
      admin: { components: { Field: '/components/admin/BackdropPicker#BackdropPicker' } },
    },
    { name: 'scene', type: 'select', defaultValue: 'halo', label: L('ფონის ნახატი', 'Рисунок фона', 'Backdrop scene'), options: SCENES.map((value) => ({ value, label: SCENE_LABEL[value] })), admin: { hidden: true } },
    // set by the upload hook: the file has a transparent background
    { name: 'cutout', type: 'checkbox', defaultValue: false, label: L('ფონი მოშორებულია', 'Фон удалён', 'Background removed'), admin: { hidden: true } },
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
      // a cut-out's own shape, no square padding — on the site it can stand on the drawn hill (lib/backdrop.ts)
      { name: 'tile', width: 600, height: 600, fit: 'inside', withoutEnlargement: true, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    // the square thumb is a centre crop; a cut-out toy shows whole (the card size is fitted, not cropped)
    adminThumbnail: ({ doc }) => {
      const d = doc as { cutout?: boolean; url?: string; sizes?: { thumb?: { url?: string }; card?: { url?: string } } }
      return (d.cutout ? d.sizes?.card?.url : d.sizes?.thumb?.url) ?? d.url ?? false
    },
  },
}

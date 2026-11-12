/**
 * Backdrops for toy photos whose background was removed (docs/05 §11, docs/10 §6). Such a “cut-out” stands
 * on a drawn scene in the brand palette — a pastel tint, a soft light circle and a hill — so the shop's
 * own photos sit in the same playroom as the illustrations. A photo that keeps its background is shown
 * as it is. Shared by the admin picker, the storefront and the Telegram card; no server-only imports.
 */

export const ACCENTS = ['sun', 'bubble', 'mint', 'sky', 'grape', 'tangerine'] as const
export type AccentName = (typeof ACCENTS)[number]

/** `auto` = the colour of the item's first category, like the cards without a photo. */
export const BACKDROPS = ['auto', ...ACCENTS] as const
export type Backdrop = (typeof BACKDROPS)[number]

export const SCENES = ['halo', 'stars', 'plain'] as const
export type Scene = (typeof SCENES)[number]

/** A cut-out photo's look; null for a photo that keeps its own background. */
export type Cut = { bd: Backdrop; sc: Scene }

type L3 = { ka: string; ru: string; en: string }

export const BACKDROP_LABEL: Record<Backdrop, L3> = {
  auto: { ka: 'კატეგორიის ფერი', ru: 'Цвет категории', en: 'Category colour' },
  sun: { ka: 'მზე', ru: 'Солнце', en: 'Sun' },
  bubble: { ka: 'ვარდი', ru: 'Роза', en: 'Rose' },
  mint: { ka: 'პიტნა', ru: 'Мята', en: 'Mint' },
  sky: { ka: 'ცა', ru: 'Небо', en: 'Sky' },
  grape: { ka: 'იასამანი', ru: 'Сирень', en: 'Lilac' },
  tangerine: { ka: 'მანდარინი', ru: 'Мандарин', en: 'Tangerine' },
}

export const SCENE_LABEL: Record<Scene, L3> = {
  halo: { ka: 'წრე და გორაკი', ru: 'Круг и холм', en: 'Circle & hill' },
  stars: { ka: 'ვარსკვლავები', ru: 'Звёздочки', en: 'Stars' },
  plain: { ka: 'სადა', ru: 'Просто цвет', en: 'Plain' },
}

/** The light-theme brand colours (packages/ui/src/tokens.css). */
export const ACCENT_HEX: Record<AccentName, string> = {
  sun: '#FFC83D',
  bubble: '#FF5C93',
  mint: '#3DDBB0',
  sky: '#3EC5FF',
  grape: '#6B4EFF',
  tangerine: '#FF8A3D',
}

const isAccent = (v: unknown): v is AccentName => typeof v === 'string' && (ACCENTS as readonly string[]).includes(v)

/** Mix a colour with white: share = how much of the colour stays (0…1). Same as the site's color-mix(). */
export function soften(hex: string, share: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (shift: number) => Math.round(255 - (255 - ((n >> shift) & 255)) * share)
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`
}

/** The tint a photo stands on: its own backdrop, else the item's category colour. */
export function tintOf(cut: Cut | null | undefined, color: string | null | undefined): AccentName {
  if (cut && cut.bd !== 'auto') return cut.bd
  return isAccent(color) ? color : 'sun'
}

/**
 * Class names for the box a product photo sits in. A plain photo keeps the category tint; a cut-out
 * gets its backdrop and, where the box has room for it (`scene`), the drawn scene.
 */
export function stage(cut: Cut | null | undefined, color: string, scene = true) {
  if (!cut) return `tint-${color}`
  return `tint-${tintOf(cut, color)} is-cut${scene ? ` sc-${cut.sc}` : ''}`
}

/** Reads the stored fields of a photo (Media) into a Cut, tolerating old rows without them. */
export function cutOf(media: { cutout?: boolean | null; backdrop?: string | null; scene?: string | null } | null | undefined): Cut | null {
  if (!media?.cutout) return null
  const bd = (BACKDROPS as readonly string[]).includes(media.backdrop ?? '') ? (media.backdrop as Backdrop) : 'auto'
  const sc = (SCENES as readonly string[]).includes(media.scene ?? '') ? (media.scene as Scene) : 'halo'
  return { bd, sc }
}

/** Share of see-through pixels from which a photo counts as a cut-out (a few rounded corners do not). */
export const CUTOUT_MIN_CLEAR = 0.04

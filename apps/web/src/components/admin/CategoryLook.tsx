'use client'

import type { CSSProperties } from 'react'
import { useField, useFormFields, useTranslation } from '@payloadcms/ui'
import { BOUQUETS, HERO, THEMES, THEME_ICON, THEME_LABEL, themeFor, type Theme } from '../home/Bouquet'
import { ACCENT_HEX, ACCENTS, BACKDROP_LABEL, type AccentName } from '../../lib/backdrop'
import { asLang, type Lang } from '../../lib/telegram/templates'
import type { ToyKind } from '@zoytoy/ui/ToyArt'

const UI: Record<Lang, { pictures: string; picturesHint: string; color: string; preview: string; previewHint: string }> = {
  ka: { pictures: 'სურათი მთავარ გვერდზე', picturesHint: 'ყუთიდან ეს სათამაშო იჭყიტება, მაუსის მიტანისას კი ექვსივე „თაიგულად“ ამოდის.', color: 'ფერი', preview: 'ასე გამოჩნდება', previewHint: 'კატეგორიის ყუთი მთავარ გვერდზე' },
  ru: { pictures: 'Картинка на главной', picturesHint: 'Эта игрушка выглядывает из коробки, при наведении все шесть раскрываются «букетом».', color: 'Цвет', preview: 'Так будет видно', previewHint: 'Коробка категории на главной' },
  en: { pictures: 'Picture on the home page', picturesHint: 'This toy peeks out of the box; on hover all six burst out like a bouquet.', color: 'Colour', preview: 'How it looks', previewHint: 'The category box on the home page' },
}

// the storefront's light palette, so the drawings show their colours inside the admin too
const PALETTE = {
  '--zt-edge': '#1F1A3D',
  '--zt-sun': ACCENT_HEX.sun,
  '--zt-bubble': ACCENT_HEX.bubble,
  '--zt-sky': ACCENT_HEX.sky,
  '--zt-mint': ACCENT_HEX.mint,
  '--zt-tangerine': ACCENT_HEX.tangerine,
  '--zt-grape': ACCENT_HEX.grape,
} as CSSProperties

/**
 * Category form: the picture group (8 kinds of toys, each shown with its own drawings) and the colour,
 * on tiles and swatches instead of a text box and colour codes, with the home-page box as a preview.
 * Sets the hidden `icon` too — product cards without a photo still draw that toy.
 */
export function CategoryLook({ path = 'theme' }: { path?: string }) {
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const ui = UI[lang]
  const { value: themeValue, setValue: setTheme } = useField<string>({ path })
  const { value: colorValue, setValue: setColor } = useField<string>({ path: 'color' })
  const { setValue: setIcon } = useField<string>({ path: 'icon' })
  const slug = useFormFields(([f]) => String(f.slug?.value ?? ''))
  const icon = useFormFields(([f]) => String(f.icon?.value ?? 'blocks'))
  const title = useFormFields(([f]) => String(f.title?.value ?? ''))

  // older categories have no theme saved: show what the site picks for them today
  const theme: Theme = (THEMES as readonly string[]).includes(themeValue ?? '') ? (themeValue as Theme) : themeFor(slug, icon as ToyKind)
  const color: AccentName = (ACCENTS as readonly string[]).includes(colorValue ?? '') ? (colorValue as AccentName) : 'grape'
  const Hero = HERO[theme]

  return (
    <div className="zt-cat" style={PALETTE}>
      <div className="zt-cat__pick">
        <p className="zt-cat__title">{ui.pictures}</p>
        <p className="zt-cat__hint">{ui.picturesHint}</p>
        <div className="zt-cat__themes" role="radiogroup" aria-label={ui.pictures}>
          {THEMES.map((t) => {
            const Big = HERO[t]
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={theme === t}
                className="zt-cat__theme"
                onClick={() => {
                  setTheme(t)
                  setIcon(THEME_ICON[t])
                }}
              >
                <span className="zt-cat__hero">
                  <Big />
                </span>
                <span className="zt-cat__row" aria-hidden="true">
                  {BOUQUETS[t].slice(0, 4).map((Art, i) => (
                    <span key={i}>
                      <Art />
                    </span>
                  ))}
                </span>
                <b>{THEME_LABEL[t][lang]}</b>
              </button>
            )
          })}
        </div>
        <p className="zt-cat__title">{ui.color}</p>
        <div className="zt-cat__colors" role="radiogroup" aria-label={ui.color}>
          {ACCENTS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} className="zt-cat__color" onClick={() => setColor(c)}>
              <span style={{ background: ACCENT_HEX[c] }} />
              {BACKDROP_LABEL[c][lang]}
            </button>
          ))}
        </div>
      </div>
      <div className="zt-cat__preview">
        <p className="zt-cat__title">{ui.preview}</p>
        <div className="zt-catbox" style={{ ['--tint' as string]: ACCENT_HEX[color] }}>
          <span className="zt-catbox__lid" />
          <span className="zt-catbox__toy">
            <Hero />
          </span>
          <span className="zt-catbox__front">
            <b>{title || '…'}</b>
          </span>
        </div>
        <p className="zt-cat__hint">{ui.previewHint}</p>
      </div>
    </div>
  )
}

/** Categories list: the box picture and colour at a glance. */
export function CategoryLookCell({ rowData }: { rowData?: { theme?: string | null; slug?: string | null; icon?: string | null; color?: string | null } }) {
  const theme: Theme = (THEMES as readonly string[]).includes(rowData?.theme ?? '') ? (rowData?.theme as Theme) : themeFor(rowData?.slug ?? '', (rowData?.icon ?? 'blocks') as ToyKind)
  const color = (ACCENTS as readonly string[]).includes(rowData?.color ?? '') ? (rowData?.color as AccentName) : 'grape'
  const Hero = HERO[theme]
  return (
    <span className="zt-catcell" style={{ ...PALETTE, background: ACCENT_HEX[color] }}>
      <Hero />
    </span>
  )
}

'use client'

import { useState, type CSSProperties } from 'react'
import { useField, useFormFields, useTranslation } from '@payloadcms/ui'
import { boxLook, FIGURE_KEYS, FIGURES, isFigure, THEME_ICON, THEME_LABEL, THEME_SET, THEMES, themeFor, type FigureKey, type Theme } from '../home/Bouquet'
import { ACCENT_HEX, ACCENTS, BACKDROP_LABEL, type AccentName } from '../../lib/backdrop'
import { asLang, type Lang } from '../../lib/telegram/templates'
import type { ToyKind } from '@zoytoy/ui/ToyArt'

const MAX = 6

const UI: Record<Lang, Record<string, string>> = {
  ka: {
    sets: 'მზა ნაკრები',
    setsHint: 'ერთი დაჭერით ავსებს ყუთს და თაიგულს — მერე ნებისმიერი სათამაშო შეგიძლია შეცვალო.',
    pick: 'სათამაშოები სათითაოდ',
    hero: '🎁 ყუთიდან იჭყიტება',
    bouquet: '💐 თაიგული',
    heroHint: 'აირჩიე ერთი — ის ყუთიდან იჭყიტება.',
    bouquetHint: 'მონიშნე 6-მდე — მაუსის მიტანისას ყუთიდან ამოდის. რიგი = დაჭერის რიგი.',
    full: 'თაიგულში უკვე 6-ია — ჯერ რომელიმე მოხსენი.',
    clear: 'თაიგულის გასუფთავება',
    color: 'ფერი',
    preview: 'ასე გამოჩნდება',
    previewHint: 'კატეგორიის ყუთი მთავარ გვერდზე',
  },
  ru: {
    sets: 'Готовые наборы',
    setsHint: 'Одним нажатием заполняет коробку и букет — потом любую игрушку можно заменить.',
    pick: 'Игрушки по одной',
    hero: '🎁 Выглядывает из коробки',
    bouquet: '💐 Букет',
    heroHint: 'Выберите одну — она выглядывает из коробки.',
    bouquetHint: 'Отметьте до 6 — при наведении они вылетают из коробки. Порядок = порядок нажатий.',
    full: 'В букете уже 6 — сначала уберите одну.',
    clear: 'Очистить букет',
    color: 'Цвет',
    preview: 'Так будет видно',
    previewHint: 'Коробка категории на главной',
  },
  en: {
    sets: 'Ready-made sets',
    setsHint: 'One tap fills the box and the bouquet — then swap any toy you like.',
    pick: 'Toys one by one',
    hero: '🎁 Peeks out of the box',
    bouquet: '💐 Bouquet',
    heroHint: 'Pick one — it peeks out of the box.',
    bouquetHint: 'Tick up to 6 — they burst out on hover. Order = the order you tap them.',
    full: 'The bouquet already has 6 — remove one first.',
    clear: 'Clear the bouquet',
    color: 'Colour',
    preview: 'How it looks',
    previewHint: 'The category box on the home page',
  },
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

const FAN = [-50, -25, 0, 25, 50, 0]

/**
 * Category form: the home-page box put together toy by toy — any of the 49 drawings peeks out of the
 * box, any six make its bouquet (owner, 2026-11-19); a ready-made set fills both in one tap. Colour on
 * swatches, the box itself as a live preview. Also keeps the hidden `icon` (cards without a photo).
 */
export function CategoryLook({ path = 'theme' }: { path?: string }) {
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const ui = UI[lang]
  const { value: themeValue, setValue: setTheme } = useField<string>({ path })
  const { value: colorValue, setValue: setColor } = useField<string>({ path: 'color' })
  const { setValue: setIcon } = useField<string>({ path: 'icon' })
  const { value: heroValue, setValue: setHero } = useField<string>({ path: 'heroFigure' })
  const { value: figuresValue, setValue: setFigures } = useField<string[]>({ path: 'figures' })
  const slug = useFormFields(([f]) => String(f.slug?.value ?? ''))
  const icon = useFormFields(([f]) => String(f.icon?.value ?? 'blocks'))
  const title = useFormFields(([f]) => String(f.title?.value ?? ''))
  const [mode, setMode] = useState<'hero' | 'bouquet'>('hero')
  const [warn, setWarn] = useState(false)

  const theme: Theme = themeFor(slug, icon as ToyKind, themeValue)
  const color: AccentName = (ACCENTS as readonly string[]).includes(colorValue ?? '') ? (colorValue as AccentName) : 'grape'
  const own = (Array.isArray(figuresValue) ? figuresValue : []).filter(isFigure)
  const hero: FigureKey = isFigure(heroValue) ? heroValue : THEME_SET[theme].hero
  const bouquet: FigureKey[] = own.length ? own : THEME_SET[theme].bouquet
  const { Hero, Bouquet } = boxLook(theme, hero, bouquet)

  const applySet = (t: Theme) => {
    setTheme(t)
    setIcon(THEME_ICON[t])
    setHero(THEME_SET[t].hero)
    setFigures([...THEME_SET[t].bouquet])
    setWarn(false)
  }
  const pickHero = (k: FigureKey) => {
    setHero(k)
    // cards without a photo draw the category's icon: follow the box when it is one of those toys
    const asIcon = ({ teddy: 'teddy', blocks: 'blocks', car: 'car', duck: 'duck', ball: 'ball', train: 'train', puzzle: 'puzzle', rocket: 'rocket' } as Record<string, string>)[k]
    if (asIcon) setIcon(asIcon)
  }
  const toggle = (k: FigureKey) => {
    const cur = own.length ? own : [...THEME_SET[theme].bouquet]
    if (cur.includes(k)) {
      setFigures(cur.filter((x) => x !== k))
      setWarn(false)
    } else if (cur.length >= MAX) setWarn(true)
    else setFigures([...cur, k])
  }

  return (
    <div className="zt-cat" style={PALETTE}>
      <div className="zt-cat__pick">
        <p className="zt-cat__title">{ui.sets}</p>
        <p className="zt-cat__hint">{ui.setsHint}</p>
        <div className="zt-cat__sets">
          {THEMES.map((t) => {
            const Big = FIGURES[THEME_SET[t].hero].Art
            return (
              <button key={t} type="button" className="zt-cat__set" aria-pressed={themeValue === t} onClick={() => applySet(t)}>
                <span>
                  <Big />
                </span>
                {THEME_LABEL[t][lang]}
              </button>
            )
          })}
        </div>

        <p className="zt-cat__title">{ui.pick}</p>
        <div className="zt-cat__modes" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'hero'} onClick={() => setMode('hero')}>
            {ui.hero}
          </button>
          <button type="button" role="tab" aria-selected={mode === 'bouquet'} onClick={() => setMode('bouquet')}>
            {ui.bouquet} <em>{bouquet.length}/{MAX}</em>
          </button>
        </div>
        <p className={`zt-cat__hint${warn && mode === 'bouquet' ? ' zt-cat__hint--warn' : ''}`}>{warn && mode === 'bouquet' ? ui.full : mode === 'hero' ? ui.heroHint : ui.bouquetHint}</p>
        {mode === 'bouquet' ? (
          <div className="zt-cat__chosen">
            {bouquet.map((k, i) => {
              const Small = FIGURES[k].Art
              return (
                <button key={k} type="button" title={FIGURES[k].name[lang]} onClick={() => toggle(k)}>
                  <i>{i + 1}</i>
                  <Small />
                  <b aria-hidden="true">✕</b>
                </button>
              )
            })}
            {own.length ? (
              <button type="button" className="zt-cat__clear" onClick={() => setFigures([])}>
                {ui.clear}
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="zt-cat__figs" role={mode === 'hero' ? 'radiogroup' : 'group'} aria-label={mode === 'hero' ? ui.hero : ui.bouquet}>
          {THEMES.map((t) => (
            <div key={t} className="zt-cat__figgroup">
              <small>{THEME_LABEL[t][lang]}</small>
              <div>
                {FIGURE_KEYS.filter((k) => FIGURES[k].theme === t).map((k) => {
                  const Fig = FIGURES[k].Art
                  const on = mode === 'hero' ? hero === k : bouquet.includes(k)
                  const order = mode === 'bouquet' && on ? bouquet.indexOf(k) + 1 : null
                  return (
                    <button
                      key={k}
                      type="button"
                      role={mode === 'hero' ? 'radio' : undefined}
                      aria-checked={mode === 'hero' ? on : undefined}
                      aria-pressed={mode === 'bouquet' ? on : undefined}
                      className="zt-cat__fig"
                      title={FIGURES[k].name[lang]}
                      onClick={() => (mode === 'hero' ? pickHero(k) : toggle(k))}
                    >
                      {order ? <i>{order}</i> : null}
                      <Fig />
                      <span>{FIGURES[k].name[lang]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
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
          <span className="zt-catbox__fan" aria-hidden="true">
            {Bouquet.map((Art, i) => (
              <span key={i} style={{ ['--a' as string]: `${FAN[i] ?? 0}deg`, ['--j' as string]: i }}>
                <Art />
              </span>
            ))}
          </span>
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

/** Categories list: the box's toy and colour at a glance. */
export function CategoryLookCell({ rowData }: { rowData?: { theme?: string | null; slug?: string | null; icon?: string | null; color?: string | null; heroFigure?: string | null } }) {
  const theme = themeFor(rowData?.slug ?? '', (rowData?.icon ?? 'blocks') as ToyKind, rowData?.theme)
  const { Hero } = boxLook(theme, rowData?.heroFigure)
  const color = (ACCENTS as readonly string[]).includes(rowData?.color ?? '') ? (rowData?.color as AccentName) : 'grape'
  return (
    <span className="zt-catcell" style={{ ...PALETTE, background: ACCENT_HEX[color] }}>
      <Hero />
    </span>
  )
}

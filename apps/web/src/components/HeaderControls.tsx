'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_NAMES, type Locale } from '../i18n/config'
import { IconCart, IconMoon, IconSoundOff, IconSoundOn, IconSunSmall } from './Icons'
import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useI18n, useShop } from './Providers'

const SHORT: Record<Locale, string> = { ka: 'ქარ', ru: 'Рус', en: 'Eng' }

export function LangSwitch() {
  const { locale, m } = useI18n()
  const path = usePathname() ?? `/${locale}`
  const rest = path.split('/').slice(2).join('/')
  return (
    <nav className="lang" aria-label={m.nav.language}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ''}`}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? 'true' : undefined}
          title={LOCALE_NAMES[l]}
          onClick={() => {
            document.cookie = `NEXT_LOCALE=${l}; path=/; max-age=31536000; samesite=lax`
          }}
        >
          {SHORT[l]}
        </Link>
      ))}
    </nav>
  )
}

export function SoundToggle() {
  const { m } = useI18n()
  const { sound, setSound, blip } = useShop()
  return (
    <button
      type="button"
      className="zt-icon-btn"
      aria-pressed={sound}
      aria-label={sound ? m.nav.soundOff : m.nav.soundOn}
      onClick={() => {
        setSound(!sound)
        setTimeout(() => blip(880, 0.1), 30)
      }}
    >
      {sound ? <IconSoundOn /> : <IconSoundOff />}
    </button>
  )
}

export function CartButton() {
  const { m, f } = useI18n()
  const { items, setCartOpen } = useShop()
  return (
    <button type="button" className="zt-icon-btn cart-btn" data-cart-target aria-label={f(m.cart.count, { n: items.length })} onClick={() => setCartOpen(true)}>
      <IconCart />
      <span className="cart-count" aria-hidden="true">{items.length}</span>
    </button>
  )
}

/**
 * Day (default, sunny) ↔ night playroom. Saved per visitor.
 * Where the browser supports View Transitions, the new theme is revealed by a circle growing out of
 * this button (home.css `theme-reveal`); meanwhile the sun folds its rays and becomes a sleepy moon.
 */
export function ThemeToggle() {
  const { m } = useI18n()
  const { blip } = useShop()
  const [dark, setDark] = useState(false)
  useEffect(() => setDark(document.documentElement.dataset.theme === 'dark'), [])
  const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = !dark
    const root = document.documentElement
    const apply = () => {
      flushSync(() => setDark(next))
      if (next) root.dataset.theme = 'dark'
      else delete root.dataset.theme
    }
    try {
      localStorage.setItem('zt-theme', next ? 'dark' : 'light')
    } catch {
      /* private mode */
    }
    blip(next ? 420 : 760, 0.09)
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return apply()
    const r = e.currentTarget.getBoundingClientRect()
    root.style.setProperty('--vt-x', `${Math.round(r.left + r.width / 2)}px`)
    root.style.setProperty('--vt-y', `${Math.round(r.top + r.height / 2)}px`)
    root.classList.add('vt-theme')
    doc.startViewTransition(apply).finished.finally(() => root.classList.remove('vt-theme'))
  }
  return (
    <button type="button" className="zt-icon-btn theme-btn" aria-pressed={dark} aria-label={dark ? m.theme.light : m.theme.dark} title={dark ? m.theme.light : m.theme.dark} onClick={toggle}>
      {dark ? <IconSunSmall /> : <IconMoon />}
    </button>
  )
}

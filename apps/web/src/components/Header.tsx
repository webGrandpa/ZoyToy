import Link from 'next/link'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import type { Locale } from '../i18n/config'
import type { Messages } from '../i18n'
import { CartButton, LangSwitch, SoundToggle, ThemeToggle } from './HeaderControls'
import { NavLinks } from './NavLinks'
import { IconChat, IconGame, IconGrid, IconKey } from './Icons'

export function Header({ locale, m, announcement }: { locale: Locale; m: Messages; announcement?: string | null }) {
  return (
    <>
      {announcement ? <div className="announce">{announcement}</div> : null}
      <header className="top">
        <div className="wrap top-row">
          <Link href={`/${locale}`} className="logo" aria-label="Zoy Toy">
            <GiraffeHead className="logo-mark" />
            <span>
              Zoy Toy<small>{locale === 'ka' ? 'ზოი თოი · ბათუმი' : locale === 'ru' ? 'Зои Той · Батуми' : 'Batumi'}</small>
            </span>
          </Link>
          <NavLinks
            label={m.a11y.menu}
            items={[
              { href: `/${locale}/shop`, match: `/${locale}/shop`, label: m.nav.shop, color: 'var(--zt-sun)', icon: <IconGrid /> },
              { href: `/${locale}/rent`, match: `/${locale}/rent`, label: m.nav.rent, color: 'var(--zt-sky)', icon: <IconKey /> },
              { href: `/${locale}/play`, match: `/${locale}/play`, label: m.nav.play, color: 'var(--zt-mint)', icon: <IconGame /> },
              { href: `/${locale}/contact`, match: `/${locale}/contact`, label: m.nav.contact, color: 'var(--zt-bubble)', icon: <IconChat /> },
            ]}
          />
          <div className="top-actions">
            <LangSwitch />
            <SoundToggle />
            <ThemeToggle />
            <CartButton />
          </div>
        </div>
      </header>
    </>
  )
}

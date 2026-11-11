'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCart, IconChat, IconGame, IconGrid, IconHome } from './Icons'
import { useI18n, useShop } from './Providers'

/** Mobile bottom navigation with the raised yellow "Play" button in the centre (docs/05 §8). */
export function TabBar() {
  const { locale, m } = useI18n()
  const { items, setCartOpen } = useShop()
  const path = usePathname() ?? ''
  const is = (p: string) => (p === `/${locale}` ? path === p : path.startsWith(p))
  return (
    <nav className="tabbar" aria-label={m.a11y.menu}>
      <Link href={`/${locale}`} aria-current={is(`/${locale}`) ? 'page' : undefined}><IconHome /><span>{m.nav.home}</span></Link>
      <Link href={`/${locale}/shop`} aria-current={is(`/${locale}/shop`) ? 'page' : undefined}><IconGrid /><span>{m.nav.shop}</span></Link>
      <Link href={`/${locale}/play`} className="tab-play" aria-current={is(`/${locale}/play`) ? 'page' : undefined}><b className="play-bubble"><IconGame /></b><span>{m.nav.play}</span></Link>
      <button type="button" className="tab-cart" onClick={() => setCartOpen(true)}><IconCart /><span>{m.nav.cart}</span>{items.length ? <b className="tab-count">{items.length}</b> : null}</button>
      <Link href={`/${locale}/contact`} aria-current={is(`/${locale}/contact`) ? 'page' : undefined}><IconChat /><span>{m.nav.contact}</span></Link>
    </nav>
  )
}

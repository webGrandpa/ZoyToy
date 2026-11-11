'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconChat, IconGame, IconGrid, IconHome, IconKey } from './Icons'
import { useI18n } from './Providers'

/**
 * Mobile bottom navigation with the raised yellow "Play" button in the centre (docs/05 §8). The cart
 * (with its counter) lives in the header, so the bar has room for Rent.
 */
export function TabBar() {
  const { locale, m } = useI18n()
  const path = usePathname() ?? ''
  const is = (p: string) => (p === `/${locale}` ? path === p : path.startsWith(p))
  return (
    <nav className="tabbar" aria-label={m.a11y.menu}>
      <Link href={`/${locale}`} aria-current={is(`/${locale}`) ? 'page' : undefined}><IconHome /><span>{m.nav.home}</span></Link>
      <Link href={`/${locale}/shop`} aria-current={is(`/${locale}/shop`) ? 'page' : undefined}><IconGrid /><span>{m.nav.shop}</span></Link>
      <Link href={`/${locale}/play`} className="tab-play" aria-current={is(`/${locale}/play`) ? 'page' : undefined}><b className="play-bubble"><IconGame /></b><span>{m.nav.play}</span></Link>
      <Link href={`/${locale}/rent`} aria-current={is(`/${locale}/rent`) ? 'page' : undefined}><IconKey /><span>{m.nav.rent}</span></Link>
      <Link href={`/${locale}/contact`} aria-current={is(`/${locale}/contact`) ? 'page' : undefined}><IconChat /><span>{m.nav.contact}</span></Link>
    </nav>
  )
}

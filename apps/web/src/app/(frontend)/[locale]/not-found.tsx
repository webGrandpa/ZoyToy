'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { isLocale } from '../../../i18n/config'
import { getMessages } from '../../../i18n'
import { Balloons } from '../../../components/Balloons'

/** Unknown product or page inside a locale — Zoy looks for it. */
export default function NotFound() {
  const seg = usePathname()?.split('/')[1]
  const locale = isLocale(seg) ? seg : 'ka'
  const m = getMessages(locale)
  return (
    <section className="sec">
      <div className="wrap">
        <div className="empty zt-sticker">
          <GiraffeHead className="empty-art" />
          <h1>{m.notFound.title}</h1>
          <p>{m.notFound.text}</p>
          <Balloons />
          <div className="hero-ctas center">
            <Link className="zt-btn" href={`/${locale}/shop`}>{m.notFound.shop}</Link>
            <Link className="zt-btn zt-btn--secondary" href={`/${locale}`}>{m.notFound.home}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}

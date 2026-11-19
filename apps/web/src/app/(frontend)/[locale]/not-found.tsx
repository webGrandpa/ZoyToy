'use client'

import Link from 'next/link'
import { useI18n } from '../../../components/Providers'
import { Balloons } from '../../../components/Balloons'
import { ZoyPeek } from '../../../components/ZoyPeek'

/** Unknown product or page inside a locale — Zoy looks for it. */
export default function NotFound() {
  // the layout's provider already holds this language's texts — no need to ship all three dictionaries
  const { locale, m } = useI18n()
  return (
    <section className="sec">
      <div className="wrap">
        <div className="empty zt-sticker">
          <ZoyPeek className="empty-art" />
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

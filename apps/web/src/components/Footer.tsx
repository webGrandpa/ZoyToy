import Link from 'next/link'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import type { Locale } from '../i18n/config'
import { fmt, type Messages } from '../i18n'
import type { Location, SiteSetting } from '../payload-types'
import { contactLinks } from '../lib/contact'
import { Wave } from './home/Decor'

export function Footer({ locale, m, settings, location }: { locale: Locale; m: Messages; settings: SiteSetting; location: Location | null }) {
  const c = contactLinks(settings)
  return (
    <footer className="foot-site">
      <div className="foot-peek" aria-hidden="true"><GiraffeHead className="foot-peek-head" /></div>
      <div className="foot-wave" aria-hidden="true"><Wave color="var(--zt-night)" /></div>
      <span className="foot-paw l" aria-hidden="true" />
      <span className="foot-paw r" aria-hidden="true" />
      <div className="wrap foot-grid">
        <div className="foot-brand">
          <GiraffeHead className="foot-mark" />
          <p><b>Zoy Toy</b> — {m.footer.tagline}</p>
          {location ? (
            <p className="muted">
              {location.address ? `${location.address}, ` : ''}{location.city}
              {location.hours || settings.hours ? <><br />{m.contact.hours}: {location.hours || settings.hours}</> : null}
            </p>
          ) : null}
        </div>
        <div>
          <h3>{m.footer.shop}</h3>
          <ul>
            <li><Link href={`/${locale}/shop`}>{m.nav.shop}</Link></li>
            <li><Link href={`/${locale}/rent`}>{m.nav.rent}</Link></li>
            <li><Link href={`/${locale}/play`}>{m.nav.play}</Link></li>
          </ul>
        </div>
        <div>
          <h3>{m.footer.help}</h3>
          <ul>
            <li><Link href={`/${locale}/rent`}>{m.footer.howRent}</Link></li>
            <li><Link href={`/${locale}#contact`}>{m.footer.delivery}</Link></li>
          </ul>
        </div>
        <div>
          <h3>{m.contact.eyebrow}</h3>
          <ul>
            <li><a href={c.whatsapp} target="_blank" rel="noopener">WhatsApp</a></li>
            {c.telegram ? <li><a href={c.telegram} target="_blank" rel="noopener">Telegram</a></li> : null}
            <li><a href={c.instagram} target="_blank" rel="noopener">Instagram</a></li>
            {settings.phone ? <li><a href={c.phone ?? undefined}>{settings.phone}</a></li> : null}
          </ul>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>{fmt(locale, m.footer.rights, { year: new Date().getFullYear() })}</span>
      </div>
    </footer>
  )
}

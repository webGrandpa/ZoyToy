import type { Metadata } from 'next'
import { alternates } from '../../../../lib/seo'
import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'
import { ToyArt } from '@zoytoy/ui/ToyArt'
import { isLocale, type Locale } from '../../../../i18n/config'
import { getMessages } from '../../../../i18n'
import { getMainLocation, getSettings } from '../../../../lib/data'
import { allContacts, type Channel, type Social } from '../../../../lib/contact'
import { Wave } from '../../../../components/home/Decor'
import {
  IconClock,
  IconFacebook,
  IconInstagram,
  IconMail,
  IconPhone,
  IconPin,
  IconTelegram,
  IconTiktok,
  IconViber,
  IconWhatsapp,
  IconYoutube,
} from '../../../../components/Icons'

type Params = { params: Promise<{ locale: string }> }
type Icon = ComponentType<SVGProps<SVGSVGElement>>

const CHAT: Record<Channel['key'], { icon: Icon; tint: string; name?: string }> = {
  whatsapp: { icon: IconWhatsapp, tint: 'mint', name: 'WhatsApp' },
  telegram: { icon: IconTelegram, tint: 'sky', name: 'Telegram' },
  viber: { icon: IconViber, tint: 'grape', name: 'Viber' },
  phone: { icon: IconPhone, tint: 'sun' },
  email: { icon: IconMail, tint: 'tangerine' },
}
const SOCIAL: Record<Social['key'], { icon: Icon; tint: string; name: string }> = {
  instagram: { icon: IconInstagram, tint: 'bubble', name: 'Instagram' },
  facebook: { icon: IconFacebook, tint: 'sky', name: 'Facebook' },
  tiktok: { icon: IconTiktok, tint: 'grape', name: 'TikTok' },
  youtube: { icon: IconYoutube, tint: 'tangerine', name: 'YouTube' },
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params
  const l = isLocale(locale) ? locale : 'ka'
  const m = getMessages(l)
  return { title: m.contactPage.title, description: m.contactPage.description, alternates: alternates(l, '/contact') }
}

/** /contact — every channel the owner filled in (Admin → Site settings → Contacts), the shop and its hours. */
export default async function ContactPage({ params }: Params) {
  const { locale: l } = await params
  const locale = (isLocale(l) ? l : 'ka') as Locale
  const m = getMessages(locale)
  const t = m.contactPage
  const [settings, location] = await Promise.all([getSettings(locale), getMainLocation(locale)])
  const { chats, socials } = allContacts(settings)
  const action = (k: Channel['key']) => (k === 'phone' ? t.call : k === 'email' ? t.mail : t.write)
  const hours = location?.hours || settings.hours

  return (
    <>
      <section className="shop-hero tint-bubble contact-hero">
        <div className="wrap">
          <div>
            <p className="eyebrow">{m.contact.eyebrow}</p>
            <h1>{t.h1}</h1>
            <p className="lede">{t.lede}</p>
          </div>
          <div className="contact-hero-art" aria-hidden="true">
            <GiraffeHead className="contact-hero-zoy" />
            <span className="contact-hero-bubble"><i /><i /><i /></span>
          </div>
        </div>
        <div className="hill" aria-hidden="true"><Wave color="var(--zt-canvas)" /></div>
      </section>

      <section className="sec doodles" aria-labelledby="chats-title">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow">{t.chatsEyebrow}</p>
            <h2 id="chats-title">{t.chatsTitle}</h2>
          </div>
          <div className="ch-grid">
            {chats.map((c) => {
              const meta = CHAT[c.key]
              const Ic = meta.icon
              const external = c.key === 'whatsapp' || c.key === 'telegram'
              return (
                <a key={c.key} className={`ch-card tint-${meta.tint}`} href={c.href} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
                  <span className="ch-ic"><Ic /></span>
                  <b>{meta.name ?? (c.key === 'phone' ? t.phone : t.email)}</b>
                  {c.text ? <small>{c.text}</small> : null}
                  <span className="ch-go">{action(c.key)} →</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <section className="band band-sun" aria-labelledby="social-title">
        <Wave color="var(--band)" />
        <div className="wrap band-inner">
          <div className="sec-head center">
            <p className="eyebrow">{t.socialsEyebrow}</p>
            <h2 id="social-title">{t.socialsTitle}</h2>
            <p className="lede">{t.socialsLede}</p>
          </div>
          <div className="soc-grid">
            {socials.map((s) => {
              const meta = SOCIAL[s.key]
              const Ic = meta.icon
              return (
                <a key={s.key} className={`soc-tile tint-${meta.tint}`} href={s.href} target="_blank" rel="noopener">
                  <span className="soc-ic"><Ic /></span>
                  <b>{meta.name}</b>
                  <small>{s.text}</small>
                </a>
              )
            })}
          </div>
        </div>
        <Wave color="var(--band)" flip />
      </section>

      <section className="sec doodles dd-3" aria-labelledby="shop-title">
        <div className="wrap">
          <div className="visit">
            <div className="visit-copy">
              <p className="eyebrow">{t.shopEyebrow}</p>
              <h2 id="shop-title">{t.shopTitle}</h2>
              {location ? (
                <p className="visit-line"><IconPin /><span>{location.address ? `${location.address}, ` : ''}{location.city}</span></p>
              ) : null}
              {hours ? <p className="visit-line"><IconClock /><span>{m.contact.hours}: {hours}</span></p> : null}
              <p className="muted">{t.pickup}</p>
              <div className="visit-actions">
                {location?.mapUrl && /^https:\/\//.test(location.mapUrl) ? (
                  <a className="zt-btn" href={location.mapUrl} target="_blank" rel="noopener"><IconPin />{t.map}</a>
                ) : null}
                <Link className="zt-btn zt-btn--secondary" href={`/${locale}#contact`}>{t.faq}</Link>
              </div>
            </div>
            <div className="visit-art" aria-hidden="true">
              <ToyArt kind="teddy" className="va va1" />
              <ToyArt kind="train" className="va va2" />
              <ToyArt kind="ball" className="va va3" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

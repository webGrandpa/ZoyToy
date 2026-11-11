import type { SiteSetting } from '../payload-types'

type Contacts = Pick<SiteSetting, 'whatsapp' | 'telegram' | 'instagram' | 'phone'> &
  Partial<Pick<SiteSetting, 'viber' | 'email' | 'facebook' | 'tiktok' | 'youtube'>>

const handleOf = (v: string) => v.trim().replace(/^@/, '').replace(/\/+$/, '')
/** A full https link as typed, or the network's address for a bare handle. Other schemes are never used. */
const linkOf = (v: string, base: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `${base}${encodeURIComponent(handleOf(v))}`)
const digits = (v?: string | null) => v?.replace(/\D/g, '') ?? ''

/** Deep links for manual order handling (docs/08 §3). Without a configured number WhatsApp opens its share sheet. */
export function contactLinks(s: Contacts, text?: string) {
  const enc = text ? encodeURIComponent(text) : ''
  const wa = digits(s.whatsapp)
  return {
    whatsapp: wa ? `https://wa.me/${wa}${enc ? `?text=${enc}` : ''}` : `https://wa.me/${enc ? `?text=${enc}` : ''}`,
    telegram: s.telegram ? `https://t.me/${handleOf(s.telegram)}${enc ? `?text=${enc}` : ''}` : null,
    instagram: s.instagram?.trim() ? linkOf(s.instagram, 'https://www.instagram.com/') : 'https://www.instagram.com/zoy.toy/',
    phone: s.phone ? `tel:${s.phone.replace(/[^\d+]/g, '')}` : null,
  }
}

export type Channel = { key: 'whatsapp' | 'telegram' | 'viber' | 'phone' | 'email'; href: string; text: string }
export type Social = { key: 'instagram' | 'facebook' | 'tiktok' | 'youtube'; href: string; text: string }

/**
 * Every way to reach the shop that the owner filled in (Admin → Site settings → Contacts): chats and
 * calls first, then the social networks. Empty fields simply don't appear on the site.
 */
export function allContacts(s: Contacts) {
  const c = contactLinks(s)
  const wa = digits(s.whatsapp)
  const viber = digits(s.viber)
  const chats: Channel[] = [
    { key: 'whatsapp', href: c.whatsapp, text: wa ? `+${wa}` : '' },
    ...(c.telegram ? [{ key: 'telegram' as const, href: c.telegram, text: `@${handleOf(s.telegram!)}` }] : []),
    ...(viber ? [{ key: 'viber' as const, href: `viber://chat?number=%2B${viber}`, text: `+${viber}` }] : []),
    ...(c.phone ? [{ key: 'phone' as const, href: c.phone, text: s.phone!.trim() }] : []),
    ...(s.email?.trim() ? [{ key: 'email' as const, href: `mailto:${s.email.trim()}`, text: s.email.trim() }] : []),
  ]
  const socials: Social[] = []
  const add = (key: Social['key'], value: string | null | undefined, base: string, text = (v: string) => `@${handleOf(v).split('/').pop()}`) => {
    if (value?.trim()) socials.push({ key, href: linkOf(value, base), text: text(value) })
  }
  add('instagram', s.instagram || 'zoy.toy', 'https://www.instagram.com/')
  add('facebook', s.facebook, 'https://www.facebook.com/', (v) => handleOf(v).split('/').pop() || 'Facebook')
  add('tiktok', s.tiktok, 'https://www.tiktok.com/@')
  add('youtube', s.youtube, 'https://www.youtube.com/@')
  return { chats, socials }
}

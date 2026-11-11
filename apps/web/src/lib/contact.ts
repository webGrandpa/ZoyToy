import type { SiteSetting } from '../payload-types'

/** Deep links for manual order handling (docs/08 §3). Without a configured number WhatsApp opens its share sheet. */
export function contactLinks(s: Pick<SiteSetting, 'whatsapp' | 'telegram' | 'instagram' | 'phone'>, text?: string) {
  const enc = text ? encodeURIComponent(text) : ''
  const wa = s.whatsapp?.replace(/\D/g, '')
  return {
    whatsapp: wa ? `https://wa.me/${wa}${enc ? `?text=${enc}` : ''}` : `https://wa.me/${enc ? `?text=${enc}` : ''}`,
    telegram: s.telegram ? `https://t.me/${s.telegram.replace(/^@/, '')}${enc ? `?text=${enc}` : ''}` : null,
    instagram: `https://www.instagram.com/${(s.instagram || 'zoy.toy').replace(/^@/, '')}/`,
    phone: s.phone ? `tel:${s.phone.replace(/[^\d+]/g, '')}` : null,
  }
}

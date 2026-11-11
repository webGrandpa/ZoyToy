/**
 * Ready-made messages to the customer (docs/08 §3.2). The owner sends them with one tap — from the
 * Telegram bot or the order page — and WhatsApp opens the customer's chat with the text filled in, in
 * the language the customer ordered in. Texts are edited in Admin → Site settings → Messages; the
 * defaults below are used for any message left empty. Pure module: safe in the admin's browser.
 */
export type Lang = 'ka' | 'ru' | 'en'

export const TEMPLATE_KEYS = ['confirmed', 'payment', 'pickup', 'shipped', 'cancelled'] as const
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

/** Site settings field holding each message. */
export const TEMPLATE_FIELD: Record<TemplateKey, `msg${string}`> = {
  confirmed: 'msgConfirmed',
  payment: 'msgPayment',
  pickup: 'msgPickup',
  shipped: 'msgShipped',
  cancelled: 'msgCancelled',
}

export const TEMPLATE_LABEL: Record<TemplateKey, Record<Lang, string>> = {
  confirmed: { ka: 'დადასტურდა', ru: 'Подтверждён', en: 'Confirmed' },
  payment: { ka: 'გადარიცხვის რეკვიზიტები', ru: 'Реквизиты для перевода', en: 'Bank transfer details' },
  pickup: { ka: 'მზადაა გასატანად', ru: 'Готов к выдаче', en: 'Ready for pickup' },
  shipped: { ka: 'გაგზავნილია', ru: 'Отправлен', en: 'Shipped' },
  cancelled: { ka: 'ვერ შესრულდება', ru: 'Не получится выполнить', en: 'Cannot be fulfilled' },
}

export const PLACEHOLDERS = ['{name}', '{number}', '{items}', '{total}', '{tracking}'] as const

export const DEFAULT_TEMPLATES: Record<TemplateKey, Record<Lang, string>> = {
  confirmed: {
    ka: 'გამარჯობა, {name}! 🦒 თქვენი შეკვეთა {number} დადასტურებულია: {items}. ჯამი: {total}. მალე დაგიკავშირდებით მიწოდების დეტალებზე. მადლობა, რომ Zoy Toy აირჩიეთ!',
    ru: 'Здравствуйте, {name}! 🦒 Ваш заказ {number} подтверждён: {items}. Итого: {total}. Скоро свяжемся по поводу доставки. Спасибо, что выбрали Zoy Toy!',
    en: 'Hi {name}! 🦒 Your order {number} is confirmed: {items}. Total: {total}. We’ll be in touch about delivery shortly. Thank you for choosing Zoy Toy!',
  },
  payment: {
    ka: '{name}, შეკვეთა {number} — {total}.\nგადარიცხვის რეკვიზიტები: [ბანკი, IBAN, მიმღები].\nდანიშნულებაში მიუთითეთ {number}, გადარიცხვის შემდეგ კი ქვითარი გამოგვიგზავნეთ. მადლობა! 🙏',
    ru: '{name}, заказ {number} — {total}.\nРеквизиты для перевода: [банк, IBAN, получатель].\nВ назначении платежа укажите {number}, а после оплаты пришлите, пожалуйста, квитанцию. Спасибо! 🙏',
    en: '{name}, order {number} — {total}.\nBank transfer details: [bank, IBAN, recipient].\nPlease use {number} as the payment reference and send us the receipt once paid. Thank you! 🙏',
  },
  pickup: {
    ka: '{name}, შეკვეთა {number} მზადაა გასატანად! 🎁 გელოდებით მაღაზიაში. ჯამი: {total}.',
    ru: '{name}, заказ {number} готов к выдаче! 🎁 Ждём вас в магазине. Итого: {total}.',
    en: '{name}, order {number} is ready for pickup! 🎁 See you at the shop. Total: {total}.',
  },
  shipped: {
    ka: '{name}, თქვენი შეკვეთა {number} გზაშია! 📦 თრექინგი / მძღოლის ნომერი: {tracking}. სასიამოვნო თამაშს გისურვებთ! 🦒',
    ru: '{name}, ваш заказ {number} уже в пути! 📦 Трекинг / телефон водителя: {tracking}. Приятной игры! 🦒',
    en: '{name}, your order {number} is on its way! 📦 Tracking / driver phone: {tracking}. Have fun playing! 🦒',
  },
  cancelled: {
    ka: '{name}, სამწუხაროდ შეკვეთა {number} ვერ შესრულდება — ბოდიშს გიხდით! 🙏 ახალი სათამაშოები ყოველ კვირას ემატება, გველოდებით ისევ.',
    ru: '{name}, к сожалению, заказ {number} выполнить не получится — простите! 🙏 Новые игрушки появляются каждую неделю, будем рады видеть вас снова.',
    en: '{name}, unfortunately we can’t fulfil order {number} — sorry! 🙏 New toys arrive every week, we hope to see you again.',
  },
}

export type OrderForMessage = {
  name?: string | null
  number?: string | null
  total?: number | null
  /** what is left to pay after a game reward (set when the request carried a valid code) */
  payable?: number | null
  tracking?: string | null
  items?: { title?: string | null }[] | null
}

export const asLang = (v: unknown): Lang => (v === 'ru' || v === 'en' ? v : 'ka')

export function money(n: number | null | undefined, lang: Lang = 'ka') {
  const v = Number(n ?? 0)
  const s = Number.isInteger(v) ? String(v) : v.toFixed(2)
  return `${lang === 'en' ? s : s.replace('.', ',')} ₾`
}

/** The message with the order's details in place of {name}, {number}, {items}, {total}, {tracking}. */
export function fillTemplate(text: string, o: OrderForMessage, lang: Lang) {
  const values: Record<string, string> = {
    name: o.name?.trim() || '',
    number: o.number || '',
    items: (o.items ?? []).map((i) => i.title?.trim()).filter(Boolean).join(', '),
    total: money(o.payable ?? o.total, lang),
    tracking: o.tracking?.trim() || '—',
  }
  return text.replace(/\{(name|number|items|total|tracking)\}/g, (_, k: string) => values[k])
}

/** The saved message, or the default when the owner left it empty. */
export function templateText(saved: object | null | undefined, key: TemplateKey, lang: Lang) {
  const own = (saved as Record<string, unknown> | null | undefined)?.[TEMPLATE_FIELD[key]]
  return typeof own === 'string' && own.trim() ? own : DEFAULT_TEMPLATES[key][lang]
}

/** Which message fits the order right now — offered first in Telegram and on the order page. */
export function templateFor(o: { status?: string | null; delivery?: string | null; payment?: string | null }): TemplateKey | null {
  switch (o.status) {
    case 'requested':
      return 'confirmed'
    case 'confirmed':
      if (o.payment === 'transfer' || o.payment === 'link') return 'payment'
      return o.delivery === 'pickup' ? 'pickup' : 'confirmed'
    case 'paid':
      return o.delivery === 'pickup' ? 'pickup' : 'shipped'
    case 'shipped':
      return 'shipped'
    case 'cancelled':
    case 'expired':
      return 'cancelled'
    default:
      return null
  }
}

/**
 * Phone as WhatsApp links want it: country code + number, digits only. Customers usually type Georgian
 * mobiles without +995 (555 12 34 56) or with a leading 0; numbers typed with + or 00 keep their own code.
 */
export function intlPhone(raw: string) {
  const trimmed = raw.trim()
  const d = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') || d.startsWith('995')) return d
  if (d.startsWith('00')) return d.slice(2)
  if (d.length === 9 && d.startsWith('5')) return `995${d}`
  if (d.length === 10 && d.startsWith('0')) return `995${d.slice(1)}`
  return d
}

export const whatsappLink = (phone: string, text?: string) => `https://wa.me/${intlPhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`

/** Telegram cannot open a chat by phone number with text; its share sheet lets the owner pick the chat. */
export const telegramShareLink = (text: string) => `https://t.me/share/url?url=${encodeURIComponent(text)}`

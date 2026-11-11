export const LOCALES = ['ka', 'ru', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ka'
export const isLocale = (v: string | undefined): v is Locale => !!v && (LOCALES as readonly string[]).includes(v)
export const LOCALE_NAMES: Record<Locale, string> = { ka: 'ქართული', ru: 'Русский', en: 'English' }
export const HTML_LANG: Record<Locale, string> = { ka: 'ka', ru: 'ru', en: 'en' }

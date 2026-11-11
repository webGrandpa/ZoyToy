import { ka, type Messages } from './messages-ka'
import { ru } from './messages-ru'
import { en } from './messages-en'
import type { Locale } from './config'

export type { Messages }
const ALL: Record<Locale, Messages> = { ka, ru, en }
export const getMessages = (locale: Locale): Messages => ALL[locale]

// formatting lives in ./format so browser code can use it without shipping all three dictionaries
export { dateText, fmt, money } from './format'

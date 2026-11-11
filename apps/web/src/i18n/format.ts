import type { Locale } from './config'

/* Formatting helpers with no dictionaries attached — safe for client components (see ./index). */

/**
 * Fill {placeholders}. When the string holds plural forms separated by "|"
 * (ru: one|few|many, en: one|other) the form is picked from vars.n.
 */
export function fmt(locale: Locale, template: string, vars: Record<string, string | number> = {}): string {
  let s = template
  if (s.includes('|') && typeof vars.n === 'number') {
    const forms = s.split('|')
    const cat = new Intl.PluralRules(locale).select(vars.n)
    const order = locale === 'ru' ? ['one', 'few', 'many'] : ['one', 'other']
    const i = order.indexOf(cat)
    s = forms[i >= 0 ? Math.min(i, forms.length - 1) : forms.length - 1]
  }
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`))
}

/** Georgian price format: 89,00 ₾ (same for all locales — the shop's currency style). */
export function money(value: number): string {
  const [i, d] = (Math.round(value * 100) / 100).toFixed(2).split('.')
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d} ₾`
}

const MONTHS: Record<Locale, string[]> = {
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/**
 * "9 ნოემბერი" / "9 ноября" / "9 November" in Batumi time.
 * Built by hand so server and browser render identical text (their ICU data differ for ka-GE).
 */
export function dateText(locale: Locale, iso: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tbilisi', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(iso))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return `${get('day')} ${MONTHS[locale][get('month') - 1]}`
}

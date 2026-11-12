'use client'

import { useEffect, useState } from 'react'
import { useConfig, useDocumentInfo, useFormFields, useFormModified, useTranslation } from '@payloadcms/ui'
import { asLang, type Lang } from '../../lib/telegram/templates'

type Camp = { id: number; title?: string; active?: boolean; startsAt?: string | null; endsAt?: string | null; updatedAt?: string }

const T: Record<Lang, Record<string, string>> = {
  ka: {
    unsaved: '💾 ჯერ შეინახე — მერე გამოჩნდება საიტზე.',
    modified: '💾 ცვლილებები ჯერ შენახული არ არის — საიტზე შენახვის მერე აისახება.',
    off: '⏸ გამორთულია — საიტზე არ ჩანს. ჩასართავად მარჯვნივ მონიშნე „აქტიური“ და შეინახე.',
    soon: '⏳ ჯერ არ დაწყებულა — დაიწყება {date}-ს.',
    over: '⌛ დასრულდა {date}-ს — საიტზე აღარ ჩანს. გასაგრძელებლად შეცვალე „დასრულება“.',
    noTiers: '⚠️ არცერთი საფეხური — ჯილდო ვერ გაიცემა. დაამატე მინიმუმ ერთი: ქულა → ფასდაკლება.',
    other: '⚠️ ახლა მოქმედებს „{title}“ — ერთდროულად მხოლოდ ერთი კამპანია ჩანს (ჩართულებიდან ბოლოს შეცვლილი). ეს რომ გამოჩნდეს, „{title}“ გამორთე.',
    live: '🟢 მოქმედებს ახლა — მყიდველები ხედავენ და თამაშით ფასდაკლებას იგებენ.',
    where: 'სად ჩანს:',
    home: 'მთავარი გვერდი ↗',
    play: 'თამაშის გვერდი ↗',
    rewards: 'მოგებული კოდები ↗',
    how: 'როგორ მუშაობს?',
    steps: 'მყიდველი თამაშობს „თამაშის“ გვერდზე → საკმარისი ქულისას იღებს კოდს ZOY-… → კალათაში წერს კოდს და მაშინვე ხედავს ფასდაკლებულ ფასს → შეკვეთაში ჩანს კოდი და გადასახდელი თანხა → ბოტში 🎟 ღილაკით ან „ჯილდოებში“ ნიშნავ გამოყენებულად.',
  },
  ru: {
    unsaved: '💾 Сначала сохраните — потом появится на сайте.',
    modified: '💾 Изменения ещё не сохранены — на сайте появятся после сохранения.',
    off: '⏸ Выключена — на сайте не видна. Отметьте «Активна» справа и сохраните.',
    soon: '⏳ Ещё не началась — начнётся {date}.',
    over: '⌛ Закончилась {date} — на сайте не видна. Чтобы продлить, измените «Конец».',
    noTiers: '⚠️ Нет ни одной ступени — награды не выдаются. Добавьте хотя бы одну: очки → скидка.',
    other: '⚠️ Сейчас действует «{title}» — одновременно видна одна кампания (последняя изменённая из включённых). Чтобы показать эту, выключите «{title}».',
    live: '🟢 Действует сейчас — покупатели видят её и выигрывают скидки.',
    where: 'Где видно:',
    home: 'Главная ↗',
    play: 'Страница игры ↗',
    rewards: 'Выигранные коды ↗',
    how: 'Как это работает?',
    steps: 'Покупатель играет на странице «Игра» → при достаточном счёте получает код ZOY-… → вводит его в корзине и сразу видит цену со скидкой → в заказе видны код и сумма → отмечаете код использованным кнопкой 🎟 в боте или в «Наградах».',
  },
  en: {
    unsaved: '💾 Save first — then it shows on the site.',
    modified: '💾 Changes are not saved yet — the site updates after saving.',
    off: '⏸ Switched off — not on the site. Tick “Active” on the right and save.',
    soon: '⏳ Not started yet — starts on {date}.',
    over: '⌛ Ended on {date} — no longer on the site. Change “Ends” to extend it.',
    noTiers: '⚠️ No tiers — no rewards can be won. Add at least one: score → discount.',
    other: '⚠️ “{title}” is running now — only one campaign shows at a time (the most recently edited active one). Switch “{title}” off to show this one.',
    live: '🟢 Running now — customers see it and win discounts.',
    where: 'Where it shows:',
    home: 'Home page ↗',
    play: 'Play page ↗',
    rewards: 'Codes won ↗',
    how: 'How does it work?',
    steps: 'A customer plays on the Play page → with a high enough score gets a code ZOY-… → enters it in the cart and sees the discounted price → the order shows the code and the amount → mark it used with 🎟 in the bot or in Rewards.',
  },
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ka-GE', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Top of the campaign form: is it on the site right now, and if not — exactly why (feedback 2026-11-12). */
export function CampaignStatus() {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const lang = asLang(i18n.language)
  const t = T[lang]
  const { id } = useDocumentInfo()
  const modified = useFormModified()
  const active = useFormFields(([f]) => Boolean(f.active?.value))
  const startsAt = useFormFields(([f]) => (f.startsAt?.value as string | null) ?? null)
  const endsAt = useFormFields(([f]) => (f.endsAt?.value as string | null) ?? null)
  const tiers = useFormFields(([f]) => Number(f.tiers?.value ?? 0))
  const api = config.routes?.api ?? '/api'
  const admin = config.routes?.admin ?? '/admin'

  const [running, setRunning] = useState<Camp | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    fetch(`${api}/game-campaigns?where[active][equals]=true&sort=-updatedAt&limit=20&depth=0&locale=${lang}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs: Camp[] }) => {
        const now = Date.now()
        const live = d.docs.find((c) => (!c.startsAt || new Date(c.startsAt).getTime() <= now) && (!c.endsAt || new Date(c.endsAt).getTime() > now))
        if (alive) setRunning(live ?? null)
      })
      .catch(() => alive && setRunning(null))
    return () => {
      alive = false
    }
  }, [api, lang, modified])

  const now = Date.now()
  let state: { text: string; tone: 'ok' | 'warn' | 'off' }
  if (!id) state = { text: t.unsaved, tone: 'off' }
  else if (!active) state = { text: t.off, tone: 'off' }
  else if (startsAt && new Date(startsAt).getTime() > now) state = { text: t.soon.replace('{date}', fmtDate(startsAt)), tone: 'warn' }
  else if (endsAt && new Date(endsAt).getTime() <= now) state = { text: t.over.replace('{date}', fmtDate(endsAt)), tone: 'off' }
  else if (!tiers) state = { text: t.noTiers, tone: 'warn' }
  else if (running && running.id !== id) state = { text: t.other.replaceAll('{title}', running.title ?? `#${running.id}`), tone: 'warn' }
  else state = { text: t.live, tone: 'ok' }
  const live = state.tone === 'ok'

  return (
    <div className={`zt-camp zt-camp--${state.tone}`}>
      <p className="zt-camp__state" role="status">
        {state.text}
      </p>
      {id && modified ? <p className="zt-camp__note">{t.modified}</p> : null}
      {live ? (
        <p className="zt-camp__links">
          <span>{t.where}</span>
          <a href={`/${lang}`} target="_blank" rel="noopener noreferrer">
            {t.home}
          </a>
          <a href={`/${lang}/play`} target="_blank" rel="noopener noreferrer">
            {t.play}
          </a>
          <a href={`${admin}/collections/rewards`}>{t.rewards}</a>
        </p>
      ) : null}
      <details className="zt-camp__how">
        <summary>{t.how}</summary>
        <p>{t.steps}</p>
      </details>
    </div>
  )
}

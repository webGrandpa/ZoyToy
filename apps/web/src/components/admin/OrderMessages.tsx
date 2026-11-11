'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAllFormFields, useConfig, useTranslation } from '@payloadcms/ui'
import {
  asLang,
  fillTemplate,
  telegramShareLink,
  TEMPLATE_KEYS,
  TEMPLATE_LABEL,
  templateFor,
  templateText,
  whatsappLink,
  type Lang,
} from '../../lib/telegram/templates'

const UI: Record<Lang, { title: string; now: string; copy: string; copied: string; preview: string; noPhone: string }> = {
  ka: { title: 'მესიჯი მყიდველს', now: 'ახლა', copy: 'კოპირება', copied: 'დაკოპირდა ✓', preview: 'ტექსტი', noPhone: 'ჯერ ტელეფონი ჩაწერე' },
  ru: { title: 'Сообщение покупателю', now: 'сейчас', copy: 'Копировать', copied: 'Скопировано ✓', preview: 'Текст', noPhone: 'Сначала укажите телефон' },
  en: { title: 'Message the customer', now: 'now', copy: 'Copy', copied: 'Copied ✓', preview: 'Text', noPhone: 'Add a phone number first' },
}
const LANG_NAME: Record<Lang, string> = { ka: 'ქართულად', ru: 'по-русски', en: 'in English' }

/**
 * Order page sidebar: the ready-made customer messages (Site settings → Messages) filled in with this
 * order, in the customer's language — the one that fits the current status first. One tap opens
 * WhatsApp with the text, the Telegram share sheet, or copies it for Instagram/Gmail (docs/08 §3.2).
 */
export function OrderMessages() {
  const [fields] = useAllFormFields()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const ui = UI[asLang(i18n.language)]
  const value = (path: string) => fields[path]?.value
  const lang = asLang(value('locale'))
  const phone = String(value('phone') ?? '').trim()

  const order = useMemo(() => {
    const titles = Object.keys(fields)
      .map((k) => k.match(/^items\.(\d+)\.title$/))
      .filter((m): m is RegExpMatchArray => Boolean(m))
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map((m) => ({ title: String(fields[m[0]]?.value ?? '') }))
    return {
      name: String(fields.name?.value ?? ''),
      number: String(fields.number?.value ?? ''),
      total: Number(fields.total?.value ?? 0),
      tracking: String(fields.tracking?.value ?? ''),
      items: titles,
    }
  }, [fields])

  const [saved, setSaved] = useState<Record<string, unknown> | null>(null)
  const api = config.routes?.api ?? '/api'
  useEffect(() => {
    let alive = true
    fetch(`${api}/globals/site-settings?locale=${lang}&fallback-locale=none&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => alive && setSaved(s))
      .catch(() => alive && setSaved(null))
    return () => {
      alive = false
    }
  }, [api, lang])

  const [copied, setCopied] = useState<string | null>(null)
  const copy = (key: string, text: string) =>
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(key)
        setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800)
      },
      () => undefined,
    )

  const suggested = templateFor({ status: value('status') as string, delivery: value('delivery') as string, payment: value('payment') as string })
  const keys = suggested ? [suggested, ...TEMPLATE_KEYS.filter((k) => k !== suggested)] : [...TEMPLATE_KEYS]

  return (
    <div className="zt-msgs">
      <p className="zt-msgs__title">
        💬 {ui.title} <span>{LANG_NAME[lang]}</span>
      </p>
      {keys.map((key) => {
        const text = fillTemplate(templateText(saved, key, lang), order, lang)
        return (
          <div key={key} className={`zt-msg${key === suggested ? ' zt-msg--now' : ''}`}>
            <b className="zt-msg__name">
              {TEMPLATE_LABEL[key][asLang(i18n.language)]}
              {key === suggested ? <em>{ui.now}</em> : null}
            </b>
            <div className="zt-msg__btns">
              {phone ? (
                <a className="zt-msg__btn zt-msg__btn--wa" href={whatsappLink(phone, text)} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              ) : (
                <span className="zt-msg__btn zt-msg__btn--off" title={ui.noPhone}>
                  WhatsApp
                </span>
              )}
              <a className="zt-msg__btn zt-msg__btn--tg" href={telegramShareLink(text)} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
              <button type="button" className="zt-msg__btn" onClick={() => copy(key, text)}>
                {copied === key ? ui.copied : ui.copy}
              </button>
            </div>
            <details className="zt-msg__text">
              <summary>{ui.preview}</summary>
              <p>{text}</p>
            </details>
          </div>
        )
      })}
    </div>
  )
}

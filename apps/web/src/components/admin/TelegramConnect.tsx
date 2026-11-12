'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useConfig, useField, useFormModified, useTranslation } from '@payloadcms/ui'
import { asLang, type Lang } from '../../lib/telegram/templates'
import type { Connection } from '../../lib/telegram/bot'

type Problem = NonNullable<Connection['problem']> | 'no_chat'

const UI: Record<
  Lang,
  {
    title: string
    checking: string
    off: string
    none: string
    ok: (name: string, group: boolean) => string
    problem: Record<Problem, string>
    connect: string
    group: string
    test: string
    sent: string
    waiting: string
    connected: string
    how: string
    staff: string
  }
> = {
  ka: {
    title: 'ბოტთან კავშირი',
    checking: 'ვამოწმებ…',
    off: 'ბოტის ტოკენი ჯერ არ არის დაყენებული (docs/09 §5).',
    none: 'ჯერ არცერთი ჩატი არ არის დაკავშირებული — შეკვეთები ბოტში არ მოვა.',
    ok: (name, group) => `✅ დაკავშირებულია: ${name} · ${group ? 'ჯგუფი' : 'პირადი ჩატი'}`,
    problem: {
      token: '⚠️ ბოტის ტოკენი არასწორია — BotFather-ში შეამოწმე და Vercel-ში თავიდან ჩაწერე.',
      not_found: '⚠️ ბოტი ამ ნომერს ვერ პოულობს, ამიტომ შეკვეთები არ მოდის. დააჭირე „დაკავშირებას“ — ნომერი თავისით ჩაიწერება.',
      blocked: '⚠️ ბოტი ამ ჩატში დაბლოკილია. Telegram-ში გახსენი ბოტი, დააჭირე „Restart“-ს და ხელახლა დააკავშირე.',
      removed: '⚠️ ბოტი ჯგუფში აღარ არის. დაამატე ხელახლა ღილაკით „ჯგუფთან დაკავშირება“.',
      moved: '⚠️ Telegram-მა ჯგუფს ნომერი შეუცვალა — დააკავშირე ხელახლა.',
      other: '⚠️ ბოტმა ამ ჩატს ვერ მისწერა. დააკავშირე ხელახლა.',
      no_chat: 'ჯერ დააკავშირე ჩატი.',
    },
    connect: '📱 პირად ჩატთან დაკავშირება',
    group: '👥 ჯგუფთან დაკავშირება',
    test: '🧪 სატესტო შეტყობინება',
    sent: 'გაიგზავნა ✓ — Telegram შეამოწმე',
    waiting: 'Telegram-ში დააჭირე „Start“-ს (ჯგუფისთვის — აირჩიე ჯგუფი). ველოდები…',
    connected: '✅ დაკავშირდა! ბოტმა ამ ჩატში მოგწერა.',
    how: 'ღილაკი Telegram-ს გახსნის, ბოტი კი ნომერს თავისით ჩაწერს — კოპირება არ არის საჭირო. ბმული 30 წუთი მოქმედებს.',
    staff: 'ჩატის შეცვლა მხოლოდ ადმინს შეუძლია.',
  },
  ru: {
    title: 'Связь с ботом',
    checking: 'Проверяю…',
    off: 'Токен бота ещё не задан (docs/09 §5).',
    none: 'Ни один чат ещё не подключён — заказы в бот не придут.',
    ok: (name, group) => `✅ Подключено: ${name} · ${group ? 'группа' : 'личный чат'}`,
    problem: {
      token: '⚠️ Неверный токен бота — проверьте в BotFather и задайте заново в Vercel.',
      not_found: '⚠️ Бот не находит этот номер, поэтому заказы не приходят. Нажмите «Подключить» — номер запишется сам.',
      blocked: '⚠️ Бот заблокирован в этом чате. Откройте бота в Telegram, нажмите «Restart» и подключите заново.',
      removed: '⚠️ Бота больше нет в группе. Добавьте снова кнопкой «Подключить группу».',
      moved: '⚠️ Telegram сменил номер группы — подключите заново.',
      other: '⚠️ Бот не смог написать в этот чат. Подключите заново.',
      no_chat: 'Сначала подключите чат.',
    },
    connect: '📱 Подключить личный чат',
    group: '👥 Подключить группу',
    test: '🧪 Тестовое сообщение',
    sent: 'Отправлено ✓ — проверьте Telegram',
    waiting: 'Нажмите «Start» в Telegram (для группы — выберите группу). Жду…',
    connected: '✅ Подключено! Бот написал в этот чат.',
    how: 'Кнопка откроет Telegram, бот сам запишет номер — копировать ничего не нужно. Ссылка действует 30 минут.',
    staff: 'Сменить чат может только админ.',
  },
  en: {
    title: 'Bot connection',
    checking: 'Checking…',
    off: 'The bot token is not set yet (docs/09 §5).',
    none: 'No chat is connected yet — orders will not reach the bot.',
    ok: (name, group) => `✅ Connected: ${name} · ${group ? 'group' : 'private chat'}`,
    problem: {
      token: '⚠️ The bot token is wrong — check it in BotFather and set it again in Vercel.',
      not_found: '⚠️ The bot cannot find this chat number, so orders do not arrive. Press “Connect” — the number fills in by itself.',
      blocked: '⚠️ The bot is blocked in this chat. Open the bot in Telegram, press “Restart” and connect again.',
      removed: '⚠️ The bot is no longer in the group. Add it again with “Connect a group”.',
      moved: '⚠️ Telegram changed the group’s number — connect again.',
      other: '⚠️ The bot could not write to this chat. Connect again.',
      no_chat: 'Connect a chat first.',
    },
    connect: '📱 Connect a private chat',
    group: '👥 Connect a group',
    test: '🧪 Test message',
    sent: 'Sent ✓ — check Telegram',
    waiting: 'Press “Start” in Telegram (for a group, pick the group). Waiting…',
    connected: '✅ Connected! The bot wrote to that chat.',
    how: 'The button opens Telegram and the bot fills in the number by itself — nothing to copy. The link works for 30 minutes.',
    staff: 'Only an admin can change the chat.',
  },
}

const POLL_MS = 3000
const POLL_FOR_MS = 3 * 60_000

/**
 * Site settings → Telegram tab: shows whether orders can reach the shop's chat (asks Telegram, not just
 * the form), connects a private chat or a group in one tap (signed t.me link — the bot saves the number
 * itself), and sends a test message. Keeps the “Chat ID” field in step, so saving the form afterwards
 * does not put an old number back.
 */
export function TelegramConnect() {
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const ui = UI[asLang(i18n.language)]
  const api = config.routes?.api ?? '/api'
  const { setValue } = useField<string>({ path: 'telegramChatId' })
  const modified = useFormModified()

  const [state, setState] = useState<Connection | null>(null)
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const poll = useRef<{ timer: ReturnType<typeof setInterval>; until: number; from: string | null; broken: boolean } | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`${api}/telegram/status`, { credentials: 'include', cache: 'no-store' }).catch(() => null)
    const next = res?.ok ? ((await res.json()) as Connection) : null
    setState(next)
    return next
  }, [api])

  const stopPolling = () => {
    if (poll.current) clearInterval(poll.current.timer)
    poll.current = null
  }

  useEffect(() => {
    void load()
    return stopPolling
  }, [load])

  // after the form is saved, show what Telegram says about the number that was just stored
  const wasModified = useRef(modified)
  useEffect(() => {
    if (wasModified.current && !modified) void load()
    wasModified.current = modified
  }, [modified, load])

  // the bot saves the chat when Start is pressed — watch for it, then mirror it into the field
  const watch = () => {
    stopPolling()
    setNote({ text: ui.waiting, ok: true })
    const from = state?.chat?.id ?? null
    const timer = setInterval(async () => {
      const p = poll.current
      if (!p) return
      if (Date.now() > p.until) {
        stopPolling()
        setNote(null)
        return
      }
      const next = await load()
      // a new chat, or the same one working again (unblocked, bot re-added)
      if (next?.chat && !next.problem && (next.chat.id !== p.from || p.broken)) {
        stopPolling()
        setValue(next.chat.id, true)
        setNote({ text: ui.connected, ok: true })
      }
    }, POLL_MS)
    poll.current = { timer, until: Date.now() + POLL_FOR_MS, from, broken: Boolean(state?.problem) || !state?.chat }
  }

  const test = async () => {
    setBusy(true)
    setNote(null)
    const res = await fetch(`${api}/telegram/test`, { method: 'POST', credentials: 'include' }).catch(() => null)
    const out = res?.ok ? ((await res.json()) as { ok: boolean; problem?: Problem }) : { ok: false, problem: 'other' as Problem }
    setNote(out.ok ? { text: ui.sent, ok: true } : { text: ui.problem[out.problem ?? 'other'], ok: false })
    setBusy(false)
    if (!out.ok) void load()
  }

  let line: { text: string; ok: boolean }
  if (!state) line = { text: ui.checking, ok: true }
  else if (!state.configured) line = { text: ui.off, ok: false }
  else if (state.problem) line = { text: ui.problem[state.problem], ok: false }
  else if (!state.chat) line = { text: ui.none, ok: false }
  else line = { text: ui.ok(state.chat.name, state.chat.group), ok: true }

  return (
    <div className="zt-tg">
      <p className="zt-tg__title">
        🤖 {ui.title}
        {state?.bot ? (
          <a href={`https://t.me/${state.bot}`} target="_blank" rel="noopener noreferrer">
            @{state.bot}
          </a>
        ) : null}
      </p>
      <p className={`zt-tg__state${line.ok ? '' : ' zt-tg__state--bad'}`} role="status">
        {line.text}
      </p>
      {state?.configured && state.problem !== 'token' ? (
        <>
          <div className="zt-tg__btns">
            {state.links ? (
              <>
                <a className="zt-msg__btn zt-msg__btn--tg" href={state.links.private} target="_blank" rel="noopener noreferrer" onClick={watch}>
                  {ui.connect}
                </a>
                <a className="zt-msg__btn zt-msg__btn--tg" href={state.links.group} target="_blank" rel="noopener noreferrer" onClick={watch}>
                  {ui.group}
                </a>
              </>
            ) : null}
            {state.chat ? (
              <button type="button" className="zt-msg__btn" onClick={test} disabled={busy}>
                {ui.test}
              </button>
            ) : null}
          </div>
          {note ? <p className={`zt-tg__note${note.ok ? '' : ' zt-tg__note--bad'}`}>{note.text}</p> : null}
          <p className="zt-tg__how">{state.links ? ui.how : ui.staff}</p>
        </>
      ) : null}
    </div>
  )
}

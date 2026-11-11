/**
 * Minimal Telegram Bot API client (https://core.telegram.org/bots/api). The token never appears in
 * errors or logs — only the method name and Telegram's own description do.
 */
export const botToken = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || ''

export class TelegramError extends Error {
  constructor(
    readonly method: string,
    readonly description: string,
  ) {
    super(`Telegram ${method}: ${description}`)
  }
}

type Reply<T> = { ok: boolean; result?: T; description?: string }

async function call<T>(method: string, init: RequestInit): Promise<T> {
  const token = botToken()
  if (!token) throw new TelegramError(method, 'TELEGRAM_BOT_TOKEN is not set')
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', ...init })
  const data = (await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }))) as Reply<T>
  if (!data.ok) throw new TelegramError(method, data.description ?? `HTTP ${res.status}`)
  return data.result as T
}

export const tg = <T = unknown>(method: string, params: Record<string, unknown>) =>
  call<T>(method, { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) })

/** sendPhoto with the image bytes attached (works for photos Telegram could not fetch itself). */
export function tgPhoto<T = unknown>(params: Record<string, unknown>, photo: { data: Uint8Array; name: string; type: string }) {
  const form = new FormData()
  for (const [key, value] of Object.entries(params)) form.append(key, typeof value === 'string' ? value : JSON.stringify(value))
  form.append('photo', new Blob([photo.data as BlobPart], { type: photo.type }), photo.name)
  return call<T>('sendPhoto', { body: form })
}

/** Editing a message to what it already says is not an error worth reporting. */
export const unchanged = (e: unknown) => e instanceof TelegramError && /message is not modified/i.test(e.description)

export type InlineButton = { text: string; callback_data?: string; url?: string }
export type Keyboard = InlineButton[][]

export type TgUser = { id: number; first_name?: string; username?: string }
export type TgChat = { id: number; type: string; title?: string }
export type TgMessage = { message_id: number; chat: TgChat; from?: TgUser; text?: string; caption?: string; photo?: unknown[] }
export type TgUpdate = {
  update_id?: number
  message?: TgMessage
  callback_query?: { id: string; from: TgUser; data?: string; message?: TgMessage }
}

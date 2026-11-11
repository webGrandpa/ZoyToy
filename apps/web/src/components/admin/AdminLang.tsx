'use client'

import { useState } from 'react'
import { useTranslation } from '@payloadcms/ui'

const LANGS = [
  { code: 'ka', short: 'ქარ', name: 'ქართული' },
  { code: 'ru', short: 'Рус', name: 'Русский' },
  { code: 'en', short: 'Eng', name: 'English' },
] as const
const TITLE: Record<string, string> = { ka: 'ადმინის ენა', ru: 'Язык админки', en: 'Admin language' }

/**
 * The admin's own language, one tap away (Payload hides it on the Account page). Not to be confused
 * with the "content language" switch in the header, which picks which translation of a text you edit.
 */
export function AdminLang({ compact = false }: { compact?: boolean }) {
  const { i18n, switchLanguage } = useTranslation()
  const [busy, setBusy] = useState(false)
  const current = i18n.language
  return (
    <div className={`zt-alang${compact ? ' zt-alang--compact' : ''}`} role="group" aria-label={TITLE[current] ?? TITLE.ka}>
      {!compact ? <span className="zt-alang__label">{TITLE[current] ?? TITLE.ka}</span> : null}
      <div className="zt-alang__seg">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            lang={l.code}
            title={l.name}
            aria-pressed={current === l.code}
            disabled={busy}
            onClick={async () => {
              if (current === l.code || !switchLanguage) return
              setBusy(true)
              await switchLanguage(l.code as never)
              setBusy(false)
            }}
          >
            {l.short}
          </button>
        ))}
      </div>
    </div>
  )
}

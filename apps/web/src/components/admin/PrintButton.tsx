'use client'

import { useTranslation } from '@payloadcms/ui'
import { asLang } from '../../lib/telegram/templates'

const LABEL = { ka: '🖨️ ბეჭდვა', ru: '🖨️ Печать', en: '🖨️ Print' }

export function PrintButton() {
  const { i18n } = useTranslation()
  return (
    <button type="button" className="zt-labels-btn" onClick={() => window.print()}>
      {LABEL[asLang(i18n.language)]}
    </button>
  )
}

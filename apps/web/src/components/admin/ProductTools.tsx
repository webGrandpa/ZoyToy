'use client'

import { useConfig, useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import { asLang } from '../../lib/telegram/templates'

const TEXT = {
  ka: { label: '🏷️ ეტიკეტის ბეჭდვა', sell: '🛒 მაღაზიაში გაყიდვა' },
  ru: { label: '🏷️ Печать этикетки', sell: '🛒 Продать в магазине' },
  en: { label: '🏷️ Print label', sell: '🛒 Sell in the shop' },
}

/** Product sidebar: print this item's QR label, or open the counter screen with it (saved items only). */
export function ProductTools() {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => fields.status?.value)
  const { config } = useConfig()
  const { i18n } = useTranslation()
  if (!id) return null
  const t = TEXT[asLang(i18n.language)]
  const admin = config.routes?.admin ?? '/admin'
  return (
    <div className="zt-ptools">
      <a className="zt-msg__btn" href={`${admin}/labels?ids=${id}`} target="_blank" rel="noopener">{t.label}</a>
      {status !== 'sold' ? <a className="zt-msg__btn zt-msg__btn--wa" href={`${admin}/store-sale?id=${id}`}>{t.sell}</a> : null}
    </div>
  )
}

type Props = { i18n?: { language?: string }; payload?: { config: { routes: { admin: string } } } }

const TEXT = {
  ka: { sale: '🛒 მაღაზიაში გაყიდვა', labels: '🏷️ QR ეტიკეტები' },
  ru: { sale: '🛒 Продажа в магазине', labels: '🏷️ QR-этикетки' },
  en: { sale: '🛒 In-store sale', labels: '🏷️ QR labels' },
}

/** The two custom screens in the side menu (Payload lists only collections and globals there). */
export function NavExtra({ i18n, payload }: Props) {
  const lang = i18n?.language === 'ru' || i18n?.language === 'en' ? i18n.language : 'ka'
  const admin = payload?.config.routes.admin ?? '/admin'
  return (
    <div className="zt-navx">
      <a href={`${admin}/store-sale`}>{TEXT[lang].sale}</a>
      <a href={`${admin}/labels`}>{TEXT[lang].labels}</a>
    </div>
  )
}

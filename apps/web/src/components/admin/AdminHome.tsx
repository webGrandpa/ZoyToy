import type { Payload } from 'payload'
import { GiraffeHead } from '@zoytoy/ui/Giraffe'

type Lang = 'ka' | 'ru' | 'en'
type Props = { payload: Payload; i18n?: { language?: string }; user?: { email?: string | null } | null }

const T: Record<Lang, Record<string, string>> = {
  ka: {
    hello: 'გამარჯობა! რას გავაკეთებთ დღეს?',
    newItem: 'ახალი ნივთი', newItemHint: 'ფოტო, ფასი, მდგომარეობა',
    orders: 'შეკვეთები', ordersNew: 'ახალი მოთხოვნა', ordersNone: 'ახალი არაფერია',
    reward: 'ჯილდოს კოდი', rewardHint: 'შეამოწმე ZOY-კოდი',
    photo: 'ფოტოს ატვირთვა', photoHint: 'კამერიდან ან გალერეიდან',
    items: 'ნივთები', onShelf: 'თაროზე', reserved: 'დაჯავშნილი',
    games: 'თამაშები', gamesHint: 'კამპანია და ჯილდოები',
    settings: 'პარამეტრები', settingsHint: 'კონტაქტი, სეზონი, თამაშები',
    site: 'საიტის ნახვა', siteHint: 'როგორ ხედავს მყიდველი',
    recent: 'ბოლო შეკვეთები', all: 'ყველა',
  },
  ru: {
    hello: 'Здравствуйте! Что делаем сегодня?',
    newItem: 'Новый товар', newItemHint: 'Фото, цена, состояние',
    orders: 'Заказы', ordersNew: 'новых запросов', ordersNone: 'Новых нет',
    reward: 'Код награды', rewardHint: 'Проверить ZOY-код',
    photo: 'Загрузить фото', photoHint: 'С камеры или из галереи',
    items: 'Товары', onShelf: 'на полке', reserved: 'в брони',
    games: 'Игры', gamesHint: 'Кампания и награды',
    settings: 'Настройки', settingsHint: 'Контакты, сезон, игры',
    site: 'Открыть сайт', siteHint: 'Как видит покупатель',
    recent: 'Последние заказы', all: 'Все',
  },
  en: {
    hello: 'Hello! What are we doing today?',
    newItem: 'New item', newItemHint: 'Photo, price, condition',
    orders: 'Orders', ordersNew: 'new requests', ordersNone: 'Nothing new',
    reward: 'Reward code', rewardHint: 'Check a ZOY code',
    photo: 'Upload a photo', photoHint: 'Camera or gallery',
    items: 'Items', onShelf: 'on the shelf', reserved: 'reserved',
    games: 'Games', gamesHint: 'Campaign and rewards',
    settings: 'Settings', settingsHint: 'Contacts, season, games',
    site: 'Open the site', siteHint: 'What customers see',
    recent: 'Latest orders', all: 'All',
  },
}

const STATUS: Record<string, Record<Lang, string>> = {
  requested: { ka: 'ახალი', ru: 'Новый', en: 'New' },
  confirmed: { ka: 'დადასტურებული', ru: 'Подтверждён', en: 'Confirmed' },
  paid: { ka: 'გადახდილი', ru: 'Оплачен', en: 'Paid' },
  shipped: { ka: 'გაგზავნილი', ru: 'Отправлен', en: 'Shipped' },
  completed: { ka: 'დასრულებული', ru: 'Завершён', en: 'Completed' },
  cancelled: { ka: 'გაუქმებული', ru: 'Отменён', en: 'Cancelled' },
  expired: { ka: 'ვადაგასული', ru: 'Истёк', en: 'Expired' },
}

/**
 * Phone-first start screen of the admin (shown above the usual collection list): the jobs the
 * owner does every day as big tap targets, live counts, and the latest orders one tap away.
 */
export async function AdminHome({ payload, i18n }: Props) {
  const lang: Lang = i18n?.language === 'ru' || i18n?.language === 'en' ? i18n.language : 'ka'
  const t = T[lang]
  const admin = payload.config.routes?.admin ?? '/admin'
  const [fresh, onShelf, reserved, recent] = await Promise.all([
    payload.count({ collection: 'orders', where: { status: { equals: 'requested' } } }),
    payload.count({ collection: 'products', where: { status: { equals: 'published' } } }),
    payload.count({ collection: 'products', where: { status: { equals: 'reserved' } } }),
    payload.find({ collection: 'orders', limit: 4, sort: '-createdAt', depth: 0 }),
  ])
  const money = (n?: number | null) => `${(n ?? 0).toFixed(2).replace('.', ',')} ₾`
  return (
    <section className="zt-home">
      <div className="zt-home__hello">
        <GiraffeHead className="zt-home__zoy" />
        <p>{t.hello}</p>
      </div>
      <div className="zt-home__tiles">
        <a className="zt-tile zt-tile--new" href={`${admin}/collections/products/create`}>
          <span className="zt-tile__ic" aria-hidden="true">＋</span>
          <b>{t.newItem}</b>
          <small>{t.newItemHint}</small>
        </a>
        <a className="zt-tile zt-tile--orders" href={`${admin}/collections/orders?where[status][equals]=requested`}>
          <span className="zt-tile__ic" aria-hidden="true">📦</span>
          <b>{t.orders}</b>
          <small>{fresh.totalDocs ? `${fresh.totalDocs} ${t.ordersNew}` : t.ordersNone}</small>
          {fresh.totalDocs ? <i className="zt-tile__badge">{fresh.totalDocs}</i> : null}
        </a>
        <a className="zt-tile zt-tile--reward" href={`${admin}/collections/rewards`}>
          <span className="zt-tile__ic" aria-hidden="true">🎟️</span>
          <b>{t.reward}</b>
          <small>{t.rewardHint}</small>
        </a>
        <a className="zt-tile zt-tile--photo" href={`${admin}/collections/media/create`}>
          <span className="zt-tile__ic" aria-hidden="true">📷</span>
          <b>{t.photo}</b>
          <small>{t.photoHint}</small>
        </a>
        <a className="zt-tile zt-tile--items" href={`${admin}/collections/products`}>
          <span className="zt-tile__ic" aria-hidden="true">🧸</span>
          <b>{t.items}</b>
          <small>{onShelf.totalDocs} {t.onShelf} · {reserved.totalDocs} {t.reserved}</small>
        </a>
        <a className="zt-tile zt-tile--games" href={`${admin}/collections/game-campaigns`}>
          <span className="zt-tile__ic" aria-hidden="true">🎮</span>
          <b>{t.games}</b>
          <small>{t.gamesHint}</small>
        </a>
        <a className="zt-tile zt-tile--settings" href={`${admin}/globals/site-settings`}>
          <span className="zt-tile__ic" aria-hidden="true">⚙️</span>
          <b>{t.settings}</b>
          <small>{t.settingsHint}</small>
        </a>
        <a className="zt-tile zt-tile--site" href={`/${lang}`} target="_blank" rel="noopener">
          <span className="zt-tile__ic" aria-hidden="true">🌐</span>
          <b>{t.site}</b>
          <small>{t.siteHint}</small>
        </a>
      </div>
      {recent.docs.length ? (
        <div className="zt-home__recent">
          <div className="zt-home__recent-head">
            <h2>{t.recent}</h2>
            <a href={`${admin}/collections/orders`}>{t.all} →</a>
          </div>
          <ul>
            {recent.docs.map((o) => (
              <li key={o.id}>
                <a href={`${admin}/collections/orders/${o.id}`}>
                  <b>{o.number}</b>
                  <span className="zt-home__who">{o.name}</span>
                  <em className={`zt-st zt-st--${o.status}`}>{STATUS[o.status]?.[lang] ?? o.status}</em>
                  <span className="zt-home__sum">{money(o.total)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

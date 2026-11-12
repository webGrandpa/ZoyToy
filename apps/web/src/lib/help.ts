import type { Field } from 'payload'

/**
 * Field descriptions for the owner, kept in one place (feedback 2026-11-12: „write what each field is
 * for“). describe() adds them to a collection's fields by path — `rental.dailyRate`, `defects.text` —
 * and never overwrites a description written next to the field itself.
 */
type Desc = { ka: string; ru: string; en: string }
const d = (ka: string, ru: string, en: string): Desc => ({ ka, ru, en })

type WithFields = { fields: Field[] }

function walk(fields: Field[], help: Record<string, Desc>, prefix: string): Field[] {
  return fields.map((f) => {
    const named = 'name' in f && typeof f.name === 'string' ? f.name : null
    const path = named ? `${prefix}${named}` : prefix
    let next = f as Field & { admin?: { description?: unknown }; fields?: Field[]; tabs?: { fields: Field[] }[] }
    if (named && help[path] && !next.admin?.description && f.type !== 'ui') next = { ...next, admin: { ...next.admin, description: help[path] } } as typeof next
    if ('tabs' in next && Array.isArray(next.tabs)) next = { ...next, tabs: next.tabs.map((t) => ({ ...t, fields: walk(t.fields, help, 'name' in t && t.name ? `${prefix}${t.name}.` : prefix) })) } as typeof next
    if ('fields' in next && Array.isArray(next.fields)) next = { ...next, fields: walk(next.fields, help, named && (f.type === 'group' || f.type === 'array') ? `${path}.` : prefix) } as typeof next
    return next as Field
  })
}

export function describe<T extends WithFields>(config: T, help: Record<string, Desc>): T {
  return { ...config, fields: walk(config.fields, help, '') }
}

const AUTO = d('ავტომატურად ივსება', 'Заполняется автоматически', 'Filled in automatically')

export const PRODUCT_HELP: Record<string, Desc> = {
  status: d(
    '„დრაფტი“ — საიტზე არ ჩანს. „გამოქვეყნებული“ — ჩანს და იყიდება. „დაჯავშნილი“ და „გაყიდული“ შეკვეთით თავისით იცვლება.',
    '«Черновик» — не виден на сайте. «Опубликован» — виден и продаётся. «Забронирован» и «Продан» меняются сами по заказу.',
    '“Draft” — hidden. “Published” — visible and for sale. “Reserved” and “Sold” follow orders by themselves.',
  ),
  publishedAt: AUTO,
  soldAt: AUTO,
  title: d('ისე, როგორც მყიდველი მოძებნიდა: რა არის + მთავარი თვისება. მაგ. „ხის მატარებელი ლიანდაგებით“.', 'Как искал бы покупатель: что это + главное свойство. Напр. «Деревянный поезд с рельсами».', 'As a buyer would search: what it is + the key feature, e.g. “Wooden train with tracks”.'),
  shortDescription: d('1–2 წინადადება — ჩანს სათაურის ქვეშ (220 სიმბოლომდე).', '1–2 предложения — под названием (до 220 символов).', '1–2 sentences under the title (up to 220 characters).'),
  description: d('დეტალები ნივთის გვერდისთვის: რა შედის ყუთში, როგორ მუშაობს, ზომა.', 'Подробности для страницы товара: что в комплекте, как работает, размер.', 'Details for the item page: what is in the box, how it works, size.'),
  categories: d('ერთი ან მეტი. პირველი კატეგორია განსაზღვრავს ბარათის ფერს და „მსგავს ნივთებს“.', 'Одна или несколько. Первая задаёт цвет карточки и «похожие товары».', 'One or more. The first sets the card colour and “similar items”.'),
  ageMaxMonths: d('ცარიელი — ზედა ზღვარი არ აქვს.', 'Пусто — без верхней границы.', 'Empty — no upper limit.'),
  origin: d('საიდან ჩამოვიდა — ფილტრში და ნივთის გვერდზე ჩანს.', 'Откуда привезён — виден в фильтре и на странице.', 'Where it came from — shown in the filter and on the page.'),
  condition: d('„ახალი“-დან „ნორმალურამდე“. ბარათზე ფერადი ნიშნით და შკალით ჩანს.', 'От «нового» до «нормального». На карточке — цветной значок и шкала.', 'From “new” to “fair”. Shown as a coloured badge and a scale.'),
  conditionNotes: d('რა უნდა იცოდეს მყიდველმა მდგომარეობაზე — მოკლედ.', 'Что покупателю знать о состоянии — коротко.', 'What the buyer should know about the condition — briefly.'),
  'defects.text': d('მაგ. „პატარა ნაკაწრი მარცხენა ფრთაზე“.', 'Напр. «Маленькая царапина на левом крыле».', 'e.g. “Small scratch on the left wing”.'),
  'defects.photo': d('ფოტო, რომელზეც ჩანს. ცარიელი — მთავარი ფოტო.', 'Фото, где видно. Пусто — главное фото.', 'The photo that shows it. Empty — the main photo.'),
  'defects.x': d('ფოტოზე სად არის: 0 — მარცხენა კიდე, 100 — მარჯვენა.', 'Где на фото: 0 — левый край, 100 — правый.', 'Where on the photo: 0 — left edge, 100 — right.'),
  'defects.y': d('0 — ზედა კიდე, 100 — ქვედა.', '0 — верхний край, 100 — нижний.', '0 — top edge, 100 — bottom.'),
  completeness: d('აკლია თუ არა ნაწილები.', 'Все ли детали на месте.', 'Whether any parts are missing.'),
  hasBox: d('მონიშნე, თუ ორიგინალი ყუთიც მიჰყვება.', 'Отметьте, если есть оригинальная коробка.', 'Tick if the original box comes with it.'),
  hasManual: d('მონიშნე, თუ ინსტრუქციაც მიჰყვება.', 'Отметьте, если есть инструкция.', 'Tick if the manual comes with it.'),
  missingParts: d('ჩამოთვალე, რა აკლია.', 'Перечислите, чего не хватает.', 'List what is missing.'),
  tested: d('მონიშნე, თუ ჩართე და მუშაობს.', 'Отметьте, если включали и работает.', 'Tick if you switched it on and it works.'),
  cleanedAt: d('როდის გაიწმინდა და დეზინფიცირდა — მყიდველს ვაჩვენებთ.', 'Когда почищено и продезинфицировано — показываем покупателю.', 'When it was cleaned and disinfected — shown to the buyer.'),
  'gallery.image': d('საუკეთესოა ფონმოშორებული PNG — საიტზე ლამაზ ფონზე დადგება (ფოტოს ფორმაში „ფონი საიტზე“).', 'Лучше всего PNG без фона — на сайте встанет на красивый фон («Фон на сайте» в форме фото).', 'Best: a PNG with the background removed — it stands on a drawn backdrop (“Backdrop on the site”).'),
  'gallery.role': d('„მთავარი“ ბარათზე ჩანს; დანარჩენი — ნივთის გვერდის გალერეაში.', '«Главное» — на карточке; остальные — в галерее товара.', '“Main” shows on the card; the rest in the item’s gallery.'),
  price: d('რამდენად იყიდება. ცვლის მხოლოდ მეპატრონე.', 'Цена продажи. Меняет только владелец.', 'Selling price. Only the owner can change it.'),
  compareAtPrice: d('მხოლოდ აქციისას: ძველი ფასი გადახაზული გამოჩნდება.', 'Только для акции: старая цена будет зачёркнута.', 'Only for a sale: shown crossed out.'),
  stock: d('რომელ ფილიალში დევს და რამდენი. ერთი ცალისთვის — 1.', 'В каком филиале и сколько. Для одной штуки — 1.', 'Which branch holds it and how many. One piece — 1.'),
  'rental.enabled': d('ჩართე, თუ ნივთი ქირითაც გაიცემა — გამოჩნდება „ქირის“ გვერდზე.', 'Включите, если вещь сдаётся — появится на странице «Аренда».', 'Switch on if it is also rented out — it appears on the Rent page.'),
  'rental.dailyRate': d('ფასი ერთ დღეზე.', 'Цена за день.', 'Price per day.'),
  'rental.minDays': d('მინიმუმ რამდენი დღით.', 'Минимум дней.', 'Minimum days.'),
  'rental.maxDays': d('მაქსიმუმ რამდენი დღით.', 'Максимум дней.', 'Maximum days.'),
  'rental.buyoutAllowed': d('ქირის შემდეგ შეუძლია იყიდოს.', 'После аренды можно выкупить.', 'Can be bought after renting.'),
  weightGrams: d('მიწოდებისთვის, დაახლოებით.', 'Для доставки, примерно.', 'For delivery, roughly.'),
  lengthCm: d('შეფუთვის ზომა, დაახლოებით.', 'Размер упаковки, примерно.', 'Package size, roughly.'),
  fragile: d('მონიშნე, თუ ფრთხილი გადატანა სჭირდება.', 'Отметьте, если нужна аккуратная перевозка.', 'Tick if it needs careful handling.'),
  'seo.title': d('სათაური Google-ის შედეგებში. ცარიელი — ნივთის სახელი.', 'Заголовок в Google. Пусто — название товара.', 'Title in Google results. Empty — the item name.'),
  'seo.description': d('ტექსტი Google-ის შედეგებში. ცარიელი — მოკლე აღწერა.', 'Текст в Google. Пусто — краткое описание.', 'Text in Google results. Empty — the short description.'),
}

export const CATEGORY_HELP: Record<string, Desc> = {
  title: d('როგორც მყიდველი იცნობს: „რბილი სათამაშოები“, „კონსტრუქტორები“…', 'Как узнает покупатель: «Мягкие игрушки», «Конструкторы»…', 'As buyers know it: “Soft toys”, “Building sets”…'),
  description: d('ერთი წინადადება — კატეგორიის გვერდზე ჩანს.', 'Одно предложение — на странице категории.', 'One sentence — shown on the category page.'),
  parent: d('თუ ეს ქვეკატეგორიაა — აირჩიე მთავარი. ჩვეულებრივ ცარიელია.', 'Если это подкатегория — выберите главную. Обычно пусто.', 'If this is a subcategory, pick the main one. Usually empty.'),
  order: d('რიგი მთავარ გვერდზე და კატალოგში: პატარა რიცხვი — წინ.', 'Порядок на главной и в каталоге: меньше — раньше.', 'Order on the home page and catalogue: smaller comes first.'),
}

export const ORDER_HELP: Record<string, Desc> = {
  number: AUTO,
  reservedUntil: d('ამ დრომდე ნივთი მყიდველისთვისაა გადადებული; მერე თავისით ბრუნდება თაროზე.', 'До этого времени вещь отложена; потом сама вернётся на полку.', 'Held for the buyer until then; afterwards it goes back on sale by itself.'),
  name: d('მყიდველის სახელი.', 'Имя покупателя.', 'Buyer’s name.'),
  phone: d('WhatsApp / ზარისთვის.', 'Для WhatsApp / звонка.', 'For WhatsApp / calls.'),
  city: d('სად მიდის შეკვეთა.', 'Куда доставка.', 'Where it goes.'),
  delivery: d('როგორ მიიღებს: გატანა, კურიერი, ფოსტა, ავტობუსი.', 'Как получит: самовывоз, курьер, почта, автобус.', 'How it is handed over: pickup, courier, post, bus.'),
  payment: d('როგორ გადაიხდის.', 'Как заплатит.', 'How they pay.'),
  tracking: d('გზავნილის ნომერი, თუ ფოსტით გაიგზავნა — მყიდველს ვუგზავნით.', 'Трек-номер, если отправлено почтой — пересылаем покупателю.', 'Tracking number if sent by post — passed on to the buyer.'),
  total: d('ნივთების ჯამი ფასდაკლებამდე.', 'Сумма до скидки.', 'Sum before the discount.'),
  payable: d('რამდენი გადაიხადოს ჯილდოს ფასდაკლების შემდეგ.', 'К оплате после скидки по награде.', 'To pay after the reward discount.'),
  rewardCode: d('თამაშში მოგებული კოდი (ZOY-…), თუ მყიდველმა ჩაწერა.', 'Код из игры (ZOY-…), если покупатель ввёл.', 'The game code (ZOY-…), if the buyer entered one.'),
  locale: d('რა ენაზე წერს მყიდველი — მზა მესიჯები ამ ენაზე იხსნება.', 'На каком языке покупатель — готовые сообщения откроются на нём.', 'The buyer’s language — ready messages open in it.'),
  gift: d('საჩუქრად შეფუთვა.', 'Упаковать как подарок.', 'Gift wrapping.'),
  giftNote: d('ბარათზე დასაწერი ტექსტი.', 'Текст на открытке.', 'Text for the card.'),
  comment: d('მყიდველის კომენტარი.', 'Комментарий покупателя.', 'The buyer’s comment.'),
  notes: d('შიდა შენიშვნები — მყიდველი ვერ ხედავს.', 'Внутренние заметки — покупатель не видит.', 'Internal notes — the buyer never sees them.'),
}

export const LOCATION_HELP: Record<string, Desc> = {
  title: d('ფილიალის სახელი, მაგ. „ზოი თოი — ბათუმი“.', 'Название филиала.', 'Branch name.'),
  address: d('მისამართი — ჩანს კონტაქტის გვერდზე და გატანისას.', 'Адрес — на странице контактов и при самовывозе.', 'Address — on the Contact page and for pickup.'),
  hours: d('სამუშაო საათები, მაგ. „ყოველდღე 11:00–20:00“.', 'Часы работы.', 'Opening hours.'),
  mapUrl: d('Google Maps-ის ბმული.', 'Ссылка Google Maps.', 'Google Maps link.'),
  isPickupPoint: d('მონიშნე, თუ აქედან შეიძლება შეკვეთის გატანა.', 'Отметьте, если здесь можно забрать заказ.', 'Tick if orders can be picked up here.'),
  active: d('გამორთული ფილიალი საიტზე არ ჩანს.', 'Выключенный филиал не виден на сайте.', 'A switched-off branch is hidden on the site.'),
}

export const USER_HELP: Record<string, Desc> = {
  name: d('როგორ მივმართოთ — ჩანს ბოტში, ვინ დაადასტურა შეკვეთა.', 'Как обращаться — видно в боте, кто подтвердил заказ.', 'How to address them — shown in the bot next to actions.'),
  roles: d('„მეპატრონე“ — ყველაფერი. „თანამშრომელი“ — ნივთები, შეკვეთები და გაყიდვა, ფასსა და პარამეტრებს ვერ ცვლის.', '«Владелец» — всё. «Сотрудник» — товары, заказы и продажи, без цен и настроек.', '“Owner” — everything. “Staff” — items, orders and sales, not prices or settings.'),
}

export const CAMPAIGN_HELP: Record<string, Desc> = {
  title: d('მყიდველი ხედავს თამაშის გვერდზე და მთავარ გვერდზე, მაგ. „ზაფხულის დიდი თამაში“.', 'Покупатель видит на странице игры и на главной.', 'Shown on the Play page and the home page.'),
  active: d('ერთდროულად მოქმედებს ერთი კამპანია — ჩართულებიდან ბოლოს შეცვლილი.', 'Действует одна кампания — последняя изменённая из включённых.', 'One campaign runs at a time — the most recently edited active one.'),
  'tiers.minScore': d('რამდენი ქულიდან იძლევა ამ ფასდაკლებას.', 'С какого счёта даётся эта скидка.', 'From which score this discount is given.'),
  'tiers.percent': d('ფასდაკლება პროცენტებში (მაქს. 50).', 'Скидка в процентах (макс. 50).', 'Discount in percent (max 50).'),
  maxPercent: d('ამაზე მეტს ვერცერთი საფეხური ვერ მისცემს.', 'Больше этого не даст ни одна ступень.', 'No tier gives more than this.'),
  validityHours: d('რამდენ საათში იწურება მოგებული კოდი.', 'Через сколько часов истекает код.', 'Hours until a won code expires.'),
  attemptsPerDay: d('რამდენჯერ შეუძლია ერთ მოწყობილობას თამაში დღეში.', 'Сколько попыток в день у одного устройства.', 'Rounds per device per day.'),
  startsAt: d('ცარიელი — მაშინვე იწყება.', 'Пусто — начинается сразу.', 'Empty — starts right away.'),
  endsAt: d('ცარიელი — სანამ არ გამორთავ. მითითებული დღე მთლიანად ითვლება.', 'Пусто — пока не выключите. Указанный день считается целиком.', 'Empty — until switched off. The chosen day counts in full.'),
}

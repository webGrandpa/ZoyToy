/**
 * Development seed: shop settings, Batumi branch, categories and ten
 * example items in ka/ru/en with placeholder illustrations.
 *   pnpm seed            — fill an empty database
 *   pnpm seed fresh      — wipe catalogue data first
 * The local admin login comes from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in apps/web/.env; without a
 * password no login is created (hosted demo — see docs/09-deploy.md).
 */
import sharp from 'sharp'
import type { Payload } from 'payload'
import type { ToyKind } from '@zoytoy/ui/ToyArt'
import { payloadClient } from '../lib/payload'
import { toySvg } from './art'

type T3 = { ka: string; ru: string; en: string }
const LOCS = ['ru', 'en'] as const

const richText = (text: string) => ({
  root: { type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
    children: text.split('\n').map((t) => ({ type: 'paragraph', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const, textFormat: 0, children: [{ type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 }] })) },
})

const CATEGORIES: { slug: string; color: string; icon: ToyKind; order: number; title: T3; description: T3 }[] = [
  { slug: 'soft-toys', color: 'bubble', icon: 'teddy', order: 1, title: { ka: 'რბილი სათამაშოები', ru: 'Мягкие игрушки', en: 'Soft toys' }, description: { ka: 'დათუნიები, კურდღლები და სხვა ფუმფულა მეგობრები — გარეცხილი და გამშრალი.', ru: 'Мишки, зайцы и другие пушистые друзья — постиранные и высушенные.', en: 'Teddies, bunnies and other fluffy friends — washed and dried.' } },
  { slug: 'building', color: 'tangerine', icon: 'blocks', order: 2, title: { ka: 'კონსტრუქტორები', ru: 'Конструкторы', en: 'Building sets' }, description: { ka: 'ყველა ნაკრები დათვლილია — რაც აკლია, აღწერაშია.', ru: 'Каждый набор пересчитан — чего не хватает, указано в описании.', en: 'Every set is counted — anything missing is in the description.' } },
  { slug: 'vehicles', color: 'sky', icon: 'car', order: 3, title: { ka: 'მანქანები და ტრანსპორტი', ru: 'Машинки и транспорт', en: 'Cars & vehicles' }, description: { ka: 'მანქანები, მატარებლები, რაკეტები — შემოწმებული და მუშა.', ru: 'Машинки, поезда, ракеты — проверенные и рабочие.', en: 'Cars, trains, rockets — checked and working.' } },
  { slug: 'figures', color: 'grape', icon: 'rocket', order: 4, title: { ka: 'თოჯინები და ფიგურები', ru: 'Куклы и фигурки', en: 'Dolls & figures' }, description: { ka: 'კოლექციური და სათამაშო ფიგურები.', ru: 'Коллекционные и игровые фигурки.', en: 'Collectible and play figures.' } },
  { slug: 'board-games', color: 'mint', icon: 'puzzle', order: 5, title: { ka: 'სამაგიდო თამაშები და თავსატეხები', ru: 'Настольные игры и пазлы', en: 'Board games & puzzles' }, description: { ka: 'ყველა კარტი და ნაწილი ადგილზეა.', ru: 'Все карточки и детали на месте.', en: 'All cards and pieces present.' } },
  { slug: 'educational', color: 'sun', icon: 'blocks', order: 6, title: { ka: 'საგანმანათლებლო', ru: 'Развивающие', en: 'Educational' }, description: { ka: 'ანბანი, ციფრები, ლოგიკა — თამაშით სწავლა.', ru: 'Алфавит, цифры, логика — учимся играя.', en: 'Letters, numbers, logic — learning through play.' } },
  { slug: 'baby', color: 'mint', icon: 'duck', order: 7, title: { ka: 'ჩვილებისთვის', ru: 'Для малышей', en: 'Baby & toddler' }, description: { ka: 'ჟღარუნები, აბაზანის სათამაშოები, პირველი კუბიკები.', ru: 'Погремушки, игрушки для ванной, первые кубики.', en: 'Rattles, bath toys, first blocks.' } },
  { slug: 'outdoor', color: 'sky', icon: 'ball', order: 8, title: { ka: 'გარე თამაშები', ru: 'Для улицы', en: 'Outdoor' }, description: { ka: 'ბურთები, ქვიშის ნაკრებები და ზაფხულის გართობა.', ru: 'Мячи, наборы для песка и летние забавы.', en: 'Balls, sand sets and summer fun.' } },
]

type Seed = {
  slug: string; art: ToyKind; tint: 'sun' | 'bubble' | 'sky' | 'mint' | 'tangerine' | 'grape'; cats: string[]
  title: T3; short: T3; desc: T3; price: number; compareAt?: number; retail: number
  condition: 'new' | 'new_open_box' | 'like_new' | 'very_good' | 'good' | 'fair'
  ageMin: number; ageMax?: number; origin: 'usa' | 'europe'
  defects?: (T3 & { x: number; y: number })[]; notes?: T3; missing?: T3; hasBox?: boolean; batteries?: T3
  rental?: { dailyRate: number; deposit: number }; status?: 'published' | 'sold' | 'reserved'; daysAgo: number
}

const ITEMS: Seed[] = [
  {
    slug: 'kosmosuri-raketa', art: 'rocket', tint: 'sun', cats: ['vehicles', 'educational'], price: 45, retail: 120, condition: 'like_new', ageMin: 36, ageMax: 72, origin: 'usa', daysAgo: 1,
    title: { ka: 'კოსმოსური რაკეტა ხმით და შუქით', ru: 'Космическая ракета со звуком и светом', en: 'Space rocket with lights and sounds' },
    short: { ka: 'ღილაკზე დაჭერით რაკეტა „აფრინდება“: ანათებს და ითვლის 10-დან 0-მდე.', ru: 'По нажатию кнопки ракета «взлетает»: светится и ведёт отсчёт от 10 до 0.', en: 'Press the button and the rocket “launches”: it lights up and counts down from 10.' },
    desc: { ka: 'ამერიკიდან ჩამოტანილი რაკეტა თითქმის არ უთამაშიათ.\nხმა და შუქი მუშაობს, ელემენტები შეცვლილია.', ru: 'Ракета из США, в неё почти не играли.\nЗвук и свет работают, батарейки заменены.', en: 'Brought from the USA and barely played with.\nSound and lights work; batteries replaced.' },
    defects: [{ ka: 'მცირე ნაკაწრი მარცხენა ფრთაზე', ru: 'Небольшая царапина на левом крыле', en: 'Small scratch on the left fin', x: 37, y: 66 }],
    batteries: { ka: '3×AA, შედის', ru: '3×AA, входят в комплект', en: '3×AA, included' },
    rental: { dailyRate: 4, deposit: 45 },
  },
  {
    slug: 'pumpula-datunia', art: 'teddy', tint: 'bubble', cats: ['soft-toys', 'baby'], price: 18, retail: 55, condition: 'very_good', ageMin: 0, origin: 'europe', daysAgo: 2,
    title: { ka: 'ფუმფულა დათუნია, 30 სმ', ru: 'Плюшевый мишка, 30 см', en: 'Fluffy teddy bear, 30 cm' },
    short: { ka: 'რბილი, მსუბუქი და ჩასახუტებლად იდეალური. გარეცხილია 40°-ზე.', ru: 'Мягкий, лёгкий и идеальный для обнимашек. Постиран при 40°.', en: 'Soft, light and perfect for cuddles. Washed at 40°.' },
    desc: { ka: 'ევროპული წარმოების დათუნია ცისფერი ბაფთით.', ru: 'Мишка европейского производства с голубым бантом.', en: 'European-made teddy with a blue bow.' },
    defects: [{ ka: 'ბეწვი ოდნავ გაცვეთილია მუცელზე', ru: 'Мех слегка потёрт на животике', en: 'Fur slightly worn on the tummy', x: 50, y: 80 }],
  },
  {
    slug: 'anbanis-kubikebi', art: 'blocks', tint: 'mint', cats: ['educational', 'baby'], price: 28, compareAt: 35, retail: 35, condition: 'new', ageMin: 24, ageMax: 60, origin: 'europe', daysAgo: 3, hasBox: true,
    title: { ka: 'ანბანის ხის კუბიკები, 33 ასო', ru: 'Деревянные кубики с грузинским алфавитом, 33 буквы', en: 'Wooden Georgian alphabet blocks, 33 letters' },
    short: { ka: 'ქართული ანბანის ყველა ასო — ხის, უსაფრთხო საღებავით.', ru: 'Все буквы грузинского алфавита — дерево, безопасная краска.', en: 'Every letter of the Georgian alphabet — wood, child-safe paint.' },
    desc: { ka: 'ახალი, ქარხნულ შეფუთვაში.', ru: 'Новые, в заводской упаковке.', en: 'New, factory sealed.' },
  },
  {
    slug: 'sarbolo-manqana-7', art: 'car', tint: 'sky', cats: ['vehicles'], price: 22, retail: 70, condition: 'good', ageMin: 60, ageMax: 120, origin: 'usa', daysAgo: 4,
    title: { ka: 'სარბოლო მანქანა №7 დისტანციური მართვით', ru: 'Гоночная машинка №7 на радиоуправлении', en: 'Remote-control race car No. 7' },
    short: { ka: 'სწრაფი და გამძლე. პულტი შედის.', ru: 'Быстрая и прочная. Пульт в комплекте.', en: 'Fast and sturdy. Remote included.' },
    desc: { ka: 'ჩანს თამაშის კვალი, მაგრამ ყველაფერი მუშაობს.', ru: 'Видны следы игры, но всё работает.', en: 'Shows play wear, but everything works.' },
    defects: [
      { ka: 'ცვეთა წინა ბამპერზე', ru: 'Потёртость на переднем бампере', en: 'Wear on the front bumper', x: 20, y: 70 },
      { ka: 'ნომრის სტიკერი ოდნავ აშლილია', ru: 'Наклейка с номером слегка стёрта', en: 'Number sticker slightly faded', x: 52, y: 61 },
    ],
    batteries: { ka: 'მანქანა 4×AA, პულტი 2×AAA — არ შედის', ru: 'Машинка 4×AA, пульт 2×AAA — не входят', en: 'Car 4×AA, remote 2×AAA — not included' },
    rental: { dailyRate: 3, deposit: 22 },
  },
  {
    slug: 'abazanis-ikhvebi', art: 'duck', tint: 'sun', cats: ['baby'], price: 12, retail: 25, condition: 'new_open_box', ageMin: 6, ageMax: 36, origin: 'europe', daysAgo: 5, hasBox: true,
    title: { ka: 'აბაზანის იხვების ოჯახი (4 ცალი)', ru: 'Семейка утят для ванной (4 шт.)', en: 'Bath duck family (4 pcs)' },
    short: { ka: 'არ უთამაშიათ — მხოლოდ ყუთია გახსნილი.', ru: 'Не использовались — вскрыта только коробка.', en: 'Never used — only the box was opened.' },
    desc: { ka: 'მამა იხვი და სამი პატარა იხვის ჭუკი.', ru: 'Папа-утка и три утёнка.', en: 'A dad duck and three ducklings.' },
  },
  {
    slug: 'burti-zhgharuna', art: 'ball', tint: 'bubble', cats: ['baby', 'outdoor'], price: 8, retail: 20, condition: 'very_good', ageMin: 0, ageMax: 24, origin: 'europe', daysAgo: 6,
    title: { ka: 'ფერადი ბურთი-ჟღარუნა', ru: 'Яркий мяч-погремушка', en: 'Colourful rattle ball' },
    short: { ka: 'რბილი ბურთი შიგნით ჟღარუნით — პატარა ხელებისთვის.', ru: 'Мягкий мяч с погремушкой внутри — для маленьких ручек.', en: 'A soft ball with a rattle inside — for little hands.' },
    desc: { ka: 'დეზინფიცირებული.', ru: 'Продезинфицирован.', en: 'Disinfected.' },
  },
  {
    slug: 'khis-matarebeli', art: 'train', tint: 'mint', cats: ['vehicles', 'building'], price: 55, retail: 140, condition: 'good', ageMin: 36, ageMax: 96, origin: 'europe', daysAgo: 7,
    title: { ka: 'ხის მატარებელი ლიანდაგებით', ru: 'Деревянная железная дорога', en: 'Wooden train set with tracks' },
    short: { ka: '3 ვაგონი, 24 ლიანდაგი და ხიდი. მაგნიტური გადაბმა.', ru: '3 вагона, 24 рельса и мост. Магнитная сцепка.', en: '3 carriages, 24 track pieces and a bridge. Magnetic couplings.' },
    desc: { ka: 'კლასიკური ხის რკინიგზა, რომელიც სხვა მწარმოებლების ლიანდაგებთანაც თავსებადია.', ru: 'Классическая деревянная железная дорога, совместима с рельсами других производителей.', en: 'A classic wooden railway, compatible with other brands’ tracks.' },
    missing: { ka: '2 სწორი ლიანდაგი', ru: '2 прямых рельса', en: '2 straight track pieces' },
    defects: [{ ka: 'ლოკომოტივის საღებავი ოდნავ აქერცლილია', ru: 'Краска на паровозе слегка облупилась', en: 'Paint slightly chipped on the engine', x: 30, y: 52 }],
    rental: { dailyRate: 5, deposit: 55 },
  },
  {
    slug: 'tavsatekhi-zghvis-samkaro', art: 'puzzle', tint: 'sky', cats: ['board-games'], price: 10, retail: 30, condition: 'like_new', ageMin: 60, ageMax: 120, origin: 'usa', daysAgo: 8, hasBox: true,
    title: { ka: 'თავსატეხი „ზღვის სამყარო“, 100 ნაწილი', ru: 'Пазл «Морской мир», 100 деталей', en: '“Under the sea” puzzle, 100 pieces' },
    short: { ka: 'ყველა 100 ნაწილი დათვლილია.', ru: 'Все 100 деталей пересчитаны.', en: 'All 100 pieces counted.' },
    desc: { ka: 'ერთხელ აწყობილი, ყუთი კარგ მდგომარეობაშია.', ru: 'Собран один раз, коробка в хорошем состоянии.', en: 'Assembled once; the box is in good shape.' },
  },
  {
    slug: 'konstruqtori-tsikhe', art: 'blocks', tint: 'tangerine', cats: ['building'], price: 65, retail: 180, condition: 'very_good', ageMin: 72, ageMax: 144, origin: 'usa', daysAgo: 9, status: 'sold',
    title: { ka: 'კონსტრუქტორი „ციხე-სიმაგრე“, 500 დეტალი', ru: 'Конструктор «Крепость», 500 деталей', en: '“Castle” building set, 500 pieces' },
    short: { ka: 'ყველა დეტალი და ინსტრუქცია ადგილზეა.', ru: 'Все детали и инструкция на месте.', en: 'All pieces and the manual are included.' },
    desc: { ka: 'ციხე კოშკებით, ხიდით და 4 ფიგურით.', ru: 'Крепость с башнями, мостом и 4 фигурками.', en: 'A castle with towers, a drawbridge and 4 figures.' },
  },
  {
    slug: 'kosmonavtebis-nakrebi', art: 'rocket', tint: 'grape', cats: ['figures'], price: 16, retail: 40, condition: 'like_new', ageMin: 36, origin: 'usa', daysAgo: 10, status: 'reserved',
    title: { ka: 'ფიგურების ნაკრები „კოსმონავტები“, 6 ცალი', ru: 'Набор фигурок «Космонавты», 6 шт.', en: '“Astronauts” figure set, 6 pcs' },
    short: { ka: 'მოძრავი ხელ-ფეხით, 10 სმ თითოეული.', ru: 'С подвижными руками и ногами, по 10 см.', en: 'Posable arms and legs, 10 cm each.' },
    desc: { ka: 'იდეალურია რაკეტასთან ერთად სათამაშოდ.', ru: 'Идеально для игры вместе с ракетой.', en: 'Perfect for playing with the rocket.' },
  },
]

async function wipe(payload: Payload) {
  for (const collection of ['rewards', 'game-sessions', 'game-campaigns', 'orders', 'products', 'categories', 'locations', 'media'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
}

async function main() {
  const payload = await payloadClient()
  // `payload run` drops --flags, so the switch is a plain word: `pnpm seed fresh`
  const fresh = process.argv.includes('fresh') || process.env.SEED_FRESH === '1'
  if (fresh) await wipe(payload)
  const existing = await payload.count({ collection: 'categories' })
  if (existing.totalDocs && !fresh) {
    payload.logger.info('Catalogue already seeded — run `pnpm seed fresh` to rebuild.')
    process.exit(0)
  }

  // ---- admin (local development only) ----
  // A hosted database gets no seeded login: its owner creates the first account on /admin.
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@zoytoy.test'
  const password = process.env.SEED_ADMIN_PASSWORD
  if (password) {
    const users = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (!users.docs.length) {
      await payload.create({ collection: 'users', data: { email, password, name: 'Zoy Toy', roles: ['admin'] } })
      payload.logger.info(`Admin created: ${email}`)
    }
  } else {
    payload.logger.info('No SEED_ADMIN_PASSWORD — no admin seeded; create the first account on /admin.')
  }

  // ---- settings & branch ----
  await payload.updateGlobal({ slug: 'site-settings', locale: 'ka', data: { instagram: 'zoy.toy', season: 'auto' } })
  const loc = await payload.create({ collection: 'locations', locale: 'ka', data: { title: 'ზოი თოი — ბათუმი', city: 'ბათუმი', isPickupPoint: true, active: true } })
  await payload.update({ collection: 'locations', id: loc.id, locale: 'ru', data: { title: 'Zoy Toy — Батуми', city: 'Батуми' } })
  await payload.update({ collection: 'locations', id: loc.id, locale: 'en', data: { title: 'Zoy Toy — Batumi', city: 'Batumi' } })

  // ---- taxonomy ----
  const catId: Record<string, number> = {}
  for (const c of CATEGORIES) {
    const doc = await payload.create({ collection: 'categories', locale: 'ka', data: { slug: c.slug, color: c.color as never, icon: c.icon, order: c.order, title: c.title.ka, description: c.description.ka } })
    for (const l of LOCS) await payload.update({ collection: 'categories', id: doc.id, locale: l, data: { title: c.title[l], description: c.description[l] } })
    catId[c.slug] = doc.id
  }

  // ---- items ----
  for (const it of ITEMS) {
    const png = await sharp(Buffer.from(toySvg(it.art, it.tint))).png().toBuffer()
    const media = await payload.create({ collection: 'media', locale: 'ka', data: { alt: it.title.ka }, file: { data: png, mimetype: 'image/png', name: `${it.slug}.png`, size: png.length } })
    for (const l of LOCS) await payload.update({ collection: 'media', id: media.id, locale: l, data: { alt: it.title[l] } })

    const publishedAt = new Date(Date.now() - it.daysAgo * 86400000).toISOString()
    const doc = await payload.create({
      collection: 'products',
      locale: 'ka',
      data: {
        status: it.status ?? 'published',
        slug: it.slug,
        publishedAt,
        title: it.title.ka,
        shortDescription: it.short.ka,
        description: richText(it.desc.ka),
        categories: it.cats.map((s) => catId[s]),
        ageMinMonths: it.ageMin,
        ageMaxMonths: it.ageMax,
        origin: it.origin,
        condition: it.condition,
        conditionNotes: it.notes?.ka,
        defects: it.defects?.map((d) => ({ text: d.ka, x: d.x, y: d.y })),
        completeness: it.missing ? 'incomplete' : 'complete',
        missingParts: it.missing?.ka,
        hasBox: it.hasBox ?? false,
        tested: true,
        cleanedAt: new Date(Date.now() - (it.daysAgo + 1) * 86400000).toISOString(),
        batteries: it.batteries?.ka,
        gallery: [{ image: media.id, role: 'main' }],
        price: it.price,
        compareAtPrice: it.compareAt,
        retailPriceNew: it.retail,
        stock: [{ location: loc.id, qty: it.status === 'sold' ? 0 : 1 }],
        rental: it.rental ? { enabled: true, dailyRate: it.rental.dailyRate, deposit: it.rental.deposit, minDays: 1, maxDays: 30, buyoutAllowed: true } : { enabled: false },
      },
    })
    for (const l of LOCS) {
      const fresh = await payload.findByID({ collection: 'products', id: doc.id, locale: l, depth: 0 })
      await payload.update({
        collection: 'products',
        id: doc.id,
        locale: l,
        data: {
          title: it.title[l],
          shortDescription: it.short[l],
          description: richText(it.desc[l]),
          conditionNotes: it.notes?.[l],
          missingParts: it.missing?.[l],
          batteries: it.batteries?.[l],
          // array rows keep their ids; only the localized text changes
          defects: fresh.defects?.map((d, i) => ({ ...d, text: it.defects?.[i]?.[l] ?? d.text })),
        },
      })
    }
    payload.logger.info(`• ${it.title.en}`)
  }
  // ---- game campaign ----
  const camp = await payload.create({
    collection: 'game-campaigns',
    locale: 'ka',
    data: { title: 'ზოის დიდი თამაში', active: true, game: 'toy-drop', maxPercent: 50, validityHours: 48, attemptsPerDay: 3, tiers: [{ minScore: 150, percent: 10 }, { minScore: 300, percent: 20 }, { minScore: 450, percent: 30 }, { minScore: 600, percent: 50 }] },
  })
  await payload.update({ collection: 'game-campaigns', id: camp.id, locale: 'ru', data: { title: 'Большая игра Зои' } })
  await payload.update({ collection: 'game-campaigns', id: camp.id, locale: 'en', data: { title: 'Zoy’s big game' } })
  payload.logger.info('Seed complete.')
  process.exit(0)
}

// `payload run` exits as soon as the module finishes importing — keep it alive with top-level await.
await main().catch((err) => {
  console.error(err)
  process.exit(1)
})

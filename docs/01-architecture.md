# 01 — სისტემის არქიტექტურა

## 1. მთავარი გადაწყვეტილებები (მოკლედ)

| გადაწყვეტილება | არჩევანი | რატომ |
|----------------|----------|-------|
| ფრონტენდი | **Next.js (App Router) + TypeScript + React** | სწრაფი პირველი ჩატვირთვა და SEO (Google-ში „მეორადი LEGO ბათუმი“ ტიპის ძებნა); React-ის ეკოსისტემა ანიმაციისა და 3D-სთვის |
| ბექენდი + ადმინ პანელი | **Payload CMS 3** (იმავე Next.js აპლიკაციაში) | კოლექციის აღწერიდან ავტომატურად იქმნება CRUD ადმინკა, API, ავთენტიფიკაცია, როლები, მედია ჭრით (crop) და ფოკუსის წერტილით, ვერსიები, მრავალენოვნება |
| მონაცემთა ბაზა | **PostgreSQL** | ტრანზაქციები (გადახდა, უნიკალური ნივთის ჯავშანი); `EXCLUDE` შეზღუდვა გაქირავების თარიღების გადაფარვის ასაკრძალად |
| სტილები | **Tailwind CSS v4** + CSS ცვლადები (დიზაინ ტოკენები) | ტოკენები ერთ ადგილას, Figma-სთან სინქრონში |
| ანიმაცია | **Motion** (UI), **Rive** (მასკოტი), **Lottie** (After Effects ანიმაციები) | იხ. [05](05-design-system.md#5-მოძრაობა-motion) |
| 3D | **React Three Fiber**, მოდელები GLB (Blender) | მხოლოდ მთავარ გვერდზე, ზარმაცად |
| მინი-თამაშები | **PixiJS v8** / Canvas, ცალკე პაკეტში | იხ. [03](03-gamification.md) |
| ძებნა | **PostgreSQL full-text + pg_trgm** | ~1 000 ნივთზე და ათობით ათასზეც საკმარისია; >50 000-ზე ან ძებნის გაუმჯობესებისთვის → Meilisearch (ცალკე კონტეინერი, იგივე სერვერზე) |
| გადახდა | **BOG Payments API** და **TBC Checkout** ერთდროულად | ადაპტერის ინტერფეისი; ადმინში თითოეული ჩართვა/გამორთვა |
| ფაილები | **Cloudflare R2** (S3-თავსებადი) + Cloudflare CDN | 10 GB უფასოდ — ~1 000 ნივთის ფოტოებს სრულად ეტევა |
| ელფოსტა / SMS | **Resend** (უფასო ლიმიტი) + ადგილობრივი SMS პროვაიდერი | SMS — შესვლის კოდები და შეტყობინებები |
| თანამშრომლის შეტყობინება | **Telegram ბოტი** (უფასო) | ახალი ონლაინ შეკვეთა → მყისიერი შეტყობინება ტელეფონზე, რომ ნივთი თაროდან ჩამოიღონ, სანამ მაღაზიაში ვინმე იყიდის |
| ფონური დავალებები | Payload Jobs Queue | ქირის შეხსენებები, ჯილდოების ვადა, ჯავშნების გაუქმება |
| ჰოსტინგი | **ერთი VPS სერვერი + Docker Compose** | ყველაზე იაფი და პროგნოზირებადი; იხ. §7 |
| მონორეპო | **pnpm workspaces + Turborepo** | აპი, თამაშები, დიზაინ სისტემა ცალ-ცალკე პაკეტებად |

> **რატომ არა Shopify / WooCommerce?** გაქირავება (ეგზემპლარები, კალენდარი, დეპოზიტი), სერვერზე
> შემოწმებული თამაშის ფასდაკლება, მეორადის მდგომარეობის ველები და ქართული ბანკები ამ პლატფორმებზე ან
> შეზღუდულია, ან ფასიანი დანამატებით კეთდება; Shopify-ს ყოველთვიური გადასახადიც აქვს. დიზაინის თავისუფლებაც მცირეა.
>
> **რატომ არა Payload-ის ecommerce დანამატი?** ჯერ beta-შია. კომერციის ბირთვს (კალათა, შეკვეთა, ფასი)
> ჩვენ ვწერთ Payload-ის კოლექციებით — ასე სრული კონტროლი გვაქვს მეორადზე, ქირაზე და ფილიალებზე.

## 2. სისტემის სქემა

```
  ბრაუზერი (მობილური/დესკტოპი, PWA)                 ┌──────────── Cloudflare (უფასო) ───────────┐
  ┌──────────────────────────────┐                  │ DNS · CDN · HTTPS · R2 ფოტოები/ასეტები    │
  │ მაღაზია: Motion/Rive/Lottie  │──────────────────┤                                            │
  │ 3D სცენა (lazy) · თამაშები   │                  └──────────────────┬─────────────────────────┘
  └──────────────────────────────┘                                     │
  ┌──────────────────────────────┐        ┌─────────────────── VPS სერვერი (Docker Compose) ───────────────┐
  │ ადმინი (/admin) — ტელეფონიდანაც│──────▶│  Next.js + Payload: მაღაზია · /admin · /api · ფონური დავალებები │
  └──────────────────────────────┘        │  PostgreSQL (+ ყოველდღიური backup → R2)                          │
                                           └───────┬──────────────┬──────────────┬──────────────────────────┘
                                                   │              │              │
                                            BOG / TBC       SMS · Resend    Telegram ბოტი
                                         (webhook → /api)                   (შეკვეთის შეტყობინება)
```

Redis MVP-ში საჭირო არ არის: დროებითი ჯავშნები და ლიმიტები Postgres-ში ინახება (ასეთი ტრაფიკისთვის საკმარისია, და ერთი სერვისით ნაკლებია სამართავი).

## 3. რეპოზიტორიის სტრუქტურა

```
ZoyToy/
├─ apps/
│  └─ web/                         Next.js + Payload (ერთი აპი, ერთი დეპლოი)
│     ├─ src/app/(storefront)/[locale]/   მაღაზიის გვერდები
│     │   ├─ page.tsx · shop/ · c/[category]/ · f/[franchise]/ · p/[slug]/
│     │   ├─ play/[campaign]/ · cart/ · checkout/ · account/ · rent/ · delivery/
│     ├─ src/app/(payload)/admin/         ადმინ პანელი + საკუთარი ეკრანები (მაღაზიაში გაყიდვა, ქირის კალენდარი…)
│     ├─ src/app/api/                     webhooks (BOG, TBC), თამაშის API, Telegram
│     ├─ src/collections/ · src/globals/
│     ├─ src/domain/                      ბიზნეს-ლოგიკა (React-ისა და Payload-ისგან დამოუკიდებელი, ტესტებით)
│     │   ├─ pricing/  inventory/  rental/  games/  promo/  delivery/
│     │   └─ payments/                    bog.ts · tbc.ts · fake.ts (ერთი ინტერფეისი)
│     ├─ src/media/                       ფოტოების დამუშავება (ზომები, EXIF, ფონის მოცილება)
│     └─ src/jobs/
├─ packages/
│  ├─ ui/                 დიზაინ სისტემა (ტოკენები, კომპონენტები, Storybook)
│  ├─ games/              მინი-თამაშები
│  ├─ game-protocol/      საერთო ტიპები/სქემები კლიენტისა და სერვერისთვის
│  └─ config/
├─ infra/                docker-compose.yml, Caddy/Nginx, backup სკრიპტები
├─ design/               კონცეფცია, ასეტების წყაროები (Git LFS)
└─ docs/
```

## 4. მონაცემთა მოდელი

მომხმარებლისთვის ხილული ტექსტები **ლოკალიზებულია** (ka/en, შემდეგ ru). ფული — **თეთრებში (integer)**.

### 4.1 კატალოგი და მარაგი

```
Product   (ერთი „ლისტინგი“ — მეორადისთვის ხშირად ერთი უნიკალური ნივთი)
  id, sku (ZT-000123 — ბეჭდვადი QR ეტიკეტისთვის), slug, status: draft | published | sold | archived
  title*, shortDescription*, description*
  brand → Brand, franchises → Franchise[], categories → Category[], tags → Tag[]
  ageMin, ageMax (თვეებში)
  origin: usa | europe | other              ← „ამერიკიდან და ევროპიდან“

  ── მდგომარეობა (მეორადი) ──
  condition: new | new_open_box | like_new | very_good | good | fair
  conditionNotes*                            („მცირე ნაკაწრი ფეხზე“)
  defects[]: { text*, photo → Media }
  completeness: complete | incomplete, missingParts*, hasBox, hasManual
  tested: bool (მუშაობს — ელემენტიანი/ხმოვანი სათამაშოებისთვის), batteries: string?
  cleanedAt: date                            („გაწმენდილია“ ბეჯი)
  retailPriceNew?                            („ახლის ფასი დაახლ. X ₾“ — დაზოგვის საჩვენებლად)

  media[]: { image → Media, alt*, role: main | gallery | detail | defect | scale }
  safety: { warnings*, smallParts: bool }
  specs[]: { label*, value* }
  shipping: { weightGrams, lengthCm, widthCm, heightCm, fragile: bool }   ← ფოსტის ტარიფისთვის

  sale:   { enabled, price, compareAtPrice? }
  rental: { enabled, dailyRate, deposit, minDays, maxDays, buyoutAllowed }  (დეტალები — 02)
  seo, badges, createdAt, publishedAt, soldAt

StockLevel   { product → Product, location → Location, qty, reserved }   ← ფილიალების მიხედვით
Location     { title*, address*, city, phone, hours*, isPickupPoint, active }   (MVP-ში: ბათუმი)
StockMovement{ product, location, delta, reason: online_order | store_sale | return | adjustment | rental_out | rental_in,
               order?, actor, at }      ← ყველა ცვლილების ისტორია

Category, Franchise (მხოლოდ ტექსტი + საკუთარი ფოტო, ლოგოს გარეშე), Brand, Tag
Media  (Payload upload: crop, focalPoint, sizes, blurHash; EXIF/GPS წაშლილი; cutout? — ფონმოცილებული ვერსია)
```

**უნიკალური ნივთის სასიცოცხლო ციკლი:** `published` → (ონლაინ შეკვეთა ან მაღაზიაში გაყიდვა) → `sold`.
გაყიდული ნივთის გვერდი 30 დღე ჩანს „გაყიდულია“ ნიშნით + მსგავსი ნივთებით (Google-იდან შემოსული მყიდველი არ იკარგება), შემდეგ `archived`.

### 4.2 გაქირავება (დეტალურად — [02](02-rental.md))

```
InventoryUnit { product → Product, code, location → Location, condition, status, notes, photos[], rentCount }
Rental        { number, customer → User, unit, product, period [start, end), bufferUntil, days,
                dailyRate, rentTotal, deposit, depositPaymentId, deductions[]: { kind: late|damage|loss|cleaning, amount, note, photos[] },
                refundAmount, refundPaymentId, status, handoverPhotos[], returnPhotos[], checklist, order → Order }
```

### 4.3 კომერცია

```
User         { phone (დადასტურებული, უნიკალური), email?, name, roles: customer|staff|manager|admin,
               addresses[], marketingConsent, consentAt, locale, verifiedAt }
Cart         { user? | deviceId, items[], appliedRewards[], expiresAt }
Order        { number (ZT-2026-000123), customer?, guestContact?, items → OrderItem[],
               subtotal, discountTotal, deliveryFee, deliveryFeeMode, total, currency: GEL,
               status: pending_payment|paid|processing|ready_for_pickup|shipped|delivered|cancelled|refunded,
               delivery: { method → DeliveryMethod, address?, city, pickupLocation?, tracking?: { carrier, number, driverPhone?, eta? } },
               payment: { method: card_bog|card_tbc|cash_on_pickup }, payments → Payment[], history[] }
OrderItem    { order, product, kind: sale|rental, qty, unitPrice, discount, rental?, snapshot }
Payment      { order|rental, provider: bog|tbc|cash, providerId, kind: charge|refund, amount, status, raw, createdAt }
DeliveryMethod { title*, kind: pickup|batumi_courier|georgian_post|bus|other, feeMode: fixed|by_zone|by_weight|pay_carrier_on_receipt|free,
                 fee?, zones[]?, weightTable[]?, freeFrom?, etaText*, allowsRental: bool, allowsCashOnDelivery: bool, active, order }
```

### 4.4 ფასდაკლებები და გემიფიკაცია (დეტალურად — [03](03-gamification.md))

```
GameCampaign { title*, slug, gameType, config, skin, targets: { products[], categories[], franchises[], all },
               appliesTo: sale (MVP-ში ფიქსირებული), rewardTiers[], maxDiscountPercent (≤ გლობალური 50%), maxDiscountAmount?,
               rewardValidityHours, limits, schedule, status, autoEndWhenTargetsSold: true }
GameSession  { campaign, deviceId, user?, seed, startedAt, finishedAt, score, events, verdict, reasons[] }
Reward       { code, deviceId, user? (მიება გამოყენებისას), phone?, campaign, session, scope, discount, expiresAt,
               status: issued | claimed | redeemed | expired | revoked, order? }
Coupon       { code, type: percent|fixed|free_delivery, value, scope, usageLimit, perUserLimit, startsAt, endsAt, minOrderTotal }
```

### 4.5 კონტენტი და სისტემა

```
Page { blocks[] }  ·  Globals: SiteSettings, Navigation, RentalRules, PromoSettings (გლობალური მაქს. 50%), Legal
AuditLog { actor, action, collection, docId, diff, at }
Wishlist { user, products[] }
TradeInRequest (ფაზა 2: „მოგვყიდე შენი სათამაშო“) { name, phone, photos[], description, status, offer }
```

## 5. მნიშვნელოვანი ნაკადები

### 5.1 ყიდვა
1. კალათაში დამატება → **რბილი ჯავშანი** 15 წუთით (`StockLevel.reserved`). უნიკალური ნივთი ამ დროს სხვისთვის „ვიღაცის კალათაშია“ სტატუსით ჩანს.
2. Checkout → სერვერი თავიდან ითვლის ფასს, მიწოდებას, ფასდაკლებას.
3. მომხმარებელი ირჩევს **„ბარათით გადახდა“**-ს. თუ ორივე ბანკი ჩართულია: ნაგულისხმევად ერთი ძირითადი პროვაიდერი (ადმინის პარამეტრი), სურვილისამებრ „გადაიხადე TBC-ით / BOG-ით“ — ზოგს საკუთარი ბანკის გვერდი ურჩევნია, ბანკის სპეციალური აქციების გამოც.
4. იქმნება `Order(pending_payment)` → ბანკის გვერდი → **webhook** → სტატუსის გადამოწმება ბანკის API-ით → `paid` → მარაგი ჩამოიწერება, ჯილდო → `redeemed`.
5. **მყისიერად:** Telegram შეტყობინება მაღაზიას („📦 ახალი შეკვეთა: ZT-000123 ლეგოს ციხე — თაროდან ჩამოიღე“) + SMS მყიდველს.
6. ნაღდით გადახდა გატანისას (`cash_on_pickup`): შეკვეთა იქმნება `processing` სტატუსით, ნივთი იჯავშნება 48 სთ-ით.

**ერთდროული გაყიდვის დაცვა** (ონლაინ vs მაღაზია): ადმინის „მაღაზიაში გაიყიდა“ ეკრანი აჩვენებს, თუ ნივთი ონლაინ არის დაჯავშნილი ან გადახდილი, და ასეთ შემთხვევაში გაყიდვას ბლოკავს (ან ითხოვს დადასტურებას + ონლაინ შეკვეთის გაუქმებას და თანხის დაბრუნებას).

### 5.2 მიწოდება

| მეთოდი | ფასის რეჟიმი | როგორ მუშაობს | ქირა? |
|--------|-------------|---------------|-------|
| **გატანა ბათუმის მაღაზიიდან** | უფასო | „მზადაა გასატანად“ SMS; გადახდა ონლაინ ან ადგილზე | ✅ |
| **კურიერი ბათუმში** (Glovo / Wolt / საკუთარი) | ფიქსირებული ან ზონით | MVP-ში მეპატრონე ხელით იძახებს კურიერს და ადმინში წერს სტატუსს; API ინტეგრაცია მოგვიანებით, თუ მოცულობა გაიზრდება | ✅ |
| **საქართველოს ფოსტა** | წონით/ზონით (ცხრილი ადმინში) | ადმინში — თრექინგის ნომერი → მყიდველს SMS ბმულით | ❌ (რეკომ.) |
| **ავტობუსით რეგიონებში** | „მიწოდებას გადაიხდი მიღებისას“ ან ფიქსირებული (ღია კითხვა) | მყიდველი ირჩევს ქალაქს; მეპატრონე უთანხმდება მძღოლს და ადმინში წერს მძღოლის ტელეფონს, ავტობუსის გასვლის/ჩასვლის დროს → მყიდველს SMS | ❌ (რეკომ.) |

ამიტომ თითოეულ პროდუქტს **წონა და ზომები** სჭირდება (ფოსტის ტარიფისთვის). ადმინში შეიძლება ნაგულისხმევი მნიშვნელობები კატეგორიის მიხედვით.

### 5.3 გაქირავება — [02](02-rental.md) · 5.4 თამაში → ფასდაკლება — [03](03-gamification.md#4-სესიის-ნაკადი-და-თაღლითობისგან-დაცვა)

## 6. API (ძირითადი)

| მეთოდი | გზა | დანიშნულება |
|--------|-----|-------------|
| GET | `/api/catalog/search` | ძებნა + ფილტრები (ფასეტებით) |
| GET | `/api/rental/availability?product=&from=&to=` | თავისუფალი დღეები |
| POST | `/api/checkout` | შეკვეთის შექმნა + გადახდის ბმული (bog / tbc) |
| POST | `/api/payments/webhook/bog`, `/tbc` | ბანკის შეტყობინებები |
| POST | `/api/auth/otp/request`, `/verify` | SMS კოდი |
| POST | `/api/games/session`, `/session/:id/finish` | თამაში |
| POST | `/api/games/reward/:code/claim` | ჯილდოს ანგარიშზე მიბმა (OTP-ის შემდეგ) |
| POST | `/api/admin/store-sale` | მაღაზიაში გაყიდვა (staff) |
| POST | `/api/telegram/webhook` | ბოტის ბრძანებები (მაგ. „ნივთი ჩამოღებულია“) |

## 7. ჰოსტინგი და ხარჯები

> საწყის ვერსიაში ჰოსტინგი უფასოა (Netlify + Neon + Cloudflare R2) — იხ. [08 §2](08-lite-mvp.md#2-უფასო-ინფრასტრუქტურა). ქვემოთ — სრული ვერსიის ვარიანტი.

**რატომ არ არის საკმარისი მხოლოდ დომენი:** დომენი (`zoytoy.ge`, ~30–40 ₾/წელი) მხოლოდ **მისამართია**.
საიტს დამატებით სჭირდება **სერვერი**, რომელიც 24/7 მუშაობს (აპლიკაცია + მონაცემთა ბაზა), **ფოტოების საცავი**,
ელფოსტა და SMS. ქვემოთ — ყველაზე იაფი სანდო ვარიანტი:

| რა | სერვისი | ფასი (დაახლ.) |
|----|---------|---------------|
| დომენი | `.ge` რეგისტრატორი | 30–40 ₾ / წელი |
| სერვერი (აპი + Postgres) | Hetzner Cloud VPS (2 vCPU, 4 GB RAM) + ავტომატური snapshot | ~5–8 € / თვე (≈ 15–25 ₾) |
| CDN, HTTPS, DNS | Cloudflare (უფასო გეგმა) | 0 ₾ |
| ფოტოების საცავი | Cloudflare R2 (10 GB უფასოდ) | 0 ₾ (~1 000 ნივთზე) |
| ელფოსტა | Resend (უფასო: 3 000 წერილი/თვე) | 0 ₾ |
| Telegram ბოტი | — | 0 ₾ |
| SMS | ადგილობრივი პროვაიდერი | გადახდა შეტყობინებაზე (თითო რამდენიმე თეთრი); მცირე მოცულობაზე რამდენიმე ლარი/თვე |
| ბანკის საკომისიო | BOG / TBC | ტრანზაქციის %, ბანკთან შეთანხმებით |
| **სულ** | | **≈ 20–35 ₾ / თვე** + დომენი + SMS + ბანკის % |

**სერვერის სიმძლავრე:** 1 000 ნივთზე და დღეში ათასობით ვიზიტზე ეს სერვერი საკმარისია. ზრდისას — იმავე პროვაიდერთან ერთი დაწკაპუნებით უფრო დიდ გეგმაზე გადასვლა.

**რატომ არა Vercel-ის უფასო გეგმა:** უფასო (Hobby) გეგმა მხოლოდ არაკომერციული პროექტებისთვისაა; კომერციულს Pro გეგმა სჭირდება (~$20/თვე) + ცალკე მონაცემთა ბაზა.

ოპერაციები: Docker Compose (`app`, `postgres`, `caddy` — ავტომატური HTTPS), Postgres-ის ყოველდღიური backup → R2 (30 დღე), uptime მონიტორი (უფასო), Sentry (უფასო ლიმიტი), GitHub Actions → დეპლოი სერვერზე.

## 8. უსაფრთხოება

- ფასი, ფასდაკლება, მიწოდება — **მხოლოდ სერვერზე** ითვლება.
- თამაშის შედეგი არასოდეს ითვლება სანდოდ — [03 §4](03-gamification.md#4-სესიის-ნაკადი-და-თაღლითობისგან-დაცვა).
- ადმინი: როლები, 2FA ადმინისთვის, AuditLog.
- Rate limit: OTP (ნომერზე/IP-ზე), შესვლა, თამაშის სესია, checkout.
- Webhook: ხელმოწერა/სტატუსის ხელახალი მოთხოვნა ბანკის API-დან, იდემპოტენტურობა.
- ბარათის მონაცემები ჩვენთან არ მოდის (ბანკის გვერდი).
- ფოტოებიდან EXIF/GPS წაშლა; ატვირთვის ტიპის/ზომის შემოწმება.

## 9. სიჩქარე (performance budget)

| რესურსი | ლიმიტი |
|---------|---------|
| მთავარი გვერდის საწყისი JS (gzip) | ≤ 180 KB |
| 3D სცენა | ≤ 2.5 MB, მხოლოდ ძლიერ მოწყობილობაზე, გვერდის ინტერაქტიულობის შემდეგ |
| ერთი მინი-თამაში | ≤ 1.5 MB |
| Rive/Lottie | ≤ 150 KB თითოეული |
| ბარათის სურათი | AVIF/WebP ≤ 40 KB |
| LCP / INP / CLS (მობილური) | < 2.5 წმ / < 200 მწმ / < 0.1 |

## 10. ხარისხი

- **ტესტები:** Vitest — `domain/` (ფასი, მიწოდება, ხელმისაწვდომობა, დეპოზიტის გამოთვლა, ქულის ვალიდაცია); Playwright — ყიდვა, ქირა, თამაში→ფასდაკლება→გადახდა, მაღაზიაში გაყიდვა vs ონლაინ შეკვეთა.
- **CI:** lint, typecheck, ტესტები, Lighthouse CI.
- **გარემოები:** local (Docker) → staging (იგივე სერვერზე, ბანკების სატესტო გასაღებებით) → production.
- **მიგრაციები:** Payload/Drizzle მიგრაციები Git-ში; production-ზე მხოლოდ მიგრაციით.

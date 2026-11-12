import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import { ru } from '@payloadcms/translations/languages/ru'
import { ka } from './i18n/admin/ka'
import { kaLexical } from './i18n/admin/lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { CAMPAIGN_HELP, CATEGORY_HELP, describe, LOCATION_HELP, ORDER_HELP, PRODUCT_HELP, USER_HELP } from './lib/help'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Locations } from './collections/Locations'
import { Orders } from './collections/Orders'
import { StoreSales } from './collections/StoreSales'
import { GameCampaigns, GameSessions, Rewards } from './collections/Games'
import { SiteSettings } from './globals/SiteSettings'
import { LOCALES, DEFAULT_LOCALE } from './i18n/config'
import { withGlobalRefresh, withRefresh } from './lib/refresh'
import { telegramEndpoints } from './endpoints/telegram'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

function isLocalDatabase(url?: string) {
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url ?? '').hostname)
  } catch {
    return false
  }
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    theme: 'light',
    // day.month.year and 24-hour time, as people write dates in Georgia (not „November 12th 2026, 6:39 AM“)
    dateFormat: 'dd.MM.yyyy, HH:mm',
    meta: { titleSuffix: ' — Zoy Toy', icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' }] },
    components: {
      graphics: { Logo: '/components/admin/AdminBrand#AdminLogo', Icon: '/components/admin/AdminBrand#AdminIcon' },
      providers: ['/components/admin/AdminTheme#AdminTheme'],
      // phone-first quick actions above the collection list (the owner runs the shop from a phone)
      beforeDashboard: ['/components/admin/AdminHome#AdminHome'],
      afterNavLinks: ['/components/admin/NavExtra#NavExtra', '/components/admin/AdminLang#AdminLang'],
      // the counter (scan a label → sold) and printable QR labels — docs/04 „მაღაზიაში გაყიდვა“
      views: {
        storeSale: { Component: '/components/admin/StoreSaleView#StoreSaleView', path: '/store-sale', exact: true },
        labels: { Component: '/components/admin/Labels#LabelsView', path: '/labels', exact: true },
      },
    },
  },
  // Admin UI languages: Georgian (our own translation, src/i18n/admin), Russian, English.
  // Payload's types list only built-in languages; the runtime accepts any key, so the Georgian pack is cast in.
  // `translations.ka.lexical`: the rich-text editor's own strings in Georgian (i18n/admin/lexical.ts)
  i18n: { supportedLanguages: { ka, ru, en } as never, fallbackLanguage: 'ka' as never, translations: { ka: { lexical: kaLexical } } as never },
  // Content languages: every text the customer sees exists in ka / ru / en.
  localization: {
    locales: LOCALES.map((code) => ({ code, label: { ka: 'ქართული', ru: 'Русский', en: 'English' }[code] })),
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  // everything the storefront shows refreshes the cached pages on save (lib/refresh.ts); orders reach
  // the shop through the products they reserve, so they need no hook of their own
  // describe(): the owner-facing help under every field (lib/help.ts)
  collections: [
    describe(Orders, ORDER_HELP),
    StoreSales,
    ...[describe(Products, PRODUCT_HELP), describe(Categories, CATEGORY_HELP), Media, describe(Locations, LOCATION_HELP), describe(GameCampaigns, CAMPAIGN_HELP)].map(withRefresh),
    Rewards,
    GameSessions,
    describe(Users, USER_HELP),
  ],
  globals: [withGlobalRefresh(SiteSettings)],
  // Telegram bot webhook, its call button, and the daily job (expired reservations + morning digest)
  endpoints: telegramEndpoints,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  // Local development pushes schema changes straight into the database. Hosted databases only change
  // through migrations (src/migrations): `pnpm payload migrate:create <name>` after every schema change;
  // the Vercel build runs `payload migrate` before `next build` (apps/web/scripts/vercel-build.sh).
  // Push is switched off for any non-local database, so a script run without NODE_ENV=production
  // can never rewrite a hosted schema behind the migrations' back.
  db: postgresAdapter({
    // pg already treats Neon's sslmode=require as verify-full but warns on every cold start that the next
    // major version will weaken it — spelling out verify-full keeps today's strict check and a quiet log
    pool: { connectionString: (process.env.DATABASE_URL || '').replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/, '$1verify-full') },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: isLocalDatabase(process.env.DATABASE_URL) ? undefined : false,
  }),
  plugins: [
    // Photos: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (hosting has no writable disk), apps/web/media
    // otherwise. The admin's browser uploads straight to Blob, so full-size phone photos skip Vercel's
    // 4.5 MB request limit; the server still makes the thumb/card/large sizes. Files are public and are
    // served from the Blob CDN. `alwaysInsertFields` keeps the media table identical in both setups,
    // so migrations made locally match production.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
      collections: { media: { prefix: 'media', disablePayloadAccessControl: true } },
      clientUploads: true,
      alwaysInsertFields: true,
    }),
  ],
  sharp,
})

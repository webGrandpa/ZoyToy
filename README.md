# Zoy Toy

Online shop for **Zoy Toy** (Batumi): mostly pre-loved toys from the USA and Europe, rentals, and mini-games that
win discounts. Planning and design live in [docs/](docs/README.md) (Georgian); the visual concept is in
[design/concept/](design/concept/index.html).

## Stack

| Part | Choice |
|------|--------|
| Storefront + admin | Next.js 16 (App Router) + Payload CMS 3 in one app — `apps/web` |
| Database | PostgreSQL (local Homebrew/Docker; production: Neon free tier) |
| Design system | `packages/ui` — tokens, shared CSS, toy illustrations, Zoy the giraffe |
| Languages | Georgian (default), Russian, English — `/ka`, `/ru`, `/en` |
| Monorepo | pnpm workspaces + Turborepo |

## Run locally

```bash
pnpm install
# Postgres must be running; create the database once:
createdb zoytoy
cp apps/web/.env.example apps/web/.env   # fill DATABASE_URL, PAYLOAD_SECRET, SEED_ADMIN_PASSWORD
pnpm seed                                # example catalogue in ka/ru/en + local admin
pnpm dev                                 # http://localhost:3000 → /ka, admin at /admin
```

`pnpm --filter @zoytoy/web seed fresh` rebuilds the example catalogue.

## If it does not start

| Message | Fix |
|---------|-----|
| `Missing packageManager field` | Pull the latest `package.json` (it pins `pnpm@12.15.0`) |
| `ECONNREFUSED 127.0.0.1:5432` / database errors | Postgres is not running: `brew services start postgresql@16` (or `pg_ctl -D /opt/homebrew/var/postgresql@16 start`) |
| `Port 3000 is in use` | Another dev server is already running — open http://localhost:3000 or stop it first |
| Empty shop | Run `pnpm seed` once |

## Useful commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm --filter @zoytoy/web typecheck` | TypeScript check |
| `pnpm --filter @zoytoy/web test:int` | Unit/integration tests (Vitest) |
| `pnpm --filter @zoytoy/web generate:types` | Regenerate `payload-types.ts` after changing collections |
| `pnpm --filter @zoytoy/web payload migrate:create <name>` | **After every schema change:** migration for hosted databases (`apps/web/src/migrations`) |
| `vercel deploy --prod` (repo root) | Update the demo on Vercel — setup and rules in [docs/09](docs/09-deploy.md) |

## Where things are

```
apps/web/src/
  app/(frontend)/[locale]/   storefront pages (home, shop, product, play, rent)
  app/(payload)/             admin panel and REST/GraphQL API
  collections/ globals/      data model (products with second-hand condition fields, categories, branches…)
  components/                storefront components (mascot, stories, product card, gallery, buy/rent…)
  i18n/                      interface texts: messages-ka.ts (source), messages-ru.ts, messages-en.ts
  lib/                       data access, access rules, slugs, season logic, contact links
  seed/                      example data
packages/ui/src/             tokens.css, components.css, ToyArt.tsx, Giraffe.tsx
```

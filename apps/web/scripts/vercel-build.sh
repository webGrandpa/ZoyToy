#!/bin/sh
# Vercel build command (apps/web/vercel.json).
# 1. database migrations  2. the demo catalogue, only when asked for one deploy:
#    `vercel deploy --prod --build-env SEED_DEMO=1` (skips itself if the shop already has categories)
# 3. production builds with a Telegram bot token: point the bot's webhook at this site (never fails the build)
# 4. the Next.js build. NODE_ENV=production keeps Payload from pushing schema changes outside migrations.
set -e
export NODE_ENV=production
pnpm payload migrate
if [ "$SEED_DEMO" = "1" ]; then
  SEED_ADMIN_PASSWORD= pnpm seed
fi
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ "$VERCEL_ENV" = "production" ]; then
  pnpm exec tsx scripts/telegram-setup.ts || echo "Telegram setup failed — the site still deploys; rerun it by hand (docs/09)"
fi
pnpm build

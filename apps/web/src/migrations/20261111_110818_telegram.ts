import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "telegram_chat_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "telegram_digest" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "telegram_digest_at" timestamp(3) with time zone;
  ALTER TABLE "site_settings_locales" ADD COLUMN "msg_confirmed" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "msg_payment" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "msg_pickup" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "msg_shipped" varchar;
  ALTER TABLE "site_settings_locales" ADD COLUMN "msg_cancelled" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "telegram_chat_id";
  ALTER TABLE "site_settings" DROP COLUMN "telegram_digest";
  ALTER TABLE "site_settings" DROP COLUMN "telegram_digest_at";
  ALTER TABLE "site_settings_locales" DROP COLUMN "msg_confirmed";
  ALTER TABLE "site_settings_locales" DROP COLUMN "msg_payment";
  ALTER TABLE "site_settings_locales" DROP COLUMN "msg_pickup";
  ALTER TABLE "site_settings_locales" DROP COLUMN "msg_shipped";
  ALTER TABLE "site_settings_locales" DROP COLUMN "msg_cancelled";`)
}

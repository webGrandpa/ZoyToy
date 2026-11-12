import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_backdrop" AS ENUM('auto', 'sun', 'bubble', 'mint', 'sky', 'grape', 'tangerine');
  CREATE TYPE "public"."enum_media_scene" AS ENUM('halo', 'stars', 'plain');
  ALTER TABLE "media" ADD COLUMN "backdrop" "enum_media_backdrop" DEFAULT 'auto';
  ALTER TABLE "media" ADD COLUMN "scene" "enum_media_scene" DEFAULT 'halo';
  ALTER TABLE "media" ADD COLUMN "cutout" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "sizes_tile_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_tile_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_tile_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_tile_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_tile_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_tile_filename" varchar;
  CREATE INDEX "media_sizes_tile_sizes_tile_filename_idx" ON "media" USING btree ("sizes_tile_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_sizes_tile_sizes_tile_filename_idx";
  ALTER TABLE "media" DROP COLUMN "backdrop";
  ALTER TABLE "media" DROP COLUMN "scene";
  ALTER TABLE "media" DROP COLUMN "cutout";
  ALTER TABLE "media" DROP COLUMN "sizes_tile_url";
  ALTER TABLE "media" DROP COLUMN "sizes_tile_width";
  ALTER TABLE "media" DROP COLUMN "sizes_tile_height";
  ALTER TABLE "media" DROP COLUMN "sizes_tile_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_tile_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_tile_filename";
  DROP TYPE "public"."enum_media_backdrop";
  DROP TYPE "public"."enum_media_scene";`)
}

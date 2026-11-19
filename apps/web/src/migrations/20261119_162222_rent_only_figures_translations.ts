import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categories_figures" AS ENUM('bunny', 'kitty', 'teddy', 'heart', 'elephant', 'octopus', 'brick2', 'tower', 'blocks', 'arch', 'brick4', 'roof', 'bus', 'plane', 'car', 'boat', 'train', 'copter', 'rocket', 'dino', 'doll', 'robot', 'unicorn', 'hero', 'matryoshka', 'pawn', 'cards', 'puzzle', 'dice', 'knight', 'cube', 'crayons', 'book', 'abacus', 'globe', 'magnifier', 'sorter', 'rings', 'rattle', 'duck', 'bottle', 'pacifier', 'sleepystar', 'frisbee', 'kite', 'ball', 'bucket', 'spade', 'scooter');
  CREATE TYPE "public"."enum_categories_hero_figure" AS ENUM('bunny', 'kitty', 'teddy', 'heart', 'elephant', 'octopus', 'brick2', 'tower', 'blocks', 'arch', 'brick4', 'roof', 'bus', 'plane', 'car', 'boat', 'train', 'copter', 'rocket', 'dino', 'doll', 'robot', 'unicorn', 'hero', 'matryoshka', 'pawn', 'cards', 'puzzle', 'dice', 'knight', 'cube', 'crayons', 'book', 'abacus', 'globe', 'magnifier', 'sorter', 'rings', 'rattle', 'duck', 'bottle', 'pacifier', 'sleepystar', 'frisbee', 'kite', 'ball', 'bucket', 'spade', 'scooter');
  CREATE TABLE "categories_figures" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_categories_figures",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "products_defects_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "products_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "_products_v_version_defects_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "version_title" DROP NOT NULL;
  ALTER TABLE "categories_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "media_locales" ALTER COLUMN "alt" DROP NOT NULL;
  ALTER TABLE "locations_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "locations_locales" ALTER COLUMN "city" DROP NOT NULL;
  ALTER TABLE "game_campaigns_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "products" ADD COLUMN "for_sale" boolean DEFAULT true;
  ALTER TABLE "_products_v" ADD COLUMN "version_for_sale" boolean DEFAULT true;
  ALTER TABLE "categories" ADD COLUMN "hero_figure" "enum_categories_hero_figure";
  ALTER TABLE "categories_figures" ADD CONSTRAINT "categories_figures_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_figures_order_idx" ON "categories_figures" USING btree ("order");
  CREATE INDEX "categories_figures_parent_idx" ON "categories_figures" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories_figures" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categories_figures" CASCADE;
  ALTER TABLE "products_defects_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "products_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "_products_v_version_defects_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "_products_v_locales" ALTER COLUMN "version_title" SET NOT NULL;
  ALTER TABLE "categories_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "media_locales" ALTER COLUMN "alt" SET NOT NULL;
  ALTER TABLE "locations_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "locations_locales" ALTER COLUMN "city" SET NOT NULL;
  ALTER TABLE "game_campaigns_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "products" DROP COLUMN "for_sale";
  ALTER TABLE "_products_v" DROP COLUMN "version_for_sale";
  ALTER TABLE "categories" DROP COLUMN "hero_figure";
  DROP TYPE "public"."enum_categories_figures";
  DROP TYPE "public"."enum_categories_hero_figure";`)
}

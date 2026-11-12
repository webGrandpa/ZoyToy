import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- links to brands / franchises / tags / campaign categories: removed with their columns below
  DELETE FROM "products_rels" WHERE "path" IN ('franchises', 'tags');
  DELETE FROM "_products_v_rels" WHERE "path" IN ('version.franchises', 'version.tags');
  DELETE FROM "game_campaigns_rels" WHERE "path" = 'categories';
  DELETE FROM "payload_locked_documents_rels" WHERE "franchises_id" IS NOT NULL OR "brands_id" IS NOT NULL OR "tags_id" IS NOT NULL;
  CREATE TYPE "public"."enum_categories_theme" AS ENUM('soft', 'build', 'vehicles', 'figures', 'games', 'learn', 'baby', 'outdoor');
  DROP TABLE IF EXISTS "franchises" CASCADE;
  DROP TABLE IF EXISTS "franchises_locales" CASCADE;
  DROP TABLE IF EXISTS "brands" CASCADE;
  DROP TABLE IF EXISTS "tags" CASCADE;
  DROP TABLE IF EXISTS "tags_locales" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_brand_id_brands_id_fk";
  
  ALTER TABLE "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_franchises_fk";
  
  ALTER TABLE "products_rels" DROP CONSTRAINT IF EXISTS "products_rels_tags_fk";
  
  ALTER TABLE "_products_v" DROP CONSTRAINT IF EXISTS "_products_v_version_brand_id_brands_id_fk";
  
  ALTER TABLE "_products_v_rels" DROP CONSTRAINT IF EXISTS "_products_v_rels_franchises_fk";
  
  ALTER TABLE "_products_v_rels" DROP CONSTRAINT IF EXISTS "_products_v_rels_tags_fk";
  
  ALTER TABLE "game_campaigns_rels" DROP CONSTRAINT IF EXISTS "game_campaigns_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_franchises_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_brands_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_tags_fk";
  
  DROP INDEX IF EXISTS "products_brand_idx";
  DROP INDEX IF EXISTS "products_rels_franchises_id_idx";
  DROP INDEX IF EXISTS "products_rels_tags_id_idx";
  DROP INDEX IF EXISTS "_products_v_version_version_brand_idx";
  DROP INDEX IF EXISTS "_products_v_rels_franchises_id_idx";
  DROP INDEX IF EXISTS "_products_v_rels_tags_id_idx";
  DROP INDEX IF EXISTS "game_campaigns_rels_categories_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_franchises_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_brands_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "categories" ADD COLUMN "theme" "enum_categories_theme";
  ALTER TABLE "game_campaigns_rels" ADD COLUMN "products_id" integer;
  ALTER TABLE "game_campaigns_rels" ADD CONSTRAINT "game_campaigns_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "game_campaigns_rels_products_id_idx" ON "game_campaigns_rels" USING btree ("products_id");
  ALTER TABLE "products" DROP COLUMN IF EXISTS "brand_id";
  ALTER TABLE "products_rels" DROP COLUMN IF EXISTS "franchises_id";
  ALTER TABLE "products_rels" DROP COLUMN IF EXISTS "tags_id";
  ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_brand_id";
  ALTER TABLE "_products_v_rels" DROP COLUMN IF EXISTS "franchises_id";
  ALTER TABLE "_products_v_rels" DROP COLUMN IF EXISTS "tags_id";
  ALTER TABLE "game_campaigns_rels" DROP COLUMN IF EXISTS "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "franchises_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "brands_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "tags_id";
  DROP TYPE IF EXISTS "public"."enum_tags_kind";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tags_kind" AS ENUM('theme', 'skill', 'occasion');
  CREATE TABLE "franchises" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "franchises_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_tags_kind" DEFAULT 'theme',
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "game_campaigns_rels" DROP CONSTRAINT "game_campaigns_rels_products_fk";
  
  DROP INDEX "game_campaigns_rels_products_id_idx";
  ALTER TABLE "products" ADD COLUMN "brand_id" integer;
  ALTER TABLE "products_rels" ADD COLUMN "franchises_id" integer;
  ALTER TABLE "products_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_brand_id" integer;
  ALTER TABLE "_products_v_rels" ADD COLUMN "franchises_id" integer;
  ALTER TABLE "_products_v_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "game_campaigns_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "franchises_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "franchises_locales" ADD CONSTRAINT "franchises_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "franchises_slug_idx" ON "franchises" USING btree ("slug");
  CREATE INDEX "franchises_updated_at_idx" ON "franchises" USING btree ("updated_at");
  CREATE INDEX "franchises_created_at_idx" ON "franchises" USING btree ("created_at");
  CREATE UNIQUE INDEX "franchises_locales_locale_parent_id_unique" ON "franchises_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "franchises_locales_parent_id_idx" ON "franchises_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "tags_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "tags_locales_parent_id_idx" ON "tags_locales" USING btree ("_parent_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_franchises_fk" FOREIGN KEY ("franchises_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_franchises_fk" FOREIGN KEY ("franchises_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "game_campaigns_rels" ADD CONSTRAINT "game_campaigns_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_franchises_fk" FOREIGN KEY ("franchises_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "products_rels_franchises_id_idx" ON "products_rels" USING btree ("franchises_id");
  CREATE INDEX "products_rels_tags_id_idx" ON "products_rels" USING btree ("tags_id");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
  CREATE INDEX "_products_v_rels_franchises_id_idx" ON "_products_v_rels" USING btree ("franchises_id");
  CREATE INDEX "_products_v_rels_tags_id_idx" ON "_products_v_rels" USING btree ("tags_id");
  CREATE INDEX "game_campaigns_rels_categories_id_idx" ON "game_campaigns_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_franchises_id_idx" ON "payload_locked_documents_rels" USING btree ("franchises_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  ALTER TABLE "categories" DROP COLUMN "theme";
  ALTER TABLE "game_campaigns_rels" DROP COLUMN "products_id";
  DROP TYPE "public"."enum_categories_theme";`)
}

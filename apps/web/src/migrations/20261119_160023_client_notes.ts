import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_wishes_status" AS ENUM('new', 'seen', 'added');
  CREATE TYPE "public"."enum_wishes_locale" AS ENUM('ka', 'ru', 'en');
  CREATE TYPE "public"."enum_wishes_source" AS ENUM('home', 'catalog', 'empty');
  CREATE TABLE "wishes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"name" varchar,
  	"phone" varchar,
  	"status" "enum_wishes_status" DEFAULT 'new',
  	"notes" varchar,
  	"locale" "enum_wishes_locale" DEFAULT 'ka',
  	"source" "enum_wishes_source",
  	"ip_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "video_url" varchar;
  ALTER TABLE "products_locales" ADD COLUMN "size" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_video_url" varchar;
  ALTER TABLE "_products_v_locales" ADD COLUMN "version_size" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "wishes_id" integer;
  CREATE INDEX "wishes_status_idx" ON "wishes" USING btree ("status");
  CREATE INDEX "wishes_ip_hash_idx" ON "wishes" USING btree ("ip_hash");
  CREATE INDEX "wishes_updated_at_idx" ON "wishes" USING btree ("updated_at");
  CREATE INDEX "wishes_created_at_idx" ON "wishes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_wishes_fk" FOREIGN KEY ("wishes_id") REFERENCES "public"."wishes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_wishes_id_idx" ON "payload_locked_documents_rels" USING btree ("wishes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "wishes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "wishes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_wishes_fk";
  
  DROP INDEX "payload_locked_documents_rels_wishes_id_idx";
  ALTER TABLE "products" DROP COLUMN "video_url";
  ALTER TABLE "products_locales" DROP COLUMN "size";
  ALTER TABLE "_products_v" DROP COLUMN "version_video_url";
  ALTER TABLE "_products_v_locales" DROP COLUMN "version_size";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "wishes_id";
  DROP TYPE "public"."enum_wishes_status";
  DROP TYPE "public"."enum_wishes_locale";
  DROP TYPE "public"."enum_wishes_source";`)
}

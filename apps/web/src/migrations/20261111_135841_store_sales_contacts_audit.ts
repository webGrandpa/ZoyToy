import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_store_sales_payment" AS ENUM('cash', 'card', 'transfer');
  CREATE TABLE "store_sales" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"title" varchar,
  	"sku" varchar,
  	"price" numeric NOT NULL,
  	"list_price" numeric,
  	"payment" "enum_store_sales_payment" DEFAULT 'cash' NOT NULL,
  	"phone" varchar,
  	"note" varchar,
  	"sold_by_id" integer,
  	"order_id" integer,
  	"previous_status" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "orders" ADD COLUMN "discount_percent" numeric;
  ALTER TABLE "orders" ADD COLUMN "payable" numeric;
  ALTER TABLE "orders" ADD COLUMN "ip_hash" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "store_sales_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "viber" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "youtube" varchar;
  ALTER TABLE "store_sales" ADD CONSTRAINT "store_sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "store_sales" ADD CONSTRAINT "store_sales_sold_by_id_users_id_fk" FOREIGN KEY ("sold_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "store_sales" ADD CONSTRAINT "store_sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "store_sales_product_idx" ON "store_sales" USING btree ("product_id");
  CREATE INDEX "store_sales_sku_idx" ON "store_sales" USING btree ("sku");
  CREATE INDEX "store_sales_sold_by_idx" ON "store_sales" USING btree ("sold_by_id");
  CREATE INDEX "store_sales_order_idx" ON "store_sales" USING btree ("order_id");
  CREATE INDEX "store_sales_updated_at_idx" ON "store_sales" USING btree ("updated_at");
  CREATE INDEX "store_sales_created_at_idx" ON "store_sales" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_store_sales_fk" FOREIGN KEY ("store_sales_id") REFERENCES "public"."store_sales"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_ip_hash_idx" ON "orders" USING btree ("ip_hash");
  CREATE INDEX "payload_locked_documents_rels_store_sales_id_idx" ON "payload_locked_documents_rels" USING btree ("store_sales_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "store_sales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "store_sales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_store_sales_fk";
  
  DROP INDEX "orders_ip_hash_idx";
  DROP INDEX "payload_locked_documents_rels_store_sales_id_idx";
  ALTER TABLE "orders" DROP COLUMN "discount_percent";
  ALTER TABLE "orders" DROP COLUMN "payable";
  ALTER TABLE "orders" DROP COLUMN "ip_hash";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "store_sales_id";
  ALTER TABLE "site_settings" DROP COLUMN "viber";
  ALTER TABLE "site_settings" DROP COLUMN "youtube";
  DROP TYPE "public"."enum_store_sales_payment";`)
}

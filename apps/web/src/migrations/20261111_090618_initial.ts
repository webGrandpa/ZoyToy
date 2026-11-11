import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('ka', 'ru', 'en');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('requested', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled', 'expired');
  CREATE TYPE "public"."enum_orders_delivery" AS ENUM('pickup', 'courier', 'post', 'bus');
  CREATE TYPE "public"."enum_orders_payment" AS ENUM('cash', 'transfer', 'link');
  CREATE TYPE "public"."enum_orders_locale" AS ENUM('ka', 'ru', 'en');
  CREATE TYPE "public"."enum_products_gallery_role" AS ENUM('main', 'gallery', 'detail', 'defect', 'scale');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'published', 'reserved', 'sold', 'archived');
  CREATE TYPE "public"."enum_products_origin" AS ENUM('usa', 'europe', 'other');
  CREATE TYPE "public"."enum_products_condition" AS ENUM('new', 'new_open_box', 'like_new', 'very_good', 'good', 'fair');
  CREATE TYPE "public"."enum_products_completeness" AS ENUM('complete', 'incomplete');
  CREATE TYPE "public"."enum__products_v_version_gallery_role" AS ENUM('main', 'gallery', 'detail', 'defect', 'scale');
  CREATE TYPE "public"."enum__products_v_version_status" AS ENUM('draft', 'published', 'reserved', 'sold', 'archived');
  CREATE TYPE "public"."enum__products_v_version_origin" AS ENUM('usa', 'europe', 'other');
  CREATE TYPE "public"."enum__products_v_version_condition" AS ENUM('new', 'new_open_box', 'like_new', 'very_good', 'good', 'fair');
  CREATE TYPE "public"."enum__products_v_version_completeness" AS ENUM('complete', 'incomplete');
  CREATE TYPE "public"."enum_categories_color" AS ENUM('grape', 'sun', 'sky', 'bubble', 'mint', 'tangerine');
  CREATE TYPE "public"."enum_tags_kind" AS ENUM('theme', 'skill', 'occasion');
  CREATE TYPE "public"."enum_game_campaigns_game" AS ENUM('toy-drop');
  CREATE TYPE "public"."enum_rewards_status" AS ENUM('issued', 'redeemed', 'replaced', 'revoked');
  CREATE TYPE "public"."enum_game_sessions_verdict" AS ENUM('playing', 'valid', 'rejected');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'staff');
  CREATE TYPE "public"."enum_site_settings_games" AS ENUM('toy-drop', 'memory', 'whack', 'stack');
  CREATE TYPE "public"."enum_site_settings_season" AS ENUM('auto', 'none', 'ny', 'summer', 'june1', 'school');
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"title" varchar,
  	"sku" varchar,
  	"price" numeric
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"status" "enum_orders_status" DEFAULT 'requested' NOT NULL,
  	"reserved_until" timestamp(3) with time zone,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"city" varchar,
  	"delivery" "enum_orders_delivery" DEFAULT 'pickup',
  	"payment" "enum_orders_payment" DEFAULT 'cash',
  	"tracking" varchar,
  	"total" numeric,
  	"gift" boolean,
  	"reward_code" varchar,
  	"locale" "enum_orders_locale" DEFAULT 'ka',
  	"gift_note" varchar,
  	"comment" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_defects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"x" numeric,
  	"y" numeric
  );
  
  CREATE TABLE "products_defects_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "products_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"role" "enum_products_gallery_role" DEFAULT 'gallery'
  );
  
  CREATE TABLE "products_stock" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"location_id" integer NOT NULL,
  	"qty" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_products_status" DEFAULT 'draft' NOT NULL,
  	"sku" varchar,
  	"slug" varchar,
  	"published_at" timestamp(3) with time zone,
  	"sold_at" timestamp(3) with time zone,
  	"brand_id" integer,
  	"age_min_months" numeric,
  	"age_max_months" numeric,
  	"origin" "enum_products_origin",
  	"condition" "enum_products_condition" DEFAULT 'very_good' NOT NULL,
  	"completeness" "enum_products_completeness" DEFAULT 'complete',
  	"has_box" boolean,
  	"has_manual" boolean,
  	"tested" boolean DEFAULT true,
  	"cleaned_at" timestamp(3) with time zone,
  	"price" numeric NOT NULL,
  	"compare_at_price" numeric,
  	"retail_price_new" numeric,
  	"rental_enabled" boolean,
  	"rental_daily_rate" numeric,
  	"rental_deposit" numeric,
  	"rental_min_days" numeric DEFAULT 1,
  	"rental_max_days" numeric DEFAULT 30,
  	"rental_buyout_allowed" boolean DEFAULT true,
  	"weight_grams" numeric,
  	"length_cm" numeric,
  	"width_cm" numeric,
  	"height_cm" numeric,
  	"fragile" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_locales" (
  	"title" varchar NOT NULL,
  	"short_description" varchar,
  	"description" jsonb,
  	"condition_notes" varchar,
  	"missing_parts" varchar,
  	"batteries" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"franchises_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "_products_v_version_defects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_id" integer,
  	"x" numeric,
  	"y" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_defects_locales" (
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_version_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"role" "enum__products_v_version_gallery_role" DEFAULT 'gallery',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v_version_stock" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"location_id" integer NOT NULL,
  	"qty" numeric DEFAULT 1 NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_products_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_status" "enum__products_v_version_status" DEFAULT 'draft' NOT NULL,
  	"version_sku" varchar,
  	"version_slug" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_sold_at" timestamp(3) with time zone,
  	"version_brand_id" integer,
  	"version_age_min_months" numeric,
  	"version_age_max_months" numeric,
  	"version_origin" "enum__products_v_version_origin",
  	"version_condition" "enum__products_v_version_condition" DEFAULT 'very_good' NOT NULL,
  	"version_completeness" "enum__products_v_version_completeness" DEFAULT 'complete',
  	"version_has_box" boolean,
  	"version_has_manual" boolean,
  	"version_tested" boolean DEFAULT true,
  	"version_cleaned_at" timestamp(3) with time zone,
  	"version_price" numeric NOT NULL,
  	"version_compare_at_price" numeric,
  	"version_retail_price_new" numeric,
  	"version_rental_enabled" boolean,
  	"version_rental_daily_rate" numeric,
  	"version_rental_deposit" numeric,
  	"version_rental_min_days" numeric DEFAULT 1,
  	"version_rental_max_days" numeric DEFAULT 30,
  	"version_rental_buyout_allowed" boolean DEFAULT true,
  	"version_weight_grams" numeric,
  	"version_length_cm" numeric,
  	"version_width_cm" numeric,
  	"version_height_cm" numeric,
  	"version_fragile" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_products_v_locales" (
  	"version_title" varchar NOT NULL,
  	"version_short_description" varchar,
  	"version_description" jsonb,
  	"version_condition_notes" varchar,
  	"version_missing_parts" varchar,
  	"version_batteries" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_products_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer,
  	"franchises_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"color" "enum_categories_color" DEFAULT 'grape' NOT NULL,
  	"icon" varchar,
  	"parent_id" integer,
  	"order" numeric DEFAULT 0,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
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
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefix" varchar DEFAULT 'media',
  	"_objectkey" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "locations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar,
  	"map_url" varchar,
  	"is_pickup_point" boolean DEFAULT true,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "locations_locales" (
  	"title" varchar NOT NULL,
  	"city" varchar NOT NULL,
  	"address" varchar,
  	"hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "game_campaigns_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"min_score" numeric NOT NULL,
  	"percent" numeric NOT NULL
  );
  
  CREATE TABLE "game_campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"active" boolean DEFAULT true,
  	"game" "enum_game_campaigns_game" DEFAULT 'toy-drop',
  	"max_percent" numeric DEFAULT 50,
  	"validity_hours" numeric DEFAULT 48,
  	"attempts_per_day" numeric DEFAULT 3,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "game_campaigns_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "game_campaigns_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "rewards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"percent" numeric NOT NULL,
  	"score" numeric,
  	"status" "enum_rewards_status" DEFAULT 'issued',
  	"expires_at" timestamp(3) with time zone,
  	"phone" varchar,
  	"order_id" integer,
  	"campaign_id" integer,
  	"session_id" integer,
  	"device_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "game_sessions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"campaign_id" integer,
  	"game" varchar,
  	"seed" numeric NOT NULL,
  	"verdict" "enum_game_sessions_verdict",
  	"score" numeric,
  	"claimed_score" numeric,
  	"reasons" varchar,
  	"device_id" varchar,
  	"ip_hash" varchar,
  	"started_at" timestamp(3) with time zone,
  	"finished_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"orders_id" integer,
  	"products_id" integer,
  	"categories_id" integer,
  	"franchises_id" integer,
  	"brands_id" integer,
  	"tags_id" integer,
  	"media_id" integer,
  	"locations_id" integer,
  	"game_campaigns_id" integer,
  	"rewards_id" integer,
  	"game_sessions_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_games" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_site_settings_games",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar,
  	"whatsapp" varchar,
  	"telegram" varchar,
  	"instagram" varchar DEFAULT 'zoy.toy',
  	"facebook" varchar,
  	"tiktok" varchar,
  	"email" varchar,
  	"season" "enum_site_settings_season" DEFAULT 'auto',
  	"saved_total" numeric,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"hours" varchar,
  	"announcement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_defects" ADD CONSTRAINT "products_defects_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_defects" ADD CONSTRAINT "products_defects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_defects_locales" ADD CONSTRAINT "products_defects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_defects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_stock" ADD CONSTRAINT "products_stock_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_stock" ADD CONSTRAINT "products_stock_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_franchises_fk" FOREIGN KEY ("franchises_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_defects" ADD CONSTRAINT "_products_v_version_defects_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_defects" ADD CONSTRAINT "_products_v_version_defects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_defects_locales" ADD CONSTRAINT "_products_v_version_defects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v_version_defects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_gallery" ADD CONSTRAINT "_products_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_version_stock" ADD CONSTRAINT "_products_v_version_stock_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_version_stock" ADD CONSTRAINT "_products_v_version_stock_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_parent_id_products_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v_locales" ADD CONSTRAINT "_products_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_franchises_fk" FOREIGN KEY ("franchises_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_products_v_rels" ADD CONSTRAINT "_products_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "franchises_locales" ADD CONSTRAINT "franchises_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_locales" ADD CONSTRAINT "locations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "game_campaigns_tiers" ADD CONSTRAINT "game_campaigns_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."game_campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "game_campaigns_locales" ADD CONSTRAINT "game_campaigns_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."game_campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "game_campaigns_rels" ADD CONSTRAINT "game_campaigns_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."game_campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "game_campaigns_rels" ADD CONSTRAINT "game_campaigns_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rewards" ADD CONSTRAINT "rewards_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rewards" ADD CONSTRAINT "rewards_campaign_id_game_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."game_campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rewards" ADD CONSTRAINT "rewards_session_id_game_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_campaign_id_game_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."game_campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_franchises_fk" FOREIGN KEY ("franchises_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_locations_fk" FOREIGN KEY ("locations_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_game_campaigns_fk" FOREIGN KEY ("game_campaigns_id") REFERENCES "public"."game_campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rewards_fk" FOREIGN KEY ("rewards_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_game_sessions_fk" FOREIGN KEY ("game_sessions_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_games" ADD CONSTRAINT "site_settings_games_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
  CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "products_defects_order_idx" ON "products_defects" USING btree ("_order");
  CREATE INDEX "products_defects_parent_id_idx" ON "products_defects" USING btree ("_parent_id");
  CREATE INDEX "products_defects_photo_idx" ON "products_defects" USING btree ("photo_id");
  CREATE UNIQUE INDEX "products_defects_locales_locale_parent_id_unique" ON "products_defects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_defects_locales_parent_id_idx" ON "products_defects_locales" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE INDEX "products_stock_order_idx" ON "products_stock" USING btree ("_order");
  CREATE INDEX "products_stock_parent_id_idx" ON "products_stock" USING btree ("_parent_id");
  CREATE INDEX "products_stock_location_idx" ON "products_stock" USING btree ("location_id");
  CREATE INDEX "products_status_idx" ON "products" USING btree ("status");
  CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");
  CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_published_at_idx" ON "products" USING btree ("published_at");
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_locales_parent_id_idx" ON "products_locales" USING btree ("_parent_id");
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_categories_id_idx" ON "products_rels" USING btree ("categories_id");
  CREATE INDEX "products_rels_franchises_id_idx" ON "products_rels" USING btree ("franchises_id");
  CREATE INDEX "products_rels_tags_id_idx" ON "products_rels" USING btree ("tags_id");
  CREATE INDEX "_products_v_version_defects_order_idx" ON "_products_v_version_defects" USING btree ("_order");
  CREATE INDEX "_products_v_version_defects_parent_id_idx" ON "_products_v_version_defects" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_defects_photo_idx" ON "_products_v_version_defects" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_products_v_version_defects_locales_locale_parent_id_unique" ON "_products_v_version_defects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_version_defects_locales_parent_id_idx" ON "_products_v_version_defects_locales" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_gallery_order_idx" ON "_products_v_version_gallery" USING btree ("_order");
  CREATE INDEX "_products_v_version_gallery_parent_id_idx" ON "_products_v_version_gallery" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_gallery_image_idx" ON "_products_v_version_gallery" USING btree ("image_id");
  CREATE INDEX "_products_v_version_stock_order_idx" ON "_products_v_version_stock" USING btree ("_order");
  CREATE INDEX "_products_v_version_stock_parent_id_idx" ON "_products_v_version_stock" USING btree ("_parent_id");
  CREATE INDEX "_products_v_version_stock_location_idx" ON "_products_v_version_stock" USING btree ("location_id");
  CREATE INDEX "_products_v_parent_idx" ON "_products_v" USING btree ("parent_id");
  CREATE INDEX "_products_v_version_version_status_idx" ON "_products_v" USING btree ("version_status");
  CREATE INDEX "_products_v_version_version_sku_idx" ON "_products_v" USING btree ("version_sku");
  CREATE INDEX "_products_v_version_version_slug_idx" ON "_products_v" USING btree ("version_slug");
  CREATE INDEX "_products_v_version_version_published_at_idx" ON "_products_v" USING btree ("version_published_at");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
  CREATE INDEX "_products_v_version_version_updated_at_idx" ON "_products_v" USING btree ("version_updated_at");
  CREATE INDEX "_products_v_version_version_created_at_idx" ON "_products_v" USING btree ("version_created_at");
  CREATE INDEX "_products_v_created_at_idx" ON "_products_v" USING btree ("created_at");
  CREATE INDEX "_products_v_updated_at_idx" ON "_products_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_products_v_locales_locale_parent_id_unique" ON "_products_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_products_v_locales_parent_id_idx" ON "_products_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_products_v_rels_order_idx" ON "_products_v_rels" USING btree ("order");
  CREATE INDEX "_products_v_rels_parent_idx" ON "_products_v_rels" USING btree ("parent_id");
  CREATE INDEX "_products_v_rels_path_idx" ON "_products_v_rels" USING btree ("path");
  CREATE INDEX "_products_v_rels_categories_id_idx" ON "_products_v_rels" USING btree ("categories_id");
  CREATE INDEX "_products_v_rels_franchises_id_idx" ON "_products_v_rels" USING btree ("franchises_id");
  CREATE INDEX "_products_v_rels_tags_id_idx" ON "_products_v_rels" USING btree ("tags_id");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "categories_locales_parent_id_idx" ON "categories_locales" USING btree ("_parent_id");
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
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "locations_updated_at_idx" ON "locations" USING btree ("updated_at");
  CREATE INDEX "locations_created_at_idx" ON "locations" USING btree ("created_at");
  CREATE UNIQUE INDEX "locations_locales_locale_parent_id_unique" ON "locations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "locations_locales_parent_id_idx" ON "locations_locales" USING btree ("_parent_id");
  CREATE INDEX "game_campaigns_tiers_order_idx" ON "game_campaigns_tiers" USING btree ("_order");
  CREATE INDEX "game_campaigns_tiers_parent_id_idx" ON "game_campaigns_tiers" USING btree ("_parent_id");
  CREATE INDEX "game_campaigns_updated_at_idx" ON "game_campaigns" USING btree ("updated_at");
  CREATE INDEX "game_campaigns_created_at_idx" ON "game_campaigns" USING btree ("created_at");
  CREATE UNIQUE INDEX "game_campaigns_locales_locale_parent_id_unique" ON "game_campaigns_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "game_campaigns_locales_parent_id_idx" ON "game_campaigns_locales" USING btree ("_parent_id");
  CREATE INDEX "game_campaigns_rels_order_idx" ON "game_campaigns_rels" USING btree ("order");
  CREATE INDEX "game_campaigns_rels_parent_idx" ON "game_campaigns_rels" USING btree ("parent_id");
  CREATE INDEX "game_campaigns_rels_path_idx" ON "game_campaigns_rels" USING btree ("path");
  CREATE INDEX "game_campaigns_rels_categories_id_idx" ON "game_campaigns_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "rewards_code_idx" ON "rewards" USING btree ("code");
  CREATE INDEX "rewards_status_idx" ON "rewards" USING btree ("status");
  CREATE INDEX "rewards_phone_idx" ON "rewards" USING btree ("phone");
  CREATE INDEX "rewards_order_idx" ON "rewards" USING btree ("order_id");
  CREATE INDEX "rewards_campaign_idx" ON "rewards" USING btree ("campaign_id");
  CREATE INDEX "rewards_session_idx" ON "rewards" USING btree ("session_id");
  CREATE INDEX "rewards_device_id_idx" ON "rewards" USING btree ("device_id");
  CREATE INDEX "rewards_updated_at_idx" ON "rewards" USING btree ("updated_at");
  CREATE INDEX "rewards_created_at_idx" ON "rewards" USING btree ("created_at");
  CREATE INDEX "game_sessions_campaign_idx" ON "game_sessions" USING btree ("campaign_id");
  CREATE INDEX "game_sessions_verdict_idx" ON "game_sessions" USING btree ("verdict");
  CREATE INDEX "game_sessions_device_id_idx" ON "game_sessions" USING btree ("device_id");
  CREATE INDEX "game_sessions_ip_hash_idx" ON "game_sessions" USING btree ("ip_hash");
  CREATE INDEX "game_sessions_updated_at_idx" ON "game_sessions" USING btree ("updated_at");
  CREATE INDEX "game_sessions_created_at_idx" ON "game_sessions" USING btree ("created_at");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_franchises_id_idx" ON "payload_locked_documents_rels" USING btree ("franchises_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_locations_id_idx" ON "payload_locked_documents_rels" USING btree ("locations_id");
  CREATE INDEX "payload_locked_documents_rels_game_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("game_campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_rewards_id_idx" ON "payload_locked_documents_rels" USING btree ("rewards_id");
  CREATE INDEX "payload_locked_documents_rels_game_sessions_id_idx" ON "payload_locked_documents_rels" USING btree ("game_sessions_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_games_order_idx" ON "site_settings_games" USING btree ("order");
  CREATE INDEX "site_settings_games_parent_idx" ON "site_settings_games" USING btree ("parent_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "products_defects" CASCADE;
  DROP TABLE "products_defects_locales" CASCADE;
  DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products_stock" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "products_locales" CASCADE;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "_products_v_version_defects" CASCADE;
  DROP TABLE "_products_v_version_defects_locales" CASCADE;
  DROP TABLE "_products_v_version_gallery" CASCADE;
  DROP TABLE "_products_v_version_stock" CASCADE;
  DROP TABLE "_products_v" CASCADE;
  DROP TABLE "_products_v_locales" CASCADE;
  DROP TABLE "_products_v_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "franchises" CASCADE;
  DROP TABLE "franchises_locales" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "locations" CASCADE;
  DROP TABLE "locations_locales" CASCADE;
  DROP TABLE "game_campaigns_tiers" CASCADE;
  DROP TABLE "game_campaigns" CASCADE;
  DROP TABLE "game_campaigns_locales" CASCADE;
  DROP TABLE "game_campaigns_rels" CASCADE;
  DROP TABLE "rewards" CASCADE;
  DROP TABLE "game_sessions" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_games" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_delivery";
  DROP TYPE "public"."enum_orders_payment";
  DROP TYPE "public"."enum_orders_locale";
  DROP TYPE "public"."enum_products_gallery_role";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_products_origin";
  DROP TYPE "public"."enum_products_condition";
  DROP TYPE "public"."enum_products_completeness";
  DROP TYPE "public"."enum__products_v_version_gallery_role";
  DROP TYPE "public"."enum__products_v_version_status";
  DROP TYPE "public"."enum__products_v_version_origin";
  DROP TYPE "public"."enum__products_v_version_condition";
  DROP TYPE "public"."enum__products_v_version_completeness";
  DROP TYPE "public"."enum_categories_color";
  DROP TYPE "public"."enum_tags_kind";
  DROP TYPE "public"."enum_game_campaigns_game";
  DROP TYPE "public"."enum_rewards_status";
  DROP TYPE "public"."enum_game_sessions_verdict";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_site_settings_games";
  DROP TYPE "public"."enum_site_settings_season";`)
}

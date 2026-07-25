-- Initial schema migration for lubricentro-gyg
-- Generated manually based on Drizzle schema definitions

CREATE TABLE IF NOT EXISTS "brands" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL UNIQUE,
  "notes" text
);

CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(50) NOT NULL UNIQUE,
  "config" jsonb
);

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(150) NOT NULL UNIQUE,
  "contact" varchar(100),
  "phone" varchar(30),
  "email" varchar(100),
  "notes" text
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" varchar(50) NOT NULL UNIQUE,
  "email" varchar(100) NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" varchar(20) NOT NULL DEFAULT 'employee',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id" uuid NOT NULL REFERENCES "brands"("id"),
  "category_id" uuid NOT NULL REFERENCES "categories"("id"),
  "code" varchar(50),
  "name" varchar(200) NOT NULL,
  "description" text,
  "capacity" varchar(50),
  "unit" varchar(20) DEFAULT 'unit',
  "product_type" varchar(50),
  "viscosity" text,
  "cross_refs" jsonb,
  "specifications" jsonb,
  "extras" jsonb,
  "is_active" boolean NOT NULL DEFAULT true,
  "current_stock" integer NOT NULL DEFAULT 0,
  "min_stock_threshold" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "product_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "price_type" varchar(20) NOT NULL,
  "price" numeric(12, 2) NOT NULL,
  "discount_pct" numeric(5, 2),
  "effective_from" timestamp with time zone NOT NULL,
  "effective_to" timestamp with time zone,
  "notes" text
);

CREATE TABLE IF NOT EXISTS "stock_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "movement_type" varchar(20) NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric(12, 2),
  "reference" varchar(100),
  "notes" text,
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "product_suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id"),
  "supplier_id" uuid NOT NULL REFERENCES "suppliers"("id"),
  "supplier_code" varchar(50),
  "is_primary" boolean NOT NULL DEFAULT false,
  "notes" text
);

-- Indexes
CREATE INDEX IF NOT EXISTS "brands_name_idx" ON "brands" ("name");
CREATE INDEX IF NOT EXISTS "categories_name_idx" ON "categories" ("name");
CREATE INDEX IF NOT EXISTS "suppliers_name_idx" ON "suppliers" ("name");
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

CREATE INDEX IF NOT EXISTS "products_brand_id_idx" ON "products" ("brand_id");
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products" ("category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "products_code_unique" ON "products" ("code") WHERE "code" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "products_is_active_idx" ON "products" ("is_active");
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" ("name");

CREATE INDEX IF NOT EXISTS "product_prices_product_id_idx" ON "product_prices" ("product_id");
CREATE INDEX IF NOT EXISTS "product_prices_price_type_idx" ON "product_prices" ("price_type");
CREATE INDEX IF NOT EXISTS "product_prices_effective_from_idx" ON "product_prices" ("effective_from");
CREATE UNIQUE INDEX IF NOT EXISTS "product_prices_unique_idx" ON "product_prices" ("product_id", "price_type", "effective_from");

CREATE INDEX IF NOT EXISTS "stock_movements_product_id_idx" ON "stock_movements" ("product_id");
CREATE INDEX IF NOT EXISTS "stock_movements_created_at_idx" ON "stock_movements" ("created_at");
CREATE INDEX IF NOT EXISTS "stock_movements_movement_type_idx" ON "stock_movements" ("movement_type");

CREATE INDEX IF NOT EXISTS "product_suppliers_product_id_idx" ON "product_suppliers" ("product_id");
CREATE INDEX IF NOT EXISTS "product_suppliers_supplier_id_idx" ON "product_suppliers" ("supplier_id");
CREATE UNIQUE INDEX IF NOT EXISTS "product_suppliers_unique_idx" ON "product_suppliers" ("product_id", "supplier_id");

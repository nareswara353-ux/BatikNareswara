-- ============================================================
-- BATIK NARESWARA — E-Commerce Core Data Layer
-- Target: Supabase PostgreSQL (SQL Editor)
-- Generated: 2026-05-31
-- ============================================================
-- This script is idempotent-safe for extensions and creates
-- tables in strict dependency order. Execute top-to-bottom
-- in a single transaction within the Supabase SQL Editor.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ────────────────────────────────────────────────────────────
-- Enable uuid-ossp for uuid_generate_v4() availability.
-- gen_random_uuid() is natively available in PG 13+ / Supabase,
-- but we enable uuid-ossp as an explicit safety net.
-- ────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 2. TABLE: products
-- ────────────────────────────────────────────────────────────
-- Core catalog entity. The `description` column stores both
-- the product details and the "Filosofi Motif" narrative.
-- ────────────────────────────────────────────────────────────

CREATE TABLE products (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR         NOT NULL,
    description     TEXT            NOT NULL,
    original_price  DECIMAL(12, 2)  NOT NULL,
    discount_price  DECIMAL(12, 2)  DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  products                IS 'Core product catalog for Batik Nareswara.';
COMMENT ON COLUMN products.description    IS 'Full product details including Filosofi Motif narrative.';
COMMENT ON COLUMN products.original_price IS 'Base retail price before any discount.';
COMMENT ON COLUMN products.discount_price IS 'Active discount price; 0 means no discount is applied.';

-- ────────────────────────────────────────────────────────────
-- 3. TABLE: product_images
-- ────────────────────────────────────────────────────────────
-- Multi-image gallery per product. One image may be flagged
-- as the primary thumbnail via `is_primary`.
-- Cascading delete ensures orphan cleanup when a product
-- is removed.
-- ────────────────────────────────────────────────────────────

CREATE TABLE product_images (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID    NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    image_url   TEXT    NOT NULL,
    is_primary  BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE  product_images             IS 'Gallery images associated with a product.';
COMMENT ON COLUMN product_images.is_primary  IS 'TRUE marks this image as the hero/thumbnail for catalog cards.';

-- ────────────────────────────────────────────────────────────
-- 4. TABLE: product_variants
-- ────────────────────────────────────────────────────────────
-- Strict per-size inventory tracking. Each row represents a
-- unique (product, size) SKU with its own stock counter.
-- Cascading delete ensures variant cleanup when a product
-- is removed.
-- ────────────────────────────────────────────────────────────

CREATE TABLE product_variants (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    size        VARCHAR(10) NOT NULL,
    stock       INT         NOT NULL DEFAULT 0
);

COMMENT ON TABLE  product_variants        IS 'Size-level inventory variants for strict stock tracking.';
COMMENT ON COLUMN product_variants.size   IS 'Garment size code (e.g., S, M, L, XL, XXL).';
COMMENT ON COLUMN product_variants.stock  IS 'Current available-to-sell quantity for this variant.';

-- ────────────────────────────────────────────────────────────
-- 5. TABLE: stories
-- ────────────────────────────────────────────────────────────
-- Disappearing reels / ephemeral story content surfaced on
-- the storefront. Intended for time-limited promotional or
-- brand-narrative media.
-- ────────────────────────────────────────────────────────────

CREATE TABLE stories (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    image_or_video_url  TEXT            NOT NULL,
    caption             VARCHAR(255),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  stories                       IS 'Ephemeral story/reel entries for the storefront.';
COMMENT ON COLUMN stories.image_or_video_url    IS 'Supabase Storage URL pointing to the story media asset.';

-- ────────────────────────────────────────────────────────────
-- 6. PERFORMANCE INDEXES
-- ────────────────────────────────────────────────────────────

-- 6a. Gallery join accelerator
-- Speeds up the typical query:
--   SELECT * FROM product_images WHERE product_id = $1;
-- Used every time the front-end renders a product detail page.

CREATE INDEX idx_product_images_product_id
    ON product_images (product_id);

-- 6b. Composite stock-availability index
-- Covers the high-concurrency real-time stock lookup:
--   SELECT size, stock
--   FROM product_variants
--   WHERE product_id = $1 AND stock > 0;
-- The (product_id, size, stock) ordering lets Postgres satisfy
-- equality on product_id, sort/filter on size, and perform an
-- index-only scan on stock — eliminating heap fetches during
-- catalog rendering and reducing lock contention that can
-- cause race conditions under concurrent checkout flows.

CREATE INDEX idx_product_variants_availability
    ON product_variants (product_id, size, stock);

-- ============================================================
-- END OF DDL — Database is initialized clean (no seed data).
-- ============================================================

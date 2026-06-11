-- ============================================================
-- BATIK NARESWARA — Phase 4: Data Masking & Security Layer
-- Target: Supabase PostgreSQL (SQL Editor)
-- Generated: 2026-06-04
-- ============================================================
-- This script creates the customers table, masking functions,
-- a masked security view, and role-based access controls.
-- Execute in the Supabase SQL Editor as a superuser/postgres.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLE: orders (Transactional Outbox Support)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name   VARCHAR(200)    NOT NULL,
    customer_email  VARCHAR(320)    NOT NULL,
    product_id      UUID            NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity        INT             NOT NULL CHECK (quantity > 0),
    total_price     DECIMAL(12, 2)  NOT NULL CHECK (total_price >= 0),
    status          VARCHAR(50)     NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  orders                IS 'Customer orders with transactional outbox support.';
COMMENT ON COLUMN orders.status         IS 'Order lifecycle: pending → confirmed → processing → shipped → delivered | cancelled.';
COMMENT ON COLUMN orders.product_id     IS 'FK to products table — RESTRICT prevents deletion of ordered products.';

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);

-- ────────────────────────────────────────────────────────────
-- 2. TABLE: outbox_messages (Transactional Outbox Pattern)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS outbox_messages (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(255)    NOT NULL,
    content         JSONB           NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at    TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE  outbox_messages            IS 'Transactional Outbox — stores domain events for reliable async dispatch.';
COMMENT ON COLUMN outbox_messages.type       IS 'Event type discriminator (e.g., OrderPlacedEvent).';
COMMENT ON COLUMN outbox_messages.content    IS 'Full event payload serialized as JSON.';
COMMENT ON COLUMN outbox_messages.processed_at IS 'NULL = pending dispatch. Set after successful delivery.';

-- Accelerate the background worker's polling query:
-- WHERE processed_at IS NULL ORDER BY created_at ASC LIMIT N
CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed
    ON outbox_messages (created_at ASC)
    WHERE processed_at IS NULL;

-- ────────────────────────────────────────────────────────────
-- 3. TABLE: customers
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   VARCHAR(200)    NOT NULL,
    email       VARCHAR(320)    NOT NULL UNIQUE,
    phone       VARCHAR(20)     NOT NULL,
    address     TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE  customers           IS 'Customer profile data — sensitive fields protected by masking views.';
COMMENT ON COLUMN customers.email     IS 'Primary contact email — masked in staff views.';
COMMENT ON COLUMN customers.phone     IS 'Primary phone number — masked in staff views.';

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

-- ────────────────────────────────────────────────────────────
-- 4. SECURITY FUNCTIONS: Dynamic Data Masking
-- ────────────────────────────────────────────────────────────

-- mask_email: 'nareswara@email.com' → 'n*******a@email.com'
CREATE OR REPLACE FUNCTION mask_email(raw_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
SECURITY DEFINER
AS $$
DECLARE
    local_part TEXT;
    domain_part TEXT;
    masked_local TEXT;
BEGIN
    IF raw_email IS NULL OR raw_email = '' THEN
        RETURN raw_email;
    END IF;

    -- Split at the @ symbol
    local_part  := split_part(raw_email, '@', 1);
    domain_part := split_part(raw_email, '@', 2);

    -- Edge case: no @ found (malformed email)
    IF domain_part = '' THEN
        RETURN repeat('*', length(raw_email));
    END IF;

    -- Mask the local part: keep first and last char, replace middle with asterisks
    IF length(local_part) <= 2 THEN
        masked_local := left(local_part, 1) || repeat('*', greatest(length(local_part) - 1, 0));
    ELSE
        masked_local := left(local_part, 1) ||
                        repeat('*', length(local_part) - 2) ||
                        right(local_part, 1);
    END IF;

    RETURN masked_local || '@' || domain_part;
END;
$$;

COMMENT ON FUNCTION mask_email(TEXT) IS 'Masks email local part: n*******a@email.com';

-- mask_phone: '081234567890' → '0812XXXXXXXX'
CREATE OR REPLACE FUNCTION mask_phone(raw_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
STRICT
SECURITY DEFINER
AS $$
DECLARE
    visible_prefix INT := 4;
BEGIN
    IF raw_phone IS NULL OR raw_phone = '' THEN
        RETURN raw_phone;
    END IF;

    -- Keep the first 4 digits visible, replace the rest with X
    IF length(raw_phone) <= visible_prefix THEN
        RETURN raw_phone;
    END IF;

    RETURN left(raw_phone, visible_prefix) ||
           repeat('X', length(raw_phone) - visible_prefix);
END;
$$;

COMMENT ON FUNCTION mask_phone(TEXT) IS 'Masks phone number: 0812XXXXXXXX';

-- ────────────────────────────────────────────────────────────
-- 5. SECURITY VIEW: customers_masked
-- ────────────────────────────────────────────────────────────
-- This view automatically applies data masking to sensitive columns.
-- Staff/admin roles query this view instead of the base table.
-- The .NET service account (postgres) queries the base table directly.

CREATE OR REPLACE VIEW customers_masked AS
SELECT
    id,
    full_name,
    mask_email(email)   AS email,
    mask_phone(phone)   AS phone,
    address,
    created_at
FROM customers;

COMMENT ON VIEW customers_masked IS 'Auto-masking security view — sensitive PII fields are obfuscated for staff access.';

-- ────────────────────────────────────────────────────────────
-- 6. ROLE-BASED ACCESS CONTROL
-- ────────────────────────────────────────────────────────────

-- Create the staff_readonly role (idempotent-safe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'staff_readonly') THEN
        CREATE ROLE staff_readonly NOLOGIN;
    END IF;
END;
$$;

COMMENT ON ROLE staff_readonly IS 'Restricted read-only role for admin dashboard staff — sees masked PII only.';

-- Staff can ONLY see the masked view, never the raw customers table
GRANT USAGE ON SCHEMA public TO staff_readonly;
GRANT SELECT ON customers_masked TO staff_readonly;

-- Explicitly REVOKE direct access to the raw customers table from staff
REVOKE ALL ON customers FROM staff_readonly;

-- The service account (postgres) retains full access to all tables
-- (inherent as superuser — no explicit GRANT needed)

-- ────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY on customers table
-- ────────────────────────────────────────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Only the service account (postgres) and table owner can see raw data
CREATE POLICY customers_service_access ON customers
    FOR ALL
    USING (
        current_user = 'postgres'
        OR current_user = (SELECT tableowner FROM pg_tables WHERE tablename = 'customers' AND schemaname = 'public')
    );

-- ────────────────────────────────────────────────────────────
-- 8. SEED DATA (for testing the masking layer)
-- ────────────────────────────────────────────────────────────

INSERT INTO customers (full_name, email, phone, address) VALUES
    ('Nareswara Putra', 'nareswara@email.com', '081234567890', 'Jl. Malioboro No. 1, Yogyakarta'),
    ('Sinta Dewi', 'sinta.dewi@gmail.com', '081298765432', 'Jl. Thamrin No. 45, Jakarta Pusat'),
    ('Arjuna Wijaya', 'arjuna.w@batik.co.id', '085612345678', 'Jl. Sudirman No. 88, Surabaya')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- VERIFICATION QUERIES (run these to validate the setup)
-- ============================================================
--
-- As postgres (service account) — shows FULL unmasked data:
--   SELECT * FROM customers;
--   Expected: nareswara@email.com, 081234567890
--
-- Via the masked view — shows MASKED data:
--   SELECT * FROM customers_masked;
--   Expected: n*******a@email.com, 0812XXXXXXXX
--
-- As staff_readonly (if you SET ROLE):
--   SET ROLE staff_readonly;
--   SELECT * FROM customers;        -- ERROR: permission denied
--   SELECT * FROM customers_masked;  -- OK: masked data
--   RESET ROLE;
-- ============================================================

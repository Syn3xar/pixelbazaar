-- ================================================================
-- MILLIONDOLLARBOARD — Full Database Schema v2
-- Run this in: Supabase → SQL Editor → New Query → Run
-- WARNING: This drops and recreates all tables (clean slate)
-- ================================================================

DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS auctions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS pixels CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;

-- 1. BLOCKS — each purchased block is one unit (1x1, 10x10, or 100x100)
CREATE TABLE blocks (
  id            BIGSERIAL PRIMARY KEY,
  origin_x      INTEGER NOT NULL,
  origin_y      INTEGER NOT NULL,
  block_size    INTEGER NOT NULL,
  company       TEXT NOT NULL,
  url           TEXT NOT NULL,
  owner_email   TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(origin_x, origin_y)
);

-- 2. PIXELS — individual pixels, each linked to a block
CREATE TABLE pixels (
  id          BIGSERIAL PRIMARY KEY,
  x           INTEGER NOT NULL,
  y           INTEGER NOT NULL,
  block_id    BIGINT REFERENCES blocks(id) ON DELETE CASCADE,
  company     TEXT NOT NULL,
  url         TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#784BA0',
  price       NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  owner_email TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(x, y)
);

-- 3. AUCTIONS — on whole blocks only
CREATE TABLE auctions (
  id            BIGSERIAL PRIMARY KEY,
  block_id      BIGINT REFERENCES blocks(id) NOT NULL,
  origin_x      INTEGER NOT NULL,
  origin_y      INTEGER NOT NULL,
  block_size    INTEGER NOT NULL,
  seller_email  TEXT NOT NULL,
  min_bid       NUMERIC(10,2) NOT NULL,
  current_bid   NUMERIC(10,2),
  winner_email  TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  ends_at       TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BIDS — bids on auctions
CREATE TABLE bids (
  id            BIGSERIAL PRIMARY KEY,
  auction_id    BIGINT REFERENCES auctions(id),
  bidder_name   TEXT NOT NULL,
  bidder_email  TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS — revenue tracking
CREATE TABLE transactions (
  id              BIGSERIAL PRIMARY KEY,
  type            TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  platform_fee    NUMERIC(10,2) NOT NULL,
  paypal_order    TEXT,
  block_id        BIGINT,
  origin_x        INTEGER,
  origin_y        INTEGER,
  block_size      INTEGER,
  buyer_email     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Row Level Security
ALTER TABLE blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixels       ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids         ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 7. Public read
CREATE POLICY "read blocks"    ON blocks    FOR SELECT USING (true);
CREATE POLICY "read pixels"    ON pixels    FOR SELECT USING (true);
CREATE POLICY "read auctions"  ON auctions  FOR SELECT USING (true);
CREATE POLICY "read bids"      ON bids      FOR SELECT USING (true);

-- 8. Server write only
CREATE POLICY "write blocks"    ON blocks    FOR INSERT WITH CHECK (true);
CREATE POLICY "update blocks"   ON blocks    FOR UPDATE USING (true);
CREATE POLICY "write pixels"    ON pixels    FOR INSERT WITH CHECK (true);
CREATE POLICY "update pixels"   ON pixels    FOR UPDATE USING (true);
CREATE POLICY "write auctions"  ON auctions  FOR INSERT WITH CHECK (true);
CREATE POLICY "update auctions" ON auctions  FOR UPDATE USING (true);
CREATE POLICY "write bids"      ON bids      FOR INSERT WITH CHECK (true);
CREATE POLICY "write txns"      ON transactions FOR INSERT WITH CHECK (true);

-- 9. Indexes
CREATE INDEX idx_pixels_xy       ON pixels(x, y);
CREATE INDEX idx_pixels_block    ON pixels(block_id);
CREATE INDEX idx_blocks_origin   ON blocks(origin_x, origin_y);
CREATE INDEX idx_auctions_block  ON auctions(block_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_ends   ON auctions(ends_at);

-- ================================================================
-- ACTIVITY LOG — comprehensive event tracking with geo & device info
-- ================================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL,
  -- Actor info
  actor_email   TEXT,
  actor_name    TEXT,
  -- Block/auction references
  block_id      BIGINT,
  auction_id    BIGINT,
  -- Financial
  amount        NUMERIC(10,2),
  platform_fee  NUMERIC(10,2),
  -- Location & device
  ip_address    TEXT,
  country       TEXT,
  country_code  TEXT,
  city          TEXT,
  region        TEXT,
  timezone      TEXT,
  -- Device & browser
  user_agent    TEXT,
  device_type   TEXT,   -- 'mobile' | 'desktop' | 'tablet'
  browser       TEXT,
  os            TEXT,
  -- Referrer
  referrer      TEXT,
  -- Extra data (coordinates, block size, etc)
  metadata      JSONB,
  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read activity"  ON activity_log FOR SELECT USING (true);
CREATE POLICY "write activity" ON activity_log FOR INSERT WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_activity_type    ON activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_date    ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_block   ON activity_log(block_id);
CREATE INDEX IF NOT EXISTS idx_activity_email   ON activity_log(actor_email);
CREATE INDEX IF NOT EXISTS idx_activity_country ON activity_log(country_code);
CREATE INDEX IF NOT EXISTS idx_activity_ip      ON activity_log(ip_address);

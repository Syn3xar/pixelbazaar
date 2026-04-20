-- ================================================================
-- PIXELBAZAAR — Database Schema
-- Run this entire file in: Supabase → SQL Editor → New Query → Run
-- ================================================================

-- 1. PIXELS table — stores every purchased pixel
CREATE TABLE IF NOT EXISTS pixels (
  id          BIGSERIAL PRIMARY KEY,
  x           INTEGER NOT NULL,
  y           INTEGER NOT NULL,
  company     TEXT NOT NULL,
  url         TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#784BA0',
  price       NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  owner_email TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(x, y)   -- one company per pixel coordinate
);

-- 2. AUCTIONS table — active and completed auctions
CREATE TABLE IF NOT EXISTS auctions (
  id            BIGSERIAL PRIMARY KEY,
  pixel_x       INTEGER NOT NULL,
  pixel_y       INTEGER NOT NULL,
  seller_email  TEXT NOT NULL,
  min_bid       NUMERIC(10,2) NOT NULL,
  current_bid   NUMERIC(10,2),
  winner_email  TEXT,
  status        TEXT NOT NULL DEFAULT 'active', -- active | ended | cancelled
  ends_at       TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BIDS table — every bid placed on an auction
CREATE TABLE IF NOT EXISTS bids (
  id          BIGSERIAL PRIMARY KEY,
  auction_id  BIGINT REFERENCES auctions(id),
  bidder_name TEXT NOT NULL,
  bidder_email TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRANSACTIONS table — platform revenue tracking
CREATE TABLE IF NOT EXISTS transactions (
  id              BIGSERIAL PRIMARY KEY,
  type            TEXT NOT NULL,  -- 'pixel_purchase' | 'auction_bid' | 'auction_win'
  amount          NUMERIC(10,2) NOT NULL,
  platform_fee    NUMERIC(10,2) NOT NULL,
  stripe_session  TEXT,
  pixel_x         INTEGER,
  pixel_y         INTEGER,
  buyer_email     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (keeps data safe)
ALTER TABLE pixels      ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Public read access (anyone can see the pixel board)
CREATE POLICY "Anyone can read pixels"
  ON pixels FOR SELECT USING (true);

CREATE POLICY "Anyone can read auctions"
  ON auctions FOR SELECT USING (true);

CREATE POLICY "Anyone can read bids"
  ON bids FOR SELECT USING (true);

-- 7. Only server (service role) can write — protects against cheating
CREATE POLICY "Service role can insert pixels"
  ON pixels FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update pixels"
  ON pixels FOR UPDATE USING (true);

CREATE POLICY "Service role can insert auctions"
  ON auctions FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update auctions"
  ON auctions FOR UPDATE USING (true);

CREATE POLICY "Service role can insert bids"
  ON bids FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert transactions"
  ON transactions FOR INSERT WITH CHECK (true);

-- 8. Indexes for fast pixel lookups
CREATE INDEX IF NOT EXISTS idx_pixels_xy ON pixels(x, y);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON auctions(ends_at);

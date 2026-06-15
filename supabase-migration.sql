-- ============================================================
-- SiteForge — Complete Supabase Migration
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ────────────────────────────────────────────────────────────
-- 1. BUSINESSES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  category    text,
  phone       text,
  email       text,
  address     text,
  city        text,
  country     text NOT NULL DEFAULT 'US',
  source_url  text,
  source_dir  text,
  has_website boolean NOT NULL DEFAULT false,
  raw_data    jsonb,
  crawled_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS businesses_city_cat  ON businesses(city, category);
CREATE INDEX IF NOT EXISTS businesses_no_site   ON businesses(has_website) WHERE has_website = false;
CREATE INDEX IF NOT EXISTS businesses_name_trgm ON businesses USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS businesses_source    ON businesses(source_dir);

-- ────────────────────────────────────────────────────────────
-- 2. WEBSITES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS websites (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  slug          text UNIQUE NOT NULL,
  html_content  text,
  template      text,                       -- restaurant | trades | salon | medical | legal | retail | generic
  theme         jsonb,                      -- { colors: {}, sections: [] }
  status        text NOT NULL DEFAULT 'generated'
                  CHECK (status IN ('generated','claimed','published','deleted')),
  claimed_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  custom_domain text,
  plan          text NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','pro','business')),
  views         integer NOT NULL DEFAULT 0,
  generated_at  timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

CREATE INDEX IF NOT EXISTS websites_status_plan ON websites(status, plan);
CREATE INDEX IF NOT EXISTS websites_claimed_by  ON websites(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS websites_slug        ON websites(slug);

-- ────────────────────────────────────────────────────────────
-- 3. OUTREACH
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_id   uuid NOT NULL REFERENCES websites(id)  ON DELETE CASCADE,
  to_email     text,
  subject      text,
  body         text,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','opened','clicked','claimed','failed','unsubscribed')),
  opened_at    timestamptz,
  clicked_at   timestamptz,
  sent_at      timestamptz,
  provider_id  text
);

CREATE INDEX IF NOT EXISTS outreach_status     ON outreach(status);
CREATE INDEX IF NOT EXISTS outreach_sent_at    ON outreach(sent_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS outreach_website_id ON outreach(website_id);

-- ────────────────────────────────────────────────────────────
-- 4. SUBSCRIPTIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_id          uuid REFERENCES websites(id) ON DELETE SET NULL,
  plan                text NOT NULL,
  stripe_sub_id       text UNIQUE,
  status              text NOT NULL DEFAULT 'active',
  current_period_end  timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id ON subscriptions(user_id);

-- ────────────────────────────────────────────────────────────
-- 5. CRAWL JOBS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  source      text,
  category    text,
  region      text,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','running','done','failed')),
  found       integer NOT NULL DEFAULT 0,
  processed   integer NOT NULL DEFAULT 0,
  error_log   jsonb,
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. ROW-LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE websites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can view published/generated sites (public preview)
CREATE POLICY "public can view published sites"
  ON websites FOR SELECT
  USING (status IN ('generated','published'));

-- Owners can see and update their own sites
CREATE POLICY "owners can select own sites"
  ON websites FOR SELECT
  USING (claimed_by = auth.uid());

CREATE POLICY "owners can update own sites"
  ON websites FOR UPDATE
  USING (claimed_by = auth.uid());

-- Subscriptions — users only see their own
CREATE POLICY "users see own subscriptions"
  ON subscriptions FOR ALL
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 6b. IDEMPOTENT COLUMN ADDITIONS (safe if table already existed)
-- ────────────────────────────────────────────────────────────
ALTER TABLE websites ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────
-- 7. HELPER FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- Atomically increment site view counter
CREATE OR REPLACE FUNCTION increment_site_views(site_slug text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE websites SET views = views + 1 WHERE slug = site_slug;
$$;

-- Return platform-wide stats (used by admin dashboard)
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'total_businesses', (SELECT COUNT(*) FROM businesses),
    'total_sites',      (SELECT COUNT(*) FROM websites),
    'claimed_sites',    (SELECT COUNT(*) FROM websites WHERE status IN ('claimed','published')),
    'outreach_sent',    (SELECT COUNT(*) FROM outreach WHERE status <> 'pending'),
    'outreach_opened',  (SELECT COUNT(*) FROM outreach WHERE status IN ('opened','clicked','claimed')),
    'paid_subs',        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'mrr',              (SELECT COALESCE(SUM(CASE plan WHEN 'pro' THEN 29 WHEN 'business' THEN 79 ELSE 0 END), 0)
                         FROM subscriptions WHERE status = 'active')
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 8. TRIGGERS
-- ────────────────────────────────────────────────────────────

-- Auto-set published_at when status flips to 'published'
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_websites_published_at
  BEFORE UPDATE ON websites
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

-- ────────────────────────────────────────────────────────────
-- 9. SEED DATA (optional demo row — remove for production)
-- ────────────────────────────────────────────────────────────
/*
INSERT INTO businesses (name, slug, category, phone, address, city, country, source_dir, has_website, raw_data)
VALUES (
  'Bella''s Pizza',
  'bellas-pizza-new-york-ny',
  'Restaurant',
  '(212) 555-0182',
  '48 Mott St, New York, NY 10013',
  'New York',
  'US',
  'yellowpages',
  false,
  '{"state":"NY","zip":"10013","description":"Authentic NY-style pizza since 1994","hours":"Mon–Sat 11am–10pm","rating":"4.7","review_count":382}'
)
ON CONFLICT (slug) DO NOTHING;
*/

-- ============================================================
-- Done! ✓ 5 tables · indexes · RLS · 2 functions · 1 trigger
-- ============================================================

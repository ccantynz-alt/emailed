-- 0002_create_domains.sql
-- Creates the domains and dns_records tables with enums

-- Enums
DO $$ BEGIN
  CREATE TYPE domain_verification_status AS ENUM ('pending', 'verifying', 'verified', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dns_record_type AS ENUM ('TXT', 'CNAME', 'MX', 'A', 'AAAA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Domains
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  subdomain TEXT,
  verification_status domain_verification_status NOT NULL DEFAULT 'pending',
  verification_attempts INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  last_verification_attempt TIMESTAMPTZ,

  -- Authentication status
  spf_verified BOOLEAN NOT NULL DEFAULT FALSE,
  spf_record TEXT,
  dkim_verified BOOLEAN NOT NULL DEFAULT FALSE,
  dkim_selector TEXT,
  dkim_public_key TEXT,
  dkim_private_key TEXT,
  dmarc_verified BOOLEAN NOT NULL DEFAULT FALSE,
  dmarc_policy TEXT,
  dmarc_record TEXT,
  return_path_verified BOOLEAN NOT NULL DEFAULT FALSE,
  return_path_domain TEXT,

  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS domains_domain_idx ON domains (domain);
CREATE INDEX IF NOT EXISTS domains_account_id_idx ON domains (account_id);
CREATE INDEX IF NOT EXISTS domains_verification_status_idx ON domains (verification_status);

-- DNS Records
CREATE TABLE IF NOT EXISTS dns_records (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES domains (id) ON DELETE CASCADE,
  type dns_record_type NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER NOT NULL DEFAULT 3600,
  priority INTEGER,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dns_records_domain_id_idx ON dns_records (domain_id);

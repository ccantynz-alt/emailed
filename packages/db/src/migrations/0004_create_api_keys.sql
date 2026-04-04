-- 0004_create_api_keys.sql
-- Creates the api_keys and api_key_usage tables

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB NOT NULL,
  allowed_domains JSONB NOT NULL DEFAULT '[]'::JSONB,
  rate_limit_override INTEGER,
  environment TEXT NOT NULL DEFAULT 'live',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS api_keys_account_id_idx ON api_keys (account_id);
CREATE INDEX IF NOT EXISTS api_keys_key_prefix_idx ON api_keys (key_prefix);

-- API Key Usage
CREATE TABLE IF NOT EXISTS api_key_usage (
  id TEXT PRIMARY KEY,
  api_key_id TEXT NOT NULL REFERENCES api_keys (id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  response_time_ms INTEGER,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_key_usage_api_key_id_idx ON api_key_usage (api_key_id);
CREATE INDEX IF NOT EXISTS api_key_usage_timestamp_idx ON api_key_usage ("timestamp");

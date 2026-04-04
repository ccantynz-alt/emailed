-- 0001_create_users.sql
-- Creates the accounts and users tables with enums

-- Enums
DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan_tier plan_tier NOT NULL DEFAULT 'free',
  emails_sent_this_period INTEGER NOT NULL DEFAULT 0,
  period_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billing_email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS accounts_stripe_customer_idx ON accounts (stripe_customer_id);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role user_role NOT NULL DEFAULT 'member',
  permissions JSONB NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verification_token TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);
CREATE INDEX IF NOT EXISTS users_account_id_idx ON users (account_id);

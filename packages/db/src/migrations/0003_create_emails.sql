-- 0003_create_emails.sql
-- Creates the emails, attachments, and delivery_results tables with enums

-- Enums
DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('queued', 'processing', 'sent', 'delivered', 'bounced', 'deferred', 'dropped', 'failed', 'complained');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE attachment_disposition AS ENUM ('attachment', 'inline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Emails
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL REFERENCES domains (id) ON DELETE RESTRICT,

  -- Envelope
  message_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_addresses JSONB NOT NULL,
  cc_addresses JSONB,
  bcc_addresses JSONB,
  reply_to_address TEXT,
  reply_to_name TEXT,

  -- Content
  subject TEXT NOT NULL,
  text_body TEXT,
  html_body TEXT,

  -- Headers
  in_reply_to TEXT,
  "references" JSONB,
  custom_headers JSONB,

  -- Status
  status email_status NOT NULL DEFAULT 'queued',

  -- Metadata
  tags JSONB NOT NULL DEFAULT '[]'::JSONB,
  metadata JSONB,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,

  -- Encryption
  encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  encryption_key_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS emails_account_id_idx ON emails (account_id);
CREATE INDEX IF NOT EXISTS emails_domain_id_idx ON emails (domain_id);
CREATE INDEX IF NOT EXISTS emails_status_idx ON emails (status);
CREATE INDEX IF NOT EXISTS emails_message_id_idx ON emails (message_id);
CREATE INDEX IF NOT EXISTS emails_created_at_idx ON emails (created_at);
CREATE INDEX IF NOT EXISTS emails_account_status_idx ON emails (account_id, status);
CREATE INDEX IF NOT EXISTS emails_scheduled_at_idx ON emails (scheduled_at);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL REFERENCES emails (id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_key TEXT NOT NULL,
  content_id TEXT,
  disposition attachment_disposition NOT NULL DEFAULT 'attachment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS attachments_email_id_idx ON attachments (email_id);

-- Delivery Results
CREATE TABLE IF NOT EXISTS delivery_results (
  id TEXT PRIMARY KEY,
  email_id TEXT NOT NULL REFERENCES emails (id) ON DELETE CASCADE,
  recipient_address TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'queued',
  remote_response_code INTEGER,
  remote_response TEXT,
  mx_host TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  first_attempt_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS delivery_results_email_id_idx ON delivery_results (email_id);
CREATE INDEX IF NOT EXISTS delivery_results_status_idx ON delivery_results (status);
CREATE INDEX IF NOT EXISTS delivery_results_next_retry_idx ON delivery_results (next_retry_at);

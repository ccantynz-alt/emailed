-- Migration: 0008_create_templates
-- Create email templates table for stored templates with variable substitution

CREATE TABLE IF NOT EXISTS "templates" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "subject" text NOT NULL,
  "html_body" text,
  "text_body" text,
  "variables" jsonb DEFAULT '[]'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "templates_account_id_idx" ON "templates" ("account_id");
CREATE INDEX IF NOT EXISTS "templates_name_idx" ON "templates" ("account_id", "name");

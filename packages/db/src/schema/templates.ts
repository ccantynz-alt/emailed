import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { accounts } from "./users.js";

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

export const templates = pgTable(
  "templates",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    htmlBody: text("html_body"),
    textBody: text("text_body"),
    /** List of variable names expected by this template, e.g. ["name", "company"] */
    variables: jsonb("variables").$type<string[]>().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("templates_account_id_idx").on(table.accountId),
    index("templates_name_idx").on(table.accountId, table.name),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const templatesRelations = relations(templates, ({ one }) => ({
  account: one(accounts, {
    fields: [templates.accountId],
    references: [accounts.id],
  }),
}));

import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { domains } from "./domains.js";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const suppressionReasonEnum = pgEnum("suppression_reason", [
  "bounce",
  "complaint",
  "unsubscribe",
  "manual",
]);

// ---------------------------------------------------------------------------
// Suppression Lists
// ---------------------------------------------------------------------------

export const suppressionLists = pgTable(
  "suppression_lists",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    domainId: text("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    reason: suppressionReasonEnum("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("suppression_lists_email_domain_idx").on(
      table.email,
      table.domainId,
    ),
    index("suppression_lists_domain_id_idx").on(table.domainId),
    index("suppression_lists_reason_idx").on(table.reason),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const suppressionListsRelations = relations(
  suppressionLists,
  ({ one }) => ({
    domain: one(domains, {
      fields: [suppressionLists.domainId],
      references: [domains.id],
    }),
  }),
);

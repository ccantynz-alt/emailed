/**
 * Bounces Route — Bounce & Complaint Analytics
 *
 * GET  /v1/bounces        — List recent bounces with pagination and filtering
 * GET  /v1/bounces/stats  — Aggregate bounce stats (rate by domain, by type, trending)
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc, lt, gte, lte, sql, inArray, count } from "drizzle-orm";
import { requireScope } from "../middleware/auth.js";
import {
  validateQuery,
  getValidatedQuery,
} from "../middleware/validator.js";
import { getDatabase, events, emails, domains } from "@emailed/db";

const bounces = new Hono();

// ─── Schemas ──────────────────────────────────────────────────────────────

const ListBouncesQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["hard", "soft"]).optional(),
  category: z
    .enum([
      "unknown_user",
      "mailbox_full",
      "domain_not_found",
      "policy_rejection",
      "spam_block",
      "rate_limited",
      "protocol_error",
      "content_rejected",
      "authentication_failed",
      "other",
    ])
    .optional(),
  domain: z.string().optional(),
  recipient: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

type ListBouncesParams = z.infer<typeof ListBouncesQuery>;

const BounceStatsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  domain: z.string().optional(),
  granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
});

type BounceStatsParams = z.infer<typeof BounceStatsQuery>;

// ─── GET /v1/bounces — List recent bounces ───────────────────────────────

bounces.get(
  "/",
  requireScope("analytics:read"),
  validateQuery(ListBouncesQuery),
  async (c) => {
    const query = getValidatedQuery<ListBouncesParams>(c);
    const auth = c.get("auth");
    const db = getDatabase();

    // Build WHERE conditions
    const conditions: ReturnType<typeof eq>[] = [
      eq(events.accountId, auth.accountId),
      eq(events.type, "email.bounced"),
    ];

    if (query.type) {
      conditions.push(eq(events.bounceType, query.type));
    }

    if (query.category) {
      conditions.push(eq(events.bounceCategory, query.category as "unknown_user"));
    }

    if (query.recipient) {
      conditions.push(eq(events.recipient, query.recipient));
    }

    if (query.from) {
      conditions.push(gte(events.timestamp, new Date(query.from)));
    }

    if (query.to) {
      conditions.push(lte(events.timestamp, new Date(query.to)));
    }

    if (query.cursor) {
      conditions.push(lt(events.timestamp, new Date(query.cursor)));
    }

    // If domain filter, resolve to email IDs for that domain
    if (query.domain) {
      const [domainRecord] = await db
        .select({ id: domains.id })
        .from(domains)
        .where(
          and(
            eq(domains.domain, query.domain),
            eq(domains.accountId, auth.accountId),
          ),
        )
        .limit(1);

      if (!domainRecord) {
        return c.json({ data: [], cursor: null, hasMore: false });
      }

      // Filter events by emails belonging to this domain
      const emailIds = await db
        .select({ id: emails.id })
        .from(emails)
        .where(
          and(
            eq(emails.domainId, domainRecord.id),
            eq(emails.accountId, auth.accountId),
          ),
        )
        .limit(10000);

      if (emailIds.length === 0) {
        return c.json({ data: [], cursor: null, hasMore: false });
      }

      conditions.push(
        inArray(
          events.emailId,
          emailIds.map((e) => e.id),
        ),
      );
    }

    const rows = await db
      .select({
        id: events.id,
        emailId: events.emailId,
        messageId: events.messageId,
        recipient: events.recipient,
        bounceType: events.bounceType,
        bounceCategory: events.bounceCategory,
        diagnosticCode: events.diagnosticCode,
        remoteMta: events.remoteMta,
        smtpResponse: events.smtpResponse,
        timestamp: events.timestamp,
      })
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.timestamp))
      .limit(query.limit + 1);

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const nextCursor =
      hasMore && page.length > 0
        ? page[page.length - 1]!.timestamp.toISOString()
        : null;

    return c.json({
      data: page.map((r) => ({
        id: r.id,
        emailId: r.emailId,
        messageId: r.messageId,
        recipient: r.recipient,
        bounceType: r.bounceType,
        bounceCategory: r.bounceCategory,
        diagnosticCode: r.diagnosticCode,
        remoteMta: r.remoteMta,
        smtpResponse: r.smtpResponse,
        timestamp: r.timestamp.toISOString(),
      })),
      cursor: nextCursor,
      hasMore,
    });
  },
);

// ─── GET /v1/bounces/stats — Aggregate bounce statistics ─────────────────

bounces.get(
  "/stats",
  requireScope("analytics:read"),
  validateQuery(BounceStatsQuery),
  async (c) => {
    const query = getValidatedQuery<BounceStatsParams>(c);
    const auth = c.get("auth");
    const db = getDatabase();

    // Base conditions for bounces
    const bounceConditions: ReturnType<typeof eq>[] = [
      eq(events.accountId, auth.accountId),
      eq(events.type, "email.bounced"),
    ];

    // Base conditions for complaints
    const complaintConditions: ReturnType<typeof eq>[] = [
      eq(events.accountId, auth.accountId),
      eq(events.type, "email.complained"),
    ];

    // Base conditions for all sent emails (for rate calculations)
    const sentConditions: ReturnType<typeof eq>[] = [
      eq(events.accountId, auth.accountId),
    ];

    if (query.from) {
      const fromDate = new Date(query.from);
      bounceConditions.push(gte(events.timestamp, fromDate));
      complaintConditions.push(gte(events.timestamp, fromDate));
      sentConditions.push(gte(events.timestamp, fromDate));
    }

    if (query.to) {
      const toDate = new Date(query.to);
      bounceConditions.push(lte(events.timestamp, toDate));
      complaintConditions.push(lte(events.timestamp, toDate));
      sentConditions.push(lte(events.timestamp, toDate));
    }

    // Domain filter
    if (query.domain) {
      const [domainRecord] = await db
        .select({ id: domains.id })
        .from(domains)
        .where(
          and(
            eq(domains.domain, query.domain),
            eq(domains.accountId, auth.accountId),
          ),
        )
        .limit(1);

      if (!domainRecord) {
        return c.json({
          data: {
            totalBounces: 0,
            hardBounces: 0,
            softBounces: 0,
            complaints: 0,
            bounceRate: 0,
            complaintRate: 0,
            byCategory: {},
            byDomain: {},
            trending: [],
          },
        });
      }

      const emailIds = await db
        .select({ id: emails.id })
        .from(emails)
        .where(
          and(
            eq(emails.domainId, domainRecord.id),
            eq(emails.accountId, auth.accountId),
          ),
        )
        .limit(50000);

      if (emailIds.length > 0) {
        const ids = emailIds.map((e) => e.id);
        bounceConditions.push(inArray(events.emailId, ids));
        complaintConditions.push(inArray(events.emailId, ids));
        sentConditions.push(inArray(events.emailId, ids));
      }
    }

    // Total bounces by type
    const [bounceCountResult] = await db
      .select({ count: count() })
      .from(events)
      .where(and(...bounceConditions));

    const totalBounces = bounceCountResult?.count ?? 0;

    // Hard bounces
    const [hardResult] = await db
      .select({ count: count() })
      .from(events)
      .where(and(...bounceConditions, eq(events.bounceType, "hard")));

    const hardBounces = hardResult?.count ?? 0;

    // Soft bounces
    const softBounces = totalBounces - hardBounces;

    // Total complaints
    const [complaintResult] = await db
      .select({ count: count() })
      .from(events)
      .where(and(...complaintConditions));

    const totalComplaints = complaintResult?.count ?? 0;

    // Total sent (for rate calculation: delivered + bounced events)
    const [deliveredResult] = await db
      .select({ count: count() })
      .from(events)
      .where(
        and(
          ...sentConditions,
          inArray(events.type, ["email.delivered", "email.bounced", "email.complained"]),
        ),
      );

    const totalSent = deliveredResult?.count ?? 0;
    const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;
    const complaintRate = totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0;

    // Bounces by category
    const categoryRows = await db
      .select({
        category: events.bounceCategory,
        count: count(),
      })
      .from(events)
      .where(and(...bounceConditions))
      .groupBy(events.bounceCategory);

    const byCategory: Record<string, number> = {};
    for (const row of categoryRows) {
      if (row.category) {
        byCategory[row.category] = row.count;
      }
    }

    // Bounces by recipient domain (top 20)
    const domainRows = await db
      .select({
        recipient: events.recipient,
        count: count(),
      })
      .from(events)
      .where(and(...bounceConditions))
      .groupBy(events.recipient)
      .orderBy(desc(count()))
      .limit(100);

    // Aggregate by domain part of recipient
    const byDomain: Record<string, number> = {};
    for (const row of domainRows) {
      if (row.recipient) {
        const domain = row.recipient.split("@")[1] ?? "unknown";
        byDomain[domain] = (byDomain[domain] ?? 0) + row.count;
      }
    }

    // Sort by count descending and take top 20
    const topDomains: Record<string, number> = {};
    const sortedDomains = Object.entries(byDomain)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);
    for (const [domain, cnt] of sortedDomains) {
      topDomains[domain] = cnt;
    }

    // Trending data — bounces over time using the requested granularity
    const truncFn = getTruncFunction(query.granularity);
    const trendingRows = await db
      .select({
        period: truncFn,
        bounceType: events.bounceType,
        count: count(),
      })
      .from(events)
      .where(and(...bounceConditions))
      .groupBy(truncFn, events.bounceType)
      .orderBy(truncFn)
      .limit(500);

    // Merge trending into time periods
    const trendMap = new Map<string, { hard: number; soft: number; total: number }>();
    for (const row of trendingRows) {
      const period = row.period instanceof Date ? row.period.toISOString() : String(row.period);
      const existing = trendMap.get(period) ?? { hard: 0, soft: 0, total: 0 };
      if (row.bounceType === "hard") {
        existing.hard += row.count;
      } else {
        existing.soft += row.count;
      }
      existing.total += row.count;
      trendMap.set(period, existing);
    }

    const trending = Array.from(trendMap.entries()).map(([period, data]) => ({
      period,
      ...data,
    }));

    return c.json({
      data: {
        totalBounces,
        hardBounces,
        softBounces,
        complaints: totalComplaints,
        bounceRate: Math.round(bounceRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 10000) / 10000,
        byCategory,
        byDomain: topDomains,
        trending,
      },
    });
  },
);

// ─── Helper: SQL date_trunc function ──────────────────────────────────────

function getTruncFunction(granularity: string) {
  switch (granularity) {
    case "hour":
      return sql<Date>`date_trunc('hour', ${events.timestamp})`;
    case "week":
      return sql<Date>`date_trunc('week', ${events.timestamp})`;
    case "month":
      return sql<Date>`date_trunc('month', ${events.timestamp})`;
    case "day":
    default:
      return sql<Date>`date_trunc('day', ${events.timestamp})`;
  }
}

export { bounces };

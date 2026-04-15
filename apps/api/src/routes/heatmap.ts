/**
 * Inbox Heatmap Analytics Routes (A3)
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { requireScope } from "../middleware/auth.js";
import { validateQuery, getValidatedQuery } from "../middleware/validator.js";
import { getDatabase, emails } from "@emailed/db";

const HeatmapPeriod = z.enum(["7d", "30d", "90d", "1y"]).default("90d");
const HeatmapQuerySchema = z.object({ period: HeatmapPeriod, mode: z.enum(["both", "sent", "received"]).default("both") });
type HeatmapQuery = z.infer<typeof HeatmapQuerySchema>;
const HourlyQuerySchema = z.object({ period: HeatmapPeriod });
type HourlyQuery = z.infer<typeof HourlyQuerySchema>;
const StatsQuerySchema = z.object({ period: HeatmapPeriod, compare: z.enum(["true", "false"]).default("false") });
type StatsQuery = z.infer<typeof StatsQuerySchema>;

function periodToDays(period: string): number {
  switch (period) { case "7d": return 7; case "30d": return 30; case "90d": return 90; case "1y": return 365; default: return 90; }
}

function periodFromDate(period: string): Date {
  const days = periodToDays(period);
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return from;
}

const heatmapAnalytics = new Hono();

heatmapAnalytics.get("/heatmap", requireScope("analytics:read"), validateQuery(HeatmapQuerySchema), async (c) => {
  const query = getValidatedQuery<HeatmapQuery>(c);
  const auth = c.get("auth");
  const db = getDatabase();
  const from = periodFromDate(query.period);
  const to = new Date();
  const rows = await db.select({ day: sql<string>`date_trunc('day', ${emails.createdAt})::date`.as("day"), status: emails.status, count: count() }).from(emails).where(and(eq(emails.accountId, auth.accountId), gte(emails.createdAt, from), lte(emails.createdAt, to))).groupBy(sql`day`, emails.status);
  const dayMap = new Map<string, { sent: number; received: number }>();
  for (const row of rows) {
    const dayStr = String(row.day).slice(0, 10);
    const existing = dayMap.get(dayStr) ?? { sent: 0, received: 0 };
    const isSent = ["sent", "delivered", "bounced", "complained"].includes(row.status);
    if (isSent) existing.sent += row.count; else existing.received += row.count;
    dayMap.set(dayStr, existing);
  }
  const heatmapData: { date: string; sent: number; received: number }[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const iso = cursor.toISOString().slice(0, 10);
    const entry = dayMap.get(iso);
    heatmapData.push({ date: iso, sent: entry?.sent ?? 0, received: entry?.received ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return c.json({ data: heatmapData, meta: { period: query.period, from: from.toISOString(), to: to.toISOString(), days: periodToDays(query.period) } });
});

heatmapAnalytics.get("/hourly", requireScope("analytics:read"), validateQuery(HourlyQuerySchema), async (c) => {
  const query = getValidatedQuery<HourlyQuery>(c);
  const auth = c.get("auth");
  const db = getDatabase();
  const from = periodFromDate(query.period);
  const to = new Date();
  const totalDays = periodToDays(query.period);
  const rows = await db.select({ hour: sql<number>`extract(hour from ${emails.createdAt})`.as("hour"), status: emails.status, count: count() }).from(emails).where(and(eq(emails.accountId, auth.accountId), gte(emails.createdAt, from), lte(emails.createdAt, to))).groupBy(sql`hour`, emails.status);
  const hourMap = new Map<number, { sent: number; received: number }>();
  for (const row of rows) {
    const h = Number(row.hour);
    const existing = hourMap.get(h) ?? { sent: 0, received: 0 };
    const isSent = ["sent", "delivered", "bounced", "complained"].includes(row.status);
    if (isSent) existing.sent += row.count; else existing.received += row.count;
    hourMap.set(h, existing);
  }
  const hourlyData: { hour: number; sent: number; received: number }[] = [];
  let peakHour = 0;
  let peakTotal = 0;
  for (let h = 0; h < 24; h++) {
    const raw = hourMap.get(h) ?? { sent: 0, received: 0 };
    const avgSent = Math.round((raw.sent / totalDays) * 10) / 10;
    const avgReceived = Math.round((raw.received / totalDays) * 10) / 10;
    hourlyData.push({ hour: h, sent: avgSent, received: avgReceived });
    if (avgSent + avgReceived > peakTotal) { peakTotal = avgSent + avgReceived; peakHour = h; }
  }
  const sorted = [...hourlyData].sort((a, b) => (b.sent + b.received) - (a.sent + a.received));
  const peakHours = sorted.slice(0, 3).map((b) => b.hour);
  const bestSendHours = hourlyData.filter((b) => b.hour >= 8 && b.hour <= 15 && b.received > 0).sort((a, b) => b.received - a.received).slice(0, 3).map((b) => b.hour);
  return c.json({ data: hourlyData, meta: { period: query.period, from: from.toISOString(), to: to.toISOString(), peakHour, peakHours, bestSendHours } });
});

heatmapAnalytics.get("/stats", requireScope("analytics:read"), validateQuery(StatsQuerySchema), async (c) => {
  const query = getValidatedQuery<StatsQuery>(c);
  const auth = c.get("auth");
  const db = getDatabase();
  const days = periodToDays(query.period);
  const to = new Date();
  const from = periodFromDate(query.period);
  const dailyCounts = await db.select({ day: sql<string>`date_trunc('day', ${emails.createdAt})::date`.as("day"), status: emails.status, count: count() }).from(emails).where(and(eq(emails.accountId, auth.accountId), gte(emails.createdAt, from), lte(emails.createdAt, to))).groupBy(sql`day`, emails.status);
  let totalSent = 0;
  let totalReceived = 0;
  const dayTotals = new Map<string, number>();
  for (const row of dailyCounts) {
    const dayStr = String(row.day).slice(0, 10);
    const isSent = ["sent", "delivered", "bounced", "complained"].includes(row.status);
    if (isSent) totalSent += row.count; else totalReceived += row.count;
    dayTotals.set(dayStr, (dayTotals.get(dayStr) ?? 0) + row.count);
  }
  const emailsPerDay = days > 0 ? Math.round(((totalSent + totalReceived) / days) * 10) / 10 : 0;
  let busiestDay: string | null = null;
  let busiestCount = 0;
  let quietestDay: string | null = null;
  let quietestCount = Infinity;
  for (const [day, total] of dayTotals) {
    if (total > busiestCount) { busiestCount = total; busiestDay = day; }
    if (total < quietestCount) { quietestCount = total; quietestDay = day; }
  }
  if (dayTotals.size === 0) quietestDay = null;
  const avgResponseTimeSec: number | null = null;
  let inboxZeroStreak = 0;
  const todayStr = to.toISOString().slice(0, 10);
  const streakCursor = new Date(to);
  for (let i = 0; i < days; i++) {
    const dayStr = streakCursor.toISOString().slice(0, 10);
    const dayTotal = dayTotals.get(dayStr) ?? 0;
    if (dayTotal === 0 && dayStr <= todayStr) inboxZeroStreak++;
    else if (dayTotal > 0 && i > 0) break;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  const metrics = { avgResponseTimeSec, emailsPerDay, busiestDay, quietestDay, inboxZeroStreak, totalSent, totalReceived };
  let compare: { avgResponseTimeDelta: number | null; emailsPerDayDelta: number | null; totalSentDelta: number | null; totalReceivedDelta: number | null } | null = null;
  if (query.compare === "true") {
    const prevFrom = new Date(from);
    prevFrom.setDate(prevFrom.getDate() - days);
    const prevCounts = await db.select({ status: emails.status, count: count() }).from(emails).where(and(eq(emails.accountId, auth.accountId), gte(emails.createdAt, prevFrom), lte(emails.createdAt, from))).groupBy(emails.status);
    let prevSent = 0;
    let prevReceived = 0;
    for (const row of prevCounts) {
      const isSent = ["sent", "delivered", "bounced", "complained"].includes(row.status);
      if (isSent) prevSent += row.count; else prevReceived += row.count;
    }
    const prevEmailsPerDay = days > 0 ? Math.round(((prevSent + prevReceived) / days) * 10) / 10 : 0;
    compare = { avgResponseTimeDelta: null, emailsPerDayDelta: Math.round((emailsPerDay - prevEmailsPerDay) * 10) / 10, totalSentDelta: totalSent - prevSent, totalReceivedDelta: totalReceived - prevReceived };
  }
  return c.json({ data: { metrics, compare }, meta: { period: query.period, from: from.toISOString(), to: to.toISOString(), days } });
});

export { heatmapAnalytics };

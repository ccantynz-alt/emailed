/**
 * Predictive Send-Time Optimization Route (S10)
 *
 * POST /v1/send-time/predict        — Get recommended send times for a recipient
 * POST /v1/send-time/analyze        — Get full pattern analysis for a recipient
 * POST /v1/send-time/auto-schedule  — Schedule an existing email at the predicted optimal time
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { requireScope } from "../middleware/auth.js";
import { validateBody, getValidatedBody } from "../middleware/validator.js";
import { getDatabase, emails } from "@emailed/db";
import {
  analyzeRecipientPatterns,
  predictBestSendTime,
  type HistoricalEmail,
} from "@emailed/ai-engine/send-time";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const PredictSchema = z.object({
  recipientEmail: z.string().email(),
  senderTimezone: z.string().default("UTC"),
  recipientTimezone: z.string().optional(),
  urgency: z.enum(["low", "normal", "high"]).default("normal"),
  windowDays: z.number().int().min(1).max(30).optional(),
});

const AnalyzeSchema = z.object({
  recipientEmail: z.string().email(),
  lookbackDays: z.number().int().min(7).max(365).default(180),
});

const AutoScheduleSchema = z.object({
  emailId: z.string(),
  recipientEmail: z.string().email(),
  senderTimezone: z.string().default("UTC"),
  recipientTimezone: z.string().optional(),
  urgency: z.enum(["low", "normal", "high"]).default("normal"),
  windowDays: z.number().int().min(1).max(30).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface EmailRow {
  createdAt: Date;
  sentAt: Date | null;
  toAddresses: unknown;
}

function rowsToHistorical(
  rows: ReadonlyArray<EmailRow>,
  recipient: string,
): HistoricalEmail[] {
  const lower = recipient.toLowerCase();
  const out: HistoricalEmail[] = [];
  for (const row of rows) {
    const tos = Array.isArray(row.toAddresses) ? row.toAddresses : [];
    const matches = tos.some((t) => {
      if (typeof t !== "object" || t === null) return false;
      const addr = (t as Record<string, unknown>)["address"];
      return typeof addr === "string" && addr.toLowerCase() === lower;
    });
    if (!matches) continue;
    const sentAt = row.sentAt ?? row.createdAt;
    out.push({ sentAt });
  }
  return out;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const sendTime = new Hono();

// POST /v1/send-time/predict
sendTime.post(
  "/predict",
  requireScope("messages:read"),
  validateBody(PredictSchema),
  async (c) => {
    const input = getValidatedBody<z.infer<typeof PredictSchema>>(c);
    const recommendation = await predictBestSendTime(input);
    return c.json({ data: recommendation });
  },
);

// POST /v1/send-time/analyze
sendTime.post(
  "/analyze",
  requireScope("messages:read"),
  validateBody(AnalyzeSchema),
  async (c) => {
    const input = getValidatedBody<z.infer<typeof AnalyzeSchema>>(c);
    const auth = c.get("auth");
    const db = getDatabase();

    const rows = await db
      .select({
        createdAt: emails.createdAt,
        sentAt: emails.sentAt,
        toAddresses: emails.toAddresses,
      })
      .from(emails)
      .where(eq(emails.accountId, auth.accountId))
      .orderBy(desc(emails.createdAt))
      .limit(500);

    const historical = rowsToHistorical(rows, input.recipientEmail);
    const pattern = await analyzeRecipientPatterns(input.recipientEmail, historical);

    return c.json({
      data: {
        recipientEmail: input.recipientEmail,
        sampleSize: historical.length,
        pattern,
      },
    });
  },
);

// POST /v1/send-time/auto-schedule
sendTime.post(
  "/auto-schedule",
  requireScope("messages:send"),
  validateBody(AutoScheduleSchema),
  async (c) => {
    const input = getValidatedBody<z.infer<typeof AutoScheduleSchema>>(c);
    const auth = c.get("auth");
    const db = getDatabase();

    const recommendation = await predictBestSendTime(input);
    const top = recommendation.recommendedTimes[0];
    if (!top) {
      return c.json(
        {
          error: {
            type: "no_recommendation",
            message: "No optimal send time could be determined",
            code: "no_send_time",
          },
        },
        422,
      );
    }

    const sendAt = new Date(top.datetime);
    if (sendAt <= new Date()) {
      return c.json(
        {
          error: {
            type: "invalid_time",
            message: "Optimal send time has already passed",
            code: "past_send_time",
          },
        },
        422,
      );
    }

    const result = await db
      .update(emails)
      .set({
        scheduledAt: sendAt,
        status: "queued",
        updatedAt: new Date(),
      })
      .where(and(eq(emails.id, input.emailId), eq(emails.accountId, auth.accountId)))
      .returning({ id: emails.id });

    if (result.length === 0) {
      return c.json(
        {
          error: {
            type: "not_found",
            message: `Email ${input.emailId} not found`,
            code: "email_not_found",
          },
        },
        404,
      );
    }

    return c.json({
      data: {
        emailId: input.emailId,
        scheduledAt: sendAt.toISOString(),
        confidence: top.confidence,
        reasoning: top.reasoning,
        alternatives: recommendation.recommendedTimes.slice(1),
      },
    });
  },
);

export { sendTime };

/**
 * Voice Clone Route — High-fidelity voice cloning for AI replies (S4)
 *
 * POST /v1/voice-clone/build      — Build voice clone from sent email history
 * GET  /v1/voice-clone             — Get current voice clone
 * POST /v1/voice-clone/generate    — Generate text in user's voice (advanced)
 * POST /v1/voice-clone/calibrate   — Calibrate clone with user-supplied examples
 *
 * This is BEYOND /v1/voice — the clone captures signature phrases, idioms,
 * sentence rhythm fingerprints, vocabulary fingerprints, and conditions Claude
 * with real example sentences from the user.
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { requireScope } from "../middleware/auth.js";
import {
  validateBody,
  getValidatedBody,
} from "../middleware/validator.js";
import { getDatabase, emails } from "@emailed/db";
import {
  buildClone,
  calibrateClone,
  generateInVoice,
  type VoiceClone,
  type VoiceCloneAIClient,
} from "@emailed/ai-engine/voice/cloner";

// ─── In-memory clone cache (production: persist in DB / Redis) ───────────────

const voiceClones = new Map<string, VoiceClone>();

// ─── Claude client ───────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY =
  process.env["ANTHROPIC_API_KEY"] ?? process.env["CLAUDE_API_KEY"];

const claudeClient: VoiceCloneAIClient = {
  async generate(prompt, options) {
    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Voice cloning requires Claude API access.",
      );
    }

    const body: Record<string, unknown> = {
      model: "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
      messages: [{ role: "user", content: prompt }],
    };
    if (options?.system) body["system"] = options.system;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    return data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
  },
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const BuildSchema = z.object({
  sampleSize: z.number().int().min(5).max(500).default(100),
});

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(4000),
  recipient: z.string().max(200).optional(),
  threadHistory: z
    .array(
      z.object({
        from: z.string().max(200),
        body: z.string().max(8000),
      }),
    )
    .max(20)
    .optional(),
  replyTo: z
    .object({
      from: z.string().max(200),
      subject: z.string().max(500),
      body: z.string().max(8000),
    })
    .optional(),
});

const CalibrateSchema = z.object({
  examples: z.array(z.string().min(3).max(500)).min(1).max(10),
});

// ─── Routes ──────────────────────────────────────────────────────────────────

const voiceClone = new Hono();

// POST /v1/voice-clone/build
voiceClone.post(
  "/build",
  requireScope("voice:write"),
  validateBody(BuildSchema),
  async (c) => {
    const input = getValidatedBody<z.infer<typeof BuildSchema>>(c);
    const auth = c.get("auth");
    const db = getDatabase();

    const sentEmails = await db
      .select({ textBody: emails.textBody })
      .from(emails)
      .where(
        and(eq(emails.accountId, auth.accountId), eq(emails.status, "delivered")),
      )
      .orderBy(desc(emails.createdAt))
      .limit(input.sampleSize);

    const texts = sentEmails
      .map((e) => e.textBody ?? "")
      .filter((t) => t.length > 20);

    if (texts.length < 5) {
      return c.json(
        {
          error: {
            type: "insufficient_data",
            message: `Need at least 5 sent emails to build a voice clone. Found ${texts.length}.`,
            code: "insufficient_samples",
          },
        },
        400,
      );
    }

    const clone = await buildClone(auth.accountId, texts);
    voiceClones.set(auth.accountId, clone);

    return c.json({ data: clone });
  },
);

// GET /v1/voice-clone
voiceClone.get("/", requireScope("voice:read"), async (c) => {
  const auth = c.get("auth");
  const clone = voiceClones.get(auth.accountId);

  if (!clone) {
    return c.json(
      {
        error: {
          type: "not_found",
          message: "No voice clone found. Run POST /v1/voice-clone/build first.",
          code: "clone_not_found",
        },
      },
      404,
    );
  }

  return c.json({ data: clone });
});

// POST /v1/voice-clone/generate
voiceClone.post(
  "/generate",
  requireScope("voice:write"),
  validateBody(GenerateSchema),
  async (c) => {
    const input = getValidatedBody<z.infer<typeof GenerateSchema>>(c);
    const auth = c.get("auth");

    const clone = voiceClones.get(auth.accountId);
    if (!clone) {
      return c.json(
        {
          error: {
            type: "not_found",
            message:
              "No voice clone found for this account. Run POST /v1/voice-clone/build first.",
            code: "clone_not_found",
          },
        },
        404,
      );
    }

    const body = await generateInVoice(
      clone,
      input.prompt,
      {
        recipient: input.recipient,
        threadHistory: input.threadHistory,
        replyTo: input.replyTo,
      },
      claudeClient,
    );

    return c.json({
      data: {
        body,
        cloneBuiltAt: clone.builtAt,
        sampleCount: clone.sampleCount,
      },
    });
  },
);

// POST /v1/voice-clone/calibrate
voiceClone.post(
  "/calibrate",
  requireScope("voice:write"),
  validateBody(CalibrateSchema),
  async (c) => {
    const input = getValidatedBody<z.infer<typeof CalibrateSchema>>(c);
    const auth = c.get("auth");

    const clone = voiceClones.get(auth.accountId);
    if (!clone) {
      return c.json(
        {
          error: {
            type: "not_found",
            message: "No voice clone found. Run POST /v1/voice-clone/build first.",
            code: "clone_not_found",
          },
        },
        404,
      );
    }

    const calibrated = calibrateClone(clone, input.examples);
    voiceClones.set(auth.accountId, calibrated);

    return c.json({ data: calibrated });
  },
);

export { voiceClone };

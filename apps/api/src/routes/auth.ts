/**
 * Authentication Routes
 *
 * POST /v1/auth/login     — Email + password login, returns session token
 * POST /v1/auth/register  — Create account + user, returns session token
 * GET  /v1/auth/me        — Get current user from session token
 */

import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { validateBody, getValidatedBody } from "../middleware/validator.js";
import { getDatabase, users, accounts } from "@emailed/db";

const auth = new Hono();

function generateId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a minimal JWT (no external library required).
 * In production, use a proper JWT library with RS256.
 */
function createToken(payload: Record<string, unknown>): string {
  const secret = process.env["JWT_SECRET"] ?? "dev_secret";
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    }),
  );
  // Simplified HMAC — in production use crypto.subtle.sign
  const signature = btoa(`${header}.${body}.${secret}`);
  return `${header}.${body}.${signature}`;
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(256),
  accountName: z.string().min(1).max(256).optional(),
});

// POST /v1/auth/login
auth.post("/login", validateBody(LoginSchema), async (c) => {
  const input = getValidatedBody<z.infer<typeof LoginSchema>>(c);
  const db = getDatabase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (!user) {
    return c.json(
      {
        error: {
          type: "authentication_error",
          message: "Invalid email or password",
          code: "invalid_credentials",
        },
      },
      401,
    );
  }

  const passwordHash = await hashPassword(input.password);
  if (user.passwordHash !== passwordHash) {
    return c.json(
      {
        error: {
          type: "authentication_error",
          message: "Invalid email or password",
          code: "invalid_credentials",
        },
      },
      401,
    );
  }

  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const token = createToken({
    sub: user.accountId,
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return c.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountId: user.accountId,
      },
    },
  });
});

// POST /v1/auth/register
auth.post("/register", validateBody(RegisterSchema), async (c) => {
  const input = getValidatedBody<z.infer<typeof RegisterSchema>>(c);
  const db = getDatabase();

  // Check if user already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (existing) {
    return c.json(
      {
        error: {
          type: "validation_error",
          message: "An account with this email already exists",
          code: "email_exists",
        },
      },
      409,
    );
  }

  const accountId = generateId();
  const userId = generateId();
  const passwordHash = await hashPassword(input.password);

  // Create account
  await db.insert(accounts).values({
    id: accountId,
    name: input.accountName ?? `${input.name}'s Account`,
    planTier: "free",
    billingEmail: input.email.toLowerCase(),
    emailsSentThisPeriod: 0,
  });

  // Create user
  await db.insert(users).values({
    id: userId,
    accountId,
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash,
    role: "owner",
    emailVerified: false,
    permissions: {
      sendEmail: true,
      readEmail: true,
      manageDomains: true,
      manageApiKeys: true,
      manageWebhooks: true,
      viewAnalytics: true,
      manageAccount: true,
      manageTeamMembers: true,
    },
  });

  const token = createToken({
    sub: accountId,
    userId,
    email: input.email.toLowerCase(),
    role: "owner",
  });

  return c.json(
    {
      data: {
        token,
        user: {
          id: userId,
          email: input.email.toLowerCase(),
          name: input.name,
          role: "owner",
          accountId,
        },
      },
    },
    201,
  );
});

// GET /v1/auth/me — Get current user from bearer token
auth.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        error: {
          type: "authentication_error",
          message: "Missing token",
          code: "unauthenticated",
        },
      },
      401,
    );
  }

  const token = authHeader.slice(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token");

    const payload = JSON.parse(atob(parts[1]!));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    const db = getDatabase();
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        accountId: users.accountId,
      })
      .from(users)
      .where(eq(users.id, payload.userId as string))
      .limit(1);

    if (!user) throw new Error("User not found");

    return c.json({ data: user });
  } catch {
    return c.json(
      {
        error: {
          type: "authentication_error",
          message: "Invalid or expired token",
          code: "invalid_token",
        },
      },
      401,
    );
  }
});

export { auth };

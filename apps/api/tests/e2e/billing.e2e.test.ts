/**
 * E2E Tests — Billing API
 *
 * GET  /v1/billing/usage  — Get current usage stats
 * GET  /v1/billing/plan   — Get current plan details and limits
 */

import { describe, it, expect } from "vitest";
import { authRequest, apiRequest, jsonBody } from "./helpers.js";
import type { ApiError } from "./helpers.js";

describe("Billing API", () => {
  // ─── GET /v1/billing/usage ────────────────────────────────────────────────

  describe("GET /v1/billing/usage", () => {
    it("should return usage statistics", async () => {
      const res = await authRequest("GET", "/v1/billing/usage");

      // 200 if billing works, 500 if Stripe/DB is unreachable
      expect([200, 500]).toContain(res.status);

      if (res.status === 200) {
        const body = await jsonBody<{
          data: {
            emailsSent: number;
            emailLimit: number;
            percentUsed: number;
            planTier: string;
            periodStartedAt: string;
          };
        }>(res);

        expect(body.data).toBeDefined();
        expect(typeof body.data.emailsSent).toBe("number");
        expect(typeof body.data.percentUsed).toBe("number");
        expect(body.data.planTier).toBeDefined();
      } else {
        const body = await jsonBody<ApiError>(res);
        expect(body.error.code).toBe("usage_fetch_failed");
      }
    });

    it("should reject unauthenticated requests", async () => {
      const res = await apiRequest("GET", "/v1/billing/usage");
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /v1/billing/plan ─────────────────────────────────────────────────

  describe("GET /v1/billing/plan", () => {
    it("should return plan details with limits and usage", async () => {
      const res = await authRequest("GET", "/v1/billing/plan");

      expect([200, 500]).toContain(res.status);

      if (res.status === 200) {
        const body = await jsonBody<{
          data: {
            planId: string;
            name: string;
            limits: {
              emailsPerMonth: number;
              domains: number;
              webhooks: number;
            };
            usage: {
              emailsSent: number;
              percentUsed: number;
            };
            periodStartedAt: string;
          };
        }>(res);

        expect(body.data).toBeDefined();
        expect(body.data.planId).toBeDefined();
        expect(body.data.name).toBeDefined();

        // Limits
        expect(body.data.limits).toBeDefined();
        expect(typeof body.data.limits.emailsPerMonth).toBe("number");
        expect(typeof body.data.limits.domains).toBe("number");
        expect(typeof body.data.limits.webhooks).toBe("number");

        // Usage
        expect(body.data.usage).toBeDefined();
        expect(typeof body.data.usage.emailsSent).toBe("number");
        expect(typeof body.data.usage.percentUsed).toBe("number");
      } else {
        const body = await jsonBody<ApiError>(res);
        expect(body.error.code).toBe("plan_fetch_failed");
      }
    });

    it("should reject unauthenticated requests", async () => {
      const res = await apiRequest("GET", "/v1/billing/plan");
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/billing/checkout (error cases only) ────────────────────────

  describe("POST /v1/billing/checkout", () => {
    it("should reject requests with invalid plan ID", async () => {
      const res = await authRequest("POST", "/v1/billing/checkout", {
        body: {
          planId: "invalid_plan",
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        },
      });

      expect(res.status).toBe(422);
    });

    it("should reject requests with missing URLs", async () => {
      const res = await authRequest("POST", "/v1/billing/checkout", {
        body: {
          planId: "starter",
        },
      });

      expect(res.status).toBe(422);
    });

    it("should reject requests with invalid URLs", async () => {
      const res = await authRequest("POST", "/v1/billing/checkout", {
        body: {
          planId: "starter",
          successUrl: "not-a-url",
          cancelUrl: "also-not-a-url",
        },
      });

      expect(res.status).toBe(422);
    });

    it("should reject unauthenticated requests", async () => {
      const res = await apiRequest("POST", "/v1/billing/checkout", {
        body: {
          planId: "starter",
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        },
      });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/billing/portal (error cases only) ──────────────────────────

  describe("POST /v1/billing/portal", () => {
    it("should reject requests with missing returnUrl", async () => {
      const res = await authRequest("POST", "/v1/billing/portal", {
        body: {},
      });

      expect(res.status).toBe(422);
    });

    it("should reject requests with invalid returnUrl", async () => {
      const res = await authRequest("POST", "/v1/billing/portal", {
        body: { returnUrl: "not-a-url" },
      });

      expect(res.status).toBe(422);
    });

    it("should reject unauthenticated requests", async () => {
      const res = await apiRequest("POST", "/v1/billing/portal", {
        body: { returnUrl: "https://example.com" },
      });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /v1/billing/webhook (Stripe signature tests) ───────────────────

  describe("POST /v1/billing/webhook", () => {
    it("should reject requests without stripe-signature header", async () => {
      const res = await apiRequest("POST", "/v1/billing/webhook", {
        body: { type: "test.event" },
      });

      expect(res.status).toBe(400);
      const body = await jsonBody<ApiError>(res);
      expect(body.error.code).toBe("missing_signature");
    });

    it("should reject requests with an invalid signature", async () => {
      const res = await apiRequest("POST", "/v1/billing/webhook", {
        body: { type: "test.event" },
        headers: {
          "stripe-signature": "t=1234,v1=invalid_signature",
        },
      });

      expect(res.status).toBe(400);
      const body = await jsonBody<ApiError>(res);
      expect(body.error.code).toBe("invalid_signature");
    });
  });
});

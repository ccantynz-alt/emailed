/**
 * End-to-end integration tests for the Webhooks API routes.
 *
 * Tests cover:
 *   POST   /v1/webhooks             — create webhook
 *   GET    /v1/webhooks             — list webhooks
 *   GET    /v1/webhooks/:id         — get single webhook
 *   PATCH  /v1/webhooks/:id         — update webhook
 *   DELETE /v1/webhooks/:id         — delete webhook
 *   POST   /v1/webhooks/:id/test    — send test event
 *   GET    /v1/webhooks/:id/deliveries — list deliveries
 */

import { describe, it, expect, vi } from "vitest";
import {
  createTestApp,
  jsonRequest,
  mockDb,
  DEFAULT_AUTH,
  TEST_ACCOUNT_ID,
} from "./setup.js";
import { webhooks } from "../src/routes/webhooks.js";

function buildApp(auth = DEFAULT_AUTH) {
  const app = createTestApp(auth);
  app.route("/v1/webhooks", webhooks);
  return app;
}

// ─── POST /v1/webhooks ──────────────────────────────────────────────────────

describe("POST /v1/webhooks", () => {
  it("should create a webhook and return 201", async () => {
    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks", {
      method: "POST",
      body: {
        url: "https://example.com/webhook",
        events: ["delivered", "bounced"],
        description: "Test webhook",
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.url).toBe("https://example.com/webhook");
    expect(body.data.events).toEqual(["delivered", "bounced"]);
    expect(body.data.active).toBe(true);
    // Secret should be masked
    expect(body.data.secret).toContain("whsec_");
    expect(body.data).toHaveProperty("id");
    expect(body.data).toHaveProperty("createdAt");
  });

  it("should reject invalid URL", async () => {
    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks", {
      method: "POST",
      body: {
        url: "not-a-url",
        events: ["delivered"],
      },
    });

    expect(res.status).toBe(422);
  });

  it("should reject empty events array", async () => {
    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks", {
      method: "POST",
      body: {
        url: "https://example.com/webhook",
        events: [],
      },
    });

    expect(res.status).toBe(422);
  });

  it("should reject invalid event types", async () => {
    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks", {
      method: "POST",
      body: {
        url: "https://example.com/webhook",
        events: ["invalid_event"],
      },
    });

    expect(res.status).toBe(422);
  });

  it("should allow setting active to false on creation", async () => {
    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks", {
      method: "POST",
      body: {
        url: "https://example.com/webhook",
        events: ["delivered"],
        active: false,
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.active).toBe(false);
  });
});

// ─── GET /v1/webhooks ───────────────────────────────────────────────────────

describe("GET /v1/webhooks", () => {
  it("should return empty list when no webhooks exist", async () => {
    mockDb.orderBy.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it("should return list of webhooks", async () => {
    const now = new Date();
    mockDb.orderBy.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://example.com/webhook",
        eventTypes: ["delivered"],
        secret: "whsec_secret123",
        description: "My webhook",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].url).toBe("https://example.com/webhook");
    expect(body.data[0].events).toEqual(["delivered"]);
    // Secret should be masked
    expect(body.data[0].secret).toBe("whsec_••••••••");
  });
});

// ─── GET /v1/webhooks/:id ───────────────────────────────────────────────────

describe("GET /v1/webhooks/:id", () => {
  it("should return a single webhook", async () => {
    const now = new Date();
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://example.com/webhook",
        eventTypes: ["delivered", "bounced"],
        secret: "whsec_secret123",
        description: "Test",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("wh_1");
    expect(body.data.events).toEqual(["delivered", "bounced"]);
  });

  it("should return 404 for non-existent webhook", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/nonexistent");

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("webhook_not_found");
  });
});

// ─── PATCH /v1/webhooks/:id ─────────────────────────────────────────────────

describe("PATCH /v1/webhooks/:id", () => {
  it("should update webhook URL", async () => {
    const now = new Date();
    // Ownership check
    mockDb.limit.mockResolvedValueOnce([{ id: "wh_1" }]);
    // Updated record
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://new-url.com/webhook",
        eventTypes: ["delivered"],
        secret: "whsec_secret123",
        description: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1", {
      method: "PATCH",
      body: { url: "https://new-url.com/webhook" },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.url).toBe("https://new-url.com/webhook");
  });

  it("should update webhook events", async () => {
    const now = new Date();
    mockDb.limit.mockResolvedValueOnce([{ id: "wh_1" }]);
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://example.com/webhook",
        eventTypes: ["delivered", "opened", "clicked"],
        secret: "whsec_secret123",
        description: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1", {
      method: "PATCH",
      body: { events: ["delivered", "opened", "clicked"] },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.events).toEqual(["delivered", "opened", "clicked"]);
  });

  it("should deactivate a webhook", async () => {
    const now = new Date();
    mockDb.limit.mockResolvedValueOnce([{ id: "wh_1" }]);
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://example.com/webhook",
        eventTypes: ["delivered"],
        secret: "whsec_secret123",
        description: null,
        isActive: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1", {
      method: "PATCH",
      body: { active: false },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.active).toBe(false);
  });

  it("should return 404 when updating non-existent webhook", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/nonexistent", {
      method: "PATCH",
      body: { url: "https://example.com/new" },
    });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /v1/webhooks/:id ────────────────────────────────────────────────

describe("DELETE /v1/webhooks/:id", () => {
  it("should delete webhook and return success", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "wh_1" }]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1", {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(body.id).toBe("wh_1");
  });

  it("should return 404 when deleting non-existent webhook", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/nonexistent", {
      method: "DELETE",
    });

    expect(res.status).toBe(404);
  });
});

// ─── POST /v1/webhooks/:id/test ─────────────────────────────────────────────

describe("POST /v1/webhooks/:id/test", () => {
  it("should enqueue a test event", async () => {
    const now = new Date();
    mockDb.limit.mockResolvedValueOnce([
      {
        id: "wh_1",
        url: "https://example.com/webhook",
        eventTypes: ["delivered"],
        isActive: true,
        accountId: TEST_ACCOUNT_ID,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1/test", {
      method: "POST",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.success).toBe(true);
    expect(body.data).toHaveProperty("eventId");
    expect(body.data.eventType).toBe("delivered");
  });

  it("should return 404 for non-existent webhook", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/nonexistent/test", {
      method: "POST",
    });

    expect(res.status).toBe(404);
  });
});

// ─── GET /v1/webhooks/:id/deliveries ────────────────────────────────────────

describe("GET /v1/webhooks/:id/deliveries", () => {
  it("should return delivery attempts for a webhook", async () => {
    const now = new Date();
    // Ownership check
    mockDb.limit.mockResolvedValueOnce([{ id: "wh_1" }]);
    // Delivery rows
    mockDb.offset.mockResolvedValueOnce([
      {
        id: "del_1",
        eventId: "evt_1",
        statusCode: "200",
        responseBody: "OK",
        attemptCount: 1,
        success: true,
        nextRetryAt: null,
        createdAt: now,
      },
      {
        id: "del_2",
        eventId: "evt_2",
        statusCode: "500",
        responseBody: "Internal Server Error",
        attemptCount: 2,
        success: false,
        nextRetryAt: now,
        createdAt: now,
      },
    ]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1/deliveries");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].statusCode).toBe(200);
    expect(body.data[0].success).toBe(true);
    expect(body.data[1].statusCode).toBe(500);
    expect(body.data[1].success).toBe(false);
  });

  it("should return 404 when webhook does not belong to account", async () => {
    mockDb.limit.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/other_wh/deliveries");

    expect(res.status).toBe(404);
  });

  it("should return empty list when no deliveries exist", async () => {
    mockDb.limit.mockResolvedValueOnce([{ id: "wh_1" }]);
    mockDb.offset.mockResolvedValueOnce([]);

    const app = buildApp();
    const res = await jsonRequest(app, "/v1/webhooks/wh_1/deliveries");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });
});

// ─── Full CRUD lifecycle ────────────────────────────────────────────────────

describe("Webhooks CRUD lifecycle", () => {
  it("should create, read, update, and delete a webhook", async () => {
    const app = buildApp();
    const now = new Date();

    // 1. Create
    const createRes = await jsonRequest(app, "/v1/webhooks", {
      method: "POST",
      body: {
        url: "https://example.com/hook",
        events: ["delivered"],
        description: "Lifecycle test",
      },
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()).data;
    const webhookId = created.id;

    // 2. Read
    mockDb.limit.mockResolvedValueOnce([
      {
        id: webhookId,
        url: "https://example.com/hook",
        eventTypes: ["delivered"],
        secret: "whsec_test",
        description: "Lifecycle test",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    const getRes = await jsonRequest(app, `/v1/webhooks/${webhookId}`);
    expect(getRes.status).toBe(200);
    const retrieved = (await getRes.json()).data;
    expect(retrieved.url).toBe("https://example.com/hook");

    // 3. Update
    mockDb.limit
      .mockResolvedValueOnce([{ id: webhookId }])
      .mockResolvedValueOnce([
        {
          id: webhookId,
          url: "https://example.com/hook-v2",
          eventTypes: ["delivered", "bounced"],
          secret: "whsec_test",
          description: "Updated",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ]);

    const updateRes = await jsonRequest(app, `/v1/webhooks/${webhookId}`, {
      method: "PATCH",
      body: {
        url: "https://example.com/hook-v2",
        events: ["delivered", "bounced"],
        description: "Updated",
      },
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()).data;
    expect(updated.url).toBe("https://example.com/hook-v2");

    // 4. Delete
    mockDb.limit.mockResolvedValueOnce([{ id: webhookId }]);
    const deleteRes = await jsonRequest(app, `/v1/webhooks/${webhookId}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(200);
    const deleted = await deleteRes.json();
    expect(deleted.deleted).toBe(true);
  });
});

// ─── Scope enforcement ──────────────────────────────────────────────────────

describe("Webhooks scope enforcement", () => {
  it("should reject when missing webhooks:manage scope", async () => {
    const app = buildApp({
      ...DEFAULT_AUTH,
      scopes: ["messages:send"],
    });

    const res = await jsonRequest(app, "/v1/webhooks");
    expect(res.status).toBe(403);
  });
});

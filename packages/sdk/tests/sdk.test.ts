import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiClient, ApiError, RateLimitError } from "../src/client/api-client.js";
import { Messages } from "../src/resources/messages.js";
import { Domains } from "../src/resources/domains.js";

// ---------------------------------------------------------------------------
// Helpers -- lightweight fetch mock
// ---------------------------------------------------------------------------

/** Create a fake Response that mimics the global fetch return value. */
function fakeResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const status = init.status ?? 200;
  const headers = new Headers(init.headers ?? {});
  return new Response(JSON.stringify(body), { status, headers });
}

/** Install a global fetch mock that returns the given response(s). */
function mockFetch(
  ...responses: Array<Response | (() => Response)>
): ReturnType<typeof vi.fn> {
  let callIndex = 0;
  const mock = vi.fn(async () => {
    const entry = responses[Math.min(callIndex, responses.length - 1)]!;
    callIndex++;
    return typeof entry === "function" ? entry() : entry;
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

// ---------------------------------------------------------------------------
// ApiClient tests
// ---------------------------------------------------------------------------

describe("ApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should construct with apiKey auth and use default base URL", async () => {
    const fetchMock = mockFetch(fakeResponse({ ok: true }));

    const client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test123" },
    });

    await client.get("/v1/ping");

    expect(fetchMock).toHaveBeenCalledOnce();
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toBe("https://api.emailed.dev/v1/ping");
  });

  it("should construct with bearer auth and custom base URL", async () => {
    const fetchMock = mockFetch(fakeResponse({ ok: true }));

    const client = new ApiClient({
      auth: { type: "bearer", token: "tok_abc" },
      baseUrl: "https://custom.api.dev",
    });

    await client.get("/v1/status");

    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toBe("https://custom.api.dev/v1/status");

    const calledInit = fetchMock.mock.calls[0]![1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)["Authorization"]).toBe("Bearer tok_abc");
  });

  it("should send correct Authorization header for apiKey auth", async () => {
    const fetchMock = mockFetch(fakeResponse({ data: 1 }));

    const client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_xyz" },
    });

    await client.get("/v1/test");

    const calledInit = fetchMock.mock.calls[0]![1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)["Authorization"]).toBe("Bearer em_live_xyz");
  });

  it("should throw ApiError on 4xx responses", async () => {
    // Use a factory so each call gets a fresh Response (body can only be consumed once)
    mockFetch(
      () => fakeResponse({ code: "not_found", message: "Resource not found" }, { status: 404 }),
      () => fakeResponse({ code: "not_found", message: "Resource not found" }, { status: 404 }),
    );

    const client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test" },
      maxRetries: 0,
    });

    await expect(client.get("/v1/missing")).rejects.toThrow(ApiError);

    try {
      await client.get("/v1/missing");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).code).toBe("not_found");
    }
  });

  it("should throw RateLimitError on 429 with rate-limit headers after retries exhausted", async () => {
    const rateLimitResponse = () =>
      fakeResponse(
        { code: "rate_limited", message: "Too many requests" },
        {
          status: 429,
          headers: {
            "x-ratelimit-limit": "100",
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
            "retry-after": "0", // 0 seconds so the test is fast
          },
        },
      );

    mockFetch(rateLimitResponse, rateLimitResponse, rateLimitResponse, rateLimitResponse);

    const client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test" },
      maxRetries: 2,
    });

    await expect(client.get("/v1/throttled")).rejects.toThrow(RateLimitError);
  });

  it("should parse response data and status correctly", async () => {
    mockFetch(
      fakeResponse(
        { id: "msg_123", status: "queued" },
        { status: 200, headers: { "x-request-id": "req_abc" } },
      ),
    );

    const client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test" },
    });

    const result = await client.get<{ id: string; status: string }>("/v1/messages/msg_123");

    expect(result.status).toBe(200);
    expect(result.data.id).toBe("msg_123");
    expect(result.data.status).toBe("queued");
    expect(result.requestId).toBe("req_abc");
  });

  it("should send body as JSON for POST requests", async () => {
    const fetchMock = mockFetch(fakeResponse({ id: "msg_new" }, { status: 201 }));

    const client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test" },
    });

    const body = { from: { address: "a@b.com" }, to: [{ address: "c@d.com" }], subject: "Hi" };
    await client.post("/v1/messages", body);

    const calledInit = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(calledInit.method).toBe("POST");
    expect(calledInit.body).toBe(JSON.stringify(body));
  });
});

// ---------------------------------------------------------------------------
// Messages resource tests
// ---------------------------------------------------------------------------

describe("Messages resource", () => {
  let client: ApiClient;
  let messages: Messages;

  beforeEach(() => {
    client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test" },
      maxRetries: 0,
    });
    messages = new Messages(client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should send a message via POST /v1/messages", async () => {
    const fetchMock = mockFetch(
      fakeResponse({
        id: "msg_001",
        accountId: "acct_1",
        domainId: "dom_1",
        from: { address: "alice@example.com" },
        to: [{ address: "bob@example.com" }],
        subject: "Test",
        status: "queued",
        tags: [],
        metadata: {},
        createdAt: "2026-04-20T00:00:00Z",
        updatedAt: "2026-04-20T00:00:00Z",
      }),
    );

    const result = await messages.send({
      from: { address: "alice@example.com" },
      to: [{ address: "bob@example.com" }],
      subject: "Test",
      textBody: "Hello",
    });

    expect(result.data.id).toBe("msg_001");
    expect(result.data.status).toBe("queued");

    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("/v1/messages");
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe("POST");
  });

  it("should list messages via GET /v1/messages with query params", async () => {
    mockFetch(
      fakeResponse({
        data: [{ id: "msg_001" }, { id: "msg_002" }],
        total: 2,
        page: 1,
        pageSize: 20,
        hasMore: false,
      }),
    );

    const result = await messages.list({ page: 1, pageSize: 20, status: "delivered" });

    expect(result.data.data).toHaveLength(2);
    expect(result.data.total).toBe(2);
  });

  it("should get a single message by ID", async () => {
    const fetchMock = mockFetch(
      fakeResponse({
        id: "msg_abc",
        subject: "Important",
        status: "delivered",
      }),
    );

    const result = await messages.get("msg_abc");

    expect(result.data.id).toBe("msg_abc");
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("/v1/messages/msg_abc");
  });
});

// ---------------------------------------------------------------------------
// Domains resource tests
// ---------------------------------------------------------------------------

describe("Domains resource", () => {
  let client: ApiClient;
  let domains: Domains;

  beforeEach(() => {
    client = new ApiClient({
      auth: { type: "apiKey", key: "em_live_test" },
      maxRetries: 0,
    });
    domains = new Domains(client);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should list domains via GET /v1/domains", async () => {
    mockFetch(
      fakeResponse({
        data: [
          { id: "dom_1", name: "example.com", status: "verified" },
          { id: "dom_2", name: "test.com", status: "pending" },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
        hasMore: false,
      }),
    );

    const result = await domains.list();

    expect(result.data.data).toHaveLength(2);
    expect(result.data.data[0]!.name).toBe("example.com");
  });

  it("should trigger domain verification via POST /v1/domains/:id/verify", async () => {
    const fetchMock = mockFetch(
      fakeResponse({
        id: "dom_1",
        name: "example.com",
        status: "verified",
        dkimConfigured: true,
        spfConfigured: true,
        dmarcConfigured: true,
        createdAt: "2026-04-01T00:00:00Z",
        verifiedAt: "2026-04-20T00:00:00Z",
      }),
    );

    const result = await domains.verify("dom_1");

    expect(result.data.status).toBe("verified");
    const calledUrl = fetchMock.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("/v1/domains/dom_1/verify");
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe("POST");
  });

  it("should add a domain via POST /v1/domains", async () => {
    const fetchMock = mockFetch(
      fakeResponse(
        { id: "dom_new", name: "newdomain.com", status: "pending" },
        { status: 201 },
      ),
    );

    const result = await domains.add({ name: "newdomain.com" });

    expect(result.data.name).toBe("newdomain.com");
    expect(result.data.status).toBe("pending");
    expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe("POST");
  });
});

// ---------------------------------------------------------------------------
// Emailed convenience client tests
// ---------------------------------------------------------------------------

describe("Emailed convenience client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should expose all resource properties when constructed with simple config", async () => {
    // Dynamic import to avoid top-level side-effects
    const { Emailed } = await import("../src/index.js");

    mockFetch(fakeResponse({ ok: true }));

    const emailed = new Emailed({ apiKey: "em_live_abc" });

    expect(emailed.messages).toBeInstanceOf(Messages);
    expect(emailed.domains).toBeInstanceOf(Domains);
    expect(emailed.webhooks).toBeDefined();
    expect(emailed.events).toBeDefined();
    expect(emailed.analytics).toBeDefined();
    expect(emailed.billing).toBeDefined();
    expect(emailed.contacts).toBeDefined();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { JmapHandler, type RequestContext } from "../src/server/handler.js";
import { MailboxOperations } from "../src/mailbox/operations.js";
import { ThreadingEngine } from "../src/thread/engine.js";
import { PushNotificationService, EventSourceClient } from "../src/push/notifications.js";

// ---------------------------------------------------------------------------
// JmapHandler tests
// ---------------------------------------------------------------------------

describe("JmapHandler", () => {
  let handler: JmapHandler;

  beforeEach(() => {
    handler = new JmapHandler();
  });

  it("should return an unknownMethod error for unregistered methods", async () => {
    const response = await handler.processRequest(
      {
        using: ["urn:ietf:params:jmap:core"],
        methodCalls: [["Foo/bar", {}, "c1"]],
      },
      "acct_1",
      "user@test.com",
    );

    expect(response.methodResponses).toHaveLength(1);
    const [method, args, callId] = response.methodResponses[0]!;
    expect(method).toBe("error");
    expect((args as Record<string, unknown>).type).toBe("unknownMethod");
    expect(callId).toBe("c1");
  });

  it("should return unknownCapability for unsupported capabilities", async () => {
    const response = await handler.processRequest(
      {
        using: ["urn:ietf:params:jmap:foobar"],
        methodCalls: [["Email/get", {}, "c1"]],
      },
      "acct_1",
      "user@test.com",
    );

    const [, args] = response.methodResponses[0]!;
    expect((args as Record<string, unknown>).type).toBe("unknownCapability");
  });

  it("should reject requests exceeding maxCallsInRequest", async () => {
    // maxCallsInRequest is 16 in the handler
    const calls = Array.from({ length: 17 }, (_, i) => ["Email/get", {}, `c${i}`] as [string, Record<string, unknown>, string]);

    const response = await handler.processRequest(
      { using: ["urn:ietf:params:jmap:core"], methodCalls: calls },
      "acct_1",
      "user@test.com",
    );

    const [, args] = response.methodResponses[0]!;
    expect((args as Record<string, unknown>).type).toBe("limit");
  });

  it("should invoke a registered method handler and return its result", async () => {
    handler.registerMethod("Test/echo", async (args, _ctx) => {
      return { echoed: args["value"] ?? null };
    });

    const response = await handler.processRequest(
      {
        using: ["urn:ietf:params:jmap:core"],
        methodCalls: [["Test/echo", { value: 42 }, "c1"]],
      },
      "acct_1",
      "user@test.com",
    );

    const [method, result, callId] = response.methodResponses[0]!;
    expect(method).toBe("Test/echo");
    expect((result as Record<string, unknown>).echoed).toBe(42);
    expect(callId).toBe("c1");
  });

  it("should return a serverFail error when a handler throws", async () => {
    handler.registerMethod("Test/fail", async () => {
      throw new Error("boom");
    });

    const response = await handler.processRequest(
      {
        using: ["urn:ietf:params:jmap:core"],
        methodCalls: [["Test/fail", {}, "c1"]],
      },
      "acct_1",
      "user@test.com",
    );

    const [method, args] = response.methodResponses[0]!;
    expect(method).toBe("error");
    expect((args as Record<string, unknown>).type).toBe("serverFail");
    expect((args as Record<string, unknown>).description).toBe("boom");
  });

  it("should generate a valid JMAP session object", () => {
    const session = handler.getSession("alice@example.com", "acct_1");

    expect(session.username).toBe("alice@example.com");
    expect(session.apiUrl).toBe("/jmap");
    expect(session.accounts["acct_1"]).toBeDefined();
    expect(session.accounts["acct_1"]!.name).toBe("alice@example.com");
    expect(session.accounts["acct_1"]!.isPersonal).toBe(true);
    expect(session.capabilities["urn:ietf:params:jmap:core"]).toBeDefined();
    expect(session.capabilities["urn:ietf:params:jmap:mail"]).toBeDefined();
    expect(session.primaryAccounts["urn:ietf:params:jmap:mail"]).toBe("acct_1");
  });

  it("should track and advance state", () => {
    expect(handler.getState()).toBe("0");
    const s1 = handler.advanceState();
    expect(s1).toBe("1");
    expect(handler.getState()).toBe("1");
    handler.advanceState();
    expect(handler.getState()).toBe("2");
  });

  it("should process multiple method calls sequentially in one request", async () => {
    const order: string[] = [];

    handler.registerMethod("Step/one", async () => {
      order.push("one");
      return { step: 1 };
    });
    handler.registerMethod("Step/two", async () => {
      order.push("two");
      return { step: 2 };
    });

    const response = await handler.processRequest(
      {
        using: ["urn:ietf:params:jmap:core"],
        methodCalls: [
          ["Step/one", {}, "a"],
          ["Step/two", {}, "b"],
        ],
      },
      "acct_1",
      "user@test.com",
    );

    expect(response.methodResponses).toHaveLength(2);
    expect(order).toEqual(["one", "two"]);
    expect(response.methodResponses[0]![2]).toBe("a");
    expect(response.methodResponses[1]![2]).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// MailboxOperations tests
// ---------------------------------------------------------------------------

describe("MailboxOperations", () => {
  let ops: MailboxOperations;
  const accountId = "acct_test";

  beforeEach(() => {
    ops = new MailboxOperations();
  });

  it("should create default mailboxes on first access", async () => {
    const result = await ops.get({ accountId, ids: null });
    // Default mailboxes: Inbox, Drafts, Sent, Junk, Trash, Archive
    expect(result.list.length).toBe(6);
    const names = result.list.map((m) => m.name).sort();
    expect(names).toEqual(["Archive", "Drafts", "Inbox", "Junk", "Sent", "Trash"]);
  });

  it("should create a new mailbox and retrieve it", async () => {
    const setResult = await ops.set({
      accountId,
      create: {
        "client-1": { name: "Projects" } as any,
      },
    });

    expect(setResult.created).toBeDefined();
    const createdMailbox = setResult.created!["client-1"]!;
    expect(createdMailbox.name).toBe("Projects");

    // Retrieve it by ID
    const getResult = await ops.get({ accountId, ids: [createdMailbox.id] });
    expect(getResult.list).toHaveLength(1);
    expect(getResult.list[0]!.name).toBe("Projects");
  });

  it("should return notFound for non-existent mailbox IDs", async () => {
    const result = await ops.get({ accountId, ids: ["nonexistent_id"] });
    expect(result.list).toHaveLength(0);
    expect(result.notFound).toContain("nonexistent_id");
  });

  it("should prevent destroying system mailboxes", async () => {
    const allResult = await ops.get({ accountId, ids: null });
    const inbox = allResult.list.find((m) => m.role === "inbox")!;
    expect(inbox).toBeDefined();

    const setResult = await ops.set({
      accountId,
      destroy: [inbox.id],
    });

    expect(setResult.notDestroyed).toBeDefined();
    expect(setResult.notDestroyed![inbox.id]).toBeDefined();
    expect(setResult.notDestroyed![inbox.id]!.type).toBe("forbidden");
  });

  it("should query mailboxes with a role filter", async () => {
    const result = await ops.query({
      accountId,
      filter: { role: "inbox" },
    });

    expect(result.ids).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// ThreadingEngine tests
// ---------------------------------------------------------------------------

describe("ThreadingEngine", () => {
  let engine: ThreadingEngine;
  const accountId = "acct_thread";

  beforeEach(() => {
    engine = new ThreadingEngine();
  });

  it("should create a new thread when adding an unrelated email", () => {
    const threadId = engine.addEmail(accountId, {
      emailId: "e1",
      messageId: "msg-001@example.com",
      inReplyTo: [],
      references: [],
      subject: "Hello",
      receivedAt: new Date(),
    });

    expect(threadId).toBeTruthy();
    const thread = engine.getThread(accountId, threadId);
    expect(thread).not.toBeNull();
    expect(thread!.emailIds).toEqual(["e1"]);
  });

  it("should group a reply into the same thread via In-Reply-To", () => {
    const t1 = engine.addEmail(accountId, {
      emailId: "e1",
      messageId: "msg-001@example.com",
      inReplyTo: [],
      references: [],
      subject: "Hello",
      receivedAt: new Date("2026-01-01"),
    });

    const t2 = engine.addEmail(accountId, {
      emailId: "e2",
      messageId: "msg-002@example.com",
      inReplyTo: ["msg-001@example.com"],
      references: ["msg-001@example.com"],
      subject: "Re: Hello",
      receivedAt: new Date("2026-01-02"),
    });

    expect(t2).toBe(t1);
    const thread = engine.getThread(accountId, t1);
    expect(thread!.emailIds).toContain("e1");
    expect(thread!.emailIds).toContain("e2");
  });

  it("should remove an email from a thread and clean up empty threads", () => {
    const threadId = engine.addEmail(accountId, {
      emailId: "e1",
      messageId: "msg-001@example.com",
      inReplyTo: [],
      references: [],
      subject: "Test",
      receivedAt: new Date(),
    });

    engine.removeEmail(accountId, "e1");
    expect(engine.getThread(accountId, threadId)).toBeNull();
  });

  it("should report correct stats", () => {
    engine.addEmail(accountId, {
      emailId: "e1",
      messageId: "m1@x.com",
      inReplyTo: [],
      references: [],
      subject: "A",
      receivedAt: new Date(),
    });
    engine.addEmail(accountId, {
      emailId: "e2",
      messageId: "m2@x.com",
      inReplyTo: ["m1@x.com"],
      references: [],
      subject: "Re: A",
      receivedAt: new Date(),
    });
    engine.addEmail(accountId, {
      emailId: "e3",
      messageId: "m3@x.com",
      inReplyTo: [],
      references: [],
      subject: "B",
      receivedAt: new Date(),
    });

    const stats = engine.getStats(accountId);
    expect(stats.threadCount).toBe(2);
    // Thread 1 has 2 emails, thread 2 has 1 email -> avg 1.5
    expect(stats.avgEmailsPerThread).toBe(1.5);
  });
});

// ---------------------------------------------------------------------------
// PushNotificationService tests
// ---------------------------------------------------------------------------

describe("PushNotificationService", () => {
  let pushService: PushNotificationService;

  beforeEach(() => {
    pushService = new PushNotificationService();
  });

  it("should register and unregister EventSource clients", () => {
    const client = pushService.registerEventSource("sse_1", "acct_1", {});
    expect(client).toBeDefined();
    expect(pushService.getStats().eventSourceClients).toBe(1);

    pushService.removeEventSource("sse_1");
    expect(pushService.getStats().eventSourceClients).toBe(0);
  });

  it("should deliver state changes to matching EventSource clients", async () => {
    const received: string[] = [];
    const client = pushService.registerEventSource("sse_1", "acct_1", {});
    client.onData((data) => received.push(data));

    await pushService.notifyStateChange("acct_1", { Email: "5" });

    expect(received).toHaveLength(1);
    expect(received[0]).toContain("StateChange");
    expect(received[0]).toContain('"Email":"5"');
  });

  it("should filter events by type when types are specified", async () => {
    const received: string[] = [];
    const client = pushService.registerEventSource("sse_1", "acct_1", {
      types: ["Mailbox"],
    });
    client.onData((data) => received.push(data));

    // This should NOT be delivered (type is Email, client only wants Mailbox)
    await pushService.notifyStateChange("acct_1", { Email: "5" });
    expect(received).toHaveLength(0);

    // This SHOULD be delivered
    await pushService.notifyStateChange("acct_1", { Mailbox: "2" });
    expect(received).toHaveLength(1);
  });

  it("should not deliver events to clients of a different account", async () => {
    const received: string[] = [];
    const client = pushService.registerEventSource("sse_1", "acct_1", {});
    client.onData((data) => received.push(data));

    await pushService.notifyStateChange("acct_OTHER", { Email: "1" });
    expect(received).toHaveLength(0);
  });
});

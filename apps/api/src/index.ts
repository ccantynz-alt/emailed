import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import { secureHeaders } from "hono/secure-headers";

import { authMiddleware } from "./middleware/auth.js";
import { rateLimiter } from "./middleware/rate-limiter.js";
import { messages } from "./routes/messages.js";
import { domains } from "./routes/domains.js";
import { webhooks } from "./routes/webhooks.js";
import { analytics } from "./routes/analytics.js";

const app = new Hono();

// --- Global Middleware ---

// Request ID for tracing
app.use("*", requestId());

// Structured logging
app.use("*", logger());

// Server timing headers
app.use("*", timing());

// Security headers
app.use("*", secureHeaders());

// CORS
app.use(
  "*",
  cors({
    origin: (origin) => origin, // Reflect origin for credentialed requests
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type", "X-API-Key", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: 86400,
    credentials: true,
  }),
);

// --- Health Check (no auth required) ---
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "emailed-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// --- Authenticated Routes ---
app.use("/v1/*", authMiddleware);
app.use("/v1/*", rateLimiter);

// Mount route handlers
app.route("/v1/messages", messages);
app.route("/v1/domains", domains);
app.route("/v1/webhooks", webhooks);
app.route("/v1/analytics", analytics);

// --- 404 Handler ---
app.notFound((c) => {
  return c.json(
    {
      error: {
        type: "not_found",
        message: `Route ${c.req.method} ${c.req.path} not found`,
        code: "route_not_found",
      },
    },
    404,
  );
});

// --- Global Error Handler ---
app.onError((err, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  console.error(`[${requestId}] Unhandled error:`, err);

  // Don't leak internal errors in production
  const isProduction = process.env.NODE_ENV === "production";

  return c.json(
    {
      error: {
        type: "server_error",
        message: isProduction ? "An internal server error occurred" : err.message,
        code: "internal_error",
        ...(isProduction ? {} : { stack: err.stack }),
      },
    },
    500,
  );
});

// --- Start Server ---
const port = parseInt(process.env.PORT ?? "3000", 10);

console.log(`Emailed API server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};

export { app };

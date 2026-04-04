// ─── Client Configuration ────────────────────────────────────────────────────

/** Authentication method for the API client. */
export type AuthMethod =
  | { readonly type: "apiKey"; readonly key: string }
  | { readonly type: "bearer"; readonly token: string };

/** Configuration for the Emailed API client. */
export interface ClientConfig {
  /** API key or bearer token */
  readonly auth: AuthMethod;
  /** Base URL for the API. Default: "https://api.emailed.dev" */
  readonly baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30000 */
  readonly timeout?: number;
  /** Maximum number of retries on transient failures. Default: 3 */
  readonly maxRetries?: number;
  /** Custom headers to include on every request */
  readonly headers?: Readonly<Record<string, string>>;
  /** Enable request/response logging for debugging. Default: false */
  readonly debug?: boolean;
}

/**
 * Simplified configuration that accepts just an API key string.
 *
 * Usage:
 * ```ts
 * new Emailed({ apiKey: "em_live_...", baseUrl: "https://api.emailed.dev" });
 * ```
 */
export interface SimpleClientConfig {
  /** The API key for authentication */
  readonly apiKey: string;
  /** Base URL for the API. Default: "https://api.emailed.dev" */
  readonly baseUrl?: string;
  /** Request timeout in milliseconds. Default: 30000 */
  readonly timeout?: number;
  /** Maximum number of retries on transient failures. Default: 3 */
  readonly maxRetries?: number;
  /** Custom headers to include on every request */
  readonly headers?: Readonly<Record<string, string>>;
  /** Enable request/response logging for debugging. Default: false */
  readonly debug?: boolean;
}

/** Resolved configuration with all defaults applied. */
export interface ResolvedConfig {
  readonly auth: AuthMethod;
  readonly baseUrl: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly debug: boolean;
}

// ─── HTTP Types ──────────────────────────────────────────────────────────────

/** Supported HTTP methods. */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Options for an individual HTTP request. */
export interface RequestOptions {
  readonly method: HttpMethod;
  readonly path: string;
  readonly body?: unknown;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly headers?: Readonly<Record<string, string>>;
  /** Override the default timeout for this request. */
  readonly timeout?: number;
  /** Signal for request cancellation. */
  readonly signal?: AbortSignal;
}

/** A structured API response. */
export interface ApiResponse<T> {
  readonly data: T;
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly requestId?: string;
}

/** Rate limit information returned in response headers. */
export interface RateLimitInfo {
  readonly limit: number;
  readonly remaining: number;
  readonly resetAt: Date;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

/** Standard pagination parameters. */
export interface PaginationParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly cursor?: string;
}

/** A paginated list response. */
export interface PaginatedList<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string;
}

// ─── Message Types ───────────────────────────────────────────────────────────

/** Address used when sending an email through the SDK. */
export interface SdkEmailAddress {
  readonly name?: string;
  readonly address: string;
}

/** Parameters for sending an email. */
export interface SendMessageParams {
  readonly from: SdkEmailAddress;
  readonly to: readonly SdkEmailAddress[];
  readonly cc?: readonly SdkEmailAddress[];
  readonly bcc?: readonly SdkEmailAddress[];
  readonly replyTo?: SdkEmailAddress;
  readonly subject: string;
  readonly textBody?: string;
  readonly htmlBody?: string;
  readonly attachments?: readonly SdkAttachment[];
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
  /** ISO 8601 datetime string for scheduled sending. */
  readonly scheduledAt?: string;
}

/** An attachment included with a sent message. */
export interface SdkAttachment {
  readonly filename: string;
  readonly contentType: string;
  /** Base64-encoded content */
  readonly content: string;
  readonly disposition?: "attachment" | "inline";
  readonly contentId?: string;
}

/** A message as returned by the API. */
export interface Message {
  readonly id: string;
  readonly accountId: string;
  readonly domainId: string;
  readonly from: SdkEmailAddress;
  readonly to: readonly SdkEmailAddress[];
  readonly cc: readonly SdkEmailAddress[];
  readonly bcc: readonly SdkEmailAddress[];
  readonly subject: string;
  readonly status: string;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, string>>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly scheduledAt?: string;
}

/** Parameters for searching messages. */
export interface MessageSearchParams extends PaginationParams {
  readonly query?: string;
  readonly status?: string;
  readonly tag?: string;
  readonly from?: string;
  readonly to?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

/** A domain registered with the platform. */
export interface SdkDomain {
  readonly id: string;
  readonly name: string;
  readonly status: "pending" | "verified" | "failed";
  readonly dkimConfigured: boolean;
  readonly spfConfigured: boolean;
  readonly dmarcConfigured: boolean;
  readonly createdAt: string;
  readonly verifiedAt?: string;
}

/** Parameters for adding a new domain. */
export interface AddDomainParams {
  readonly name: string;
}

/** DNS records the user needs to configure for domain verification. */
export interface DomainDnsRecords {
  readonly dkim: DnsRecordInstruction;
  readonly spf: DnsRecordInstruction;
  readonly dmarc: DnsRecordInstruction;
  readonly mx: DnsRecordInstruction;
}

/** A single DNS record instruction for domain setup. */
export interface DnsRecordInstruction {
  readonly type: "TXT" | "CNAME" | "MX";
  readonly name: string;
  readonly value: string;
  readonly ttl: number;
}

// ─── Contact Types ───────────────────────────────────────────────────────────

/** A contact / recipient stored in the platform. */
export interface Contact {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, string>>;
  readonly subscribed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Parameters for creating or updating a contact. */
export interface UpsertContactParams {
  readonly email: string;
  readonly name?: string;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, string>>;
  readonly subscribed?: boolean;
}

/** Parameters for listing / filtering contacts. */
export interface ContactListParams extends PaginationParams {
  readonly tag?: string;
  readonly subscribed?: boolean;
  readonly query?: string;
}

// ─── Analytics Types ─────────────────────────────────────────────────────────

/** Time range for analytics queries. */
export interface AnalyticsTimeRange {
  readonly startDate: string;
  readonly endDate: string;
}

/** Granularity for time-series analytics. */
export type AnalyticsGranularity = "hour" | "day" | "week" | "month";

/** Top-level delivery analytics summary. */
export interface DeliveryAnalytics {
  readonly sent: number;
  readonly delivered: number;
  readonly bounced: number;
  readonly deferred: number;
  readonly dropped: number;
  readonly complained: number;
  readonly deliveryRate: number;
  readonly bounceRate: number;
}

/** A single data point in a time-series. */
export interface TimeSeriesPoint {
  readonly timestamp: string;
  readonly value: number;
}

/** Parameters for analytics queries. */
export interface AnalyticsQueryParams extends AnalyticsTimeRange {
  readonly granularity?: AnalyticsGranularity;
  readonly domainId?: string;
  readonly tag?: string;
}

/** Engagement metrics (opens, clicks). */
export interface EngagementAnalytics {
  readonly opens: number;
  readonly uniqueOpens: number;
  readonly clicks: number;
  readonly uniqueClicks: number;
  readonly openRate: number;
  readonly clickRate: number;
}

// ─── Webhook Types ───────────────────────────────────────────────────────────

/** All supported webhook event types. */
export type WebhookEventType =
  | "message.sent"
  | "message.delivered"
  | "message.bounced"
  | "message.deferred"
  | "message.dropped"
  | "message.complained"
  | "message.opened"
  | "message.clicked"
  | "domain.verified"
  | "domain.failed"
  | "contact.subscribed"
  | "contact.unsubscribed";

/** A webhook event payload delivered to the consumer's endpoint. */
export interface WebhookEvent<T = unknown> {
  readonly id: string;
  readonly type: WebhookEventType;
  readonly timestamp: string;
  readonly data: T;
}

/** Options for verifying a webhook signature. */
export interface WebhookVerifyOptions {
  /** The raw request body (string or Buffer) */
  readonly payload: string | Buffer;
  /** The signature from the `X-Emailed-Signature` header */
  readonly signature: string;
  /** The webhook signing secret */
  readonly secret: string;
  /** Maximum age of the event in seconds before it is rejected. Default: 300 */
  readonly tolerance?: number;
}

// ─── Webhook Resource Types ─────────────────────────────────────────────────

/** A registered webhook endpoint. */
export interface Webhook {
  readonly id: string;
  readonly url: string;
  readonly events: readonly string[];
  readonly secret: string;
  readonly description: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Parameters for creating a webhook endpoint. */
export interface CreateWebhookParams {
  readonly url: string;
  readonly events: readonly string[];
  readonly secret?: string;
  readonly description?: string;
  readonly active?: boolean;
}

/** Parameters for updating a webhook endpoint. */
export interface UpdateWebhookParams {
  readonly url?: string;
  readonly events?: readonly string[];
  readonly secret?: string;
  readonly description?: string;
  readonly active?: boolean;
}

/** A webhook delivery attempt record. */
export interface WebhookDelivery {
  readonly id: string;
  readonly eventId: string;
  readonly statusCode: number | null;
  readonly responseBody: string | null;
  readonly attemptCount: number;
  readonly success: boolean;
  readonly nextRetryAt: string | null;
  readonly createdAt: string;
}

// ─── Event Types ────────────────────────────────────────────────────────────

/** An event recorded by the platform. */
export interface PlatformEvent {
  readonly id: string;
  readonly type: string;
  readonly messageId: string | null;
  readonly recipient: string | null;
  readonly timestamp: string;
  readonly data?: unknown;
}

/** Parameters for listing events. */
export interface EventListParams extends PaginationParams {
  readonly type?: string;
  readonly messageId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

// ─── Billing Types ──────────────────────────────────────────────────────────

/** Current usage statistics for the account. */
export interface BillingUsage {
  readonly emailsSent: number;
  readonly percentUsed: number;
  readonly planTier: string;
  readonly periodStartedAt: string;
}

/** Current plan details including limits and usage. */
export interface BillingPlan {
  readonly planId: string;
  readonly name: string;
  readonly limits: {
    readonly emailsPerMonth: number;
    readonly domains: number;
    readonly webhooks: number;
  };
  readonly usage: {
    readonly emailsSent: number;
    readonly percentUsed: number;
  };
  readonly periodStartedAt: string;
}

// ─── Domain Health Types ────────────────────────────────────────────────────

/** Domain health report. */
export interface DomainHealth {
  readonly domain: string;
  readonly score: number;
  readonly dkimKeyAge: number;
  readonly dkimRotationNeeded: boolean;
  readonly spfLookupCount: number;
  readonly spfTooManyLookups: boolean;
  readonly recommendations: readonly string[];
  readonly verification: {
    readonly overall: string;
    readonly spf: string;
    readonly dkim: string;
    readonly dmarc: string;
    readonly mx: string;
    readonly returnPath: string;
  };
}

/** Domain DNS records response from the /dns endpoint. */
export interface DomainDnsResponse {
  readonly domain: string;
  readonly records: readonly DomainDnsRecord[];
}

/** A single DNS record with verification status. */
export interface DomainDnsRecord {
  readonly type: string;
  readonly name: string;
  readonly value: string;
  readonly ttl: number;
  readonly priority?: number;
  readonly verified: boolean;
  readonly lastCheckedAt: string | null;
}

// ─── Template Types ─────────────────────────────────────────────────────────

/** A stored email template. */
export interface Template {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly subject: string;
  readonly htmlBody: string | null;
  readonly textBody: string | null;
  readonly variables: readonly string[];
  readonly version: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Parameters for creating a template. */
export interface CreateTemplateParams {
  readonly name: string;
  readonly subject: string;
  readonly htmlBody?: string;
  readonly textBody?: string;
  readonly description?: string;
  readonly category?: string;
}

/** Parameters for updating a template. */
export interface UpdateTemplateParams {
  readonly name?: string;
  readonly subject?: string;
  readonly htmlBody?: string | null;
  readonly textBody?: string | null;
  readonly description?: string | null;
  readonly category?: string | null;
}

/** Parameters for previewing a rendered template. */
export interface PreviewTemplateParams {
  readonly variables?: Readonly<Record<string, unknown>>;
}

/** Result of rendering a template preview. */
export interface TemplatePreview {
  readonly subject: string;
  readonly html: string | null;
  readonly text: string | null;
  readonly warnings: readonly string[];
}

/** Parameters for sending an email using a template. */
export interface SendFromTemplateParams {
  readonly from: SdkEmailAddress;
  readonly to: readonly SdkEmailAddress[];
  readonly cc?: readonly SdkEmailAddress[];
  readonly bcc?: readonly SdkEmailAddress[];
  readonly variables?: Readonly<Record<string, unknown>>;
  readonly headers?: Readonly<Record<string, string>>;
  readonly tags?: readonly string[];
  readonly scheduledAt?: string;
}

/** Result of sending an email from a template. */
export interface TemplateSendResult {
  readonly id: string;
  readonly messageId: string;
  readonly templateId: string;
  readonly status: string;
  readonly renderedSubject: string;
  readonly warnings: readonly string[];
}

/** Parameters for listing templates. */
export interface TemplateListParams extends PaginationParams {
  readonly category?: string;
}

// ─── Suppression Types ──────────────────────────────────────────────────────

/** Reason an address was suppressed. */
export type SuppressionReason = "bounce" | "complaint" | "unsubscribe" | "manual";

/** A suppressed email address. */
export interface Suppression {
  readonly id: string;
  readonly email: string;
  readonly domain: string;
  readonly reason: string;
  readonly createdAt: string;
}

/** Parameters for adding a single suppression. */
export interface AddSuppressionParams {
  readonly email: string;
  readonly domain: string;
  readonly reason: SuppressionReason;
}

/** Parameters for batch-adding suppressions. */
export interface BatchAddSuppressionsParams {
  readonly suppressions: readonly AddSuppressionParams[];
}

/** Parameters for checking if addresses are suppressed. */
export interface CheckSuppressionsParams {
  readonly emails: readonly string[];
  readonly domain: string;
}

/** Result of checking a single address against the suppression list. */
export interface SuppressionCheckResult {
  readonly email: string;
  readonly suppressed: boolean;
  readonly reason: string | null;
  readonly createdAt: string | null;
}

/** Parameters for bulk-importing suppressions. */
export interface ImportSuppressionsParams {
  readonly domain: string;
  readonly reason: SuppressionReason;
  readonly entries: readonly { readonly email: string; readonly reason?: SuppressionReason }[];
}

/** Result of a bulk suppression import. */
export interface SuppressionImportResult {
  readonly requested: number;
  readonly imported: number;
  readonly domain: string;
  readonly reason: string;
}

/** Parameters for listing suppressions. */
export interface SuppressionListParams extends PaginationParams {
  readonly domain?: string;
  readonly reason?: SuppressionReason;
  readonly search?: string;
  readonly createdAfter?: string;
  readonly createdBefore?: string;
}

/** Cursor-based paginated list (used by templates and suppressions). */
export interface CursorPaginatedList<T> {
  readonly data: readonly T[];
  readonly cursor: string | null;
  readonly hasMore: boolean;
}

// ─── Error Types ─────────────────────────────────────────────────────────────

/** Structured API error returned by the Emailed API. */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly requestId?: string;
}

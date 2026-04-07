/**
 * Todo Provider Abstraction (S8)
 *
 * Common interface for sending email threads / commitments / extracted action
 * items to a user's todo app of choice. Implementations live under ./providers.
 *
 * Supported providers:
 *   - Things 3            (URL scheme)
 *   - Apple Reminders     (URL scheme)
 *   - Todoist             (REST v2, API token)
 *   - Linear              (GraphQL, API key)
 *   - Notion              (REST v1, OAuth/integration token)
 *   - Microsoft To Do     (Graph API, OAuth)
 */

export type TodoProviderName =
  | "things3"
  | "apple_reminders"
  | "todoist"
  | "linear"
  | "notion"
  | "microsoft_todo";

export type TodoAuthType = "api_key" | "oauth" | "url_scheme";

export type TodoPriority = "low" | "normal" | "high" | "urgent";

export interface TodoTaskInput {
  readonly title: string;
  readonly notes?: string;
  readonly dueDate?: Date;
  readonly projectId?: string;
  readonly tags?: readonly string[];
  readonly priority?: TodoPriority;
  readonly sourceEmailId?: string;
  readonly sourceEmailLink?: string;
}

export interface TodoTaskResult {
  readonly success: boolean;
  readonly taskId?: string;
  readonly taskUrl?: string;
  readonly error?: string;
}

export interface TodoProject {
  readonly id: string;
  readonly name: string;
}

/**
 * Credentials passed to provider constructors.
 *
 * Discriminated by `kind` so a strict-mode TS check forces the right shape
 * for each provider's auth model.
 */
export type TodoCredentials =
  | { readonly kind: "none" }
  | { readonly kind: "api_key"; readonly token: string }
  | { readonly kind: "oauth"; readonly accessToken: string; readonly refreshToken?: string; readonly expiresAt?: number }
  | { readonly kind: "notion"; readonly accessToken: string; readonly databaseId: string }
  | { readonly kind: "microsoft"; readonly accessToken: string; readonly listId: string };

export interface TodoProvider {
  readonly name: TodoProviderName;
  readonly authType: TodoAuthType;
  createTask(input: TodoTaskInput): Promise<TodoTaskResult>;
  listProjects?(): Promise<readonly TodoProject[]>;
}

export interface TodoProviderMetadata {
  readonly name: TodoProviderName;
  readonly displayName: string;
  readonly authType: TodoAuthType;
  readonly description: string;
  readonly supportsProjects: boolean;
  readonly credentialFields: readonly string[];
}

export const PROVIDER_METADATA: readonly TodoProviderMetadata[] = [
  {
    name: "things3",
    displayName: "Things 3",
    authType: "url_scheme",
    description: "Returns a things:/// URL that opens the macOS/iOS app.",
    supportsProjects: false,
    credentialFields: [],
  },
  {
    name: "apple_reminders",
    displayName: "Apple Reminders",
    authType: "url_scheme",
    description: "Returns an x-apple-reminderkit:// URL that opens Reminders.",
    supportsProjects: false,
    credentialFields: [],
  },
  {
    name: "todoist",
    displayName: "Todoist",
    authType: "api_key",
    description: "REST v2 — paste your API token from Settings → Integrations.",
    supportsProjects: true,
    credentialFields: ["token"],
  },
  {
    name: "linear",
    displayName: "Linear",
    authType: "api_key",
    description: "GraphQL — personal API key from Settings → API.",
    supportsProjects: true,
    credentialFields: ["token", "teamId"],
  },
  {
    name: "notion",
    displayName: "Notion",
    authType: "oauth",
    description: "OAuth — choose a database to receive tasks.",
    supportsProjects: false,
    credentialFields: ["accessToken", "databaseId"],
  },
  {
    name: "microsoft_todo",
    displayName: "Microsoft To Do",
    authType: "oauth",
    description: "Microsoft Graph — reuses your connected Outlook OAuth token.",
    supportsProjects: true,
    credentialFields: ["accessToken", "listId"],
  },
];

/** Map a TodoPriority to a numeric scale (1=low … 4=urgent) used by Todoist. */
export function priorityToTodoistLevel(p: TodoPriority | undefined): 1 | 2 | 3 | 4 {
  switch (p) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
    case undefined:
      return 1;
  }
}

/** Map a TodoPriority to Linear's 0-4 scale (0 none, 1 urgent, 2 high, 3 normal, 4 low). */
export function priorityToLinearLevel(p: TodoPriority | undefined): 0 | 1 | 2 | 3 | 4 {
  switch (p) {
    case "urgent":
      return 1;
    case "high":
      return 2;
    case "normal":
      return 3;
    case "low":
      return 4;
    case undefined:
      return 0;
  }
}

/** Microsoft Graph importance enum. */
export function priorityToGraphImportance(p: TodoPriority | undefined): "low" | "normal" | "high" {
  if (p === "urgent" || p === "high") return "high";
  if (p === "low") return "low";
  return "normal";
}

/**
 * Notion provider — REST API v1.
 * Docs: https://developers.notion.com/reference/post-page
 *
 * Tasks are created as pages inside a target database. The target database
 * must have at minimum a "title" property; due date / priority / tags are
 * written if columns of the matching name exist.
 */

import type {
  TodoProvider,
  TodoTaskInput,
  TodoTaskResult,
} from "../provider.js";

interface NotionPageResponse {
  id: string;
  url: string;
}

export class NotionProvider implements TodoProvider {
  public readonly name = "notion" as const;
  public readonly authType = "oauth" as const;

  private readonly accessToken: string;
  private readonly databaseId: string;
  private readonly endpoint = "https://api.notion.com/v1/pages";
  private readonly version = "2022-06-28";

  public constructor(accessToken: string, databaseId: string) {
    if (accessToken.length === 0) throw new Error("notion_access_token_required");
    if (databaseId.length === 0) throw new Error("notion_database_id_required");
    this.accessToken = accessToken;
    this.databaseId = databaseId;
  }

  public async createTask(input: TodoTaskInput): Promise<TodoTaskResult> {
    const properties: Record<string, unknown> = {
      Name: {
        title: [{ type: "text", text: { content: input.title } }],
      },
    };
    if (input.dueDate !== undefined) {
      properties["Due"] = { date: { start: input.dueDate.toISOString() } };
    }
    if (input.priority !== undefined) {
      properties["Priority"] = { select: { name: input.priority } };
    }
    if (input.tags !== undefined && input.tags.length > 0) {
      properties["Tags"] = {
        multi_select: input.tags.map((name) => ({ name })),
      };
    }

    const children = this.buildChildren(input);

    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": this.version,
        },
        body: JSON.stringify({
          parent: { database_id: this.databaseId },
          properties,
          children,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `notion_${res.status}: ${text}` };
      }
      const json = (await res.json()) as NotionPageResponse;
      return { success: true, taskId: json.id, taskUrl: json.url };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "notion_request_failed",
      };
    }
  }

  private buildChildren(input: TodoTaskInput): unknown[] {
    const blocks: unknown[] = [];
    if (input.notes !== undefined && input.notes.length > 0) {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: input.notes } }],
        },
      });
    }
    if (input.sourceEmailLink !== undefined) {
      blocks.push({
        object: "block",
        type: "bookmark",
        bookmark: { url: input.sourceEmailLink },
      });
    }
    return blocks;
  }
}

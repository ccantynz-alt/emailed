/**
 * Todoist provider — REST API v2.
 * Docs: https://developer.todoist.com/rest/v2/
 */

import {
  priorityToTodoistLevel,
  type TodoProject,
  type TodoProvider,
  type TodoTaskInput,
  type TodoTaskResult,
} from "../provider.js";

interface TodoistTaskResponse {
  id: string;
  url: string;
}

interface TodoistProjectResponse {
  id: string;
  name: string;
}

export class TodoistProvider implements TodoProvider {
  public readonly name = "todoist" as const;
  public readonly authType = "api_key" as const;

  private readonly token: string;
  private readonly base = "https://api.todoist.com/rest/v2";

  public constructor(token: string) {
    if (token.length === 0) throw new Error("todoist_token_required");
    this.token = token;
  }

  public async createTask(input: TodoTaskInput): Promise<TodoTaskResult> {
    try {
      const body: Record<string, unknown> = {
        content: input.title,
        priority: priorityToTodoistLevel(input.priority),
      };
      const description = this.buildDescription(input);
      if (description !== undefined) body["description"] = description;
      if (input.projectId !== undefined) body["project_id"] = input.projectId;
      if (input.dueDate !== undefined) body["due_datetime"] = input.dueDate.toISOString();
      if (input.tags !== undefined && input.tags.length > 0) body["labels"] = [...input.tags];

      const res = await fetch(`${this.base}/tasks`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: `todoist_${res.status}: ${text}` };
      }

      const json = (await res.json()) as TodoistTaskResponse;
      return { success: true, taskId: json.id, taskUrl: json.url };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "todoist_request_failed",
      };
    }
  }

  public async listProjects(): Promise<readonly TodoProject[]> {
    const res = await fetch(`${this.base}/projects`, {
      headers: { "Authorization": `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`todoist_list_projects_${res.status}`);
    const json = (await res.json()) as TodoistProjectResponse[];
    return json.map((p) => ({ id: p.id, name: p.name }));
  }

  private buildDescription(input: TodoTaskInput): string | undefined {
    const parts: string[] = [];
    if (input.notes !== undefined) parts.push(input.notes);
    if (input.sourceEmailLink !== undefined) parts.push(`Source: ${input.sourceEmailLink}`);
    return parts.length > 0 ? parts.join("\n\n") : undefined;
  }
}

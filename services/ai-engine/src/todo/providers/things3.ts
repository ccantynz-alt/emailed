/**
 * Things 3 — URL scheme provider.
 * Docs: https://culturedcode.com/things/support/articles/2803573/
 */

import type { TodoProvider, TodoTaskInput, TodoTaskResult } from "../provider.js";

export class Things3Provider implements TodoProvider {
  public readonly name = "things3" as const;
  public readonly authType = "url_scheme" as const;

  public createTask(input: TodoTaskInput): Promise<TodoTaskResult> {
    try {
      const params = new URLSearchParams();
      params.set("title", input.title);
      if (input.notes !== undefined) params.set("notes", this.buildNotes(input));
      if (input.dueDate !== undefined) {
        params.set("when", this.formatDate(input.dueDate));
      }
      if (input.tags !== undefined && input.tags.length > 0) {
        params.set("tags", input.tags.join(","));
      }
      if (input.projectId !== undefined) {
        params.set("list-id", input.projectId);
      }
      const url = `things:///add?${params.toString()}`;
      return Promise.resolve({ success: true, taskUrl: url });
    } catch (err) {
      return Promise.resolve({
        success: false,
        error: err instanceof Error ? err.message : "things3_url_build_failed",
      });
    }
  }

  private buildNotes(input: TodoTaskInput): string {
    const parts: string[] = [];
    if (input.notes !== undefined) parts.push(input.notes);
    if (input.sourceEmailLink !== undefined) parts.push(`Email: ${input.sourceEmailLink}`);
    return parts.join("\n\n");
  }

  private formatDate(d: Date): string {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
}

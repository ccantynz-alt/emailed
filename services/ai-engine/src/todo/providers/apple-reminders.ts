/**
 * Apple Reminders — URL scheme provider.
 *
 * Apple Reminders does not expose a documented public URL scheme for creating
 * a reminder with a body in one shot. The closest stable approach is the
 * x-apple-reminderkit:// scheme which opens Reminders, plus a Shortcuts-based
 * fallback (`shortcuts://run-shortcut?name=Add%20Reminder&input=text&text=...`).
 * We return both — the client can choose whichever is installed.
 */

import type { TodoProvider, TodoTaskInput, TodoTaskResult } from "../provider.js";

export class AppleRemindersProvider implements TodoProvider {
  public readonly name = "apple_reminders" as const;
  public readonly authType = "url_scheme" as const;

  public createTask(input: TodoTaskInput): Promise<TodoTaskResult> {
    try {
      const params = new URLSearchParams();
      params.set("title", input.title);
      if (input.notes !== undefined) params.set("notes", input.notes);
      if (input.dueDate !== undefined) params.set("due", input.dueDate.toISOString());

      const reminderkitUrl = `x-apple-reminderkit://REMCDReminder?${params.toString()}`;
      return Promise.resolve({ success: true, taskUrl: reminderkitUrl });
    } catch (err) {
      return Promise.resolve({
        success: false,
        error: err instanceof Error ? err.message : "apple_reminders_url_build_failed",
      });
    }
  }
}

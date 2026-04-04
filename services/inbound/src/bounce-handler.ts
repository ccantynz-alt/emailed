/**
 * Bounce & Complaint Handler for the Inbound Pipeline
 *
 * Detects bounce notifications (DSN) and complaint reports (ARF) in the
 * inbound stream and routes them to the MTA bounce processor for
 * classification, suppression list updates, and event recording.
 *
 * This module bridges the inbound service and the MTA bounce processor,
 * handling all database persistence (events, suppression lists, delivery
 * result updates) that the processor returns.
 */

import { eq, and, ilike } from "drizzle-orm";
import {
  getDatabase,
  emails,
  events,
  deliveryResults,
  suppressionLists,
  domains,
} from "@emailed/db";
import {
  DatabaseBounceProcessor,
  type BounceEventRecord,
  type ComplaintEventRecord,
} from "@emailed/mta/src/bounce/processor.js";
import {
  isBounceNotification,
  isComplaintReport,
} from "@emailed/mta/src/bounce/parser.js";
import type { SmtpEnvelope } from "./types.js";

function generateId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface BounceHandlerResult {
  /** Whether the message was handled as a bounce/complaint */
  handled: boolean;
  /** Type of notification: "bounce", "complaint", or "none" */
  type: "bounce" | "complaint" | "none";
  /** Affected recipient addresses */
  recipients: string[];
}

export class BounceComplaintHandler {
  private readonly processor: DatabaseBounceProcessor;

  constructor(maxAttempts = 5) {
    this.processor = new DatabaseBounceProcessor(maxAttempts);
  }

  /**
   * Check if an inbound message is a bounce or complaint, and handle it.
   *
   * Returns { handled: true } if the message was processed as a bounce
   * or complaint (caller should skip normal mailbox delivery).
   */
  async handleIfBounceOrComplaint(
    rawMessage: string,
    envelope: SmtpEnvelope,
  ): Promise<BounceHandlerResult> {
    // Check for complaint first (more specific)
    if (isComplaintReport(rawMessage)) {
      return this.handleComplaint(rawMessage);
    }

    // Check for bounce notification
    if (isBounceNotification(rawMessage, { mailFrom: envelope.mailFrom })) {
      return this.handleBounce(rawMessage);
    }

    return { handled: false, type: "none", recipients: [] };
  }

  /**
   * Handle a bounce notification: parse, classify, update DB.
   */
  private async handleBounce(rawMessage: string): Promise<BounceHandlerResult> {
    const result = this.processor.processBounceMessage(rawMessage);
    if (!result.ok) {
      console.warn(`[BounceHandler] Failed to parse bounce: ${result.error.message}`);
      return { handled: false, type: "none", recipients: [] };
    }

    const { bounceEvents, suppressions, retries, originalMessageId } = result.value;
    const recipients: string[] = [];
    const db = getDatabase();

    // Try to find the original email by message ID
    let emailRecord: { id: string; accountId: string; domainId: string } | null = null;
    if (originalMessageId) {
      const [found] = await db
        .select({
          id: emails.id,
          accountId: emails.accountId,
          domainId: emails.domainId,
        })
        .from(emails)
        .where(eq(emails.messageId, originalMessageId))
        .limit(1);
      emailRecord = found ?? null;
    }

    // Record bounce events
    for (const bounceEvent of bounceEvents) {
      recipients.push(bounceEvent.recipient);

      const eventId = generateId();
      try {
        await db.insert(events).values({
          id: eventId,
          accountId: emailRecord?.accountId ?? "system",
          emailId: emailRecord?.id ?? null,
          messageId: originalMessageId ?? null,
          type: "email.bounced" as const,
          recipient: bounceEvent.recipient,
          bounceType: bounceEvent.bounceType,
          bounceCategory: bounceEvent.bounceCategory as "unknown_user",
          diagnosticCode: bounceEvent.diagnosticCode ?? null,
          remoteMta: bounceEvent.remoteMta ?? null,
          smtpResponse: bounceEvent.smtpResponse ?? null,
        });
      } catch (e) {
        console.error(`[BounceHandler] Failed to record bounce event: ${e}`);
      }

      // Update delivery result if we found the original email
      if (emailRecord) {
        try {
          await db
            .update(deliveryResults)
            .set({
              status: bounceEvent.bounceType === "hard" ? "bounced" : "deferred",
              remoteResponse: bounceEvent.diagnosticCode ?? "Bounce notification received",
              lastAttemptAt: new Date(),
            })
            .where(
              and(
                eq(deliveryResults.emailId, emailRecord.id),
                eq(deliveryResults.recipientAddress, bounceEvent.recipient),
              ),
            );
        } catch (e) {
          console.error(`[BounceHandler] Failed to update delivery result: ${e}`);
        }
      }
    }

    // Update email status if all recipients bounced
    if (emailRecord && bounceEvents.length > 0 && bounceEvents.every((e) => e.bounceType === "hard")) {
      try {
        await db
          .update(emails)
          .set({ status: "bounced", updatedAt: new Date() })
          .where(eq(emails.id, emailRecord.id));
      } catch (e) {
        console.error(`[BounceHandler] Failed to update email status: ${e}`);
      }
    }

    // Add to suppression list
    for (const suppression of suppressions) {
      if (!emailRecord) continue;

      try {
        await db
          .insert(suppressionLists)
          .values({
            id: generateId(),
            email: suppression.address.toLowerCase(),
            domainId: emailRecord.domainId,
            reason: suppression.reason,
          })
          .onConflictDoNothing();

        console.log(`[BounceHandler] Suppressed ${suppression.address} (bounce)`);
      } catch (e) {
        console.error(`[BounceHandler] Failed to add suppression: ${e}`);
      }
    }

    // Handle retries (update delivery results with next_retry_at)
    for (const retry of retries) {
      if (!emailRecord) continue;

      try {
        await db
          .update(deliveryResults)
          .set({
            status: "deferred",
            nextRetryAt: retry.retryAt,
            attemptCount: retry.attempt,
            lastAttemptAt: new Date(),
          })
          .where(
            and(
              eq(deliveryResults.emailId, emailRecord.id),
              eq(deliveryResults.recipientAddress, retry.address),
            ),
          );
      } catch (e) {
        console.error(`[BounceHandler] Failed to update retry: ${e}`);
      }
    }

    return { handled: true, type: "bounce", recipients };
  }

  /**
   * Handle a complaint (ARF) report: parse, suppress, record event.
   */
  private async handleComplaint(rawMessage: string): Promise<BounceHandlerResult> {
    const result = this.processor.processComplaintMessage(rawMessage);
    if (!result.ok) {
      console.warn(`[BounceHandler] Failed to parse complaint: ${result.error.message}`);
      return { handled: false, type: "none", recipients: [] };
    }

    const { complaint, suppression, originalMessageId } = result.value;
    const db = getDatabase();

    // Try to find the original email by message ID
    let emailRecord: { id: string; accountId: string; domainId: string } | null = null;
    if (originalMessageId) {
      const [found] = await db
        .select({
          id: emails.id,
          accountId: emails.accountId,
          domainId: emails.domainId,
        })
        .from(emails)
        .where(eq(emails.messageId, originalMessageId))
        .limit(1);
      emailRecord = found ?? null;
    }

    // Record complaint event
    const eventId = generateId();
    try {
      await db.insert(events).values({
        id: eventId,
        accountId: emailRecord?.accountId ?? "system",
        emailId: emailRecord?.id ?? null,
        messageId: originalMessageId ?? null,
        type: "email.complained" as const,
        recipient: complaint.recipient,
        feedbackType: complaint.feedbackType as "abuse",
        feedbackProvider: complaint.feedbackProvider ?? null,
      });
    } catch (e) {
      console.error(`[BounceHandler] Failed to record complaint event: ${e}`);
    }

    // Update email status
    if (emailRecord) {
      try {
        await db
          .update(emails)
          .set({ status: "complained", updatedAt: new Date() })
          .where(eq(emails.id, emailRecord.id));
      } catch (e) {
        console.error(`[BounceHandler] Failed to update email status: ${e}`);
      }
    }

    // Add to suppression list
    if (suppression && emailRecord) {
      try {
        await db
          .insert(suppressionLists)
          .values({
            id: generateId(),
            email: suppression.address.toLowerCase(),
            domainId: emailRecord.domainId,
            reason: suppression.reason,
          })
          .onConflictDoNothing();

        console.log(`[BounceHandler] Suppressed ${suppression.address} (complaint)`);
      } catch (e) {
        console.error(`[BounceHandler] Failed to add complaint suppression: ${e}`);
      }
    }

    return {
      handled: true,
      type: "complaint",
      recipients: complaint.recipient ? [complaint.recipient] : [],
    };
  }
}

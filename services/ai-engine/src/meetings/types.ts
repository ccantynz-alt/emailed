// =============================================================================
// @emailed/ai-engine — Meeting types (S9)
// =============================================================================
// Shared types for the email-thread → meeting-transcript linker.

export type MeetingPlatform = "zoom" | "meet" | "teams" | "webex";

export type DetectionSource =
  | "calendar_invite"
  | "inline_link"
  | "ai_inferred"
  | "ics_attachment";

export interface MeetingReference {
  /** Provider-specific meeting ID (e.g. Zoom meeting numeric ID). */
  readonly meetingId?: string;
  /** Full join URL if known. */
  readonly meetingUrl?: string;
  readonly scheduledAt?: Date;
  readonly platform?: MeetingPlatform;
  readonly detectedFrom: DetectionSource;
  /** [0..1] heuristic confidence the thread really maps to a real meeting. */
  readonly confidence: number;
  /** Free-form title pulled from a calendar invite or subject line. */
  readonly title?: string;
}

export interface TranscriptParticipant {
  readonly name: string;
  readonly email?: string;
  readonly speakerId?: string;
}

export interface TranscriptResult {
  readonly meetingId: string;
  readonly transcriptText: string;
  readonly summary: string;
  readonly actionItems: readonly string[];
  readonly participants: readonly TranscriptParticipant[];
  /** Duration in seconds */
  readonly duration: number;
  readonly recordingUrl?: string;
  readonly provider: string;
}

/**
 * A pluggable transcript provider. Implementations: Zoom REST, Otter.ai,
 * Fathom, Granola, Read.ai. Each receives the same MeetingReference and
 * returns null when it cannot service the meeting.
 */
export interface TranscriptProvider {
  readonly name: string;
  /** Whether this provider can plausibly service the given meeting. */
  supports(meeting: MeetingReference): boolean;
  /** Fetch the transcript. Returns null if not available. */
  fetch(meeting: MeetingReference): Promise<TranscriptResult | null>;
}

/** Minimal email shape used by the linker. */
export interface LinkerEmail {
  readonly id?: string;
  readonly from?: string;
  readonly to?: readonly string[];
  readonly subject?: string;
  readonly textBody?: string;
  readonly htmlBody?: string;
  readonly receivedAt?: Date;
  readonly attachments?: readonly LinkerEmailAttachment[];
}

export interface LinkerEmailAttachment {
  readonly filename?: string;
  readonly contentType?: string;
  /** UTF-8 string contents of the attachment if already decoded. */
  readonly content?: string;
}

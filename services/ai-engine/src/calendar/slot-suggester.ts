/**
 * AI Calendar Slot Suggester (B7)
 *
 * Given the sender's availability windows, a desired meeting duration, and a
 * date range, returns 3-5 best-quality slots ranked by score. Considers
 * working hours, avoidance of edges (back-to-back meetings), preferred hours,
 * and weekday preference.
 */

export interface AvailabilityWindow {
  start: Date;
  end: Date;
}

export interface SlotSuggestionInput {
  senderAvailability: AvailabilityWindow[];
  recipientEmail: string;
  durationMinutes: number;
  dateRange: { from: Date; to: Date };
  preferredTimes?: { hourStart: number; hourEnd: number };
  timezone: string;
}

export interface SlotSuggestion {
  start: string;
  end: string;
  formattedRange: string;
  durationMinutes: number;
  score: number;
  reasoning: string;
}

const BUFFER_MINUTES = 15;

function formatRange(start: Date, end: Date, tz: string): string {
  try {
    const dateFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeFmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${timeFmt.format(end)} (${tz})`;
  } catch {
    return `${start.toISOString()} – ${end.toISOString()}`;
  }
}

function getHourInTz(date: Date, tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  } catch {
    return date.getUTCHours();
  }
}

function getDayInTz(date: Date, tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    });
    const wd = fmt.format(date);
    const map: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return map[wd] ?? date.getUTCDay();
  } catch {
    return date.getUTCDay();
  }
}

function scoreSlot(
  start: Date,
  end: Date,
  window: AvailabilityWindow,
  input: SlotSuggestionInput,
): { score: number; reasoning: string } {
  let score = 0.5;
  const reasons: string[] = [];

  const hour = getHourInTz(start, input.timezone);
  const day = getDayInTz(start, input.timezone);

  // Preferred hours
  const prefStart = input.preferredTimes?.hourStart ?? 9;
  const prefEnd = input.preferredTimes?.hourEnd ?? 17;
  if (hour >= prefStart && hour < prefEnd) {
    score += 0.2;
    reasons.push("inside preferred hours");
  } else {
    score -= 0.1;
  }

  // Mid-week (Tue/Wed/Thu) bonus
  if (day >= 2 && day <= 4) {
    score += 0.15;
    reasons.push("mid-week");
  } else if (day === 0 || day === 6) {
    score -= 0.4;
    reasons.push("weekend");
  }

  // Sweet spots: 10am, 2pm
  if (hour === 10 || hour === 14) {
    score += 0.1;
    reasons.push("peak attention hour");
  }

  // Buffer from window edges (avoid back-to-back)
  const bufferMs = BUFFER_MINUTES * 60 * 1000;
  if (start.getTime() - window.start.getTime() >= bufferMs) score += 0.05;
  if (window.end.getTime() - end.getTime() >= bufferMs) score += 0.05;

  // Clamp
  score = Math.max(0, Math.min(1, score));

  return {
    score: Math.round(score * 100) / 100,
    reasoning: reasons.length > 0 ? reasons.join(", ") : "available slot",
  };
}

/**
 * Suggest the best 3-5 calendar slots for a meeting based on availability
 * and preferences.
 */
export async function suggestSlotsForCompose(
  input: SlotSuggestionInput,
): Promise<SlotSuggestion[]> {
  const durationMs = input.durationMinutes * 60 * 1000;
  const candidates: SlotSuggestion[] = [];

  for (const window of input.senderAvailability) {
    if (window.end <= input.dateRange.from) continue;
    if (window.start >= input.dateRange.to) continue;

    const windowStart = window.start < input.dateRange.from ? input.dateRange.from : window.start;
    const windowEnd = window.end > input.dateRange.to ? input.dateRange.to : window.end;

    // Step in 30-minute increments inside this window
    const stepMs = 30 * 60 * 1000;
    for (
      let t = windowStart.getTime() + BUFFER_MINUTES * 60 * 1000;
      t + durationMs + BUFFER_MINUTES * 60 * 1000 <= windowEnd.getTime();
      t += stepMs
    ) {
      const start = new Date(t);
      const end = new Date(t + durationMs);

      const { score, reasoning } = scoreSlot(start, end, window, input);
      candidates.push({
        start: start.toISOString(),
        end: end.toISOString(),
        formattedRange: formatRange(start, end, input.timezone),
        durationMinutes: input.durationMinutes,
        score,
        reasoning,
      });
    }
  }

  // Sort by score desc, then by start asc, dedupe close slots within 90 min
  candidates.sort((a, b) => b.score - a.score || a.start.localeCompare(b.start));

  const picked: SlotSuggestion[] = [];
  for (const slot of candidates) {
    const tooClose = picked.some(
      (p) =>
        Math.abs(new Date(p.start).getTime() - new Date(slot.start).getTime()) <
        90 * 60 * 1000,
    );
    if (tooClose) continue;
    picked.push(slot);
    if (picked.length >= 5) break;
  }

  void input.recipientEmail; // reserved for future personalisation

  return picked;
}

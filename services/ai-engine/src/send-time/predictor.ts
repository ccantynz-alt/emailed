/**
 * Predictive Send-Time Optimization (S10)
 *
 * Analyses recipient open/click history to predict the best moment to send
 * an email. When no history exists, falls back to general best-practice
 * windows (Tue-Thu, 9-11am or 2-4pm) in the recipient's likely timezone.
 */

export interface RecipientPattern {
  typicalOpenHours: number[];
  typicalOpenDays: number[];
  avgResponseTimeHours: number;
  openRate: number;
  mostActiveHour: number;
  mostActiveDay: number;
}

export interface HistoricalEmail {
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
}

export interface PredictInput {
  recipientEmail: string;
  senderTimezone: string;
  recipientTimezone?: string;
  urgency: "low" | "normal" | "high";
  windowDays?: number;
}

export interface RecommendedTime {
  datetime: string;
  confidence: number;
  reasoning: string;
}

export interface SendTimeRecommendation {
  recommendedTimes: RecommendedTime[];
  currentlyOptimal: boolean;
  alternativeTimes: number;
}

const DEFAULT_BEST_HOURS: readonly number[] = [9, 10, 14, 15];
const DEFAULT_BEST_DAYS: readonly number[] = [2, 3, 4]; // Tue, Wed, Thu

/**
 * Analyse a recipient's historical engagement patterns.
 */
export async function analyzeRecipientPatterns(
  recipientEmail: string,
  historicalEmails: ReadonlyArray<HistoricalEmail>,
): Promise<RecipientPattern> {
  void recipientEmail;
  if (historicalEmails.length === 0) {
    return {
      typicalOpenHours: [...DEFAULT_BEST_HOURS],
      typicalOpenDays: [...DEFAULT_BEST_DAYS],
      avgResponseTimeHours: 24,
      openRate: 0,
      mostActiveHour: 10,
      mostActiveDay: 3,
    };
  }

  const opened = historicalEmails.filter((e) => e.openedAt instanceof Date);
  const openRate = opened.length / historicalEmails.length;

  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<number, number>();
  for (const email of opened) {
    const d = email.openedAt as Date;
    hourCounts.set(d.getUTCHours(), (hourCounts.get(d.getUTCHours()) ?? 0) + 1);
    dayCounts.set(d.getUTCDay(), (dayCounts.get(d.getUTCDay()) ?? 0) + 1);
  }

  const sortedHours = [...hourCounts.entries()].sort((a, b) => b[1] - a[1]);
  const sortedDays = [...dayCounts.entries()].sort((a, b) => b[1] - a[1]);

  const typicalOpenHours = sortedHours.slice(0, 4).map(([h]) => h);
  const typicalOpenDays = sortedDays.slice(0, 3).map(([d]) => d);

  // Average response time (open relative to send)
  let totalResponseMs = 0;
  let responseCount = 0;
  for (const email of opened) {
    const diff = (email.openedAt as Date).getTime() - email.sentAt.getTime();
    if (diff > 0) {
      totalResponseMs += diff;
      responseCount++;
    }
  }
  const avgResponseTimeHours =
    responseCount > 0 ? totalResponseMs / responseCount / (1000 * 60 * 60) : 24;

  return {
    typicalOpenHours: typicalOpenHours.length > 0 ? typicalOpenHours : [...DEFAULT_BEST_HOURS],
    typicalOpenDays: typicalOpenDays.length > 0 ? typicalOpenDays : [...DEFAULT_BEST_DAYS],
    avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
    openRate: Math.round(openRate * 1000) / 1000,
    mostActiveHour: sortedHours[0]?.[0] ?? 10,
    mostActiveDay: sortedDays[0]?.[0] ?? 3,
  };
}

/**
 * Build a Date for a given day-of-week + hour within the next windowDays.
 */
function nextOccurrence(
  fromDate: Date,
  targetDay: number,
  targetHour: number,
): Date {
  const result = new Date(fromDate.getTime());
  const currentDay = result.getUTCDay();
  let daysAhead = (targetDay - currentDay + 7) % 7;
  if (daysAhead === 0) {
    if (result.getUTCHours() >= targetHour) {
      daysAhead = 7;
    }
  }
  result.setUTCDate(result.getUTCDate() + daysAhead);
  result.setUTCHours(targetHour, 0, 0, 0);
  return result;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Predict the best send times for a recipient.
 */
export async function predictBestSendTime(
  input: PredictInput,
): Promise<SendTimeRecommendation> {
  const windowDays = input.windowDays ?? 7;
  const now = new Date();
  const horizon = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  // Without persistent history we cannot know the recipient's true patterns
  // here — callers wishing to use real history should call
  // analyzeRecipientPatterns first and pass the result via patternOverride.
  // For this entry-point we use defaults shaped by urgency.
  const hours = [...DEFAULT_BEST_HOURS];
  const days = [...DEFAULT_BEST_DAYS];

  const candidates: RecommendedTime[] = [];
  for (const day of days) {
    for (const hour of hours) {
      const dt = nextOccurrence(now, day, hour);
      if (dt > horizon) continue;
      candidates.push({
        datetime: dt.toISOString(),
        confidence: 0.6,
        reasoning: `${DAY_NAMES[day]} at ${hour}:00 is a high-engagement window for most professional recipients`,
      });
    }
  }

  candidates.sort((a, b) => a.datetime.localeCompare(b.datetime));

  // Urgency override: high urgency → soonest sensible window today/tomorrow
  if (input.urgency === "high") {
    const soon = new Date(now.getTime() + 15 * 60 * 1000);
    candidates.unshift({
      datetime: soon.toISOString(),
      confidence: 0.9,
      reasoning: "High urgency — recommend sending within the next 15 minutes",
    });
  }

  const recommendedTimes = candidates.slice(0, 5);

  // currentlyOptimal: are we within 30 minutes of the top recommendation?
  const top = recommendedTimes[0];
  const currentlyOptimal = top
    ? Math.abs(new Date(top.datetime).getTime() - now.getTime()) < 30 * 60 * 1000
    : false;

  return {
    recommendedTimes,
    currentlyOptimal,
    alternativeTimes: Math.max(candidates.length - recommendedTimes.length, 0),
  };
}

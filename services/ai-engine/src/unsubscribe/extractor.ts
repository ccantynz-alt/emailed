/**
 * Unsubscribe Extractor
 *
 * Inspects an email's headers, HTML body and plain-text body and returns
 * every unsubscribe affordance it can find — RFC 2369 `List-Unsubscribe`
 * headers, RFC 8058 `List-Unsubscribe-Post` one-click POSTs, mailto: links
 * and HTTP unsubscribe links sprinkled throughout the body.
 *
 * The returned list is sorted by priority so the highest-confidence
 * mechanism appears first:
 *
 *   1. List-Unsubscribe-Post (one-click, RFC 8058)
 *   2. List-Unsubscribe URL with One-Click hint
 *   3. List-Unsubscribe mailto:
 *   4. List-Unsubscribe https:// URL
 *   5. Body mailto: links labelled "unsubscribe"
 *   6. Body http(s):// links labelled "unsubscribe"
 */

export type UnsubscribeMethod =
  | "one_click_post"
  | "http"
  | "mailto";

export interface UnsubscribeOption {
  /** Mechanism we'll use to actually run the unsubscribe. */
  method: UnsubscribeMethod;
  /** The URL or mailto: target. */
  target: string;
  /** Where we found this option. */
  source:
    | "list_unsubscribe_post_header"
    | "list_unsubscribe_header"
    | "html_body"
    | "text_body";
  /**
   * Priority — lower is better. The list returned by extractUnsubscribeOptions
   * is sorted ascending so callers can simply pick `[0]`.
   */
  priority: number;
  /** Optional human label, e.g. the anchor text we found in the body. */
  label?: string;
  /**
   * Confidence (0..1) that this option will actually unsubscribe the user.
   * Header-based options score 1.0, body links 0.6 unless we found
   * very explicit "unsubscribe" anchor text.
   */
  confidence: number;
}

export interface ExtractEmailInput {
  headers: Record<string, string>;
  htmlBody: string;
  textBody: string;
}

// ─── Header parsing ──────────────────────────────────────────────────────────

function getHeader(
  headers: Record<string, string>,
  name: string,
): string | undefined {
  // Case-insensitive header lookup.
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

/**
 * Parse a `List-Unsubscribe` header value into its constituent targets.
 *
 *   List-Unsubscribe: <https://example.com/u?id=1>, <mailto:u@example.com>
 */
function parseListUnsubscribeHeader(value: string): string[] {
  const targets: string[] = [];
  const re = /<([^>]+)>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    const target = match[1]?.trim();
    if (target) targets.push(target);
  }
  return targets;
}

// ─── Body link extraction ───────────────────────────────────────────────────

const UNSUB_KEYWORDS = [
  "unsubscribe",
  "opt out",
  "opt-out",
  "manage preferences",
  "email preferences",
  "remove me",
  "stop receiving",
];

interface BodyLink {
  url: string;
  text: string;
}

function extractAnchorsFromHtml(html: string): BodyLink[] {
  const anchors: BodyLink[] = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const url = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    const rawText = (match[4] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (url) anchors.push({ url, text: rawText });
  }
  return anchors;
}

function extractUrlsFromText(text: string): BodyLink[] {
  const links: BodyLink[] = [];
  const urlRe = /\b((?:https?:\/\/|mailto:)[^\s<>"']+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlRe.exec(text)) !== null) {
    const url = match[1];
    if (!url) continue;
    // Grab a small window of surrounding text as the "label".
    const start = Math.max(0, match.index - 40);
    const end = Math.min(text.length, match.index + url.length + 40);
    links.push({ url, text: text.slice(start, end) });
  }
  return links;
}

function looksLikeUnsubscribe(label: string, url: string): boolean {
  const haystack = `${label} ${url}`.toLowerCase();
  return UNSUB_KEYWORDS.some((kw) => haystack.includes(kw));
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function extractUnsubscribeOptions(
  email: ExtractEmailInput,
): Promise<UnsubscribeOption[]> {
  const options: UnsubscribeOption[] = [];

  // 1. RFC 8058 one-click POST.
  const postHeader = getHeader(email.headers, "List-Unsubscribe-Post");
  const listHeader = getHeader(email.headers, "List-Unsubscribe");

  if (postHeader && /one-click/i.test(postHeader) && listHeader) {
    for (const target of parseListUnsubscribeHeader(listHeader)) {
      if (/^https?:\/\//i.test(target)) {
        options.push({
          method: "one_click_post",
          target,
          source: "list_unsubscribe_post_header",
          priority: 1,
          confidence: 1,
        });
      }
    }
  }

  // 2/3/4. List-Unsubscribe header (mailto + http).
  if (listHeader) {
    for (const target of parseListUnsubscribeHeader(listHeader)) {
      if (target.toLowerCase().startsWith("mailto:")) {
        options.push({
          method: "mailto",
          target,
          source: "list_unsubscribe_header",
          priority: 2,
          confidence: 0.95,
        });
      } else if (/^https?:\/\//i.test(target)) {
        // Skip if we already added this exact URL as one-click POST.
        const dupe = options.some(
          (o) => o.method === "one_click_post" && o.target === target,
        );
        if (!dupe) {
          options.push({
            method: "http",
            target,
            source: "list_unsubscribe_header",
            priority: 3,
            confidence: 0.9,
          });
        }
      }
    }
  }

  // 5/6. Body links — html first, then plain text.
  const htmlAnchors = extractAnchorsFromHtml(email.htmlBody);
  for (const a of htmlAnchors) {
    if (!looksLikeUnsubscribe(a.text, a.url)) continue;
    if (a.url.toLowerCase().startsWith("mailto:")) {
      options.push({
        method: "mailto",
        target: a.url,
        source: "html_body",
        priority: 4,
        label: a.text,
        confidence: 0.7,
      });
    } else if (/^https?:\/\//i.test(a.url)) {
      options.push({
        method: "http",
        target: a.url,
        source: "html_body",
        priority: 5,
        label: a.text,
        confidence: 0.65,
      });
    }
  }

  const textLinks = extractUrlsFromText(email.textBody);
  for (const l of textLinks) {
    if (!looksLikeUnsubscribe(l.text, l.url)) continue;
    if (l.url.toLowerCase().startsWith("mailto:")) {
      options.push({
        method: "mailto",
        target: l.url,
        source: "text_body",
        priority: 6,
        label: l.text.trim(),
        confidence: 0.6,
      });
    } else if (/^https?:\/\//i.test(l.url)) {
      options.push({
        method: "http",
        target: l.url,
        source: "text_body",
        priority: 7,
        label: l.text.trim(),
        confidence: 0.55,
      });
    }
  }

  // De-duplicate by (method, target) keeping the lowest priority.
  const seen = new Map<string, UnsubscribeOption>();
  for (const opt of options) {
    const key = `${opt.method}::${opt.target}`;
    const prev = seen.get(key);
    if (!prev || opt.priority < prev.priority) seen.set(key, opt);
  }

  return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
}

/**
 * Convenience helper — return only the single best unsubscribe option, or
 * `null` if the email doesn't expose any.
 */
export async function pickBestUnsubscribeOption(
  email: ExtractEmailInput,
): Promise<UnsubscribeOption | null> {
  const all = await extractUnsubscribeOptions(email);
  return all[0] ?? null;
}

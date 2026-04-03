import type { ParsedEmail, AuthenticationResult, FilterVerdict, SmtpEnvelope } from "../types.js";

// --- Filter Stage Interface ---

interface FilterContext {
  envelope: SmtpEnvelope;
  email: ParsedEmail;
  verdict: FilterVerdict;
  metadata: Map<string, unknown>;
}

type FilterStage = (ctx: FilterContext) => Promise<FilterContext>;

// --- Authentication Check Stage ---

async function authenticationCheck(ctx: FilterContext): Promise<FilterContext> {
  const { email, envelope } = ctx;

  // SPF check: verify the sending server is authorized for the sender domain
  const senderDomain = envelope.mailFrom.split("@")[1];
  if (senderDomain) {
    const spfResult: AuthenticationResult = {
      method: "spf",
      result: "neutral", // In production: perform actual DNS lookup for SPF record
      domain: senderDomain,
      details: `Checked SPF for ${senderDomain}`,
    };
    ctx.verdict.authResults.push(spfResult);
  }

  // DKIM check: verify signature in headers
  const dkimSignature = email.headers.find((h) => h.key === "dkim-signature");
  if (dkimSignature) {
    const domainMatch = dkimSignature.value.match(/d=([^\s;]+)/);
    const selectorMatch = dkimSignature.value.match(/s=([^\s;]+)/);

    const dkimResult: AuthenticationResult = {
      method: "dkim",
      result: "neutral", // In production: verify cryptographic signature
      domain: domainMatch?.[1],
      selector: selectorMatch?.[1],
      details: "DKIM signature present",
    };
    ctx.verdict.authResults.push(dkimResult);
  } else {
    ctx.verdict.authResults.push({
      method: "dkim",
      result: "none",
      details: "No DKIM signature found",
    });
  }

  // DMARC check: verify alignment between SPF/DKIM domains and From header
  const fromDomain = email.from[0]?.address.split("@")[1];
  if (fromDomain) {
    const spfAligned = senderDomain === fromDomain;
    const dkimDomain = ctx.verdict.authResults.find((r) => r.method === "dkim")?.domain;
    const dkimAligned = dkimDomain === fromDomain;

    const dmarcResult: AuthenticationResult = {
      method: "dmarc",
      result: spfAligned || dkimAligned ? "pass" : "fail",
      domain: fromDomain,
      details: `SPF aligned: ${spfAligned}, DKIM aligned: ${dkimAligned}`,
    };
    ctx.verdict.authResults.push(dmarcResult);

    if (dmarcResult.result === "fail") {
      ctx.verdict.score = (ctx.verdict.score ?? 0) + 3;
      ctx.verdict.flags.add("dmarc_fail");
    }
  }

  return ctx;
}

// --- Spam Filter Stage ---

const SPAM_HEADER_INDICATORS = [
  { pattern: /x-mailer:.*bulk/i, score: 2, flag: "bulk_mailer" },
  { pattern: /precedence:\s*bulk/i, score: 1, flag: "precedence_bulk" },
  { pattern: /list-unsubscribe/i, score: -1, flag: "has_unsubscribe" },
];

const SPAM_BODY_PATTERNS = [
  { pattern: /\bcialis\b|\bviagra\b|\brolex\b/i, score: 5, flag: "pharma_spam" },
  { pattern: /\bclick here\b.*\bfree\b/i, score: 2, flag: "clickbait" },
  { pattern: /\bunsubscribe\b/i, score: -0.5, flag: "has_unsubscribe_body" },
  { pattern: /\bdear\s+(?:sir|madam|customer|user|friend)\b/i, score: 1.5, flag: "generic_greeting" },
  { pattern: /\burgent\b.*\bact\s+now\b/i, score: 3, flag: "urgency_spam" },
];

async function spamFilter(ctx: FilterContext): Promise<FilterContext> {
  const { email } = ctx;
  let score = ctx.verdict.score ?? 0;

  // Check headers
  for (const header of email.headers) {
    const headerLine = `${header.key}: ${header.value}`;
    for (const indicator of SPAM_HEADER_INDICATORS) {
      if (indicator.pattern.test(headerLine)) {
        score += indicator.score;
        ctx.verdict.flags.add(indicator.flag);
      }
    }
  }

  // Check body content
  const bodyText = (email.text ?? "") + " " + (email.html ?? "");
  for (const pattern of SPAM_BODY_PATTERNS) {
    if (pattern.pattern.test(bodyText)) {
      score += pattern.score;
      ctx.verdict.flags.add(pattern.flag);
    }
  }

  // Ratio of images to text (common in spam)
  if (email.html) {
    const imgCount = (email.html.match(/<img/gi) ?? []).length;
    const textLength = email.text?.length ?? 0;
    if (imgCount > 3 && textLength < 100) {
      score += 2;
      ctx.verdict.flags.add("image_heavy");
    }
  }

  // Empty subject
  if (!email.subject || email.subject.trim().length === 0) {
    score += 1;
    ctx.verdict.flags.add("empty_subject");
  }

  // ALL CAPS subject
  if (email.subject && email.subject === email.subject.toUpperCase() && email.subject.length > 10) {
    score += 1.5;
    ctx.verdict.flags.add("caps_subject");
  }

  ctx.verdict.score = score;

  // Threshold decisions
  if (score >= 8) {
    ctx.verdict.action = "reject";
    ctx.verdict.reason = `Spam score ${score} exceeds rejection threshold`;
  } else if (score >= 5) {
    ctx.verdict.action = "quarantine";
    ctx.verdict.reason = `Spam score ${score} exceeds quarantine threshold`;
  }

  return ctx;
}

// --- Phishing Filter Stage ---

async function phishingFilter(ctx: FilterContext): Promise<FilterContext> {
  const { email } = ctx;
  if (ctx.verdict.action === "reject") return ctx;

  let score = ctx.verdict.score ?? 0;

  if (email.html) {
    // Check for deceptive links: display text is a URL that doesn't match href
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(email.html)) !== null) {
      const href = match[1]!;
      const displayText = match[2]!.trim();

      // If display text looks like a URL but points elsewhere
      if (displayText.match(/^https?:\/\//)) {
        try {
          const hrefUrl = new URL(href);
          const displayUrl = new URL(displayText);
          if (hrefUrl.hostname !== displayUrl.hostname) {
            score += 4;
            ctx.verdict.flags.add("deceptive_link");
          }
        } catch {
          // Malformed URL in display text
        }
      }
    }

    // Check for known phishing patterns
    const phishingPatterns = [
      /verify\s+your\s+(?:account|identity|password)/i,
      /suspended?\s+(?:your\s+)?account/i,
      /confirm\s+your\s+(?:identity|billing|payment)/i,
      /unusual\s+(?:activity|sign[- ]?in)/i,
    ];

    for (const pattern of phishingPatterns) {
      if (pattern.test(email.html) || (email.text && pattern.test(email.text))) {
        score += 2;
        ctx.verdict.flags.add("phishing_language");
        break;
      }
    }

    // Form elements in HTML email (suspicious)
    if (/<form[^>]*>/i.test(email.html)) {
      score += 3;
      ctx.verdict.flags.add("contains_form");
    }
  }

  ctx.verdict.score = score;

  if (score >= 8 && ctx.verdict.action !== "reject") {
    ctx.verdict.action = "quarantine";
    ctx.verdict.reason = `Phishing indicators detected (score: ${score})`;
  }

  return ctx;
}

// --- Content Filter Stage ---

async function contentFilter(ctx: FilterContext): Promise<FilterContext> {
  const { email } = ctx;
  if (ctx.verdict.action === "reject") return ctx;

  // Check attachment types for dangerous content
  const dangerousExtensions = new Set([
    ".exe", ".scr", ".bat", ".cmd", ".com", ".pif", ".vbs", ".vbe",
    ".js", ".jse", ".wsf", ".wsh", ".msi", ".dll", ".cpl",
  ]);

  const dangerousContentTypes = new Set([
    "application/x-msdownload",
    "application/x-executable",
    "application/x-msdos-program",
    "application/vnd.microsoft.portable-executable",
  ]);

  for (const attachment of email.attachments) {
    const ext = attachment.filename.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";

    if (dangerousExtensions.has(ext)) {
      ctx.verdict.flags.add(`dangerous_attachment:${ext}`);
      ctx.verdict.score = (ctx.verdict.score ?? 0) + 5;
    }

    if (dangerousContentTypes.has(attachment.contentType.toLowerCase())) {
      ctx.verdict.flags.add("dangerous_content_type");
      ctx.verdict.score = (ctx.verdict.score ?? 0) + 5;
    }

    // Double extension check (e.g., invoice.pdf.exe)
    const doubleExt = attachment.filename.match(/\.\w+\.\w+$/);
    if (doubleExt && dangerousExtensions.has(ext)) {
      ctx.verdict.flags.add("double_extension");
      ctx.verdict.score = (ctx.verdict.score ?? 0) + 3;
    }
  }

  // Password-protected archives (common malware vector)
  const bodyText = (email.text ?? "") + " " + (email.html ?? "");
  const hasArchive = email.attachments.some((a) =>
    /\.(zip|rar|7z)$/i.test(a.filename),
  );
  if (hasArchive && /password/i.test(bodyText)) {
    ctx.verdict.flags.add("password_protected_archive");
    ctx.verdict.score = (ctx.verdict.score ?? 0) + 2;
  }

  if ((ctx.verdict.score ?? 0) >= 8 && ctx.verdict.action === "accept") {
    ctx.verdict.action = "quarantine";
    ctx.verdict.reason = "Suspicious content detected";
  }

  return ctx;
}

// --- Malware Scan Stage ---

async function malwareScan(ctx: FilterContext): Promise<FilterContext> {
  const { email } = ctx;
  if (ctx.verdict.action === "reject") return ctx;

  for (const attachment of email.attachments) {
    // Check for EICAR test pattern (standard AV test string)
    const content = new TextDecoder("utf-8", { fatal: false }).decode(attachment.content);
    if (content.includes("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*")) {
      ctx.verdict.action = "reject";
      ctx.verdict.reason = "Malware detected in attachment";
      ctx.verdict.flags.add("malware_detected");
      return ctx;
    }

    // In production: send to ClamAV or cloud AV scanning service
    // const scanResult = await avScanner.scan(attachment.content);
  }

  return ctx;
}

// --- Pipeline Orchestrator ---

export class FilterPipeline {
  private stages: { name: string; handler: FilterStage }[] = [];

  constructor() {
    // Default pipeline stages in order
    this.stages = [
      { name: "authentication", handler: authenticationCheck },
      { name: "spam", handler: spamFilter },
      { name: "phishing", handler: phishingFilter },
      { name: "content", handler: contentFilter },
      { name: "malware", handler: malwareScan },
    ];
  }

  /**
   * Add a custom filter stage at a specific position.
   */
  addStage(name: string, handler: FilterStage, position?: number): void {
    const stage = { name, handler };
    if (position !== undefined) {
      this.stages.splice(position, 0, stage);
    } else {
      this.stages.push(stage);
    }
  }

  /**
   * Remove a filter stage by name.
   */
  removeStage(name: string): boolean {
    const idx = this.stages.findIndex((s) => s.name === name);
    if (idx === -1) return false;
    this.stages.splice(idx, 1);
    return true;
  }

  /**
   * Run the full filter pipeline on an email.
   */
  async process(envelope: SmtpEnvelope, email: ParsedEmail): Promise<FilterVerdict> {
    let ctx: FilterContext = {
      envelope,
      email,
      verdict: {
        action: "accept",
        score: 0,
        flags: new Set(),
        authResults: [],
      },
      metadata: new Map(),
    };

    for (const stage of this.stages) {
      try {
        ctx = await stage.handler(ctx);

        // Short-circuit on hard reject
        if (ctx.verdict.action === "reject") {
          console.log(
            `[FilterPipeline] Rejected at stage '${stage.name}': ${ctx.verdict.reason}`,
          );
          break;
        }
      } catch (err) {
        console.error(`[FilterPipeline] Error in stage '${stage.name}':`, err);
        // On error, defer rather than silently accept
        ctx.verdict.action = "defer";
        ctx.verdict.reason = `Filter error in stage '${stage.name}'`;
        ctx.verdict.flags.add(`error:${stage.name}`);
        break;
      }
    }

    return ctx.verdict;
  }
}

# VIENNA — THE BIBLE

> **This document is the single source of truth for Vienna.**
> **Read it FIRST. Reference it ALWAYS. Violate it NEVER.**

---

## ⚡ THE PRIME DIRECTIVE

**Vienna kills Gmail. Vienna kills Outlook. Vienna kills Superhuman.**

Email has not been reinvented since 2004. We are the reinvention. There is no second place. We dominate or we die. Every line of code, every component, every decision, every commit must serve this mission.

**The standard:** 80-90% ahead of every competitor at all times. Not 10%. Not 30%. Eighty to ninety percent.

If a competitor closes the gap, we accelerate. If new technology threatens our lead, we absorb it or destroy the need for it. We are not in a race — we are lapping the field.

---

## 📖 THE BIBLE RULE

**Before ANY new build, ANY refactor, ANY significant change — READ THIS FILE FIRST.**

This file is read at the start of every session. It is referenced before every architectural decision. It is updated at the end of every session. No work happens outside the framework defined here.

**No scatter-gun. No drift. No "just this once."** Every action ties back to this document.

---

## 👑 THE BOSS RULE — CRAIG MUST AUTHORIZE

The following actions require **explicit authorization from Craig (the boss/owner) BEFORE execution**:

1. **Major architectural changes** — swapping frameworks, changing core stack, altering data model
2. **New dependencies that aren't already in the approved stack** — we don't add bloat
3. **Pricing changes** — any modification to plans, tiers, or billing logic
4. **Domain or DNS changes** — anything touching vieanna.com or its subdomains
5. **Production deployments** — first-time deploy and any rollback
6. **Stripe configuration** — webhook URLs, price IDs, plan structures
7. **Schema migrations on production database** — irreversible changes need sign-off
8. **External API integrations** — adding new third-party services
9. **Brand/marketing changes** — copy on landing page, logos, taglines
10. **Anything that touches money, users' data, or public-facing communication**

**The rule:** When in doubt, ask Craig. Cost of asking = 30 seconds. Cost of acting wrong = days of damage.

**The exception:** Craig has pre-authorized continuous building of features within the existing build plan and stack. Routine code, bug fixes, refactors within the approved architecture, and committing/pushing to the development branch do NOT require additional authorization.

---

## 🎯 THE MISSION

Build the fastest, smartest, most beautiful, most aggressive email client ever made. One subscription. Every account. Every device. Every language. AI in every layer. No ads. No data mining. No bloat. No compromise.

**The customer sees:** Magic. Speed. Beauty. Their email actually works.
**The competition sees:** A force they cannot match without rebuilding from scratch.
**Craig sees:** Recurring revenue with 85%+ margins on a moat that compounds over time.


---

## 🔥 THE AGGRESSIVE STACK

Every tool here was chosen because it is the **best in its class right now**. If something better emerges, we replace it without sentiment. Loyalty is to the mission, not the tools.

### Backend & Runtime
| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Bun | 52K req/s, 10-20x faster installs, native TS, replaces npm/yarn/pnpm |
| **API Framework** | Hono | 4x faster than Express, runs everywhere, RegExpRouter is the fastest JS router |
| **Type Safety** | TypeScript strict mode | No `any`, no `@ts-ignore`, no exceptions |
| **API Layer** | tRPC + REST + OpenAPI | Type-safe end-to-end, no codegen, no drift |
| **ORM** | Drizzle | 7.4KB bundle, SQL-like TS, optimal for serverless cold starts |
| **Validation** | Zod | Schema validation at every boundary |

### Frontend & UI
| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | RSC, streaming, deployment to Cloudflare Pages |
| **Language** | TypeScript strict | Same rules as backend |
| **Components** | Custom design system + Radix primitives | Accessible, themeable, ZERO HTML in app code |
| **Styling** | Tailwind CSS | Utility-first, atomic, zero unused CSS shipped |
| **State** | Signals + TanStack Query | Reactive, server-state aware, no Redux bloat |
| **Editor** | Tiptap (compose) | Best-in-class rich text |
| **Animation** | Motion (Framer Motion) | Spring physics, layout animations |
| **Bundler** | Turbopack | Rust-based, 10x faster than Webpack |
| **Linter/Formatter** | Biome | 50-100x faster than ESLint+Prettier |

### AI Layer
| Layer | Choice | Why |
|---|---|---|
| **Primary LLM** | Claude (Anthropic) | Best reasoning, best at following instructions, fastest improvement curve |
| **Models** | Haiku 4.5 (default), Sonnet 4.6 (Pro), Opus 4.6 (Enterprise) | Tier features by model power |
| **Transcription** | Whisper API (OpenAI) | Best multi-language ASR |
| **Local Inference** | Transformers.js / WebLLM | Free, private, runs on user GPU |
| **Translation** | Claude API | Beats Google Translate on context |
| **Embeddings** | Voyage AI (when added) | Best semantic search quality |

### Data
| Layer | Choice | Why |
|---|---|---|
| **Primary DB** | Neon Serverless Postgres | Scale-to-zero, branches like Git, edge replicas |
| **Cache/Queue** | Upstash Redis | Serverless, CF Workers compatible, REST API |
| **Search** | Meilisearch | Sub-50ms full-text, typo tolerance, zero config |
| **Object Storage** | Cloudflare R2 | S3-compatible, ZERO egress fees |
| **Local Cache** | IndexedDB | Browser-native, offline-first, infinite size |
| **Analytics DB** | ClickHouse | Time-series at scale (when needed) |

### Infrastructure
| Layer | Choice | Why |
|---|---|---|
| **Hosting** | Cloudflare Pages + Workers | Sub-5ms cold starts, 330+ cities, $5/mo for 10M requests |
| **DNS** | Cloudflare | One vendor, full control |
| **CDN** | Cloudflare | Built-in with Pages |
| **Container Registry** | Cloudflare R2 | When we need it |
| **GPU Compute** | Modal.com | A100/H100 on-demand for heavy AI |
| **Long-Lived Processes** | Fly.io | Firecracker microVMs for MTA, WebSocket |
| **CI/CD** | GitHub Actions | Already wired |
| **Monitoring** | OpenTelemetry + Grafana LGTM stack | Vendor-neutral observability |

### Auth & Security
| Layer | Choice | Why |
|---|---|---|
| **Primary Auth** | Passkeys / WebAuthn (FIDO2) | 98% login success vs 13.8% for passwords |
| **OAuth** | Direct integrations (Google, Microsoft) | Email account connection |
| **JWT** | jose library | Standards-compliant, fast |
| **Encryption** | Web Crypto API (RSA-OAEP-4096 + AES-256-GCM) | Native browser, FIPS-equivalent |
| **TLS** | TLS 1.3 minimum | No exceptions |

### Payments
| Layer | Choice | Why |
|---|---|---|
| **Billing** | Stripe | Industry standard, best DX, lowest churn tools |
| **Plans** | Free / Personal $9 / Pro $19 / Team $12pp / Enterprise | Fixed — Craig must authorize changes |

### Mobile & Desktop
| Layer | Choice | Why |
|---|---|---|
| **Desktop App** | Electron (initially), Tauri (v2) | Ship fast, optimize later |
| **Mobile App** | React Native + Expo | Single codebase, native performance |
| **PWA** | Built into Next.js | Day-one install on any device |


---

## ⚔️ THE AGGRESSIVE ARCHITECTURE

### Three-Tier Compute Model
```
CLIENT GPU (WebGPU) ──→ EDGE (Cloudflare Workers) ──→ CLOUD (Modal GPUs)
       $0/token              sub-50ms                    Full H100 power
       sub-10ms              lightweight inference        heavy AI / training
       grammar/triage        compose/translate            voice profile train
```

The platform decides where each request runs based on cost, latency, and capability. **The user never sees the tier. They just see speed.**

### Local-First Architecture
- All emails cached in IndexedDB on first sync
- UI reads from local cache (sub-50ms)
- Background workers sync changes to/from server
- Offline support out of the box
- Optimistic UI updates with rollback on failure

### Edge-First Deployment
- Every API route deployable to Cloudflare Workers
- Sub-50ms response times globally
- No regional bottlenecks
- Stateful workloads (MTA, WebSocket) on Fly.io microVMs

### AI-Native Architecture
**AI is woven into every layer, not bolted on:**
- AI in routing (predictive prefetch)
- AI in data fetching (smart cache invalidation)
- AI in UI (adaptive density, smart suggestions)
- AI in error recovery (self-healing)
- AI in search (natural language)
- AI in compose (voice profile + grammar agent)
- AI in triage (priority inbox + commitments)
- AI in security (threat detection)

### Component Architecture
- **ZERO HTML in app code.** Everything is a component.
- Every component has a Zod schema for AI composition
- Every component is themeable, accessible, keyboard-navigable
- Server Components by default, Client Components only when needed
- Storybook for visual testing (when added)

---

## 🛡️ THE QUALITY BAR

### Performance Budgets — CI FAILS IF VIOLATED
| Metric | Budget |
|---|---|
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 1.5s |
| Time to Interactive | < 2.0s |
| Inbox load (cached) | < 100ms |
| Inbox load (cold) | < 1.5s |
| Search response | < 50ms (local), < 200ms (server) |
| API response (edge) | < 50ms p99 |
| API response (cloud) | < 200ms p99 |
| AI response (client) | < 200ms |
| AI response (edge) | < 500ms |
| AI response (cloud) | < 2s |
| Initial JS bundle | < 100KB |
| Email send time-to-delivered | < 2s |

### Code Standards — NO EXCEPTIONS
- TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- No `any`. No `@ts-ignore`. No `as unknown as X`. Use `unknown` and narrow.
- Every function has explicit return types
- Every prop has explicit types
- Every API boundary has Zod validation
- Every error case has typed handling (Result types preferred over try/catch for business logic)
- Conventional commits: `feat:`, `fix:`, `perf:`, `refactor:`, `test:`, `docs:`, `ci:`, `chore:`
- All public APIs have OpenAPI specs
- All endpoints have integration tests
- All components have visual snapshots
- Biome formats and lints — no ESLint, no Prettier

### Component Rules
- ZERO raw HTML elements outside of `packages/ui` primitives
- Every component must be accessible (ARIA, keyboard nav, screen reader friendly)
- Every component must support themes (light/dark/system + accent colors)
- No inline styles — Tailwind classes or CSS modules only
- No CSS-in-JS runtime (build-time only)
- Server Components by default

### AI Integration Rules
- All AI calls have fallback behavior if AI is unavailable
- AI decisions are logged and auditable
- Confidence scores accompany all classifications
- User data used for AI must be anonymizable
- Model selection is automatic based on task complexity
- All AI interactions are traced via OpenTelemetry
- Destructive AI actions require human-in-the-loop approval

### Accessibility — CHARLIE BROWN TO 007
**Vienna must work for novices AND experts equally well:**
- WCAG 2.2 AA minimum (target AAA where possible)
- Full keyboard navigation (every action has a shortcut)
- Screen reader optimization (real ARIA, real focus management)
- Voice control (dictation engine + command palette)
- High contrast mode
- Reduced motion mode
- Adjustable density (compact/comfortable/spacious)
- Adjustable font sizes (small/medium/large)
- Color blind safe palettes
- Minimum touch target 44x44px on mobile

### Security Requirements
- No secrets in code — env vars or secrets manager only
- All inter-service communication over TLS 1.3
- Rate limiting on every public endpoint (already done — 6 tiers)
- Input validation at every boundary (Zod)
- CSP headers on all web responses
- HSTS preloading
- Regular dependency audits (Renovate + Dependabot)
- E2E encryption for users who enable it
- Zero-knowledge architecture for encrypted content
- No third-party trackers, no analytics that send PII off-server


---

## ❌ THE FORBIDDEN LIST

**NEVER do these things. Ever. Without exception:**

1. **Never write raw HTML in app code.** Components only.
2. **Never use `any` type.** Use `unknown` and narrow.
3. **Never use `@ts-ignore`.** Fix the type.
4. **Never commit secrets.** Env vars only.
5. **Never skip tests for "speed."** Untested code does not exist.
6. **Never use external JavaScript trackers.** No Google Analytics, no Hotjar, no Mixpanel-as-default.
7. **Never sell user data.** Period. This is the moat.
8. **Never show ads in the email client.** We're not Gmail.
9. **Never break the local cache contract.** Reads from cache must always return.
10. **Never deploy to production without Craig's authorization.**
11. **Never modify Stripe configuration without Craig's authorization.**
12. **Never add a dependency that isn't in the approved stack without Craig's authorization.**
13. **Never delete user data without explicit user action AND a 30-day soft-delete window.**
14. **Never ship a feature that isn't accessible.** If a screen reader can't use it, it's broken.
15. **Never use `localStorage` for sensitive data.** IndexedDB with encryption only.
16. **Never trust user input.** Validate everything with Zod.
17. **Never block on a single AI provider.** Always have a fallback path.
18. **Never let an error bubble unhandled to the user.** Wrap, log, recover, retry.
19. **Never silently fail.** Errors are visible to monitoring.
20. **Never ship a feature without a CLAUDE.md update.** This file is the source of truth.
21. **Never approve a PR you didn't read end-to-end.**
22. **Never use the word "Emailed" in user-facing copy.** It's Vienna.
23. **Never refer to competitors by name in marketing.** Show, don't tell.
24. **Never make up user metrics for marketing.** Real numbers or no numbers.
25. **Never let speed be an excuse for sloppiness.** Move fast WITHOUT breaking things.

---

## 📋 PRE-FLIGHT CHECKLIST (BEFORE EVERY BUILD)

Before writing a single line of new code:

1. ✅ Read the relevant section of CLAUDE.md
2. ✅ Confirm the task is in the build plan (TIER 1-4)
3. ✅ Confirm the task doesn't require Craig's authorization
4. ✅ Confirm the existing patterns to follow (check similar files)
5. ✅ Confirm the dependencies are already in the approved stack
6. ✅ Confirm the performance budget for this feature
7. ✅ Confirm the accessibility requirements
8. ✅ Identify which tests need to be added
9. ✅ Identify which routes/APIs need to be wired
10. ✅ Plan the commit message in advance

---

## 🧪 POST-BUILD CHECKLIST (BEFORE COMMITTING)

After writing the code:

1. ✅ Tests pass locally (`bun run test`)
2. ✅ Type check passes (`bun run typecheck`)
3. ✅ Lint passes (`bun run lint`)
4. ✅ Build passes (`bun run build`)
5. ✅ No `any`, `@ts-ignore`, `console.log` left over
6. ✅ All new endpoints registered in server.ts
7. ✅ All new routes have rate limiting + auth
8. ✅ All new schemas exported from packages/db/src/index.ts
9. ✅ CLAUDE.md updated with new feature in build status
10. ✅ Conventional commit message ready
11. ✅ Performance budget verified
12. ✅ Accessibility verified (keyboard nav works)

---

## 🚨 EMERGENCY PROTOCOLS

### Production Outage
1. **Check status page** (when set up): status.vieanna.com
2. **Roll back** to last known good commit
3. **Notify Craig** immediately
4. **Post-mortem** within 24 hours, written and committed to `docs/postmortems/`
5. **Add a test** that prevents the same failure

### Security Incident
1. **Immediately revoke** any compromised credentials
2. **Notify Craig** within 15 minutes of discovery
3. **Rotate ALL secrets** even tangentially related
4. **Audit log review** for the affected period
5. **Notify affected users** within 72 hours (GDPR requirement)
6. **Public disclosure** if appropriate, within 30 days
7. **Post-mortem** + prevention plan

### Data Loss
1. **Stop writes immediately** to prevent further loss
2. **Restore from most recent backup** (Neon point-in-time recovery)
3. **Notify Craig** + affected users immediately
4. **Verify integrity** of restored data before resuming writes
5. **Post-mortem** + prevention plan

### Cost Overrun
1. **If AI cost spikes 10x normal:** Auto-throttle to free tier limits
2. **If infrastructure cost spikes:** Alert Craig immediately
3. **Set budget alerts** on every paid service
4. **Review monthly** — anything growing unexpectedly gets investigated


---

## 💰 PRICING & REVENUE (LOCKED — CRAIG ONLY)

### Plans
| Plan | Price | Includes |
|---|---|---|
| **Free** | $0/mo | 1 account, basic AI (5 composes/day), 30-day search, no E2EE |
| **Personal** | $9/mo | 3 accounts, full AI, unlimited search, E2EE, snooze, schedule send |
| **Pro** | $19/mo | Unlimited accounts, priority AI (Sonnet), team features, API access, analytics |
| **Team** | $12/user/mo | Shared inboxes, admin console, audit logs, SSO, priority support |
| **Enterprise** | Custom | On-prem option, compliance, dedicated support, SLA, Opus AI |

**These prices are LOCKED. Changes require Craig's authorization.**

### Add-On Revenue
- Custom domain email hosting: $4/user/mo
- Priority AI processing: $5/mo
- Email analytics premium: $7/mo
- API access (usage-based): $0.01/call
- White-label licensing: $2K-$10K/mo

### Revenue Targets
| Stage | Users | MRR | Team |
|---|---|---|---|
| Beta | 500 free / 50 paid | ~$700/mo | Craig + AI |
| PMF | 2K free / 500 paid | ~$6K/mo | Craig + AI |
| Growth | 10K free / 2K paid | ~$25K/mo | Craig + 1 dev |
| Scale | 50K free / 10K paid | ~$130K/mo | 5 |
| Series A | 200K free / 40K paid | ~$500K/mo | 15 |
| Exit | 1M+ free / 200K paid | ~$2.5M/mo | 40 |

---

## 🌐 DOMAIN & INFRASTRUCTURE

### Domains (vieanna.com confirmed)
- **vieanna.com** — Landing/marketing site (Cloudflare Pages)
- **mail.vieanna.com** — Email web app (Cloudflare Pages)
- **admin.vieanna.com** — Admin dashboard (Cloudflare Pages)
- **api.vieanna.com** — API server (Cloudflare Workers / Fly.io)
- **smtp.vieanna.com** — MTA outbound (Fly.io, NOT proxied)
- **mx1.vieanna.com / mx2.vieanna.com** — Inbound MX (Fly.io, NOT proxied)
- **status.vieanna.com** — Status page (when set up)
- **docs.vieanna.com** — Developer docs (when set up)

### Hosting Stack
- **Compute:** Cloudflare Pages + Workers (web/api), Fly.io (MTA/long-lived)
- **Database:** Neon Serverless Postgres
- **Cache/Queue:** Upstash Redis
- **Object Storage:** Cloudflare R2
- **DNS:** Cloudflare
- **Backups:** Neon point-in-time recovery + daily R2 snapshots
- **Monitoring:** OpenTelemetry → Grafana

---

## 🚀 DEPLOYMENT GATES

**Production deployment requires ALL of these to be green:**

1. ✅ All tests pass (`bun run test`)
2. ✅ Type check passes
3. ✅ Lint passes
4. ✅ Build artifacts generated successfully
5. ✅ E2E tests pass against staging
6. ✅ Performance budgets met (Lighthouse CI)
7. ✅ Accessibility audit passes
8. ✅ Security scan clean (Dependabot, secret scanning)
9. ✅ Database migrations tested on staging
10. ✅ Rollback plan documented
11. ✅ **Craig has authorized the deployment**
12. ✅ Status page updated
13. ✅ On-call engineer available for next 2 hours

**Staging deployments:** Auto-deploy from main branch.
**Production deployments:** Manual trigger after ALL gates pass + Craig authorization.

---

## 🎨 BRAND & VOICE

### The Vienna Brand
- **Name:** Vienna (always capitalized, never "VIENNA" or "vienna")
- **Tagline (TBD):** "Email, finally."
- **Tone:** Confident, sharp, no corporate fluff. Speak like a human who knows what they're doing.
- **Colors:** TBD (Craig to approve)
- **Logo:** TBD (Craig to approve)

### Copy Rules
- Never use the word "Emailed" in user-facing text — that was the codename
- Never refer to competitors by name in marketing copy
- Never use marketing buzzwords ("synergy", "leverage", "best-in-class")
- Never claim features we don't have
- Never make up user numbers
- Always be specific ("3x faster than Gmail" with proof, not "blazing fast")

### Marketing Strategy
- **Phase 1 (Build in Public):** Weekly X/Twitter updates, "Gmail is 22 years old" narrative
- **Phase 2 (Private Beta):** 500 power users, weekly feedback calls
- **Phase 3 (Public Launch):** Product Hunt #1, Hacker News, tech press
- **Phase 4 (Growth):** SEO, content, referrals, enterprise sales


---

## 📦 BUILD STATUS — WHAT'S DONE

### TIER 1 (Launch Blockers) — 10/10 ✅ COMPLETE
- [x] IMAP/JMAP sync engine
- [x] Gmail OAuth + API sync
- [x] Outlook OAuth + Graph API sync
- [x] Inbox UI + thread view
- [x] Compose with rich text editor
- [x] AI Compose (Claude)
- [x] AI Triage + priority inbox
- [x] Local IndexedDB cache
- [x] Keyboard shortcuts + Cmd+K command palette
- [x] Search (Meilisearch + local)

### TIER 2 (Competitive Parity) — 10/10 ✅ COMPLETE
- [x] AI Reply suggestions
- [x] AI Thread summary
- [x] Snooze + schedule send
- [x] Undo send (10-30s window)
- [x] Multi-account
- [x] Dark mode + themes (7 accent colors, 3 densities)
- [x] Stripe billing
- [x] Auth system
- [x] Settings pages
- [x] Import/migration (Gmail, Outlook, MBOX, EML)

### TIER 3 (Market Leadership) — 10/10 ✅ COMPLETE
- [x] AI natural language search
- [x] Calendar integration
- [x] Contact management
- [x] E2E encryption (RSA-OAEP-4096 + AES-256-GCM)
- [x] Email analytics
- [x] AI-powered rules/filters
- [x] AI follow-up reminders
- [x] Voice Profile (learns writing style)
- [x] AI Unsubscribe (backend ready)
- [x] Grammar Agent (replaces Grammarly)

### TIER 4 (Infrastructure Moat) — 4/6 partial
- [x] Own email hosting (full MTA built)
- [ ] Electron desktop app (PENDING)
- [ ] React Native mobile app (PENDING)
- [x] On-device AI models (Transformers.js wired in grammar agent)
- [x] Public API + webhooks
- [x] Team shared inboxes
- [x] White-label SDK
- [ ] Admin SSO (PARTIAL — admin dashboard exists)

### Bonus Features Built (not in original plan)
- Advanced Dictation Engine (replaces Dragon)
- Smart Inbox with Screener (Hey.com style)
- Email Recall (link-based with revoke)
- Bidirectional Translation (35+ languages)
- Collaboration (shared inboxes, comments, assignments)
- Cloudflare deployment config (DNS setup script, wrangler.toml)
- Neon PostgreSQL setup SQL
- Production .env template

### Total: 30/36 from original plan + 7 bonus features
### API Routes: 28 route files, 100+ endpoints
### Code: ~30K lines of TypeScript

---

## 🔧 KNOWN ISSUES — QUEUED FOR FIX

| # | Issue | Severity | Found | Status |
|---|-------|----------|-------|--------|
| 1 | Monorepo `bun run build` not verified end-to-end | HIGH | 2026-04-05 | PENDING |
| 2 | Web app passkey login button has no onClick handler | MEDIUM | 2026-04-05 | PENDING |
| 3 | Some in-memory stores need DB migration (screener, recall, contacts) | MEDIUM | 2026-04-05 | PENDING |
| 4 | Landing page (vieanna.com) doesn't exist yet — needs Coming Soon | HIGH | 2026-04-05 | PENDING |
| 5 | No actual deployment to Cloudflare yet | HIGH | 2026-04-05 | PENDING |

---

## 🗓️ NEXT ACTIONS — IN ORDER

1. **Build "Coming Soon" landing page** for vieanna.com (no email signup yet)
2. **Verify monorepo build** end-to-end (`bun install && bun run build`)
3. **Fix any build errors** that surface
4. **Wire passkey login handler** on web frontend
5. **Set up Cloudflare Pages** project linked to GitHub
6. **Set up Neon database** + run setup SQL
7. **Set up Upstash Redis**
8. **Configure DNS** for vieanna.com
9. **Deploy landing page** to vieanna.com
10. **Deploy web app** to mail.vieanna.com (Coming Soon mode initially)
11. **Build Electron desktop app** wrapper
12. **Build React Native mobile app**

---

## 📊 SESSION PROTOCOL

### At the START of every session:
1. Read this file (CLAUDE.md) end to end
2. Check the "Known Issues" section
3. Check the "Next Actions" section
4. Confirm what you're working on aligns with the build plan
5. If unclear, ask Craig

### At the END of every session:
1. Update the "Build Status" section with what got done
2. Update the "Known Issues" section with anything discovered
3. Update the "Next Actions" section with what's next
4. Update "Date last updated" at the bottom
5. Commit and push everything
6. Leave the codebase in a runnable state

### When starting a NEW build:
1. Run the Pre-Flight Checklist
2. Build it
3. Run the Post-Build Checklist
4. Commit with conventional commit message
5. Push to development branch
6. Update CLAUDE.md

---

## 📝 ARCHITECTURE DECISION RECORDS (ADRs)

When making a significant architectural decision, document it in `docs/adrs/NNNN-title.md` with:
- **Context:** What's the problem?
- **Decision:** What did we decide?
- **Alternatives:** What did we consider?
- **Consequences:** What does this mean going forward?
- **Status:** Proposed / Accepted / Deprecated / Superseded

Major past decisions:
- ADR-0001: Use Neon over Supabase (serverless economics)
- ADR-0002: Use Cloudflare over Vercel (cost + edge presence)
- ADR-0003: Bun over Node.js (speed)
- ADR-0004: Hono over Express (4x faster, edge-compatible)
- ADR-0005: Tailwind over CSS-in-JS (zero runtime cost)
- ADR-0006: Drizzle over Prisma (smaller bundle, edge-friendly)
- ADR-0007: Claude over GPT (better instruction following, faster improvement)

---

## 🎯 THE COMPETITIVE MANDATE

**We are not building "another email client." We are building the LAST email client.**

Every feature must answer: "Why would someone switch from Gmail/Outlook for this?"

If the answer isn't compelling, don't build it. If it is, build it 10x better than the competition.

**Examples of compelling answers:**
- "Vienna's grammar agent replaces Grammarly, which costs $30/mo. Vienna includes it free."
- "Vienna's dictation lets you reply by voice with email-aware commands. Dragon is dead. Nothing else does this."
- "Vienna's email recall actually works. Outlook's is theater."
- "Vienna's AI learns YOUR writing style. Gmail's AI sounds like a robot."
- "Vienna runs on YOUR computer's GPU for free AI. Gmail charges $30/mo for Gemini."
- "Vienna's commitments tracker catches every promise made in email. Gmail catches none."
- "Vienna unifies Gmail + Outlook + Yahoo + iCloud in one inbox. Superhuman is Gmail-only."

**Examples of bad answers (don't build):**
- "It would be cool"
- "Other apps have it"
- "It's a small change"

---

## 📅 STATUS

**Date last updated:** 2026-04-05
**Current phase:** Phase 1 — Approaching Beta Launch
**Current focus:** Coming Soon landing page + production deployment
**Build completion:** TIER 1-3 done (30/36 features) + 7 bonus features

**Next review:** Before any major architectural change, before any production deployment, at the start of every session.

---

## ⚖️ THE BIBLE RULE (REPRISE)

**This file is the source of truth.**

If something contradicts this file, this file wins.
If you don't know what to do, this file tells you.
If you want to change this file, Craig has to approve it.
If you ship something not in this file, you broke the rules.

**No scatter-gun. No drift. No "just this once."**

**Vienna dominates or Vienna dies. There is no second place.**


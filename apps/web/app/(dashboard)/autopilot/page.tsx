"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Text,
  Card,
  CardContent,
  CardHeader,
  PageLayout,
  Button,
} from "@alecrae/ui";
import { AnimatePresence, motion } from "motion/react";
import {
  staggerSlow,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
  SPRING_BOUNCY,
  SPRING_SNAPPY,
} from "../../../lib/animations";

// ─── Types ──────────────────────────────────────────────────────────────────

interface DraftedReply {
  id: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  confidence: number;
  createdAt: string;
}

interface TriagedEmail {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
}

interface TriageCategory {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emails: TriagedEmail[];
}

interface NewsletterDigest {
  id: string;
  sender: string;
  subject: string;
  bullets: string[];
  fullContent: string;
}

interface AutopilotRun {
  completedAt: string;
  nextRunAt: string;
  emailsProcessed: number;
  emailsTriaged: number;
  repliesDrafted: number;
  newslettersSummarized: number;
  followUpsFlagged: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_RUN: AutopilotRun = {
  completedAt: "2026-04-30T06:30:00Z",
  nextRunAt: "2026-05-01T06:00:00Z",
  emailsProcessed: 47,
  emailsTriaged: 38,
  repliesDrafted: 4,
  newslettersSummarized: 3,
  followUpsFlagged: 5,
};

const MOCK_DRAFTS: DraftedReply[] = [
  {
    id: "draft-1",
    recipientName: "Sarah Chen",
    recipientEmail: "sarah.chen@acmecorp.com",
    subject: "Re: Q3 Budget Review Meeting",
    preview:
      "Hi Sarah, thanks for sending over the Q3 budget figures. I have reviewed the projections and everything looks solid. I am available Thursday at 2 PM or Friday morning to discuss the variance on the marketing line item. Let me know what works best for your team.",
    confidence: 92,
    createdAt: "2026-04-30T06:28:00Z",
  },
  {
    id: "draft-2",
    recipientName: "Marcus Johnson",
    recipientEmail: "m.johnson@vendorlink.io",
    subject: "Re: Contract Renewal — Updated Terms",
    preview:
      "Marcus, I appreciate you flagging the updated pricing structure. The 12% increase on the enterprise tier is higher than we budgeted for. Could we schedule a call this week to discuss volume-based discounting? We are committed to continuing the partnership but need to find a number that works for both sides.",
    confidence: 87,
    createdAt: "2026-04-30T06:25:00Z",
  },
  {
    id: "draft-3",
    recipientName: "Elena Rodriguez",
    recipientEmail: "elena@designstudio.co",
    subject: "Re: Brand Refresh — Initial Concepts",
    preview:
      "Elena, the initial concepts look fantastic. Direction B with the geometric pattern is exactly the energy we are going for. A few notes: the secondary color palette could use more contrast for accessibility, and the icon set needs to work at 16px for our toolbar. Can you send revised mockups by Wednesday?",
    confidence: 74,
    createdAt: "2026-04-30T06:22:00Z",
  },
  {
    id: "draft-4",
    recipientName: "Tom Nakamura",
    recipientEmail: "t.nakamura@investgroup.com",
    subject: "Re: Due Diligence — Technical Architecture",
    preview:
      "Tom, attached is the technical architecture overview you requested. Our stack runs on Cloudflare Workers at the edge with Neon Postgres for persistence. Happy to walk through the scalability model and our cost projections in detail. Would next Tuesday work for a 45-minute deep dive?",
    confidence: 95,
    createdAt: "2026-04-30T06:18:00Z",
  },
];

const MOCK_TRIAGE: TriageCategory[] = [
  {
    label: "Important",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    emails: [
      { id: "t-1", from: "Sarah Chen", subject: "Q3 Budget Review Meeting — Agenda Attached", receivedAt: "2026-04-30T03:12:00Z" },
      { id: "t-2", from: "Tom Nakamura", subject: "Due Diligence — Technical Architecture Request", receivedAt: "2026-04-30T02:45:00Z" },
      { id: "t-3", from: "Lisa Park", subject: "URGENT: Production deployment approval needed", receivedAt: "2026-04-30T01:30:00Z" },
      { id: "t-4", from: "Marcus Johnson", subject: "Contract Renewal — Updated Terms (action required)", receivedAt: "2026-04-30T00:15:00Z" },
    ],
  },
  {
    label: "FYI",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    emails: [
      { id: "t-5", from: "DevOps Bot", subject: "Weekly infrastructure report — all systems green", receivedAt: "2026-04-30T05:00:00Z" },
      { id: "t-6", from: "Elena Rodriguez", subject: "Brand Refresh — Initial Concepts (3 directions)", receivedAt: "2026-04-30T04:20:00Z" },
      { id: "t-7", from: "GitHub", subject: "[alecrae/core] PR #847 merged: fix edge caching", receivedAt: "2026-04-30T03:55:00Z" },
      { id: "t-8", from: "Stripe", subject: "Your April 2026 payout has been processed", receivedAt: "2026-04-30T02:00:00Z" },
      { id: "t-9", from: "Alex Kim", subject: "FYI: Updated the team wiki with new onboarding docs", receivedAt: "2026-04-30T01:10:00Z" },
    ],
  },
  {
    label: "Newsletter",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    emails: [
      { id: "t-10", from: "Stratechery", subject: "The AI Infrastructure Shakeout", receivedAt: "2026-04-30T04:00:00Z" },
      { id: "t-11", from: "TLDR Tech", subject: "Daily Digest: Apple M5 rumors, new React features", receivedAt: "2026-04-30T05:30:00Z" },
      { id: "t-12", from: "Lenny's Newsletter", subject: "How to price your SaaS product in 2026", receivedAt: "2026-04-30T03:00:00Z" },
    ],
  },
  {
    label: "Spam",
    color: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    emails: [
      { id: "t-13", from: "noreply@promo-deals.xyz", subject: "You have been selected for an exclusive offer!!!", receivedAt: "2026-04-30T04:44:00Z" },
      { id: "t-14", from: "sales@bulkemailco.net", subject: "Grow your business 10x with our email platform", receivedAt: "2026-04-30T03:22:00Z" },
      { id: "t-15", from: "winner@lotterynotice.com", subject: "Congratulations! Claim your prize now", receivedAt: "2026-04-30T02:11:00Z" },
      { id: "t-16", from: "support@fakebank-secure.com", subject: "Your account has been compromised — verify now", receivedAt: "2026-04-30T01:05:00Z" },
      { id: "t-17", from: "deals@cheapgadgets.biz", subject: "80% OFF everything — today only!!!!", receivedAt: "2026-04-30T00:30:00Z" },
    ],
  },
];

const MOCK_NEWSLETTERS: NewsletterDigest[] = [
  {
    id: "nl-1",
    sender: "Stratechery",
    subject: "The AI Infrastructure Shakeout",
    bullets: [
      "Major cloud providers are racing to build custom AI chips, with Google TPU v6 and Amazon Trainium3 both outperforming NVIDIA H100 on inference workloads by 40%.",
      "The middleware layer between model providers and applications is consolidating — expect 3-4 winners from the current 50+ players.",
      "Enterprise AI adoption has hit an inflection point: 67% of Fortune 500 companies now have production AI workloads, up from 23% a year ago.",
    ],
    fullContent:
      "The AI infrastructure market is undergoing a dramatic transformation that will reshape the technology landscape for years to come. What started as a GPU shortage has evolved into a full-stack competition across chips, cloud, middleware, and developer tooling. In this analysis, we examine the three key dynamics driving this shakeout and what it means for builders and investors alike. The custom chip race is particularly fascinating because it represents a fundamental shift in how compute is provisioned...",
  },
  {
    id: "nl-2",
    sender: "TLDR Tech",
    subject: "Daily Digest: Apple M5 rumors, new React features",
    bullets: [
      "Apple M5 chip reportedly entering mass production with TSMC 2nm process, promising 35% better performance per watt than M4.",
      "React 20 RC released with built-in signals support and automatic code splitting — no more lazy imports needed.",
      "Cloudflare announces Workers AI GA with support for 40+ open-source models and pay-per-token pricing starting at $0.001/1K tokens.",
    ],
    fullContent:
      "Good morning! Here is your daily roundup of the most important stories in tech. Apple's next-generation M5 processor is reportedly entering mass production at TSMC, leveraging the foundry's cutting-edge 2nm process node. According to supply chain sources, the chip features a 16-core CPU with 6 performance cores and 10 efficiency cores, along with a 40-core GPU. Early benchmarks suggest a 35% improvement in performance-per-watt over the M4...",
  },
  {
    id: "nl-3",
    sender: "Lenny's Newsletter",
    subject: "How to price your SaaS product in 2026",
    bullets: [
      "Usage-based pricing is declining in favor of hybrid models: 72% of top-performing SaaS companies now combine a platform fee with usage credits.",
      "The optimal price anchor for SMB SaaS has shifted from $29/mo to $19/mo due to increased competition and AI-driven cost reduction.",
      "Free tiers that convert best offer 80% of core functionality with a clear, single upgrade trigger (usually a usage limit, not a feature gate).",
    ],
    fullContent:
      "Pricing is the most important lever you have as a SaaS founder, yet most teams spend less than a week on it before launch and never revisit it. After analyzing pricing data from 200+ SaaS companies and interviewing 50 pricing leaders, I have identified the key trends shaping SaaS pricing in 2026. The biggest shift is the move away from pure usage-based pricing toward hybrid models...",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-500";
  if (confidence >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

function confidenceTextColor(confidence: number): string {
  if (confidence >= 80) return "text-green-700";
  if (confidence >= 60) return "text-yellow-700";
  return "text-red-700";
}

// ─── Animated Counter ───────────────────────────────────────────────────────

function AnimatedCounter({
  value,
  reduced,
}: {
  value: number;
  reduced: boolean;
}): React.ReactNode {
  const [displayValue, setDisplayValue] = useState(0);

  useState(() => {
    if (reduced) {
      setDisplayValue(value);
      return;
    }
    let frame: number;
    const duration = 800;
    const start = performance.now();
    function tick(now: number): void {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  return <>{displayValue}</>;
}

// ─── Stat Icon SVGs ─────────────────────────────────────────────────────────

function TriageIcon(): React.ReactNode {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function DraftIcon(): React.ReactNode {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function NewsletterIcon(): React.ReactNode {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function FlagIcon(): React.ReactNode {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function CheckIcon(): React.ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronDownIcon({ expanded }: { expanded: boolean }): React.ReactNode {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      animate={{ rotate: expanded ? 180 : 0 }}
      transition={SPRING_SNAPPY}
    >
      <polyline points="6 9 12 15 18 9" />
    </motion.svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AutopilotPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const itemVariants = withReducedMotion(fadeInUp, reduced);

  const [enabled, setEnabled] = useState(true);
  const [drafts, setDrafts] = useState<DraftedReply[]>(MOCK_DRAFTS);
  const [expandedNewsletters, setExpandedNewsletters] = useState<
    Record<string, boolean>
  >({});

  const handleApprove = useCallback((id: string): void => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handleReject = useCallback((id: string): void => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const toggleNewsletter = useCallback((id: string): void => {
    setExpandedNewsletters((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const stats = [
    {
      label: "Emails Triaged",
      value: MOCK_RUN.emailsTriaged,
      icon: <TriageIcon />,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      label: "Replies Drafted",
      value: MOCK_RUN.repliesDrafted,
      icon: <DraftIcon />,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      label: "Newsletters Summarized",
      value: MOCK_RUN.newslettersSummarized,
      icon: <NewsletterIcon />,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      label: "Follow-ups Flagged",
      value: MOCK_RUN.followUpsFlagged,
      icon: <FlagIcon />,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
    },
  ];

  return (
    <PageLayout
      title="AI Autopilot"
      description="Your overnight AI assistant. Review what happened while you were away."
    >
      {/* ── Status Banner ────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="initial"
        animate="animate"
      >
        <Card className="mb-6">
          <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Box className="flex items-center gap-3">
              <Box
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  enabled ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <Box>
                <Text variant="body-md" className="font-semibold text-content">
                  {enabled
                    ? `Autopilot completed at ${formatTime(MOCK_RUN.completedAt)} — processed ${MOCK_RUN.emailsProcessed} emails`
                    : "Autopilot is disabled"}
                </Text>
                <Text variant="body-sm" muted>
                  {enabled
                    ? `Next scheduled run: ${formatDateTime(MOCK_RUN.nextRunAt)}`
                    : "Enable autopilot to let AI process your inbox overnight"}
                </Text>
              </Box>
            </Box>
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
            >
              <Button
                variant={enabled ? "secondary" : "primary"}
                size="sm"
                onClick={() => setEnabled((prev) => !prev)}
                aria-label={
                  enabled ? "Disable autopilot" : "Enable autopilot"
                }
              >
                {enabled ? "Disable" : "Enable"}
              </Button>
            </motion.div>
          </Box>
        </Card>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={staggerSlow}
        initial="initial"
        animate="animate"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card hoverable>
              <Box className="flex items-start justify-between mb-3">
                <Text variant="body-sm" muted>
                  {stat.label}
                </Text>
                <Box
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}
                >
                  {stat.icon}
                </Box>
              </Box>
              <Text variant="display-sm">
                <AnimatedCounter value={stat.value} reduced={reduced} />
              </Text>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Drafted Replies ──────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <Box className="flex items-center justify-between mb-4">
          <Text variant="heading-md">
            Drafted Replies
          </Text>
          <Text variant="body-sm" muted>
            {drafts.length} awaiting review
          </Text>
        </Box>

        <AnimatePresence mode="popLayout">
          {drafts.length === 0 ? (
            <motion.div
              key="empty-drafts"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Card>
                <Box className="flex flex-col items-center py-8">
                  <Box className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Box className="text-green-600">
                      <CheckIcon />
                    </Box>
                  </Box>
                  <Text variant="body-md" className="font-medium">
                    All drafts reviewed
                  </Text>
                  <Text variant="body-sm" muted>
                    You are all caught up. Nice work.
                  </Text>
                </Box>
              </Card>
            </motion.div>
          ) : (
            drafts.map((draft) => (
              <motion.div
                key={draft.id}
                layout
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={SPRING_BOUNCY}
                className="mb-3"
              >
                <Card hoverable>
                  <Box className="flex flex-col gap-3">
                    {/* Draft Header */}
                    <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Box>
                        <Box className="flex items-center gap-2 mb-0.5">
                          <Text
                            variant="body-md"
                            className="font-semibold text-content"
                          >
                            {draft.recipientName}
                          </Text>
                          <Text variant="caption" muted>
                            {draft.recipientEmail}
                          </Text>
                        </Box>
                        <Text variant="body-sm" className="text-content">
                          {draft.subject}
                        </Text>
                      </Box>
                      {/* Confidence Score */}
                      <Box className="flex items-center gap-2 flex-shrink-0">
                        <Box className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${confidenceColor(draft.confidence)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${draft.confidence}%` }}
                            transition={SPRING_BOUNCY}
                          />
                        </Box>
                        <Text
                          variant="caption"
                          className={`font-medium ${confidenceTextColor(draft.confidence)}`}
                        >
                          {draft.confidence}%
                        </Text>
                      </Box>
                    </Box>

                    {/* Draft Preview */}
                    <Box className="bg-surface-secondary rounded-lg p-3 border border-border">
                      <Text variant="body-sm" muted>
                        {draft.preview}
                      </Text>
                    </Box>

                    {/* Actions */}
                    <Box className="flex items-center justify-between">
                      <Text variant="caption" muted>
                        Drafted at {formatTime(draft.createdAt)}
                      </Text>
                      <Box className="flex items-center gap-2">
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          transition={SPRING_SNAPPY}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(draft.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            aria-label={`Reject draft reply to ${draft.recipientName}`}
                          >
                            Reject
                          </Button>
                        </motion.div>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          transition={SPRING_SNAPPY}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label={`Edit draft reply to ${draft.recipientName}`}
                          >
                            Edit
                          </Button>
                        </motion.div>
                        <motion.div
                          whileTap={{ scale: 0.95 }}
                          transition={SPRING_SNAPPY}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApprove(draft.id)}
                            className="bg-green-600 hover:bg-green-700"
                            aria-label={`Approve and send reply to ${draft.recipientName}`}
                          >
                            Approve &amp; Send
                          </Button>
                        </motion.div>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Triage Summary ───────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <Text variant="heading-md" className="mb-4">
          Triage Summary
        </Text>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_TRIAGE.map((category) => (
            <Card key={category.label} padding="none">
              <CardHeader className="px-4 pt-4 pb-3">
                <Box className="flex items-center justify-between">
                  <Box className="flex items-center gap-2">
                    <Box
                      as="span"
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${category.bgColor} ${category.color} border ${category.borderColor}`}
                    >
                      {category.label}
                    </Box>
                  </Box>
                  <Text variant="caption" muted>
                    {category.emails.length} emails
                  </Text>
                </Box>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                <Box className="space-y-2">
                  {category.emails.map((email) => (
                    <Box
                      key={email.id}
                      className="flex items-start gap-2"
                    >
                      <Box
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          category.label === "Important"
                            ? "bg-red-400"
                            : category.label === "FYI"
                              ? "bg-blue-400"
                              : category.label === "Newsletter"
                                ? "bg-purple-400"
                                : "bg-gray-300"
                        }`}
                      />
                      <Box className="min-w-0 flex-1">
                        <Text
                          variant="body-sm"
                          className="truncate text-content"
                        >
                          {email.subject}
                        </Text>
                        <Text variant="caption" muted>
                          {email.from}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </motion.div>

      {/* ── Newsletter Digests ───────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="initial"
        animate="animate"
        className="mb-8"
      >
        <Text variant="heading-md" className="mb-4">
          Newsletter Digests
        </Text>

        <Box className="space-y-4">
          {MOCK_NEWSLETTERS.map((newsletter) => {
            const isExpanded = expandedNewsletters[newsletter.id] ?? false;
            return (
              <Card key={newsletter.id}>
                <Box className="flex flex-col gap-3">
                  {/* Newsletter Header */}
                  <Box className="flex items-center justify-between">
                    <Box>
                      <Text
                        variant="body-md"
                        className="font-semibold text-content"
                      >
                        {newsletter.sender}
                      </Text>
                      <Text variant="body-sm" muted>
                        {newsletter.subject}
                      </Text>
                    </Box>
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      transition={SPRING_SNAPPY}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNewsletter(newsletter.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${newsletter.sender} digest`}
                      >
                        <ChevronDownIcon expanded={isExpanded} />
                        <Text as="span" variant="caption">
                          {isExpanded ? "Less" : "More"}
                        </Text>
                      </Button>
                    </motion.div>
                  </Box>

                  {/* Bullet Summary */}
                  <Box
                    as="ul"
                    className="space-y-2 pl-0"
                  >
                    {newsletter.bullets.map((bullet, idx) => (
                      <Box
                        as="li"
                        key={idx}
                        className="flex items-start gap-2"
                      >
                        <Box className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                        <Text variant="body-sm" className="text-content">
                          {bullet}
                        </Text>
                      </Box>
                    ))}
                  </Box>

                  {/* Expanded Full Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          transition: SPRING_BOUNCY,
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          transition: { duration: 0.2 },
                        }}
                        className="overflow-hidden"
                      >
                        <Box className="bg-surface-secondary rounded-lg p-4 border border-border">
                          <Text variant="caption" className="font-medium mb-2 block">
                            Full Content
                          </Text>
                          <Text variant="body-sm" muted>
                            {newsletter.fullContent}
                          </Text>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Card>
            );
          })}
        </Box>
      </motion.div>
    </PageLayout>
  );
}

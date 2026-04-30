"use client";

/**
 * ContactIntelligence — Rich sender intelligence panel.
 *
 * Click any sender's name to see a slide-out panel with:
 *   - Avatar + name + email header
 *   - Relationship stats (emails exchanged, avg response times, last contact)
 *   - Communication timeline (6-month bar chart)
 *   - Recent interactions (last 5 emails with direction)
 *   - AI insights (behavioral patterns, pending actions)
 *   - Tags and notes
 *
 * Like LinkedIn insights built into email. Self-contained with mock data.
 * Uses AlecRae LIGHT theme tokens (bg-surface, text-content, border-border).
 *
 * Mock data example:
 *   <ContactIntelligence
 *     contact={{ name: "Sarah Chen", email: "sarah@acmecorp.com" }}
 *     onClose={() => {}}
 *   />
 */

import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card, CardContent, Text, Box, Button } from "@alecrae/ui";
import {
  drawerEnterRight,
  staggerChildren,
  listItemEnter,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
  SPRING_BOUNCY,
} from "../lib/animations";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContactIntelligenceProps {
  contact: {
    name: string;
    email: string;
    avatar?: string;
  };
  onClose: () => void;
  className?: string;
}

interface RelationshipStat {
  label: string;
  value: string;
}

interface MonthActivity {
  month: string;
  count: number;
}

interface RecentInteraction {
  subject: string;
  date: string;
  direction: "sent" | "received";
  preview: string;
}

interface AIInsight {
  icon: "clock" | "pencil" | "sun" | "alert" | "chart" | "star";
  text: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STATS: RelationshipStat[] = [
  { label: "Emails", value: "142" },
  { label: "Their reply", value: "3h 20m" },
  { label: "Your reply", value: "1h 45m" },
  { label: "Last contact", value: "2 days ago" },
];

const MOCK_TIMELINE: MonthActivity[] = [
  { month: "Nov", count: 18 },
  { month: "Dec", count: 12 },
  { month: "Jan", count: 24 },
  { month: "Feb", count: 31 },
  { month: "Mar", count: 28 },
  { month: "Apr", count: 22 },
];

const MOCK_RECENT: RecentInteraction[] = [
  {
    subject: "Re: Q3 Partnership Proposal - Final Terms",
    date: "Apr 28",
    direction: "received",
    preview: "I've reviewed the updated terms and everything looks good on our end...",
  },
  {
    subject: "Q3 Revenue Projections - Updated Numbers",
    date: "Apr 25",
    direction: "sent",
    preview: "Attached are the revised projections incorporating the new pricing...",
  },
  {
    subject: "Re: Team Offsite Planning",
    date: "Apr 22",
    direction: "received",
    preview: "The venue looks perfect. I'll confirm catering by Thursday...",
  },
  {
    subject: "Integration Timeline Update",
    date: "Apr 18",
    direction: "sent",
    preview: "Engineering confirmed we can move the integration date up by two weeks...",
  },
  {
    subject: "Re: Board Deck Review",
    date: "Apr 15",
    direction: "received",
    preview: "Minor edits on slides 12-14. The rest is solid. Nice work on the...",
  },
];

const MOCK_INSIGHTS: AIInsight[] = [
  { icon: "clock", text: "Typically responds within 3 hours on weekdays" },
  { icon: "pencil", text: "Prefers concise emails (avg 45 words)" },
  { icon: "sun", text: "Most active 9am–11am EST" },
  { icon: "alert", text: "You owe them a reply from Apr 25" },
  { icon: "chart", text: "Communication frequency up 18% this quarter" },
];

const MOCK_TAGS: string[] = ["Client", "Engineering", "Priority"];

const MOCK_NOTES =
  "VP of Engineering at AcmeCorp. Key stakeholder for the Q3 partnership. Prefers direct communication, dislikes long email threads. Schedule calls for complex topics.";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Deterministic hash-to-color from a name string for avatar background. */
function nameToColor(name: string): string {
  const COLORS = [
    "bg-violet-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length] ?? "bg-violet-500";
}

/** Extract initials from a full name. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${(parts[0] ?? "")[0] ?? ""}${(parts[parts.length - 1] ?? "")[0] ?? ""}`.toUpperCase();
  }
  return (name[0] ?? "?").toUpperCase();
}

// ─── Insight Icon ───────────────────────────────────────────────────────────

function InsightIcon({ type }: { type: AIInsight["icon"] }): ReactElement {
  const iconMap: Record<AIInsight["icon"], ReactNode> = {
    clock: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    pencil: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    ),
    sun: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
    alert: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    chart: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    star: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  };

  return (
    <Box className="text-violet-500 flex-shrink-0">
      {iconMap[type]}
    </Box>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ContactIntelligence({
  contact,
  onClose,
  className,
}: ContactIntelligenceProps): ReactElement {
  const reduced = useAlecRaeReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  const avatarColor = useMemo(() => nameToColor(contact.name), [contact.name]);
  const avatarInitials = useMemo(() => initials(contact.name), [contact.name]);
  const maxTimelineCount = useMemo(
    () => Math.max(...MOCK_TIMELINE.map((m) => m.count), 1),
    [],
  );

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus panel on mount
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, []);

  const drawerVariants = withReducedMotion(drawerEnterRight, reduced);
  const contentStagger = staggerChildren(0.04, 0.08);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="ci-backdrop"
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        key="ci-panel"
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md overflow-y-auto bg-surface border-l border-border shadow-elevated ${className ?? ""}`}
        variants={drawerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-label={`Contact intelligence for ${contact.name}`}
        tabIndex={-1}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <Box className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-border px-6 py-4">
          <Box className="flex items-center justify-between">
            <Box className="flex items-center gap-3">
              {/* Avatar */}
              {contact.avatar ? (
                <img
                  src={contact.avatar}
                  alt={`${contact.name} avatar`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <Box
                  className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center`}
                  aria-hidden="true"
                >
                  <Text variant="body-sm" className="text-white font-semibold text-sm">
                    {avatarInitials}
                  </Text>
                </Box>
              )}
              <Box>
                <Text variant="body-md" className="font-semibold text-content">
                  {contact.name}
                </Text>
                <Text variant="body-sm" className="text-content-secondary text-xs">
                  {contact.email}
                </Text>
              </Box>
            </Box>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close contact intelligence panel"
            >
              Close
            </Button>
          </Box>

          {/* View All Emails link */}
          <Box className="mt-2">
            <Button variant="ghost" size="sm" aria-label={`View all emails with ${contact.name}`}>
              <Box className="flex items-center gap-1 text-content-brand text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                View All Emails
              </Box>
            </Button>
          </Box>
        </Box>

        {/* ── Body ────────────────────────────────────────────────── */}
        <motion.div
          className="px-6 py-6 space-y-6"
          variants={contentStagger}
          initial="initial"
          animate="animate"
        >
          {/* ── 1. Relationship Stats ────────────────────────────── */}
          <motion.div variants={listItemEnter}>
            <Box
              className="grid grid-cols-4 gap-3"
              role="group"
              aria-label="Relationship statistics"
            >
              {MOCK_STATS.map((stat) => (
                <Box
                  key={stat.label}
                  className="text-center p-3 rounded-lg bg-surface-secondary border border-border"
                >
                  <Text variant="body-md" className="font-bold text-content block">
                    {stat.value}
                  </Text>
                  <Text variant="body-sm" className="text-content-tertiary text-xs">
                    {stat.label}
                  </Text>
                </Box>
              ))}
            </Box>
          </motion.div>

          {/* ── 2. Communication Timeline ────────────────────────── */}
          <motion.div variants={listItemEnter}>
            <Card className="bg-surface border-border" padding="sm">
              <Box className="flex items-center gap-2 mb-3">
                <Box className="w-2 h-2 rounded-full bg-violet-500" role="presentation" />
                <Text
                  variant="body-sm"
                  className="font-semibold text-content-secondary uppercase tracking-wider text-xs"
                >
                  Communication Timeline
                </Text>
              </Box>
              <Box
                className="flex items-end gap-2 h-20"
                role="img"
                aria-label="Email frequency over last 6 months"
              >
                {MOCK_TIMELINE.map((month) => {
                  const heightPercent = (month.count / maxTimelineCount) * 100;
                  return (
                    <Box
                      key={month.month}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <motion.div
                        className="w-full rounded-t-sm bg-violet-500/80"
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={SPRING_BOUNCY}
                        title={`${month.month}: ${month.count} emails`}
                      />
                      <Text variant="body-sm" className="text-content-tertiary text-[10px]">
                        {month.month}
                      </Text>
                    </Box>
                  );
                })}
              </Box>
            </Card>
          </motion.div>

          {/* ── 3. Recent Interactions ────────────────────────────── */}
          <motion.div variants={listItemEnter}>
            <Box className="space-y-2">
              <Box className="flex items-center gap-2">
                <Box className="w-2 h-2 rounded-full bg-blue-500" role="presentation" />
                <Text
                  variant="body-sm"
                  className="font-semibold text-content-secondary uppercase tracking-wider text-xs"
                >
                  Recent Interactions
                </Text>
              </Box>
              <Box
                className="space-y-1"
                role="list"
                aria-label="Recent email interactions"
              >
                {MOCK_RECENT.map((email, idx) => (
                  <Card
                    key={idx}
                    className="bg-surface border-border"
                    padding="sm"
                    hoverable
                  >
                    <Box className="flex items-start gap-2" role="listitem">
                      {/* Direction arrow */}
                      <Box
                        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                          email.direction === "sent"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                        aria-label={email.direction === "sent" ? "Sent by you" : "Received"}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          {email.direction === "sent" ? (
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          ) : (
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          )}
                        </svg>
                      </Box>
                      <Box className="min-w-0 flex-1">
                        <Box className="flex items-center justify-between gap-2">
                          <Text
                            variant="body-sm"
                            className="font-medium text-content truncate text-xs"
                          >
                            {email.subject}
                          </Text>
                          <Text
                            variant="body-sm"
                            className="text-content-tertiary text-xs flex-shrink-0"
                          >
                            {email.date}
                          </Text>
                        </Box>
                        <Text
                          variant="body-sm"
                          className="text-content-secondary text-xs truncate mt-0.5"
                        >
                          {email.preview}
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* ── 4. AI Insights ────────────────────────────────────── */}
          <motion.div variants={listItemEnter}>
            <Box className="space-y-2">
              <Box className="flex items-center gap-2">
                <Box className="w-2 h-2 rounded-full bg-violet-500" role="presentation" />
                <Text
                  variant="body-sm"
                  className="font-semibold text-content-secondary uppercase tracking-wider text-xs"
                >
                  AI Insights
                </Text>
              </Box>
              <Box
                className="space-y-2"
                role="list"
                aria-label="AI-generated insights about this contact"
              >
                {MOCK_INSIGHTS.map((insight, idx) => (
                  <Card
                    key={idx}
                    className={`bg-surface-secondary border-border ${
                      insight.icon === "alert"
                        ? "border-l-4 border-l-amber-400"
                        : "border-l-4 border-l-violet-400"
                    }`}
                    padding="sm"
                  >
                    <Box className="flex items-center gap-3" role="listitem">
                      <InsightIcon type={insight.icon} />
                      <Text variant="body-sm" className="text-content text-xs">
                        {insight.text}
                      </Text>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* ── 5. Tags ──────────────────────────────────────────── */}
          <motion.div variants={listItemEnter}>
            <Box className="space-y-2">
              <Box className="flex items-center gap-2">
                <Box className="w-2 h-2 rounded-full bg-cyan-500" role="presentation" />
                <Text
                  variant="body-sm"
                  className="font-semibold text-content-secondary uppercase tracking-wider text-xs"
                >
                  Tags
                </Text>
              </Box>
              <Box className="flex flex-wrap gap-2" role="list" aria-label="Contact tags">
                {MOCK_TAGS.map((tag) => (
                  <Box
                    key={tag}
                    className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200"
                    role="listitem"
                  >
                    <Text variant="body-sm" className="text-xs font-medium">
                      {tag}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>

          {/* ── 6. Notes ─────────────────────────────────────────── */}
          <motion.div variants={listItemEnter}>
            <Box className="space-y-2">
              <Box className="flex items-center gap-2">
                <Box className="w-2 h-2 rounded-full bg-amber-500" role="presentation" />
                <Text
                  variant="body-sm"
                  className="font-semibold text-content-secondary uppercase tracking-wider text-xs"
                >
                  Notes
                </Text>
              </Box>
              <Card className="bg-surface-secondary border-border" padding="sm">
                <Text variant="body-sm" className="text-content-secondary text-xs leading-relaxed">
                  {MOCK_NOTES}
                </Text>
              </Card>
            </Box>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

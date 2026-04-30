"use client";

import { useState } from "react";
import {
  Box,
  Text,
  Card,
  CardContent,
  CardHeader,
  Button,
  PageLayout,
} from "@alecrae/ui";
import { motion, AnimatePresence } from "motion/react";
import {
  staggerSlow,
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
} from "../../../lib/animations";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Attendee {
  name: string;
  email: string;
  initials: string;
  color: string;
}

interface ThreadHistory {
  id: string;
  subject: string;
  date: string;
  participants: string[];
  excerpt: string;
  relevance: number;
}

interface OpenItem {
  id: string;
  description: string;
  owner: string;
  dueDate: string;
  status: "done" | "due-soon" | "overdue";
}

interface TalkingPoint {
  id: string;
  text: string;
}

interface MeetingBrief {
  lastMeetingSummary: string;
  keyContext: string[];
  threads: ThreadHistory[];
  openItems: OpenItem[];
  talkingPoints: TalkingPoint[];
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendees: Attendee[];
  brief: MeetingBrief | null;
  preparing: boolean;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Q3 Strategy Review",
    date: "Today",
    time: "2:00 PM",
    duration: "45 min",
    attendees: [
      { name: "Sarah Chen", email: "sarah@example.com", initials: "SC", color: "bg-purple-100 text-purple-700" },
      { name: "Alex Rivera", email: "alex@example.com", initials: "AR", color: "bg-green-100 text-green-700" },
      { name: "Jordan Lee", email: "jordan@example.com", initials: "JL", color: "bg-orange-100 text-orange-700" },
    ],
    brief: {
      lastMeetingSummary: "Last meeting with this group: March 15 — discussed Q3 roadmap and preliminary budget allocation.",
      keyContext: [
        "Sarah mentioned she'd send updated projections by April 1 — not yet received.",
        "Alex proposed expanding into European market; group was split on timing.",
        "Open decision: whether to allocate 30% of Q3 budget to new market entry.",
        "Jordan flagged a potential partnership with NordTech for distribution.",
      ],
      threads: [
        {
          id: "t1",
          subject: "Re: Q3 Budget Allocation Draft",
          date: "Apr 22",
          participants: ["Sarah Chen", "You"],
          excerpt: "I'll have the updated projections ready by end of week. The initial numbers look promising for the EU expansion if we can keep CAC under $45.",
          relevance: 95,
        },
        {
          id: "t2",
          subject: "European Market Research Summary",
          date: "Apr 18",
          participants: ["Alex Rivera", "Sarah Chen", "You"],
          excerpt: "Attached the competitive landscape analysis. Key finding: no dominant player in the DACH region for our category. Window is 6-8 months.",
          relevance: 88,
        },
        {
          id: "t3",
          subject: "Re: NordTech Partnership Proposal",
          date: "Apr 15",
          participants: ["Jordan Lee", "You"],
          excerpt: "NordTech is open to a pilot program. They want to discuss revenue share terms. I think 70/30 in our favor is achievable.",
          relevance: 75,
        },
        {
          id: "t4",
          subject: "Q2 Retrospective Notes",
          date: "Apr 10",
          participants: ["Sarah Chen", "Alex Rivera", "Jordan Lee", "You"],
          excerpt: "Consensus: Q2 exceeded targets by 12% but customer retention dipped. Need to address churn before scaling.",
          relevance: 60,
        },
      ],
      openItems: [
        {
          id: "oi1",
          description: "Send updated Q3 projections with EU expansion scenarios",
          owner: "Sarah Chen",
          dueDate: "Apr 1",
          status: "overdue",
        },
        {
          id: "oi2",
          description: "Finalize NordTech partnership term sheet",
          owner: "Jordan Lee",
          dueDate: "May 2",
          status: "due-soon",
        },
        {
          id: "oi3",
          description: "Complete competitive analysis for DACH region",
          owner: "Alex Rivera",
          dueDate: "Apr 18",
          status: "done",
        },
        {
          id: "oi4",
          description: "Draft Q3 OKRs for leadership review",
          owner: "You",
          dueDate: "May 5",
          status: "due-soon",
        },
      ],
      talkingPoints: [
        { id: "tp1", text: "Follow up on Sarah's Q3 projections — now 4 weeks overdue" },
        { id: "tp2", text: "Discuss the European market decision: timing, budget, and go/no-go criteria" },
        { id: "tp3", text: "Review NordTech partnership terms — Jordan has a draft ready" },
        { id: "tp4", text: "Address Q2 churn increase before committing to expansion spend" },
      ],
    },
    preparing: false,
  },
  {
    id: "m2",
    title: "Design Sprint Kickoff",
    date: "Tomorrow",
    time: "10:00 AM",
    duration: "60 min",
    attendees: [
      { name: "Maya Patel", email: "maya@example.com", initials: "MP", color: "bg-pink-100 text-pink-700" },
      { name: "Chris Wong", email: "chris@example.com", initials: "CW", color: "bg-blue-100 text-blue-700" },
    ],
    brief: null,
    preparing: false,
  },
  {
    id: "m3",
    title: "1:1 with Manager",
    date: "Tomorrow",
    time: "3:00 PM",
    duration: "30 min",
    attendees: [
      { name: "Rachel Torres", email: "rachel@example.com", initials: "RT", color: "bg-teal-100 text-teal-700" },
    ],
    brief: null,
    preparing: false,
  },
  {
    id: "m4",
    title: "Product Roadmap Sync",
    date: "Tomorrow",
    time: "4:30 PM",
    duration: "30 min",
    attendees: [
      { name: "Sarah Chen", email: "sarah@example.com", initials: "SC", color: "bg-purple-100 text-purple-700" },
      { name: "Maya Patel", email: "maya@example.com", initials: "MP", color: "bg-pink-100 text-pink-700" },
      { name: "Liam Brooks", email: "liam@example.com", initials: "LB", color: "bg-amber-100 text-amber-700" },
    ],
    brief: null,
    preparing: false,
  },
];

// ─── Status Styles ──────────────────────────────────────────────────────────

const statusStyles: Record<OpenItem["status"], { dot: string; text: string; label: string }> = {
  done: { dot: "bg-green-500", text: "text-green-600", label: "Done" },
  "due-soon": { dot: "bg-amber-500", text: "text-amber-600", label: "Due soon" },
  overdue: { dot: "bg-red-500", text: "text-red-600", label: "Overdue" },
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

function AttendeeAvatar({ attendee }: { attendee: Attendee }): React.ReactNode {
  return (
    <Box
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${attendee.color}`}
      title={attendee.name}
    >
      {attendee.initials}
    </Box>
  );
}

function AttendeeAvatarGroup({ attendees }: { attendees: Attendee[] }): React.ReactNode {
  return (
    <Box className="flex -space-x-2">
      {attendees.map((a) => (
        <Box key={a.email} className="ring-2 ring-surface rounded-full">
          <AttendeeAvatar attendee={a} />
        </Box>
      ))}
    </Box>
  );
}

function MeetingListItem({
  meeting,
  isExpanded,
  onToggle,
  onPrepare,
  itemVariants,
}: {
  meeting: Meeting;
  isExpanded: boolean;
  onToggle: () => void;
  onPrepare: () => void;
  itemVariants: ReturnType<typeof withReducedMotion>;
}): React.ReactNode {
  return (
    <motion.div variants={itemVariants}>
      <Card padding="none" className="overflow-hidden">
        <Box
          as="button"
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-secondary/50 transition-colors"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <Box className="flex-shrink-0">
            <Box className="w-12 h-12 rounded-lg bg-brand-100 flex flex-col items-center justify-center">
              <Text variant="caption" className="text-brand-700 font-bold leading-none">
                {meeting.time.split(":")[0]}
              </Text>
              <Text variant="caption" className="text-brand-600 text-[10px] leading-none mt-0.5">
                {meeting.time.includes("PM") ? "PM" : "AM"}
              </Text>
            </Box>
          </Box>

          <Box className="flex-1 min-w-0">
            <Box className="flex items-center gap-2">
              <Text variant="body-md" className="font-semibold text-content truncate">
                {meeting.title}
              </Text>
              {meeting.brief && (
                <Box className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500" title="Brief prepared" />
              )}
            </Box>
            <Text variant="body-sm" className="text-content-secondary">
              {meeting.date} at {meeting.time} &middot; {meeting.duration}
            </Text>
          </Box>

          <AttendeeAvatarGroup attendees={meeting.attendees} />

          <Box className="flex-shrink-0 ml-2">
            {meeting.brief ? (
              <Button variant="ghost" size="sm">
                {isExpanded ? "Hide Brief" : "View Brief"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrepare();
                }}
                loading={meeting.preparing}
              >
                {meeting.preparing ? "Preparing..." : "Prepare Brief"}
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </motion.div>
  );
}

function BriefSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <Box className="mb-6">
      <Text variant="body-sm" className="font-semibold text-content-secondary uppercase tracking-wider mb-3">
        {title}
      </Text>
      {children}
    </Box>
  );
}

function ThreadItem({ thread }: { thread: ThreadHistory }): React.ReactNode {
  return (
    <Box className="flex gap-3 p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors border border-border/50">
      <Box className="flex-shrink-0 mt-1">
        <Box className="w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
      </Box>
      <Box className="flex-1 min-w-0">
        <Box className="flex items-center justify-between gap-2 mb-1">
          <Text variant="body-sm" className="font-medium text-content truncate">
            {thread.subject}
          </Text>
          <Text variant="caption" className="text-content-tertiary flex-shrink-0">
            {thread.date}
          </Text>
        </Box>
        <Text variant="caption" className="text-content-secondary mb-1">
          {thread.participants.join(", ")}
        </Text>
        <Text variant="body-sm" className="text-content-secondary line-clamp-2">
          &ldquo;{thread.excerpt}&rdquo;
        </Text>
      </Box>
    </Box>
  );
}

function OpenItemRow({ item }: { item: OpenItem }): React.ReactNode {
  const style = statusStyles[item.status];
  return (
    <Box className="flex items-start gap-3 py-2">
      <Box className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
      <Box className="flex-1 min-w-0">
        <Text variant="body-sm" className="text-content">
          {item.description}
        </Text>
        <Box className="flex items-center gap-2 mt-0.5">
          <Text variant="caption" className="text-content-tertiary">
            {item.owner}
          </Text>
          <Text variant="caption" className="text-content-tertiary">&middot;</Text>
          <Text variant="caption" className={style.text}>
            {item.status === "done" ? "Completed" : `Due ${item.dueDate}`}
          </Text>
          <Text variant="caption" className={`font-medium ${style.text}`}>
            ({style.label})
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function QuickActions({ onCopy, onEmail }: { onCopy: () => void; onEmail: () => void }): React.ReactNode {
  return (
    <Box className="flex items-center gap-2 pt-4 border-t border-border">
      <Button variant="secondary" size="sm" onClick={onCopy}>
        Copy to clipboard
      </Button>
      <Button variant="secondary" size="sm" onClick={onEmail}>
        Email to attendees
      </Button>
      <Button variant="ghost" size="sm">
        Add to calendar notes
      </Button>
    </Box>
  );
}

// ─── Meeting Brief Panel ────────────────────────────────────────────────────

function MeetingBriefPanel({
  meeting,
  reduced,
}: {
  meeting: Meeting;
  reduced: boolean;
}): React.ReactNode {
  const brief = meeting.brief;
  if (!brief) return null;

  const handleCopy = (): void => {
    const text = [
      `Meeting Brief: ${meeting.title}`,
      `${meeting.date} at ${meeting.time} (${meeting.duration})`,
      `Attendees: ${meeting.attendees.map((a) => a.name).join(", ")}`,
      "",
      "Key Context:",
      ...brief.keyContext.map((c) => `- ${c}`),
      "",
      "Open Items:",
      ...brief.openItems.map((i) => `- [${i.status.toUpperCase()}] ${i.description} (${i.owner})`),
      "",
      "Talking Points:",
      ...brief.talkingPoints.map((tp) => `- ${tp.text}`),
    ].join("\n");
    void navigator.clipboard.writeText(text);
  };

  const handleEmail = (): void => {
    const subject = encodeURIComponent(`Meeting Brief: ${meeting.title}`);
    const body = encodeURIComponent(
      [
        `Meeting: ${meeting.title}`,
        `When: ${meeting.date} at ${meeting.time}`,
        "",
        "Talking Points:",
        ...brief.talkingPoints.map((tp) => `- ${tp.text}`),
      ].join("\n"),
    );
    const to = meeting.attendees.map((a) => a.email).join(",");
    window.open(`mailto:${to}?subject=${subject}&body=${body}`);
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <Card padding="none" className="mx-5 mb-5 mt-1 border-brand-200">
        <CardHeader className="px-5 pt-5">
          <Box className="flex items-center justify-between">
            <Box>
              <Text variant="heading-md" className="text-content">
                {meeting.title}
              </Text>
              <Text variant="body-sm" className="text-content-secondary mt-0.5">
                {meeting.date} at {meeting.time} &middot; {meeting.duration}
              </Text>
            </Box>
            <Box className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
              <Box className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <Text variant="caption" className="text-green-700 font-medium">
                Brief ready
              </Text>
            </Box>
          </Box>
          <Box className="flex items-center gap-3 mt-3">
            {meeting.attendees.map((a) => (
              <Box key={a.email} className="flex items-center gap-2">
                <AttendeeAvatar attendee={a} />
                <Box>
                  <Text variant="caption" className="font-medium text-content">{a.name}</Text>
                  <Text variant="caption" className="text-content-tertiary">{a.email}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </CardHeader>

        <CardContent className="px-5">
          <BriefSection title="Key Context">
            <Box className="bg-surface-secondary rounded-lg p-4 space-y-2">
              <Text variant="body-sm" className="text-content-secondary italic mb-3">
                {brief.lastMeetingSummary}
              </Text>
              {brief.keyContext.map((ctx, i) => (
                <Box key={i} className="flex items-start gap-2">
                  <Box className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
                  <Text variant="body-sm" className="text-content">
                    {ctx}
                  </Text>
                </Box>
              ))}
            </Box>
          </BriefSection>

          <BriefSection title="Thread History">
            <Box className="space-y-2">
              {brief.threads.map((thread) => (
                <ThreadItem key={thread.id} thread={thread} />
              ))}
            </Box>
          </BriefSection>

          <BriefSection title="Open Items">
            <Box className="space-y-1">
              {brief.openItems.map((item) => (
                <OpenItemRow key={item.id} item={item} />
              ))}
            </Box>
          </BriefSection>

          <BriefSection title="Suggested Talking Points">
            <Box className="space-y-2">
              {brief.talkingPoints.map((tp, i) => (
                <Box key={tp.id} className="flex items-start gap-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
                  <Box className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                    <Text variant="caption" className="text-brand-700 font-bold">
                      {i + 1}
                    </Text>
                  </Box>
                  <Text variant="body-sm" className="text-content font-medium">
                    {tp.text}
                  </Text>
                </Box>
              ))}
            </Box>
          </BriefSection>

          <QuickActions onCopy={handleCopy} onEmail={handleEmail} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MeetingPrepPage(): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [expandedId, setExpandedId] = useState<string>("m1");

  const itemVariants = withReducedMotion(fadeInUp, reduced);

  const handleToggle = (id: string): void => {
    setExpandedId((prev) => (prev === id ? "" : id));
  };

  const handlePrepare = (id: string): void => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, preparing: true } : m)),
    );

    // Simulate AI preparation delay
    setTimeout(() => {
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          return {
            ...m,
            preparing: false,
            brief: {
              lastMeetingSummary: `AI-generated summary of previous interactions with ${m.attendees.map((a) => a.name).join(", ")}.`,
              keyContext: [
                "No prior meetings found with this exact group.",
                `${m.attendees.length} email threads found across attendees in the past 30 days.`,
                "No outstanding commitments detected.",
              ],
              threads: [
                {
                  id: "gen-t1",
                  subject: `Re: ${m.title} — Prep`,
                  date: "Apr 28",
                  participants: [m.attendees[0]?.name ?? "Attendee", "You"],
                  excerpt: "Looking forward to the meeting. I'll bring the latest mockups and user feedback.",
                  relevance: 80,
                },
              ],
              openItems: [
                {
                  id: "gen-oi1",
                  description: `Prepare agenda for ${m.title}`,
                  owner: "You",
                  dueDate: m.date === "Today" ? "Today" : "Tomorrow",
                  status: "due-soon" as const,
                },
              ],
              talkingPoints: [
                { id: "gen-tp1", text: `Align on goals and expected outcomes for ${m.title}` },
                { id: "gen-tp2", text: "Review any open items from previous correspondence" },
                { id: "gen-tp3", text: "Discuss next steps and assign action items" },
              ],
            },
          };
        }),
      );
      setExpandedId(id);
    }, 2000);
  };

  const todayMeetings = meetings.filter((m) => m.date === "Today");
  const tomorrowMeetings = meetings.filter((m) => m.date === "Tomorrow");

  return (
    <PageLayout
      title="Meeting Prep"
      description="AI-powered briefings for your upcoming meetings."
    >
      <motion.div
        variants={staggerSlow}
        initial="initial"
        animate="animate"
        className="max-w-4xl space-y-8"
      >
        {/* Today Section */}
        {todayMeetings.length > 0 && (
          <Box>
            <motion.div variants={itemVariants}>
              <Text variant="body-sm" className="font-semibold text-content-secondary uppercase tracking-wider mb-3">
                Today
              </Text>
            </motion.div>
            <Box className="space-y-3">
              {todayMeetings.map((meeting) => (
                <Box key={meeting.id}>
                  <MeetingListItem
                    meeting={meeting}
                    isExpanded={expandedId === meeting.id}
                    onToggle={() => handleToggle(meeting.id)}
                    onPrepare={() => handlePrepare(meeting.id)}
                    itemVariants={itemVariants}
                  />
                  <AnimatePresence>
                    {expandedId === meeting.id && meeting.brief && (
                      <MeetingBriefPanel meeting={meeting} reduced={reduced} />
                    )}
                  </AnimatePresence>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Tomorrow Section */}
        {tomorrowMeetings.length > 0 && (
          <Box>
            <motion.div variants={itemVariants}>
              <Text variant="body-sm" className="font-semibold text-content-secondary uppercase tracking-wider mb-3">
                Tomorrow
              </Text>
            </motion.div>
            <Box className="space-y-3">
              {tomorrowMeetings.map((meeting) => (
                <Box key={meeting.id}>
                  <MeetingListItem
                    meeting={meeting}
                    isExpanded={expandedId === meeting.id}
                    onToggle={() => handleToggle(meeting.id)}
                    onPrepare={() => handlePrepare(meeting.id)}
                    itemVariants={itemVariants}
                  />
                  <AnimatePresence>
                    {expandedId === meeting.id && meeting.brief && (
                      <MeetingBriefPanel meeting={meeting} reduced={reduced} />
                    )}
                  </AnimatePresence>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Empty State */}
        {meetings.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center justify-center py-16"
          >
            <Text variant="heading-md" className="text-content-secondary mb-2">
              No upcoming meetings
            </Text>
            <Text variant="body-sm" className="text-content-tertiary">
              Connect your calendar to see meetings and generate AI briefings.
            </Text>
          </motion.div>
        )}
      </motion.div>
    </PageLayout>
  );
}

"use client";

/**
 * InteractiveEmailCard — Rich email preview cards with structured data.
 *
 * Detects email TYPE (flight, calendar, receipt, package, newsletter, default)
 * and renders a visually rich card instead of plain text previews.
 *
 * Each card type has a colored left border (4px) matching its accent:
 *   - flight: cyan
 *   - calendar: blue
 *   - receipt: green
 *   - package: amber
 *   - newsletter: purple
 *   - default: gray
 *
 * Compact enough to fit inline in an email list. Rich but not overwhelming.
 * Self-contained with mock data examples. No imports from api.ts.
 *
 * Uses AlecRae LIGHT theme tokens (bg-surface, text-content, border-border).
 *
 * Mock data examples:
 *   <InteractiveEmailCard type="flight" data={MOCK_FLIGHT} />
 *   <InteractiveEmailCard type="calendar" data={MOCK_CALENDAR} />
 *   <InteractiveEmailCard type="receipt" data={MOCK_RECEIPT} />
 *   <InteractiveEmailCard type="package" data={MOCK_PACKAGE} />
 *   <InteractiveEmailCard type="newsletter" data={MOCK_NEWSLETTER} />
 *   <InteractiveEmailCard type="default" data={MOCK_DEFAULT} />
 */

import type { ReactElement } from "react";
import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Card, Text, Box, Button } from "@alecrae/ui";
import {
  fadeInUp,
  useAlecRaeReducedMotion,
  withReducedMotion,
} from "../lib/animations";

// ─── Types ──────────────────────────────────────────────────────────────────

export type EmailCardType =
  | "flight"
  | "calendar"
  | "receipt"
  | "package"
  | "newsletter"
  | "default";

export interface InteractiveEmailCardProps {
  type: EmailCardType;
  data: Record<string, unknown>;
  className?: string;
}

// ─── Accent configs ─────────────────────────────────────────────────────────

interface AccentConfig {
  border: string;
  iconBg: string;
  iconColor: string;
  label: string;
}

const ACCENT_MAP: Record<EmailCardType, AccentConfig> = {
  flight: {
    border: "border-l-cyan-500",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    label: "Flight",
  },
  calendar: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    label: "Event",
  },
  receipt: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    label: "Receipt",
  },
  package: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    label: "Package",
  },
  newsletter: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    label: "Newsletter",
  },
  default: {
    border: "border-l-slate-300",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    label: "Email",
  },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

/** Example flight data. */
export const MOCK_FLIGHT: Record<string, unknown> = {
  airline: "United Airlines",
  flightNumber: "UA 1492",
  departureCity: "SFO",
  departureFull: "San Francisco",
  arrivalCity: "JFK",
  arrivalFull: "New York",
  date: "May 15, 2026",
  departureTime: "8:30 AM",
  arrivalTime: "5:15 PM",
  gate: "B42",
  terminal: "Terminal 3",
};

/** Example calendar data. */
export const MOCK_CALENDAR: Record<string, unknown> = {
  eventName: "Q3 Strategy Review",
  date: "May 12, 2026",
  time: "2:00 PM – 3:30 PM EST",
  location: "Zoom (link attached)",
  attendees: 8,
  organizer: "Sarah Chen",
};

/** Example receipt data. */
export const MOCK_RECEIPT: Record<string, unknown> = {
  store: "Apple Store",
  total: "$1,299.00",
  itemCount: 3,
  orderNumber: "#W829401847",
  date: "Apr 28, 2026",
};

/** Example package data. */
export const MOCK_PACKAGE: Record<string, unknown> = {
  carrier: "FedEx",
  trackingNumber: "7489 2840 0192 3847",
  status: "In Transit",
  estimatedDelivery: "May 2, 2026",
  stage: 3, // out of 5: ordered, shipped, in transit, out for delivery, delivered
  totalStages: 5,
};

/** Example newsletter data. */
export const MOCK_NEWSLETTER: Record<string, unknown> = {
  publication: "The Pragmatic Engineer",
  bullets: [
    "Big Tech hiring freeze is thawing — Amazon and Meta both reopened L5+ roles",
    "Rust adoption in production backends doubled YoY according to StackOverflow survey",
    "The real cost of microservices: a case study from Segment's re-architecture",
  ],
};

/** Example default data. */
export const MOCK_DEFAULT: Record<string, unknown> = {
  preview: "Hey, just wanted to follow up on our conversation from last week about the roadmap priorities...",
};

// ─── Type Icons ─────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: EmailCardType }): ReactElement {
  const accent = ACCENT_MAP[type];

  const iconPaths: Record<EmailCardType, ReactElement> = {
    flight: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
    calendar: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    receipt: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 17.5v-11" />
      </svg>
    ),
    package: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
    newsletter: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8V6Z" />
      </svg>
    ),
    default: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  };

  return (
    <Box
      className={`w-6 h-6 rounded-md ${accent.iconBg} ${accent.iconColor} flex items-center justify-center flex-shrink-0`}
      aria-label={`${accent.label} card`}
    >
      {iconPaths[type]}
    </Box>
  );
}

// ─── Card Renderers ─────────────────────────────────────────────────────────

function FlightCardContent({ data }: { data: Record<string, unknown> }): ReactElement {
  const airline = String(data.airline ?? "");
  const flightNumber = String(data.flightNumber ?? "");
  const departureCity = String(data.departureCity ?? "");
  const departureFull = String(data.departureFull ?? "");
  const arrivalCity = String(data.arrivalCity ?? "");
  const arrivalFull = String(data.arrivalFull ?? "");
  const date = String(data.date ?? "");
  const departureTime = String(data.departureTime ?? "");
  const arrivalTime = String(data.arrivalTime ?? "");
  const gate = String(data.gate ?? "");
  const terminal = String(data.terminal ?? "");

  return (
    <Box className="space-y-2">
      {/* Airline + flight number */}
      <Box className="flex items-center justify-between">
        <Text variant="body-sm" className="font-semibold text-content text-xs">
          {airline} {flightNumber}
        </Text>
        <Text variant="body-sm" className="text-content-tertiary text-xs">
          {date}
        </Text>
      </Box>

      {/* Route: departure → arrival */}
      <Box className="flex items-center gap-3">
        <Box className="text-center">
          <Text variant="body-md" className="font-bold text-content">
            {departureCity}
          </Text>
          <Text variant="body-sm" className="text-content-tertiary text-[10px]">
            {departureFull}
          </Text>
          <Text variant="body-sm" className="text-content-secondary text-xs font-medium">
            {departureTime}
          </Text>
        </Box>

        {/* Arrow */}
        <Box className="flex-1 flex items-center gap-1">
          <Box className="flex-1 h-px bg-cyan-300" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-500 flex-shrink-0" aria-hidden="true">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
          </svg>
          <Box className="flex-1 h-px bg-cyan-300" />
        </Box>

        <Box className="text-center">
          <Text variant="body-md" className="font-bold text-content">
            {arrivalCity}
          </Text>
          <Text variant="body-sm" className="text-content-tertiary text-[10px]">
            {arrivalFull}
          </Text>
          <Text variant="body-sm" className="text-content-secondary text-xs font-medium">
            {arrivalTime}
          </Text>
        </Box>
      </Box>

      {/* Gate + Terminal */}
      <Box className="flex items-center gap-4 pt-1">
        <Box className="flex items-center gap-1">
          <Text variant="body-sm" className="text-content-tertiary text-[10px] uppercase">
            Gate
          </Text>
          <Text variant="body-sm" className="text-content font-medium text-xs">
            {gate}
          </Text>
        </Box>
        <Box className="flex items-center gap-1">
          <Text variant="body-sm" className="text-content-tertiary text-[10px] uppercase">
            Terminal
          </Text>
          <Text variant="body-sm" className="text-content font-medium text-xs">
            {terminal}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

function CalendarCardContent({ data }: { data: Record<string, unknown> }): ReactElement {
  const eventName = String(data.eventName ?? "");
  const date = String(data.date ?? "");
  const time = String(data.time ?? "");
  const location = String(data.location ?? "");
  const attendees = Number(data.attendees ?? 0);

  return (
    <Box className="space-y-2">
      <Text variant="body-sm" className="font-semibold text-content">
        {eventName}
      </Text>

      <Box className="flex flex-wrap items-center gap-3 text-xs">
        <Box className="flex items-center gap-1 text-content-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <Text variant="body-sm" className="text-xs">{date}</Text>
        </Box>
        <Box className="flex items-center gap-1 text-content-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <Text variant="body-sm" className="text-xs">{time}</Text>
        </Box>
      </Box>

      <Box className="flex items-center gap-1 text-content-secondary text-xs">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <Text variant="body-sm" className="text-xs">{location}</Text>
      </Box>

      <Box className="flex items-center justify-between pt-1">
        <Text variant="body-sm" className="text-content-tertiary text-xs">
          {attendees} attendees
        </Text>
        <Box className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Accept event">
            <Text variant="body-sm" className="text-xs text-emerald-600 font-medium">Accept</Text>
          </Button>
          <Button variant="ghost" size="sm" aria-label="Decline event">
            <Text variant="body-sm" className="text-xs text-red-500 font-medium">Decline</Text>
          </Button>
          <Button variant="ghost" size="sm" aria-label="Maybe attend event">
            <Text variant="body-sm" className="text-xs text-content-tertiary font-medium">Maybe</Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function ReceiptCardContent({ data }: { data: Record<string, unknown> }): ReactElement {
  const store = String(data.store ?? "");
  const total = String(data.total ?? "");
  const itemCount = Number(data.itemCount ?? 0);
  const orderNumber = String(data.orderNumber ?? "");

  return (
    <Box className="space-y-2">
      <Box className="flex items-center justify-between">
        <Text variant="body-sm" className="font-semibold text-content text-xs">
          {store}
        </Text>
        <Text variant="body-sm" className="text-content-tertiary text-xs">
          {orderNumber}
        </Text>
      </Box>

      <Box className="flex items-end justify-between">
        <Box>
          <Text variant="body-sm" className="text-content-tertiary text-[10px] uppercase">
            Total
          </Text>
          <Text variant="heading-md" className="font-bold text-content">
            {total}
          </Text>
        </Box>
        <Text variant="body-sm" className="text-content-secondary text-xs">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Text>
      </Box>

      <Box className="pt-1">
        <Button variant="ghost" size="sm" aria-label="View full receipt">
          <Text variant="body-sm" className="text-xs text-content-brand font-medium">
            View Receipt
          </Text>
        </Button>
      </Box>
    </Box>
  );
}

function PackageCardContent({ data }: { data: Record<string, unknown> }): ReactElement {
  const carrier = String(data.carrier ?? "");
  const trackingNumber = String(data.trackingNumber ?? "");
  const status = String(data.status ?? "");
  const estimatedDelivery = String(data.estimatedDelivery ?? "");
  const stage = Number(data.stage ?? 0);
  const totalStages = Number(data.totalStages ?? 5);

  const progressPercent = totalStages > 0 ? (stage / totalStages) * 100 : 0;
  const isDelivered = status.toLowerCase() === "delivered";

  // Truncate tracking number for display
  const truncatedTracking =
    trackingNumber.length > 12
      ? `${trackingNumber.slice(0, 4)}...${trackingNumber.slice(-4)}`
      : trackingNumber;

  return (
    <Box className="space-y-2">
      <Box className="flex items-center justify-between">
        <Text variant="body-sm" className="font-semibold text-content text-xs">
          {carrier}
        </Text>
        <Box
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isDelivered
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
          role="status"
        >
          <Text variant="body-sm" className="text-xs font-medium">
            {status}
          </Text>
        </Box>
      </Box>

      <Box className="flex items-center gap-1">
        <Text variant="body-sm" className="text-content-tertiary text-[10px] uppercase">
          Tracking
        </Text>
        <Text variant="body-sm" className="text-content-secondary text-xs font-mono">
          {truncatedTracking}
        </Text>
      </Box>

      {/* Progress bar */}
      <Box className="space-y-1">
        <Box
          className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden"
          role="progressbar"
          aria-valuenow={stage}
          aria-valuemin={0}
          aria-valuemax={totalStages}
          aria-label={`Delivery progress: stage ${stage} of ${totalStages}`}
        >
          <motion.div
            className={`h-full rounded-full ${isDelivered ? "bg-emerald-500" : "bg-amber-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </Box>
        <Text variant="body-sm" className="text-content-tertiary text-[10px]">
          Est. delivery: {estimatedDelivery}
        </Text>
      </Box>
    </Box>
  );
}

function NewsletterCardContent({ data }: { data: Record<string, unknown> }): ReactElement {
  const publication = String(data.publication ?? "");
  const bullets = Array.isArray(data.bullets) ? data.bullets.map(String) : [];
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback((): void => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Box className="space-y-2">
      <Text variant="body-sm" className="font-semibold text-content text-xs">
        {publication}
      </Text>

      <Box
        className="space-y-1.5"
        role="list"
        aria-label="Newsletter summary"
      >
        {bullets.map((bullet, idx) => (
          <Box key={idx} className="flex items-start gap-2" role="listitem">
            <Box className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
            <Text variant="body-sm" className="text-content-secondary text-xs leading-relaxed">
              {bullet}
            </Text>
          </Box>
        ))}
      </Box>

      <Box className="pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          aria-label={expanded ? "Collapse full newsletter" : "Read full newsletter"}
        >
          <Text variant="body-sm" className="text-xs text-purple-600 font-medium">
            {expanded ? "Collapse" : "Read Full"}
          </Text>
        </Button>
      </Box>
    </Box>
  );
}

function DefaultCardContent({ data }: { data: Record<string, unknown> }): ReactElement {
  const preview = String(data.preview ?? "");

  return (
    <Text variant="body-sm" className="text-content-secondary text-xs leading-relaxed">
      {preview}
    </Text>
  );
}

// ─── Card Content Router ────────────────────────────────────────────────────

const CARD_RENDERERS: Record<
  EmailCardType,
  (props: { data: Record<string, unknown> }) => ReactElement
> = {
  flight: FlightCardContent,
  calendar: CalendarCardContent,
  receipt: ReceiptCardContent,
  package: PackageCardContent,
  newsletter: NewsletterCardContent,
  default: DefaultCardContent,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function InteractiveEmailCard({
  type,
  data,
  className,
}: InteractiveEmailCardProps): ReactElement {
  const reduced = useAlecRaeReducedMotion();
  const accent = ACCENT_MAP[type];
  const containerVariants = withReducedMotion(fadeInUp, reduced);

  const ContentRenderer = CARD_RENDERERS[type];

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -1, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)" }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={`bg-surface border-border border-l-4 ${accent.border} relative`}
        padding="sm"
      >
        {/* Type icon in corner */}
        <Box className="absolute top-3 right-3">
          <TypeIcon type={type} />
        </Box>

        {/* Card content */}
        <Box className="pr-8">
          <ContentRenderer data={data} />
        </Box>
      </Card>
    </motion.div>
  );
}

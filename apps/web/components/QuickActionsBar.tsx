"use client";

/**
 * QuickActionsBar — Floating action bar for one-click email operations.
 *
 * Appears when hovering over or selecting an email row. Provides Reply,
 * Forward, Archive, Delete, Snooze, Star, and Mark Read/Unread actions
 * as compact icon buttons with tooltips and colored hover states.
 *
 * All icons are inline SVGs — no external icon library.
 * Fully accessible: ARIA labels, keyboard navigable, reduced motion support.
 */

import { motion } from "motion/react";
import { SPRING_BOUNCY, SPRING_SNAPPY, useAlecRaeReducedMotion } from "../lib/animations";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface QuickActionsBarProps {
  emailId: string;
  onReply: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSnooze: () => void;
  onStar: () => void;
  onForward: () => void;
  onMarkRead: () => void;
  isStarred?: boolean;
  isRead?: boolean;
  className?: string;
}

interface ActionButtonDef {
  id: string;
  label: string;
  /** SVG path data (24x24 viewBox). */
  icon: string;
  /** Extra SVG elements (e.g. filled shapes for toggle states). */
  iconExtra?: React.ReactNode;
  /** Tailwind hover background color class. */
  hoverBg: string;
  /** Tailwind hover text color class. */
  hoverText: string;
  onClick: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────

export function QuickActionsBar({
  emailId,
  onReply,
  onArchive,
  onDelete,
  onSnooze,
  onStar,
  onForward,
  onMarkRead,
  isStarred = false,
  isRead = true,
  className,
}: QuickActionsBarProps): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();

  // ── Communication actions (left group) ──────────────────────────────────
  const communicationActions: ActionButtonDef[] = [
    {
      id: `${emailId}-reply`,
      label: "Reply",
      icon: "M3 10l7-7v4c8 0 12 4 12 11-2-5-6-7-12-7v4L3 10z",
      hoverBg: "hover:bg-blue-50",
      hoverText: "hover:text-blue-600",
      onClick: onReply,
    },
    {
      id: `${emailId}-forward`,
      label: "Forward",
      icon: "M21 10l-7-7v4C6 7 2 11 2 18c2-5 6-7 12-7v4l7-5z",
      hoverBg: "hover:bg-cyan-50",
      hoverText: "hover:text-cyan-600",
      onClick: onForward,
    },
  ];

  // ── Organize actions (right group) ──────────────────────────────────────
  const organizeActions: ActionButtonDef[] = [
    {
      id: `${emailId}-archive`,
      label: "Archive",
      icon: "M21 8v13H3V8M1 3h22v5H1zM10 12h4",
      hoverBg: "hover:bg-amber-50",
      hoverText: "hover:text-amber-600",
      onClick: onArchive,
    },
    {
      id: `${emailId}-delete`,
      label: "Delete",
      icon: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
      hoverBg: "hover:bg-red-50",
      hoverText: "hover:text-red-600",
      onClick: onDelete,
    },
    {
      id: `${emailId}-snooze`,
      label: "Snooze",
      icon: "M12 6v6l4 2",
      iconExtra: (
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      ),
      hoverBg: "hover:bg-purple-50",
      hoverText: "hover:text-purple-600",
      onClick: onSnooze,
    },
    {
      id: `${emailId}-star`,
      label: isStarred ? "Unstar" : "Star",
      icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z",
      hoverBg: "hover:bg-yellow-50",
      hoverText: "hover:text-yellow-600",
      onClick: onStar,
    },
    {
      id: `${emailId}-read`,
      label: isRead ? "Mark Unread" : "Mark Read",
      icon: isRead
        ? "M3 8l4 4 4-4M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M21 8l-9 6-9-6"
        : "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
      hoverBg: "hover:bg-gray-100",
      hoverText: "hover:text-gray-700",
      onClick: onMarkRead,
    },
  ];

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 2 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 2 }}
      transition={SPRING_BOUNCY}
      className={[
        "inline-flex items-center gap-0.5 px-1.5 py-1 rounded-xl",
        "bg-surface border border-border shadow-elevated",
        className ?? "",
      ].join(" ")}
      role="toolbar"
      aria-label="Quick email actions"
    >
      {/* Communication group */}
      {communicationActions.map((action) => (
        <QuickActionButton
          key={action.id}
          action={action}
          reduced={reduced}
        />
      ))}

      {/* Divider */}
      <div
        className="w-px h-5 bg-border mx-0.5 flex-shrink-0"
        role="separator"
        aria-orientation="vertical"
      />

      {/* Organize group */}
      {organizeActions.map((action) => (
        <QuickActionButton
          key={action.id}
          action={action}
          reduced={reduced}
          filled={action.label === "Unstar"}
        />
      ))}
    </motion.div>
  );
}

// ─── Button Sub-Component ─────────────────────────────────────────────────

interface QuickActionButtonProps {
  action: ActionButtonDef;
  reduced: boolean;
  filled?: boolean;
}

function QuickActionButton({
  action,
  reduced,
  filled = false,
}: QuickActionButtonProps): React.ReactNode {
  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      className={[
        "flex items-center justify-center w-8 h-8 rounded-lg",
        "text-content-secondary transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
        action.hoverBg,
        action.hoverText,
      ].join(" ")}
      {...(!reduced ? { whileHover: { scale: 1.12 }, whileTap: { scale: 0.92 } } : {})}
      transition={SPRING_SNAPPY}
      aria-label={action.label}
      title={action.label}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={action.icon} />
        {action.iconExtra}
      </svg>
    </motion.button>
  );
}

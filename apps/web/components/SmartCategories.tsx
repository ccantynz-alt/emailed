"use client";

/**
 * SmartCategories — AI-powered email category tabs (replaces Gmail's Primary/Social/Promotions).
 *
 * Horizontal scrollable pill bar with colored accents per category.
 * Active pill uses layoutId for a smooth sliding indicator animation.
 * Accessible: proper ARIA roles, keyboard navigable, reduced motion support.
 */

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING_BOUNCY, SPRING_SNAPPY, useAlecRaeReducedMotion } from "../lib/animations";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SmartCategoriesProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  counts: Record<string, number>;
}

interface CategoryDefinition {
  id: string;
  label: string;
  /** SVG path data for the icon (24x24 viewBox). */
  icon: string;
  /** Extra SVG elements (e.g. circles) rendered alongside the path. */
  iconExtra?: React.ReactNode;
  /** Tailwind classes for the active pill background + text. */
  activeClasses: string;
  /** Tailwind classes for the colored dot next to the label when inactive. */
  dotColor: string;
  /** Tailwind classes for the count badge background when active. */
  activeBadge: string;
}

// ─── Category Definitions ──────────────────────────────────────────────────

const CATEGORIES: CategoryDefinition[] = [
  {
    id: "all",
    label: "All Emails",
    icon: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm2-2l7 5 7-5",
    activeClasses: "bg-content text-white",
    dotColor: "bg-content-secondary",
    activeBadge: "bg-white/20",
  },
  {
    id: "needs-reply",
    label: "Needs Reply",
    icon: "M3 10l9 6 9-6M21 10v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7M9 14l-6 4M15 14l6 4",
    activeClasses: "bg-rose-500 text-white",
    dotColor: "bg-rose-500",
    activeBadge: "bg-white/25",
  },
  {
    id: "important",
    label: "Important",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z",
    activeClasses: "bg-amber-500 text-white",
    dotColor: "bg-amber-500",
    activeBadge: "bg-white/25",
  },
  {
    id: "fyi",
    label: "FYI Only",
    icon: "M12 16v-4M12 8h.01",
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
    activeClasses: "bg-blue-500 text-white",
    dotColor: "bg-blue-500",
    activeBadge: "bg-white/25",
  },
  {
    id: "money",
    label: "Money",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    activeClasses: "bg-emerald-500 text-white",
    dotColor: "bg-emerald-500",
    activeBadge: "bg-white/25",
  },
  {
    id: "travel",
    label: "Travel",
    icon: "M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.4 3.1-3.1 3.1-1.8-.5c-.4-.1-.8 0-1 .3l-.2.3c-.2.3-.1.7.2.9l3 2 2 3c.2.3.6.4.9.2l.3-.2c.3-.2.4-.6.3-1l-.5-1.8 3.1-3.1 3.1 5.4c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z",
    activeClasses: "bg-cyan-500 text-white",
    dotColor: "bg-cyan-500",
    activeBadge: "bg-white/25",
  },
  {
    id: "newsletters",
    label: "Newsletters",
    icon: "M19 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2zM7 9h10M7 13h6",
    activeClasses: "bg-purple-500 text-white",
    dotColor: "bg-purple-500",
    activeBadge: "bg-white/25",
  },
  {
    id: "automated",
    label: "Automated",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6z",
    iconExtra: (
      <>
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    activeClasses: "bg-gray-500 text-white",
    dotColor: "bg-gray-400",
    activeBadge: "bg-white/25",
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function SmartCategories({
  activeCategory,
  onCategoryChange,
  counts,
}: SmartCategoriesProps): React.ReactNode {
  const reduced = useAlecRaeReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      const currentIndex = CATEGORIES.findIndex((c) => c.id === activeCategory);
      let nextIndex = currentIndex;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % CATEGORIES.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = CATEGORIES.length - 1;
      } else {
        return;
      }

      const next = CATEGORIES[nextIndex];
      if (next) {
        onCategoryChange(next.id);
        // Scroll the newly focused pill into view
        const container = scrollRef.current;
        if (container) {
          const buttons = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
          const target = buttons[nextIndex];
          target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          target?.focus();
        }
      }
    },
    [activeCategory, onCategoryChange],
  );

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1.5 overflow-x-auto px-1 py-1.5 scrollbar-none scroll-smooth snap-x snap-mandatory"
      role="tablist"
      aria-label="Email categories"
      onKeyDown={handleKeyDown}
    >
      {CATEGORIES.map((category) => {
        const isActive = activeCategory === category.id;
        const count = counts[category.id] ?? 0;

        return (
          <CategoryPill
            key={category.id}
            category={category}
            isActive={isActive}
            count={count}
            reduced={reduced}
            onClick={(): void => onCategoryChange(category.id)}
          />
        );
      })}
    </div>
  );
}

// ─── Pill Sub-Component ────────────────────────────────────────────────────

interface CategoryPillProps {
  category: CategoryDefinition;
  isActive: boolean;
  count: number;
  reduced: boolean;
  onClick: () => void;
}

function CategoryPill({
  category,
  isActive,
  count,
  reduced,
  onClick,
}: CategoryPillProps): React.ReactNode {
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`category-panel-${category.id}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={[
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        "whitespace-nowrap snap-start select-none transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-1",
        isActive
          ? category.activeClasses
          : "bg-surface-tertiary text-content-secondary hover:bg-surface-secondary hover:text-content",
      ].join(" ")}
      {...(!reduced ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } : {})}
      transition={SPRING_SNAPPY}
    >
      {/* Animated active background (shared layout for sliding effect) */}
      {isActive && (
        <motion.span
          layoutId="smart-category-active-bg"
          className={[
            "absolute inset-0 rounded-full",
            category.activeClasses,
          ].join(" ")}
          transition={reduced ? { duration: 0 } : SPRING_BOUNCY}
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <span className="relative z-10 flex items-center justify-center w-4 h-4 flex-shrink-0">
        {!isActive && (
          <span
            className={[
              "absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
              category.dotColor,
            ].join(" ")}
            aria-hidden="true"
          />
        )}
        {isActive && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10"
            aria-hidden="true"
          >
            <path d={category.icon} />
            {category.iconExtra}
          </svg>
        )}
      </span>

      {/* Label */}
      <span className="relative z-10">{category.label}</span>

      {/* Count badge */}
      {count > 0 && (
        <AnimatePresence mode="wait">
          <motion.span
            key={`${category.id}-${count}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            transition={SPRING_SNAPPY}
            className={[
              "relative z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1",
              "text-[11px] font-semibold rounded-full tabular-nums",
              isActive
                ? category.activeBadge
                : "bg-surface-secondary text-content-secondary",
            ].join(" ")}
          >
            {count}
          </motion.span>
        </AnimatePresence>
      )}
    </motion.button>
  );
}

"use client";

/**
 * AnimatedList — staggered entrance/exit wrapper for any list-shaped content.
 *
 * Wraps each child in a motion.div with `listItemEnter` variants and applies
 * `staggerListItems` to the parent. Used by inbox lists, search results,
 * notification feeds, and anywhere you want list items to feel alive.
 */

import { AnimatePresence, motion } from "motion/react";
import { Children, type ReactNode } from "react";
import {
  listItemEnter,
  staggerListItems,
  useViennaReducedMotion,
  withReducedMotion,
} from "../lib/animations";

export interface AnimatedListProps {
  children: ReactNode;
  /** Extra classes for the parent container. */
  className?: string;
  /** When true, items animate out when removed (uses AnimatePresence). */
  exitOnRemove?: boolean;
  /** Custom stagger delay (seconds). */
  staggerDelay?: number;
  /** Tag/role for the wrapper. Defaults to ul. */
  as?: "ul" | "ol" | "div";
}

export function AnimatedList({
  children,
  className,
  exitOnRemove = true,
  as = "ul",
}: AnimatedListProps): JSX.Element {
  const reduced = useViennaReducedMotion();
  const parentVariants = reduced ? undefined : staggerListItems;
  const childVariants = withReducedMotion(listItemEnter, reduced);

  const items = Children.toArray(children);
  const MotionTag = motion[as];

  const content = items.map((child, i) => (
    <motion.li
      // eslint-disable-next-line react/no-array-index-key
      key={getKey(child, i)}
      variants={childVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      style={{ listStyle: "none" }}
    >
      {child}
    </motion.li>
  ));

  return (
    <MotionTag
      className={className}
      variants={parentVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {exitOnRemove ? <AnimatePresence initial={false}>{content}</AnimatePresence> : content}
    </MotionTag>
  );
}

function getKey(child: unknown, fallback: number): string | number {
  if (
    typeof child === "object" &&
    child !== null &&
    "key" in child &&
    (child as { key: unknown }).key != null
  ) {
    return (child as { key: string | number }).key;
  }
  return fallback;
}

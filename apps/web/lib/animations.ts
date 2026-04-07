/**
 * Vienna Animation Library — Magic UI / Linear-grade motion presets
 *
 * Pre-defined Framer Motion variants and spring physics tuned to match
 * Linear's snappy-but-organic feel. Used by list items, modals, page
 * transitions, panels, badges, and anywhere a transition needs to feel
 * intentional rather than incidental.
 *
 * All variants degrade gracefully to instant transitions when the user has
 * `prefers-reduced-motion` enabled (see `useViennaReducedMotion`).
 */

import type { Transition, Variants } from "motion/react";
import { useReducedMotion } from "motion/react";

// ─── Spring Physics Presets ──────────────────────────────────────────────────

/** Linear-style: confident bounce, fast settle. The "signature" Vienna feel. */
export const SPRING_BOUNCY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

/** Gentle entrance — for modals, drawers, large surfaces. */
export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 28,
  mass: 1,
};

/** Instant response — for hover, tap, micro-interactions. */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 30,
  mass: 0.5,
};

/** No bounce, fast settle — for panels and content swaps. */
export const SPRING_PRECISE: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
  mass: 0.7,
};

// ─── Fade Variants ───────────────────────────────────────────────────────────

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: SPRING_PRECISE },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeOut: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: SPRING_BOUNCY },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0, transition: SPRING_BOUNCY },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: SPRING_BOUNCY },
  exit: { opacity: 0, x: -12, transition: { duration: 0.15 } },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: SPRING_BOUNCY },
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

// ─── Scale Variants ──────────────────────────────────────────────────────────

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: SPRING_BOUNCY },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export const scaleOut: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

/** Pop-in: starts smaller, overshoots slightly. For badges, toasts, popovers. */
export const scalePopIn: Variants = {
  initial: { opacity: 0, scale: 0.6 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 18, mass: 0.6 },
  },
  exit: { opacity: 0, scale: 0.6, transition: { duration: 0.15 } },
};

/** Tap/press feedback — pair with whileTap. */
export const scalePop: Variants = {
  initial: { scale: 1 },
  animate: { scale: 1, transition: SPRING_SNAPPY },
  tap: { scale: 0.96, transition: SPRING_SNAPPY },
  hover: { scale: 1.02, transition: SPRING_SNAPPY },
};

// ─── Slide Variants ──────────────────────────────────────────────────────────

export const slideInUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: SPRING_SOFT },
  exit: { y: "100%", transition: SPRING_PRECISE },
};

export const slideInDown: Variants = {
  initial: { y: "-100%" },
  animate: { y: 0, transition: SPRING_SOFT },
  exit: { y: "-100%", transition: SPRING_PRECISE },
};

export const slideInLeft: Variants = {
  initial: { x: "-100%" },
  animate: { x: 0, transition: SPRING_SOFT },
  exit: { x: "-100%", transition: SPRING_PRECISE },
};

export const slideInRight: Variants = {
  initial: { x: "100%" },
  animate: { x: 0, transition: SPRING_SOFT },
  exit: { x: "100%", transition: SPRING_PRECISE },
};

// ─── List Item Variants (Staggered) ──────────────────────────────────────────

export const listItemEnter: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: SPRING_BOUNCY },
};

export const listItemExit: Variants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

// ─── Modal Variants ──────────────────────────────────────────────────────────

export const modalEnter: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: SPRING_BOUNCY },
  exit: { opacity: 0, scale: 0.94, y: 8, transition: { duration: 0.18 } },
};

export const modalExit: Variants = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 0, scale: 0.94, transition: { duration: 0.18 } },
};

// ─── Drawer Variants ─────────────────────────────────────────────────────────

export const drawerEnterLeft: Variants = {
  initial: { x: "-100%", opacity: 0.5 },
  animate: { x: 0, opacity: 1, transition: SPRING_SOFT },
  exit: { x: "-100%", opacity: 0, transition: SPRING_PRECISE },
};

export const drawerEnterRight: Variants = {
  initial: { x: "100%", opacity: 0.5 },
  animate: { x: 0, opacity: 1, transition: SPRING_SOFT },
  exit: { x: "100%", opacity: 0, transition: SPRING_PRECISE },
};

export const drawerEnterBottom: Variants = {
  initial: { y: "100%", opacity: 0.5 },
  animate: { y: 0, opacity: 1, transition: SPRING_SOFT },
  exit: { y: "100%", opacity: 0, transition: SPRING_PRECISE },
};

/** Convenience namespaced object for the three drawer directions. */
export const drawerEnter = {
  left: drawerEnterLeft,
  right: drawerEnterRight,
  bottom: drawerEnterBottom,
} as const;

export const drawerExitLeft: Variants = {
  initial: { x: 0 },
  animate: { x: "-100%", transition: SPRING_PRECISE },
};

export const drawerExitRight: Variants = {
  initial: { x: 0 },
  animate: { x: "100%", transition: SPRING_PRECISE },
};

export const drawerExitBottom: Variants = {
  initial: { y: 0 },
  animate: { y: "100%", transition: SPRING_PRECISE },
};

export const drawerExit = {
  left: drawerExitLeft,
  right: drawerExitRight,
  bottom: drawerExitBottom,
} as const;

// ─── Loading / Skeleton ──────────────────────────────────────────────────────

export const skeletonShimmer: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 1.4,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

// ─── Stagger Helpers ─────────────────────────────────────────────────────────

/**
 * Build a parent variants object that staggers its children.
 * Use with `listItemEnter` on each child.
 */
export function staggerChildren(delay = 0.04, initialDelay = 0): Variants {
  return {
    initial: {},
    animate: {
      transition: {
        staggerChildren: delay,
        delayChildren: initialDelay,
      },
    },
    exit: {
      transition: {
        staggerChildren: delay / 2,
        staggerDirection: -1,
      },
    },
  };
}

/** Default staggered list — used by AnimatedList. */
export const staggerListItems: Variants = staggerChildren(0.035, 0.02);

// ─── Reduced Motion Support ──────────────────────────────────────────────────

/**
 * Vienna's wrapper around Framer Motion's `useReducedMotion`.
 *
 * Returns `true` when the user prefers reduced motion. Components should
 * use this to swap variants for instant ones (or pass `transition={{ duration: 0 }}`).
 */
export function useViennaReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/**
 * Returns a variants object that's collapsed to instant transitions when
 * the user prefers reduced motion. Pass any of the named variants above.
 */
export function withReducedMotion(variants: Variants, reduced: boolean): Variants {
  if (!reduced) return variants;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0 } },
    exit: { opacity: 0, transition: { duration: 0 } },
  };
}

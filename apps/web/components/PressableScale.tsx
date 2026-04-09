"use client";

/**
 * PressableScale — subtle scale feedback on press/hover.
 *
 * Wraps any interactive element (button, card, link) and adds spring-based
 * scale feedback on hover and tap. The effect is subtle enough to use
 * everywhere without feeling noisy.
 *
 * Supports both button and generic div modes via the `as` prop.
 */

import { motion } from "motion/react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import {
  SPRING_MICRO,
  useViennaReducedMotion,
} from "../lib/animations";

export interface PressableScaleProps {
  children: ReactNode;
  /** Extra CSS classes. */
  className?: string;
  /** Click handler. */
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Render as button or div. Default "div". */
  as?: "button" | "div";
  /** Scale when pressed. Default 0.97. */
  tapScale?: number;
  /** Scale on hover. Default 1.015. */
  hoverScale?: number;
  /** Disable all interactions. */
  disabled?: boolean;
  /** ARIA label. */
  ariaLabel?: string;
  /** Tab index override. */
  tabIndex?: number;
  /** Button type when as="button". */
  type?: "button" | "submit" | "reset";
}

export function PressableScale({
  children,
  className,
  onClick,
  as = "div",
  tapScale = 0.97,
  hoverScale = 1.015,
  disabled = false,
  ariaLabel,
  tabIndex,
  type = "button",
}: PressableScaleProps): JSX.Element {
  const reduced = useViennaReducedMotion();

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>): void => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e as unknown as MouseEvent<HTMLElement>);
    }
  };

  const motionProps = {
    className,
    onClick: disabled ? undefined : onClick,
    onKeyDown: disabled ? undefined : handleKeyDown,
    whileHover: reduced || disabled ? undefined : { scale: hoverScale },
    whileTap: reduced || disabled ? undefined : { scale: tapScale },
    transition: SPRING_MICRO,
    "aria-label": ariaLabel,
    "aria-disabled": disabled || undefined,
    tabIndex: disabled ? -1 : (tabIndex ?? (onClick ? 0 : undefined)),
    style: { cursor: disabled ? "default" : onClick ? "pointer" : undefined },
  };

  if (as === "button") {
    return (
      <motion.button
        type={type}
        disabled={disabled}
        {...motionProps}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div
      role={onClick ? "button" : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

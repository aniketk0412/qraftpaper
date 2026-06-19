"use client";

import type { ReactNode } from "react";

import { GlowButton } from "@/components/ui/glow-button";

/**
 * A submit button that asks for explicit confirmation before letting the form
 * submit. Used for consequential, hard-to-undo saves — e.g. changing the
 * education level, which locks for 6 months. Declining cancels the submit so
 * nothing is persisted.
 */
export function ConfirmSaveButton({
  message,
  children,
  className,
}: {
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlowButton
      type="submit"
      size="md"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </GlowButton>
  );
}

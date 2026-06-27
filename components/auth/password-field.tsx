"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps
  extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  label: string;
  id: string;
  // Show a live strength meter beneath the input (signup only — pointless on
  // the login form where the password already exists).
  showStrength?: boolean;
}

// The lock icon is hardcoded rather than passed in: this is a client
// component, and a server component (the login/signup pages) can't serialize a
// component function across the RSC boundary as a prop.

// 0–4 strength score from cheap, transparent heuristics. Not a security
// control (the server enforces the real ≥8 rule) — purely a UX nudge so a
// student doesn't set "12345678" without a second thought.
function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;
const COLORS = [
  "bg-tint/20",
  "bg-gold",
  "bg-gold",
  "bg-accent-soft",
  "bg-accent",
] as const;

export function PasswordField({
  label,
  id,
  className,
  showStrength = false,
  onChange,
  ...props
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");

  const score = scorePassword(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.78rem] font-medium text-fg-muted">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <input
          id={id}
          type={show ? "text" : "password"}
          onChange={(e) => {
            if (showStrength) setValue(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            "h-11 w-full rounded-xl border border-line bg-tint/[0.03] pl-10 pr-10 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus:border-violet/50 focus:bg-tint/[0.05] focus:outline-none focus:ring-2 focus:ring-violet/20",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/30"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < score ? COLORS[score] : "bg-tint/10",
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
            {LABELS[score]}
          </span>
        </div>
      )}
    </div>
  );
}

"use client";

import { GraduationCap, Lock } from "lucide-react";
import { useState } from "react";

import {
  COLLEGE_DEPARTMENTS,
  EDUCATION_LEVELS,
  SCHOOL_CLASSES,
  type EducationLevel,
} from "@/lib/education";

const selectClass =
  "h-11 w-full rounded-xl border border-line bg-tint/[0.03] px-3.5 text-sm text-fg transition-all duration-200 focus:border-violet/50 focus:bg-tint/[0.05] focus:outline-none focus:ring-2 focus:ring-violet/20 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Signup field for "what are you studying". Two native selects (so the form
 * still submits via FormData and HTML `required` validation works): level →
 * class/department. Carries the lock warning, because the grade can only be
 * changed once every ~6 months after this.
 */
export function EducationPicker({
  defaultLevel = "",
  defaultGrade = "",
  hideNote = false,
}: {
  defaultLevel?: EducationLevel | "";
  defaultGrade?: string;
  /** Suppress the built-in lock note when the parent renders its own (e.g. the
   *  settings page shows a more prominent callout above the dropdowns). */
  hideNote?: boolean;
}) {
  const [level, setLevel] = useState<EducationLevel | "">(defaultLevel);
  const [grade, setGrade] = useState(defaultGrade);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-fg-muted">
        <GraduationCap className="h-3.5 w-3.5 text-fg-subtle" />
        What are you studying?
      </span>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          name="educationLevel"
          required
          value={level}
          onChange={(e) => {
            setLevel(e.target.value as EducationLevel);
            setGrade(""); // reset the dependent select when level changes
          }}
          aria-label="School or college"
          className={selectClass}
        >
          <option value="" disabled>
            School or college
          </option>
          {EDUCATION_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>

        <select
          name="educationGrade"
          required
          disabled={!level}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          aria-label={level === "college" ? "Department" : "Class"}
          className={selectClass}
        >
          <option value="" disabled>
            {level === "college" ? "Your department" : "Your class"}
          </option>
          {level === "school" &&
            SCHOOL_CLASSES.map((c) => (
              <option key={c} value={String(c)}>
                Class {c}
              </option>
            ))}
          {level === "college" &&
            COLLEGE_DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
        </select>
      </div>

      {!hideNote && (
        <p className="flex items-start gap-1.5 text-[0.72rem] leading-relaxed text-fg-subtle">
          <Lock className="mt-0.5 h-3 w-3 shrink-0" />
          Pick carefully — this is locked to your account and can be changed only
          once every 6 months. Your dashboard and samples are tailored to it.
        </p>
      )}
    </div>
  );
}

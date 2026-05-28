import { Check } from "lucide-react";
import { Logo } from "@/components/logo";

const points = [
  "Mock papers shaped by your actual syllabus and PYQs",
  "Timed MCQ quizzes with score history across attempts",
  "Print, export or share quiz links with your study group",
];

export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-violet/14 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-gold/[0.06] blur-[130px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(20,32,46,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,32,46,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative p-12">
        <Logo />
      </div>

      <div className="relative px-12">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-violet-bright">
          Exam-prep that doesn&apos;t feel like cheating
        </p>
        <h2 className="mt-4 max-w-md text-pretty text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-gradient">
          Practice papers built from your own syllabus.
        </h2>
        <ul className="mt-8 flex flex-col gap-3.5">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/20 text-violet-bright">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="text-[0.92rem] text-fg-muted">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative p-12" />
    </div>
  );
}

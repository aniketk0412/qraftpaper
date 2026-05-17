import { Check, Quote } from "lucide-react";
import { Logo } from "@/components/logo";
import { testimonials } from "@/lib/demo-data";

const featured = testimonials[0];

const points = [
  "Generate exam-ready papers from your own material",
  "Blueprint-accurate to every unit weightage",
  "Originality guarded against previous year papers",
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
              "linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <div className="relative p-12">
        <Logo />
      </div>

      <div className="relative px-12">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-violet-bright">
          The examination workspace
        </p>
        <h2 className="mt-4 max-w-md text-pretty text-4xl font-semibold leading-[1.1] tracking-[-0.02em] text-gradient">
          Set papers your board trusts — in minutes, not weeks.
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

      <div className="relative p-12">
        <div className="rounded-2xl glass-strong p-6">
          <Quote className="h-6 w-6 text-violet/50" fill="currentColor" />
          <p className="mt-3 text-[0.92rem] leading-relaxed text-fg/90">
            {featured.text}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card-hi font-mono text-xs font-medium text-fg ring-1 ring-line">
              {featured.initials}
            </span>
            <div className="leading-tight">
              <p className="text-[0.82rem] font-medium">{featured.name}</p>
              <p className="text-[0.72rem] text-fg-muted">
                {featured.role}, {featured.org}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

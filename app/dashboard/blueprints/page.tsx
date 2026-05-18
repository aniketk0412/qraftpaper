import { ArrowRight, Clock, Layers, Ruler } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";

interface Blueprint {
  name: string;
  description: string;
  marks: number;
  duration: string;
  sections: string;
  mix: string;
}

const starterBlueprints: Blueprint[] = [
  {
    name: "End-Semester Examination",
    description: "Full-length paper across all units.",
    marks: 70,
    duration: "3 hours",
    sections: "3 sections — short, descriptive, long answer",
    mix: "Easy 30% · Medium 50% · Hard 20%",
  },
  {
    name: "Mid-Semester Test",
    description: "Half-syllabus assessment.",
    marks: 50,
    duration: "2 hours",
    sections: "2 sections — short and descriptive",
    mix: "Easy 40% · Medium 45% · Hard 15%",
  },
  {
    name: "Unit Test",
    description: "Quick single-unit check.",
    marks: 30,
    duration: "1 hour",
    sections: "2 sections — short answer focus",
    mix: "Easy 50% · Medium 35% · Hard 15%",
  },
];

export default function BlueprintsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              Blueprints
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
              Reusable exam blueprints
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
              A blueprint locks in the structure of a paper — marks, duration,
              sections and difficulty mix — so every generation follows the same
              format.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {starterBlueprints.map((blueprint, index) => (
          <Reveal key={blueprint.name} delay={index * 0.06}>
            <GlassCard hover className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={Ruler} />
                <span className="rounded-full border border-line bg-white/[0.03] px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-muted">
                  {blueprint.marks} marks
                </span>
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-tight">
                {blueprint.name}
              </h2>
              <p className="mt-1 text-[0.84rem] text-fg-muted">
                {blueprint.description}
              </p>

              <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-[0.8rem] text-fg-muted">
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-fg-subtle" />
                  {blueprint.duration}
                </span>
                <span className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-fg-subtle" />
                  {blueprint.sections}
                </span>
              </div>

              <p className="mt-3 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {blueprint.mix}
              </p>

              <div className="mt-5">
                <GlowButton
                  href="/dashboard"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Use blueprint
                  <ArrowRight className="h-3.5 w-3.5" />
                </GlowButton>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <GlassCard className="mt-3 p-5">
          <p className="text-[0.82rem] text-fg-muted">
            <span className="font-medium text-fg">Saving custom blueprints</span>{" "}
            arrives with the next generation update — for now these starters
            cover the common exam formats.
          </p>
        </GlassCard>
      </Reveal>
    </div>
  );
}

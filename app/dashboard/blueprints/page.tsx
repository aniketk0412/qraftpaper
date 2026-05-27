import type { Metadata } from "next";
import { auth } from "@/auth";
import { BlueprintsManager } from "@/components/dashboard/blueprints-manager";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import { listUserSubjects } from "@/lib/subjects";

export const metadata: Metadata = {
  title: "Blueprints — QraftPaper",
};

export const runtime = "nodejs";

export default async function BlueprintsPage() {
  const session = await auth();
  const subjects = session?.user?.id
    ? await listUserSubjects(session.user.id)
    : [];

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
              format. Save your own or start from a built-in.
            </p>
          </div>
        </div>
      </Reveal>

      <BlueprintsManager subjects={subjects} />
    </div>
  );
}

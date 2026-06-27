"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import {
  createUserBlueprint,
  deleteUserBlueprint,
  migrateLocalBlueprints,
  type BlueprintInput,
} from "@/lib/blueprints-db";

// Server-side validation — never trust the client's blueprint shape. Mirrors
// the CreateBlueprintForm constraints with hard upper bounds so a crafted
// request can't store a 10k-section "blueprint".
const sectionSchema = z.object({
  title: z.string().trim().min(1).max(160),
  instruction: z.string().trim().min(1).max(400),
  marksPerQuestion: z.number().int().min(1).max(100),
  count: z.number().int().min(1).max(100),
});

const configSchema = z.object({
  examTitle: z.string().trim().min(1).max(160),
  totalMarks: z.number().int().min(1).max(2000),
  durationMins: z.number().int().min(1).max(1440),
  sections: z.array(sectionSchema).min(1).max(20),
  difficultyMix: z.object({
    Easy: z.number().int().min(0).max(100),
    Medium: z.number().int().min(0).max(100),
    Hard: z.number().int().min(0).max(100),
  }),
});

const inputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(400).default(""),
  config: configSchema,
});

// A user can hold at most this many custom blueprints — a sane cap that also
// bounds the one-time migration.
const MAX_BLUEPRINTS = 50;

export async function createBlueprintAction(
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not signed in." };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That blueprint isn't valid — check the fields." };
  }

  try {
    await createUserBlueprint(session.user.id, parsed.data as BlueprintInput);
    revalidatePath("/dashboard/subjects");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save right now — please try again." };
  }
}

export async function deleteBlueprintAction(
  id: unknown,
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  if (typeof id !== "string" || id.length === 0) return { ok: false };

  try {
    await deleteUserBlueprint(session.user.id, id);
    revalidatePath("/dashboard/subjects");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function migrateBlueprintsAction(
  raw: unknown,
): Promise<{ ok: boolean; migrated: number }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, migrated: 0 };

  const parsed = z.array(inputSchema).max(MAX_BLUEPRINTS).safeParse(raw);
  if (!parsed.success) return { ok: false, migrated: 0 };

  try {
    const migrated = await migrateLocalBlueprints(
      session.user.id,
      parsed.data as BlueprintInput[],
    );
    if (migrated > 0) revalidatePath("/dashboard/subjects");
    return { ok: true, migrated };
  } catch {
    return { ok: false, migrated: 0 };
  }
}

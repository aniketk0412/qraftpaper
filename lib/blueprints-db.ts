import "server-only";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { blueprints as blueprintsTable } from "@/lib/db/schema";
import type { Blueprint, BlueprintConfig } from "@/lib/blueprints";

export interface BlueprintInput {
  name: string;
  description: string;
  config: BlueprintConfig;
}

type BlueprintRow = typeof blueprintsTable.$inferSelect;

function rowToBlueprint(row: BlueprintRow): Blueprint {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    builtIn: false,
    config: row.config,
  };
}

/** The user's custom (DB-persisted) blueprints, newest first. */
export async function listUserBlueprints(userId: string): Promise<Blueprint[]> {
  try {
    const rows = await getDb()
      .select()
      .from(blueprintsTable)
      .where(eq(blueprintsTable.userId, userId))
      .orderBy(desc(blueprintsTable.createdAt));
    return rows.map(rowToBlueprint);
  } catch {
    // On a preview deploy (which deliberately skips migrations) the blueprints
    // table may not exist yet — degrade to "no custom blueprints" rather than
    // 500 the whole Drafting Table. Once the production deploy runs the
    // migration this path never trips. (Same defensive pattern as the
    // dashboard's getDueReviewCount.)
    return [];
  }
}

export async function createUserBlueprint(
  userId: string,
  input: BlueprintInput,
): Promise<Blueprint> {
  const [row] = await getDb()
    .insert(blueprintsTable)
    .values({
      userId,
      name: input.name,
      description: input.description,
      config: input.config,
    })
    .returning();
  return rowToBlueprint(row);
}

/** Scoped to the owner — a user can only delete their own blueprint. */
export async function deleteUserBlueprint(
  userId: string,
  id: string,
): Promise<void> {
  await getDb()
    .delete(blueprintsTable)
    .where(and(eq(blueprintsTable.id, id), eq(blueprintsTable.userId, userId)));
}

/**
 * One-time backfill of blueprints that previously lived in the browser's
 * localStorage. Idempotent: skips any whose name already exists for the user,
 * so a double-fire (or a user opening the app on two devices) never duplicates.
 * The client also sets a `migrated` flag, but this dedup is the durable guard.
 * Returns how many rows were actually inserted.
 */
export async function migrateLocalBlueprints(
  userId: string,
  items: BlueprintInput[],
): Promise<number> {
  if (items.length === 0) return 0;
  const existing = await getDb()
    .select({ name: blueprintsTable.name })
    .from(blueprintsTable)
    .where(eq(blueprintsTable.userId, userId));
  const seen = new Set(existing.map((e) => e.name));
  const fresh = items.filter((it) => !seen.has(it.name));
  if (fresh.length === 0) return 0;
  await getDb()
    .insert(blueprintsTable)
    .values(
      fresh.map((it) => ({
        userId,
        name: it.name,
        description: it.description,
        config: it.config,
      })),
    );
  return fresh.length;
}

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

function createDb() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize the database");
  }

  return drizzle(neon(databaseUrl), { schema });
}

type Database = ReturnType<typeof createDb>;

let db: Database | undefined;

export function getDb() {
  db ??= createDb();
  return db;
}

export { schema };

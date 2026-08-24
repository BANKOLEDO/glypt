import pg from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export type Db = pg.Pool;

let pool: pg.Pool | null = null;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): pg.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({ connectionString: url, max: 10 });
  }
  return pool;
}

export async function ensureSchema(db: pg.Pool): Promise<void> {
  const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "schema.sql");
  await db.query(readFileSync(schemaPath, "utf8"));
}

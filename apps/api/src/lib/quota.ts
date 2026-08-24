import type { Pool } from "pg";

export const FREE_DAILY_SEARCHES = 100;

// in-memory fallback so the api can run without a database (dev/demo)
const memory = new Map<string, { day: string; count: number }>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// counts searches per identity per UTC day; null remaining means unlimited
export async function consumeQuota(
  db: Pool | null,
  userId: string,
  plan = "free",
): Promise<{ unlimited: boolean; remaining: number | null }> {
  if (plan !== "free") return { unlimited: true, remaining: null };

  if (!db) {
    const day = today();
    const entry = memory.get(userId);
    if (!entry || entry.day !== day) {
      memory.set(userId, { day, count: 1 });
      return { unlimited: false, remaining: FREE_DAILY_SEARCHES - 1 };
    }
    entry.count += 1;
    return { unlimited: false, remaining: Math.max(0, FREE_DAILY_SEARCHES - entry.count) };
  }

  const { rows } = await db.query<{ count: number }>(
    `INSERT INTO usage_events (user_id, day, count) VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET count = usage_events.count + 1
     RETURNING count`,
    [userId],
  );
  const used = rows[0]?.count ?? 0;
  return { unlimited: false, remaining: Math.max(0, FREE_DAILY_SEARCHES - used) };
}

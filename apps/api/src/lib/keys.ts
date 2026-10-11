import { createHash, randomBytes } from "node:crypto";
import { getDb, hasDatabase } from "./db";

const KEY_PREFIX = "glypt_sk";

export type ApiKeyInfo = {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; hash: string; prefix: string; last4: string } {
  const secret = randomBytes(24).toString("base64url");
  const raw = `${KEY_PREFIX}_${secret}`;
  return { raw, hash: hashApiKey(raw), prefix: `${KEY_PREFIX}_${secret.slice(0, 6)}`, last4: secret.slice(-4) };
}

export async function createApiKey(
  userId: string,
  name: string,
): Promise<ApiKeyInfo & { secret: string }> {
  const { raw, hash, prefix, last4 } = generateApiKey();
  const { rows } = await getDb().query<{ id: string; created_at: string }>(
    "INSERT INTO api_keys (user_id, name, key_hash, prefix, last4) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at",
    [userId, name.slice(0, 60), hash, prefix, last4],
  );
  const row = rows[0]!;
  return { id: row.id, name, prefix, last4, createdAt: row.created_at, lastUsedAt: null, secret: raw };
}

export async function listApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  const { rows } = await getDb().query<{
    id: string;
    name: string;
    prefix: string;
    last4: string;
    created_at: string;
    last_used_at: string | null;
  }>(
    "SELECT id, name, prefix, last4, created_at, last_used_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    prefix: r.prefix,
    last4: r.last4,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

export async function revokeApiKey(userId: string, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { rowCount } = await getDb().query(
    "DELETE FROM api_keys WHERE user_id = $1 AND id = $2",
    [userId, id],
  );
  return (rowCount ?? 0) > 0;
}

export type ResolvedKey = { keyId: string; userId: string; plan: string };

export async function resolveApiKey(raw: string): Promise<ResolvedKey | null> {
  if (!hasDatabase() || raw.length < 20) return null;
  const { rows } = await getDb().query<{ id: string; user_id: string; plan: string }>(
    `SELECT k.id, k.user_id, u.plan FROM api_keys k
     JOIN users u ON u.id = k.user_id
     WHERE k.key_hash = $1`,
    [hashApiKey(raw)],
  );
  const row = rows[0];
  if (!row) return null;
  await getDb()
    .query("UPDATE api_keys SET last_used_at = now() WHERE id = $1", [row.id])
    .catch(() => undefined);
  return { keyId: row.id, userId: row.user_id, plan: row.plan };
}

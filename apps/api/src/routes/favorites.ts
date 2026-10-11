import { Router } from "express";
import { z } from "zod";
import { getDb, hasDatabase } from "../lib/db";
import { attachIdentity } from "../lib/middleware";

export const favoritesRouter = Router();

const schema = z.object({ iconId: z.string().min(3).max(80) });

function userIdOf(req: never): string | undefined {
  return (req as unknown as { identity?: { userId?: string } }).identity?.userId;
}

// in-memory fallback when running without a database
const memory = new Map<string, Set<string>>();

function memAdd(uid: string, iconId: string): void {
  const set = memory.get(uid) ?? new Set<string>();
  set.add(iconId);
  memory.set(uid, set);
}

function memRemove(uid: string, iconId: string): void {
  memory.get(uid)?.delete(iconId);
}

favoritesRouter.get("/", attachIdentity, async (req, res) => {
  const uid = userIdOf(req as never);
  if (!uid) {
    res.json({ icons: [] });
    return;
  }
  if (!hasDatabase()) {
    res.json({ icons: [...(memory.get(uid) ?? [])] });
    return;
  }
  try {
    const { rows } = await getDb().query<{ icon_id: string }>(
      "SELECT icon_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200",
      [uid],
    );
    res.json({ icons: rows.map((r) => r.icon_id) });
  } catch {
    res.json({ icons: [] });
  }
});

favoritesRouter.post("/", attachIdentity, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  const uid = userIdOf(req as never);
  if (!parsed.success || !uid) {
    res.status(400).json({ error: "iconId required" });
    return;
  }
  if (!hasDatabase()) {
    memAdd(uid, parsed.data.iconId);
  } else {
    await getDb().query(
      "INSERT INTO favorites (user_id, icon_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [uid, parsed.data.iconId],
    );
  }
  res.status(201).json({ ok: true });
});

favoritesRouter.delete("/", attachIdentity, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  const uid = userIdOf(req as never);
  if (!parsed.success || !uid) {
    res.status(400).json({ error: "iconId required" });
    return;
  }
  if (!hasDatabase()) {
    memRemove(uid, parsed.data.iconId);
  } else {
    await getDb().query("DELETE FROM favorites WHERE user_id = $1 AND icon_id = $2", [
      uid,
      parsed.data.iconId,
    ]);
  }
  res.json({ ok: true });
});

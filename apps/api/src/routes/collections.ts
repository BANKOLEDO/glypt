import { Router } from "express";
import { z } from "zod";
import { getDb } from "../lib/db";
import { attachIdentity } from "../lib/middleware";

export const collectionsRouter = Router();

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#FF5A1F"),
});
const patchSchema = createSchema.partial();
const addSchema = z.object({ iconId: z.string().min(3).max(80) });

function userIdOf(req: never): string | undefined {
  return (req as unknown as { identity?: { userId?: string } }).identity?.userId;
}

collectionsRouter.get("/", attachIdentity, async (req, res) => {
  const uid = userIdOf(req as never);
  if (!uid) {
    res.json({ collections: [] });
    return;
  }
  const db = getDb();
  const { rows } = await db.query(
    `SELECT c.id, c.name, c.color, c.created_at AS "createdAt",
            COUNT(ci.icon_id)::int AS count,
            COALESCE(ARRAY_AGG(ci.icon_id ORDER BY ci.added_at) FILTER (WHERE ci.icon_id IS NOT NULL), '{}') AS icons
     FROM collections c LEFT JOIN collection_icons ci ON ci.collection_id = c.id
     WHERE c.user_id = $1 GROUP BY c.id ORDER BY c.created_at DESC`,
    [uid],
  );
  res.json({ collections: rows });
});

collectionsRouter.post("/", attachIdentity, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  const uid = userIdOf(req as never);
  if (!parsed.success || !uid) {
    res.status(400).json({ error: "name required" });
    return;
  }
  const { rows } = await getDb()
    .query("INSERT INTO collections (user_id, name, color) VALUES ($1,$2,$3) RETURNING id, name, color", [
      uid,
      parsed.data.name,
      parsed.data.color,
    ]);
  res.status(201).json(rows[0]);
});

collectionsRouter.patch("/:id", attachIdentity, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  const uid = userIdOf(req as never);
  if (!parsed.success || !uid) {
    res.status(400).json({ error: "invalid update" });
    return;
  }
  const fields = Object.entries(parsed.data).filter(([, v]) => v !== undefined);
  if (!fields.length) {
    res.status(400).json({ error: "nothing to update" });
    return;
  }
  const sets = fields.map(([k], i) => `"${k}" = $${i + 3}`);
  const values = fields.map(([, v]) => v);
  const { rows } = await getDb()
    .query(
      `UPDATE collections SET ${sets.join(", ")} WHERE id = $1 AND user_id = $2 RETURNING id, name, color`,
      [req.params.id, uid, ...values],
    );
  if (!rows.length) {
    res.status(404).json({ error: "collection not found" });
    return;
  }
  res.json(rows[0]);
});

collectionsRouter.delete("/:id", attachIdentity, async (req, res) => {
  const uid = userIdOf(req as never);
  if (!uid) {
    res.status(401).json({ error: "identity required" });
    return;
  }
  await getDb().query("DELETE FROM collections WHERE id = $1 AND user_id = $2", [req.params.id, uid]);
  res.json({ ok: true });
});

collectionsRouter.post("/:id/icons", attachIdentity, async (req, res) => {
  const parsed = addSchema.safeParse(req.body);
  const uid = userIdOf(req as never);
  if (!parsed.success || !uid) {
    res.status(400).json({ error: "iconId required" });
    return;
  }
  const owned = await getDb().query("SELECT id FROM collections WHERE id = $1 AND user_id = $2", [
    req.params.id,
    uid,
  ]);
  if (!owned.rowCount) {
    res.status(404).json({ error: "collection not found" });
    return;
  }
  await getDb().query(
    "INSERT INTO collection_icons (collection_id, icon_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [req.params.id, parsed.data.iconId],
  );
  res.status(201).json({ ok: true });
});

collectionsRouter.delete("/:id/icons/:iconId", attachIdentity, async (req, res) => {
  const uid = userIdOf(req as never);
  if (!uid) {
    res.status(401).json({ error: "identity required" });
    return;
  }
  await getDb().query(
    `DELETE FROM collection_icons USING collections
     WHERE collections.id = collection_icons.collection_id AND collections.id = $1 AND collections.user_id = $2 AND collection_icons.icon_id = $3`,
    [req.params.id, uid, req.params.iconId],
  );
  res.json({ ok: true });
});

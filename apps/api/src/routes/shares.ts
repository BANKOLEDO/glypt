import { Router } from "express";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getDb } from "../lib/db";

export const sharesRouter = Router();

const schema = z.object({
  kind: z.enum(["atlas", "brand", "collection"]),
  payload: z.record(z.string(), z.unknown()),
});

function newShareToken(): string {
  return randomBytes(8).toString("base64url");
}

// in-memory fallback when running without a database
const memory = new Map<string, { kind: string; payload: unknown; createdAt: string }>();

sharesRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "kind and payload required" });
    return;
  }
  const token = newShareToken();
  if (!process.env.DATABASE_URL) {
    memory.set(token, { kind: parsed.data.kind, payload: parsed.data.payload, createdAt: new Date().toISOString() });
  } else {
    await getDb().query("INSERT INTO shares (token, user_id, kind, payload) VALUES ($1,$2,$3,$4::jsonb)", [
      token,
      "anon",
      parsed.data.kind,
      JSON.stringify(parsed.data.payload),
    ]);
  }
  res.status(201).json({ token, url: `/s/${token}` });
});

sharesRouter.get("/:token", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    const hit = memory.get(req.params.token);
    if (!hit) {
      res.status(404).json({ error: "share not found" });
      return;
    }
    res.json(hit);
    return;
  }
  const { rows } = await getDb().query<{ kind: string; payload: unknown; created_at: string }>(
    "SELECT kind, payload, created_at FROM shares WHERE token = $1",
    [req.params.token],
  );
  if (!rows.length) {
    res.status(404).json({ error: "share not found" });
    return;
  }
  res.json({ kind: rows[0]!.kind, payload: rows[0]!.payload, createdAt: rows[0]!.created_at });
});

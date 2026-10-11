import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { searchIcons, extractBrand, safePalette, socialSvg, deckHtml } from "@glypt/core";
import { getDb, hasDatabase } from "../lib/db";
import { resolveApiKey } from "../lib/keys";

export const v1Router = Router();

async function authenticate(req: { headers: Record<string, unknown> }): Promise<{ userId: string } | null> {
  const provided = String(req.headers["x-api-key"] ?? "");
  if (!provided) return null;
  const admin = process.env.ADMIN_TOKEN;
  if (admin && provided === admin) return { userId: "admin" };
  const key = await resolveApiKey(provided);
  return key ? { userId: key.userId } : null;
}

async function meter(
  userId: string,
  res: { setHeader: (k: string, v: string) => void },
): Promise<void> {
  res.setHeader("x-quota-remaining", "unlimited");
  if (!hasDatabase()) return;
  try {
    const { rows } = await getDb().query<{ count: number }>(
      `INSERT INTO usage_events (user_id, day, count) VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (user_id, day) DO UPDATE SET count = usage_events.count + 1
       RETURNING count`,
      [userId],
    );
    res.setHeader("x-quota-remaining", String(Math.max(0, 5000 - (rows[0]?.count ?? 0))));
  } catch {
    // metering is best-effort; never fail the request over it
  }
}

const generateSchema = z.object({
  domain: z.string().min(3).max(200),
  kind: z.enum(["social", "deck"]).default("social"),
  title: z.string().max(60).optional(),
  subtitle: z.string().max(120).optional(),
});

v1Router.get("/icons/search", async (req, res) => {
  const auth = await authenticate(req);
  if (!auth) {
    res.status(401).json({ error: "missing or invalid x-api-key" });
    return;
  }
  try {
    await meter(auth.userId, res);
    const q = String((req.query.q as string | undefined) ?? "arrow");
    const limit = Math.min(Math.max(Number(req.query.limit ?? 24) || 24, 1), 64);
    const result = await searchIcons(q, limit);
    res.json({ query: q, icons: result.icons, total: result.total });
  } catch {
    res.status(502).json({ error: "icon provider unavailable" });
  }
});

v1Router.post("/generate", async (req, res) => {
  const auth = await authenticate(req);
  if (!auth) {
    res.status(401).json({ error: "missing or invalid x-api-key" });
    return;
  }
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  try {
    await meter(auth.userId, res);
    const kit = await extractBrand(parsed.data.domain);
    if (!kit) {
      res.status(400).json({ error: "invalid domain" });
      return;
    }
    const brand = { ...kit, palette: safePalette(kit.palette) };
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);
    if (parsed.data.kind === "deck") {
      res.json({ id: requestId, kind: "deck", html: deckHtml(brand) });
      return;
    }
    res.json({
      id: requestId,
      kind: "social",
      svg: socialSvg(brand, parsed.data.title ?? brand.name, parsed.data.subtitle ?? ""),
    });
  } catch {
    res.status(502).json({ error: "generation failed" });
  }
});


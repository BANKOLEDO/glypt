import { Router } from "express";
import { z } from "zod";
import { extractBrand, socialSvg, deckHtml, mockupSvg, safePalette } from "@glypt/core";
import { getDb } from "../lib/db";

export const brandRouter = Router();
const bodySchema = z.object({ domain: z.string().min(3).max(200) });

brandRouter.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "domain required" });
    return;
  }
  const kit = await extractBrand(parsed.data.domain);
  if (!kit) {
    res.status(400).json({ error: "invalid domain" });
    return;
  }
  res.json(kit);
});

// persist a brand kit + generated tokens for the signed-in identity
brandRouter.post("/save", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "domain required" });
    return;
  }
  const userId = (req as never as { identity?: { userId?: string } }).identity?.userId;
  if (!userId) {
    res.status(401).json({ error: "sign in to save brand kits" });
    return;
  }
  const kit = await extractBrand(parsed.data.domain);
  if (!kit) {
    res.status(400).json({ error: "invalid domain" });
    return;
  }
  const palette = safePalette(kit.palette).slice(0, 5);
  const tokens = buildTokens(kit.name, palette);
  const db = getDb();
  const { rows } = await db.query(
    `INSERT INTO brands (user_id, domain, name, favicon, palette, logo_candidates, og_image, description, tokens_json)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9::jsonb)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [
      userId,
      kit.domain,
      kit.name,
      kit.favicon,
      JSON.stringify(palette),
      JSON.stringify(kit.logoCandidates),
      kit.ogImage,
      kit.description,
      JSON.stringify(tokens),
    ],
  );
  res.json({ id: rows[0]?.id, kit: { ...kit, palette }, tokens });
});

function buildTokens(name: string, palette: string[]) {
  return {
    $schema: "https://design-tokens.org/draft",
    brand: name,
    color: Object.fromEntries(palette.map((c, i) => [`brand${i + 1}`, { value: c, type: "color" }])),
    radius: { sm: { value: "10px", type: "dimension" }, md: { value: "16px", type: "dimension" }, lg: { value: "24px", type: "dimension" }, full: { value: "9999px", type: "dimension" } },
    shadow: { rest: { value: "0 4px 0 rgba(34,27,21,.12)", type: "shadow" }, pop: { value: "0 10px 30px -12px rgba(34,27,21,.35)", type: "shadow" } },
    font: { display: { value: "'Basier Square', system-ui", type: "fontFamily" }, label: { value: "'JetBrains Mono', monospace", type: "fontFamily" } },
  };
}

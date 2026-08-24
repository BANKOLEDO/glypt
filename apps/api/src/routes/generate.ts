import { Router } from "express";
import { z } from "zod";
import { extractBrand, safePalette, socialSvg, deckHtml, mockupSvg } from "@glypt/core";

export const generateRouter = Router();

const schema = z.object({
  domain: z.string().min(3).max(200),
  kind: z.enum(["social", "deck", "mockup"]).default("social"),
  title: z.string().max(60).optional(),
  subtitle: z.string().max(120).optional(),
  imageUrl: z.string().url().optional(),
  frame: z.enum(["browser", "phone"]).optional(),
});

generateRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  const input = parsed.data;

  if (input.kind === "mockup") {
    if (!input.imageUrl || !/^https:\/\//i.test(input.imageUrl)) {
      res.status(400).json({ error: "imageUrl must be an https url for mockups" });
      return;
    }
    const svg = mockupSvg(input.imageUrl, input.frame ?? "browser");
    if (!svg) {
      res.status(400).json({ error: "invalid image url" });
      return;
    }
    res.json({ kind: "mockup", svg });
    return;
  }

  const kit = await extractBrand(input.domain);
  if (!kit) {
    res.status(400).json({ error: "invalid domain" });
    return;
  }
  const brand = { ...kit, palette: safePalette(kit.palette) };
  if (input.kind === "deck") {
    res.json({ kind: "deck", html: deckHtml(brand) });
    return;
  }
  res.json({ kind: "social", svg: socialSvg(brand, input.title ?? brand.name, input.subtitle ?? "") });
});

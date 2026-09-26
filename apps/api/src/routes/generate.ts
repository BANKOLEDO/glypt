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

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function fetchAsInlineImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

generateRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  const input = parsed.data;

  if (input.kind === "mockup") {
    if (!input.imageUrl || !/^https:\/\//i.test(input.imageUrl)) {
      res.status(400).json({ error: "imageUrl must be an https image url for mockups" });
      return;
    }
    // pull the image server-side so it renders anywhere, even in an <img>
    const inline = await fetchAsInlineImage(input.imageUrl);
    const svg = inline ? mockupSvg(inline, input.frame ?? "browser") : null;
    if (!svg) {
      res.status(502).json({ error: "could not load that image (url may be invalid or expired)" });
      return;
    }
    res.json({ kind: "mockup", src: input.imageUrl, svg });
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

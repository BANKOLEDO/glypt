import { Router } from "express";
import { searchIcons, fetchIconSvg, isValidIconId } from "@glypt/core";
import { attachIdentity, meterQuota, issueDeviceCookie } from "../lib/middleware";

export const searchRouter = Router();
export const iconRouter = Router();

searchRouter.get("/", attachIdentity, meterQuota, async (req, res) => {
  issueDeviceCookie(res, req as never);
  const q = String(req.query.q ?? "").slice(0, 100);
  const limitRaw = Number(req.query.limit ?? 24);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 24, 1), 32);
  try {
    const result = await searchIcons(q || "arrow", limit);
    res.json(result);
  } catch {
    res.status(502).json({ error: "icon provider unavailable" });
  }
});

iconRouter.get("/", async (req, res) => {
  const prefix = String(req.query.prefix ?? "");
  const name = String(req.query.name ?? "");
  const svg = await fetchIconSvg(`${prefix}:${name}`);
  if (!svg) {
    res.status(404).json({ error: "icon not found" });
    return;
  }
  res.setHeader("content-type", "image/svg+xml");
  res.setHeader("cache-control", "public, max-age=86400");
  res.send(svg);
});

export function assertValidIds(ids: unknown): ids is string[] {
  return Array.isArray(ids) && ids.length > 0 && ids.length <= 32 && ids.every((i) => typeof i === "string" && isValidIconId(i));
}

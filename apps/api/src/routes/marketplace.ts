import { Router } from "express";
import { z } from "zod";
import { getDb } from "../lib/db";
import { attachIdentity, issueDeviceCookie } from "../lib/middleware";

export const marketplaceRouter = Router();

type CollectionMeta = { name: string; license: string | null };
let cache: { at: number; data: Record<string, CollectionMeta> } | null = null;
const TTL = 60 * 60 * 1000;

async function curatedCollections(): Promise<Record<string, CollectionMeta>> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const res = await fetch("https://api.iconify.design/collections");
  if (!res.ok) throw new Error(`iconify collections failed: ${res.status}`);
  const all = (await res.json()) as {
    prefixes?: string[];
    [prefix: string]: unknown;
  };
  // /collections returns a flat map keyed by prefix (plus a `prefixes` index)
  const entries = Object.entries(all).filter(
    ([k, v]) => k !== "prefixes" && typeof v === "object" && v !== null,
  );
  const out: Record<string, CollectionMeta> = {};
  for (const [prefix, v] of entries) {
    const meta = v as { name?: string; license?: { title?: string } };
    out[prefix] = { name: meta.name ?? prefix, license: meta.license?.title ?? null };
  }
  cache = { at: Date.now(), data: out };
  return out;
}

marketplaceRouter.get("/", async (req, res) => {
  issueDeviceCookie(res, req as never);
  try {
    const q = String(req.query.q ?? "").toLowerCase();
    const all = await curatedCollections();
    const filtered = Object.entries(all)
      .filter(([p, m]) => !q || p.includes(q) || m.name.toLowerCase().includes(q))
      .sort((a, b) => a[0].localeCompare(b[0]));
    res.json({
      total: filtered.length,
      collections: filtered.slice(0, 60).map(([prefix, meta]) => ({ prefix, ...meta })),
    });
  } catch {
    res.status(502).json({ error: "icon provider unavailable" });
  }
});

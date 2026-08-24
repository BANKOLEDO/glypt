import { Router } from "express";
import { z } from "zod";
import { fetchIconSvg, buildRefs, isValidIconId } from "@glypt/core";
import { newDeviceId } from "@glypt/core/identity";
import { DEVICE_COOKIE } from "../lib/auth";

export const atlasRouter = Router();

const bodySchema = z.object({ icons: z.array(z.string()), cols: z.number().int().min(2).max(4).optional() });
const resolveSchema = z.object({ refs: z.array(z.string().regex(/^[A-H][1-8]$/)).min(1).max(16) });

// deviceId -> { ref: iconId }; single-node store, fine for now
const sessions = new Map<string, Record<string, string>>();

const DEMO_ICONS = [
  "lucide:home", "heroicons:user", "ph:star", "tabler:heart",
  "mdi:rocket-launch", "lucide:search", "ph:lightning", "heroicons:cog-6-tooth",
  "tabler:bell", "mdi:magnify", "lucide:settings", "ph:user-circle",
];

type DemoCell = { ref: string; id: string; svg: string | null };
let demoCache: { cols: number; cells: DemoCell[] } | null = null;

atlasRouter.get("/", async (req, res) => {
  if (demoCache && !("nocache" in req.query)) {
    res.json(demoCache);
    return;
  }
  const cols = Math.min(4, Math.max(2, Number(req.query.cols ?? 4) || 4));
  const refs = buildRefs(DEMO_ICONS.length, cols);
  const svgs = await Promise.all(
    DEMO_ICONS.map((id) => fetchIconSvg(id).catch(() => null)),
  );
  const cells: DemoCell[] = refs.map((r) => ({
    ref: r.ref,
    id: DEMO_ICONS[r.index]!,
    svg: svgs[r.index],
  }));
  demoCache = { cols, cells };
  res.json(demoCache);
});

atlasRouter.post("/", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "icons must be a list of at most 32 valid ids" });
    return;
  }
  const ids = parsed.data.icons.slice(0, 32);
  if (!ids.length || !ids.every((i) => isValidIconId(i))) {
    res.status(400).json({ error: "invalid icon id" });
    return;
  }

  let did = req.cookies?.[DEVICE_COOKIE];
  if (!did) {
    did = newDeviceId();
    res.cookie(DEVICE_COOKIE, did, { httpOnly: true, sameSite: "lax", path: "/" });
  }

  const cols = parsed.data.cols ?? Math.min(4, Math.max(2, Math.ceil(Math.sqrt(ids.length))));
  const refs = buildRefs(ids.length, cols);

  const svgs = await Promise.all(
    ids.map(async (id) => {
      try {
        return await fetchIconSvg(id);
      } catch {
        return null;
      }
    }),
  );

  // remember ref -> id for the resolving step
  const map: Record<string, string> = {};
  refs.forEach((r) => {
    map[r.ref] = ids[r.index]!;
  });
  sessions.set(did, map);
  if (sessions.size > 5000) {
    const first = sessions.keys().next().value;
    if (first) sessions.delete(first);
  }

  res.json({
    cols,
    refs,
    icons: refs.map((r) => ({ ref: r.ref, id: ids[r.index], svg: svgs[r.index] })),
  });
});

atlasRouter.post("/resolve", async (req, res) => {
  const parsed = resolveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "refs must look like A1..H8" });
    return;
  }
  const did = req.cookies?.[DEVICE_COOKIE];
  const map = did ? sessions.get(did) : undefined;
  if (!map) {
    res.status(404).json({ error: "no active atlas session" });
    return;
  }
  const out: Record<string, string> = {};
  for (const ref of parsed.data.refs) {
    if (map[ref]) out[ref] = map[ref];
  }
  res.json(out);
});

import { Router } from "express";
import { z } from "zod";
import { userFromRequest, type SessionUser } from "../lib/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "../lib/keys";
import { hasDatabase } from "../lib/db";

export const apiKeysRouter = Router();

async function requireUser(
  req: Parameters<typeof userFromRequest>[0],
  res: { status: (n: number) => { json: (b: unknown) => void } },
): Promise<SessionUser | null> {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return null;
  }
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "sign in required" });
    return null;
  }
  return user;
}

const createSchema = z.object({ name: z.string().trim().min(1).max(60) });

apiKeysRouter.get("/", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  res.json({ keys: await listApiKeys(user.id) });
});

apiKeysRouter.post("/", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "a key name is required" });
    return;
  }
  const key = await createApiKey(user.id, parsed.data.name);
  res.status(201).json({
    key: {
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      last4: key.last4,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    },
    secret: key.secret,
  });
});

apiKeysRouter.delete("/:id", async (req, res) => {
  const user = await requireUser(req, res);
  if (!user) return;
  const removed = await revokeApiKey(user.id, req.params.id);
  if (!removed) {
    res.status(404).json({ error: "key not found" });
    return;
  }
  res.json({ ok: true });
});

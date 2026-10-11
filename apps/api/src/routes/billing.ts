import { Router } from "express";
import { z } from "zod";
import { userFromRequest } from "../lib/auth";
import { hasDatabase } from "../lib/db";
import {
  bachsConfigured,
  createCheckoutSession,
  isPlanId,
  verifyWebhookSignature,
} from "../lib/bachs";
import { applyWebhookEvent, recordCheckout, setUserPlan, type WebhookEvent } from "../lib/billing";

export const billingRouter = Router();

function header(req: { headers: Record<string, unknown> }, name: string): string | undefined {
  const value = req.headers[name];
  return typeof value === "string" ? value : undefined;
}

billingRouter.get("/plan", async (req, res) => {
  const user = await userFromRequest(req).catch(() => null);
  res.json({ plan: user?.plan ?? "free", checkout: bachsConfigured() });
});

billingRouter.post("/checkout", async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return;
  }
  if (!bachsConfigured()) {
    res.status(503).json({ error: "billing is not configured yet" });
    return;
  }
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "sign in required" });
    return;
  }
  const parsed = z.object({ plan: z.unknown() }).safeParse(req.body);
  if (!parsed.success || !isPlanId(parsed.data.plan)) {
    res.status(400).json({ error: "unknown plan" });
    return;
  }
  try {
    const session = await createCheckoutSession({
      plan: parsed.data.plan,
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await recordCheckout(session.checkoutId, user.id, parsed.data.plan);
    res.json({ url: session.url });
  } catch (err) {
    console.error("glypt billing: checkout failed", err);
    res.status(502).json({ error: "could not start checkout, please try again" });
  }
});

billingRouter.post("/cancel", async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return;
  }
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "sign in required" });
    return;
  }
  await setUserPlan(user.id, "free");
  res.json({ plan: "free" });
});

billingRouter.post("/webhook", async (req, res) => {
  const raw = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));

  const secret = process.env.BACHS_WEBHOOK_SECRET;
  if (secret) {
    const ok = verifyWebhookSignature(
      raw,
      {
        v2: header(req, "x-bachs-signature-v2"),
        timestamp: header(req, "x-bachs-timestamp"),
        signature: header(req, "x-bachs-signature"),
      },
      secret,
    );
    if (!ok) {
      res.status(400).json({ error: "invalid signature" });
      return;
    }
  } else {
    console.warn("glypt billing: BACHS_WEBHOOK_SECRET not set - skipping signature check");
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw.toString("utf8")) as WebhookEvent;
  } catch {
    res.status(400).json({ error: "invalid payload" });
    return;
  }

  if (hasDatabase()) {
    try {
      await applyWebhookEvent(event);
    } catch (err) {
      console.error("glypt billing: webhook failed", err);
      res.status(500).json({ error: "processing failed" });
      return;
    }
  }
  res.json({ received: true });
});

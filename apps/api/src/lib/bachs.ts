import { createHmac, timingSafeEqual } from "node:crypto";

export type PlanId = "pro" | "team";

// Bachs prices are decimal strings at the currency's precision (never minor units).
export const PAID_PLANS: Record<PlanId, { name: string; amount: string; currency: string }> = {
  pro: { name: "Pro", amount: "19.00", currency: "USD" },
  team: { name: "Team", amount: "49.00", currency: "USD" },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "pro" || value === "team";
}

export function bachsConfigured(): boolean {
  return Boolean(process.env.BACHS_API_KEY);
}

function bachsBase(): string {
  return (process.env.BACHS_API_BASE ?? "https://api.bachs.io").replace(/\/+$/, "");
}

function webOrigin(): string {
  return (
    process.env.WEB_ORIGIN?.split(",")[0]?.trim() ?? "http://localhost:5173"
  );
}

export type CheckoutSession = { checkoutId: string; url: string };

export async function createCheckoutSession(input: {
  plan: PlanId;
  userId: string;
  email: string;
  name?: string | null;
}): Promise<CheckoutSession> {
  const apiKey = process.env.BACHS_API_KEY;
  if (!apiKey) throw new Error("billing is not configured");

  const plan = PAID_PLANS[input.plan];
  const origin = webOrigin();
  const res = await fetch(`${bachsBase()}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // product-less checkout priced from the amount alone
      pricing: { currency: plan.currency, amount: plan.amount, price_type: "fixed" },
      customer: {
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
      },
      success_url: `${origin}/account?billing=success`,
      cancel_url: `${origin}/account?billing=cancelled`,
      metadata: { userId: input.userId, plan: input.plan },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    checkout_id?: string;
    checkout_url?: string;
    detail?: string;
  };
  if (!res.ok || !data.checkout_id || !data.checkout_url) {
    throw new Error(data.detail ?? "could not start checkout");
  }
  return { checkoutId: data.checkout_id, url: data.checkout_url };
}

// Every delivery carries X-Bachs-Signature-V2 = "t=<ts>,v1=<sig>" (v1 may repeat
// during a secret rotation). The digest is HMAC-SHA256 hex of "<ts>.<raw body>".
export function verifyWebhookSignature(
  rawBody: Buffer,
  headers: { v2?: string; timestamp?: string; signature?: string },
  secret: string,
  toleranceSeconds = 300,
): boolean {
  let timestamp = headers.timestamp;
  const signatures: string[] = [];

  if (headers.v2) {
    for (const part of headers.v2.split(",")) {
      const [key, value] = part.trim().split("=");
      if (key === "t" && value) timestamp = value;
      if (key === "v1" && value) signatures.push(value);
    }
  }
  if (headers.signature) signatures.push(headers.signature);

  if (!timestamp || signatures.length === 0) return false;
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(Date.now() / 1000 - sentAt) > toleranceSeconds) return false;

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex"),
  );
  return signatures.some((sig) => {
    const buf = Buffer.from(sig);
    return buf.length === expected.length && timingSafeEqual(buf, expected);
  });
}

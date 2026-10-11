import { getDb } from "./db";
import { isUuid } from "./keys";
import { isPlanId, type PlanId } from "./bachs";

export async function recordCheckout(
  checkoutId: string,
  userId: string,
  plan: PlanId,
): Promise<void> {
  await getDb().query(
    `INSERT INTO billing_checkouts (checkout_id, user_id, plan_pending)
     VALUES ($1, $2, $3)
     ON CONFLICT (checkout_id) DO UPDATE SET plan_pending = EXCLUDED.plan_pending`,
    [checkoutId, userId, plan],
  );
}

export type WebhookEvent = {
  id?: string;
  type?: string;
  created_at?: string;
  data?: Record<string, unknown>;
};

// Treat webhooks as the source of truth for fulfilment. Both checkout.completed
// and collection.succeeded can fire for one payment, so dedupe by event id and
// only ever upgrade a checkout once.
export async function applyWebhookEvent(
  event: WebhookEvent,
): Promise<{ handled: boolean; plan?: string }> {
  const db = getDb();
  const type = event.type ?? "";
  const eventId = event.id ?? "";

  if (eventId) {
    const seen = await db.query(
      "INSERT INTO payment_events (event_id, type) VALUES ($1, $2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id",
      [eventId, type],
    );
    if ((seen.rowCount ?? 0) === 0) return { handled: false }; // at-least-once: duplicate
  }

  if (type !== "collection.succeeded" && type !== "checkout.completed") {
    return { handled: false };
  }

  const data = event.data ?? {};
  const checkoutId = firstString(data, ["checkout_id", "checkout_session_id"]) ?? nestedCheckoutId(data);
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};

  let userId = isUuid(String(metadata.userId ?? "")) ? String(metadata.userId) : null;
  let plan: PlanId | null = isPlanId(metadata.plan) ? metadata.plan : null;

  if (checkoutId) {
    const { rows } = await db.query<{ user_id: string; plan_pending: string; fulfilled_at: string | null }>(
      "SELECT user_id, plan_pending, fulfilled_at FROM billing_checkouts WHERE checkout_id = $1",
      [checkoutId],
    );
    const row = rows[0];
    if (row) {
      if (row.fulfilled_at) return { handled: false }; // already upgraded
      userId = userId ?? row.user_id;
      plan = plan ?? (isPlanId(row.plan_pending) ? row.plan_pending : null);
      await db.query("UPDATE billing_checkouts SET fulfilled_at = now() WHERE checkout_id = $1", [checkoutId]);
    }
  }

  if (!userId || !plan) return { handled: false };

  await db.query("UPDATE users SET plan = $1 WHERE id = $2", [plan, userId]);
  if (eventId) {
    await db
      .query("UPDATE payment_events SET user_id = $1, plan = $2 WHERE event_id = $3", [userId, plan, eventId])
      .catch(() => undefined);
  }
  console.log(`glypt billing: upgraded ${userId} to ${plan}`);
  return { handled: true, plan };
}

function firstString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

function nestedCheckoutId(data: Record<string, unknown>): string | null {
  const checkout = data.checkout;
  if (checkout && typeof checkout === "object") {
    const id = (checkout as Record<string, unknown>).checkout_id ?? (checkout as Record<string, unknown>).id;
    if (typeof id === "string" && id) return id;
  }
  return null;
}

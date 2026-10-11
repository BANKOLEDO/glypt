import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { isPlanId, PAID_PLANS, verifyWebhookSignature } from "../../apps/api/src/lib/bachs";

function sign(secret: string, ts: number, body: string): string {
  return createHmac("sha256", secret).update(`${ts}.`).update(body).digest("hex");
}

describe("bachs helpers", () => {
  it("recognizes paid plan ids only", () => {
    expect(isPlanId("pro")).toBe(true);
    expect(isPlanId("team")).toBe(true);
    expect(isPlanId("free")).toBe(false);
    expect(isPlanId("enterprise")).toBe(false);
    expect(isPlanId(undefined)).toBe(false);
  });

  it("prices plans as decimal strings", () => {
    expect(PAID_PLANS.pro.amount).toBe("19.00");
    expect(PAID_PLANS.team.amount).toBe("49.00");
    expect(PAID_PLANS.pro.currency).toBe("USD");
  });

  it("verifies an X-Bachs-Signature-V2 delivery", () => {
    const secret = "whsec_test";
    const body = JSON.stringify({ id: "evt_1", type: "collection.succeeded" });
    const ts = Math.floor(Date.now() / 1000);
    const raw = Buffer.from(body);
    expect(verifyWebhookSignature(raw, { v2: `t=${ts},v1=${sign(secret, ts, body)}` }, secret)).toBe(true);
    expect(verifyWebhookSignature(raw, { v2: `t=${ts},v1=${sign(secret, ts, body)}` }, "wrong")).toBe(false);
  });

  it("accepts any v1 value while a secret is rotating", () => {
    const secret = "whsec_test";
    const body = "{}";
    const ts = Math.floor(Date.now() / 1000);
    const good = sign(secret, ts, body);
    const header = `t=${ts},v1=${"0".repeat(good.length)},v1=${good}`;
    expect(verifyWebhookSignature(Buffer.from(body), { v2: header }, secret)).toBe(true);
  });

  it("verifies the plain signature and timestamp headers", () => {
    const secret = "whsec_test";
    const body = '{"id":"evt_2"}';
    const ts = Math.floor(Date.now() / 1000);
    const ok = verifyWebhookSignature(
      Buffer.from(body),
      { timestamp: String(ts), signature: sign(secret, ts, body) },
      secret,
    );
    expect(ok).toBe(true);
  });

  it("rejects stale timestamps and missing signatures", () => {
    const secret = "whsec_test";
    const body = "{}";
    const old = Math.floor(Date.now() / 1000) - 4000;
    expect(verifyWebhookSignature(Buffer.from(body), { v2: `t=${old},v1=${sign(secret, old, body)}` }, secret)).toBe(false);
    expect(verifyWebhookSignature(Buffer.from(body), {}, secret)).toBe(false);
  });
});

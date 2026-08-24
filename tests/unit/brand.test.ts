import { describe, expect, it } from "vitest";
import { normalizeDomain } from "@glypt/core";
import { FREE_DAILY_SEARCHES } from "../../apps/api/src/lib/quota";

describe("normalizeDomain", () => {
  it("accepts bare and url-wrapped domains", () => {
    expect(normalizeDomain("apple.com")).toBe("apple.com");
    expect(normalizeDomain("https://stripe.com/pricing")).toBe("stripe.com");
    expect(normalizeDomain("HTTP://VERCEL.COM")).toBe("vercel.com");
    expect(normalizeDomain("sub.domain.example.co.uk")).toBe("sub.domain.example.co.uk");
  });

  it("rejects garbage", () => {
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("javascript:alert(1)")).toBeNull();
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain("-bad.com")).toBeNull();
  });
});

describe("quota constants", () => {
  it("free tier allows 100 searches/day per spec", () => {
    expect(FREE_DAILY_SEARCHES).toBe(100);
  });
});

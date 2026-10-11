import { describe, expect, it } from "vitest";
import { generateApiKey, hashApiKey, isUuid } from "../../apps/api/src/lib/keys";

describe("api key helpers", () => {
  it("generates unique, prefixed keys with a last4", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.raw.startsWith("glypt_sk_")).toBe(true);
    expect(a.raw).not.toBe(b.raw);
    expect(a.prefix.startsWith("glypt_sk_")).toBe(true);
    expect(a.last4).toHaveLength(4);
    expect(a.raw.endsWith(a.last4)).toBe(true);
  });

  it("hashes deterministically with sha256", () => {
    const { raw, hash } = generateApiKey();
    expect(hashApiKey(raw)).toBe(hash);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashApiKey("hello")).toBe(hashApiKey("hello"));
    expect(hashApiKey("hello")).not.toBe(hashApiKey("world"));
  });

  it("recognizes uuids only", () => {
    expect(isUuid("2b1f4c6e-0a3d-4b7c-9e1f-1234567890ab")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});

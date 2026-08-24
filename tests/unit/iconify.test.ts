import { describe, expect, it } from "vitest";
import { buildRefs, isValidIconId } from "@glypt/core";

describe("isValidIconId", () => {
  it("accepts well-formed prefix:name ids", () => {
    expect(isValidIconId("lucide:rocket")).toBe(true);
    expect(isValidIconId("simple-icons:github")).toBe(true);
    expect(isValidIconId("logos:nextjs-icon")).toBe(true);
  });

  it("rejects malformed ids", () => {
    expect(isValidIconId("lucide")).toBe(false);
    expect(isValidIconId(":rocket")).toBe(false);
    expect(isValidIconId("lucide:")).toBe(false);
    expect(isValidIconId("lu cide:rocket")).toBe(false);
    expect(isValidIconId("lucide:rock et")).toBe(false);
    expect(isValidIconId("../etc/passwd")).toBe(false);
    expect(isValidIconId("lucide:rocket?x=1")).toBe(false);
  });
});

describe("buildRefs", () => {
  it("labels a full 12-icon grid as A1..C4", () => {
    const refs = buildRefs(12, 4);
    expect(refs.map((r) => r.ref)).toEqual([
      "A1", "A2", "A3", "A4",
      "B1", "B2", "B3", "B4",
      "C1", "C2", "C3", "C4",
    ]);
  });

  it("keeps index alignment with input order", () => {
    const refs = buildRefs(6, 3);
    expect(refs[0]).toEqual({ ref: "A1", index: 0 });
    expect(refs[4]).toEqual({ ref: "B2", index: 4 });
  });

  it("handles single cell grids", () => {
    expect(buildRefs(1, 1)).toEqual([{ ref: "A1", index: 0 }]);
  });
});

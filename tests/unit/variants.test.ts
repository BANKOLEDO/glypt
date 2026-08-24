import { describe, expect, it } from "vitest";
import {
  buildVariants,
  isValidHex,
  recolorSvg,
  scaleStroke,
  transformSvg,
} from "@glypt/core";

const BASE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2"><path stroke="currentColor" d="M4 20"/></svg>';

describe("recolorSvg", () => {
  it("replaces currentColor with the target hex", () => {
    expect(recolorSvg(BASE, "#FF0000")).toContain('stroke="#FF0000"');
    expect(recolorSvg(BASE, "#FF0000")).not.toContain("currentColor");
  });

  it("ignores invalid colors", () => {
    expect(recolorSvg(BASE, "red")).toBe(BASE);
    expect(recolorSvg(BASE, "#GGGGGG")).toBe(BASE);
  });

  it("injects a fill when svg has no paint attributes", () => {
    const bare = '<svg viewBox="0 0 24 24"><path/></svg>';
    expect(recolorSvg(bare, "#123456")).toContain('fill="#123456"');
  });
});

describe("isValidHex", () => {
  it("accepts 3/6 digit hex only", () => {
    expect(isValidHex("#abc")).toBe(true);
    expect(isValidHex("#aabbcc")).toBe(true);
    expect(isValidHex("#aabbccdd")).toBe(true);
    expect(isValidHex("aabbcc")).toBe(false);
    expect(isValidHex("#ab")).toBe(false);
  });
});

describe("scaleStroke", () => {
  it("multiplies explicit stroke widths and rounds to 2 decimals", () => {
    const out = scaleStroke(BASE, 1.5);
    expect(out).toContain('stroke-width="3"');
  });

  it("clamps extreme factors", () => {
    const out = scaleStroke('<svg stroke-width="100"></svg>', 99);
    expect(out).toContain('stroke-width="400"');
  });

  it("leaves svgs without stroke-width untouched", () => {
    const plain = "<svg><path/></svg>";
    expect(scaleStroke(plain, 2)).toBe(plain);
  });
});

describe("transformSvg", () => {
  it("wraps content in a horizontal flip group", () => {
    const out = transformSvg(BASE, { flipH: true });
    expect(out).toContain("translate(24,0) scale(-1,1)");
    expect(out).toContain('viewBox="0 0 24 24"');
  });

  it("is a no-op without options", () => {
    expect(transformSvg(BASE)).toBe(BASE);
  });

  it("supports rotation", () => {
    expect(transformSvg(BASE, { rotate90: true })).toContain("rotate(90)");
  });
});

describe("buildVariants", () => {
  it("produces the cartesian product of transforms", () => {
    const out = buildVariants(BASE, { colors: ["#111111", "#222222"], strokes: [1, 2] });
    expect(out).toHaveLength(4);
    expect(new Set(out.map((v) => v.color))).toEqual(new Set(["#111111", "#222222"]));
    expect(new Set(out.map((v) => v.strokeWidth))).toEqual(new Set([1, 2]));
  });

  it("caps output at 12 variants", () => {
    const out = buildVariants(BASE, {
      colors: ["#111111", "#222222", "#333333", "#444444"],
      strokes: [1, 2, 3],
      flipH: true,
      rotate90: true,
    });
    expect(out.length).toBeLessThanOrEqual(12);
    expect(out.length).toBeGreaterThan(0);
  });

  it("throws on invalid color input", () => {
    expect(() => buildVariants(BASE, { colors: ["nope"] })).toThrow(/invalid color/);
  });

  it("keeps base svg when no options given", () => {
    const out = buildVariants(BASE, {});
    expect(out).toHaveLength(1);
    expect(out[0].svg).toBe(BASE);
    expect(out[0].color).toBeNull();
  });
});

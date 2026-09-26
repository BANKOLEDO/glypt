import { describe, expect, it } from "vitest";
import { deckHtml, mockupSvg, safePalette, socialSvg } from "@glypt/core";

const BRAND = {
  name: "Acme",
  domain: "acme.com",
  palette: ["#FF5A1F", "#221B15", "#FFF6EC"],
  description: "Test brand",
};

describe("safePalette", () => {
  it("filters non-hex entries and caps at 5", () => {
    const p = safePalette(["#111111", "red", "#222222", "#333333", "#444444", "#555555", "#666666"]);
    expect(p).toHaveLength(5);
    expect(p).not.toContain("red");
  });

  it("falls back to the brand default when empty", () => {
    expect(safePalette([])).toEqual(["#FF5A1F", "#221B15", "#FFF6EC"]);
  });
});

describe("socialSvg", () => {
  const svg = socialSvg(BRAND, "Launch Day", "v2.0 is live");

  it("is a 1200x630 document with escaped content", () => {
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain(">Launch Day<");
    expect(svg).toContain(">ACME.COM<");
    expect(svg).toContain("#FF5A1F");
  });

  it("escapes html-sensitive title characters", () => {
    const evil = socialSvg(BRAND, "<script>x</script>");
    expect(evil).not.toContain("<script>");
    expect(evil).toContain("&lt;script&gt;");
  });
});

describe("mockupSvg", () => {
  it("builds a browser frame for inline data images", () => {
    const out = mockupSvg("data:image/jpeg;base64,/9j/4AAQ==yellow", "browser");
    expect(out).toContain('href="data:image/jpeg;base64,/9j/4AAQ==yellow"');
    expect(out).toContain("#F23D97");
  });

  it("rejects non-https, non-data urls", () => {
    expect(mockupSvg("http://example.com/x.png", "browser")).toBeNull();
    expect(mockupSvg("http://localhost/x.png", "browser")).toBeNull();
    expect(mockupSvg("javascript:alert(1)", "phone")).toBeNull();
  });

  it("rejects absurdly large payloads", () => {
    expect(mockupSvg(`data:image/png;base64,${"A".repeat(4_194_305)}`, "browser")).toBeNull();
  });

  it("supports phone frames without traffic lights", () => {
    const out = mockupSvg("data:image/png;base64,abc", "phone");
    expect(out).not.toContain("#F23D97");
  });
});

describe("deckHtml", () => {
  it("renders exactly 10 slides with brand palette swatches", () => {
    const html = deckHtml(BRAND);
    const slides = html.match(/class="slide"/g) ?? [];
    expect(slides).toHaveLength(10);
    expect(html).toContain("01 / COVER");
    expect(html).toContain("10 / CONTACT");
    expect(html).toContain("#FF5A1F");
    expect(html).toContain("Martian Mono");
  });

  it("escapes the brand name", () => {
    const html = deckHtml({ ...BRAND, name: 'A<b>"c"' });
    expect(html).toContain("A&lt;b&gt;&quot;c&quot;");
  });
});

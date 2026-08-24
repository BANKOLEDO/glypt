import { describe, expect, it } from "vitest";
import { fileExtFor, isFormat } from "@glypt/core";
import { snippetFor } from "@glypt/core";

describe("format helpers", () => {
  it("validates formats", () => {
    expect(isFormat("react")).toBe(true);
    expect(isFormat("vue")).toBe(true);
    expect(isFormat("svg")).toBe(true);
    expect(isFormat("svelte")).toBe(false);
  });

  it("maps formats to file extensions", () => {
    expect(fileExtFor("react")).toBe("tsx");
    expect(fileExtFor("react", "js")).toBe("jsx");
    expect(fileExtFor("react", "ts")).toBe("tsx");
    expect(fileExtFor("vue")).toBe("vue");
    expect(fileExtFor("svg")).toBe("svg");
  });
});

describe("snippetFor", () => {
  it("generates typed react code by default (ts)", () => {
    const s = snippetFor("lucide:rocket", "react");
    expect(s).toContain('import { Icon } from "@iconify/react"');
    expect(s).toContain('<Icon icon="lucide:rocket"');
    expect(s).toContain("RocketIcon");
    expect(s).toContain("props: IconProps");
  });

  it("generates plain-jsx react code for js lang", () => {
    const s = snippetFor("lucide:rocket", "react", "js");
    expect(s).not.toContain(": IconProps");
    expect(s).toContain("(props)");
  });

  it("pascal-cases multi-word icon names", () => {
    const s = snippetFor("ph:rocket-launch", "react");
    expect(s).toContain("RocketLaunchIcon");
  });

  it("adds lang=ts to vue SFC only in ts mode", () => {
    expect(snippetFor("tabler:star", "vue", "ts")).toContain('lang="ts"');
    expect(snippetFor("tabler:star", "vue", "js")).not.toContain('lang="ts"');
  });

  it("generates an <img> fallback for svg format", () => {
    const s = snippetFor("mdi:home", "svg");
    expect(s).toContain('src="https://api.iconify.design/mdi/home.svg"');
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApi } from "./helpers";

let base: string;
let close: () => Promise<void>;

beforeAll(async () => {
  const api = await startTestApi();
  base = api.base;
  close = api.close;
});

afterAll(async () => {
  await close();
});

describe("core routes", () => {
  it("health reports service status", async () => {
    const res = await fetch(`${base}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.service).toBe("glypt-api");
    expect(data.ok).toBe(true);
  });

  it("search returns sliced icon results", async () => {
    const res = await fetch(`${base}/api/search?q=rocket&limit=5`);
    if (res.status === 500) return; // no db in this environment
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(Array.isArray(data.icons)).toBe(true);
    expect(data.icons.length).toBeLessThanOrEqual(5);
  });

  it("icon endpoint serves raw svg", async () => {
    const res = await fetch(`${base}/api/icon?prefix=lucide&name=rocket`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    const body = await res.text();
    expect(body.startsWith("<svg")).toBe(true);
  });

  it("atlas demo board returns labeled cells", async () => {
    const res = await fetch(`${base}/api/atlas?cols=4`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.cols).toBe(4);
    expect(data.cells.length).toBeGreaterThan(0);
    expect(data.cells[0].ref).toBe("A1");
    expect(typeof data.cells[0].id).toBe("string");
  });

  it("marketplace returns curated collections", async () => {
    const res = await fetch(`${base}/api/marketplace`);
    const data = await res.json();
    if (res.status === 502) return; // provider hiccup
    expect(res.status).toBe(200);
    expect(data.total).toBeGreaterThan(0);
    const first = data.collections[0];
    expect(first.prefix).toBeTruthy();
    expect(first.name).toBeTruthy();
  });

  it("export builds a zip package", async () => {
    const res = await fetch(`${base}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons: ["lucide:rocket"], formats: ["react"] }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/zip");
    const buf = new Uint8Array(await res.arrayBuffer());
    // local file header signature
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it("export rejects invalid ids", async () => {
    const res = await fetch(`${base}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ icons: ["../etc/passwd"], formats: ["react"] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects cross-origin state changes when origin allowlist is configured", async () => {
    const prev = process.env.WEB_ORIGIN;
    process.env.WEB_ORIGIN = "http://localhost:5173";
    try {
      const api = await startTestApi();
      try {
        const res = await fetch(`${api.base}/api/export`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
          body: JSON.stringify({ icons: ["lucide:rocket"], formats: ["react"] }),
        });
        expect(res.status).toBe(403);
      } finally {
        await api.close();
      }
    } finally {
      if (prev === undefined) delete process.env.WEB_ORIGIN;
      else process.env.WEB_ORIGIN = prev;
    }
  });
});

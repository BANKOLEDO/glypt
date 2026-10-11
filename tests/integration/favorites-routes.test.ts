import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApi, cookieFrom } from "./helpers";

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

const DEVICE_COOKIE = "glypt_did";

describe("favorites routes", () => {
  it("lists an empty stash for a fresh device", async () => {
    const res = await fetch(`${base}/api/favorites`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.icons).toEqual([]);
  });

  it("pins, lists and unpins an icon for one device", async () => {
    const pin = await fetch(`${base}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconId: "lucide:rocket" }),
    });
    expect(pin.status).toBe(201);
    const device = cookieFrom(pin, DEVICE_COOKIE);
    expect(device).toBeTruthy();

    const list = await fetch(`${base}/api/favorites`, {
      headers: { Cookie: device! },
    });
    expect(list.status).toBe(200);
    const listed = await list.json();
    expect(listed.icons).toContain("lucide:rocket");

    const unpin = await fetch(`${base}/api/favorites`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Cookie: device! },
      body: JSON.stringify({ iconId: "lucide:rocket" }),
    });
    expect(unpin.status).toBe(200);

    const after = await fetch(`${base}/api/favorites`, {
      headers: { Cookie: device! },
    });
    const cleared = await after.json();
    expect(cleared.icons).not.toContain("lucide:rocket");
  });

  it("keeps stashes isolated per device", async () => {
    const a = await fetch(`${base}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconId: "ph:star" }),
    });
    const devA = cookieFrom(a, DEVICE_COOKIE);

    const b = await fetch(`${base}/api/favorites`, {
      headers: { Cookie: devA! },
    });
    const listed = await b.json();
    expect(listed.icons).toContain("ph:star");

    const other = await fetch(`${base}/api/favorites`);
    const fresh = await other.json();
    expect(fresh.icons).not.toContain("ph:star");
  });

  it("rejects a too-short icon id", async () => {
    const res = await fetch(`${base}/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconId: "a" }),
    });
    expect(res.status).toBe(400);
  });
});

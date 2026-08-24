import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApi, cookieFrom, hasDb } from "./helpers";

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

describe("auth + identity routes (requires db)", () => {
  it.skipIf(!hasDb)("registers, sessions, me and logout round-trip", async () => {
    const email = `t${Date.now()}@example.com`;
    const password = "correct-horse-42";

    const reg = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(reg.status).toBe(201);
    const sessionCookie = cookieFrom(reg, "glypt_session");
    expect(sessionCookie).toBeTruthy();

    // duplicate signup must not leak account existence details
    const dup = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(dup.status).toBe(400);

    const me = await fetch(`${base}/api/auth/me`, {
      headers: { Cookie: sessionCookie! },
    });
    expect(me.status).toBe(200);
    expect((await me.json()).user.email).toBe(email);

    const out = await fetch(`${base}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie! },
    });
    expect(out.status).toBe(200);

    const meAfter = await fetch(`${base}/api/auth/me`, {
      headers: { Cookie: sessionCookie! },
    });
    expect(meAfter.status).toBe(401);
  });

  it.skipIf(!hasDb)("rejects weak passwords and bad logins", async () => {
    const weak = await fetch(`${base}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `w${Date.now()}@example.com`, password: "short" }),
    });
    expect(weak.status).toBe(400);

    const bad = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nobody@example.com", password: "whatever-123" }),
    });
    expect(bad.status).toBe(401);
  });

  it.skipIf(!hasDb)("favorites persist per device cookie", async () => {
    const res = await fetch(`${base}/api/favorites`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ iconId: "lucide:rocket" }) });
    const did = cookieFrom(res, "glypt_did");
    expect(res.status).toBe(201);

    const list = await fetch(`${base}/api/favorites`, { headers: { Cookie: did! } });
    const data = await list.json();
    expect(data.icons).toContain("lucide:rocket");

    await fetch(`${base}/api/favorites`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Cookie: did! },
      body: JSON.stringify({ iconId: "lucide:rocket" }),
    });
    const after = await (await fetch(`${base}/api/favorites`, { headers: { Cookie: did! } })).json();
    expect(after.icons).not.toContain("lucide:rocket");
  });

  it.skipIf(!hasDb)("collections CRUD + share links", async () => {
    const created = await fetch(`${base}/api/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Folder", color: "#00C389" }),
    });
    expect(created.status).toBe(201);
    const col = await created.json();
    const did = cookieFrom(created, "glypt_did");
    const jar = did ? { Cookie: did } : {};

    await fetch(`${base}/api/collections/${col.id}/icons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...jar },
      body: JSON.stringify({ iconId: "ph:star" }),
    });

    const share = await fetch(`${base}/api/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...jar },
      body: JSON.stringify({ kind: "collection", payload: { name: "Test Folder", ids: ["ph:star"] } }),
    });
    expect(share.status).toBe(201);
    const { token, url } = await share.json();
    expect(url).toContain(token);

    const view = await fetch(`${base}/api/shares/${token}`);
    expect(view.status).toBe(200);
    const payload = await view.json();
    expect(payload.kind).toBe("collection");
    expect(payload.payload.ids).toContain("ph:star");
  });
});

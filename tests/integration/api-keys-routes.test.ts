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

async function registerUser(): Promise<string> {
  const email = `k${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "correct-horse-42" }),
  });
  return cookieFrom(res, "glypt_session")!;
}

describe("api key routes (requires db)", () => {
  it.skipIf(!hasDb)("needs a signed-in session", async () => {
    const res = await fetch(`${base}/api/keys`);
    expect(res.status).toBe(401);
  });

  it.skipIf(!hasDb)("creates, lists and revokes a key", async () => {
    const cookie = await registerUser();

    const created = await fetch(`${base}/api/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "CI pipeline" }),
    });
    expect(created.status).toBe(201);
    const body = await created.json();
    expect(body.secret.startsWith("glypt_sk_")).toBe(true);
    expect(body.key.name).toBe("CI pipeline");
    expect(body.key).not.toHaveProperty("secret");

    const list = await (await fetch(`${base}/api/keys`, { headers: { Cookie: cookie } })).json();
    expect(list.keys.some((k: { id: string }) => k.id === body.key.id)).toBe(true);

    const gone = await fetch(`${base}/api/keys/${body.key.id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(gone.status).toBe(200);

    const after = await (await fetch(`${base}/api/keys`, { headers: { Cookie: cookie } })).json();
    expect(after.keys.some((k: { id: string }) => k.id === body.key.id)).toBe(false);
  });
});

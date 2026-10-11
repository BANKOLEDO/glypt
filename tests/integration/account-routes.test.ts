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

async function register(email: string, password = "correct-horse-42"): Promise<string> {
  const res = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return cookieFrom(res, "glypt_session")!;
}

async function login(email: string, password: string): Promise<Response> {
  return fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

describe("account routes (requires db)", () => {
  it.skipIf(!hasDb)("updates the display name", async () => {
    const cookie = await register(`n${Date.now()}@example.com`);
    const res = await fetch(`${base}/api/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ name: "Ada Lovelace" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).user.name).toBe("Ada Lovelace");
  });

  it.skipIf(!hasDb)("changes password only with the correct current one", async () => {
    const email = `p${Date.now()}@example.com`;
    const cookie = await register(email);

    const wrong = await fetch(`${base}/api/auth/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ currentPassword: "not-my-password", newPassword: "brand-new-99" }),
    });
    expect(wrong.status).toBe(400);

    const ok = await fetch(`${base}/api/auth/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ currentPassword: "correct-horse-42", newPassword: "brand-new-99" }),
    });
    expect(ok.status).toBe(200);

    expect((await login(email, "correct-horse-42")).status).toBe(401);
    expect((await login(email, "brand-new-99")).status).toBe(200);
  });

  it.skipIf(!hasDb)("reset request never reveals whether an account exists", async () => {
    const res = await fetch(`${base}/api/auth/reset-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ghost-does-not-exist@example.com" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it.skipIf(!hasDb || process.env.EXPOSE_RESET_TOKEN !== "true")(
    "completes a reset and invalidates old sessions",
    async () => {
      const email = `r${Date.now()}@example.com`;
      const cookie = await register(email);

      const req = await fetch(`${base}/api/auth/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const { resetUrl } = await req.json();
      expect(resetUrl).toBeTruthy();
      const token = new URL(resetUrl).searchParams.get("token")!;

      const reset = await fetch(`${base}/api/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: "reset-pass-77" }),
      });
      expect(reset.status).toBe(200);

      expect((await login(email, "reset-pass-77")).status).toBe(200);

      const me = await fetch(`${base}/api/auth/me`, { headers: { Cookie: cookie } });
      expect(me.status).toBe(401);
    },
  );
});

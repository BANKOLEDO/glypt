#!/usr/bin/env node
// Glypt e2e suite: boots api (:4400) + built web preview (:4300), asserts pages and APIs.
// Prereq: pnpm build && pnpm test:e2e
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const API_PORT = 4400;
const WEB_PORT = 4300;
const API = `http://127.0.0.1:${API_PORT}`;
const BASE = `http://127.0.0.1:${WEB_PORT}`;
const BOOT_TIMEOUT_MS = 120_000;

let apiProc;
let webProc;
let passed = 0;
let failed = 0;

function ok(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m ${name}`);
  } else {
    failed++;
    console.log(`\x1b[31mFAIL\x1b[0m ${name} ${extra}`);
  }
}

function start(name, cmd, args, cwd, env = {}) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    windowsHide: true,
    env: { ...process.env, ...env },
  });
  child.stdout.on("data", (d) => process.env.E2E_DEBUG && console.log(`[${name}] ${d}`));
  child.stderr.on("data", (d) => process.env.E2E_DEBUG && console.error(`[${name}] ${d}`));
  return child;
}

function stop(child) {
  if (!child) return;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
    } catch {
      // already gone
    }
  } else {
    child.kill("SIGTERM");
  }
}

async function waitUntil(url) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return true; // SPA fallback may 404 on deep paths
    } catch {
      // not up yet
    }
    await sleep(1500);
  }
  return false;
}

async function text(p) {
  const res = await fetch(`${BASE}${p}`);
  return { status: res.status, body: await res.text() };
}

async function json(base, p, init) {
  const res = await fetch(`${base}${p}`, init);
  return { status: res.status, data: await res.json().catch(() => null), headers: res.headers };
}

async function run() {
  console.log("\x1b[38;5;208mGLYPT E2E\x1b[0m - api :" + API_PORT + " web :" + WEB_PORT);

  apiProc = start("api", "pnpm", ["--filter", "@glypt/api", "start"], ROOT, { API_PORT: String(API_PORT) });
  webProc = start("web", "pnpm", ["--filter", "@glypt/web", "preview", "--host", "127.0.0.1", "--port", String(WEB_PORT), "--strictPort"], ROOT, { API_PORT: String(API_PORT) });

  const apiUp = await waitUntil(`${API}/api/health`);
  ok("api boots within timeout", apiUp);
  if (!apiUp) {
    stop(apiProc);
    stop(webProc);
    process.exit(1);
  }

  const webUp = await waitUntil(`${BASE}/`);
  ok("web serves the built app", webUp);
  if (!webUp) {
    stop(apiProc);
    stop(webProc);
    process.exit(1);
  }

  // ---- pages ----
  console.log("\n[pages]");
  {
    const home = await text("/");
    ok(
      "landing renders hero",
      home.status === 200 && home.body.toLowerCase().includes("every") && home.body.toLowerCase().includes("asset"),
    );
    ok("landing is a react spa mount", home.body.includes('id="root"'));

    for (const [route, needle] of [
      ["/search", "FIND THE GLYPH"],
      ["/atlas", "LOOK BEFORE YOU LEAP"],
      ["/dashboard", "ASSET CONTROL ROOM"],
      ["/market", "DISCOVER"],
      ["/docs", "REFERENCE"],
      ["/brands", "BRAND KIT"],
    ]) {
      const page = await text(route);
      // SPA: server returns the shell for every route; content renders client-side.
      ok(`${route} responds`, page.status === 200 && page.body.includes('id="root"'));
      ok(`${route} shell contains app bundle`, page.body.includes("src=\"/assets/") || page.body.includes("/assets/"));
    }
  }

  // ---- core apis through the preview proxy ----
  console.log("\n[core api via proxy]");
  {
    const s = await json(BASE, "/api/search?q=home&limit=6");
    ok("search returns icons", s.status === 200 && Array.isArray(s.data.icons) && s.data.icons.length > 0);

    const a = await json(BASE, "/api/atlas?cols=4");
    ok(
      "atlas demo board has cells with refs",
      a.status === 200 && a.data.cells.length > 0 && a.data.cells[0].ref === "A1",
    );

    const i = await text("/api/icon?prefix=lucide&name=rocket");
    ok("icon endpoint serves svg", i.status === 200 && i.body.startsWith("<svg"));

    const exp = await fetch(`${BASE}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ icons: ["lucide:home", "lucide:star"], formats: ["vue", "react"] }),
    });
    const bytes = new Uint8Array(await exp.arrayBuffer());
    ok("export streams valid zip", exp.status === 200 && bytes[0] === 0x50 && bytes[1] === 0x4b);
  }

  // ---- generation + shares + marketplace ----
  console.log("\n[generation/shares/market]");
  {
    const soc = await json(BASE, "/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain: "example.com", kind: "social", title: "E2E" }),
    });
    ok("social card generates svg", soc.status === 200 && typeof soc.data.svg === "string" && soc.data.svg.includes(">E2E<"));

    const share = await json(BASE, "/api/shares", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "collection", payload: { name: "e2e", ids: ["ph:star"] } }),
    });
    ok("share link created", share.status === 201 && typeof share.data.token === "string");

    if (share.status === 201) {
      const view = await json(BASE, `/api/shares/${share.data.token}`);
      ok("share payload readable", view.status === 200 && view.data.payload.ids.includes("ph:star"));
    }

    const m = await json(BASE, "/api/marketplace");
    ok(
      "marketplace lists collections",
      m.status === 200 && Array.isArray(m.data.collections) && m.data.collections.length > 0,
    );
  }

  // ---- auth flow (requires DATABASE_URL) ----
  console.log("\n[auth]");
  if (process.env.DATABASE_URL) {
    const email = `e2e-${Date.now()}@example.com`;
    const reg = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "correct-horse-42" }),
    });
    ok("register returns session cookie", reg.status === 201 && (reg.headers.getSetCookie?.() ?? []).some((c) => c.startsWith("glypt_session=")));

    const login = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "wrong-pass-99" }),
    });
    ok("bad login rejected", login.status === 401);
  } else {
    console.log("  \x1b[33mSKIP\x1b[0m auth flow (no DATABASE_URL)");
  }

  stop(apiProc);
  stop(webProc);

  console.log(`\n\x1b[1m${passed} passed, ${failed} failed\x1b[0m`);
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  stop(apiProc);
  stop(webProc);
  process.exit(1);
});

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import Nav from "../components/nav";
import { usePageTitle } from "../lib/usePageTitle";

const TOC = [
  ["overview", "Overview", "ph:compass-bold"],
  ["concepts", "Core concepts", "ph:lightning-bold"],
  ["quickstart", "Quickstart", "ph:rocket-launch-bold"],
  ["authentication", "Authentication", "ph:identification-badge-bold"],
  ["api", "REST API", "ph:plugs-connected-bold"],
  ["errors", "Errors", "ph:warning-circle-bold"],
  ["limits", "Quota & limits", "ph:gauge-bold"],
  ["cli", "CLI", "ph:terminal-window-bold"],
  ["mcp", "MCP server", "ph:robot-bold"],
  ["python", "Python SDK", "ph:file-py-bold"],
  ["integrations", "Integrations", "ph:puzzle-piece-bold"],
] as const;

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  desc: string;
  auth?: string;
  body?: string;
  res?: string;
};

const API_GROUPS: { group: string; note?: string; endpoints: Endpoint[] }[] = [
  {
    group: "Search & icons",
    endpoints: [
      {
        method: "GET", path: "/api/search?q=rocket&limit=24",
        desc: "Full-text search across 200k+ icons. Returns icon ids ready for snippets or rendering.",
        auth: "device cookie (auto)", res: `{ "icons": ["lucide:rocket", …], "total": 412 }`,
      },
      {
        method: "GET", path: "/api/icon?prefix=lucide&name=rocket",
        desc: "Raw SVG markup for one icon. Cached 24h at the edge.",
        auth: "none", res: "<svg …</svg>",
      },
    ],
  },
  {
    group: "Atlas (visual selection)",
    endpoints: [
      {
        method: "GET", path: "/api/atlas?cols=4",
        desc: "Demo board: 12 icons placed on an A1..H8 grid. Public sample for humans exploring the concept.",
        res: `{ "cols": 4, "cells": [{ "ref": "A1", "id": "lucide:home", "svg": … }] }`,
      },
      {
        method: "POST", path: "/api/atlas",
        desc: "Build an atlas session for your own candidate set (max 32). Refs are deterministic per device.",
        auth: "device cookie (auto)", body: `{ "icons": ["ph:star", …], "cols": 3 }`,
        res: `{ "cols": 3, "refs": ["A1", …], "icons": […] }`,
      },
      {
        method: "POST", path: "/api/atlas/resolve",
        desc: "Map chosen references back to asset ids. The agent-facing half of the flow.",
        auth: "device cookie", body: `{ "refs": ["A1", "B2"] }`, res: `{ "A1": "ph:star", … }`,
      },
    ],
  },
  {
    group: "Brand kits",
    endpoints: [
      {
        method: "GET", path: "/api/brand?domain=stripe.com",
        desc: "Extract palette, logo candidates and favicon from any public site.",
        res: `{ "name": "Stripe", "palette": ["#635BFF", …], "logos": […] }`,
      },
      {
        method: "POST", path: "/api/brand/save",
        desc: "Persist an extracted kit to your account.",
        auth: "session", body: `{ "domain": "stripe.com", "tokens": … }`,
      },
    ],
  },
  {
    group: "Generation",
    endpoints: [
      {
        method: "POST", path: "/api/generate",
        desc: `Render assets from a brand kit. kind ∈ social | deck | mockup.`,
        body: `{ "kind": "social", "domain": "stripe.com", "title": "Launch day" }`,
        res: `{ "svg": "<svg…", "png": <bytes when requested> }`,
      },
    ],
  },
  {
    group: "Export",
    endpoints: [
      {
        method: "POST", path: "/api/export",
        desc: "Bundle up to 32 icons as ZIP with code snippets per format (react | vue | svg) plus manifest.",
        body: `{ "icons": […], "formats": ["react", "svg"] }`, res: "binary/zip",
      },
    ],
  },
  {
    group: "Workspace",
    note: "These persist once an account exists; they are keyed to your session or device id.",
    endpoints: [
      { method: "GET", path: "/api/favorites", desc: "List saved icons.", auth: "session/device" },
      { method: "POST", path: "/api/favorites", desc: "Save an icon.", auth: "session/device", body: `{ "iconId": "ph:heart" }` },
      { method: "DELETE", path: "/api/favorites/:iconId", desc: "Remove a saved icon.", auth: "session/device" },
      { method: "GET", path: "/api/collections", desc: "Folders with counts + icon ids.", auth: "session/device" },
      { method: "POST", path: "/api/collections", desc: "Create folder.", auth: "session/device", body: `{ "name": "Payments" }` },
      { method: "PATCH", path: "/api/collections/:id", desc: "Rename / recolor folder.", auth: "session/device", body: `{ "color": "#F23D97" }` },
      { method: "DELETE", path: "/api/collections/:id", desc: "Delete folder.", auth: "session/device" },
      { method: "POST", path: "/api/collections/:id/icons", desc: "Add icon to folder.", auth: "session/device", body: `{ "iconId": "ph:star" }` },
      { method: "DELETE", path: "/api/collections/:id/icons/:iconId", desc: "Remove icon from folder.", auth: "session/device" },
      { method: "POST", path: "/api/shares", desc: "Create a public share link for atlas/brand/collection payloads.", body: `{ "kind": "collection", "payload": { … } }`, res: `{ "token": "…", "url": "/s/…" }` },
      { method: "GET", path: "/api/shares/:token", desc: "Read a share payload." },
      { method: "GET", path: "/api/marketplace", desc: "Curated collection index (?q= filter)." },
    ],
  },
  {
    group: "Machine keys",
    note: "Server-to-server tier for production automations.",
    endpoints: [
      { method: "GET", path: "/api/v1/icons/search?q=", desc: "Same search index under key auth.", auth: "x-api-key" },
      { method: "POST", path: "/api/v1/generate", desc: "Generation with idempotency via x-request-id.", auth: "x-api-key" },
    ],
  },
];

const METHOD_COLOR: Record<Endpoint["method"], string> = {
  GET: "#00C389",
  POST: "#FF5A1F",
  PATCH: "#E8A20C",
  DELETE: "#F23D97",
};

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative">
      <pre className="overflow-x-auto rounded-lg bg-ink p-4 font-mono text-[11px] leading-relaxed text-mint whitespace-pre-wrap break-words">
        {children}
      </pre>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch { /* blocked */ }
        }}
        className="absolute right-2 bottom-2 rounded-md bg-white/10 px-2 py-1 font-mono text-[10px] text-white/70 transition-opacity sm:top-2 sm:bottom-auto sm:opacity-0 sm:group-hover:opacity-100"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
    </div>
  );
}

function EndpointCard({ e }: { e: Endpoint }) {
  return (
    <div className="card p-0 ring-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <span
          className="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold text-white"
          style={{ backgroundColor: METHOD_COLOR[e.method] }}
        >
          {e.method}
        </span>
        <code className="font-mono text-xs font-semibold break-all text-ink">{e.path}</code>
        {e.auth && (
          <span className="ml-auto rounded-full bg-paper px-2 py-0.5 font-mono text-[9px] tracking-widest text-mute uppercase">
            {e.auth}
          </span>
        )}
      </div>
      <p className="px-4 pt-3 text-sm leading-relaxed text-mute">{e.desc}</p>
      {(e.body || e.res) && (
        <div className="space-y-2 px-4 pt-3 pb-4">
          {e.body && <Code>{e.body}</Code>}
          {e.res && (
            <p className="font-mono text-[10px] tracking-wide text-mute">
              → {e.res}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Docs() {
  usePageTitle("Docs · Glypt");
  const [active, setActive] = useState("quickstart");

  // scroll-spy: highlight whichever section is on screen
  useEffect(() => {
    const ids = TOC.map(([id]) => id);
    const probe = Math.min(240, Math.max(150, window.innerHeight * 0.3));
    const onScroll = () => {
      let current = ids[0]!;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= probe) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <Nav />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-5 pb-28 py-12 lg:grid-cols-[220px_1fr] lg:pb-12">
        {/* toc */}
        <aside className="hidden lg:block">
          <p className="label-mono mb-3">reference</p>
          <nav className="sticky top-24 space-y-0.5">
            {TOC.map(([id, label, icon]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setActive(id)}
                className={clsx(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                  active === id ? "bg-tang-soft font-bold text-tang-hi" : "text-mute hover:bg-paper hover:text-ink",
                )}
              >
                <Icon icon={icon} className="size-4 opacity-60" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* mobile bottom section navigator */}
        <nav
          aria-label="Sections"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden"
        >
          <div className="flex gap-1.5 overflow-x-auto px-3 py-2.5 scrollbar-none">
            {TOC.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setActive(id)}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-[11px] font-bold tracking-wide transition-colors",
                  active === id
                    ? "bg-ink text-white shadow-[2px_2px_0_0_var(--color-citrine)]"
                    : "bg-paper text-mute hover:text-ink",
                )}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <article className="min-w-0 space-y-14">
          <header>
            <p className="label-mono">docs /</p>
            <h1 className="h-display mt-3 text-4xl sm:text-5xl">REFERENCE<span className="text-tang">.</span></h1>
            <p className="mt-4 max-w-xl leading-relaxed text-mute">
              Everything Glypt can do, endpoint by endpoint. Base URL is your API
              origin: <code className="rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-ink">http://localhost:4000</code> locally.
            </p>
          </header>

          {/* overview */}
          <section id="overview" className="scroll-mt-28">
            <h2 className="h-display text-2xl">
              WHAT IS GLYPT<span className="text-tang">.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute">
              Glypt is a visual asset platform for icons and brand kits. Text
              search finds any of 200k+ icons, the atlas turns them into a
              labeled visual grid an agent can pick from, and exports hand you
              production-ready code in react, vue or raw svg. Every step is
              built for two audiences at once: people clicking in a browser and
              AI agents calling an API.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["ph:magnifying-glass-bold", "Search everything", "200k+ icons across 150+ collections. One query returns ids ready for snippets or rendering."],
                ["ph:grid-nine-bold", "Pick by reference", "The atlas labels candidates as A1, B3, C2 so anyone, even an agent, can point at the right glyph instead of guessing."],
                ["ph:archive-bold", "One-click export", "Copy an import, download a ZIP, or render react/vue/svg output that drops into your codebase."],
                ["ph:puzzle-piece-bold", "Works everywhere", "REST API, CLI, MCP server for agents, a Python SDK, plus browser, Figma and VS Code integrations."],
              ].map(([ic, t, d]) => (
                <div key={t as string} className="card p-5 ring-0">
                  <span className="grid size-10 place-items-center rounded-xl bg-tang-soft text-tang">
                    <Icon icon={ic as string} className="size-5" aria-hidden />
                  </span>
                  <p className="font-display mt-3 font-bold text-ink">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{d}</p>
                </div>
              ))}
            </div>
            <div className="card mt-4 bg-ink !ring-0 p-5">
              <p className="label-mono !text-white/50">the pipeline</p>
              <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[11px] font-bold tracking-wide text-mint uppercase">
                <li className="rounded-full bg-white/10 px-3 py-1.5">search</li>
                <li aria-hidden className="text-white/40">→</li>
                <li className="rounded-full bg-white/10 px-3 py-1.5">atlas</li>
                <li aria-hidden className="text-white/40">→</li>
                <li className="rounded-full bg-white/10 px-3 py-1.5">resolve</li>
                <li aria-hidden className="text-white/40">→</li>
                <li className="rounded-full bg-white/10 px-3 py-1.5">export</li>
                <li aria-hidden className="text-white/40">→</li>
                <li className="rounded-full bg-tang px-3 py-1.5 text-white">ship</li>
              </ol>
            </div>
          </section>

          {/* core concepts */}
          <section id="concepts" className="scroll-mt-28">
            <h2 className="h-display text-2xl">CORE CONCEPTS</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["ph:hash-bold", "Icon ids", <>Every icon is <code className="rounded bg-paper px-1.5 font-mono text-xs text-ink">prefix:name</code>. Prefix is the collection, name is the glyph: <code className="rounded bg-paper px-1.5 font-mono text-xs text-ink">lucide:home</code>, <code className="rounded bg-paper px-1.5 font-mono text-xs text-ink">ph:star</code>.</>],
                ["ph:crosshair-bold", "Atlas references", "A board maps candidates to opaque refs (A1, B3). Agents inspect the visual grid, choose a ref, and resolve it back to a real asset id in one call."],
                ["ph:identification-badge-bold", "Identity", "A device cookie is issued automatically on first search, so anonymous visitors get quota, favorites and atlases. Signing in adds folders, brand saves and sync."],
                ["ph:folder-simple-bold", "Collections & shares", "Save icons into colored folders, create share links for teammates, and export any folder as a ZIP with code snippets per format."],
                ["ph:gauge-bold", "Free quota", "Every device gets 100 searches a day, resetting at midnight UTC. The x-quota-remaining header always tells you where you stand."],
                ["ph:repeat-bold", "Deterministic output", "Same inputs, same results: atlases are reproducible and exports are stable, so automations can rely on them day after day."],
              ].map(([ic, t, d]) => (
                <div key={t as string} className="card p-5 ring-0">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-sky-soft text-sky">
                      <Icon icon={ic as string} className="size-4" aria-hidden />
                    </span>
                    <p className="font-display font-bold text-ink">{t}</p>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-mute">{d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* quickstart */}
          <section id="quickstart" className="scroll-mt-28">
            <h2 className="h-display text-2xl">QUICKSTART</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
              Search from your terminal in under a minute, no account needed.
            </p>
            <div className="mt-4 space-y-3">
              <Code>{`curl "http://localhost:4000/api/search?q=rocket&limit=5"`}</Code>
              <Code>{`curl -X POST http://localhost:4000/api/export \\
  -H 'content-type: application/json' \\
  -d '{"icons":["lucide:rocket","ph:star"],"formats":["react","svg"]}' \\
  -o glypt.zip`}</Code>
            </div>
          </section>

          {/* authentication */}
          <section id="authentication" className="scroll-mt-28">
            <h2 className="h-display text-2xl">AUTHENTICATION</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["None", "Public reads: marketplace, demo atlas, health.", "#00C389"],
                ["Device cookie", "Issued automatically on first search. Powers free-tier quota, favorites and anonymous atlases, no signup required.", "#E8A20C"],
                ["Session cookie", "Email + password sign-in at /signin. Unlocks folders, brand saves and cross-device sync.", "#FF5A1F"],
              ].map(([t, d, c]) => (
                <div key={t} className="card p-4 ring-0" style={{ borderTop: `3px solid ${c}` }}>
                  <p className="font-mono text-xs font-bold tracking-wide uppercase" style={{ color: c }}>{t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-mute">
              Cookies are httpOnly and SameSite=Lax; the browser handles them,
              just call the API from the same origin (or an allowlisted origin).
            </p>
          </section>

          {/* api */}
          <section id="api" className="scroll-mt-28">
            <h2 className="h-display text-2xl">REST API</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
              JSON in, JSON out (except /api/icon and /api/export). All routes
              are prefixed with <code className="rounded bg-paper px-1.5 font-mono text-xs text-ink">/api</code>.
            </p>
            <div className="mt-6 space-y-8">
              {API_GROUPS.map((g) => (
                <div key={g.group}>
                  <h3 className="font-mono text-xs font-bold tracking-[0.18em] text-ink uppercase">{g.group}</h3>
                  {g.note && <p className="mt-1 text-xs text-mute">{g.note}</p>}
                  <div className="mt-3 space-y-3">
                    {g.endpoints.map((e) => <EndpointCard key={e.method + e.path} e={e} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* errors */}
          <section id="errors" className="scroll-mt-28">
            <h2 className="h-display text-2xl">ERRORS</h2>
            <div className="card mt-4 overflow-hidden p-0 ring-0">
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line font-mono text-[10px] tracking-widest text-mute uppercase">
                      <th className="px-4 py-3">status</th><th className="px-4 py-3">meaning</th>
                    </tr>
                  </thead>
                  <tbody className="[&_td]:px-4 [&_td]:py-3 [&_tr]:border-b [&_tr:last-child]:border-0 [&_tr]:border-line">
                    <tr><td><code className="font-mono font-bold text-mint">200</code></td><td className="text-mute">All good.</td></tr>
                    <tr><td><code className="font-mono font-bold text-citrine-hi">201</code></td><td className="text-mute">Created (folders, shares, accounts).</td></tr>
                    <tr><td><code className="font-mono font-bold text-berry">400</code></td><td className="text-mute">Validation failed: bad id format, weak password.</td></tr>
                    <tr><td><code className="font-mono font-bold text-berry">401</code> / <code className="font-mono font-bold text-berry">403</code></td><td className="text-mute">Not signed in / not allowed (bad key, foreign origin).</td></tr>
                    <tr><td><code className="font-mono font-bold text-berry">404</code></td><td className="text-mute">Unknown resource or expired share token.</td></tr>
                    <tr><td><code className="font-mono font-bold text-berry">429</code></td><td className="text-mute">Daily quota reached or rate limit hit. Back off until reset.</td></tr>
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line sm:hidden">
                <li className="flex gap-3 px-4 py-3"><code className="w-12 shrink-0 font-mono font-bold text-mint">200</code><span className="text-sm text-mute">All good.</span></li>
                <li className="flex gap-3 px-4 py-3"><code className="w-12 shrink-0 font-mono font-bold text-citrine-hi">201</code><span className="text-sm text-mute">Created (folders, shares, accounts).</span></li>
                <li className="flex gap-3 px-4 py-3"><code className="w-12 shrink-0 font-mono font-bold text-berry">400</code><span className="text-sm text-mute">Validation failed: bad id format, weak password.</span></li>
                <li className="flex gap-3 px-4 py-3"><code className="w-12 shrink-0 font-mono font-bold text-berry">401/403</code><span className="text-sm text-mute">Not signed in / not allowed (bad key, foreign origin).</span></li>
                <li className="flex gap-3 px-4 py-3"><code className="w-12 shrink-0 font-mono font-bold text-berry">404</code><span className="text-sm text-mute">Unknown resource or expired share token.</span></li>
                <li className="flex gap-3 px-4 py-3"><code className="w-12 shrink-0 font-mono font-bold text-berry">429</code><span className="text-sm text-mute">Daily quota reached or rate limit hit. Back off until reset.</span></li>
              </ul>
            </div>
          </section>

          {/* limits */}
          <section id="limits" className="scroll-mt-28">
            <h2 className="h-display text-2xl">QUOTA &amp; LIMITS</h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-mute">
              {[
                "Free tier: 100 searches/day per device, resets at midnight UTC.",
                "API keys (/api/v1): 5,000 requests/day per key.",
                "Auth endpoints: 12 attempts per 15 min per IP (brute-force guard).",
                "Atlas: up to 32 icons per board; refs valid while the board is active.",
                "Export ZIPs: up to 32 icons × 3 formats per archive.",
                "Response header x-quota-remaining tells you exactly where you stand.",
              ].map((l) => (
                <li key={l} className="flex gap-2.5">
                  <Icon icon="ph:check-fat-fill" className="mt-0.5 size-4 shrink-0 text-mint" />
                  {l}
                </li>
              ))}
            </ul>
          </section>

          {/* cli */}
          <section id="cli" className="scroll-mt-28">
            <h2 className="h-display text-2xl">CLI</h2>
            <Code>{`npm i -g @glypt/cli

glypt search rocket --limit 12     # find icons
glypt resolve A1 B3                # map atlas refs → ids
glypt export lucide:home ph:star   # zip with snippets
glypt atlas --icons lucide:home,ph:star --cols 4`}</Code>
            <p className="mt-3 text-sm text-mute">
              Point it elsewhere with <code className="rounded bg-paper px-1.5 font-mono text-xs text-ink">GLYPT_API_URL</code>.
            </p>
          </section>

          {/* mcp */}
          <section id="mcp" className="scroll-mt-28">
            <h2 className="h-display text-2xl">MCP SERVER</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
              Native tool access for Claude, Cursor and any MCP client. Four tools:
              <code className="mx-1 rounded bg-paper px-1.5 font-mono text-xs text-ink">search_icons</code>,
              <code className="mx-1 rounded bg-paper px-1.5 font-mono text-xs text-ink">visual_select</code>,
              <code className="mx-1 rounded bg-paper px-1.5 font-mono text-xs text-ink">resolve_icon</code>,
              <code className="mx-1 rounded bg-paper px-1.5 font-mono text-xs text-ink">write_icon</code>.
            </p>
            <div className="mt-4">
              <Code>{`{
  "mcpServers": {
    "glypt": { "command": "npx", "args": ["-y", "@glypt/mcp"] }
  }
}`}</Code>
            </div>
          </section>

          {/* python */}
          <section id="python" className="scroll-mt-28">
            <h2 className="h-display text-2xl">PYTHON SDK</h2>
            <Code>{`pip install glypt

from glypt import Glypt
g = Glypt("http://localhost:4000", api_key="gl_live_…")

hits   = g.search("rocket", limit=12)         # ["lucide:rocket", …]
svg    = g.icon_svg(hits[0])                  # raw markup
atlas  = g.build_atlas(hits[:16], cols=4)     # A1..H8 grid
picked = g.resolve_atlas(["A1", "B2"])
kit    = g.extract_brand("stripe.com")
zip_   = g.export_zip(hits[:8], ["react"])    # bytes`}</Code>
            <p className="mt-3 text-sm text-mute">
              Raises <code className="rounded bg-paper px-1.5 font-mono text-xs text-ink">QuotaExceeded</code> on 429,
              <code className="mx-1 rounded bg-paper px-1.5 font-mono text-xs text-ink">ApiError</code> otherwise.
            </p>
          </section>

          {/* integrations */}
          <section id="integrations" className="scroll-mt-28">
            <h2 className="h-display text-2xl">INTEGRATIONS</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["ph:puzzle-piece-fill", "Browser extension", "Palette extraction popup, quick-jump context menus. Load unpacked from integrations/browser-extension."],
                ["ph:figma-logo", "Figma plugin", "Live grid search, size + tint controls, recents. Import from manifest in Figma desktop."],
                ["ph:code", "VS Code extension", "Alt+Shift+I picker with framework-aware snippets. Set glypt.apiBase in settings."],
              ].map(([ic, t, d]) => (
                <div key={t} className="card p-5 ring-0">
                  <Icon icon={ic} className="size-7 text-tang" />
                  <p className="font-display mt-3 font-bold text-ink">{t}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* security */}
          <section id="security" className="scroll-mt-28">
            <h2 className="h-display text-2xl">SECURITY</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mute">
              Passwords are salted and hashed before storage; sessions are opaque
              tokens delivered as httpOnly cookies; cross-site state changes are
              rejected unless the origin is allowlisted. Full details live in the
              repository README, this page never needs your credentials.
            </p>
            <Link to="/search" className="btn-primary mt-6 inline-flex">
              Try the search <Icon icon="ph:arrow-right-bold" className="size-4" />
            </Link>
          </section>
        </article>
      </main>
    </div>
  );
}

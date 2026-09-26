import type { VercelRequest, VercelResponse } from "@vercel/node";

const SKIP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
  "host",
  "set-cookie",
]);

const REQ_SKIP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-length",
  "host",
  "upgrade",
  "expect",
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await run(req, res);
  } catch (e) {
    console.error("proxy error:", e);
    res.status(500).json({ error: "upstream request failed" });
  }
}

async function run(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    res.status(503).json({ error: "API_ORIGIN not configured" });
    return;
  }

  const url = new URL(req.url ?? "", "http://localhost");
  const params = url.searchParams;
  const originalPath = params.get("__p") ?? url.pathname;
  params.delete("__p");
  const query = params.toString();
  const upstream = `${origin}${originalPath}${query ? `?${query}` : ""}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (REQ_SKIP.has(key)) continue;
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(", ");
  }
  headers["host"] = new URL(origin).host;

  const init: RequestInit = { method: req.method ?? "GET", headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    if (req.body !== undefined && req.body !== "") {
      init.body = Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));
    } else {
      try {
        const raw = await (req as unknown as { readBody?: () => Promise<Buffer> }).readBody?.();
        if (raw && raw.byteLength > 0) init.body = raw;
      } catch {
        // body already consumed by the platform parser
      }
    }
  }

  const up = await fetch(upstream, init);
  const buf = Buffer.from(await up.arrayBuffer());

  res.status(up.status);
  for (const [key, value] of up.headers) {
    if (SKIP.has(key)) continue;
    res.setHeader(key, value);
  }
  const cookies = typeof up.headers.getSetCookie === "function" ? up.headers.getSetCookie() : [];
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
  res.setHeader("Content-Length", buf.byteLength);
  res.send(buf);
}
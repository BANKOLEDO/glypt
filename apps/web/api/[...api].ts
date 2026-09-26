import type { VercelRequest, VercelResponse } from "@vercel/node";

const SKIP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
  "host",
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    res.status(503).json({ error: "API_ORIGIN not configured" });
    return;
  }

  const upstream = `${origin}${req.url ?? ""}`;
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers[key] = value;
    else if (Array.isArray(value)) headers[key] = value.join(", ");
  }
  headers["host"] = new URL(origin).host;

  const init: RequestInit = { method: req.method ?? "GET", headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    const readBody = (req as unknown as { readBody?: () => Promise<Buffer> }).readBody;
    const raw = readBody ? await readBody() : Buffer.from(JSON.stringify(req.body ?? ""));
    if (raw.byteLength > 0) init.body = raw;
  }

  const up = await fetch(upstream, init);
  const buf = Buffer.from(await up.arrayBuffer());

  res.status(up.status);
  for (const [key, value] of up.headers) {
    if (SKIP.has(key)) continue;
    res.setHeader(key, value);
  }
  const getSetCookie = (up.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie ? getSetCookie() : [];
  if (cookies.length) res.setHeader("Set-Cookie", cookies);
  res.setHeader("Content-Length", buf.byteLength);
  res.send(buf);
}
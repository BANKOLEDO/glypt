declare const process: { env: Record<string, string | undefined> };

export const config = { matcher: ["/api/:path*"] };

export default async function handler(req: Request): Promise<Response> {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return new Response(JSON.stringify({ error: "API_ORIGIN not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const upstream = new URL(url.pathname + url.search, origin);
  const headers = new Headers(req.headers);
  headers.set("host", new URL(origin).host);

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const res = await fetch(upstream.toString(), init);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
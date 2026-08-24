const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})*\.[a-z]{2,24}$/i;

export function normalizeDomain(input: string): string | null {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return DOMAIN_RE.test(d) ? d : null;
}

export type BrandKit = {
  domain: string;
  name: string;
  favicon: string;
  logoCandidates: string[];
  palette: string[];
  ogImage: string | null;
  description: string | null;
};

export async function extractBrand(domainInput: string): Promise<BrandKit | null> {
  const domain = normalizeDomain(domainInput);
  if (!domain) return null;

  const title = domain.split(".")[0];
  const palette: string[] = [];
  let siteName: string | null = null;
  let ogDescription: string | null = null;
  let ogImage: string | null = null;

  try {
    const res = await fetch(`https://${domain}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Glypt/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = (await res.text()).slice(0, 300_000);
      siteName =
        html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i)?.[1] ??
        html.match(/<title[^>]*>([^<]{1,80})</i)?.[1] ??
        null;
      ogDescription =
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,200})/i)?.[1] ?? null;
      ogImage =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1] ?? null;

      for (const m of html.matchAll(
        /<meta[^>]+name=["']theme-color["'][^>]+content=["'](#?[0-9a-f]{3,8})/gi,
      )) {
        const c = m[1].startsWith("#") ? m[1].toUpperCase() : `#${m[1].toUpperCase()}`;
        if (!palette.includes(c)) palette.push(c);
      }
      for (const m of html.matchAll(/#([0-9a-f]{6})\b/gi)) {
        const hex = `#${m[1].toUpperCase()}`;
        if (!palette.includes(hex) && !/^#(.)\1{5}$/i.test(hex)) palette.push(hex);
        if (palette.length >= 12) break;
      }
    }
  } catch {
    // offline domain - favicon + logos still returned
  }

  let logoIcons: string[] = [];
  try {
    const res = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(`${title} logo`)}&limit=12`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (res.ok) {
      const data = (await res.json()) as { icons?: string[] };
      logoIcons = (data.icons ?? []).filter(
        (i) => i.startsWith("logos:") || i.startsWith("simple-icons:"),
      );
      if (logoIcons.length === 0) logoIcons = (data.icons ?? []).slice(0, 6);
    }
  } catch {
    // ignore
  }

  return {
    domain,
    name: siteName?.trim() || title,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    logoCandidates: logoIcons,
    palette,
    ogImage,
    description: ogDescription?.trim() ?? null,
  };
}

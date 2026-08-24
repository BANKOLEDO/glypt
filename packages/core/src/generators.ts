export type BrandInput = {
  name: string;
  domain: string;
  palette: string[];
  description?: string | null;
  logoSvg?: string | null;
};

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const FALLBACK_PALETTE = ["#FF5A1F", "#221B15", "#FFF6EC"];

export function safePalette(palette: string[], fallback = FALLBACK_PALETTE[0]): string[] {
  const clean = palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 5);
  return clean.length ? clean : [...FALLBACK_PALETTE];
}

export function socialSvg(brand: BrandInput, title: string, subtitle = ""): string {
  const [c1, c2 = "#221B15", ink = "#FFF6EC"] = safePalette(brand.palette);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${esc(c2)}"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="${esc(c1)}" stroke-width="4"/>
  <rect x="48" y="48" width="220" height="12" fill="${esc(c1)}"/>
  <text x="96" y="200" font-family="'JetBrains Mono',monospace" font-size="26" fill="${esc(c1)}" letter-spacing="8">${esc(brand.domain.toUpperCase())}</text>
  <text x="96" y="300" font-family="'Martian Mono',monospace" font-size="64" font-weight="bold" fill="${esc(ink)}">${esc(title.slice(0, 28))}</text>
  ${subtitle ? `<text x="96" y="370" font-family="'Basier Square',sans-serif" font-size="30" fill="#8A7E72">${esc(subtitle.slice(0, 60))}</text>` : ""}
  <text x="96" y="540" font-family="'JetBrains Mono',monospace" font-size="18" fill="#8A7E72" letter-spacing="4">MADE WITH GLYPT</text>
</svg>`;
}

const FRAMES = {
  browser: { w: 960, h: 600, chrome: 56 },
  phone: { w: 420, h: 800, chrome: 40 },
} as const;

export type FrameKind = keyof typeof FRAMES;

export function mockupSvg(imageUrl: string, kind: FrameKind = "browser"): string | null {
  if (!/^https:\/\//i.test(imageUrl)) return null;
  const f = FRAMES[kind];
  const pad = 24;
  const w = f.w + pad * 2;
  const h = f.h + pad * 2 + f.chrome;
  const dots = ["#F23D97", "#FFC531", "#00C389"]
    .map((c, i) => `<circle cx="${pad + 20 + i * 24}" cy="${pad + f.chrome / 2}" r="7" fill="${c}"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="18" fill="#221B15"/>
  <rect width="${w}" height="${f.chrome}" rx="18" fill="#3A322B"/>
  ${kind === "browser" ? dots : ""}
  <image href="${esc(imageUrl)}" x="${pad}" y="${pad + f.chrome}" width="${f.w}" height="${f.h}" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
}

export function deckHtml(brand: BrandInput): string {
  const p = safePalette(brand.palette);
  const slides: { kicker: string; title: string; body: string }[] = [
    { kicker: "01 / COVER", title: brand.name, body: `${brand.domain} - brand guidelines` },
    { kicker: "02 / OVERVIEW", title: "Who we are", body: esc(brand.description ?? `The ${brand.name} visual identity in one deck.`) },
    { kicker: "03 / LOGO", title: "Logo usage", body: "Clear space equals the height of the mark. Never rotate, stretch or recolor outside the approved palette." },
    { kicker: "04 / PALETTE", title: "Color system", body: p.join("  ").toUpperCase() },
    { kicker: "05 / TYPOGRAPHY", title: "Type stack", body: "Display: Martian Mono - Body: Basier Square - Labels: JetBrains Mono." },
    { kicker: "06 / ICONOGRAPHY", title: "Icon rules", body: "Consistent stroke width, rounded corners, no emojis. Sourced and versioned through Glypt." },
    { kicker: "07 / IMAGERY", title: "Art direction", body: "Warm surfaces, generous whitespace, playful accents." },
    { kicker: "08 / VOICE", title: "Tone of voice", body: "Direct, precise, human. Short sentences win." },
    { kicker: "09 / APPLICATIONS", title: "In the wild", body: "Web, social cards, decks and product UI all inherit these tokens automatically." },
    { kicker: "10 / CONTACT", title: `${brand.name}`, body: `press & brand inquiries - ${brand.domain}` },
  ];

  const html = slides
    .map(
      (s, i) => `
  <section class="slide" style="--a:${p[i % p.length]}">
    <p class="kicker">${s.kicker}</p>
    <h1>${s.title}</h1>
    <p class="body">${s.body}</p>
    ${i === 3 ? `<div class="swatches">${p.map((c) => `<span style="background:${c}"><em>${c}</em></span>`).join("")}</div>` : ""}
  </section>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${esc(brand.name)} - Brand Deck</title>
<style>
  :root{--ink:#221B15;--bg:#FFF6EC;--mute:#8A7E72;--line:#ECDFD0}
  *{box-sizing:border-box;margin:0}
  body{background:#F5EBDD;font-family:'Basier Square',system-ui,sans-serif}
  .slide{width:1280px;height:720px;padding:72px;background:var(--bg);color:var(--ink);
         border-top:12px solid var(--a);page-break-after:always;display:flex;flex-direction:column}
  .kicker{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.35em;color:var(--mute)}
  h1{font-family:'Martian Mono',monospace;font-size:64px;margin:auto 0 16px;line-height:1.05}
  .body{font-size:24px;color:var(--mute);max-width:900px;line-height:1.5}
  .swatches{display:flex;gap:10px;margin-top:32px}
  .swatches span{width:110px;height:110px;border-radius:14px;display:flex;align-items:flex-end;padding:8px;box-shadow:0 4px 0 rgba(34,27,21,.15)}
  .swatches em{font-style:normal;font-family:'JetBrains Mono',monospace;font-size:11px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.4)}
  @media print{body{background:#fff}}
</style></head>
<body>${html}
</body></html>`;
}

const HEX_RE = /^#[0-9a-f]{3,8}$/i;

export function isValidHex(color: string): boolean {
  return HEX_RE.test(color);
}

export function recolorSvg(svg: string, color: string): string {
  if (!isValidHex(color)) return svg;
  let out = svg.replaceAll("currentColor", color);
  if (!out.includes("fill=") && !out.includes("stroke=")) {
    out = out.replace("<svg ", `<svg fill="${color}" `);
  }
  return out;
}

export function scaleStroke(svg: string, factor: number): string {
  const f = Math.min(Math.max(factor, 0.25), 4);
  return svg.replace(/stroke-width="([\d.]+)"/g, (_m, n: string) => {
    const scaled = Math.round(parseFloat(n) * f * 100) / 100;
    return `stroke-width="${scaled}"`;
  });
}

function unwrap(svg: string): { viewBox: string; inner: string } | null {
  const vb = svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 24 24";
  const start = svg.indexOf(">") + 1;
  const end = svg.lastIndexOf("</svg>");
  if (start <= 0 || end < start) return null;
  return { viewBox: vb, inner: svg.slice(start, end) };
}

export function transformSvg(
  svg: string,
  opts: { flipH?: boolean; flipV?: boolean; rotate90?: boolean } = {},
): string {
  if (!opts.flipH && !opts.flipV && !opts.rotate90) return svg;
  const parts = unwrap(svg);
  if (!parts) return svg;

  const t: string[] = [];
  if (opts.rotate90) t.push("rotate(90)");
  if (opts.flipH) t.push("translate(24,0) scale(-1,1)");
  if (opts.flipV) t.push("translate(0,24) scale(1,-1)");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${parts.viewBox}"><g transform="${t.join(" ")}">${parts.inner}</g></svg>`;
}

export type VariantOptions = {
  colors?: string[];
  strokes?: number[];
  flipH?: boolean;
  rotate90?: boolean;
};

export type Variant = {
  color: string | null;
  strokeWidth: number | null;
  flipH: boolean;
  rotate90: boolean;
  svg: string;
};

const MAX_VARIANTS = 12;

export function buildVariants(base: string, opts: VariantOptions): Variant[] {
  const colors = (opts.colors ?? [null]).slice(0, 4);
  for (const c of colors) {
    if (c !== null && !isValidHex(c)) throw new Error(`invalid color: ${c}`);
  }
  const strokes = (opts.strokes ?? [null]).slice(0, 3);
  const flips = opts.flipH ? [false, true] : [false];
  const rots = opts.rotate90 ? [false, true] : [false];

  const variants: Variant[] = [];
  for (const color of colors) {
    for (const strokeWidth of strokes) {
      for (const flipH of flips) {
        for (const rotate90 of rots) {
          let s = base;
          if (color !== null) s = recolorSvg(s, color);
          if (strokeWidth !== null) s = scaleStroke(s, strokeWidth);
          s = transformSvg(s, { flipH, rotate90 });
          variants.push({
            color,
            strokeWidth,
            flipH,
            rotate90,
            svg: s,
          });
          if (variants.length >= MAX_VARIANTS) return variants;
        }
      }
    }
  }
  return variants;
}

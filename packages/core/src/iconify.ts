export type SearchResult = {
  icons: string[];
  total: number;
  limit: number;
  start: number;
  collections: Record<string, { name?: string; license?: { title?: string } }>;
};

const API = "https://api.iconify.design";

const ID_RE = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/i;

export function isValidIconId(id: string): boolean {
  return ID_RE.test(id);
}

export async function searchIcons(
  query: string,
  limit = 24,
): Promise<SearchResult> {
  const url = `${API}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iconify search failed: ${res.status}`);
  const data = (await res.json()) as SearchResult;
  // public /search caps at 32 and ignores limit; enforce the window here
  return { ...data, icons: data.icons.slice(0, limit) };
}

export async function fetchIconSvg(id: string): Promise<string | null> {
  if (!isValidIconId(id)) return null;
  const [prefix, name] = id.split(":");
  const res = await fetch(`${API}/${prefix}/${name}.svg?height=64`);
  if (!res.ok) return null;
  return res.text();
}

export function buildRefs(count: number, cols: number) {
  const rows = "ABCDEFGH".split("");
  const refs: { ref: string; index: number }[] = [];
  for (let i = 0; i < count; i++) {
    refs.push({ ref: `${rows[Math.floor(i / cols)]}${(i % cols) + 1}`, index: i });
  }
  return refs;
}

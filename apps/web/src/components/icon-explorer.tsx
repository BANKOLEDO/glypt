import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { FORMATS, LANGS, fileExtFor, snippetFor, type Format, type Lang } from "@glypt/core";

const COLLECTION_COLOR: Record<string, string> = {
  lucide: "#FF5A1F",
  heroicons: "#35A4FF",
  ph: "#00C389",
  tabler: "#E8A20C",
  mdi: "#F23D97",
  ri: "#0F7AC0",
  logos: "#8BC34A",
  simple_icons: "#8A7E72",
};

function accentFor(id: string): string {
  return COLLECTION_COLOR[id.split(":")[0]] ?? "#FFB020";
}

export function IconExplorer({
  compact = false,
  initialQuery = "",
}: {
  compact?: boolean;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [icons, setIcons] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<Format>("react");
  const [lang, setLang] = useState<Lang>("ts");
  const [toast, setToast] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [nonce, setNonce] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("glypt.recent");
      if (raw) setRecent(JSON.parse(raw).slice(0, 6));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setIcons([]);
      setTotal(0);
      setError(null);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);
      const limit = compact ? 12 : 48;
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
          { signal: ac.signal, credentials: "include" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "search failed");
        setIcons(data.icons ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // glypt api unreachable, fall back to the public iconify index
        try {
          const res2 = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`,
            { signal: ac.signal },
          );
          const d2 = await res2.json();
          const ids: string[] = (d2.icons ?? []).map((i: string | { prefix: string; name: string }) =>
            typeof i === "string" ? i : `${i.prefix}:${i.name}`,
          );
          setIcons(ids);
          setTotal(d2.total ?? ids.length);
        } catch {
          setError("Search unavailable, try again");
          setIcons([]);
        }
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query, compact, nonce]);

  const remember = useCallback((q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((p) => p !== q)].slice(0, 6);
      try {
        localStorage.setItem("glypt.recent", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  async function pick(id: string) {
    remember(query.trim());
    try {
      let text: string;
      if (format === "svg") {
        const [prefix, name] = id.split(":");
        let res = await fetch(`/api/icon?prefix=${encodeURIComponent(prefix)}&name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error("api offline");
        text = await res.text();
        if (!text.includes("<svg")) throw new Error("bad payload");
      } else {
        text = snippetFor(id, format, lang);
      }
      await navigator.clipboard.writeText(text);
      setToast(`${id} ${fileExtFor(format, lang)} copied`);
    } catch {
      // last-resort CDN copy so the interaction never dead-ends
      const [prefix, name] = id.split(":");
      try {
        const cdn = await fetch(`https://api.iconify.design/${prefix}/${name}.svg`);
        await navigator.clipboard.writeText(await cdn.text());
        setToast(`${id} SVG copied`);
      } catch {
        setToast("Clipboard blocked by browser");
      }
    }
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md border-2 border-line bg-white px-3 py-1 transition-colors focus-within:border-tang">
        <Icon icon="ph:magnifying-glass-bold" className="size-4 shrink-0 text-tang" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={compact ? "search icons…" : "search 200,000+ icons… rocket, arrow-up-right, vercel"}
          aria-label="Search icons"
          className={clsx("w-full bg-transparent text-sm text-ink placeholder:text-mute/60 focus:outline-none", compact ? "py-2" : "py-3")}
        />
        {loading && (
          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-tang" />
        )}
      </div>

      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={clsx(
                "rounded-full border-2 px-3 py-1 font-mono text-[11px] font-bold tracking-wide uppercase transition-all",
                format === f
                  ? "border-tang bg-tang text-white"
                  : "border-line bg-white text-mute hover:border-ink hover:text-ink",
              )}
            >
              {f}
            </button>
          ))}
          {format !== "svg" && (
            <span className="flex overflow-hidden rounded-full border-2 border-line">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={clsx(
                    "px-2.5 py-[3px] font-mono text-[10px] font-bold uppercase transition-colors",
                    lang === l ? "bg-ink text-citrine" : "bg-white text-mute hover:text-ink",
                  )}
                >
                  {l}
                </button>
              ))}
            </span>
          )}
          {total > 0 && (
            <span className="ml-auto font-mono text-[11px] tracking-wide text-mute">
              {total.toLocaleString()} matches
            </span>
          )}
        </div>
      )}

      {recent.length > 0 && !query && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recent.map((r) => (
            <button key={r} onClick={() => setQuery(r)} className="chip hover:!text-ink">
              ↺ {r}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-3">
          <p role="alert" className="font-mono text-xs font-medium text-berry">
            {error}
          </p>
          <button
            onClick={() => setNonce((n) => n + 1)}
            className="rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-[10px] font-bold tracking-wide uppercase shadow-[2px_2px_0_0_var(--color-line)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            retry
          </button>
        </div>
      )}

      {icons.length > 0 && (
        <div
          className={clsx(
            "mt-2.5 scrollbar-none",
            compact && "max-h-44 overflow-y-auto pr-1",
          )}
        >
          <div
            className={clsx(
              "grid gap-1.5 sm:gap-2",
              compact
                ? "grid-cols-6 sm:grid-cols-8"
                : "grid-cols-[repeat(auto-fill,minmax(64px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(84px,1fr))]",
            )}
            role="listbox"
            aria-label="Icon results"
          >
            {icons.map((id) => (
              <button
                key={id}
                role="option"
                aria-selected={false}
                onClick={() => pick(id)}
                title={`${id} · click to copy`}
                className={clsx(
                  "group relative grid aspect-square place-items-center overflow-hidden rounded-lg bg-paper ring-1 ring-line transition-all",
                  "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_16px_-10px_rgba(34,27,21,0.35)] hover:ring-tang",
                  compact ? "" : "rounded-xl",
                )}
              >
                <Icon
                  icon={id}
                  width={compact ? 18 : 28}
                  height={compact ? 18 : 28}
                  className="text-ink transition-transform group-hover:scale-110"
                />
                {!compact && (
                  <>
                    <span
                      className="absolute top-1.5 left-1.5 size-2 rounded-full"
                      style={{ backgroundColor: accentFor(id) }}
                    />
                    <span className="absolute inset-x-1 bottom-1 truncate font-mono text-[9px] tracking-wide text-mute opacity-0 transition-opacity group-hover:opacity-100">
                      {id.split(":")[1]}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {query && !loading && icons.length === 0 && !error && (
        <p className="mt-4 font-mono text-xs text-mute">no matches for “{query}”</p>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[100] max-w-[92vw] -translate-x-1/2 truncate rounded-full bg-mint px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-10px_rgba(0,195,137,0.6)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default IconExplorer;

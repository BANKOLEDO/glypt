import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { FORMATS, LANGS, fileExtFor, snippetFor, type Format, type Lang } from "@glypt/core";
import { useFavorites } from "../lib/favorites";

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

const PIN_COLORS = ["#FF5A1F", "#FFC531", "#00C389", "#35A4FF", "#F23D97"];

function accentFor(id: string): string {
  return COLLECTION_COLOR[id.split(":")[0]] ?? "#FFB020";
}

function tiltFor(id: string): number {
  return ((id.charCodeAt(id.length - 1) % 5) - 2) * 1.7;
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
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const { favorites, toggle } = useFavorites();

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

  async function pin(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const wasIn = favorites.includes(id);
    await toggle(id);
    setToast(wasIn ? `${id} unpinned` : `${id} pinned to your stash`);
    setTimeout(() => setToast(null), 1800);
  }

  async function copyId(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await copyIdText(id);
  }

  async function copyIdText(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setToast(`${id} id copied`);
    } catch {
      setToast("Clipboard blocked by browser");
    }
    setTimeout(() => setToast(null), 1800);
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

          <button
            onClick={() => setPinnedOnly((p) => !p)}
            aria-pressed={pinnedOnly}
            className={clsx(
              "ml-auto inline-flex items-center gap-1.5 rounded-full border-2 py-1 pr-2.5 pl-2 font-mono text-[11px] font-bold tracking-wide uppercase transition-all",
              pinnedOnly
                ? "border-ink bg-citrine text-ink shadow-[2px_2px_0_0_var(--color-ink)]"
                : "border-line bg-white text-mute hover:border-ink hover:text-ink",
            )}
          >
            <Icon icon="ph:push-pin-fill" className="size-3.5" aria-hidden />
            stash
            <span
              className={clsx(
                "grid min-w-5 place-items-center rounded-full px-1 text-[10px]",
                pinnedOnly ? "bg-ink text-citrine" : "bg-paper text-mute",
              )}
            >
              {favorites.length}
            </span>
          </button>
        </div>
      )}

      {pinnedOnly ? (
        <StashBoard
          ids={favorites}
          onPick={pick}
          onUnpin={(id) => void toggle(id)}
          onCopyId={(id) => void copyIdText(id)}
          compact={compact}
        />
      ) : (
        <>
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
                  <div key={id} className="group flex flex-col">
                    <div
                      role="option"
                      aria-selected={false}
                      tabIndex={0}
                      onClick={() => pick(id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pick(id);
                        }
                      }}
                      title={`${id} · click to copy`}
                      className={clsx(
                        "relative grid aspect-square w-full cursor-pointer place-items-center overflow-hidden bg-paper ring-1 ring-line outline-none transition-all",
                        "group-hover:-translate-y-0.5 group-hover:bg-white group-hover:shadow-[0_8px_16px_-10px_rgba(34,27,21,0.35)] group-hover:ring-tang",
                        "focus-visible:ring-2 focus-visible:ring-tang",
                        compact ? "rounded-lg" : "rounded-xl",
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
                            className="absolute top-2 left-2 size-2 rounded-full"
                            style={{ backgroundColor: accentFor(id) }}
                          />
                          <button
                            type="button"
                            onClick={(e) => void pin(id, e)}
                            aria-label={favorites.includes(id) ? `Unpin ${id}` : `Pin ${id} to stash`}
                            aria-pressed={favorites.includes(id)}
                            className={clsx(
                              "absolute top-2 right-2 grid size-5 place-items-center rounded-full border transition-all active:scale-90",
                              favorites.includes(id)
                                ? "border-ink bg-citrine text-ink opacity-100 shadow-[1.5px_1.5px_0_0_var(--color-ink)]"
                                : "border-line bg-white text-mute opacity-0 shadow-[0_1px_2px_rgba(34,27,21,0.12)] group-hover:opacity-100 hover:border-ink hover:text-tang focus-visible:opacity-100",
                            )}
                          >
                            <Icon
                              icon={favorites.includes(id) ? "ph:push-pin-fill" : "ph:push-pin"}
                              className="size-3"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => void copyId(id, e)}
                            aria-label={`Copy id ${id}`}
                            title={`Copy id · ${id}`}
                            className="absolute bottom-2 left-2 grid size-5 place-items-center rounded-full border border-line bg-white text-mute opacity-0 shadow-[0_1px_2px_rgba(34,27,21,0.12)] transition-all group-hover:opacity-100 hover:border-ink hover:text-tang focus-visible:opacity-100 active:scale-90 max-md:opacity-100"
                          >
                            <Icon icon="ph:identification-card-bold" className="size-3" />
                          </button>
                        </>
                      )}
                    </div>
                    {!compact && (
                      <span className="mt-1 line-clamp-2 w-full break-all text-center font-mono text-[9px] leading-tight text-mute">
                        {id.split(":")[1]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {query && !loading && icons.length === 0 && !error && (
            <p className="mt-4 font-mono text-xs text-mute">no matches for “{query}”</p>
          )}
        </>
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

function StashBoard({
  ids,
  onPick,
  onUnpin,
  onCopyId,
}: {
  ids: string[];
  onPick: (id: string) => void;
  onUnpin: (id: string) => void;
  onCopyId: (id: string) => void;
  compact: boolean;
}) {
  if (ids.length === 0) {
    return (
      <div className="dot-bg mt-3 rounded-xl border-2 border-dashed border-line p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-citrine text-ink shadow-[3px_3px_0_0_var(--color-ink)]">
          <Icon icon="ph:push-pin-fill" className="size-6" />
        </span>
        <p className="mt-3 font-display text-base font-bold">Your stash is empty.</p>
        <p className="mt-1 font-mono text-[11px] text-mute">
          Hover any icon and tap the pin to save it here.
        </p>
      </div>
    );
  }
  return (
    <div className="dot-bg mt-3 rounded-xl border-2 border-line bg-paper p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="label-mono">pinned to your stash</p>
        <span className="sticker bg-citrine text-ink">{ids.length} saved</span>
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))]">
        {ids.map((id, i) => {
          const tilt = tiltFor(id);
          const color = PIN_COLORS[i % PIN_COLORS.length];
          return (
            <div
              key={id}
              className="group relative"
              style={{ transform: `rotate(${tilt}deg)` }}
            >
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-lg drop-shadow-[0_2px_0_rgba(34,27,21,0.25)]"
                style={{ color }}
              >
                <Icon icon="ph:push-pin-fill" />
              </span>
              <button
                type="button"
                onClick={() => onPick(id)}
                title={`${id} · click to copy`}
                className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border-2 border-ink bg-white shadow-[3px_3px_0_0_var(--color-ink)] transition-transform hover:-translate-y-1"
              >
                <Icon icon={id} width={34} height={34} className="text-ink" />
              </button>
              <span className="mt-1 block break-all text-center font-mono text-[9px] leading-tight text-mute">
                {id.split(":")[1]}
              </span>
              <button
                type="button"
                onClick={() => onUnpin(id)}
                aria-label={`Unpin ${id}`}
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-ink bg-white text-ink opacity-0 transition-opacity hover:bg-berry hover:text-white group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
              >
                <Icon icon="ph:x-bold" className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => onCopyId(id)}
                aria-label={`Copy id ${id}`}
                title={`Copy id · ${id}`}
                className="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full border-2 border-ink bg-white text-ink opacity-0 shadow-[1.5px_1.5px_0_0_var(--color-ink)] transition-opacity hover:bg-tang hover:text-white group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
              >
                <Icon icon="ph:identification-card-bold" className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IconExplorer;

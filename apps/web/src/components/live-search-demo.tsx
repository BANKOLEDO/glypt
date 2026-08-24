import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import { snippetFor } from "@glypt/core";

const SUGGESTIONS = ["rocket", "heart", "bolt", "cloud"];

export function LiveSearchDemo() {
  const [query, setQuery] = useState("rocket");
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setIcons([]);
      setLoading(false);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        let ids: string[] = [];
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`, {
            signal: ac.signal,
          });
          if (!res.ok) throw new Error();
          ids = (await res.json()).icons ?? [];
        } catch {
          const res = await fetch(
            `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=8`,
            { signal: ac.signal },
          );
          ids = ((await res.json()).icons ?? []).map(
            (i: string | { prefix: string; name: string }) =>
              typeof i === "string" ? i : `${i.prefix}:${i.name}`,
          );
        }
        setIcons(ids.slice(0, 8));
      } catch {
        setIcons([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  async function pick(id: string) {
    try {
      await navigator.clipboard.writeText(snippetFor(id, "react"));
    } catch {
      // clipboard blocked, tile flash still confirms intent
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1300);
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-xl border-2 border-line bg-white px-3.5 py-2.5 transition-colors focus-within:border-tang">
        <Icon icon="ph:magnifying-glass-bold" className="size-4 shrink-0 text-tang" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="try “arrow”, “star”, “wallet”…"
          aria-label="Try a live icon search"
          className="w-full bg-transparent text-sm text-ink placeholder:text-mute/60 focus:outline-none"
        />
        {loading ? (
          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-tang" />
        ) : (
          <span className="size-2 shrink-0 rounded-full bg-mint" />
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            className={clsx(
              "rounded-full px-3 py-1 font-mono text-[11px] font-medium transition-colors",
              query === s ? "bg-ink text-citrine" : "bg-white text-mute ring-1 ring-line hover:text-ink",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {(loading ? Array.from({ length: 8 }).map((_, i) => null) : icons).map((id, i) =>
          id === null ? (
            <div key={`skeleton-${i}`} className="aspect-square animate-pulse rounded-xl bg-paper" />
          ) : (
            <button
              key={id}
              onClick={() => pick(id)}
              title={`${id} · tap to copy`}
              className={clsx(
                "relative grid aspect-square place-items-center rounded-xl transition-all duration-100",
                copiedId === id
                  ? "bg-mint-soft ring-2 ring-mint"
                  : "bg-paper ring-1 ring-line hover:-translate-y-0.5 hover:bg-white hover:ring-tang",
              )}
            >
              {copiedId === id ? (
                <Icon icon="ph:check-fat-fill" className="size-6 text-mint" aria-label="copied" />
              ) : (
                <Icon icon={id} width={26} height={26} className="text-ink" />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

export default LiveSearchDemo;

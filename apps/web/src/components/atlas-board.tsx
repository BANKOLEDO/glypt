import { useEffect, useRef, useState } from "react";
import { Icon as Iconify } from "@iconify/react";
import clsx from "clsx";
import { buildRefs, snippetFor } from "@glypt/core";
import { getJson } from "../lib/api";

type Cell = { ref: string; id: string };

const DEMO_ICONS = [
  "lucide:home", "heroicons:user", "ph:star", "tabler:heart",
  "mdi:rocket-launch", "lucide:search", "ph:lightning", "heroicons:cog-6-tooth",
  "tabler:bell", "mdi:magnify", "lucide:settings", "ph:user-circle",
];

function demoCells(cols: number): Cell[] {
  const refs = buildRefs(DEMO_ICONS.length, Math.min(4, Math.max(2, cols)));
  return refs.map((r) => ({ ref: r.ref, id: DEMO_ICONS[r.index]! }));
}

export function AtlasBoard({ cols = 4 }: { cols?: number }) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cursor, setCursor] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getJson<{ cells: { ref: string; id: string }[] }>(`/api/atlas?cols=${cols}`)
      .then((d) => setCells(d.cells?.length ? d.cells : demoCells(cols)))
      .catch(() => setCells(demoCells(cols)))
      .finally(() => setLoading(false));
  }, [cols]);

  async function copyImport(cell: Cell) {
    try {
      await navigator.clipboard.writeText(snippetFor(cell.id, "react"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!cells.length) return;
    const perRow = Math.min(cols, 4);
    let next = cursor;
    // keyboard works whether focus sits on the grid or on a tile inside it
    gridRef.current?.focus();

    switch (e.key) {
      case "ArrowRight":
        next = Math.min(cells.length - 1, cursor + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, cursor - 1);
        break;
      case "ArrowDown":
        next = Math.min(cells.length - 1, cursor + perRow);
        break;
      case "ArrowUp":
        next = Math.max(0, cursor - perRow);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = cells.length - 1;
        break;
      case "Enter":
      case " ":
        setSelected(cells[cursor]!);
        e.preventDefault();
        return;
      case "c":
      case "C": {
        const cell = cells[cursor];
        if (cell) copyImport(cell);
        return;
      }
      default:
        return;
    }

    if (next !== cursor) {
      e.preventDefault();
      setCursor(next);
      requestAnimationFrame(() => {
        gridRef.current
          ?.querySelectorAll("button")
          [next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-busy>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-paper shadow-[0_4px_0_0_var(--color-line)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div
        ref={gridRef}
        role="grid"
        aria-label="Icon atlas · arrow keys to move, Enter to select"
        tabIndex={0}
        onKeyDown={onKeyDown}
        data-suppress-focus
        className="grid grid-cols-4 gap-2 rounded-xl outline-none sm:gap-3 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": Math.min(cols, 6) } as React.CSSProperties}
      >
        {cells.map((cell, i) => (
          <button
            key={cell.ref}
            onClick={() => {
              setCursor(i);
              setSelected(cell);
            }}
            onDoubleClick={() => copyImport(cell)}
            onMouseEnter={() => setCursor(i)}
            className={clsx(
              "group relative aspect-square overflow-hidden rounded-xl bg-paper",
              "transition-all duration-100 ease-out select-none",
              "shadow-[0_4px_0_0_var(--color-line)]",
              "hover:-translate-y-0.5 hover:bg-white",
              "hover:shadow-[0_7px_0_0_var(--color-line),0_14px_22px_-12px_rgba(34,27,21,0.35)]",
              "active:translate-y-[2px] active:bg-white active:duration-75",
              "active:shadow-[0_2px_0_0_var(--color-line)]",
              (i === cursor) && "!bg-white !shadow-[0_4px_0_0_rgba(34,27,21,0.35)]",
              selected?.ref === cell.ref &&
                "!bg-white ring-2 ring-ink !shadow-[0_4px_0_0_rgba(34,27,21,0.35)]",
            )}
            title={`${cell.ref} → ${cell.id}`}
            tabIndex={-1}
          >
            <span className="absolute top-1.5 right-0 left-0 text-center font-mono text-[9px] font-bold text-mute transition-colors group-hover:text-tang sm:text-[10px]">
              {cell.ref}
            </span>
            <div className="absolute inset-0 mt-1.5 grid place-items-center">
              <Iconify
                icon={cell.id}
                className="size-5 text-ink transition-transform group-hover:scale-110 sm:size-7"
                aria-hidden
              />
            </div>
            {selected?.ref === cell.ref && (
              <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-citrine">
                <Iconify icon="ph:check-bold" className="size-2.5 text-ink" aria-hidden />
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 hidden flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] tracking-[0.14em] text-mute uppercase sm:flex" aria-hidden>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded-md bg-sky-soft px-2 py-1 font-mono text-[10px] font-bold tracking-normal text-sky normal-case shadow-[0_2px_0_0_rgba(34,27,21,0.15)]">
            ←→↑↓
          </kbd>
          move
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded-md bg-mint-soft px-2 py-1 font-mono text-[10px] font-bold tracking-normal text-mint normal-case shadow-[0_2px_0_0_rgba(34,27,21,0.15)]">
            enter
          </kbd>
          select
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded-md bg-citrine-soft px-2 py-1 font-mono text-[10px] font-bold tracking-normal text-ink normal-case shadow-[0_2px_0_0_rgba(34,27,21,0.15)]">
            C
          </kbd>
          copy import · click any key too
        </span>
      </p>

      {selected && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sky-soft p-2.5 sm:gap-3 sm:p-3">
          <span className="rounded-full bg-ink px-2.5 py-0.5 font-mono text-xs font-bold text-citrine">
            {selected.ref}
          </span>
          <code className="truncate font-mono text-xs font-medium text-ink">{selected.id}</code>
          <button onClick={() => copyImport(selected)} className="btn-primary ml-auto !px-3.5 !py-1.5 text-xs">
            {copied ? "Copied ✓" : "Write import"}
          </button>
        </div>
      )}
    </div>
  );
}

export default AtlasBoard;

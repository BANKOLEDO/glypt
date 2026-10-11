import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { snippetFor } from "@glypt/core";
import { getJson, postJson, downloadExportZip } from "../lib/api";
import type { User } from "../lib/auth";

type Collection = {
  id: string;
  name: string;
  color: string;
  count: number;
  icons: string[];
};

const FOLDER_COLORS = ["#FF5A1F", "#00C389", "#3B82F6", "#E8A20C", "#F23D97", "#7C3AED"];

export function CollectionsManager({ user }: { user: User }) {
  const [state, setState] = useState<"loading" | "ok" | "nodb">("loading");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [addId, setAddId] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const active = collections.find((c) => c.id === activeId) ?? null;
  const totalIcons = collections.reduce((sum, c) => sum + (c.count || c.icons.length), 0);

  const flash = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2400);
  }, []);

  useEffect(() => {
    getJson<{ collections: Collection[] }>("/api/collections")
      .then((d) => {
        setCollections(d.collections ?? []);
        setState("ok");
        setActiveId((prev) => prev ?? d.collections?.[0]?.id ?? null);
      })
      .catch(() => setState("nodb"));
  }, []);

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const color = FOLDER_COLORS[collections.length % FOLDER_COLORS.length]!;
      await postJson("/api/collections", { name: newName.trim(), color });
      setNewName("");
      flash("Folder created");
      const d = await getJson<{ collections: Collection[] }>("/api/collections");
      setCollections(d.collections ?? []);
      const created = d.collections?.at(-1);
      if (created) setActiveId(created.id);
    } catch {
      flash("Could not create folder");
    }
  }

  async function addIcon(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId) return flash("Pick a folder first");
    if (!addId.includes(":")) return flash("Use format prefix:name");
    try {
      await postJson(`/api/collections/${activeId}/icons`, { iconId: addId.trim() });
      setAddId("");
      flash("Saved to folder");
      const d = await getJson<{ collections: Collection[] }>("/api/collections");
      setCollections(d.collections ?? []);
    } catch {
      flash("Save failed");
    }
  }

  async function removeIcon(iconId: string) {
    if (!activeId) return;
    await fetch(`/api/collections/${activeId}/icons/${encodeURIComponent(iconId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    setCollections((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, icons: c.icons.filter((i) => i !== iconId), count: Math.max(0, c.count - 1) }
          : c,
      ),
    );
  }

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      flash("Share link copied");
    } catch {
      flash("Copy blocked");
    }
  }

  async function createShare() {
    if (!active) return;
    try {
      const data = await postJson<{ token: string; url: string }>("/api/shares", {
        kind: "collection",
        payload: { name: active.name, ids: active.icons },
      });
      setShareUrl(`${window.location.origin}${data.url}`);
      flash("Share link ready");
    } catch {
      flash("Share failed");
    }
  }

  async function exportZip() {
    if (!active || !active.icons.length) return flash("Folder is empty");
    try {
      await downloadExportZip(active.icons, ["svg"], `${active.name.toLowerCase().replace(/\s+/g, "-")}-glypt-export`);
      flash("ZIP downloaded");
    } catch {
      flash("Export failed");
    }
  }

  if (state === "loading") {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-paper ring-1 ring-line" />
        ))}
      </div>
    );
  }

  if (state === "nodb") {
    return (
      <div className="card flex flex-col items-start gap-4 bg-citrine-soft !ring-0 p-6 sm:flex-row sm:items-center">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-ink bg-white text-xl shadow-[3px_3px_0_0_var(--color-ink)]">
          <Icon icon="ph:cloud-slash-bold" className="size-6" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-ink">Sync is warming up</p>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-mute">
            Search, the atlas and share pages all work right now. Folders will
            appear here the moment sync is online.
          </p>
        </div>
        <Link to="/search" className="btn-primary shrink-0 !px-5 !py-2.5">
          Browse the atlas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* active folder hero */}
      {active ? (
        <div className="card relative overflow-hidden p-0">
          <div className="absolute inset-x-0 top-0 z-10 grid h-1.5 grid-cols-5" aria-hidden>
            <div className="bg-tang" />
            <div className="bg-citrine" />
            <div className="bg-mint" />
            <div className="bg-sky" />
            <div className="bg-berry" />
          </div>
          <div className="relative p-5 pt-7 sm:p-6 sm:pt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="label-mono">active folder</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <span className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: active.color }} />
                  <h2 className="truncate font-display text-2xl font-bold text-ink sm:text-3xl">{active.name}</h2>
                </div>
                <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-mute uppercase">
                  {active.icons.length} {active.icons.length === 1 ? "asset" : "assets"} ready to ship
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  onClick={createShare}
                  disabled={!active.icons.length}
                  className="btn-ghost flex-1 !px-4 !py-2.5 disabled:opacity-50 sm:flex-none"
                >
                  <Icon icon="ph:link-bold" className="size-4" aria-hidden />
                  Share link
                </button>
                <button
                  onClick={exportZip}
                  disabled={!active.icons.length}
                  className="btn-primary flex-1 !px-4 !py-2.5 disabled:opacity-50 sm:flex-none"
                >
                  <Icon icon="ph:download-bold" className="size-4" aria-hidden />
                  Export ZIP
                </button>
              </div>
            </div>

            {shareUrl && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper p-3 ring-1 ring-line">
                <Icon icon="ph:link-simple-bold" className="size-4 shrink-0 text-tang" aria-hidden />
                <code className="min-w-0 flex-1 font-mono text-[11px] text-tang-hi break-all">{shareUrl}</code>
                <button
                  onClick={copyShareUrl}
                  aria-label="Copy share link"
                  title="Copy share link"
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-white text-mute ring-1 ring-line transition-colors hover:text-tang"
                >
                  <Icon icon="ph:copy-bold" className="size-3.5" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card flex flex-col items-center gap-2 p-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-tang-soft text-tang">
            <Icon icon="ph:folder-plus-bold" className="size-6" aria-hidden />
          </span>
          <p className="font-display text-lg font-bold text-ink">Create your first brand folder</p>
          <p className="max-w-sm text-sm leading-relaxed text-mute">
            Folders keep icons, palettes and exports in one place, ready to share with your team.
          </p>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4" role="list" aria-label="Workspace summary">
        <div className="rounded-2xl bg-tang-soft p-3.5 sm:p-4">
          <span className="grid size-8 place-items-center rounded-xl bg-white text-tang sm:size-9">
            <Icon icon="ph:folder-simple-bold" className="size-4" aria-hidden />
          </span>
          <p className="mt-3 font-display text-2xl leading-none font-bold text-ink sm:text-3xl">{collections.length}</p>
          <p className="mt-1.5 font-mono text-[9px] tracking-[0.14em] text-ink/60 uppercase sm:text-[10px]">folders</p>
        </div>
        <div className="rounded-2xl bg-mint-soft p-3.5 sm:p-4">
          <span className="grid size-8 place-items-center rounded-xl bg-white text-mint sm:size-9">
            <Icon icon="ph:cube-bold" className="size-4" aria-hidden />
          </span>
          <p className="mt-3 font-display text-2xl leading-none font-bold text-ink sm:text-3xl">{totalIcons}</p>
          <p className="mt-1.5 font-mono text-[9px] tracking-[0.14em] text-ink/60 uppercase sm:text-[10px]">icons saved</p>
        </div>
        <div className="rounded-2xl bg-citrine-soft p-3.5 sm:p-4">
          <span
            className="grid size-8 place-items-center rounded-xl bg-white font-brand text-[11px] font-bold sm:size-9"
            style={{ color: active?.color ?? "#9A6A00" }}
          >
            {(active?.name ?? "—").slice(0, 1).toUpperCase()}
          </span>
          <p className="mt-3 truncate font-display text-base leading-tight font-bold text-ink sm:text-lg">
            {active?.name ?? "—"}
          </p>
          <p className="mt-1.5 font-mono text-[9px] tracking-[0.14em] text-ink/60 uppercase sm:text-[10px]">active folder</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* folders */}
        <div className="card flex flex-col overflow-hidden p-4">
          <div className="flex items-center justify-between">
            <p className="label-mono">brand folders</p>
            <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-mute">
              {collections.length}
            </span>
          </div>

          <ul className="mt-3 space-y-1.5">
            {collections.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  aria-current={activeId === c.id}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
                    activeId === c.id
                      ? "bg-tang-soft font-bold text-tang-hi ring-1 ring-tang/20"
                      : "text-mute hover:bg-paper hover:text-ink active:translate-y-px"
                  }`}
                >
                  <span
                    className={`size-2 shrink-0 rounded-full transition-transform ${activeId === c.id ? "scale-125" : ""}`}
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="font-mono text-[10px] font-normal text-mute">
                      {c.icons.length} {c.icons.length === 1 ? "asset" : "assets"}
                    </span>
                  </span>
                  <Icon
                    icon="ph:caret-right-bold"
                    className={`size-4 shrink-0 transition-transform ${activeId === c.id ? "rotate-90 text-tang" : "text-mute/40"}`}
                    aria-hidden
                  />
                </button>
              </li>
            ))}
            {collections.length === 0 && (
              <li className="rounded-xl border-2 border-dashed border-line px-4 py-6 text-center">
                <Icon icon="ph:folder-plus-bold" className="mx-auto size-6 text-mute/40" aria-hidden />
                <p className="mt-2 text-sm text-mute">No folders yet. Create one below.</p>
              </li>
            )}
          </ul>

          <form onSubmit={createFolder} className="mt-4 space-y-1.5 rounded-xl bg-paper p-2 ring-1 ring-line">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="new folder…"
              aria-label="New folder name"
              className="w-full rounded-lg border-2 border-line bg-white px-3 py-2 font-mono text-xs text-ink placeholder:text-mute/60 focus:border-tang focus:outline-none"
            />
            <button type="submit" className="btn-primary w-full !rounded-lg !px-3 !py-2 text-xs">
              <Icon icon="ph:plus-bold" className="size-4" aria-hidden />
              Create folder
            </button>
          </form>
          <p className="mt-2 px-1 font-mono text-[10px] text-mute/70">signed in as {user.email}</p>
        </div>

        {/* assets */}
        <div className="min-w-0 space-y-4">
          <form onSubmit={addIcon} className="card flex flex-col gap-2 p-4 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="label-mono shrink-0">add assets</span>
            <input
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              placeholder={active ? `save into "${active.name}"…` : "pick a folder first…"}
              aria-label="Icon id"
              disabled={!active}
              className="input flex-1 disabled:opacity-50"
            />
            <button type="submit" disabled={!active} className="btn-primary w-full disabled:opacity-50 sm:w-auto">
              Save
            </button>
          </form>

          {active && active.icons.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
              {active.icons.map((id) => (
                <div
                  key={id}
                  className="group overflow-hidden rounded-xl bg-paper ring-1 ring-line transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-14px_rgba(34,27,21,0.4)]"
                  title={`${id} · copy: react snippet · del: remove from folder`}
                >
                  <div className="grid aspect-square place-items-center bg-white p-3">
                    <Icon icon={id} width={36} height={36} aria-hidden />
                  </div>
                  <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                    <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-mute">{id.split(":")[1]}</p>
                    <span className="flex shrink-0 gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(snippetFor(id, "react")).then(() => flash("Copied"));
                        }}
                        aria-label={`Copy ${id}`}
                        title="Copy react snippet"
                        className="grid size-6 place-items-center rounded-md bg-mint-soft text-mint transition-colors hover:bg-mint hover:text-white"
                      >
                        <Icon icon="ph:copy-bold" className="size-3" aria-hidden />
                      </button>
                      <button
                        onClick={() => removeIcon(id)}
                        aria-label={`Remove ${id}`}
                        title="Remove from folder"
                        className="grid size-6 place-items-center rounded-md bg-berry/10 text-berry transition-colors hover:bg-berry hover:text-white"
                      >
                        <Icon icon="ph:trash-bold" className="size-3" aria-hidden />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card grid place-items-center gap-3 p-10 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-paper text-mute">
                <Icon icon="ph:stack-bold" className="size-6" aria-hidden />
              </span>
              <p className="max-w-xs text-sm leading-relaxed text-mute">
                {active
                  ? "This folder is empty. Paste an id like “lucide:rocket” above or grab icons from search."
                  : "Pick or create a folder to start collecting assets."}
              </p>
              <Link to="/search" className="btn-ghost">
                Browse the atlas
              </Link>
            </div>
          )}
        </div>
      </div>

      {msg && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-tang px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-10px_rgba(255,90,31,0.6)]"
        >
          {msg}
        </div>
      )}
    </div>
  );
}

export default CollectionsManager;
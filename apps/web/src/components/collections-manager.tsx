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
      await downloadExportZip(active.icons, ["svg"]);
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
      {/* stats */}
      <div className="grid grid-cols-3 gap-3" role="list" aria-label="Workspace summary">
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint-soft text-mint">
            <Icon icon="ph:folder-simple-bold" className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-xl leading-none font-bold text-ink">{collections.length}</span>
            <span className="mt-1 block font-mono text-[10px] tracking-widest text-mute uppercase">folders</span>
          </span>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-soft text-sky">
            <Icon icon="ph:cube-bold" className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-xl leading-none font-bold text-ink">{totalIcons}</span>
            <span className="mt-1 block font-mono text-[10px] tracking-widest text-mute uppercase">icons saved</span>
          </span>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-citrine-soft text-citrine-hi">
            <Icon icon="ph:funnel-simple-bold" className="size-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-sm leading-none font-bold text-ink sm:text-xl">
              {active?.name ?? "—"}
            </span>
            <span className="mt-1 block font-mono text-[10px] tracking-widest text-mute uppercase">active folder</span>
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* folders */}
        <div className="card p-4">
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
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    activeId === c.id
                      ? "bg-tang-soft font-bold text-tang-hi ring-1 ring-tang/20"
                      : "text-mute hover:bg-paper hover:text-ink"
                  }`}
                >
                  <span className="h-6 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="font-mono text-[10px] font-normal text-mute">
                      {c.icons.length} {c.icons.length === 1 ? "asset" : "assets"}
                    </span>
                  </span>
                  <Icon
                    icon="ph:caret-right-bold"
                    className={`size-4 shrink-0 ${activeId === c.id ? "text-tang" : "text-mute/40"}`}
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

          <form onSubmit={createFolder} className="mt-4 flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="new folder…"
              aria-label="New folder name"
              className="w-full rounded-xl border-2 border-line bg-white px-3.5 py-2 font-mono text-xs text-ink placeholder:text-mute/60 focus:border-tang focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Create folder"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-tang text-white shadow-[0_4px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Icon icon="ph:plus-bold" className="size-4" aria-hidden />
            </button>
          </form>
          <p className="mt-2 px-1 font-mono text-[10px] text-mute/70">signed in as {user.email}</p>
        </div>

        {/* assets */}
        <div className="min-w-0 space-y-4">
          <form onSubmit={addIcon} className="card flex flex-wrap items-center gap-2 p-4">
            <span className="label-mono shrink-0">add assets</span>
            <input
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              placeholder={active ? `save into "${active.name}"…` : "pick a folder first…"}
              aria-label="Icon id"
              disabled={!active}
              className="input min-w-44 flex-1 disabled:opacity-50"
            />
            <button type="submit" disabled={!active} className="btn-primary disabled:opacity-50">
              Save
            </button>
          </form>

          {active && active.icons.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
              {active.icons.map((id) => (
                <div
                  key={id}
                  className="group overflow-hidden rounded-xl bg-paper ring-1 ring-line"
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
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={createShare} disabled={!active?.icons.length} className="btn-ghost disabled:opacity-50">
              Create share link
            </button>
            <button onClick={exportZip} disabled={!active?.icons.length} className="btn-ghost disabled:opacity-50">
              Export ZIP package
            </button>
            {shareUrl && <code className="chip !text-tang-hi">{shareUrl}</code>}
          </div>
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
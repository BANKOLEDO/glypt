import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { snippetFor } from "@glypt/core";
import { getJson, postJson, downloadExportZip } from "../lib/api";

type Collection = {
  id: string;
  name: string;
  color: string;
  count: number;
  icons: string[];
};

export function CollectionsManager() {
  const [state, setState] = useState<"loading" | "ok" | "nodb">("loading");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [addId, setAddId] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const active = collections.find((c) => c.id === activeId) ?? null;

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
      await postJson("/api/collections", { name: newName.trim() });
      setNewName("");
      flash("Folder created");
      const d = await getJson<{ collections: Collection[] }>("/api/collections");
      setCollections(d.collections ?? []);
    } catch {
      flash("Could not create folder");
    }
  }

  async function addIcon(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !addId.includes(":")) return flash("Use format prefix:name");
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
    return <p className="font-mono text-xs text-mute">connecting to your workspace…</p>;
  }

  if (state === "nodb") {
    return (
      <div className="card flex flex-col items-start gap-4 bg-citrine-soft !ring-0 p-6 sm:flex-row sm:items-center">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-white text-xl shadow-[3px_3px_0_0_var(--color-ink)]">
          ☁️
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-ink">Cloud sync is one click away</p>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-mute">
            Create a free account to keep your folders, favorites and share
            links in sync across your whole team. Browsing and search work
            without it.
          </p>
        </div>
        <Link to="/signin?mode=register" className="btn-primary shrink-0 !px-5 !py-2.5">
          Create free account
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* folders */}
        <div className="card p-4">
          <p className="label-mono">brand folders</p>
          <ul className="mt-3 space-y-1">
            {collections.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center justify-between rounded-full px-3 py-2 text-left text-sm transition-colors ${
                    activeId === c.id ? "bg-tang-soft font-bold text-tang-hi" : "text-mute hover:bg-paper"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="font-mono text-[10px]">{c.count}</span>
                </button>
              </li>
            ))}
            {collections.length === 0 && (
              <li className="px-3 py-2 text-sm text-mute">No folders yet, create one below.</li>
            )}
          </ul>

          <form onSubmit={createFolder} className="mt-4 flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="new folder…"
              aria-label="New folder name"
              className="w-full rounded-full border-2 border-line bg-white px-3.5 py-2 font-mono text-xs text-ink placeholder:text-mute/60 focus:border-tang focus:outline-none"
            />
            <button type="submit" className="btn-primary !px-4">+</button>
          </form>
        </div>

        {/* assets */}
        <div className="space-y-4">
          <form onSubmit={addIcon} className="card flex flex-wrap gap-2 p-4">
            <input
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              placeholder="lucide:rocket"
              aria-label="Icon id"
              className="input min-w-44 flex-1"
            />
            <button type="submit" className="btn-primary">Save</button>
          </form>

          {active && active.icons.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
              {active.icons.map((id) => (
                <div key={id} className="group relative overflow-hidden rounded-xl bg-paper ring-1 ring-line" title={id}>
                  <div className="grid aspect-square place-items-center p-4">
                    <Icon icon={id} width={34} height={34} />
                  </div>
                  <p className="mt-1 truncate px-3 pb-2 font-mono text-[10px] text-mute">{id.split(":")[1]}</p>
                  <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex">
                    <button
                      onClick={() => navigator.clipboard.writeText(snippetFor(id, "react"))}
                      className="flex-1 bg-mint py-1.5 text-[10px] font-bold text-white uppercase"
                    >
                      copy
                    </button>
                    <button
                      onClick={() => removeIcon(id)}
                      className="flex-1 bg-berry py-1.5 text-[10px] font-bold text-white uppercase"
                    >
                      del
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-sm text-mute">
                {active ? "Empty folder, save icons from search or paste an id above." : "Pick or create a folder to start collecting."}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={createShare} disabled={!active} className="btn-ghost disabled:opacity-50">
              Create share link
            </button>
            <button onClick={exportZip} disabled={!active?.icons.length} className="btn-ghost disabled:opacity-50">
              Export ZIP package
            </button>
            {shareUrl && (
              <code className="chip !text-tang-hi">{shareUrl}</code>
            )}
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

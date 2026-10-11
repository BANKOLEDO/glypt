import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import Nav from "../components/nav";
import ShareGrid from "../components/share-grid";
import { getJson, downloadExportZip, collectPngs } from "../lib/api";

type ShareData = {
  kind: string;
  payload: { name?: string; ids?: string[] };
  createdAt?: string;
};

export default function Shared() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getJson<ShareData>(`/api/shares/${token}`)
      .then(setData)
      .catch(() => setFailed(true));
  }, [token]);

  const ids = useMemo(() => data?.payload.ids ?? [], [data]);
  const name = data?.payload.name ?? "shared-collection";
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "shared-collection";

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg((m) => (m === text ? null : m)), 2400);
  }

  async function exportZip() {
    if (!ids.length) return;
    setExporting(true);
    try {
      const pngs = await collectPngs(ids);
      await downloadExportZip(ids, ["svg", "react"], `${slug}-glypt-export`, pngs);
      flash(`ZIP downloaded (${Object.keys(pngs).length} PNGs)`);
    } catch {
      flash("Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Link copied");
    } catch {
      flash("Copy blocked");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        {failed ? (
          <div className="card p-10 text-center">
            <p className="h-display text-xl">This share link doesn't exist.</p>
            <p className="mt-2 text-sm text-mute">It may have been removed by its owner.</p>
            <Link to="/" className="btn-primary mt-6 inline-flex">
              Back home
            </Link>
          </div>
        ) : !data ? (
          <p className="font-mono text-xs text-mute">loading shared collection…</p>
        ) : (
          <>
            <div className="card relative overflow-hidden p-0">
              <div className="absolute inset-x-0 top-0 z-10 grid h-1.5 grid-cols-5" aria-hidden>
                <div className="bg-tang" />
                <div className="bg-citrine" />
                <div className="bg-mint" />
                <div className="bg-sky" />
                <div className="bg-berry" />
              </div>
              <div className="flex flex-col gap-4 p-5 pt-7 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pt-8">
                <div className="min-w-0">
                  <p className="label-mono">shared / view-only</p>
                  <h1 className="mt-2 truncate font-display text-2xl font-bold text-ink sm:text-3xl">
                    {name}
                  </h1>
                  <p className="mt-1.5 font-mono text-[11px] tracking-[0.14em] text-mute uppercase">
                    {ids.length} {ids.length === 1 ? "asset" : "assets"} in this set
                  </p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <button
                    onClick={copyLink}
                    disabled={!ids.length}
                    className="btn-ghost flex-1 !px-4 !py-2.5 disabled:opacity-50 sm:flex-none"
                  >
                    <Icon icon="ph:link-bold" className="size-4" aria-hidden />
                    Copy link
                  </button>
                  <button
                    onClick={exportZip}
                    disabled={!ids.length || exporting}
                    className="btn-primary flex-1 !px-4 !py-2.5 disabled:opacity-50 sm:flex-none"
                  >
                    <Icon
                      icon={exporting ? "ph:circle-notch-bold" : "ph:download-bold"}
                      className={`size-4${exporting ? " animate-spin" : ""}`}
                      aria-hidden
                    />
                    {exporting ? "Packing…" : "Export ZIP"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <ShareGrid ids={ids} />
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 font-mono text-[11px] text-mute">
              <Icon icon="ph:eye-bold" className="size-3.5" aria-hidden />
              Anyone with this link can view and download these icons.
            </p>
          </>
        )}

        {msg && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border-2 border-ink bg-ink px-4 py-2 font-mono text-xs font-bold text-citrine shadow-[3px_3px_0_0_var(--color-tang)]"
          >
            {msg}
          </div>
        )}
      </main>
    </div>
  );
}

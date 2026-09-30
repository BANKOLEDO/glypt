import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { postJson, downloadExportZip } from "../lib/api";

type BrandData = {
  domain: string;
  name: string;
  favicon: string;
  logoCandidates: string[];
  palette: string[];
  ogImage: string | null;
};

export function BrandStudio({ initialDomain = "" }: { initialDomain?: string }) {
  const [domain, setDomain] = useState(initialDomain);
  const [data, setData] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const extract = useCallback(async (d: string) => {
    if (!d.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const json = await postJson<BrandData>("/api/brand", { domain: d.trim() });
      setData(json);
    } catch (err) {
      setError((err as Error).message === "invalid domain" ? "Enter a valid domain, e.g. stripe.com" : "Extraction failed, try another domain");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialDomain) void extract(initialDomain);
  }, [initialDomain, extract]);

  async function copyHex(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // blocked
    }
  }

  async function downloadMarks() {
    if (!data || data.logoCandidates.length === 0) return;
    setExporting(true);
    setExportMsg(null);
    try {
      await downloadExportZip(data.logoCandidates, ["svg", "react"], `${data.domain.split(".")[0]}-glypt-export`);
      setExportMsg("Saved glypt-export.zip");
    } catch {
      setExportMsg("Export failed");
    } finally {
      setExporting(false);
      setTimeout(() => setExportMsg(null), 2400);
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void extract(domain);
        }}
        className="flex gap-2"
      >
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="stripe.com"
          aria-label="Domain"
          className="input"
          spellCheck={false}
        />
        <button type="submit" className="btn-primary shrink-0">
          {loading ? "Extracting…" : "Extract"}
        </button>
      </form>

      {error && <p role="alert" className="mt-4 font-mono text-xs font-medium text-berry">{error}</p>}

      {data && (
        <div className="mt-8 grid gap-4 md:grid-cols-12">
          <div className="card p-5 md:col-span-5">
            <p className="label-mono">identity</p>
            <div className="mt-4 flex items-center gap-4">
              <img
                src={data.favicon}
                alt={`${data.domain} favicon`}
                width={64}
                height={64}
                className="rounded-xl border-2 border-line bg-paper p-2"
              />
              <div>
                <p className="font-display text-lg font-bold">{data.name}</p>
                <p className="font-mono text-xs text-mute">{data.domain}</p>
              </div>
            </div>

            <p className="label-mono mt-6">palette · click to copy</p>
            {data.palette.length > 0 ? (
              <div className="mt-3 grid grid-cols-6 gap-1.5">
                {data.palette.slice(0, 12).map((hex) => (
                  <button
                    key={hex}
                    onClick={() => copyHex(hex)}
                    title={hex}
                    className="group relative aspect-square rounded-lg ring-1 ring-line transition-transform hover:z-10 hover:scale-110 hover:shadow-[0_8px_18px_-8px_rgba(34,27,21,0.4)]"
                    style={{ backgroundColor: hex }}
                  >
                    <span className="absolute inset-x-0 bottom-0 hidden rounded-b-lg bg-white/90 py-0.5 font-mono text-[8px] tracking-wide text-ink group-hover:block">
                      {copied === hex ? "✓" : hex.replace("#", "")}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-mute">No colors scraped, site may block bots.</p>
            )}
          </div>

          <div className="card p-5 md:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="label-mono">matching marks · icons aligned to this brand</p>
              <button
                onClick={() => void downloadMarks()}
                disabled={!data || data.logoCandidates.length === 0 || exporting}
                className="btn-ghost disabled:opacity-50"
              >
                <Icon icon={exporting ? "ph:dots-three-bold" : "ph:download-bold"} className="mr-1.5 inline size-4 align-[-2px]" aria-hidden />
                {exporting ? "zipping…" : "Download icons"}
              </button>
            </div>
            {exportMsg && <p role="status" className="mt-3 font-mono text-xs font-medium text-tang-hi">{exportMsg}</p>}
            {data.logoCandidates.length > 0 ? (
              <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
                {data.logoCandidates.map((id) => (
                  <div key={id} className="grid aspect-square place-items-center rounded-xl bg-paper ring-1 ring-line" title={id}>
                    <Icon icon={id} width={30} height={30} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-mute">No logo matches found.</p>
            )}
            <p className="mt-4 font-body text-sm leading-relaxed text-mute">
              Generate on-brand variants that inherit this palette automatically,
              then export everything as code your team can use.
            </p>
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="card mt-8 p-5">
          <p className="label-mono">what you get</p>
          <ul className="mt-3 grid gap-2 font-body text-sm text-mute sm:grid-cols-2">
            <li>→ Logo &amp; favicon extraction</li>
            <li>→ Color palette capture</li>
            <li>→ Matching icon suggestions</li>
            <li>→ Save into shared brand folders</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default BrandStudio;

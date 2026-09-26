import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Nav from "../components/nav";
import Reveal from "../components/reveal";
import { getJson } from "../lib/api";
import { usePageTitle } from "../lib/usePageTitle";

type Curated = { prefix: string; name: string; license: string | null };

const FEATURED = ["lucide", "ph", "heroicons", "tabler", "solar", "iconoir", "hugeicons", "ri"];

export default function Market() {
  usePageTitle("Marketplace · Glypt");
  const [collections, setCollections] = useState<Curated[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getJson<{ collections: Curated[] }>("/api/marketplace")
      .then((d) => setCollections(d.collections ?? []))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12">
        <p className="label-mono">marketplace /</p>
        <h1 className="h-display mt-3 text-3xl sm:text-4xl">
          DISCOVER &amp; SHARE<span className="text-tang">.</span>
        </h1>
        <p className="mt-3 max-w-xl font-body leading-relaxed text-mute">
          Browse curated icon collections today, publish and sell your own
          packs soon (<Link to="/docs" className="text-tang-hi underline underline-offset-4">see docs</Link>).
        </p>

        <div className="mt-8 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.prefix}
              to={`/search?q=${encodeURIComponent(c.prefix)}`}
              className={`group bg-white p-5 transition-colors hover:bg-paper ${FEATURED.includes(c.prefix) ? "border-l-4 border-l-tang" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-sm font-bold">{c.name}</p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-mute group-hover:text-tang-hi">
                  browse →
                </span>
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-mute">
                {c.prefix} {c.license ? `· ${c.license}` : ""}
              </p>
            </Link>
          ))}
          {(collections.length === 0 || failed) && (
            <p className="col-span-full bg-white p-6 font-body text-sm text-mute">
              Collection index unavailable right now.
            </p>
          )}
        </div>

        <Reveal className="mt-12">
          <div className="card bg-sky-soft p-6 !ring-0">
            <p className="font-display font-bold">Selling your own packs?</p>
            <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-mute">
              Creator accounts open soon. Submit a pack, our team reviews it, and
              you keep 70% of every sale through your connected payout account.
            </p>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

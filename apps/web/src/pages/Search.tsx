import { useSearchParams } from "react-router-dom";
import Nav from "../components/nav";
import IconExplorer from "../components/icon-explorer";
import { usePageTitle } from "../lib/usePageTitle";

export default function Search() {
  usePageTitle("Search · Glypt");
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <p className="label-mono">search /</p>
        <h1 className="h-display mt-3 text-4xl sm:text-5xl">
          FIND THE GLYPH<span className="text-tang">.</span>
        </h1>
        <div className="mt-8">
          <IconExplorer initialQuery={query} />
        </div>
        <section className="mt-14 grid gap-4 border-t-2 border-line pt-10 md:grid-cols-3">
          {[
            ["Instant results", "Debounced queries across 150+ curated collections.", "#FFE3D6"],
            ["One-click export", "SVG source, React and Vue snippets on every tile.", "#DBEEFF"],
            ["Recent memory", "Your last searches persist locally, start free, no card.", "#D6F5E7"],
          ].map(([title, body, bg]) => (
            <div key={title} className="card p-5 !ring-0" style={{ backgroundColor: bg }}>
              <p className="font-display text-sm font-bold text-ink">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

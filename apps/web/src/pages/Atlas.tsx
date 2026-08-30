import Nav from "../components/nav";
import AtlasBoard from "../components/atlas-board";
import { usePageTitle } from "../lib/usePageTitle";

const MCP_SNIPPET = `{
  "tool": "visual_select",
  "arguments": {
    "icons": ["lucide:home", "heroicons:user", "ph:star"],
    "cols": 3
  }
}
→ { session: "atlas-xyz", refs: { A1: "lucide:home", ... } }`;

export default function Atlas() {
  usePageTitle("Visual Atlas · Glypt");
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <Nav />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-10 px-5 py-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <p className="label-mono">atlas /</p>
          <h1 className="h-display mt-3 text-4xl sm:text-5xl">
            LOOK BEFORE YOU LEAP<span className="text-tang">.</span>
          </h1>
          <p className="mt-4 max-w-lg leading-relaxed text-mute">
            Text search makes agents guess. The atlas renders a labeled grid,
            an agent inspects it, picks “B2”, and one call maps the reference
            back to the real asset ID.
          </p>
          <div className="card mt-8 bg-white p-5">
            <AtlasBoard cols={4} />
          </div>
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="card p-5">
            <p className="label-mono">agent call · visual_select</p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-ink p-4 font-mono text-[11px] leading-relaxed text-mint whitespace-pre-wrap break-words">
              {MCP_SNIPPET}
            </pre>
          </div>
          <div className="card p-5">
            <p className="label-mono">how it works</p>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-mute">
              <li><span className="font-medium text-ink">search</span> narrows 200k icons to ~12 candidates.</li>
              <li><span className="font-medium text-ink">atlas</span> renders them with opaque references.</li>
              <li>The model inspects the grid and chooses e.g. <span className="rounded-md bg-citrine-soft px-1 font-mono text-xs font-bold text-ink">B3</span>.</li>
              <li><span className="font-medium text-ink">resolve</span> turns the ref back into an ID and code.</li>
            </ol>
          </div>
          <div className="card bg-citrine-soft !ring-0 p-5">
            <p className="font-display text-sm font-bold text-ink">Deterministic by design</p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Every atlas is stable and reproducible: same inputs, same grid.
              Your automations can rely on references day after day.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}

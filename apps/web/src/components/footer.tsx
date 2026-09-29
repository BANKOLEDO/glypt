import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-line bg-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex justify-center select-none"
      >
        <svg
          viewBox="0 0 332 74"
          className="block h-auto w-full max-w-7xl"
          fill="currentColor"
          role="presentation"
        >
          <text
            x="166"
            y="70"
            textAnchor="middle"
            className="text-ink/10"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "94px",
              letterSpacing: "-0.02em",
            }}
          >
            GLYPT
          </text>
        </svg>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-12 pb-[16vw] sm:pb-[13vw] lg:pb-40">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-tang font-brand text-[13px] font-bold text-white shadow-[3px_3px_0_0_var(--color-ink)]">
                G
              </span>
              <span className="font-brand text-sm font-bold">GLYPT</span>
            </div>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-mute">
              The visual asset platform for product teams. Icons, brand kits,
              mockups and demos: one workspace for humans and AI agents.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-mute/70">
              Greek glyphē · “carving”
            </p>
          </div>

          <FooterCol
            title="Product"
            items={[
              { href: "/search", label: "Icon search" },
              { href: "/atlas", label: "Visual atlas" },
              { href: "/brands", label: "Brand kits" },
              { href: "/market", label: "Marketplace" },
              { href: "/#pricing", label: "Pricing" },
            ]}
          />
          <FooterCol
            title="Developers"
            items={[
              { href: "/docs", label: "API reference" },
              { href: "/docs#mcp", label: "MCP server" },
              { href: "/docs#cli", label: "CLI" },
              { href: "https://docs.iconify.design/api/", label: "Iconify API ↗" },
            ]}
          />
          <div>
            <p className="label-mono">Attribution</p>
            <ul className="mt-4 space-y-2.5 font-body text-sm text-mute">
              <li>
                Typeface{" "}
                <a
                  className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                  href="https://www.atipofoundry.com/fonts/basier"
                  target="_blank"
                  rel="noreferrer"
                >
                  Basier Square
                </a>{" "}
                by atipo (free license)
              </li>
              <li>
                Icons via{" "}
                <a
                  className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                  href="https://iconify.design"
                  target="_blank"
                  rel="noreferrer"
                >
                  Iconify
                </a>{" "}
                (open-source collections)
              </li>
              <li>
                Imagery via{" "}
                <a
                  className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  Unsplash
                </a>{" "}
                (Unsplash License)
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 font-mono text-[11px] tracking-[0.14em] text-mute uppercase sm:flex-row sm:items-center sm:justify-between">
          <span className="flex flex-col gap-1">
            <span>© {new Date().getFullYear()} Glypt Inc.</span>
            <span>
              built by{" "}
              <a
                href="https://devolabanks.xyz"
                target="_blank"
                rel="noreferrer"
                className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                Bankole David
              </a>
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tang" />
            <span className="size-2 rounded-full bg-citrine" />
            <span className="size-2 rounded-full bg-mint" />
            <span className="size-2 rounded-full bg-sky" />
            <span className="size-2 rounded-full bg-berry" />
            colorful by design
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="label-mono">{title}</p>
      <ul className="mt-4 space-y-2.5 font-body text-sm text-mute">
        {items.map((i) =>
          i.href.startsWith("http") ? (
            <li key={i.href + i.label}>
              <a target="_blank" rel="noreferrer" href={i.href} className="transition-colors hover:text-ink">
                {i.label}
              </a>
            </li>
          ) : (
            <li key={i.href + i.label}>
              <Link to={i.href} className="transition-colors hover:text-ink">
                {i.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export default Footer;

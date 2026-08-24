import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "motion/react";
import Nav from "../components/nav";
import Footer from "../components/footer";
import Reveal from "../components/reveal";
import HeroMockup from "../components/hero-mockup";
import AtlasBoard from "../components/atlas-board";
import CliDemo from "../components/cli-demo";
import LottieMark from "../components/lottie-mark";

const COLLECTIONS = [
  "lucide", "heroicons", "phosphor", "tabler", "material-design-icons",
  "remix-icon", "iconoir", "solar", "hugeicons", "majesticons", "logos",
  "simple-icons", "fluent", "radix-icons", "bootstrap", "boxicons",
];

const CHIP_BG = ["#FFE3D6", "#FFDCF0", "#D6F5E7", "#FFF0C7", "#DBEEFF"];

const PERSONAS = [
  {
    icon: "ph:lightning-bold", name: "Product teams",
    line: "Ship consistent UI assets without waiting on design.",
    fg: "#E8480D", bg: "#FFE3D6",
  },
  {
    icon: "ph:code-bold", name: "Engineers",
    line: "Copy production-ready code straight into your codebase.",
    fg: "#0F7AC0", bg: "#DBEEFF",
  },
  {
    icon: "ph:pen-nib-bold", name: "Designers",
    line: "Brand systems that stay consistent across every tool.",
    fg: "#C81E74", bg: "#FFDCF0",
  },
  {
    icon: "ph:rocket-launch-bold", name: "Founders",
    line: "Decks, mockups and social cards without an agency.",
    fg: "#9A6A00", bg: "#FFF0C7",
  },
  {
    icon: "ph:robot-bold", name: "AI agents",
    line: "Agents see every option before choosing it.",
    fg: "#00875F", bg: "#D6F5E7",
  },
];

const PLANS = [
  {
    name: "Free", price: "$0", fg: "#00875F",
    items: ["100 searches/mo", "10 saved assets", "Community support"],
  },
  {
    name: "Pro", price: "$19", fg: "#E8480D", featured: true,
    items: ["Unlimited searches", "Unlimited saved assets", "CLI + API access", "Priority support"],
  },
  {
    name: "Team", price: "$49", fg: "#C81E74",
    items: ["5 seats included", "Shared brand libraries", "Role-based permissions", "SSO & audit logs"],
  },
];

const FLOATERS = [
  { icon: "ph:paint-brush-broad-fill", cls: "-top-5 -left-5 size-14", tilt: "-8deg", late: false },
  { icon: "ph:star-four-fill", cls: "top-1/3 -right-6 size-12", tilt: "10deg", late: true },
  { icon: "ph:cursor-click-fill", cls: "-bottom-6 left-10 size-12", tilt: "6deg", late: true },
];

export default function Home() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <Nav />

      {/* hero */}
      <section className="dot-bg relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-14 pb-12 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24 lg:pb-28">
          <Reveal>
            <div className="relative z-10">
            <p className="chip !border-ink/10">
              <span className="size-2 rounded-full bg-mint" />
              ICONS · BRANDS · MOCKUPS
            </p>
            <h1 className="h-display relative mt-6 text-5xl leading-[1.04] sm:text-6xl xl:text-7xl">
              EVERY ASSET.
              <br />
              ONE{" "}
              <span className="text-tang">GRID.</span>
              <br />
              HUMANS
              <span className="text-mute"> + </span>
              AGENTS.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-mute">
              Glypt is your team's home for icons, brand kits and mockups.
              Find the right asset in seconds, or let your AI agent see the
              options and pick for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/search" className="btn-primary">Start searching</Link>
              <Link to="/atlas" className="btn-ghost">See the atlas</Link>
            </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative">
            <HeroMockup />
          </Reveal>
        </div>

        {/* collection straps, full width, below text + mockup */}
        <div className="relative overflow-hidden py-1" aria-hidden>
          <div className="flex w-max animate-marquee gap-2.5 px-5">
            {[...COLLECTIONS, ...COLLECTIONS].map((c, i) => (
              <span
                key={`${c}-${i}`}
                className="rounded-full px-3.5 py-1.5 font-mono text-[11px] font-medium whitespace-nowrap text-ink/80"
                style={{ backgroundColor: CHIP_BG[i % CHIP_BG.length] }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="pb-10 lg:pb-14" />

        <div className="h-2.5 w-full" aria-hidden>
          <div className="grid h-full grid-cols-5">
            <div className="bg-tang" />
            <div className="bg-citrine" />
            <div className="bg-mint" />
            <div className="bg-sky" />
            <div className="bg-berry" />
          </div>
        </div>
      </section>

      {/* platform bento */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16 lg:py-20">
        <Reveal>
          <h2 className="h-display text-3xl sm:text-4xl">
            THE PLATFORM<span className="text-tang">.</span>
          </h2>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-12">
          <Reveal className="md:col-span-7" delay={0}>
            <div className="card h-full bg-white p-5">
              <CardHead label="agents pick by reference, never by guesswork" tag="AI READY" bg="#D6F5E7" fg="#00875F" tilt="-2deg" />
              <AtlasBoard cols={4} />
              <p className="mt-4 max-w-md text-sm leading-relaxed text-mute">
                The atlas renders labeled references (A1, B2…) so anyone, even an
                AI agent can <em>look before choosing</em>. One call turns the
                reference back into a real asset ID.
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delay={0.08}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-lg bg-tang p-6 text-white shadow-[0_18px_40px_-18px_rgba(255,90,31,0.55)]">
              <Icon
                icon="ph:confetti-fill"
                aria-hidden
                className="absolute -right-6 -bottom-8 size-44 opacity-15"
              />
              <CardHead label="start free, scale when ready" tag="FREE TIER" bg="#221B15" fg="#FFFFFF" tilt="2deg" dark />
              <dl className="mt-2 grid flex-1 grid-cols-2 content-evenly gap-x-4 sm:flex sm:flex-col sm:justify-evenly">
                {[
                  ["200k+", "production-ready icons"],
                  ["150+", "curated collections"],
                  ["<100ms", "median search time"],
                  ["3 sec", "domain to full brand kit"],
                ].map(([k, v]) => (
                  <div key={k} className="border-b border-white/25 pb-3 sm:pb-4">
                    <dt className="font-display text-2xl font-bold sm:text-4xl">{k}</dt>
                    <dd className="mt-1 font-mono text-[10px] tracking-[0.14em] text-white/80 uppercase sm:text-[11px]">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="relative mt-5 border-t border-white/25 pt-4">
                <div className="flex h-14 items-end gap-1.5" aria-hidden>
                  {[35, 55, 42, 70, 58, 88, 100].map((h, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-t-md transition-all duration-300 ${
                        i === 6 ? "bg-citrine animate-pulse" : "bg-white/40"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase">
                  teams shipping faster every week ↗
                </p>
              </div>

              <Link
                to="/search"
                className="btn relative mt-5 w-full bg-white text-ink transition-transform hover:-translate-y-0.5 hover:bg-citrine"
              >
                Start free, no card
              </Link>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delay={0}>
            <div className="card flex h-full flex-col bg-ink p-0 ring-0">
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3">
                <span className="size-3 rounded-full bg-berry" />
                <span className="size-3 rounded-full bg-citrine" />
                <span className="size-3 rounded-full bg-mint" />
                <span className="mx-auto rounded-full bg-white/10 px-3 py-0.5 font-mono text-[10px] tracking-widest text-white/60 uppercase">
                  glypt cli
                </span>
                <span className="size-3" aria-hidden />
              </div>
              <div className="min-h-[210px] flex-1 bg-[#2A231C]"><CliDemo /></div>
              <div className="flex items-center justify-between border-t border-white/10 px-5 py-2.5 font-mono text-[10px] text-white/40">
                <span>works everywhere node runs</span>
                <code className="rounded-md bg-white/10 px-2 py-0.5 text-citrine">npm i -g glypt</code>
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-4" delay={0.08}>
            <div className="card flex h-full flex-col bg-berry-soft p-5 ring-0">
              <CardHead label="any domain becomes a brand kit" tag="BRANDS" bg="#FFFFFF" fg="#C81E74" tilt="-2deg" />
              <div className="mt-3 space-y-2.5">
                {["vercel.com", "linear.app", "stripe.com"].map((d) => (
                  <Link
                    key={d}
                    to={`/brands?domain=${d}`}
                    className="group flex items-center justify-between rounded-full bg-white px-4 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-10px_rgba(200,30,116,0.45)]"
                  >
                    <span className="font-mono text-xs font-medium text-ink">{d}</span>
                    <Icon
                      icon="ph:arrow-right-bold"
                      className="size-3.5 text-berry transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </div>
              <p className="mt-auto pt-4 text-sm text-ink/60">
                Logo, palette and favicon from any domain, matched icons included.
              </p>
            </div>
          </Reveal>

          <Reveal className="md:col-span-3" delay={0.16}>
            <div className="card relative flex h-full flex-row items-center gap-4 bg-citrine-soft p-5 text-left ring-0 sm:flex-col sm:items-center sm:justify-center sm:text-center">
              <div
                aria-hidden
                className="animate-spin-slow pointer-events-none absolute top-1/2 left-1/2 hidden size-44 -translate-x-1/2 -translate-y-[62%] rounded-full border-2 border-dashed border-tang/40 sm:block"
              />
              <div className="relative size-24 shrink-0 sm:size-32">
                <LottieMark className="h-full w-full" />
                <Icon
                  icon="ph:paint-brush-broad-fill"
                  aria-hidden
                  className="absolute -top-1 -left-1 size-5 rotate-[-8deg] text-tang"
                />
              </div>
              <div className="relative flex-1 sm:flex-none">
                <p className="sticker inline-block rotate-2 bg-white text-ink">60 fps</p>
                <p className="label-mono mt-2">motion engine</p>
                <p className="mt-1 font-mono text-[11px] text-ink/50">animated brand marks</p>
              </div>
              <Icon
                icon="ph:cursor-click-fill"
                aria-hidden
                className="animate-float absolute right-4 bottom-4 hidden size-5 text-berry sm:block"
                style={{ "--tilt": "10deg" } as React.CSSProperties}
              />
            </div>
          </Reveal>

          <Reveal className="md:col-span-4" delay={0}>
            <figure className="card group relative h-full min-h-56 p-0">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
                alt="Abstract colorful 3D render"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <figcaption className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-white/90 px-4 py-1.5 font-mono text-[10px] tracking-widest text-ink/70 uppercase backdrop-blur">
                <span>device mockups, one click</span>
                <a
                  href="https://unsplash.com/photos/a83a8bd57fbe"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-tang"
                >
                  unsplash ↗
                </a>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal className="md:col-span-8" delay={0.08}>
            <div className="card h-full bg-mint-soft p-5 ring-0">
              <CardHead label="fits the tools you already use" tag="INTEGRATIONS" bg="#FFFFFF" fg="#00875F" tilt="2deg" />
              <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  ["REST API", "stable endpoints + API keys", "#E8480D", "/docs#api", "ph:plugs-connected-bold"],
                  ["CLI", "scriptable search, export, resolve", "#0F7AC0", "/docs#cli", "ph:terminal-window-bold"],
                  ["MCP server", "native AI-agent access", "#00875F", "/docs#mcp", "ph:robot-bold"],
                  ["Editor plugins", "VS Code & Figma, right at hand", "#C81E74", "/docs#integrations", "ph:puzzle-piece-bold"],
                ].map(([tool, sig, c, href, ic]) => (
                  <li key={tool}>
                    <Link
                      to={href}
                      className="group flex h-full flex-col rounded-md bg-white p-3.5 ring-1 ring-transparent transition-shadow hover:shadow-[0_10px_22px_-12px_rgba(34,27,21,0.4)] sm:p-4"
                    >
                      <span className="flex items-center justify-between">
                        <Icon icon={ic} className="size-5" style={{ color: c }} />
                        <Icon
                          icon="ph:arrow-right-bold"
                          className="size-3 text-mute/50 transition-all group-hover:translate-x-0.5 group-hover:text-tang"
                        />
                      </span>
                      <p className="mt-2 font-mono text-xs font-bold sm:text-sm" style={{ color: c }}>{tool}</p>
                      <p className="mt-1 hidden font-mono text-[11px] text-mute sm:block">{sig}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* personas */}
      <section className="border-y-2 border-line bg-white/60">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <Reveal>
            <h2 className="h-display text-3xl sm:text-4xl">
              ONE WORKSPACE, EVERY TEAM
            </h2>
          </Reveal>

          {/* mobile: simple scannable list, no interaction needed */}
          <div className="mt-6 space-y-3 lg:hidden">
            {PERSONAS.map((p) => (
              <div key={p.name} className="flex gap-3.5 rounded-lg p-4" style={{ backgroundColor: p.bg }}>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon icon={p.icon} className="size-5" style={{ color: p.fg }} />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-ink">{p.name}</p>
                  <p className="mt-0.5 text-sm leading-snug text-ink/65">{p.line}</p>
                </div>
              </div>
            ))}
          </div>

          {/* desktop: full grid */}
          <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-5">
            {PERSONAS.map((p) => (
              <Reveal key={p.name} delay={0}>
                <div
                  className="h-full rounded-lg p-5"
                  style={{ backgroundColor: p.bg }}
                >
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Icon icon={p.icon} className="size-6" style={{ color: p.fg }} />
                  </div>
                  <p className="font-display mt-3 text-base font-bold text-ink">{p.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{p.line}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-12 sm:py-16">
        <Reveal>
          <h2 className="h-display text-3xl sm:text-4xl">
            SIMPLE PRICING THAT SCALES WITH YOU
          </h2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.07}>
              <div
                className={`card relative flex h-full flex-col p-6 ${plan.featured ? "!overflow-visible border-tang ring-tang" : ""}`}
              >
                {plan.featured && (
                  <span className="sticker absolute -top-3.5 right-5 z-10 rotate-3 bg-citrine text-ink">
                    most popular ✦
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <p className="label-mono">{plan.name}</p>
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: plan.fg }}
                  />
                </div>
                <p className="mt-4 font-display text-4xl font-bold">
                  {plan.price}
                  <span className="font-mono text-xs font-normal text-mute"> /mo</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-mute">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Icon
                        icon="ph:check-fat-fill"
                        className="size-4 shrink-0"
                        style={{ color: plan.fg }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signin?mode=register"
                  className={`${plan.featured ? "btn-primary" : "btn-ghost"} mt-6 w-full`}
                >
                  Choose {plan.name.toLowerCase()}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* cta */}
      <section className="mx-auto max-w-7xl px-5 pb-14 sm:pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl bg-tang p-8 text-white sm:p-12">
            <span aria-hidden className="absolute -top-10 -left-6 text-[10rem] leading-none font-black text-white/10 select-none">✦</span>
            <span aria-hidden className="absolute -right-8 -bottom-14 size-48 rounded-full border-[14px] border-white/15" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="h-display text-2xl !text-white sm:text-3xl">
                  STOP LOSING HOURS TO ASSET BUSYWORK.
                </p>
                <p className="mt-2 text-base text-white/85">
                  One workspace for every asset your team ships.
                </p>
              </div>
              <Link
                to="/signin?mode=register"
                className="btn shrink-0 bg-white text-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:bg-citrine"
              >
                Get started free
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}

function CardHead({
  label,
  tag,
  bg,
  fg,
  tilt,
  dark,
}: {
  label: string;
  tag: string;
  bg: string;
  fg: string;
  tilt: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span
        className={`sticker ${dark ? "bg-ink text-citrine" : ""}`}
        style={dark ? undefined : { backgroundColor: bg, color: fg, "--tilt": tilt } as React.CSSProperties}
      >
        {tag}
      </span>
      <p className="label-mono">{label}</p>
    </div>
  );
}
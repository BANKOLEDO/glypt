import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Nav from "../components/nav";
import LottieMark from "../components/lottie-mark";
import { useAuth } from "../lib/auth";
import { usePageTitle } from "../lib/usePageTitle";

const PERKS = [
  ["200k+", "production-ready icons"],
  ["150+", "curated collections"],
  ["3 sec", "domain to full brand kit"],
];

export default function SignIn() {
  usePageTitle("Sign in · Glypt");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err =
      mode === "login" ? await login(email, password) : await register(email, password, name || undefined);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    navigate(params.get("next") ?? "/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_1fr]">
        {/* brand panel */}
        <section className="relative hidden overflow-hidden rounded-2xl bg-tang p-10 text-white shadow-[0_24px_50px_-24px_rgba(255,90,31,0.6)] lg:block">
          <span
            aria-hidden
            className="absolute -top-8 -right-8 size-40 rotate-12 rounded-3xl border-4 border-white/25"
          />
          <span
            aria-hidden
            className="absolute right-16 bottom-20 size-24 rounded-full border-4 border-citrine/60"
          />
          <span
            aria-hidden
            className="absolute bottom-6 left-8 size-14 -rotate-6 rounded-xl border-2 border-ink bg-citrine shadow-[4px_4px_0_0_rgba(34,27,21,0.9)]"
          />
          <p className="label-mono !text-white/70">glypt workspace</p>
          <h2 className="h-display mt-4 text-4xl leading-tight xl:text-5xl">
            YOUR WHOLE ASSET
            STACK<span className="text-citrine">.</span>
          </h2>
          <p className="mt-4 max-w-sm leading-relaxed text-white/85">
            One login unlocks folders, favorites, share links and brand kits,
            synced for you and your team.
          </p>

          <dl className="mt-10 space-y-5">
            {PERKS.map(([k, v], i) => (
              <div key={k} className="flex items-baseline gap-4 border-b border-white/20 pb-4">
                <dt className="font-display w-24 shrink-0 text-3xl font-bold">{k}</dt>
                <dd className="font-mono text-[11px] tracking-[0.14em] text-white/80 uppercase">{v}</dd>
                <span className="ml-auto font-mono text-xs text-citrine">0{i + 1}</span>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex items-center gap-3">
            <div className="size-14">
              <LottieMark />
            </div>
            <span className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-mono text-[11px] font-bold text-ink shadow-[2px_2px_0_0_var(--color-ink)]">
              free tier · no card
            </span>
          </div>
        </section>

        {/* form panel */}
        <section className="w-full max-w-md justify-self-center lg:justify-self-end">
          {user ? (
            <div className="card p-8 text-center">
              <p className="font-display text-2xl">ALREADY IN.</p>
              <p className="mt-3 text-sm text-mute">
                You're signed in as <span className="font-medium text-ink">{user.email}</span>.
              </p>
              <Link to="/dashboard" className="btn-primary mt-6 inline-block w-full">
                Go to dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="h-display text-3xl sm:text-4xl">
                  {mode === "login" ? "WELCOME BACK" : "JOIN GLYPT"}
                  <span className="text-tang">.</span>
                </h1>
                <p className="mt-2 text-sm text-mute">
                  {mode === "login"
                    ? "Pick up where your team left off."
                    : "Thirty seconds to a synced workspace."}
                </p>
              </div>

              {/* segmented tabs */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="mb-5 grid grid-cols-2 gap-1.5 rounded-full border-2 border-ink bg-white p-1.5 shadow-[3px_3px_0_0_var(--color-line)]"
              >
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      setMode(m);
                      setError(null);
                    }}
                    className={`rounded-full px-4 py-2 font-mono text-xs font-bold tracking-wide uppercase transition-all ${
                      mode === m ? "bg-ink text-citrine shadow-[2px_2px_0_0_rgba(34,27,21,0.35)]" : "text-mute hover:text-ink"
                    }`}
                  >
                    {m === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="card space-y-4 p-6">
                {mode === "register" && (
                  <label className="block">
                    <span className="label-mono mb-1.5 block">name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Lovelace"
                      autoComplete="name"
                      className="input"
                    />
                  </label>
                )}
                <label className="block">
                  <span className="label-mono mb-1.5 block">work email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                  />
                </label>
                <label className="block">
                  <span className="label-mono mb-1.5 block">password</span>
                  <span className="relative block">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "register" ? "10+ chars · letter + number" : "your password"}
                      type={showPw ? "text" : "password"}
                      required
                      minLength={mode === "register" ? 10 : 1}
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      className="input pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute inset-y-0 right-2 my-auto h-fit rounded-full border border-line px-2.5 py-0.5 font-mono text-[10px] font-bold text-mute uppercase hover:border-ink hover:text-ink"
                    >
                      {showPw ? "hide" : "show"}
                    </button>
                  </span>
                </label>

                {error && (
                  <p role="alert" className="flex items-center gap-2 rounded-lg bg-berry/10 px-3 py-2 font-mono text-xs font-medium text-berry">
                    <span aria-hidden>✗</span> {error}
                  </p>
                )}

                <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                  {busy ? "One sec…" : mode === "login" ? "Sign in →" : "Create account →"}
                </button>

                <p className="text-center font-mono text-[11px] text-mute">
                Free tier included · no card required
              </p>
            </form>
          </>
          )}
        </section>
      </main>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import Nav from "../components/nav";
import { useAuth } from "../lib/auth";
import { getJson, postJson, deleteJson } from "../lib/api";
import { startCheckout, type PaidPlan } from "../lib/billing";
import { usePageTitle } from "../lib/usePageTitle";
import ConfirmDialog from "../components/confirm-dialog";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  last4: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const TABS = [
  { id: "profile", label: "Profile", icon: "ph:user-circle-bold" },
  { id: "plan", label: "Plan", icon: "ph:sparkle-bold" },
  { id: "password", label: "Password", icon: "ph:lock-key-bold" },
  { id: "keys", label: "API keys", icon: "ph:key-bold" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function fmtDate(value: string | null): string {
  if (!value) return "never";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "never" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Account() {
  usePageTitle("Account · Glypt");
  const { user, loading, updateProfile, changePassword, refresh } = useAuth();
  const [params, setParams] = useSearchParams();
  const billing = params.get("billing");
  const [tab, setTab] = useState<TabId>(billing ? "plan" : "profile");
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/signin?next=/account", { replace: true });
  }, [loading, user, navigate]);

  function dismissBilling() {
    params.delete("billing");
    setParams(params, { replace: true });
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        {user && (
          <div className="relative">
            <span className="ml-5 inline-flex items-center gap-2 rounded-t-xl border-2 border-b-0 border-ink bg-tang px-4 py-1.5 font-mono text-[11px] font-bold tracking-wide text-white uppercase">
              <Icon icon="ph:identification-card-bold" className="size-4" aria-hidden />
              account
            </span>
            <div className="relative -mt-0.5 flex flex-wrap items-center gap-4 rounded-2xl rounded-tl-none border-2 border-ink bg-white p-5 shadow-[6px_6px_0_0_var(--color-ink)]">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-tang font-display text-3xl font-bold text-white shadow-[4px_4px_0_0_var(--color-ink)]">
                {(user.name?.trim()?.[0] ?? user.email[0] ?? "?").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-2xl font-bold text-ink">
                  {user.name?.trim() || "Unnamed maker"}
                </p>
                <p className="truncate font-mono text-xs text-mute">{user.email}</p>
              </div>
              <span className="sticker ml-auto bg-citrine text-ink">{user.plan} plan</span>
              <Link to="/dashboard" className="btn-ghost !py-2 text-sm">
                <Icon icon="ph:squares-four-bold" className="size-4" aria-hidden />
                Dashboard
              </Link>
            </div>
          </div>
        )}

        {billing && (
          <div className="mt-4 flex items-start gap-2">
            <div className="flex-1">
              {billing === "success" ? (
                <Note tone="good">Payment received — your plan updates in a moment. Refresh if it still shows the old one.</Note>
              ) : (
                <Note tone="info">Checkout cancelled. No charge was made.</Note>
              )}
            </div>
            <button
              onClick={dismissBilling}
              aria-label="Dismiss"
              className="grid size-7 shrink-0 place-items-center rounded-md text-mute hover:text-ink"
            >
              <Icon icon="ph:x-bold" className="size-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div
          role="tablist"
          aria-label="Account sections"
          className="mt-6 grid grid-cols-2 gap-1.5 rounded-full border-2 border-ink bg-white p-1.5 shadow-[3px_3px_0_0_var(--color-line)] sm:grid-cols-4"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                "inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 font-mono text-[11px] font-bold tracking-wide uppercase transition-all",
                tab === t.id ? "bg-ink text-citrine shadow-[2px_2px_0_0_rgba(34,27,21,0.35)]" : "text-mute hover:text-ink",
              )}
            >
              <Icon icon={t.icon} className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          {user && tab === "profile" && <ProfilePanel user={user} onSave={updateProfile} flash={flash} />}
          {user && tab === "plan" && <PlanPanel plan={user.plan} flash={flash} onRefresh={refresh} />}
          {user && tab === "password" && <PasswordPanel onChange={changePassword} flash={flash} />}
          {user && tab === "keys" && <KeysPanel flash={flash} />}
        </div>
      </main>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[100] max-w-[92vw] -translate-x-1/2 rounded-full bg-mint px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_-10px_rgba(0,195,137,0.6)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block font-mono text-[10px] text-mute">{hint}</span>}
    </label>
  );
}

function Note({ tone = "info", children }: { tone?: "info" | "good" | "bad"; children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className={clsx(
        "flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs font-medium",
        tone === "bad" && "bg-berry/10 text-berry",
        tone === "good" && "bg-mint/10 text-mint",
        tone === "info" && "bg-sky/10 text-sky",
      )}
    >
      {children}
    </p>
  );
}

const PANEL = "relative overflow-hidden rounded-2xl border-2 border-ink p-6 shadow-[6px_6px_0_0_var(--color-ink)]";

function PanelHead({ icon, title, accent = "bg-tang" }: { icon: string; title: string; accent?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className={clsx("grid size-7 place-items-center rounded-lg text-white", accent)}>
        <Icon icon={icon} className="size-4" aria-hidden />
      </span>
      <h2 className="font-mono text-[11px] font-bold tracking-[0.14em] text-ink uppercase">{title}</h2>
    </div>
  );
}

function PlanPanel({
  plan,
  flash,
  onRefresh,
}: {
  plan: string;
  flash: (m: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [busy, setBusy] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmFree, setConfirmFree] = useState(false);
  const [switching, setSwitching] = useState(false);

  async function upgrade(id: PaidPlan) {
    setError(null);
    setBusy(id);
    try {
      window.location.href = await startCheckout(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not start checkout");
      setBusy(null);
    }
  }

  async function goFree() {
    setSwitching(true);
    setError(null);
    try {
      await postJson("/api/billing/cancel", {});
      await onRefresh();
      setConfirmFree(false);
      flash("You are back on the Free plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not change plan");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className={clsx(PANEL, "bg-white")}>
      <PanelHead icon="ph:sparkle-bold" title="plan" accent="bg-citrine" />
      <div className="flex flex-wrap items-center gap-3">
        <span className="sticker bg-citrine text-ink">{plan} plan</span>
        <p className="text-sm text-mute">
          {plan === "free"
            ? "Free covers the essentials. Upgrade for unlimited searches, the API and team tools."
            : "Thanks for supporting Glypt. You can change your plan anytime."}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {plan !== "pro" && (
            <button
              type="button"
              disabled={busy === "pro"}
              onClick={() => void upgrade("pro")}
              className="btn-ghost !py-2 text-sm disabled:opacity-60"
            >
              {busy === "pro" ? "Starting…" : "Upgrade to Pro · $19"}
            </button>
          )}
          {plan !== "team" && (
            <button
              type="button"
              disabled={busy === "team"}
              onClick={() => void upgrade("team")}
              className="btn-primary !py-2 text-sm disabled:opacity-60"
            >
              {busy === "team" ? "Starting…" : "Go Team · $49"}
            </button>
          )}
          {plan !== "free" && (
            <button
              type="button"
              onClick={() => setConfirmFree(true)}
              className="!py-2 text-sm font-bold text-mute underline decoration-line underline-offset-4 hover:text-ink"
            >
              Switch to Free
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-3">
          <Note tone="bad">{error}</Note>
        </div>
      )}

      <ConfirmDialog
        open={confirmFree}
        tone="danger"
        title="Switch to the Free plan?"
        message="You'll lose the paid features right away. You can upgrade again anytime."
        confirmLabel="Switch to Free"
        cancelLabel="Stay put"
        busy={switching}
        onConfirm={goFree}
        onCancel={() => setConfirmFree(false)}
      />
    </div>
  );
}

function ProfilePanel({
  user,
  onSave,
  flash,
}: {
  user: { email: string; name: string | null };
  onSave: (name: string) => Promise<string | null>;
  flash: (m: string) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onSave(name.trim());
    setBusy(false);
    if (err) setError(err);
    else flash("Name updated");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_248px]">
      <form onSubmit={submit} className={clsx(PANEL, "bg-white")}>
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 size-36 rotate-12 rounded-[2rem] border-4 border-tang-soft"
        />
        <PanelHead icon="ph:pencil-simple-bold" title="display name" />
        <label className="block">
          <span className="sr-only">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full border-0 bg-transparent p-0 font-display text-3xl font-bold text-ink placeholder:text-mute/40 focus:outline-none"
          />
        </label>
        <span aria-hidden className="mt-3 block h-1 w-40 rounded-full bg-gradient-to-r from-tang to-citrine" />
        <p className="mt-3 font-mono text-[10px] text-mute">Shown on your dashboard and share links.</p>
        {error && (
          <div className="mt-4">
            <Note tone="bad">{error}</Note>
          </div>
        )}
        <div className="mt-5">
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            {busy ? "Saving…" : "Save name"}
          </button>
        </div>
      </form>

      <aside className={clsx(PANEL, "bg-paper")}>
        <PanelHead icon="ph:envelope-simple-bold" title="sign-in email" accent="bg-sky" />
        <p className="break-all font-mono text-sm font-medium text-ink">{user.email}</p>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-line bg-white px-3 py-2">
          <Icon icon="ph:lock-simple-bold" className="size-4 text-mute" aria-hidden />
          <span className="font-mono text-[10px] text-mute">locked for now</span>
        </div>
      </aside>
    </div>
  );
}

function PasswordPanel({
  onChange,
  flash,
}: {
  onChange: (current: string, next: string) => Promise<string | null>;
  flash: (m: string) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("the new passwords do not match");
      return;
    }
    if (next.length < 10 || !/[a-z]/i.test(next) || !/[0-9]/.test(next)) {
      setError("use 10+ characters with a letter and a number");
      return;
    }
    setBusy(true);
    const err = await onChange(current, next);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    flash("Password changed");
  }

  return (
    <form onSubmit={submit} className={clsx(PANEL, "max-w-xl space-y-4 bg-white")}>
      <PanelHead icon="ph:lock-key-bold" title="change password" />
      <Field label="current password">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className="input" />
      </Field>
      <Field label="new password" hint="10+ characters with a letter and a number.">
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required className="input" />
      </Field>
      <Field label="confirm new password">
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className="input" />
      </Field>
      {error && <Note tone="bad">{error}</Note>}
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}

function KeysPanel({ flash }: { flash: (m: string) => void }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getJson<{ keys: ApiKey[] }>("/api/keys");
      setKeys(data.keys);
    } catch {
      setKeys([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const data = await postJson<{ key: ApiKey; secret: string }>("/api/keys", { name: name.trim() });
      setKeys((k) => [data.key, ...k]);
      setSecret(data.secret);
      setName("");
      flash("API key created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not create key");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    try {
      await deleteJson(`/api/keys/${id}`);
      setKeys((k) => k.filter((key) => key.id !== id));
      flash("API key revoked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not revoke key");
    }
  }

  async function confirmRevoke() {
    if (!pendingRevoke) return;
    setRevoking(true);
    try {
      await revoke(pendingRevoke.id);
    } finally {
      setRevoking(false);
      setPendingRevoke(null);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      flash("Key copied");
    } catch {
      setError("clipboard blocked by browser");
    }
  }

  return (
    <div className="space-y-4">
      {secret && (
        <div className="rounded-xl border-2 border-ink bg-citrine/20 p-4 shadow-[3px_3px_0_0_var(--color-ink)]">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-wide text-ink uppercase">
            <Icon icon="ph:warning-diamond-bold" className="size-4 text-tang" aria-hidden />
            copy this now — it will not be shown again
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-ink">
              {secret}
            </code>
            <button onClick={() => void copySecret()} className="btn-primary shrink-0 !px-4 !py-2 text-xs">
              <Icon icon="ph:copy-bold" className="size-4" aria-hidden />
              Copy
            </button>
          </div>
          <button onClick={() => setSecret(null)} className="mt-2 font-mono text-[10px] text-mute underline hover:text-ink">
            done, hide it
          </button>
        </div>
      )}

      <form onSubmit={create} className={clsx(PANEL, "bg-white")}>
        <PanelHead icon="ph:key-bold" title="create an API key" />
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Field label="key name">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="CI pipeline" className="input" />
            </Field>
          </div>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
            <Icon icon="ph:plus-bold" className="size-4" aria-hidden />
            {busy ? "Creating…" : "Create key"}
          </button>
        </div>
      </form>

      {error && <Note tone="bad">{error}</Note>}

      <div className="overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[6px_6px_0_0_var(--color-ink)]">
        <div className="px-6 pt-5">
          <PanelHead icon="ph:list-magnifying-glass-bold" title="your keys" />
        </div>
        {loaded && keys.length === 0 ? (
          <p className="px-6 pb-6 text-center font-mono text-xs text-mute">
            No keys yet. Create one to use the Glypt API from your own tools.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 px-6 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tang-soft text-tang-hi">
                  <Icon icon="ph:key-bold" className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{key.name}</p>
                  <p className="font-mono text-[10px] text-mute">
                    {key.prefix}…{key.last4} · created {fmtDate(key.createdAt)} · last used {fmtDate(key.lastUsedAt)}
                  </p>
                </div>
                <button
                  onClick={() => setPendingRevoke(key)}
                  className="shrink-0 rounded-full border-2 border-line px-3 py-1 font-mono text-[10px] font-bold tracking-wide text-mute uppercase transition-colors hover:border-berry hover:text-berry"
                >
                  revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="font-mono text-[10px] text-mute">
        Use keys as <code>Authorization: Bearer &lt;key&gt;</code> against the Glypt API.
      </p>

      <ConfirmDialog
        open={pendingRevoke !== null}
        tone="danger"
        title="Revoke this API key?"
        message={
          <>
            Any tool using <span className="font-mono text-ink">{pendingRevoke?.name}</span> will stop working
            immediately. This cannot be undone.
          </>
        }
        confirmLabel="Revoke key"
        cancelLabel="Keep it"
        busy={revoking}
        onConfirm={confirmRevoke}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  );
}

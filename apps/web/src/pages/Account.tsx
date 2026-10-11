import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import Nav from "../components/nav";
import { useAuth } from "../lib/auth";
import { getJson, postJson, deleteJson } from "../lib/api";
import { usePageTitle } from "../lib/usePageTitle";

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
  const { user, loading, updateProfile, changePassword } = useAuth();
  const [tab, setTab] = useState<TabId>("profile");
  const [toast, setToast] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/signin?next=/account", { replace: true });
  }, [loading, user, navigate]);

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono">your workspace</p>
            <h1 className="h-display mt-2 text-3xl sm:text-4xl">
              ACCOUNT<span className="text-tang">.</span>
            </h1>
          </div>
          <Link to="/dashboard" className="btn-ghost !py-2 text-sm">
            <Icon icon="ph:squares-four-bold" className="size-4" aria-hidden />
            Dashboard
          </Link>
        </header>

        <div
          role="tablist"
          aria-label="Account sections"
          className="mt-6 grid grid-cols-3 gap-1.5 rounded-full border-2 border-ink bg-white p-1.5 shadow-[3px_3px_0_0_var(--color-line)]"
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
    else flash("Profile updated");
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <Field label="display name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada Lovelace"
          autoComplete="name"
          className="input"
        />
      </Field>
      <Field label="email" hint="Email changes are not supported yet.">
        <input value={user.email} readOnly disabled className="input cursor-not-allowed bg-paper text-mute" />
      </Field>
      {error && <Note tone="bad">{error}</Note>}
      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
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
    <form onSubmit={submit} className="card space-y-4 p-6">
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

      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <div className="min-w-48 flex-1">
          <Field label="new key name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="CI pipeline" className="input" />
          </Field>
        </div>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          <Icon icon="ph:plus-bold" className="size-4" aria-hidden />
          {busy ? "Creating…" : "Create key"}
        </button>
      </form>

      {error && <Note tone="bad">{error}</Note>}

      <div className="card overflow-hidden">
        {loaded && keys.length === 0 ? (
          <p className="p-6 text-center font-mono text-xs text-mute">
            No keys yet. Create one to use the Glypt API from your own tools.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {keys.map((key) => (
              <li key={key.id} className="flex items-center gap-3 p-4">
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
                  onClick={() => void revoke(key.id)}
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
    </div>
  );
}

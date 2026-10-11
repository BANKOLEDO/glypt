import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import Nav from "../components/nav";
import { useAuth } from "../lib/auth";
import { usePageTitle } from "../lib/usePageTitle";

export default function Reset() {
  usePageTitle("Reset password · Glypt");
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const { requestReset, resetPassword } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <header className="mb-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-tang text-white shadow-[4px_4px_0_0_var(--color-ink)]">
            <Icon icon={token ? "ph:lock-simple-bold" : "ph:paper-plane-tilt-bold"} className="size-6" aria-hidden />
          </span>
          <h1 className="h-display mt-5 text-3xl sm:text-4xl">
            {token ? "NEW PASSWORD" : "RESET LINK"}
            <span className="text-tang">.</span>
          </h1>
          <p className="mt-2 text-sm text-mute">
            {token
              ? "Choose a fresh password for your account."
              : "Enter your email and we will send a link to set a new password."}
          </p>
        </header>

        {token ? <ResetForm token={token} onSubmit={resetPassword} onDone={() => navigate("/signin")} /> : <RequestForm onSubmit={requestReset} />}
      </main>
    </div>
  );
}

function RequestForm({ onSubmit }: { onSubmit: (email: string) => Promise<string | null> }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await onSubmit(email);
    setBusy(false);
    if (err) setError(err);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-xl font-bold text-ink">CHECK YOUR INBOX.</p>
        <p className="mt-2 text-sm text-mute">
          If an account exists for <span className="font-medium text-ink">{email}</span>, a reset link is on its way.
        </p>
        <Link to="/signin" className="btn-ghost mt-5 inline-flex w-full justify-center">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <label className="block">
        <span className="label-mono mb-1.5 block">email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          className="input"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-berry/10 px-3 py-2 font-mono text-xs font-medium text-berry">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? "Sending…" : "Send reset link →"}
      </button>
      <p className="text-center font-mono text-[11px] text-mute">
        Remembered it?{" "}
        <Link to="/signin" className="text-tang underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

function ResetForm({
  token,
  onSubmit,
  onDone,
}: {
  token: string;
  onSubmit: (token: string, password: string) => Promise<string | null>;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("the passwords do not match");
      return;
    }
    setBusy(true);
    const err = await onSubmit(token, password);
    setBusy(false);
    if (err) setError(err);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-xl font-bold text-ink">ALL SET.</p>
        <p className="mt-2 text-sm text-mute">Your password has been updated. Sign in with the new one.</p>
        <button onClick={onDone} className="btn-primary mt-5 w-full">
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <label className="block">
        <span className="label-mono mb-1.5 block">new password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="10+ chars · letter + number"
          autoComplete="new-password"
          required
          minLength={10}
          className="input"
        />
      </label>
      <label className="block">
        <span className="label-mono mb-1.5 block">confirm password</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className="input"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-berry/10 px-3 py-2 font-mono text-xs font-medium text-berry">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
        {busy ? "Updating…" : "Set new password →"}
      </button>
    </form>
  );
}

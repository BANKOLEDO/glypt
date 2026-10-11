import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type User = { id: string; email: string; plan: string; name: string | null };

type AuthState = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name?: string) => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;
  requestReset: (email: string) => Promise<string | null>;
  resetPassword: (token: string, password: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && res.status >= 500) {
    // keep raw server/database text away from people
    return { ok: false, data: { error: "Something went wrong on our end. Please try again." } } as {
      ok: boolean;
      data: { user?: User; error?: string };
    };
  }
  return { ok: res.ok, data } as { ok: boolean; data: { user?: User; error?: string } };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { ok, data } = await post("/api/auth/login", { email, password });
    if (ok && data.user) setUser(data.user);
    return ok ? null : (data.error ?? "sign in failed");
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { ok, data } = await post("/api/auth/register", { email, password, name });
    if (ok && data.user) setUser(data.user);
    return ok ? null : (data.error ?? "could not create account");
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) {
      setUser(data.user);
      return null;
    }
    return (data as { error?: string }).error ?? "could not save";
  }, []);

  const changePassword = useCallback(async (current: string, next: string) => {
    const { ok, data } = await post("/api/auth/password", { currentPassword: current, newPassword: next });
    return ok ? null : (data.error ?? "could not change password");
  }, []);

  const requestReset = useCallback(async (email: string) => {
    const { ok, data } = await post("/api/auth/reset-request", { email });
    return ok ? null : (data.error ?? "could not send reset");
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    const { ok, data } = await post("/api/auth/reset", { token, password });
    return ok ? null : (data.error ?? "could not reset password");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        requestReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

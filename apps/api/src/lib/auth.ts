import type { Request } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "./db";
import { newSessionToken, hashToken, isValidSessionToken, newDeviceId, isDeviceId } from "@glypt/core/identity";

export const SESSION_COOKIE = "glypt_session";
export const DEVICE_COOKIE = "glypt_did";
const SESSION_TTL_DAYS = 30;

const isProd = process.env.NODE_ENV === "production";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function deviceCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  };
}

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(10)
    .max(200)
    .regex(/[a-zA-Z]/, "needs a letter")
    .regex(/[0-9]/, "needs a digit"),
  name: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", 12);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(email: string, password: string, name?: string) {
  const db = getDb();
  const hash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await db.query<{ id: string; email: string; plan: string; name: string | null }>(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, plan, name",
      [normalizeEmail(email), hash, name ?? null],
    );
    return rows[0]!;
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") return null; // unique_violation
    throw err;
  }
}

export async function verifyUser(email: string, password: string) {
  const db = getDb();
  const { rows } = await db.query<{ id: string; email: string; plan: string; password_hash: string; name: string | null }>(
    "SELECT id, email, plan, password_hash, name FROM users WHERE email = $1",
    [normalizeEmail(email)],
  );
  const user = rows[0];
  // always compare to keep timing consistent whether or not the account exists
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return null;
  return { id: user.id, email: user.email, plan: user.plan, name: user.name };
}

export async function createSession(userId: string, userAgent: string | undefined): Promise<string> {
  const db = getDb();
  const token = newSessionToken();
  await db.query(
    "INSERT INTO sessions (token_hash, user_id, user_agent, expires_at) VALUES ($1, $2, $3, now() + interval '30 days')",
    [hashToken(token), userId, userAgent?.slice(0, 200) ?? null],
  );
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await getDb().query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
}

export type SessionUser = { id: string; email: string; plan: string; name: string | null };

export async function userFromRequest(req: Request): Promise<SessionUser | null> {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (typeof raw !== "string" || !isValidSessionToken(raw)) return null;
  const db = getDb();
  const { rows } = await db.query<SessionUser>(
    `SELECT u.id, u.email, u.plan, u.name FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(raw)],
  );
  return rows[0] ?? null;
}

export type Identity = {
  userId: string;
  plan: string;
  authenticated: boolean;
};

export async function resolveIdentity(req: Request): Promise<Identity | null> {
  const user = await userFromRequest(req);
  if (user) return { userId: user.id, plan: user.plan, authenticated: true };
  const did = req.cookies?.[DEVICE_COOKIE];
  if (typeof did === "string" && isDeviceId(did)) {
    return { userId: did, plan: "free", authenticated: false };
  }
  return null;
}

// naive fixed-window limiter, per ip+bucket, good enough for a single node
const buckets = new Map<string, number[]>();

export function rateLimit(bucket: string, max: number, windowMs: number) {
  return (req: Request, res: { status: (n: number) => { json: (b: unknown) => void }; }, next: () => void) => {
    const key = `${bucket}:${req.ip ?? "unknown"}`;
    const now = Date.now();
    const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
    hits.push(now);
    buckets.set(key, hits);
    if (hits.length > max) {
      res.status(429).json({ error: "too many attempts, slow down" });
      return;
    }
    next();
  };
}

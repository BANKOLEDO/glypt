import { Router } from "express";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  passwordSchema,
  createUser,
  verifyUser,
  createSession,
  destroySession,
  userFromRequest,
  updateUserName,
  changePassword,
  createPasswordReset,
  consumePasswordReset,
  sessionCookieOptions,
  SESSION_COOKIE,
  rateLimit,
} from "../lib/auth";
import { hasDatabase } from "../lib/db";

export const authRouter = Router();

const slow = rateLimit("auth", 12, 15 * 60 * 1000);

authRouter.post("/register", slow, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  const { email, password, name } = parsed.data;
  const user = await createUser(email, password, name);
  if (!user) {
    // do not reveal whether the email is taken
    res.status(400).json({ error: "cannot create account with these details" });
    return;
  }
  const token = await createSession(user.id, req.headers["user-agent"]);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.status(201).json({ user });
});

authRouter.post("/login", slow, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid credentials" });
    return;
  }
  const user = await verifyUser(parsed.data.email, parsed.data.password);
  if (!user) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const token = await createSession(user.id, req.headers["user-agent"]);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  res.json({ user });
});

authRouter.post("/logout", async (req, res) => {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (typeof raw === "string") await destroySession(raw).catch(() => undefined);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", async (req, res) => {
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "not signed in" });
    return;
  }
  res.json({ user });
});

authRouter.patch("/me", async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return;
  }
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "not signed in" });
    return;
  }
  const parsed = z.object({ name: z.string().trim().min(1).max(80) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "a name is required" });
    return;
  }
  const updated = await updateUserName(user.id, parsed.data.name);
  res.json({ user: updated });
});

authRouter.post("/password", slow, async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return;
  }
  const user = await userFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "not signed in" });
    return;
  }
  const parsed = z
    .object({ currentPassword: z.string().min(1).max(200), newPassword: passwordSchema })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  const ok = await changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (!ok) {
    res.status(400).json({ error: "current password is incorrect" });
    return;
  }
  res.json({ ok: true });
});

authRouter.post("/reset-request", slow, async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return;
  }
  const parsed = z.object({ email: z.string().email().max(254) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid email" });
    return;
  }
  const token = await createPasswordReset(parsed.data.email);
  let resetUrl: string | undefined;
  if (token) {
    const base =
      process.env.RESET_BASE_URL ??
      process.env.WEB_ORIGIN?.split(",")[0]?.trim() ??
      "http://localhost:5173";
    resetUrl = `${base}/reset?token=${token}`;
    console.log(`glypt password reset for ${parsed.data.email}: ${resetUrl}`);
  }
  // never reveal whether the account exists
  res.json(process.env.EXPOSE_RESET_TOKEN === "true" && resetUrl ? { ok: true, resetUrl } : { ok: true });
});

authRouter.post("/reset", slow, async (req, res) => {
  if (!hasDatabase()) {
    res.status(503).json({ error: "accounts require a database" });
    return;
  }
  const parsed = z
    .object({ token: z.string().min(10).max(200), password: passwordSchema })
    .safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "invalid input" });
    return;
  }
  const ok = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (!ok) {
    res.status(400).json({ error: "reset link is invalid or expired" });
    return;
  }
  res.json({ ok: true });
});

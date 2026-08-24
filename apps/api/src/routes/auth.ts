import { Router } from "express";
import {
  registerSchema,
  loginSchema,
  createUser,
  verifyUser,
  createSession,
  destroySession,
  userFromRequest,
  sessionCookieOptions,
  SESSION_COOKIE,
  rateLimit,
} from "../lib/auth";
import { getDb } from "../lib/db";

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

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { searchRouter, iconRouter } from "./routes/search";
import { atlasRouter } from "./routes/atlas";
import { brandRouter } from "./routes/brand";
import { generateRouter } from "./routes/generate";
import { exportRouter } from "./routes/export";
import { favoritesRouter } from "./routes/favorites";
import { collectionsRouter } from "./routes/collections";
import { sharesRouter } from "./routes/shares";
import { marketplaceRouter } from "./routes/marketplace";
import { v1Router } from "./routes/v1";
import { ensureSchema, getDb, hasDatabase } from "./lib/db";

const allowedOrigins = (process.env.WEB_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function createApp(): express.Express {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error("origin not allowed"));
      },
      credentials: true,
    }),
  );

  // reject cross-site state changes when cookies ride along
  app.use((req, res, next) => {
    if (
      ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) &&
      req.headers.origin &&
      allowedOrigins.length &&
      !allowedOrigins.includes(req.headers.origin)
    ) {
      res.status(403).json({ error: "cross-origin request rejected" });
      return;
    }
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "glypt-api", time: new Date().toISOString() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/icon", iconRouter);
  app.use("/api/atlas", atlasRouter);
  app.use("/api/brand", brandRouter);
  app.use("/api/generate", generateRouter);
  app.use("/api/export", exportRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/marketplace", marketplaceRouter);
  app.use("/api/shares", sharesRouter);
  app.use("/api/v1", v1Router);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.message === "origin not allowed" ? 403 : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 403 ? "forbidden" : "internal error" });
  });

  return app;
}

export async function startApi(port = Number(process.env.API_PORT ?? 4000)) {
  const app = createApp();
  if (hasDatabase()) {
    await ensureSchema(getDb());
  } else {
    console.warn("glypt api: DATABASE_URL not set - running without persistence (auth/collections disabled)");
  }
  return app.listen(port, () => {
    console.log(`glypt api listening on http://localhost:${port}`);
  });
}

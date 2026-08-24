import type { NextFunction, Request, Response } from "express";
import { newDeviceId } from "@glypt/core/identity";
import { consumeQuota } from "./quota";
import { resolveIdentity, DEVICE_COOKIE, deviceCookieOptions } from "./auth";
import { hasDatabase, getDb } from "./db";

export type Identity = NonNullable<Awaited<ReturnType<typeof resolveIdentity>>>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      identity?: Identity;
      newDeviceId?: string;
    }
  }
}

export async function attachIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const identity = await resolveIdentity(req);
    if (identity) {
      req.identity = identity;
    } else {
      // lazy device id so anonymous visitors keep favorites and quota
      const did = newDeviceId();
      req.identity = { userId: did, plan: "free", authenticated: false };
      req.newDeviceId = did;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function issueDeviceCookie(res: Response, req: Request) {
  if (req.newDeviceId) {
    res.cookie(DEVICE_COOKIE, req.newDeviceId, deviceCookieOptions());
  }
}

export async function meterQuota(req: Request, res: Response, next: NextFunction) {
  try {
    const identity = req.identity!;
    const result = await consumeQuota(hasDatabase() ? getDb() : null, identity.userId, identity.plan);
    if (!result.unlimited && result.remaining !== null && result.remaining <= 0) {
      res.status(429).json({ error: "daily search quota reached" });
      return;
    }
    res.setHeader("x-quota-remaining", String(result.remaining ?? -1));
    next();
  } catch (err) {
    next(err);
  }
}

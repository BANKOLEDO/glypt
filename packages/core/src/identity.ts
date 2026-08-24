import { randomBytes, createHash } from "node:crypto";

export function newDeviceId(): string {
  return randomBytes(16).toString("hex");
}

export function isDeviceId(v: string): boolean {
  return /^[0-9a-f]{32}$/.test(v);
}

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidSessionToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

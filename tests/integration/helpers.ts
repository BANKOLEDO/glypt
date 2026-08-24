import type { AddressInfo } from "node:net";
import { createApp } from "../../apps/api/src/app";

export async function startTestApi() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export function cookieFrom(res: Response, name: string): string | null {
  const cookies = res.headers.getSetCookie?.() ?? [];
  for (const c of cookies) {
    if (c.startsWith(`${name}=`)) return c.split(";")[0];
  }
  return null;
}

export const hasDb = Boolean(process.env.DATABASE_URL);

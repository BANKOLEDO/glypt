import type { Format } from "@glypt/core";
import { snippetFor, fileExtFor } from "@glypt/core";

export { snippetFor, fileExtFor };
export type { Format };

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `request failed (${res.status})`);
  return data as T;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `request failed (${res.status})`);
  return data as T;
}

export async function deleteJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `request failed (${res.status})`);
  return data as T;
}

export async function rasterizeIconPng(id: string, size = 256): Promise<string | null> {
  const [prefix, name] = id.split(":");
  if (!prefix || !name) return null;
  try {
    const res = await fetch(
      `/api/icon?prefix=${encodeURIComponent(prefix)}&name=${encodeURIComponent(name)}`,
    );
    if (!res.ok) return null;
    const svg = await res.text();
    if (!svg.includes("<svg")) return null;
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export async function collectPngs(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const results = await Promise.all(ids.map((id) => rasterizeIconPng(id).catch(() => null)));
  results.forEach((png, i) => {
    if (png) out[ids[i]!] = png;
  });
  return out;
}

export async function downloadExportZip(
  ids: string[],
  formats: string[],
  name = "glypt-export",
  pngs?: Record<string, string>,
): Promise<void> {
  const res = await fetch("/api/export", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ icons: ids, formats, pngs }),
  });
  if (!res.ok) throw new Error("export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

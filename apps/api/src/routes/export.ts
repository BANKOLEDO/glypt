import { Router } from "express";
import { z } from "zod";
import { createZip, snippetFor, fileExtFor, fetchIconSvg, isValidIconId, type Format } from "@glypt/core";

export const exportRouter = Router();

const schema = z.object({
  icons: z.array(z.string().min(3).max(80)).min(1).max(32),
  formats: z.array(z.string()).optional(),
});

exportRouter.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !parsed.data.icons.every(isValidIconId)) {
    res.status(400).json({ error: "provide 1-32 valid icon ids" });
    return;
  }
  const requested = (parsed.data.formats ?? ["react"]).filter(
    (f): f is Format => f === "react" || f === "vue" || f === "svg",
  );
  const useFormats: Format[] = requested.length ? requested : ["react"];

  const entries: { name: string; data: Uint8Array }[] = [];
  const encoder = new TextEncoder();

  for (const id of parsed.data.icons) {
    for (const format of useFormats) {
      entries.push({
        name: `${id.replaceAll(":", "-")}.${fileExtFor(format)}`,
        data: encoder.encode(snippetFor(id, format)),
      });
    }
    if (!useFormats.includes("svg")) {
      const svg = await fetchIconSvg(id).catch(() => null);
      if (svg) {
        entries.push({
          name: `svg/${id.replaceAll(":", "-")}.svg`,
          data: encoder.encode(svg),
        });
      }
    }
  }

  const manifest = {
    generator: "Glypt",
    exportedAt: new Date().toISOString(),
    icons: parsed.data.icons,
    formats: useFormats,
  };
  entries.push({ name: "manifest.json", data: encoder.encode(JSON.stringify(manifest, null, 2)) });
  entries.push({
    name: "README.txt",
    data: encoder.encode(
      `Glypt asset export\n\nIcons: ${parsed.data.icons.join(", ")}\nFormats: ${useFormats.join(", ")}\n\nEach snippet installs its own dependency header.\n`,
    ),
  });

  const zip = createZip(entries);
  res.setHeader("content-type", "application/zip");
  res.setHeader("content-disposition", 'attachment; filename="glypt-export.zip"');
  res.send(Buffer.from(zip));
});

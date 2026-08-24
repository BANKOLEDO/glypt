import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { snippetFor, searchIcons, buildRefs, isValidIconId, fetchIconSvg } from "@glypt/core";

type Cell = { ref: string; id: string; svg: string | null };
type TextBlock = { type: "text"; text: string };

const sessions = new Map<string, Map<string, string>>();

const textBlock = (text: string): TextBlock => ({ type: "text", text });

function composeAtlas(cells: Cell[], cols: number): string {
  const size = 96;
  const pad = 28;
  const rows = Math.ceil(cells.length / cols);
  const w = cols * (size + pad) + pad;
  const h = rows * (size + pad) + pad;

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="100%" height="100%" fill="#FFF6EC"/>`,
  ];

  cells.forEach((c, i) => {
    const x = pad + (i % cols) * (size + pad);
    const y = pad + Math.floor(i / cols) * (size + pad);
    parts.push(
      `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="10" fill="#FFFFFF" stroke="#ECDFD0"/>`,
      `<text x="${x + 2}" y="${y - 6}" font-family="monospace" font-size="12" font-weight="bold" fill="#FF5A1F">${c.ref}</text>`,
    );
    if (c.svg) {
      parts.push(c.svg.replace("<svg ", `<svg x="${x}" y="${y}" width="${size}" height="${size}" `));
    }
  });

  parts.push("</svg>");
  return parts.join("\n");
}

const server = new McpServer({ name: "glypt", version: "0.1.0" });

server.registerTool(
  "search_icons",
  {
    description: "Search 200k+ icons by text query. Returns icon ids.",
    inputSchema: {
      query: z.string().min(1).max(64),
      limit: z.number().int().min(1).max(64).default(12),
    },
  },
  async ({ query, limit }) => {
    try {
      const data = await searchIcons(query, limit);
      return {
        content: [
          textBlock(JSON.stringify({ icons: data.icons, total: data.total ?? data.icons.length })),
        ],
      };
    } catch {
      return { content: [textBlock("network error")] };
    }
  },
);

server.registerTool(
  "visual_select",
  {
    description:
      "Render candidate icons as a labeled visual atlas with opaque references " +
      "(A1, A2, B1...). Inspect the sheet, pick a ref, then call resolve_icon.",
    inputSchema: {
      icons: z.array(z.string()).min(1).max(32),
      cols: z.number().int().min(1).max(8).default(4),
    },
  },
  async ({ icons, cols }) => {
    const valid = icons.filter(isValidIconId);
    const svgs = await Promise.all(valid.map((id) => fetchIconSvg(id)));
    const refs = buildRefs(valid.length, cols);
    const cells: Cell[] = valid.map((id, i) => ({ ref: refs[i]!.ref, id, svg: svgs[i] }));

    const sessionId = `atlas-${Date.now().toString(36)}`;
    const map = new Map<string, string>();
    cells.forEach((c) => map.set(c.ref, c.id));
    sessions.set(sessionId, map);

    return {
      content: [
        textBlock(`session=${sessionId}`),
        textBlock(JSON.stringify(Object.fromEntries(map))),
        textBlock(composeAtlas(cells, cols)),
      ],
    };
  },
);

server.registerTool(
  "resolve_icon",
  {
    description:
      "Resolve opaque atlas refs (A1, B3...) back to icon ids for a session returned by visual_select.",
    inputSchema: {
      session: z.string(),
      refs: z.array(z.string()).min(1).max(32),
    },
  },
  async ({ session, refs }) => {
    const map = sessions.get(session);
    if (!map) {
      return { content: [textBlock(`unknown session: ${session}`)] };
    }
    const resolved: Record<string, string | null> = {};
    for (const r of refs) resolved[r] = map.get(r) ?? null;
    return { content: [textBlock(JSON.stringify(resolved, null, 2))] };
  },
);

server.registerTool(
  "write_icon",
  {
    description:
      "Generate ready-to-paste import code for an icon id. Frameworks: react | vue | svg.",
    inputSchema: {
      id: z.string().regex(/^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/i),
      framework: z.enum(["react", "vue", "svg"]).default("react"),
    },
  },
  async ({ id, framework }) => {
    return { content: [textBlock(snippetFor(id, framework))] };
  },
);

async function main(): Promise<void> {
  await server.connect(new StdioServerTransport());
  console.error("[glypt-mcp] ready on stdio");
}

main().catch((err) => {
  console.error("[glypt-mcp] fatal:", err);
  process.exit(1);
});

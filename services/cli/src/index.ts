import { program } from "commander";
import { writeFile, readFile } from "node:fs/promises";
import { snippetFor, searchIcons, fetchIconSvg, isValidIconId } from "@glypt/core";

const SESSION_FILE = ".glypt-session.json";

const C = {
  dim: "\x1b[2m",
  accent: "\x1b[38;5;208m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

type SessionFile = {
  session: string;
  createdAt: string;
  cols: number;
  resolvedCount: number;
  refs: Record<string, string | null>;
};

program
  .name("glypt")
  .description("Glypt - the visual asset platform")
  .version("0.1.0");

program
  .command("search")
  .description("Search 200k+ icons")
  .argument("<query>", "search query, e.g. rocket")
  .option("-l, --limit <n>", "max results", "10")
  .action(async (query: string, opts: { limit: string }) => {
    const limit = Math.max(1, Math.min(64, parseInt(opts.limit, 10) || 10));
    try {
      const data = await searchIcons(query, limit);
      if (!data.icons.length) {
        console.log(`${C.dim}no matches for "${query}"${C.reset}`);
        return;
      }
      console.log(
        `${C.accent}${data.total ?? data.icons.length} matches${C.reset} (showing ${data.icons.length})`,
      );
      for (const id of data.icons) console.log(`  ${id}`);
    } catch {
      console.error(`${C.red}network error${C.reset}`);
      process.exitCode = 1;
    }
  });

program
  .command("atlas")
  .description("Build a visual atlas with opaque refs and save the session")
  .requiredOption("--icons <list>", "comma-separated icon ids")
  .option("--cols <n>", "columns", "4")
  .action(async (opts: { icons: string; cols: string }) => {
    const icons = opts.icons.split(",").map((s) => s.trim()).filter(Boolean);
    const invalid = icons.filter((i) => !isValidIconId(i));
    if (invalid.length || !icons.length) {
      console.error(
        `${C.red}invalid icon ids: ${invalid.join(", ") || "(none)"}${C.reset}`,
      );
      process.exitCode = 1;
      return;
    }
    const cols = Math.max(1, Math.min(8, parseInt(opts.cols, 10) || 4));

    const svgs = await Promise.all(
      icons.map((id) => fetchIconSvg(id).catch(() => null)),
    );

    const rows = "ABCDEFGH".split("");
    const refs: Record<string, string | null> = {};
    let resolvedCount = 0;

    for (let i = 0; i < icons.length; i++) {
      const ref = `${rows[Math.floor(i / cols)]}${(i % cols) + 1}`;
      if (!svgs[i]) {
        refs[ref] = null;
        console.log(`${C.dim}${ref}  ${icons[i]}  (unresolved)${C.reset}`);
        continue;
      }
      refs[ref] = icons[i];
      resolvedCount++;
      const pad = Math.max(1, 24 - icons[i]!.length);
      const size = svgs[i]!.length;
      console.log(`${C.green}${ref}${C.reset}  ${icons[i]}${" ".repeat(pad)}${size}b`);
    }

    const session: SessionFile = {
      session: `atlas-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      cols,
      resolvedCount,
      refs,
    };
    await writeFile(SESSION_FILE, JSON.stringify(session, null, 2));
    console.log(`${C.dim}session saved -> ${SESSION_FILE}${C.reset}`);
  });

program
  .command("resolve")
  .description("Resolve atlas refs back to icon ids using the saved session")
  .argument("<refs...>", "refs like A1 B2")
  .action(async (refArgs: string[]) => {
    let raw: string;
    try {
      raw = await readFile(SESSION_FILE, "utf8");
    } catch {
      console.error(`${C.red}no session file. run: glypt atlas --icons ...${C.reset}`);
      process.exitCode = 1;
      return;
    }
    const session = JSON.parse(raw) as SessionFile;
    for (const ref of refArgs) {
      const id = session.refs[ref];
      console.log(id == null ? `${C.red}${ref}  ?${C.reset}` : `${C.green}${ref}${C.reset}  ${id}`);
    }
  });

program
  .command("export")
  .description("Export an icon as code or SVG to a file (or stdout)")
  .requiredOption("--icon <id>", "icon id like lucide:rocket")
  .option("-f, --format <fmt>", "react | vue | svg", "react")
  .option("-o, --out <file>", "output file")
  .action(async (opts: { icon: string; format: string; out?: string }) => {
    if (!isValidIconId(opts.icon)) {
      console.error(`${C.red}invalid icon id: ${opts.icon}${C.reset}`);
      process.exitCode = 1;
      return;
    }
    const fmt = (["react", "vue", "svg"].includes(opts.format)
      ? opts.format
      : "react") as "react" | "vue" | "svg";

    let content = snippetFor(opts.icon, fmt);

    if (fmt === "svg") {
      try {
        const svg = await fetchIconSvg(opts.icon);
        if (!svg) {
          console.error(`${C.red}icon fetch failed${C.reset}`);
          process.exitCode = 1;
          return;
        }
        content = svg;
      } catch {
        console.error(`${C.red}network error${C.reset}`);
        process.exitCode = 1;
        return;
      }
    }

    if (opts.out) {
      await writeFile(opts.out, content);
      console.log(`${C.green}wrote ${opts.out}${C.reset}`);
    } else {
      console.log(content);
    }
  });

program.parseAsync();

#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  searchIcons,
  fetchIconSvg,
  snippetFor,
  fileExtFor,
  createZip,
  isValidIconId,
  isFormat,
  isLang,
  extractBrand,
} from "@glypt/core";
import type { Format, Lang, ZipEntry } from "@glypt/core";

const VERSION = "0.1.0";

const HELP = `glypt — icons and brand kits from your terminal

Usage
  glypt search <query> [--limit N] [--json]
  glypt icon <id> [--format react|vue|svg] [--lang ts|js] [--out FILE]
  glypt export <id...> [--formats svg,react,vue] [--lang ts|js] [--out FILE]
  glypt brand <domain> [--out FILE]

Examples
  glypt search "arrow up right"
  glypt icon lucide:rocket --format react --lang ts
  glypt export lucide:rocket ph:star mdi:heart --formats svg,react --out icons.zip
  glypt brand vercel.com

Options
  -f, --format    output format for a single icon (react, vue, svg)
  -l, --lang      language for code snippets (ts, js)
  -n, --limit     search result limit (default 24)
  -o, --out       write output to a file
      --formats   comma-separated formats for export
      --json      print raw JSON
  -h, --help      show this help
  -v, --version   show the version

Icons come from Iconify (200,000+); brand kits are extracted from a domain.
`;

type Flags = Record<string, string | boolean>;

function parseArgs(args: string[]): { flags: Flags; rest: string[] } {
  const flags: Flags = {};
  const rest: string[] = [];
  const short: Record<string, string> = { f: "format", l: "lang", n: "limit", o: "out", h: "help", v: "version" };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq > -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        const next = args[i + 1];
        if (next && !next.startsWith("-")) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith("-") && arg.length > 1) {
      const key = short[arg.slice(1)];
      const next = args[i + 1];
      if (key && next && !next.startsWith("-")) {
        flags[key] = next;
        i++;
      } else if (key) {
        flags[key] = true;
      } else {
        rest.push(arg);
      }
    } else {
      rest.push(arg);
    }
  }
  return { flags, rest };
}

function toFormat(value: string | boolean | undefined): Format {
  if (typeof value === "string" && isFormat(value)) return value;
  return "react";
}

function toLang(value: string | boolean | undefined): Lang {
  if (typeof value === "string" && isLang(value)) return value;
  return "ts";
}

function die(message: string): never {
  console.error(`glypt: ${message}`);
  process.exit(1);
}

async function cmdSearch(query: string, flags: Flags): Promise<void> {
  if (!query) die("search needs a query, e.g. glypt search rocket");
  const limit = typeof flags.limit === "string" ? Number(flags.limit) || 24 : 24;
  const result = await searchIcons(query, limit);
  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (result.icons.length === 0) {
    console.log(`No icons found for "${query}".`);
    return;
  }
  for (const id of result.icons) console.log(id);
  console.log(`\n${result.icons.length} of ${result.total.toLocaleString()} matches`);
}

async function cmdIcon(id: string, flags: Flags): Promise<void> {
  if (!id) die("icon needs an id, e.g. glypt icon lucide:rocket");
  if (!isValidIconId(id)) die(`"${id}" is not a valid icon id (expected prefix:name)`);
  const format = toFormat(flags.format);
  const lang = toLang(flags.lang);
  let output: string;
  if (format === "svg") {
    output = (await fetchIconSvg(id)) ?? die(`could not fetch ${id}`);
  } else {
    output = snippetFor(id, format, lang);
  }
  if (typeof flags.out === "string") {
    writeFileSync(resolve(flags.out), output);
    console.log(`Wrote ${flags.out}`);
  } else {
    console.log(output);
  }
}

async function cmdExport(ids: string[], flags: Flags): Promise<void> {
  if (ids.length === 0) die("export needs at least one icon id");
  const bad = ids.filter((id) => !isValidIconId(id));
  if (bad.length > 0) die(`invalid icon id(s): ${bad.join(", ")}`);
  const formats = (typeof flags.formats === "string" ? flags.formats.split(",") : ["svg"]).filter(
    isFormat,
  );
  if (formats.length === 0) die("no valid formats (use svg, react, vue)");
  const lang = toLang(flags.lang);

  const entries: ZipEntry[] = [];
  for (const id of ids) {
    const [prefix, name] = id.split(":");
    for (const format of formats) {
      if (format === "svg") {
        const svg = await fetchIconSvg(id);
        if (svg) entries.push({ name: `svg/${name}.svg`, data: new TextEncoder().encode(svg) });
      } else {
        const ext = fileExtFor(format, lang);
        const code = snippetFor(id, format, lang);
        entries.push({ name: `${format}/${prefix}-${name}.${ext}`, data: new TextEncoder().encode(code) });
      }
    }
  }
  if (entries.length === 0) die("nothing to export (icons could not be fetched)");

  const zip = createZip(entries);
  const out = typeof flags.out === "string" ? flags.out : (flags.out === true ? die("--out needs a filename") : "glypt-export.zip");
  writeFileSync(resolve(out), zip);
  console.log(`Wrote ${out} · ${entries.length} files from ${ids.length} icons`);
}

async function cmdBrand(domain: string, flags: Flags): Promise<void> {
  if (!domain) die("brand needs a domain, e.g. glypt brand vercel.com");
  const kit = await extractBrand(domain);
  if (!kit) die(`could not extract a brand for "${domain}"`);
  const json = JSON.stringify(kit, null, 2);
  if (typeof flags.out === "string") {
    writeFileSync(resolve(flags.out), json);
    console.log(`Wrote ${flags.out}`);
    return;
  }
  console.log(json);
}

async function main(): Promise<void> {
  const { flags, rest } = parseArgs(process.argv.slice(2));
  if (flags.help || rest.length === 0) {
    console.log(HELP);
    return;
  }
  if (flags.version) {
    console.log(VERSION);
    return;
  }
  const [command, ...args] = rest;
  try {
    switch (command) {
      case "search":
        await cmdSearch(args.join(" "), flags);
        break;
      case "icon":
        await cmdIcon(args[0] ?? "", flags);
        break;
      case "export":
        await cmdExport(args, flags);
        break;
      case "brand":
        await cmdBrand(args[0] ?? "", flags);
        break;
      default:
        console.error(`glypt: unknown command "${command}"\n`);
        console.log(HELP);
        process.exit(1);
    }
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
}

void main();

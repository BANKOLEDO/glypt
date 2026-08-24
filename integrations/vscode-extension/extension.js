const vscode = require("vscode");

const CANDY = { tang: "\u26A1", mint: "\u2705", berry: "\uD83D\uDC97" };
const FALLBACK_SEARCH = "https://api.iconify.design/search";

function apiBase() {
  return vscode.workspace.getConfiguration("glypt").get("apiBase", "http://localhost:4000");
}

function snippetFor(id, format) {
  if (format === "vue") return `<Icon icon="${id}" />`;
  if (format === "jsx") return `<Icon icon="${id}" />`;
  return id;
}

async function searchIcons(query) {
  try {
    const res = await fetch(`${apiBase()}/api/search?q=${encodeURIComponent(query)}&limit=36`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.icons) && data.icons.length) return data.icons;
    }
  } catch {}
  const res = await fetch(`${FALLBACK_SEARCH}?query=${encodeURIComponent(query)}&limit=36`);
  const data = await res.json();
  return (data.icons ?? []).map((i) => (typeof i === "string" ? i : `${i.prefix}:${i.name}`));
}

function guessFormat(editor) {
  const lang = editor?.document.languageId ?? "";
  if (lang === "vue") return "vue";
  if (["javascriptreact", "typescriptreact", "svelte", "astro"].includes(lang)) return "jsx";
  return null;
}

async function pickFormat(editor) {
  const guessed = guessFormat(editor);
  const items = [
    { label: "React / JSX", value: "jsx", description: '<Icon icon="…" />' },
    { label: "Vue", value: "vue", description: '<Icon icon="…" /> (@iconify/vue)' },
    { label: "Copy SVG URL", value: "url", description: "iconify CDN link" },
  ];
  const preselected = items.findIndex((i) => i.value === guessed);
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: `Output format${guessed ? ` (detected ${guessed})` : ""}`,
  });
  void preselected;
  return picked?.value;
}

async function insertIcon() {
  const query = await vscode.window.showInputBox({
    prompt: `${CANDY.tang} Glypt — search 200k+ icons`,
    placeHolder: "rocket, heart, cloud…",
  });
  if (!query) return;

  let icons;
  try {
    icons = await searchIcons(query);
  } catch {
    vscode.window.showErrorMessage(`${CANDY.tang} Glypt: search failed`);
    return;
  }
  if (!icons.length) {
    vscode.window.showInformationMessage(`${CANDY.tang} Glypt: no matches for "${query}"`);
    return;
  }

  const picked = await vscode.window.showQuickPick(
    icons.map((id) => ({
      label: id,
      description: id.split(":")[0],
      iconPath: vscode.Uri.parse(
        `${apiBase()}/api/icon?prefix=${encodeURIComponent(id.split(":")[0])}&name=${encodeURIComponent(id.split(":")[1])}`,
      ),
    })),
    { placeHolder: "Pick an icon — previews render where supported" },
  );
  if (!picked) return;
  const id = picked.label;

  const editor = vscode.window.activeTextEditor;
  const format = await pickFormat(editor);
  if (!format) return;

  if (format === "url") {
    const [prefix, name] = id.split(":");
    const url = `https://api.iconify.design/${prefix}/${name}.svg`;
    await vscode.env.clipboard.writeText(url);
    vscode.window.showInformationMessage(`${CANDY.mint} Copied SVG URL for ${id}`);
    return;
  }
  if (!editor) {
    vscode.window.showWarningMessage(`${CANDY.berry} Open a file to insert into`);
    return;
  }
  await editor.edit((b) => b.insert(editor.selection.start, snippetFor(id, format)));
  vscode.window.showInformationMessage(`${CANDY.mint} Inserted ${id}`);
}

async function setApiBase() {
  const current = apiBase();
  const next = await vscode.window.showInputBox({
    prompt: `${CANDY.tang} Glypt API base URL`,
    value: current,
    validateInput(v) {
      return /^https?:\/\//.test(v) ? null : "must be an http(s) URL";
    },
  });
  if (!next) return;
  await vscode.workspace.getConfiguration("glypt").update("apiBase", next.trim(), vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`${CANDY.mint} Glypt API set to ${next.trim()}`);
}

function activate(context) {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  status.text = "$(paintcan) Glypt";
  status.tooltip = "Search icons and insert framework-ready code";
  status.command = "glypt.insertIcon";
  status.show();

  context.subscriptions.push(
    status,
    vscode.commands.registerCommand("glypt.insertIcon", insertIcon),
    vscode.commands.registerCommand("glypt.setApiBase", setApiBase),
  );
}

module.exports = { activate };

// Glypt Figma plugin — search 200k+ icons, insert as editable vectors.
// Load via Figma desktop: Plugins > Development > Import from manifest.

const API = "http://localhost:4000";
const FALLBACK_SEARCH = "https://api.iconify.design/search";

figma.showUI(__html__, { width: 340, height: 480 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "search") {
    const q = String(msg.q || "").trim();
    if (!q) return;
    try {
      let ids = [];
      try {
        const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}&limit=36`);
        const data = await res.json();
        ids = data.icons ?? [];
      } catch {
        const res = await fetch(`${FALLBACK_SEARCH}?query=${encodeURIComponent(q)}&limit=36`);
        const data = await res.json();
        ids = (data.icons ?? []).map((i) => typeof i === "string" ? i : `${i.prefix}:${i.name}`);
      }
      figma.ui.postMessage({ type: "results", ids });
    } catch {
      figma.ui.postMessage({ type: "error", message: "Search failed — check your connection." });
    }
    return;
  }

  if (msg.type === "insert") {
    const id = String(msg.id || "").trim();
    if (!/^[a-z0-9-]+:[a-z0-9-]+$/i.test(id)) {
      figma.notify("Glypt: invalid icon id");
      return;
    }
    const [prefix, name] = id.split(":");
    const size = Number(msg.size) || 24;
    try {
      const svg = await (await fetch(`${API}/api/icon?prefix=${encodeURIComponent(prefix)}&name=${encodeURIComponent(name)}`)).text();
      if (!svg.includes("<svg")) throw new Error("bad payload");
      const node = figma.createNodeFromSvg(svg);
      node.resize(size, size);
      node.name = name;
      if (msg.tint && /^#[0-9a-f]{6}$/i.test(msg.tint)) {
        const paint = { type: "SOLID", color: hexToRgb(msg.tint) };
        for (const n of node.findAll(() => true)) {
          if ("fills" in n) n.fills = [paint];
        }
        if ("fills" in node) node.fills = [paint];
      }
      node.x = figma.viewport.center.x - node.width / 2;
      node.y = figma.viewport.center.y - node.height / 2;
      figma.currentPage.appendChild(node);
      figma.currentPage.selection = [node];
      figma.notify(`Glypt: ${id} @ ${size}px`);

      let recent = [];
      try {
        recent = (await figma.clientStorage.getAsync("recent")) ?? [];
      } catch {}
      recent = [id, ...recent.filter((r) => r !== id)].slice(0, 8);
      figma.clientStorage.setAsync("recent", recent);
    } catch {
      figma.notify("Glypt: could not fetch that icon");
    }
  }
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

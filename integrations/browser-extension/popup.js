// Glypt popup — palette extraction with one-tap copy.
const DEFAULTS = { apiBase: "http://localhost:4000", appBase: "http://localhost:5173" };
let lastPalette = [];

const host = document.getElementById("host");
const statusEl = document.getElementById("status");
const swatchWrap = document.getElementById("swatches");
const copyAllBtn = document.getElementById("copyAll");

function say(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls || "";
}

async function cfg() {
  const saved = await chrome.storage.sync.get(DEFAULTS);
  return saved;
}

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  try {
    host.textContent = new URL(tab.url).hostname;
  } catch {
    host.textContent = "no tab";
  }
});

document.querySelectorAll(".links a").forEach((a) =>
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    const { appBase } = await cfg();
    chrome.tabs.create({ url: `${appBase}${a.dataset.path}` });
  })
);

["apiBase", "appBase"].forEach((id) => {
  const input = document.getElementById(id);
  cfg().then((c) => (input.value = c[id]));
  input.addEventListener("change", async () => {
    await chrome.storage.sync.set({ [id]: input.value.trim() || DEFAULTS[id] });
    say("settings saved", "ok");
  });
});

copyAllBtn.addEventListener("click", async () => {
  if (!lastPalette.length) return;
  await navigator.clipboard.writeText(lastPalette.join(", "));
  say(`${lastPalette.length} colors copied`, "ok");
});

function renderSwatches(palette) {
  swatchWrap.innerHTML = "";
  for (const color of palette.slice(0, 6)) {
    const cell = document.createElement("div");
    cell.className = "swatch";
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.background = color;
    const hex = document.createElement("code");
    hex.textContent = color;
    cell.appendChild(tile);
    cell.appendChild(hex);
    cell.title = `copy ${color}`;
    cell.addEventListener("click", async () => {
      await navigator.clipboard.writeText(color);
      say(`${color} copied`, "ok");
    });
    swatchWrap.appendChild(cell);
  }
}

document.getElementById("extract").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let domain;
  try {
    domain = new URL(tab.url).hostname;
  } catch {
    say("cannot read this tab", "err");
    return;
  }

  say("extracting…");
  swatchWrap.innerHTML = "";
  copyAllBtn.style.display = "none";
  try {
    const { apiBase } = await cfg();
    const res = await fetch(`${apiBase}/api/brand?domain=${encodeURIComponent(domain)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "failed");
    lastPalette = data.palette ?? [];
    renderSwatches(lastPalette);
    copyAllBtn.style.display = "block";
    say(`${data.name} — tap a swatch to copy`);
  } catch (e) {
    say(`error: ${e.message}`, "err");
  }
});

// Glypt extension — context menu shortcuts into the web app.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "glypt-atlas", title: "Glypt: open Atlas board", contexts: ["page", "image"] });
  chrome.contextMenus.create({ id: "glypt-dashboard", title: "Glypt: open Dashboard", contexts: ["page"] });
});

async function appBase() {
  const { appBase } = await chrome.storage.sync.get({ appBase: "http://localhost:5173" });
  return appBase;
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "glypt-atlas") {
    chrome.tabs.create({ url: `${await appBase()}/atlas` });
  }
  if (info.menuItemId === "glypt-dashboard") {
    chrome.tabs.create({ url: `${await appBase()}/dashboard` });
  }
});

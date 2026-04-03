// ============================================================
// GeminiShortcut – shared defaults + storage helpers
// Inlined at build time.
// ============================================================

const DEFAULT_PROMPTS = {
  summarize: { name: "Summarize (3 bullets)", text: "Provide a concise 3-bullet summary of this: " },
  explain:   { name: "Explain Simply (ELI5)", text: "Explain this in simple terms for a student: " },
  notes:     { name: "Make Study Notes",      text: "Turn this into clean study notes with headings and bullet points: " },
  quiz:      { name: "Quiz Me",               text: "Create 5 quiz questions (with answers) based on this: " },
  rewrite:   { name: "Rewrite Clearly",        text: "Rewrite this to be clear and well-structured for studying: " }
};

const DEFAULT_SETTINGS = {
  floatingEnabled:  true,
  floatingActionId: "summarize"
};

// ── Gemini URL strategy ──────────────────────────────────────────────────────
const GEMINI_URLS = [
  "https://gemini.google.com/app?q={q}&autosubmit=true",
  "https://gemini.google.com/app?q={q}",
  "https://gemini.google.com/?q={q}"
];

function buildGeminiUrl(prompt) {
  for (let i = 0; i < GEMINI_URLS.length; i++) {
    const url = GEMINI_URLS[i].replace("{q}", prompt);
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "gemini.google.com") return url;
    } catch {
      // malformed URL, skip
    }
  }
  return null;
}

// ── Promisified storage helpers ───────────────────────────────────────────────
function storageGet(keys) {
  return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
}
function storageSet(items) {
  return new Promise(resolve => chrome.storage.sync.set(items, resolve));
}
function storageRemove(keys) {
  return new Promise(resolve => chrome.storage.sync.remove(keys, resolve));
}

// ============================================================
// Background Service Worker
// ============================================================

function removeAllMenus() {
  return new Promise(resolve => chrome.contextMenus.removeAll(resolve));
}

async function updateContextMenus() {
  const { prompts } = await storageGet(['prompts']);
  const activePrompts = prompts || DEFAULT_PROMPTS;

  await removeAllMenus();

  chrome.contextMenus.create({
    id: "geminiMaster",
    title: "Gemini Power Actions",
    contexts: ["selection"]
  });

  for (const [id, data] of Object.entries(activePrompts)) {
    chrome.contextMenus.create({
      id,
      parentId: "geminiMaster",
      title: data.name,
      contexts: ["selection"]
    });
  }

  // Update badge with prompt count
  const count = Object.keys(activePrompts).length;
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: "#4285f4" });
}

// ── Extension installed / updated ────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gemini Shortcut: Extension installed/updated.");
  updateContextMenus();
});

// ── Browser startup ──────────────────────────────────────────────────────────
chrome.runtime.onStartup.addListener(() => {
  updateContextMenus();
});

// ── Keep menus in sync when popup/content script changes storage ─────────────
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.prompts) {
    updateContextMenus();
  }
});

// ── Keyboard shortcut handler ────────────────────────────────────────────────
// chrome.commands supports a maximum of 4 shortcuts.
// Currently registered: summarize, explain, notes, quiz.
  const { prompts } = await storageGet(['prompts']);
  const action = (prompts || DEFAULT_PROMPTS)[commandId];
  if (!action) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  // If the user is already on Gemini, inject the prompt directly
  if (tab.url && tab.url.includes("gemini.google.com")) {
    const query = encodeURIComponent(action.text);
    chrome.tabs.sendMessage(tab.id, { type: "INJECT_PROMPT", prompt: query });
    return;
  }

  // Otherwise open a new Gemini tab
  const url = buildGeminiUrl(encodeURIComponent(action.text));
  if (url) chrome.tabs.create({ url });
});

// ── Context menu click handler ────────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "geminiMaster") return;

  const { prompts } = await storageGet(['prompts']);
  const action = (prompts || DEFAULT_PROMPTS)[info.menuItemId];
  if (!action) return;

  const selectedText = encodeURIComponent(info.selectionText);
  const fullPrompt   = encodeURIComponent(action.text + info.selectionText);
  const url          = buildGeminiUrl(fullPrompt);

  if (url) {
    chrome.tabs.create({ url });
  } else {
    console.error("GeminiShortcut: All Gemini URL strategies failed.");
  }
});

console.log("Gemini Shortcut: Background service worker ready.");

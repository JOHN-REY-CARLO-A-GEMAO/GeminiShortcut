// ============================================================
// GeminiShortcut – shared defaults (single source of truth)
// Inlined into each consumer at build time.
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

// ============================================================
// Background Service Worker
// ============================================================

/** Promisify chrome.contextMenus.removeAll for clean async/await */
function removeAllMenus() {
  return new Promise(resolve => chrome.contextMenus.removeAll(resolve));
}

/** Rebuild context menus from current stored prompts */
async function updateContextMenus() {
  const { prompts } = await chrome.storage.sync.get(['prompts']);
  const activePrompts = prompts || DEFAULT_PROMPTS;

  // Wait for removeAll to finish before creating new menus (fixes async race)
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
}

// ── Extension installed / updated ──────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gemini Shortcut: Extension installed/updated.");

  chrome.storage.sync.get(['prompts', 'settings'], (result) => {
    const updates = {};

    if (!result.prompts)  updates.prompts  = DEFAULT_PROMPTS;
    if (!result.settings) updates.settings = DEFAULT_SETTINGS;

    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates, updateContextMenus);
    } else {
      updateContextMenus();
    }
  });
});

// ── Browser startup (service worker may have been unloaded) ────────────────
chrome.runtime.onStartup.addListener(() => {
  updateContextMenus();
});

// ── Keep menus in sync when popup or content script changes storage ─────────
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.prompts) {
    updateContextMenus();
  }
});

// ── Handle context menu clicks ──────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info) => {
  chrome.storage.sync.get(['prompts'], (result) => {
    const prompts = result.prompts || DEFAULT_PROMPTS;
    const action  = prompts[info.menuItemId];
    if (!action) return;

    const query = encodeURIComponent(action.text + info.selectionText);
    const url   = `https://gemini.google.com/app?q=${query}&autosubmit=true`;
    chrome.tabs.create({ url });
  });
});

console.log("Gemini Shortcut: Background service worker ready.");

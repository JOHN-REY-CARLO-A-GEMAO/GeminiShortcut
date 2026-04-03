// ============================================================
// GeminiShortcut – shared defaults + storage helpers
// Single source of truth — inlined at build time.
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

/**
 * Build the best-effort Gemini URL.
 * Tries URLs in order; if the primary (index 0) fails, falls back gracefully.
 * @param {string} prompt - Full prompt text (already encoded by caller)
 */
function buildGeminiUrl(prompt) {
  for (let i = 0; i < GEMINI_URLS.length; i++) {
    const url = GEMINI_URLS[i].replace("{q}", prompt);
    try {
      const parsed = new URL(url);
      // Only trust known Gemini hosts
      if (parsed.hostname === "gemini.google.com") return url;
    } catch {
      // malformed URL, skip
    }
  }
  return null; // all strategies exhausted
}

// ── Promisified storage helpers (MV3 callback → Promise) ────────────────────
function storageGet(keys) {
  return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
}

function storageSet(items) {
  return new Promise(resolve => chrome.storage.sync.set(items, resolve));
}

function storageRemove(keys) {
  return new Promise(resolve => chrome.storage.sync.remove(keys, resolve));
}

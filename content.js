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
// Content Script – runs on all pages
// ============================================================

// ── PART 1: Gemini site – auto-submit prompt from URL params ────────────────
if (window.location.hostname === "gemini.google.com") {
  const params     = new URLSearchParams(window.location.search);
  const promptText = params.get('q');
  const autoSubmit = params.get('autosubmit') === 'true';

  if (promptText) {
    const interval = setInterval(() => {
      const input = document.querySelector('div[contenteditable="true"], textarea');
      if (!input) return;
      clearInterval(interval);

      input.focus();
      const decoded = decodeURIComponent(promptText);

      if (input.tagName.toLowerCase() === 'textarea') {
        input.value = decoded;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        input.textContent = decoded;
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }

      if (autoSubmit) {
        setTimeout(() => {
          document.querySelector('button[aria-label="Send message"]')?.click();
        }, 600);
      }
    }, 500);
  }
}

// ── PART 2: Floating button on all other sites ────────────────────────────────
else {
  if (document.body && !document.getElementById('gemini-extension-host')) {
    const host  = document.createElement('div');
    host.id = 'gemini-extension-host';
    host.style.all = 'initial';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const btn = Object.assign(document.createElement('div'), {
      id: 'gemini-floating-button',
      innerText: 'G',
      role: 'button',
      'aria-label': 'Open Gemini with selected text'
    });

    const style = document.createElement('style');
    style.textContent = `
      #gemini-floating-button {
        position: fixed; width: 40px; height: 40px;
        background: #4285f4; color: white;
        border-radius: 50%; display: none;
        align-items: center; justify-content: center;
        cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        z-index: 2147483647; font-family: sans-serif;
        font-weight: bold; border: 2px solid white;
        user-select: none; transition: background 0.2s, transform 0.15s;
      }
      #gemini-floating-button:hover  { background: #3367d6; transform: scale(1.08); }
      #gemini-floating-button:active  { transform: scale(0.96); }
    `;

    shadow.appendChild(style);
    shadow.appendChild(btn);

    // ── State ────────────────────────────────────────────────────────────────
    let selection  = '';
    let hideTimer  = null;
    let cachedPrompts  = { ...DEFAULT_PROMPTS };
    let cachedSettings = { ...DEFAULT_SETTINGS };

    function loadConfig() {
      chrome.storage.sync.get(['prompts', 'settings'], (r) => {
        cachedPrompts  = { ...DEFAULT_PROMPTS,  ...r.prompts  };
        cachedSettings = { ...DEFAULT_SETTINGS, ...r.settings };
      });
    }
    loadConfig();

    chrome.storage.onChanged.addListener((changes, ns) => {
      if (ns !== 'sync') return;
      if (changes.prompts)  cachedPrompts  = { ...DEFAULT_PROMPTS,  ...changes.prompts.newValue  };
      if (changes.settings) cachedSettings = { ...DEFAULT_SETTINGS, ...changes.settings.newValue };
    });

    // ── Show / hide helpers ──────────────────────────────────────────────────
    function hide()  { btn.style.display = 'none'; }

    function show(rect) {
      const m = 8;
      const left = Math.min(rect.right + m, window.innerWidth  - 50);
      const top  = Math.min(rect.bottom + m, window.innerHeight - 50);
      btn.style.left    = `${Math.max(m, left - 40)}px`;
      btn.style.top     = `${Math.max(m, top - 40)}px`;
      btn.style.display = 'flex';
    }

    function getSelectionInfo() {
      const sel  = window.getSelection();
      if (!sel || sel.rangeCount === 0) return null;
      const text = sel.toString().trim();
      if (text.length < 4) return null;
      const range = sel.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) return null;
      return { text, rect };
    }

    function refresh() {
      if (!cachedSettings.floatingEnabled) { selection = ''; hide(); return; }
      const info = getSelectionInfo();
      if (!info) { selection = ''; hide(); return; }
      selection = info.text;
      show(info.rect);
    }

    // ── Events ──────────────────────────────────────────────────────────────
    document.addEventListener('selectionchange', () => {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(refresh, 50);
    });
    document.addEventListener('scroll', () => hide(), true);
    window.addEventListener('resize',  () => hide());

    btn.addEventListener('mousedown', e => e.stopPropagation());
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!cachedSettings.floatingEnabled || !selection) return;
      const action = cachedPrompts[cachedSettings.floatingActionId] || cachedPrompts.summarize;
      const query  = encodeURIComponent(action.text + selection);
      window.open(`https://gemini.google.com/app?q=${query}&autosubmit=true`, '_blank');
    });
  }
}

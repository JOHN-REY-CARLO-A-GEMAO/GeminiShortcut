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
// Popup UI – runs in the extension popup context
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const list            = document.getElementById('promptList');
  const nameInput       = document.getElementById('promptName');
  const textInput       = document.getElementById('promptText');
  const addButton       = document.getElementById('addPrompt');
  const floatingEnabled = document.getElementById('floatingEnabled');
  const floatingAction  = document.getElementById('floatingAction');
  const resetDefaults   = document.getElementById('resetDefaults');

  // ── Load stored prompts & settings, seed defaults on first run ────────────
  chrome.storage.sync.get(['prompts', 'settings'], (result) => {
    const prompts  = result.prompts  || { ...DEFAULT_PROMPTS };
    const settings = result.settings || { ...DEFAULT_SETTINGS };

    if (!result.prompts)  chrome.storage.sync.set({ prompts });
    if (!result.settings) chrome.storage.sync.set({ settings });

    renderList(prompts);
    renderSettings(prompts, settings);
  });

  // ── Add new prompt ─────────────────────────────────────────────────────────
  addButton.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) {
      alert("Please enter both a Name and a Prompt!");
      return;
    }

    chrome.storage.sync.get(['prompts', 'settings'], (result) => {
      const prompts  = result.prompts  || { ...DEFAULT_PROMPTS };
      const settings = result.settings || { ...DEFAULT_SETTINGS };

      // Warn on duplicate name
      const duplicateByName = Object.values(prompts).some(p => p.name === name);
      if (duplicateByName && !confirm(`A prompt named "${name}" already exists. Add another?`)) return;

      const id = makeId(name, prompts);
      prompts[id] = { name, text };

      chrome.storage.sync.set({ prompts }, () => {
        nameInput.value = '';
        textInput.value = '';
        renderList(prompts);
        renderSettings(prompts, settings);
      });
    });
  });

  // ── Toggle floating button ────────────────────────────────────────────────
  floatingEnabled.addEventListener('change', () => {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = { ...DEFAULT_SETTINGS, ...result.settings };
      settings.floatingEnabled = floatingEnabled.checked;
      chrome.storage.sync.set({ settings });
    });
  });

  // ── Change floating button action ──────────────────────────────────────────
  floatingAction.addEventListener('change', () => {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = { ...DEFAULT_SETTINGS, ...result.settings };
      settings.floatingActionId = floatingAction.value;
      chrome.storage.sync.set({ settings });
    });
  });

  // ── Reset to defaults ──────────────────────────────────────────────────────
  resetDefaults.addEventListener('click', () => {
    if (!confirm("Reset prompts and settings to defaults?")) return;
    chrome.storage.sync.set({
      prompts:  { ...DEFAULT_PROMPTS },
      settings: { ...DEFAULT_SETTINGS }
    }, () => {
      renderList(DEFAULT_PROMPTS);
      renderSettings(DEFAULT_PROMPTS, DEFAULT_SETTINGS);
    });
  });

  // ── Render prompt list ────────────────────────────────────────────────────
  function renderList(prompts) {
    list.innerHTML = '';

    if (Object.keys(prompts).length === 0) {
      list.innerHTML = '<li style="text-align:center;color:#999;">No prompts yet. Add one above!</li>';
      return;
    }

    for (const [id, data] of Object.entries(prompts)) {
      const li   = document.createElement('li');
      const info = Object.assign(document.createElement('div'), { className: 'prompt-info' });

      Object.assign(document.createElement('span'), { className: 'prompt-name',   textContent: data.name });
      Object.assign(document.createElement('span'), { className: 'prompt-detail', textContent: data.text });

      info.appendChild(Object.assign(document.createElement('span'), { className: 'prompt-name',   textContent: data.name }));
      info.appendChild(Object.assign(document.createElement('span'), { className: 'prompt-detail', textContent: data.text }));

      const delBtn = Object.assign(document.createElement('button'), {
        className: 'delete-btn', innerHTML: '&times;', title: 'Remove'
      });
      delBtn.addEventListener('click', () => removePrompt(id));

      li.appendChild(info);
      li.appendChild(delBtn);
      list.appendChild(li);
    }
  }

  // ── Render settings controls ───────────────────────────────────────────────
  function renderSettings(prompts, settings) {
    floatingEnabled.checked = !!settings.floatingEnabled;
    floatingAction.innerHTML = '';

    const entries = Object.entries(prompts);
    for (const [id, data] of entries) {
      floatingAction.appendChild(Object.assign(document.createElement('option'), { value: id, textContent: data.name }));
    }

    // Fallback if stored actionId no longer exists
    if (!prompts[settings.floatingActionId] && entries.length > 0) {
      settings.floatingActionId = entries[0][0];
      chrome.storage.sync.set({ settings });
    }
    floatingAction.value = settings.floatingActionId || '';
  }

  // ── Build a URL-safe unique id from a name ─────────────────────────────────
  function makeId(name, existing) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'prompt';
    if (!existing[base]) return base;
    let id = `${base}-2`, n = 2;
    while (existing[id]) id = `${base}-${++n}`;
    return id;
  }

  // ── Delete a prompt ────────────────────────────────────────────────────────
  function removePrompt(id) {
    chrome.storage.sync.get(['prompts', 'settings'], (result) => {
      const prompts  = result.prompts  || {};
      const settings = { ...DEFAULT_SETTINGS, ...result.settings };
      delete prompts[id];

      if (settings.floatingActionId === id) {
        settings.floatingActionId = Object.keys(prompts)[0] || DEFAULT_SETTINGS.floatingActionId;
      }

      chrome.storage.sync.set({ prompts, settings }, () => {
        renderList(prompts);
        renderSettings(prompts, settings);
      });
    });
  }
});

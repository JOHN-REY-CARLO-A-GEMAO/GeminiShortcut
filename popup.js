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

const GEMINI_URLS = [
  "https://gemini.google.com/app?q={q}&autosubmit=true",
  "https://gemini.google.com/app?q={q}",
  "https://gemini.google.com/?q={q}"
];

function buildGeminiUrl(prompt) {
  for (const template of GEMINI_URLS) {
    const url = template.replace("{q}", prompt);
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "gemini.google.com") return url;
    } catch { /* skip */ }
  }
  return null;
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
}
function storageSet(items) {
  return new Promise(resolve => chrome.storage.sync.set(items, resolve));
}

// ============================================================
// Popup UI
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const list            = document.getElementById('promptList');
  const nameInput       = document.getElementById('promptName');
  const textInput       = document.getElementById('promptText');
  const addButton       = document.getElementById('addPrompt');
  const floatingEnabled = document.getElementById('floatingEnabled');
  const floatingAction  = document.getElementById('floatingAction');
  const resetDefaults   = document.getElementById('resetDefaults');

  // ── Load ───────────────────────────────────────────────────────────────────
  const { prompts, settings } = await storageGet(['prompts', 'settings']);
  const activePrompts  = prompts  || { ...DEFAULT_PROMPTS };
  const activeSettings = settings || { ...DEFAULT_SETTINGS };

  if (!prompts)  await storageSet({ prompts:  { ...DEFAULT_PROMPTS } });
  if (!settings) await storageSet({ settings: { ...DEFAULT_SETTINGS } });

  renderList(activePrompts);
  renderSettings(activePrompts, activeSettings);

  // ── Add new prompt ─────────────────────────────────────────────────────────
  addButton.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) {
      alert("Please enter both a Name and a Prompt!");
      return;
    }

    const { prompts: currentPrompts, settings: currentSettings } = await storageGet(['prompts', 'settings']);
    const current = currentPrompts || { ...DEFAULT_PROMPTS };

    const duplicateByName = Object.values(current).some(p => p.name === name);
    if (duplicateByName && !confirm(`A prompt named "${name}" already exists. Add another?`)) return;

    const id = makeId(name, current);
    current[id] = { name, text };

    await storageSet({ prompts: current });

    nameInput.value = '';
    textInput.value = '';
    renderList(current);
    renderSettings(current, currentSettings || DEFAULT_SETTINGS);
  });

  // ── Toggle floating button ─────────────────────────────────────────────────
  floatingEnabled.addEventListener('change', async () => {
    const { settings: s } = await storageGet(['settings']);
    const settings = { ...DEFAULT_SETTINGS, ...s };
    settings.floatingEnabled = floatingEnabled.checked;
    await storageSet({ settings });
  });

  // ── Change floating action ─────────────────────────────────────────────────
  floatingAction.addEventListener('change', async () => {
    const { settings: s } = await storageGet(['settings']);
    const settings = { ...DEFAULT_SETTINGS, ...s };
    settings.floatingActionId = floatingAction.value;
    await storageSet({ settings });
  });

  // ── Reset to defaults ─────────────────────────────────────────────────────
  resetDefaults.addEventListener('click', async () => {
    if (!confirm("Reset prompts and settings to defaults?")) return;
    await storageSet({
      prompts:  { ...DEFAULT_PROMPTS },
      settings: { ...DEFAULT_SETTINGS }
    });
    renderList(DEFAULT_PROMPTS);
    renderSettings(DEFAULT_PROMPTS, DEFAULT_SETTINGS);
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  function renderList(prompts) {
    list.innerHTML = '';

    if (Object.keys(prompts).length === 0) {
      list.innerHTML = '<li style="text-align:center;color:#999;">No prompts yet. Add one above!</li>';
      return;
    }

    for (const [id, data] of Object.entries(prompts)) {
      const li   = document.createElement('li');
      const info = Object.assign(document.createElement('div'), { className: 'prompt-info' });

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

  function renderSettings(prompts, settings) {
    floatingEnabled.checked = !!settings.floatingEnabled;
    floatingAction.innerHTML = '';

    const entries = Object.entries(prompts);
    for (const [id, data] of entries) {
      floatingAction.appendChild(Object.assign(document.createElement('option'), { value: id, textContent: data.name }));
    }

    if (!prompts[settings.floatingActionId] && entries.length > 0) {
      settings.floatingActionId = entries[0][0];
      storageSet({ settings });
    }
    floatingAction.value = settings.floatingActionId || '';
  }

  function makeId(name, existing) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'prompt';
    if (!existing[base]) return base;
    let id = `${base}-2`, n = 2;
    while (existing[id]) id = `${base}-${++n}`;
    return id;
  }

  async function removePrompt(id) {
    const { prompts: p, settings: s } = await storageGet(['prompts', 'settings']);
    const prompts  = p || {};
    const settings = { ...DEFAULT_SETTINGS, ...s };
    delete prompts[id];

    if (settings.floatingActionId === id) {
      settings.floatingActionId = Object.keys(prompts)[0] || DEFAULT_SETTINGS.floatingActionId;
    }

    await storageSet({ prompts, settings });
    renderList(prompts);
    renderSettings(prompts, settings);
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('promptList');
    const nameInput = document.getElementById('promptName');
    const textInput = document.getElementById('promptText');
    const addButton = document.getElementById('addPrompt');
    const floatingEnabled = document.getElementById('floatingEnabled');
    const floatingAction = document.getElementById('floatingAction');
    const resetDefaults = document.getElementById('resetDefaults');

    const defaultPrompts = {
        summarize: { name: "Summarize (3 bullets)", text: "Provide a concise 3-bullet summary of this: " },
        explain: { name: "Explain Simply (ELI5)", text: "Explain this in simple terms for a student: " },
        notes: { name: "Make Study Notes", text: "Turn this into clean study notes with headings and bullet points: " },
        quiz: { name: "Quiz Me", text: "Create 5 quiz questions (with answers) based on this: " },
        rewrite: { name: "Rewrite Clearly", text: "Rewrite this to be clear and well-structured for studying: " }
    };

    const defaultSettings = {
        floatingEnabled: true,
        floatingActionId: "summarize"
    };

    // Load initial list
    chrome.storage.sync.get(['prompts', 'settings'], (result) => {
        const prompts = result.prompts || defaultPrompts;
        const settings = result.settings || defaultSettings;

        // Ensure defaults are saved if missing
        if (!result.prompts || !result.settings) {
            chrome.storage.sync.set({
                prompts: prompts,
                settings: settings
            });
        }

        renderList(prompts);
        renderSettings(prompts, settings);
    });

    addButton.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const text = textInput.value.trim();

        if (!name || !text) {
            alert("Please enter both a Name and a Prompt!");
            return;
        }

        chrome.storage.sync.get(['prompts', 'settings'], (result) => {
            const prompts = result.prompts || {};
            const settings = result.settings || defaultSettings;
            const id = createUniqueId(name, prompts);

            // Check for duplicate name (optional, simple check)
            const duplicateByName = Object.values(prompts).some(p => p.name === name);
            if (duplicateByName) {
                if (!confirm(`A prompt named "${name}" already exists. Add another?`)) return;
            }

            prompts[id] = { name: name, text: text };

            chrome.storage.sync.set({ prompts: prompts }, () => {
                nameInput.value = '';
                textInput.value = '';
                renderList(prompts);
                renderSettings(prompts, settings);
                
                // Notify background script (optional if background listens to storage.onChanged)
                // chrome.runtime.sendMessage({ action: "updateMenus" }); 
            });
        });
    });

    floatingEnabled.addEventListener('change', () => {
        chrome.storage.sync.get(['settings'], (result) => {
            const settings = result.settings || defaultSettings;
            settings.floatingEnabled = floatingEnabled.checked;
            chrome.storage.sync.set({ settings: settings });
        });
    });

    floatingAction.addEventListener('change', () => {
        chrome.storage.sync.get(['settings'], (result) => {
            const settings = result.settings || defaultSettings;
            settings.floatingActionId = floatingAction.value;
            chrome.storage.sync.set({ settings: settings });
        });
    });

    resetDefaults.addEventListener('click', () => {
        if (!confirm("Reset prompts and settings to student defaults?")) return;
        chrome.storage.sync.set({
            prompts: defaultPrompts,
            settings: defaultSettings
        }, () => {
            renderList(defaultPrompts);
            renderSettings(defaultPrompts, defaultSettings);
        });
    });

    function renderList(prompts) {
        list.innerHTML = '';
        if (Object.keys(prompts).length === 0) {
            list.innerHTML = '<li style="text-align:center; color:#999;">No custom prompts yet. Add one!</li>';
            return;
        }

        for (const [id, promptData] of Object.entries(prompts)) {
            const li = document.createElement('li');
            
            const info = document.createElement('div');
            info.className = 'prompt-info';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'prompt-name';
            nameSpan.textContent = promptData.name; // Use stored name directly
            
            const detailSpan = document.createElement('span');
            detailSpan.className = 'prompt-detail';
            detailSpan.textContent = promptData.text; // Use stored text directly

            info.appendChild(nameSpan);
            info.appendChild(detailSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remove';
            deleteBtn.onclick = () => removePrompt(id);

            li.appendChild(info);
            li.appendChild(deleteBtn);
            list.appendChild(li);
        }
    }

    function createUniqueId(name, prompts) {
        const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'prompt';
        let id = base;
        let counter = 2;
        while (prompts[id]) {
            id = `${base}-${counter}`;
            counter += 1;
        }
        return id;
    }

    function renderSettings(prompts, settings) {
        floatingEnabled.checked = !!settings.floatingEnabled;
        const options = Object.entries(prompts);
        floatingAction.innerHTML = '';

        for (const [id, promptData] of options) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = promptData.name;
            floatingAction.appendChild(option);
        }

        if (!prompts[settings.floatingActionId] && options.length > 0) {
            settings.floatingActionId = options[0][0];
            chrome.storage.sync.set({ settings: settings });
        }
        floatingAction.value = settings.floatingActionId;
    }

    function removePrompt(id) {
        chrome.storage.sync.get(['prompts', 'settings'], (result) => {
            const prompts = result.prompts || {};
            const settings = result.settings || defaultSettings;
            delete prompts[id];
            if (settings.floatingActionId === id) {
                settings.floatingActionId = Object.keys(prompts)[0] || defaultSettings.floatingActionId;
            }
            chrome.storage.sync.set({ prompts: prompts, settings: settings }, () => {
                renderList(prompts);
                renderSettings(prompts, settings);
            });
        });
    }
});

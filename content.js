console.log("Gemini Shortcut: Content script loaded on " + window.location.hostname);

// --- PART 1: GEMINI-ONLY LOGIC ---
if (window.location.hostname === "gemini.google.com") {
    const urlParams = new URLSearchParams(window.location.search);
    const promptText = urlParams.get('q');
    const shouldSubmit = urlParams.get('autosubmit') === 'true';

    if (promptText) {
        const interval = setInterval(() => {
            const inputBox = document.querySelector('div[contenteditable="true"], textarea');
            if (inputBox) {
                clearInterval(interval);
                inputBox.focus();
                const decoded = decodeURIComponent(promptText);
                if (inputBox.tagName.toLowerCase() === 'textarea') {
                    inputBox.value = decoded;
                    inputBox.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                    inputBox.textContent = decoded;
                    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
                }
                if (shouldSubmit) {
                    setTimeout(() => {
                        const sendButton = document.querySelector('button[aria-label="Send message"]');
                        if (sendButton) sendButton.click();
                    }, 600);
                }
            }
        }, 500);
    }
}

// --- PART 2: THE FLOATING BUTTON (With Shadow DOM) ---
else {
    // Ensure we don't inject twice and that body exists
    if (document.body && !document.getElementById('gemini-extension-host')) {
        const host = document.createElement('div');
        host.id = 'gemini-extension-host';
        host.style.all = 'initial'; // Reset inherited styles
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' }); // 'open' makes debugging easier

        const floatingButton = document.createElement('div');
        floatingButton.id = 'gemini-floating-button';
        floatingButton.innerText = 'G';

        const style = document.createElement('style');
        style.textContent = `
            #gemini-floating-button {
                position: fixed;
                width: 40px; height: 40px;
                background: #4285f4; color: white;
                border-radius: 50%; display: none;
                align-items: center; justify-content: center;
                cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                z-index: 2147483647; font-family: sans-serif;
                font-weight: bold; border: 2px solid white;
                user-select: none;
            }
            #gemini-floating-button:hover { background: #3367d6; transform: scale(1.05); }
        `;

        shadow.appendChild(style);
        shadow.appendChild(floatingButton);

        const MIN_SELECTION_LEN = 4;
        let currentSelection = '';
        let hideTimer = null;
        let cachedPrompts = {};
        let cachedSettings = { floatingEnabled: true, floatingActionId: 'summarize' };

        function loadConfig() {
            chrome.storage.sync.get(['prompts', 'settings'], (result) => {
                cachedPrompts = result.prompts || cachedPrompts;
                cachedSettings = result.settings || cachedSettings;
            });
        }

        loadConfig();
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace !== 'sync') return;
            if (changes.prompts) cachedPrompts = changes.prompts.newValue || {};
            if (changes.settings) cachedSettings = changes.settings.newValue || cachedSettings;
        });

        function hideButton() {
            floatingButton.style.display = 'none';
        }

        function showButton(rect) {
            const margin = 8;
            const left = Math.min(rect.right + margin, window.innerWidth - 50);
            const top = Math.min(rect.bottom + margin, window.innerHeight - 50);
            floatingButton.style.left = `${Math.max(8, left)}px`;
            floatingButton.style.top = `${Math.max(8, top)}px`;
            floatingButton.style.display = 'flex';
        }

        function getSelectionInfo() {
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return null;
            const text = selection.toString().trim();
            if (text.length < MIN_SELECTION_LEN) return null;
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (!rect || (rect.width === 0 && rect.height === 0)) return null;
            return { text, rect };
        }

        function updateFromSelection() {
            if (!cachedSettings.floatingEnabled) {
                currentSelection = '';
                hideButton();
                return;
            }
            const info = getSelectionInfo();
            if (!info) {
                currentSelection = '';
                hideButton();
                return;
            }
            currentSelection = info.text;
            showButton(info.rect);
        }

        document.addEventListener('selectionchange', () => {
            if (hideTimer) clearTimeout(hideTimer);
            hideTimer = setTimeout(updateFromSelection, 50);
        });

        document.addEventListener('scroll', () => hideButton(), true);
        window.addEventListener('resize', () => hideButton());

        floatingButton.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });

        floatingButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!cachedSettings.floatingEnabled) return;
            if (currentSelection) {
                const actionId = cachedSettings.floatingActionId;
                const action = cachedPrompts[actionId] || { text: "Summarize this: " };
                const prompt = `${action.text}${currentSelection}`;
                const url = `https://gemini.google.com/app?q=${encodeURIComponent(prompt)}&autosubmit=true`;
                window.open(url, '_blank');
            }
        });
    } // Closing the if check
} // Closing the else block

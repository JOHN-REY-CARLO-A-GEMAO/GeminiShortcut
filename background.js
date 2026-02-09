// Default prompts configuration
const defaultPrompts = {
  "summarize": { name: "Summarize (3 bullets)", text: "Provide a concise 3-bullet summary of this: " },
  "explain": { name: "Explain Simply (ELI5)", text: "Explain this in simple terms for a student: " },
  "notes": { name: "Make Study Notes", text: "Turn this into clean study notes with headings and bullet points: " },
  "quiz": { name: "Quiz Me", text: "Create 5 quiz questions (with answers) based on this: " },
  "rewrite": { name: "Rewrite Clearly", text: "Rewrite this to be clear and well-structured for studying: " }
};

const defaultSettings = {
  floatingEnabled: true,
  floatingActionId: "summarize"
};

// Function to rebuild context menus
function updateContextMenus() {
  chrome.storage.sync.get(['prompts'], (result) => {
    const prompts = result.prompts || defaultPrompts;

    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "geminiMaster",
        title: "Gemini Power Actions",
        contexts: ["selection"]
      });

      for (const [id, data] of Object.entries(prompts)) {
        chrome.contextMenus.create({
          id: id,
          parentId: "geminiMaster",
          title: data.name,
          contexts: ["selection"]
        });
      }
    });
  });
}

// On Install: Initialize defaults if needed, then build menus
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gemini Shortcut: Extension background service worker active.");

  chrome.storage.sync.get(['prompts', 'settings'], (result) => {
    const updates = {};

    if (!result.prompts) {
      updates.prompts = defaultPrompts;
    }
    if (!result.settings) {
      updates.settings = defaultSettings;
    }

    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates, () => {
        updateContextMenus();
      });
    } else {
      updateContextMenus();
    }
  });
});

// Rebuild menus on browser startup in case the service worker was unloaded
chrome.runtime.onStartup.addListener(() => {
  updateContextMenus();
});

// Listen for storage changes (e.g. from Popup) to update menus live
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.prompts) {
    updateContextMenus();
  }
});

// Handle Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.storage.sync.get(['prompts'], (result) => {
    const prompts = result.prompts || defaultPrompts;
    const action = prompts[info.menuItemId];

    if (action) {
      const selectedText = encodeURIComponent(info.selectionText);
      const prompt = encodeURIComponent(action.text);
      const url = `https://gemini.google.com/app?q=${prompt}${selectedText}&autosubmit=true`;
      
      chrome.tabs.create({ url: url });
    }
  });
});

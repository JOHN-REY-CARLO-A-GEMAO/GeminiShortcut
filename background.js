// Default prompts configuration
const defaultPrompts = {
  "summarize": { name: "Summarize this (TL;DR)", text: "Provide a concise 3-bullet point summary of this: " },
  "debug": { name: "Debug / Explain Code", text: "Act as an expert developer. Explain how this code works and find any bugs: " },
  "rewrite": { name: "Make this Professional", text: "Rewrite this text to be professional, clear, and polite: " }
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
  
  chrome.storage.sync.get(['prompts'], (result) => {
    if (!result.prompts) {
      chrome.storage.sync.set({ prompts: defaultPrompts }, () => {
        updateContextMenus();
      });
    } else {
      updateContextMenus();
    }
  });
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
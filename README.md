# Gemini Shortcut

> Right-click any text → summarize, explain, quiz, or rewrite it with Gemini — in one click or one keystroke.

![Extension icon](icons/icon128.png)

## Features

### 🎯 Right-Click Actions
Highlight any text on any webpage, right-click, and pick a Gemini action:
- **Summarize** — 3-bullet summary
- **Explain Simply** — ELI5-style explanation
- **Make Study Notes** — headings + bullet points
- **Quiz Me** — 5 questions with answers
- **Rewrite Clearly** — clear, well-structured text

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+Shift+1` | Summarize |
| `Ctrl+Shift+2` | Explain Simply |
| `Ctrl+Shift+3` | Make Study Notes |
| `Ctrl+Shift+4` | Quiz Me |
| `Ctrl+Shift+5` | Rewrite Clearly |

_(Mac: replace `Ctrl` with `Command`)_

If you're already on [gemini.google.com](https://gemini.google.com), the shortcut injects the prompt directly. Otherwise it opens a new tab.

### 🛟 Floating Button
On text selection, a floating **G** button appears near your cursor. Tap it for a one-click Gemini query — no right-click needed.

Toggle it on/off and choose which action it triggers in Settings.

### ⚙️ Custom Prompts
The popup lets you add, edit, and remove prompts. Defaults are student-focused but completely customizable.

## Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/JOHN-REY-CARLO-A-GEMAO/GeminiShortcut.git
   ```
2. Open **Chrome** → `chrome://extensions`
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked** → select the repo folder
5. Pin the extension for easy access

## Project Structure

```
GeminiShortcut/
├── manifest.json        # Extension config (MV3)
├── constants.js         # Shared defaults + storage helpers
├── background.js        # Service worker (context menus, shortcuts, badge)
├── content.js           # Injected into all pages (floating button + Gemini site)
├── popup.html/js/css    # Extension settings UI
├── icons/              # Extension icons (16, 32, 48, 128 px)
└── README.md
```

## Configuration

Open the extension popup to:
- Enable/disable the floating button
- Choose which prompt the floating button triggers
- Add your own custom prompts
- Reset to default prompts

## Privacy

Your selected text is sent to Google's Gemini only when you explicitly invoke an action. No data is collected or stored anywhere else.

## Contributing

Contributions are welcome! Feel free to open issues or pull requests.

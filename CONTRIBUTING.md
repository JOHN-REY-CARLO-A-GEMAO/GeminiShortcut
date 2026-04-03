# Contributing to Gemini Shortcut

Thank you for your interest in contributing! This document covers everything you need to know to get started.

## 🛠 Development Setup

```bash
# Clone the repo
git clone https://github.com/JOHN-REY-CARLO-A-GEMAO/GeminiShortcut.git
cd GeminiShortcut

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the repo folder
5. On the extension card, click **Service Worker** refresh icon after each edit to pick up background.js changes
6. For content.js changes, reload the target page

## 📁 Project Structure

| File | Role |
|---|---|
| `manifest.json` | Extension config — permissions, icons, keyboard shortcuts |
| `constants.js` | Shared defaults + URL helpers + storage utilities (single source of truth) |
| `background.js` | Service worker — context menus, shortcut handler, badge, storage sync |
| `content.js` | Injected into every page — floating button + Gemini site auto-submit |
| `popup.html/js/css` | Extension settings UI |

## ✏️ Coding Style

- **No external dependencies** — pure browser APIs only (Chrome MV3).
- **No ES module syntax** in files loaded by the extension — Chrome's MV3 service worker and content scripts do not support bare `import`/`export`. Shared code is inlined via `constants.js`.
- **async/await** with the `storageGet`/`storageSet` helpers for all `chrome.storage` calls.
- **Meaningful names** — `buildGeminiUrl()` over `makeURL()`; `updateContextMenus()` over `updateMenu()`.
- **One logical change per commit** — don't mix refactors with new features.

## 🧪 Testing

- Test right-click menu on any site.
- Test floating button on at least one non-Google site.
- Test keyboard shortcuts on both `gemini.google.com` and a non-Google page.
- Verify the extension badge shows the correct prompt count.
- Run `chrome://extensions` → **Service Worker** → **inspect** to check for console errors.

## 🐛 Reporting Bugs

Open an issue with:
1. Chrome version and OS
2. Steps to reproduce
3. Expected vs actual behaviour
4. Any console errors (Service Worker inspector is your friend)

## 🔧 Submitting Changes

1. Fork the repo and create a branch from `main`.
2. Make your changes — follow the coding style above.
3. Write a clear, concise commit message (use the imperative mood, e.g. `add:`, `fix:`, `refactor:`).
4. Open a Pull Request against `main`.
5. Describe *what* changed and *why*.

## 📋 Checklist Before PR

- [ ] Extension loads without errors in Chrome
- [ ] All keyboard shortcuts work on both Gemini and non-Gemini pages
- [ ] Context menus update when prompts are changed in the popup
- [ ] Badge reflects correct prompt count
- [ ] No `console.error` or unhandled Promise rejections
- [ ] README / CHANGELOG updated if applicable

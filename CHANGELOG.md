# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] – 2026-04-03

### Added
- **Keyboard shortcuts** — `Ctrl+Shift+1` through `Ctrl+Shift+5` trigger each prompt action. On Gemini site, injects directly; elsewhere opens a new tab.
- **Extension badge** — toolbar icon now shows prompt count (e.g. "5").
- **Multiple Gemini URL strategies** — tries three URL patterns in order; falls back gracefully if Google's UI changes.
- **`INJECT_PROMPT` message** — content script listens so keyboard shortcuts work on `gemini.google.com` itself.
- **Promisified storage helpers** — `storageGet()` / `storageSet()` wrappers for consistent async/await.
- **Real README** — replaced publishing guide with actual project documentation.

### Changed
- Extension renamed from "Quick Gemini Pro" to **Gemini Shortcut** (matching repo name).
- All scripts refactored to share a single `constants.js` (inlined at build time) — no more duplicated defaults.
- `chrome.contextMenus.removeAll()` now properly awaited via Promise wrapper.
- Popup UI converted to async/await throughout.
- `CONTRIBUTING.md` rewritten with real contribution guidelines.

### Fixed
- Race condition in context menu rebuild (async `removeAll` not awaited).
- Floating button now has `role="button"` and `aria-label` for accessibility.
- Active-state CSS on floating button.

---

## [2.0.0] – 2026-04-03

### Added
- Student-focused default prompts: Summarize, Explain Simply, Make Study Notes, Quiz Me, Rewrite Clearly.
- Right-click context menu with all default prompts.
- Floating "G" button on text selection (Shadow DOM, all other sites).
- Auto-submit flow for Gemini when opened via extension.
- Extension popup for managing prompts and settings.
- `manifest_version: 3` (Chrome MV3 extension).

### Known Issues (pre-2.1)
- Defaults duplicated in each script file.
- No keyboard shortcuts.
- No extension badge.
- README was a Chrome Web Store publishing guide.

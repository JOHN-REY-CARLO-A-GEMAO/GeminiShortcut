# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quick Gemini Pro is a Chrome browser extension (Manifest V3) that sends selected text to Google Gemini with customizable prompts via right-click context menus and a floating button.

## Development Commands

**Loading the extension in Chrome for development:**
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked** and select this repository folder
4. After making changes, click **Refresh** on the extension card

No build step, npm, or bundler required — this is pure vanilla JS/HTML/CSS.

## Architecture

### Extension Flow
```
User selects text
       ↓
Right-click → "Gemini Power Actions" context menu  (background.js)
       OR
Click floating "G" button                           (content.js)
       ↓
URL: https://gemini.google.com/app?q={prompt}{text}&autosubmit=true
       ↓
content.js on Gemini site auto-fills input and submits
```

### Key Files
- **background.js** — Service worker that creates context menus and handles menu clicks. Opens Gemini tab with encoded prompt + selected text.
- **content.js** — Runs on every page. Two modes:
  1. On `gemini.google.com`: Detects URL params, auto-fills input, optionally auto-submits
  2. On other sites: Injects floating "G" button via Shadow DOM (isolated from host page CSS)
- **popup.html/js** — Settings UI for managing prompts (add/delete/export/import) and floating button toggle
- **manifest.json** — Extension config with CSP policy and permissions

### Data Storage
All prompts and settings stored in `chrome.storage.sync` (synced across Chrome instances).

### Important Constants (in content.js)
- `MIN_SELECTION_LEN = 4` — Minimum text selection length to show floating button
- `POLL_INTERVAL_MS = 500` — Polling interval for Gemini input box detection
- `FLOATING_Z_INDEX = 2147483647` — Max z-index ensures button is always on top
- `BUTTON_SIZE_PX = 40` — Floating button diameter

### Shadow DOM Isolation
The floating button uses Shadow DOM (`host.attachShadow({ mode: 'open' })`) to prevent host page CSS from affecting it. Styles are injected via a `<style>` element inside the shadow root.

### Gemini URL Handling
When opening Gemini, text is appended directly to the URL query param. Always use `encodeURIComponent()` on both the prompt template and selected text. The `autosubmit=true` param triggers auto-submission after a 600ms delay.

# Entrypoint map — cpdown v1.7

> Generated during Phase A inspection. No source files were modified.

## Entrypoint table

| Role | Old file | Responsibility | Dependencies | New module/entry | Status |
|---|---|---|---|---|---|
| Service worker entry | `background-wrapper.js` | 1-line wrapper: `importScripts("background.js", "background-xcom.js")` — composes the two background scripts into one service worker | `background.js`, `background-xcom.js` | `entrypoints/background.ts` | Not started |
| Toolbar + YouTube background | `background.js` | Minified bundle (~38 KB, single line). Toolbar icon click → copies page as markdown. YouTube hidden-tab flow (creates background tab, injects `yt-transcript.js`, relays transcript result). Context menu "Copy subtitles" for YouTube links. Sonner toast notifications via `showToast()`. URL validation (`Rt()`). `OPEN_CONFETTI` message handler. Global browser/chrome compat layer. | `chrome.action`, `chrome.commands`, `chrome.contextMenus`, `chrome.runtime`, `chrome.scripting`, `chrome.tabs`; bundled React 19.2, Sonner, Readability, Defuddle; content scripts: `content-scripts/content.js`, `content-scripts/save-selection.js`, `content-scripts/yt-transcript.js`, `content-scripts/toast-overlay.js` | `entrypoints/background.ts` (split into modules) | Not started |
| X.com background | `background-xcom.js` | Context menu "Copy X.com Markdown" (`cpdown-xcom-markdown`). Registers on `onInstalled`/`onStartup`. On click: injects DOM-to-Markdown converter into X.com/Twitter pages via `chrome.scripting.executeScript`. Filters UI chrome lines, detects/rebuilds code blocks, copies to clipboard, shows in-page toast. | `chrome.contextMenus`, `chrome.runtime`, `chrome.scripting`; DOM APIs (document, navigator.clipboard, window.matchMedia) | `entrypoints/background.ts` → `lib/xcom.ts` or `background/xcom.ts` | Not started |
| Page content script | `content-scripts/content.js` | Minified bundle (~2.7 MB, single line). Readability parser, Defuddle parser (with extractors for Grok, Twitter, ChatGPT, Claude, Perplexity, etc.), Sonner toast. Listens for `COPY_TEXT` message from background, extracts article content as markdown, shows toast with Save/Copy buttons. Also handles main-world script injection (`IL()` helper). | `chrome.runtime` (onMessage, getURL, getManifest); bundled React 19.2, Sonner, Readability, Defuddle; DOM APIs | `content-scripts/content.ts` (or split into focused content scripts) | Not started |
| Selection save | `content-scripts/save-selection.js` | Guard against double-injection (`__cpdownSaveSelectionLoaded`). HTML-to-Markdown converter (`nodeToMarkdown`). Saves selection as `.md` file via File System Access API (`showSaveFilePicker`) or blob download fallback. Adds a "Sel" button to existing Sonner toasts on the page. Listens for `CPDOWN_SELECTION_READY` message from background. | `chrome.runtime` (onMessage); DOM APIs (document, window.showSaveFilePicker, URL.createObjectURL, navigator.clipboard); File System Access API | `content-scripts/save-selection.ts` | Not started |
| Transcript overlay | `content-scripts/toast-overlay.js` | Guard against double-injection (`__cpdownToastInjected`). Builds a standalone DOM toast mimicking Sonner's exact `data-sonner-toast` structure (not using React). Shows "Transcript ready" with title + token count. Provides Copy and Save .md buttons. Auto-dismiss after 15 s. Listens for `SHOW_TRANSCRIPT_TOAST` message from background. | `chrome.runtime` (onMessage); DOM APIs (document.createElement, navigator.clipboard, URL.createObjectURL) | `content-scripts/toast-overlay.ts` | Not started |
| YouTube transcript | `content-scripts/yt-transcript.js` | Extracts YouTube video transcript. Two-step player data fetch: (1) postMessage to window asking for `ytInitialPlayerResponse` from MAIN world, (2) if timeout, injects `youtube-main-world.js` and retries. Validates video ID matches current URL. Selects first caption track, fetches SRT format, strips timestamps/indices, formats as markdown. Sends `TRANSCRIPT_RESULT` to background. | `chrome.runtime` (sendMessage, getURL); `window.postMessage` bridge to MAIN world; DOM APIs (URL, document.createElement for script injection); Fetch API for SRT download | `content-scripts/yt-transcript.ts` | Not started |
| YouTube MAIN world | `youtube-main-world.js` | IIFE bundled via `@wxt-dev/module-webextension-polyfill` style. Runs in MAIN world (page context). Monkey-patches `XMLHttpRequest.prototype.open` to intercept `timedtext` API calls and capture the `pot` parameter. Listens for `GET_YT_INITIAL_PLAYER_RESPONSE` postMessage, responds with `ytInitialPlayerResponse` + captured `pot`. Toggles CC button if pot not yet captured. | `XMLHttpRequest.prototype.open` (monkey-patch); `window.addEventListener("message")`; `document.querySelector` for CC button; `window.postMessage` for relay | `entrypoints/youtube-main-world.ts` (WXT `main world` content script) | Not started |
| Options page shell | `options.html` | HTML shell for options page. Loads `options-theme.js` (sync), `chunks/options-ChfjUtXM.js` (module), `assets/options-C-cz_1xn.css`. Contains `<div id="root">` for React mount. `<meta name="manifest.type" content="browser_action">`. | `options-theme.js`, `chunks/options-ChfjUtXM.js`, `assets/options-C-cz_1xn.css` | `entrypoints/options.html` + `entrypoints/options.ts` | Not started |
| Options theme | `options-theme.js` | Detects `prefers-color-scheme: dark`, adds/removes `.dark` class on `document.body`. Listens for system theme changes. Runs before React app to prevent flash. | `window.matchMedia`, `document.body`, `document.addEventListener("DOMContentLoaded")` | `entrypoints/options.ts` (or inline in options HTML) | Not started |
| Options React app | `chunks/options-ChfjUtXM.js` | Vite/WXT-bundled React 19.2 app. Includes scheduler, react-dom, React components for extension settings UI. Built with Tailwind v4 (see CSS). Uses `chrome.storage` for persistence (inferred from extension settings pattern). | React 19.2, react-dom, scheduler; `chrome.storage`; Tailwind v4 CSS | `entrypoints/options.ts` (source, not the bundle) | Not started |
| Options CSS | `assets/options-C-cz_1xn.css` | Tailwind v4.1.17 compiled output (~30 KB). Defines CSS custom properties for light/dark themes (oklch color space). Utility classes for layout, typography, form controls. Dark mode via `.dark` class. | None (standalone CSS) | Tailwind v4 config + source CSS | Not started |
| Extension icons | `icon/128.png` | Extension icon (128×128) — Chrome Web Store listing, install dialog | None | `public/icon/128.png` | Not started |
| Extension icons | `icon/16.png` | Extension icon (16×16) — browser toolbar, favicon | None | `public/icon/16.png` | Not started |
| Extension icons | `icon/32.png` | Extension icon (32×32) — Windows taskbar, high-DPI toolbar | None | `public/icon/32.png` | Not started |
| Extension icons | `icon/48.png` | Extension icon (48×48) — extensions page | None | `public/icon/48.png` | Not started |
| Extension icons | `icon/96.png` | Extension icon (96×96) — Chrome Web Store | None | `public/icon/96.png` | Not started |

## Dependency graph (textual)

```
background-wrapper.js
├── background.js  (importScripts)
│   ├── bundled: React 19.2, Sonner, Readability, Defuddle
│   ├── chrome.action.onClicked  → toolbar click
│   ├── chrome.commands.onCommand → keyboard shortcut
│   ├── chrome.runtime.onMessage → TRANSCRIPT_RESULT, OPEN_CONFETTI
│   ├── chrome.scripting.executeScript → inject content scripts
│   ├── chrome.tabs.create → hidden YouTube tab
│   ├── chrome.contextMenus → "Copy subtitles" (YouTube links)
│   └── injects at runtime:
│       ├── content-scripts/content.js
│       ├── content-scripts/save-selection.js
│       ├── content-scripts/yt-transcript.js (YouTube only)
│       └── content-scripts/toast-overlay.js (YouTube only)
└── background-xcom.js  (importScripts)
    ├── chrome.contextMenus → "Copy X.com Markdown"
    └── chrome.scripting.executeScript → inline DOM-to-Markdown

content-scripts/content.js  (injected by manifest on *://*/*)
├── bundled: React 19.2, Sonner, Readability, Defuddle
│   └── Defuddle extractors: Grok, Twitter, ChatGPT, Claude, Perplexity, ...
├── chrome.runtime.onMessage → COPY_TEXT
└── IL() helper → injects youtube-main-world.js into MAIN world

content-scripts/save-selection.js  (injected by manifest on *://*/*)
└── chrome.runtime.onMessage → CPDOWN_SELECTION_READY

content-scripts/toast-overlay.js  (injected on demand by background.js)
└── chrome.runtime.onMessage → SHOW_TRANSCRIPT_TOAST

content-scripts/yt-transcript.js  (injected on demand by background.js)
├── window.postMessage bridge → youtube-main-world.js
└── chrome.runtime.sendMessage → TRANSCRIPT_RESULT

youtube-main-world.js  (web-accessible resource, MAIN world)
├── XMLHttpRequest.prototype.open monkey-patch
└── window.addEventListener("message")

options.html
├── options-theme.js  (<script>)
├── chunks/options-ChfjUtXM.js  (<script type="module">)
└── assets/options-C-cz_1xn.css  (<link>)
```

## Notable findings

1. **Massive bundles**: `background.js` (38 KB) and `content.js` (2.7 MB) are minified single-file bundles containing React, Sonner, Readability, and Defuddle. During WXT migration these should be split into proper importable modules.

2. **No source code in repo**: Only the minified bundles and hand-written scripts exist. There is no `src/`, no build tooling, no `package.json`. The bundles were likely produced externally.

3. **Three injection mechanisms**:
   - Manifest-declared: `content.js` + `save-selection.js` on `*://*/*`
   - On-demand by background: `toast-overlay.js`, `yt-transcript.js`, `save-selection.js` (re-injected if not already present)
   - Web-accessible resource: `youtube-main-world.js` loaded as `<script>` in page context

4. **Cross-script communication**:
   - `chrome.runtime.sendMessage` / `onMessage` (background ↔ content scripts)
   - `window.postMessage` bridge (content script ↔ MAIN world script on YouTube)
   - `chrome.tabs.sendMessage` (background → specific content script tab)

5. **Defuddle extractors** in `content.js` include site-specific parsers for: Grok, Twitter, ChatGPT, Claude, Perplexity, and others — these are bundled but may not all be used by cpdown's core flow.

6. **Duplicate DOM-to-Markdown code**: `background-xcom.js`, `save-selection.js`, and `content.js` each contain their own HTML-to-Markdown converters with different feature sets. These could be unified in the WXT migration.

7. **options-ChfjUtXM.js** already contains a WXT watermark (`@wxt-dev/module-webextension-polyfill` pattern), suggesting the options page may have been built with WXT previously or uses a WXT-compatible bundler pattern.

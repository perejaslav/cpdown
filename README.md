# cpdown

> 📄 Copy webpages, YouTube subtitles, and X.com content as clean, LLM-ready Markdown.

**cpdown** is a lightweight browser extension for saving useful web content without the noise: articles, selected text, YouTube transcripts, and visible X.com / Twitter posts, threads, or article-like pages.

---

## ✨ Features

- 🧭 **Toolbar button** — click the extension icon or press `Ctrl+Shift+T`
- 🎬 **YouTube subtitles** — copy the current video's transcript as Markdown
- 🖱️ **YouTube link right-click menu** — right-click a YouTube link → **Copy subtitles**
- ✕ **X.com / Twitter right-click menu** — right-click an X.com page → **Copy X.com Markdown**
- 🧼 **Readability / Defuddle** — extract clean article content from regular webpages
- 📋 **Copy to clipboard** — copy Markdown instantly
- 💾 **Save as `.md`** — download extracted content as a Markdown file where supported by the current flow
- 🔢 **Token count** — transcript toasts show estimated token count
- ✅ **Unified toast UI** — toolbar and context-menu flows use matching toast-style feedback

---

## 🚀 Usage

### Copy the current webpage

1. Open any regular webpage.
2. Click the **cpdown** toolbar icon or press `Ctrl+Shift+T`.
3. Use the toast buttons:
   - **Copy** — copy Markdown to clipboard
   - **Save .md** — save Markdown as a file

### Copy X.com / Twitter content

1. Open an X.com / Twitter post, thread, or article-like page.
2. Wait until the content is visible on the page.
3. Right-click anywhere on the page.
4. Select **Copy X.com Markdown**.
5. cpdown copies the extracted Markdown directly to the clipboard and shows a toast with the number of extracted blocks.

This flow reads the already-open browser page. It does **not** use the official X API and does **not** require any paid external API.

Current limitation: code-heavy X.com articles may not preserve perfect code indentation. The v1.6 extractor keeps the most readable baseline from the alpha tests, but further code-block fidelity improvements are deferred to a later version.

### Copy YouTube subtitles from the current video

1. Open a YouTube video.
2. Click the **cpdown** toolbar icon.
3. cpdown extracts the transcript using a hidden-tab flow for stable results.
4. A toast appears in the top-right corner with token count, **Copy**, and **Save .md**.

### Copy YouTube subtitles from a link

1. Right-click any YouTube link (`youtube.com` or `youtu.be`).
2. Select **Copy subtitles**.
3. cpdown opens the video in a hidden tab, extracts the transcript, closes the hidden tab, and shows the result on the original page.

---

## 🔐 Permissions

- `activeTab` — access the current active tab
- `clipboardWrite` — copy Markdown to clipboard
- `contextMenus` — show the YouTube and X.com right-click menu items
- `scripting` — inject extraction scripts when needed
- `storage` — store user preferences
- `<all_urls>` — allow extraction from webpages already open in the browser

---

## 🛠️ Build

Built with [WXT](https://wxt.dev) + React.

```bash
npm install
npm run dev    # development
npm run build  # production
```

---

## 🧾 Changelog

### v1.6

- **New:** X.com / Twitter Markdown extraction
  - Adds a dedicated right-click menu item: **Copy X.com Markdown**
  - Extracts visible X.com posts, threads, and article-like pages from the open browser page
  - Copies extracted X.com Markdown directly to the clipboard
  - Shows a page toast with extraction status and extracted block count
  - Does not use the official X API or any paid external API
- **Architecture:** X.com extraction is isolated from the main toolbar flow
  - Regular webpage extraction remains handled by the existing Readability / Defuddle path
  - YouTube transcript extraction remains handled by the existing hidden-tab transcript path
  - X.com extraction is loaded through `background-wrapper.js` and `background-xcom.js`
- **Change:** Extension version updated to `1.6`
- **Known limitation:** Code-heavy X.com articles may still lose some code indentation or structure. The v1.6 implementation uses the most readable alpha baseline and leaves deeper code-block reconstruction for a future release.

### v1.5

- **Fix:** Toolbar YouTube extraction is now stable on first click
  - Uses the same hidden-tab extraction flow as the right-click menu
  - Avoids stale YouTube SPA state when switching videos inside the same tab
  - Prevents old video data from appearing after navigating to a new video
- **Fix:** Current YouTube tab no longer closes after toolbar extraction
- **Fix:** Removed duplicate context menu creation warning:
  - `Cannot create item with duplicate id cpdown-transcript`
- **New:** Transcript toasts now show estimated token count
- **New:** Toolbar and context-menu transcript toasts now share the same Sonner-style design
- **Change:** Context menu label shortened to **Copy subtitles**
- **Chore:** Removed non-extension docs from the repository
- **Chore:** Added `.gitignore` for local agent/analysis artifacts

### v1.4.6

- **New:** Right-click context menu for YouTube transcript extraction
  - Right-click any YouTube link → **Copy subtitles**
  - Video opens in a hidden tab, transcript is extracted, tab is closed
  - Toast with **Copy** / **Save .md** appears on the current page
  - Supports `youtube.com` and `youtu.be` links
- **Fix:** Version display in options page synced with manifest
- **Fix:** Typo `useDeffudle` → `useDefuddle`

### v1.4.5

- Added selection save button to toast
- Stabilized YouTube and options UI

---

## 📦 Current version

**v1.6**

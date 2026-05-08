# cpdown

> 📄 Copy any webpage, X.com content, or YouTube subtitles as clean, LLM-ready Markdown.

**cpdown** is a lightweight browser extension for saving useful web content without the noise: articles, selected text, X.com posts/articles, and YouTube transcripts.

---

## ✨ Features

- 🧭 **Toolbar button** — click the extension icon or press `Ctrl+Shift+T`
- 🎬 **YouTube subtitles** — copy the current video's transcript as Markdown
- 🖱️ **Right-click menu** — right-click a YouTube link → **Copy subtitles**
- 🧼 **Readability / Defuddle** — extract clean article content from webpages
- ✕ **X.com extraction** — copy visible X.com posts, threads, and article-like pages as Markdown without paid APIs
- 📋 **Copy to clipboard** — copy Markdown instantly
- 💾 **Save as `.md`** — download extracted content as a Markdown file
- 🔢 **Token count** — transcript toasts show estimated token count
- ✅ **Unified toast UI** — toolbar and context-menu flows use matching Sonner-style toasts

---

## 🚀 Usage

### Copy the current page

1. Open any webpage
2. Click the **cpdown** toolbar icon or press `Ctrl+Shift+T`
3. Use the toast buttons:
   - **Copy** — copy Markdown to clipboard
   - **Save .md** — save Markdown as a file

### Copy X.com content

1. Open an X.com / Twitter post, thread, or article-like page
2. Wait until the content is visible on the page
3. Click the **cpdown** toolbar icon or press `Ctrl+Shift+T`
4. cpdown prepares a clean Markdown source from the visible X.com content and then uses the normal copy/save flow

This feature reads the page already open in the browser. It does not use the official X API or any paid external API.

### Copy YouTube subtitles from the current video

1. Open a YouTube video
2. Click the **cpdown** toolbar icon
3. cpdown extracts the transcript using a hidden-tab flow for stable results
4. A toast appears in the top-right corner with token count, **Copy**, and **Save .md**

### Copy YouTube subtitles from a link

1. Right-click any YouTube link (`youtube.com` or `youtu.be`)
2. Select **Copy subtitles**
3. cpdown opens the video in a hidden tab, extracts the transcript, closes the hidden tab, and shows the result on the original page

---

## 🔐 Permissions

- `activeTab` — access the current active tab
- `clipboardWrite` — copy Markdown to clipboard
- `contextMenus` — show the YouTube link right-click menu
- `scripting` — inject extraction scripts when needed
- `storage` — store user preferences
- `<all_urls>` — allow extraction from webpages, including X.com pages already open in the browser

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

### Unreleased

- **New:** X.com / Twitter Markdown extraction
  - Works on visible X.com posts, threads, and article-like pages
  - Adds a page-local adapter for X.com instead of using external APIs
  - Preserves the existing YouTube and generic webpage extraction flows

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

**v1.5**

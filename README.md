# cpdown

Copy any webpage or YouTube subtitle as clean markdown.

## Features

- **Toolbar button** — click the extension icon (or `Ctrl+Shift+T`) to copy the current page as Markdown
- **Right-click context menu** — right-click any YouTube link → "cpdown: copy transcript" to extract subtitles without opening the video
- **YouTube subtitles** — extracts video transcripts and formats them as Markdown
- **Readability / Defuddle** — extracts main article content from any webpage
- **Copy to clipboard** or **Save as .md file**

## Usage

1. Navigate to any page or YouTube video
2. Click the cpdown icon in the toolbar (or press `Ctrl+Shift+T`)
3. A toast appears with two options: **Copy** or **Save .md**

To extract a YouTube transcript from a link without navigating to it:
1. Right-click a YouTube link anywhere (Google, Twitter, etc.)
2. Select **"cpdown: copy transcript"** from the context menu
3. The transcript appears in a toast on the current page

## Permissions

- `activeTab` — access the current tab's content
- `clipboardWrite` — copy content to clipboard
- `contextMenus` — right-click menu for YouTube links
- `scripting` — inject content scripts
- `storage` — save user preferences
- `<all_urls>` host permission — work on any page

## Build

Built with [WXT](https://wxt.dev) + React.

```bash
npm install
npm run dev    # development
npm run build  # production
```

## Changelog

### v1.4.6

- **New:** Right-click context menu for YouTube transcript extraction
  - Right-click any YouTube link → "cpdown: copy transcript"
  - Video opens in a hidden tab, transcript is extracted, tab is closed
  - Toast with Copy / Save .md appears on the current page
  - Supports `youtube.com` and `youtu.be` links
- **Fix:** Version display in options page synced with manifest
- **Fix:** Typo `useDeffudle` → `useDefuddle`

### v1.4.5

- Add selection save button to toast
- Stabilize YouTube and options UI

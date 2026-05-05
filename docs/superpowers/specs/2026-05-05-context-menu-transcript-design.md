# Context Menu Transcript Extraction — Design Doc

## Summary

Add right-click context menu support to cpdown: extract YouTube video transcript by
right-clicking any YouTube link, without opening a visible page.

## Status

Approved, ready for implementation.

## Architecture

### Flow

```
1. User right-clicks YouTube link → context menu "cpdown: copy transcript"
2. background.js: extracts videoId from info.linkUrl
3. background.js: creates hidden tab (active: false) with YouTube URL
4. On tab load: injects content-scripts/yt-transcript.js into hidden tab
5. yt-transcript.js:
   a. Communicates with youtube-main-world.js via postMessage
   b. Gets ytInitialPlayerResponse + pot
   c. Fetches SRT subtitles from timedtext API
   d. Parses SRT → plain text
   e. Formats as markdown
   f. Sends result to background via chrome.runtime.sendMessage
6. background.js: receives TRANSCRIPT_RESULT, closes hidden tab
7. background.js: injects content-scripts/toast-overlay.js into original tab
8. background.js: sends markdown data via chrome.tabs.sendMessage
9. toast-overlay.js: creates floating overlay with 📋 Copy + 💾 Save .md buttons
```

### Files

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `content-scripts/yt-transcript.js` | Extract transcript from YouTube hidden tab |
| CREATE | `content-scripts/toast-overlay.js` | Show copy/save overlay on original page |
| MODIFY | `manifest.json` | Add `contextMenus` permission |
| MODIFY | `background.js` | Context menu creation, orchestration, message handling |

### No changes to
- `content-scripts/content.js` — minified bundle, left untouched
- `content-scripts/save-selection.js` — unrelated
- `youtube-main-world.js` — already handles postMessage correctly
- `options.html`, `chunks/options-ChfjUtXM.js` — no new settings needed

## Detailed Design

### Permission Change (manifest.json)

```json
"permissions": [
  "activeTab",
  "clipboardWrite",
  "contextMenus",
  "scripting",
  "storage"
]
```

### New Message Types

| Direction | Type | Payload |
|-----------|------|---------|
| bg → hidden tab | — | (yt-transcript.js injected via executeScript) |
| hidden tab → bg | `TRANSCRIPT_RESULT` | `{ markdown, title, videoId }` or `{ error }` |
| bg → original tab | `SHOW_TRANSCRIPT_TOAST` | `{ markdown, title, videoUrl }` |

### yt-transcript.js

Injected into hidden YouTube tab via `chrome.scripting.executeScript` with
`world: 'ISOLATED'`.

Steps:
1. Send `GET_YT_INITIAL_PLAYER_RESPONSE` via postMessage to main world
2. Await `YT_INITIAL_PLAYER_RESPONSE` response with ytInitialPlayerResponse + pot
3. Extract captionTracks from player captions data
4. Fetch SRT from `captionTracks[0].baseUrl&fmt=srt&c=WEB&pot=...`
5. Parse SRT → plain text (strip timestamps and indices)
6. Format as: `# Video Title\n\n{transcript text}`
7. Call `chrome.runtime.sendMessage({ type: 'TRANSCRIPT_RESULT', payload: { markdown, title, videoId } })`

Error handling:
- Timeout (10s) waiting for player response → error message
- No captions available → "No captions available for this video"
- Fetch failure → error message

### toast-overlay.js

Injected into original tab via `chrome.scripting.executeScript`.

Listens for `chrome.runtime.onMessage` with type `SHOW_TRANSCRIPT_TOAST`.

Creates a floating overlay in the bottom-right corner:

```
┌──────────────────────────────────────┐
│  ✅ Transcript ready!                │
│  "Video Title"                       │
│                                      │
│  [📋 Copy]  [💾 Save .md]           │
└──────────────────────────────────────┘
```

- Copy button: `navigator.clipboard.writeText(markdown)`
- Save .md button: Blob → download link → `<title>.md`
- Close button (×) to dismiss
- Auto-dismiss after 15 seconds
- Click-outside to dismiss
- If overlay already exists, update it instead of creating duplicate

### background.js additions

**On startup/install:**
```js
chrome.contextMenus.create({
  id: 'cpdown-transcript',
  title: 'cpdown: copy transcript',
  contexts: ['link'],
  targetUrlPatterns: ['*://*.youtube.com/*']
});
```

**On context menu click:**
```js
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // 1. Extract videoId
  // 2. Create hidden tab
  // 3. Wait for load
  // 4. Inject yt-transcript.js
  // 5. Wait for TRANSCRIPT_RESULT
  // 6. Close hidden tab
  // 7. Inject toast-overlay.js into original tab
  // 8. Send SHOW_TRANSCRIPT_TOAST
});
```

**Message handler addition:**
- Handle `TRANSCRIPT_RESULT` from hidden tab's content script

## Edge Cases

- **Link is not a watch URL** (e.g., `/channel/...`, `/@user`): validate URL, show error toast
- **No captions available**: error overlay with message
- **Private/deleted video**: fetch error, show error overlay
- **Hidden tab never loads**: 15s timeout, show error
- **User closes tab during extraction**: catch errors gracefully
- **Multiple rapid context menu clicks**: queue or ignore duplicates

## Testing

- Right-click YouTube link from Google search results
- Right-click YouTube link from Twitter/X
- Right-click YouTube link from Telegram Web
- Right-click YouTube link while already on a YouTube page
- Video without captions
- Invalid YouTube link

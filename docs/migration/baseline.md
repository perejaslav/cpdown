# Baseline — cpdown v1.7 pre-WXT

## Snapshot

| Field | Value |
|---|---|
| **Date** | 2026-07-03 |
| **Git commit** | `5dbfbdf` |
| **Branch** | `chore/wxt-migration-v1-8` |
| **Extension version** | `1.7` |
| **Manifest version** | `3` |

## Current manifest details

### Background

| Field | Value |
|---|---|
| **Service worker** | `background-wrapper.js` |

### Content scripts

| JS files | Match patterns |
|---|---|
| `content-scripts/content.js` | `*://*/*` |
| `content-scripts/save-selection.js` | `*://*/*` |

### Web-accessible resources

| Match patterns | Resources |
|---|---|
| `*://*.youtube.com/*` | `youtube-main-world.js` |

### Options UI

| Field | Value |
|---|---|
| **Page** | `options.html` |

### Permissions

- `activeTab`
- `clipboardWrite`
- `contextMenus`
- `scripting`
- `storage`

### Host permissions

- `<all_urls>`

### Commands

| Command | Description | Default key | Mac key |
|---|---|---|---|
| `copy-as-markdown` | Copy current page as clean markdown | `Ctrl+Shift+T` | `Ctrl+T` |

### Action

The `action` object is present but empty (no popup or icon overrides defined).

## Known limitations

- `background.js` is a minified bundle (≈38 KB, React + Sonner + Readability + Defuddle in one line)
- X.com code-block indentation may be imperfect (documented in README)
- YouTube transcript extraction may toggle CC state in the player
- No package.json, tsconfig.json, or wxt.config.ts — no reproducible build
- No tests — no regression detection

## Rollback instructions

```bash
git switch main
git reset --hard baseline-v1.7-before-wxt
```
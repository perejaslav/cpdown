# Phase F Report — YouTube Transcript Extraction

## Status: COMPLETE ✅ (awaiting manual verification)

## Checks

| Check | Result |
|---|---|
| `pnpm check` | ✅ typecheck · tests · build · manifest |
| Total tests | **227** (across 17 files) |
| New in Phase F | **69** |

## Commits (Phase F, 8 commits)

| SHA | Message |
|-----|---------|
| `e1e9e4d` | docs: add YouTube flow component contract |
| `dc0228c` | fix(youtube): update track selection to use first available |
| `968cb31` | feat(youtube): add MAIN-world bridge for network interception |
| `055bc97` | feat(youtube): add isolated-world bridge client |
| `110d9bc` | feat(youtube): add pure timedtext module with SRT parsing |
| `a33543e` | feat(diagnostics): add YouTube error codes with i18n messages |
| `f1b6993` | fix(youtube): wrap entrypoints in WXT main() |
| `897d377` | test(youtube): add CC-click static check + manual test docs |

## New files

### Source modules (src/lib/youtube/)

| File | Purpose |
|---|---|
| `src/lib/youtube/url-predicate.ts` | URL matching for player/timedtext requests |
| `src/lib/youtube/parse-player-response.ts` | Pure JSON parser for YouTube player response |
| `src/lib/youtube/timedtext.ts` | Timedtext URL construction, SRT parsing, token estimation |
| `src/lib/youtube/bridge-protocol.ts` | Message types and validation for MAIN↔isolated bridge |

### Updated modules

| File | Change |
|---|---|
| `src/lib/youtube/tracks.ts` | Final fallback now returns first available track (any kind) |
| `src/lib/contracts.ts` | Added YouTube-specific DiagnosticCodes |
| `src/lib/diagnostics/messages.ts` | i18n messages for all 12 diagnostic codes |

### Entrypoints

| File | Type | Purpose |
|---|---|---|
| `entrypoints/youtube-main.world.ts` | MAIN-world content script | Intercepts fetch + XHR for player/timedtext |
| `entrypoints/youtube-bridge.client.ts` | WXT content script | Communicates with bridge, selects track, fetches timedtext |

### Tests (69 new)

| File | Count | Type |
|---|---|---|
| `tests/unit/youtube/url-predicate.test.ts` | 14 | unit |
| `tests/unit/youtube/parse-player-response.test.ts` | 12 | unit |
| `tests/unit/youtube/timedtext.test.ts` | 9 | unit |
| `tests/unit/youtube/bridge-protocol.test.ts` | 15 | unit (3 added) |
| `tests/unit/youtube/no-cc-click.test.ts` | 7 | static analysis |
| `tests/unit/youtube/capture-flow.test.ts` | 1 | module import |
| `tests/unit/youtube/tracks.test.ts` | 5 | unit (added) |

## Diagnostic codes (YouTube)

| Code | User message |
|---|---|
| `YOUTUBE_NO_CAPTIONS` | No captions are available for this video. |
| `YOUTUBE_PLAYER_TIMEOUT` | Could not get caption data from YouTube in time. |
| `YOUTUBE_TRACK_NOT_FOUND` | No suitable caption track found for your language. |
| `YOUTUBE_TIMEDTEXT_EMPTY` | Downloaded captions are empty. |
| `YOUTUBE_TIMEDTEXT_REQUEST_FAILED` | Could not download the caption file. |
| `YOUTUBE_STALE_RESPONSE` | Received data belongs to a different video. |
| `YOUTUBE_BRIDGE_INVALID_MESSAGE` | Internal communication error. Reload the page. |

## Architecture compliance

- [x] No DOM clicks — verified by static CC-click test (7 assertions)
- [x] No CC-button access — verified by static analysis
- [x] No jsdom in src/ — only in tests/dom/
- [x] Pure modules have zero runtime dependencies
- [x] Bridge uses typed postMessage with cpdown namespace
- [x] Stale data prevention: channel + requestId + navigationId + videoId matching
- [x] Timeouts: 8s initial, 8s retry, 3s bridge-ready
- [x] One retry max, no infinite loops
- [x] Cleanup of event listeners and timers after success/error

## Known limitations

1. **Not wired to background yet** (Phase H) — the new bridge client listens for `EXTRACT_YOUTUBE_TRANSCRIPT` messages but the toolbar/context-menu handlers haven't been updated to send them
2. **`world: "MAIN"** content script approach works in WXT build but needs Chrome testing to confirm CSP compatibility
3. (Removed — both fetch and XHR are intercepted)
4. **SRT parsing** assumes standard YouTube SRT format — custom formats may produce different results

## Manual test instructions

See `docs/youtube-manual-test.md` for 5 test scenarios.

**Quick summary:**
1. Open YouTube video with captions → CC stays OFF → transcript extracted
2. CC already ON → stays ON → transcript extracted
3. Video without captions → clear error message
4. Right-click context menu → transcript extracted (note: needs Phase H wiring)
5. Check service worker console for errors

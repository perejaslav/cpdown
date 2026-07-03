# YouTube Transcript Manual Test

## Prerequisites
- Chrome with unpacked extension loaded from `.output/chrome-mv3/`
- Three YouTube video URLs:
  1. Video WITH manual captions (e.g., popular TED talk or news)
  2. Video with ONLY auto-generated captions (e.g., recent upload)
  3. Video with NO captions (e.g., music video or private)

## Test scenarios

### Scenario 1: CC off, captions available

1. Open video 1 (manual captions available)
2. Confirm CC is OFF (no red underline on CC button)
3. Click cpdown toolbar icon or press Ctrl+Shift+T
4. Expected:
   - [ ] CC remains OFF after extraction
   - [ ] Transcript toast appears with Copy/Save buttons
   - [ ] Toast shows token count
   - [ ] Copy works (verify by pasting)
   - [ ] No console errors in extension context

### Scenario 2: CC already on

1. Turn CC ON for video 1
2. Click cpdown toolbar icon
3. Expected:
   - [ ] CC remains ON after extraction
   - [ ] Transcript is extracted successfully
   - [ ] No duplicate requests

### Scenario 3: Auto-generated captions only

1. Open video 2 (ASR only)
2. Click cpdown toolbar icon
3. Expected:
   - [ ] CC state unchanged
   - [ ] Transcript extracted (may contain ASR artifacts)
   - [ ] Token count shown

### Scenario 4: No captions

1. Open video 3 (no captions)
2. Click cpdown toolbar icon
3. Expected:
   - [ ] Error message: "No captions are available for this video."
   - [ ] NOT a raw exception or "undefined"
   - [ ] No toast with broken data

### Scenario 5: Right-click context menu

1. Find a YouTube link on any page
2. Right-click → "Copy subtitles"
3. Expected:
   - [ ] Transcript is extracted
   - [ ] Toast appears on the page
   - [ ] CC state of the opened tab unchanged

## Results table

| Scenario | State before | State after | Transcript? | Error code | Notes |
|----------|-------------|-------------|-------------|------------|-------|
| 1 | CC OFF | CC OFF | Yes/No | | |
| 2 | CC ON | CC ON | Yes/No | | |
| 3 | CC OFF | CC OFF | Yes/No | | |
| 4 | CC OFF | CC OFF | No | | |
| 5 | — | — | Yes/No | | |

## Verification steps
- For each scenario, check `chrome://extensions` → cpdown service worker console for errors
- Check the page console for errors
- Verify transcript pastes as readable Markdown

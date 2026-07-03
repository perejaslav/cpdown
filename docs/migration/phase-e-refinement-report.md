# Phase E Refinement Report — Heuristic Code Detection

## Status: COMPLETE ✅

## Checks

| Check | Result |
|---|---|
| `pnpm check` | ✅ Pass (typecheck, test, build, manifest validation) |
| Total tests | 149 (10 files) |
| New tests (E.1r) | 40 (code-detect.test.ts: 34 + heuristic.test.ts: 6) |
| jsdom in src/ | None found (only doc-comment references) |

## Phase E commits (26 total)

```
7c944a2 feat(xcom): integrate heuristic code detection into DOM adapter
c896f6a feat(xcom): implement heuristic code detection for unstructured text
63382ac test(xcom): add heuristic code detection tests
77e2363 docs: add Phase E completion report
ffc7552 test(xcom): add integration test for full HTML-to-Markdown pipeline
2d73705 fix(xcom): insert --- separator between consecutive posts
cc4b84b feat(xcom): implement pure markdown renderer for X.com segments
9fedf7d test(xcom): add renderer tests for markdown output
32df1e2 feat(xcom): implement single-pass DOM adapter preserving thread order
ad11cf2 test(xcom): add DOM adapter tests with fixtures
2a2f167 feat(xcom): add segment types and UI pattern detection
3d99b7b feat(youtube): migrate pot parsing and track selection to pure modules
905b1ee test(youtube): add tests for pot extraction and track selection
f3259f8 feat(selection): implement safeFileName and escapeMarkdown
f69507e test(selection): add tests for safe file name and markdown escape
5097368 feat(fence): implement code fence with language normalization
f9dc207 test(fence): add falling tests for code fence generation
a33acbb docs: define test policy and create test directories
70e7fc6 build: add manifest validation script to check pipeline
0b35ba0 build: add minimal empty WXT project with MV3 manifest
1a35ea3 build: configure vitest with node default and jsdom opt-in
ec2a71d build: add required project scripts for WXT development
3b906f6 build: fix node and pnpm versions for reproducible builds
0f65d3f docs: add shared type contracts for migration
d7ee054 docs: define module contracts and layer boundaries
48fbc6e docs: define target directory structure for WXT migration
```

## Changed files (E.1r)

| File | Change |
|---|---|
| `src/lib/xcom/code-detect.ts` | NEW — heuristic detection (Path A: lang marker +2, Path B: 3+ strong lines) |
| `src/adapters/dom/xcom.ts` | MODIFIED — added `applyHeuristicCodeDetection` post-processing |
| `tests/unit/xcom/code-detect.test.ts` | NEW — 34 unit tests for pure detection |
| `tests/dom/xcom/heuristic.test.ts` | NEW — 6 integration tests in DOM context |

## Detection logic

### Path A: Language marker
- First line matches a known language (python, bash, json, yaml, javascript, etc.)
- At least 2 following lines pass `looksLikeCodeLineInContext` (non-empty, non-UI)
- Language is normalized via `normalizeLanguage` (js→javascript, yml→yaml, sh→bash)
- Requires minimum 3 total lines

### Path B: Strong consecutive lines
- At least 3 lines match `STRONG_CODE_PATTERN`:
  - Keywords: import, from, def, class, const, let, var, function, async, await, return, if, for, while, try, catch, switch
  - Commands: curl, npm, git, docker, pip, mkdir, cd, ls, cat, grep, sed, awk, chmod, sudo
- Also checks `CODE_LINE_PATTERN` for broader matches (indentation, braces, assignments)

### What is NOT converted
- Single code lines without context
- Normal prose paragraphs
- UI strings (like, repost, etc.)
- Single name: value lines

## Implementation details

### `code-detect.ts`
- **ZERO runtime dependencies** — only imports `normalizeLanguage` from `../markdown/fence` and `isUiLine` from `./ui-patterns`
- `detectLanguageMarker(line)` — normalizes and checks against `LANGUAGE_MARKERS` set
- `looksLikeCodeLine(line)` — strong + broad pattern matching
- `detectCodeBlock(lines)` — orchestrates Path A then Path B

### `xcom.ts` adapter
- `applyHeuristicCodeDetection` called via `.map()` after `extractSegments` in the pipeline
- Groups consecutive text segments into a buffer
- On encountering a non-text segment (code, link), flushes the buffer through `detectCodeBlock`
- Non-text segments pass through untouched
- DOM order fully preserved

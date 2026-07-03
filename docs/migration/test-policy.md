# Test Policy

This document defines the testing conventions for the cpdown WXT migration (v1.8).

## 1. Test Naming

Test names describe **visible behavior**, not implementation details.

A good name tells the reader what the user or caller would observe:

```ts
// ✅ describes behavior
it("converts inline bold to **text**");
it("strips trailing whitespace from each line");
it("returns empty string when input has no headings");

// ❌ describes internal function
it("calls processInline");
it("uses regex replace");
it("trims");
```

Prefer `it("verb …")` or `it("noun is …")`. If a test needs disambiguation,
append a short clause: `it("preserves code blocks — no conversion inside fences")`.

## 2. TDD Flow

Every bug follows a strict sequence:

1. **Write a failing test** that reproduces the bug (red).
2. **Commit the failing test** so the red state is captured.
3. **Implement the fix** so the test passes (green).
4. **Commit the fix** with a message referencing the bug.

This ensures every regression has a corresponding guard. Never fix a bug
without first adding (or updating) a test that exposes it.

## 3. Snapshot Policy

Snapshots are allowed **only** for small, final Markdown output where the
expected result is a concise document (typically under 50 lines).

- Snapshots must live in `__snapshots__/` directories adjacent to the test file.
- Every snapshot-backed test **must also** include explicit `expect` assertions
  for critical rules (e.g., heading levels preserved, code fences intact,
  no broken links). This guards against accidental snapshot updates.
- Review snapshot diffs carefully during code review — never `--update`
  a snapshot without verifying the content change is intentional.

## 4. Fixture Rules

Fixtures live in `tests/fixtures/` and follow these constraints:

| Rule | Rationale |
|------|-----------|
| **Small** — under 100 lines each | Easy to read, fast to parse |
| **Anonymized** — no real URLs, names, or content | Safe to commit; no privacy concerns |
| **Stable** — content rarely changes once committed | Snapshots and assertions stay valid |
| **Named by purpose** — `wiki-heading.html`, `youtube-chapters.md` | Self-documenting; no `test1`, `foo` |

Fixtures are shared across test files via relative imports:

```ts
import { readFixture } from "../helpers";
const html = readFixture("wiki-heading.html");
```

## 5. File Organization

**One test file per group of rules.** A "group" is a cohesive set of related
rules (e.g., "heading conversion", "inline formatting", "code blocks").

Test file names mirror the source module or feature area:

| Source module | Test file |
|---|---|
| `src/converters/headings.ts` | `tests/unit/headings.test.ts` |
| `src/converters/inline.ts` | `tests/unit/inline.test.ts` |
| `src/adapters/dom.ts` | `tests/dom/dom-adapter.test.ts` |

## 6. Where Tests Live

| Directory | Purpose | Environment |
|---|---|---|
| `tests/unit/` | Pure logic — converters, parsers, utilities | `node` (default) |
| `tests/dom/` | DOM adapter tests — uses `jsdom` | `jsdom` (via vitest config glob) |
| `tests/fixtures/` | Shared HTML/MD input files | — |

The vitest config already maps `tests/dom/**/*.test.ts` to the `jsdom`
environment via `environmentMatchGlob`. No per-file annotations needed.

```bash
# run all tests
pnpm test

# run only unit tests
pnpm vitest run tests/unit/

# run only DOM tests
pnpm vitest run tests/dom/

# watch mode
pnpm test:watch
```

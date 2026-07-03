# Target Directory Structure (WXT Migration v1.8)

This document defines the target directory layout for the cpdown project after the
WXT migration is complete. Every module has a clear responsibility boundary; WXT
entrypoint filenames may be refined once the installed WXT version is known, but
module responsibilities remain unchanged.

```text
cpdown/
├── entrypoints/                          # WXT entrypoints (browser extension entry points)
│   ├── background.ts                     #   registration of menus, commands, routing
│   ├── content.ts                        #   main page scenario (content script)
│   ├── options/                          #   settings page (WXT directory entrypoint)
│   │   └── index.html (+ index.ts)
│   └── youtube-main-world.ts             #   MAIN-world bridge — only if truly needed
│
├── src/
│   ├── lib/                              # Pure logic — no browser / DOM dependencies
│   │   ├── markdown/                     #   markdown utilities (fence, escape, format)
│   │   ├── selection/                    #   selection save helpers, file naming
│   │   ├── xcom/                         #   X.com extraction pure logic
│   │   ├── youtube/                      #   YouTube pure logic (pot, tracks, player-response)
│   │   └── diagnostics/                  #   error codes, counters, humanize
│   │
│   ├── adapters/                         # Thin wrappers around platform / runtime APIs
│   │   ├── chrome/                       #   chrome.storage, chrome.tabs, chrome.scripting
│   │   ├── dom/                          #   Document / Element reading, X.com DOM adapter
│   │   └── youtube/                      #   YouTube bridge (MAIN ↔ isolated world messaging)
│   │
│   └── features/                         # Feature flows — orchestrate lib + adapters
│       ├── copy-page/                    #   toolbar "copy page" flow
│       ├── save-selection/               #   selection save flow
│       ├── xcom/                         #   X.com context-menu flow
│       └── youtube/                      #   YouTube transcript flow
│
├── tests/                                # ALL test code lives here (tests only)
│   ├── unit/                             #   unit tests for src/lib/ and src/adapters/
│   ├── integration/                      #   integration tests (optional)
│   └── fixtures/                         #   HTML fixtures for DOM tests
│
└── docs/                                 # Project documentation
    ├── migration/                        #   migration documents (this directory)
    └── architecture/                     #   architecture documentation
```

## Directory Categories

| Category | Directories | Notes |
|----------|-------------|-------|
| **Source only** | `entrypoints/`, `src/` | Runtime code shipped with the extension |
| **Tests only** | `tests/` | Never shipped; contains `unit/`, `integration/`, `fixtures/` |
| **Docs only** | `docs/` | Not shipped; migration records and architecture docs |

## Temporary `legacy/` Directory

During migration, a top-level `legacy/` directory will hold the original v1.7 source
files. This directory exists **only** during the migration process and is removed before
the v1.8.0-rc.1 tag. It is intentionally excluded from the target tree above.

## Notes

- WXT entrypoint names (`background.ts`, `content.ts`, etc.) are conventions; the
  exact filenames and directory structure may be adjusted to match the installed WXT
  version's expectations.
- `src/lib/` is deliberately dependency-free (no DOM, no `chrome.*`, no browser APIs)
  so that unit tests can run without any browser polyfills.
- `src/adapters/` isolates all platform calls behind thin wrappers, making features
  testable by mocking only the adapter layer.

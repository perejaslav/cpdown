# Module Contracts and Layer Boundaries

This document defines what each layer is **allowed** and **forbidden** from doing.
Strict adherence to these contracts keeps the codebase testable, decoupled, and
migration-friendly.

---

## 1. Layer Responsibility Table

| Layer | Allowed | Forbidden |
|---|---|---|
| `src/lib/` | strings, arrays, types, pure logic | DOM, `window`, `document`, `chrome.*`, `fetch`, time-dependent calls |
| `src/adapters/dom/` | `Document`, `Element`, structure collection, DOM queries | `chrome.*`, business-rule selection, Markdown heuristics |
| `src/adapters/chrome/` | `chrome.storage`, `chrome.tabs`, `chrome.scripting`, messaging | HTML parsing, Markdown generation, DOM queries |
| `src/adapters/youtube/` | YouTube bridge communication, network-level transcript fetching | language-choice logic, track-priority heuristics, Markdown formatting |
| `src/features/` | module composition, orchestration of adapters + lib, error mapping | pure-logic duplication (implement helpers in `src/lib/` instead) |
| `entrypoints/` | registration of commands, menus, content-script launch, options-page mount | large algorithms, direct DOM manipulation, business logic |

---

## 2. Data Flow

Data flows in a strict direction: **entrypoints → features → adapters → lib**.
No layer may call a layer above it, and no layer may bypass the layer immediately
below it.

```
entrypoints/          ──→  src/features/         ──→  src/adapters/           ──→  src/lib/
(registration)            (orchestration)              (platform I/O)              (pure logic)
                                                                              ↑
                                                                    src/adapters/dom/
                                                                      (DOM reading)
```

### Direction rules

- **entrypoints/** calls into **features/**. An entrypoint is a thin shell: it
  receives a browser event (command, context-menu click, toolbar icon) and
  delegates to a single feature function.
- **features/** orchestrate adapters and lib. A feature function may call one or
  more adapter functions to obtain data, pass that data through lib transformations,
  and return a result to the entrypoint (or call another adapter to write the result).
- **adapters/** call into **lib/** for any data transformation. An adapter must not
  contain heuristics or formatting rules; it collects raw data and hands it to lib.
- **lib/** has no upward dependencies. It receives plain values (strings, numbers,
  typed arrays) and returns plain values. It is the leaf of every call chain.

### The DOM boundary

`Document` and `Element` are **not** pure inputs. Functions that touch the DOM live
in `src/adapters/dom/` and return **simple data** (strings, arrays, typed objects)
to `src/lib/`. This means:

- `src/lib/` never receives a DOM node as a parameter.
- `src/adapters/dom/` never imports from `src/features/` or `entrypoints/`.
- Any query like `querySelectorAll`, `textContent`, or `getBoundingClientRect`
  belongs exclusively in `src/adapters/dom/`.

---

## 3. jsdom Rule

**jsdom is NEVER allowed in the browser build.** It is ONLY used in tests.

| Context | jsdom? | Rationale |
|---|---|---|
| Production browser bundle | **Forbidden** | ~1 MB overhead, API mismatches, CSP issues |
| Unit tests (`tests/unit/`) | **Allowed** | Enables DOM-dependent adapter tests without a real browser |
| Integration tests (`tests/integration/`) | **Allowed** (preferred over real browser) | Faster CI, deterministic DOM fixtures |

If a test needs a DOM environment, it must import jsdom in its own test setup
(e.g., `tests/unit/setup.ts`) and never re-export it into production modules.

---

## 4. Legacy / New Source Isolation

**No imports between `legacy/` (v1.7) and `src/` (v1.8).**

During migration both trees coexist on disk, but they must remain fully
independent:

- Files in `legacy/` may only reference other files in `legacy/` or in
  `chunks/`, `content-scripts/`, and other original v1.7 directories.
- Files in `src/` and `entrypoints/` may only reference other files within
  `src/` and `entrypoints/`.
- A TypeScript path alias (`@legacy/...` or similar) must **not** be configured.
- If shared constants are needed during migration, duplicate them and add a
  `// TODO: remove after legacy/ is deleted` comment.

This isolation ensures that deleting `legacy/` is a single atomic commit with
no build breakage.

---

## 5. Example Data Flow — "Copy Page" Scenario

The toolbar "Copy page" action demonstrates a complete traversal of all layers.

```
entrypoints/background.ts
  │  chrome.commands.onCommand('copy-page')
  ▼
features/copy-page.ts        ← feature orchestrator
  │
  ├──► adapters/dom/reader.ts
  │      Reads the active tab's document.body.
  │      Returns { title: string, html: string, url: string }.
  │      (DOM access stays here; no business logic.)
  │
  ├──► lib/markdown/html-to-md.ts
  │      Pure function: htmlToMarkdown(html) → string.
  │      No DOM, no chrome API — just string transforms.
  │
  ├──► lib/markdown/fence.ts
  │      Pure function: wrapWithFence(markdown, lang) → string.
  │
  ├──► lib/selection/file-name.ts
  │      Pure function: fileNameFromTitle(title) → string.
  │
  ├──► adapters/chrome/clipboard.ts
  │      Writes result to clipboard via chrome.offscreen or
  │      navigator.clipboard (behind chrome-wrapper).
  │
  └──► lib/diagnostics/counters.ts
         Increments the "pages copied" counter (pure counter logic).
         Actual storage write goes through adapters/chrome/storage.ts.
```

### Layer participation summary

| Layer | Module | Responsibility in this flow |
|---|---|---|
| entrypoints | `background.ts` | Receives the `copy-page` command, delegates to feature |
| features | `copy-page.ts` | Orchestrates the 6 steps below; contains zero pure logic |
| adapters/dom | `reader.ts` | Reads the live DOM, returns plain `{ title, html, url }` |
| lib | `html-to-md.ts` | Converts HTML string → Markdown string (pure) |
| lib | `fence.ts` | Wraps output in a fenced code block (pure) |
| lib | `file-name.ts` | Generates a clipboard-friendly filename (pure) |
| adapters/chrome | `clipboard.ts` | Writes the final string to the system clipboard |
| lib + adapters/chrome | `counters.ts` + `storage.ts` | Records a diagnostic counter |

Notice that `src/lib/` never touches the DOM, and `src/adapters/dom/` never
formats Markdown. Each layer performs exactly its contracted role.

/**
 * DOM adapter for X.com — reads posts from the page DOM.
 * Uses browser-native Document/Element APIs only.
 * NO jsdom import — this runs in the browser.
 */

import type { XcomSegment } from "../../lib/xcom/segments";
import { isUiLine, normalizeSpaces } from "../../lib/xcom/ui-patterns";

const SELECTORS =
  "[data-testid='tweetText'], div[lang], article, [role='article']";

/**
 * Collect X.com posts from a Document, preserving DOM order.
 * Each post is an array of XcomSegment (text, code, or link).
 *
 * Algorithm (single-pass):
 * 1. Single querySelectorAll call → DOM order preserved
 * 2. Deduplicate exact Element references via Set
 * 3. Exclude nested/sibling candidates whose text is already in a collected post
 * 4. Walk each post's children left-to-right for segment extraction
 * 5. <pre><code> → one code segment (language from class)
 * 6. Other text → text segment
 * 7. Filter out posts with no real content
 */
export function collectXcomPosts(doc: Document): XcomSegment[][] {
  const root = doc.querySelector("main") ?? doc.body;
  if (!root) return [];

  // Single combined query — DOM order preserved
  const candidates = Array.from(root.querySelectorAll(SELECTORS));

  // Step 2: Deduplicate by exact Element reference
  const seen = new Set<Element>();
  const unique: Element[] = [];
  for (const el of candidates) {
    if (!seen.has(el)) {
      seen.add(el);
      unique.push(el);
    }
  }

  // Step 3: Filter out elements whose text is already in a collected post.
  // This handles:
  //   - DOM-nested (tweetText inside article)
  //   - Sibling duplicates (div[lang] with same text as article)
  const collected: Element[] = [];
  for (const el of unique) {
    const text = normalizeSpaces(el.textContent ?? "");
    if (!text) continue;

    const isDuplicate = collected.some((parent) => {
      const parentText = normalizeSpaces(parent.textContent ?? "");
      if (!parentText.includes(text)) return false;
      // DOM-nested: definitely a child duplicate
      if (parent.contains(el)) return true;
      // Not DOM-nested but same text: sibling duplicate (e.g. div[lang])
      return parentText === text;
    });
    if (isDuplicate) continue;

    collected.push(el);
  }

  // Steps 4–7: Extract segments from each post, left-to-right, filter empties
  return collected.map(extractSegments).filter((s) => s.length > 0);
}

function extractSegments(root: Element): XcomSegment[] {
  const segments: XcomSegment[] = [];
  for (const child of Array.from(root.childNodes)) {
    walkNode(child, segments);
  }
  return segments;
}

function walkNode(node: Node, segments: XcomSegment[]): void {
  // Text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeSpaces(node.nodeValue ?? "");
    if (text && !isUiLine(text)) {
      segments.push({ type: "text", text });
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  // Skip non-content elements
  if (
    ["script", "style", "svg", "canvas", "button", "nav", "img"].includes(tag)
  )
    return;
  if (el.getAttribute("role") === "button") return;

  // <pre> → code segment (do NOT recurse into children for text)
  if (tag === "pre") {
    const codeEl = el.querySelector("code") ?? el;
    const lang = extractCodeLanguage(codeEl);
    // Preserve original whitespace for code — only normalise NBSP and blank lines
    const rawText = (codeEl.textContent ?? "")
      .replace(/\u00a0/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (rawText && !isUiLine(rawText)) {
      segments.push({ type: "code", code: rawText, lang });
    }
    return;
  }

  // <code> inside <pre> — already handled above, skip
  if (tag === "code" && el.parentElement?.tagName.toLowerCase() === "pre") {
    return;
  }

  // Links
  if (tag === "a") {
    const href = el.getAttribute("href") ?? "";
    const label = normalizeSpaces(el.textContent ?? "");
    if (href && label && !isUiLine(label)) {
      segments.push({ type: "link", href, label });
    }
    return;
  }

  // Recurse into children
  for (const child of Array.from(el.childNodes)) {
    walkNode(child, segments);
  }
}

function extractCodeLanguage(el: Element): string {
  const cls = (el.getAttribute("class") ?? "").toLowerCase();
  const match = cls.match(/language-([a-z0-9+#-]+)/);
  return match ? match[1] : "";
}

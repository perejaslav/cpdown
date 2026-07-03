/**
 * Pure heuristic code detection for X.com text segments.
 * ZERO runtime dependencies — no DOM, no jsdom.
 *
 * Two detection paths:
 * Path A: Language marker line + 2+ following code-like lines
 * Path B: 3+ consecutive lines with strong code indicators
 */

import { normalizeLanguage } from "../markdown/fence";
import { isUiLine } from "./ui-patterns";

const LANGUAGE_MARKERS = new Set([
  "python",
  "bash",
  "sh",
  "shell",
  "json",
  "yaml",
  "yml",
  "javascript",
  "js",
  "typescript",
  "ts",
  "go",
  "rust",
  "ruby",
  "php",
  "java",
  "c",
  "cpp",
  "swift",
  "kotlin",
  "css",
  "html",
  "sql",
  "lua",
  "r",
  "perl",
]);

/**
 * Strong code indicator at start of line.
 * Used by Path B (3+ consecutive strong lines).
 */
const STRONG_CODE_PATTERN =
  /^(import |from |def |class |const |let |var |function |async |await |return |if\s*\(|for\s*\(|while\s*\(|try\s*\{|catch\s*\(|switch\s*\(|curl |npm |git |docker |pip |mkdir |cd |ls |cat |grep |sed |awk |chmod |sudo )/;

/**
 * Broader code-line pattern for individual line detection.
 */
const CODE_LINE_PATTERN =
  /^(import |from |def |class |if |elif |else:|for |while |try:|except |with |return\b|print\(|async |await |const |let |var |function |=>|curl |npm |git |docker |pip |mkdir |cd |ls |cat |grep |sed |awk |chmod |sudo |\s+|[a-zA-Z_][\w_]*\s*=|.*\{$|.*\}$|.*\[$|.*\]$)/;

/**
 * Detect a language marker in a standalone line.
 * Returns the normalized language name or null.
 */
export function detectLanguageMarker(line: string): string | null {
  const cleaned = String(line || "").trim().toLowerCase();
  if (!cleaned) return null;
  const normalized = normalizeLanguage(cleaned);
  if (LANGUAGE_MARKERS.has(normalized)) return normalized;
  return null;
}

/**
 * Strong heuristic: does this single line look like code?
 * Used by Path B which requires 3+ consecutive strong lines.
 */
export function looksLikeCodeLine(line: string): boolean {
  const value = String(line || "").trim();
  if (!value) return false;
  return STRONG_CODE_PATTERN.test(value) || CODE_LINE_PATTERN.test(value);
}

/**
 * Lenient check for lines following a language marker (Path A).
 * When a language marker establishes context, we only reject
 * lines that are empty or clearly UI noise.
 */
function looksLikeCodeLineInContext(line: string): boolean {
  const value = String(line || "").trim();
  if (!value) return false;
  if (isUiLine(value)) return false;
  return true;
}

/**
 * Detect whether an array of lines represents a code block.
 *
 * Path A: first line is a known language marker + at least 2 following
 *         non-empty, non-UI lines → { isCode: true, lang }
 * Path B: at least 3 lines matching strong code indicators
 *         → { isCode: true, lang: "" }
 */
export function detectCodeBlock(lines: string[]): {
  isCode: boolean;
  lang: string;
  skipFirstLine: boolean;
} {
  if (lines.length === 0) return { isCode: false, lang: "", skipFirstLine: false };

  // Path A: language marker + 2+ following lines
  const marker = detectLanguageMarker(lines[0]);
  if (marker && lines.length >= 3) {
    const followingCodeLines = lines
      .slice(1)
      .filter((l) => looksLikeCodeLineInContext(l));
    if (followingCodeLines.length >= 2) {
      return { isCode: true, lang: marker, skipFirstLine: true };
    }
  }

  // Path B: 3+ consecutive strong indicator lines
  if (lines.length >= 3) {
    const strongCount = lines.filter((l) =>
      STRONG_CODE_PATTERN.test(l.trim()),
    ).length;
    if (strongCount >= 3) {
      return { isCode: true, lang: "", skipFirstLine: false };
    }
  }

  return { isCode: false, lang: "", skipFirstLine: false };
}

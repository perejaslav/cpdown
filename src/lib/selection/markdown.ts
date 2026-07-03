/**
 * Pure logic for safe file naming and Markdown escaping.
 * ZERO runtime dependencies.
 */

const FORBIDDEN_CHARS = /[\\/:*?"<>|\x00-\x1f]/g;
const RESERVED_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

export function safeFileName(input: unknown): string {
  const name = String(input ?? "")
    .replace(FORBIDDEN_CHARS, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.]+|[\s.]+$/g, "");

  if (!name) return "selection";

  const upper = name.toUpperCase();
  if (RESERVED_NAMES.has(upper)) return `selection-${name}`;

  return name.slice(0, 120);
}

export function escapeMarkdown(text: string): string {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/[`*_{}[\]()#+\-.!>]/g, "\\$&");
}

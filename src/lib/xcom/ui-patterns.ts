/**
 * Pure logic for detecting UI noise lines in X.com posts.
 * ZERO runtime dependencies.
 */

const UI_LINE_PATTERNS: RegExp[] = [
  /^(reply|replies|repost|reposts|quote|quotes|like|likes|view|views|share|bookmark|bookmarks)$/i,
  /^(follow|following|subscribe|subscribed|sign in|log in|create account|show more|show this thread)$/i,
  /^\d+([.,]\d+)?\s*[kmb]?$/i,
  /^\d+\s+(reply|replies|repost|reposts|quote|quotes|like|likes|view|views)$/i,
];

export function normalizeSpaces(value: unknown): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function isUiLine(line: unknown): boolean {
  const value = normalizeSpaces(line);
  return !value || UI_LINE_PATTERNS.some((pattern) => pattern.test(value));
}

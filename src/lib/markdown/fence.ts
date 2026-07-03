/**
 * Pure logic for code fence generation.
 * ZERO runtime dependencies — no DOM, no window, no chrome, no fetch.
 */

const LANGUAGE_MAP: Record<string, string> = {
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  js: "javascript",
};

export function normalizeLanguage(lang: string): string {
  const cleaned = String(lang || "")
    .toLowerCase()
    .replace(/[`\n\r]/g, "")
    .trim();

  return LANGUAGE_MAP[cleaned] ?? cleaned;
}

function maxBacktickRun(text: string): number {
  let max = 0;
  let current = 0;
  for (const ch of text) {
    if (ch === "`") {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

export function codeFence(code: string, lang = ""): string {
  const text = String(code || "").trim();
  if (!text) return "";

  const fenceLen = Math.max(3, maxBacktickRun(text) + 1);
  const fence = "`".repeat(fenceLen);
  const normalizedLang = normalizeLanguage(lang);

  return `${fence}${normalizedLang}\n${text}\n${fence}`;
}

const WINDOWS_RESERVED = /[<>:"/\\|?*\u0000-\u001F]/g;

export function sanitizeFileName(input: string, fallback = "cpdown", maxLength = 120): string {
  const normalized = String(input || "")
    .normalize("NFKC")
    .replace(WINDOWS_RESERVED, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, maxLength)
    .trim()
    .replace(/[. ]+$/g, "");

  return normalized || fallback;
}

export function withMarkdownExtension(input: string, fallback = "cpdown"): string {
  const base = sanitizeFileName(input.replace(/\.md$/i, ""), fallback);
  return `${base}.md`;
}

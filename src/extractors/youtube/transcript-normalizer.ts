const TIMESTAMP_LINE = /^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{3}\s*-->\s*(?:\d{1,2}:)?\d{1,2}:\d{2}[,.]\d{3}/;
const INDEX_LINE = /^\s*\d+\s*$/;
const TECHNICAL_TAG = /<\/?(?:c(?:\.[^>]*)?|font|ruby|rt|v|lang)[^>]*>/gi;

function decodeEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const hex = entity[1]?.toLowerCase() === "x";
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return entities[entity.toLowerCase()] ?? match;
  });
}

function tokenize(value: string): string[] {
  return value.trim().split(/\s+/u).filter(Boolean);
}

function mergeOverlap(previous: string, next: string): string {
  const left = tokenize(previous);
  const right = tokenize(next);
  const max = Math.min(left.length, right.length, 24);

  for (let size = max; size >= 1; size -= 1) {
    const suffix = left.slice(-size).join(" ").toLocaleLowerCase();
    const prefix = right.slice(0, size).join(" ").toLocaleLowerCase();
    if (suffix === prefix) {
      return [...left, ...right.slice(size)].join(" ");
    }
  }

  return `${previous} ${next}`.trim();
}

function cleanSegment(value: string): string {
  return decodeEntities(value)
    .replace(TECHNICAL_TAG, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\u200B/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

export function extractTranscriptSegments(raw: string): string[] {
  const normalized = String(raw || "").replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n{2,}/);
  const segments: string[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .filter((line) => !INDEX_LINE.test(line) && !TIMESTAMP_LINE.test(line));
    const segment = cleanSegment(lines.join(" "));
    if (segment) segments.push(segment);
  }

  if (!segments.length) {
    for (const line of normalized.split("\n")) {
      if (INDEX_LINE.test(line) || TIMESTAMP_LINE.test(line)) continue;
      const segment = cleanSegment(line);
      if (segment) segments.push(segment);
    }
  }

  return segments;
}

export function normalizeTranscript(raw: string): string {
  const segments = extractTranscriptSegments(raw);
  const merged: string[] = [];

  for (const segment of segments) {
    const previous = merged.at(-1);
    if (!previous) {
      merged.push(segment);
      continue;
    }

    if (previous.toLocaleLowerCase() === segment.toLocaleLowerCase()) continue;
    merged[merged.length - 1] = mergeOverlap(previous, segment);
  }

  return merged
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.!?])\s+(?=[А-ЯA-ZЁ])/g, "$1\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

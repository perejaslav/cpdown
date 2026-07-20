export interface TranscriptSegment {
  text: string;
  startMs?: number;
  durationMs?: number;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function parseSrtTimestamp(value: string): number | undefined {
  const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) return undefined;
  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000 +
    Number(milliseconds)
  );
}

export function parseSrt(input: string): TranscriptSegment[] {
  const blocks = input.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trimEnd());
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;

    const [startRaw, endRaw] = lines[timingIndex].split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const text = decodeEntities(lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, " "))
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;

    const startMs = parseSrtTimestamp(startRaw);
    const endMs = parseSrtTimestamp(endRaw);
    segments.push({
      text,
      startMs,
      durationMs: startMs !== undefined && endMs !== undefined ? Math.max(0, endMs - startMs) : undefined,
    });
  }

  return segments;
}

export function parseTimedTextXml(input: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const tagPattern = /<(?:text|p)\b([^>]*)>([\s\S]*?)<\/(?:text|p)>/gi;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(input))) {
    const attributes = match[1];
    const rawText = match[2]
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    const text = decodeEntities(rawText).replace(/\s+/g, " ").trim();
    if (!text) continue;

    const startMatch = attributes.match(/\bstart="([\d.]+)"/i) ?? attributes.match(/\bt="(\d+)"/i);
    const durationMatch = attributes.match(/\bdur="([\d.]+)"/i) ?? attributes.match(/\bd="(\d+)"/i);
    const startMs = startMatch
      ? attributes.includes(`start="${startMatch[1]}"`)
        ? Math.round(Number(startMatch[1]) * 1000)
        : Number(startMatch[1])
      : undefined;
    const durationMs = durationMatch
      ? attributes.includes(`dur="${durationMatch[1]}"`)
        ? Math.round(Number(durationMatch[1]) * 1000)
        : Number(durationMatch[1])
      : undefined;

    segments.push({ text, startMs, durationMs });
  }

  return segments;
}

export function parseTranscriptPayload(input: string, contentType = ""): TranscriptSegment[] {
  const normalizedType = contentType.toLowerCase();
  if (normalizedType.includes("xml") || /^\s*<\?xml|^\s*<(?:transcript|timedtext|p\b)/i.test(input)) {
    return parseTimedTextXml(input);
  }
  return parseSrt(input);
}

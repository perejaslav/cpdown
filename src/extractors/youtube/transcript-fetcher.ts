import type { CaptionTrack } from "./caption-track-selector";
import { parseTranscriptPayload, type TranscriptSegment } from "./transcript-parser";

export interface TranscriptFetchOptions {
  pot?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

function buildTranscriptUrl(track: CaptionTrack, pot?: string): string {
  const url = new URL(track.baseUrl);
  url.searchParams.set("fmt", "srt");
  url.searchParams.set("c", "WEB");
  if (pot) url.searchParams.set("pot", pot);
  return url.toString();
}

export async function fetchTranscript(
  track: CaptionTrack,
  options: TranscriptFetchOptions = {},
): Promise<TranscriptSegment[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(buildTranscriptUrl(track, options.pot), {
    signal: options.signal,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить субтитры: HTTP ${response.status}`);
  }

  const payload = await response.text();
  const segments = parseTranscriptPayload(payload, response.headers.get("content-type") ?? "");
  if (!segments.length) {
    throw new Error("YouTube вернул пустую или неподдерживаемую расшифровку");
  }

  return segments;
}

export { buildTranscriptUrl };

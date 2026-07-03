/**
 * Pure parsing of YouTube player response for caption data.
 * ZERO runtime dependencies.
 */

import type { CaptionTrack } from "../contracts";

export interface ParsedPlayerData {
  captionTracks: CaptionTrack[];
  videoId: string;
}

export function parsePlayerCaptions(json: unknown): ParsedPlayerData | null {
  if (typeof json !== "object" || json === null) return null;
  const data = json as Record<string, unknown>;

  const videoDetails = data.videoDetails as
    | Record<string, unknown>
    | undefined;
  const videoId = String(videoDetails?.videoId ?? data.videoId ?? "");

  const captions = data.captions as Record<string, unknown> | undefined;
  if (!captions) return { captionTracks: [], videoId };

  const playerCaptionsTracklistRenderer = captions
    .playerCaptionsTracklistRenderer as Record<string, unknown> | undefined;
  if (!playerCaptionsTracklistRenderer)
    return { captionTracks: [], videoId };

  const captionTracks = playerCaptionsTracklistRenderer
    .captionTracks as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
    return { captionTracks: [], videoId };
  }

  return {
    videoId,
    captionTracks: captionTracks.map(normalizeCaptionTrack),
  };
}

function normalizeCaptionTrack(
  track: Record<string, unknown>,
): CaptionTrack {
  return {
    baseUrl: String(track.baseUrl ?? ""),
    languageCode: String(track.languageCode ?? ""),
    languageName: String(
      (track.name as Record<string, unknown> | undefined)?.simpleText ??
        track.languageName ??
        "",
    ),
    kind: normalizeKind(track.kind),
    isTranslatable: Boolean(track.isTranslatable ?? false),
  };
}

function normalizeKind(kind: unknown): CaptionTrack["kind"] {
  if (kind === "asr") return "asr";
  if (kind === "manual" || kind === "external") return "manual";
  return "unknown";
}

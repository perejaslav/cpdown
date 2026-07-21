import type { ExtractionResult } from "../../core/result-types";
import { buildYouTubeExtractionResult } from "../../markdown/youtube-markdown";
import {
  getCaptionTrackName,
  isAutomaticCaptionTrack,
  selectCaptionTrack,
  type CaptionTrack,
  type RequestedCaptionTrack,
} from "./caption-track-selector";
import { assertFreshPlayerResponse, getPlayerVideoId } from "./player-response";
import { fetchTranscript, type TranscriptFetchOptions } from "./transcript-fetcher";
import { normalizeTranscript } from "./transcript-normalizer";
import { parseYouTubeUrl } from "./youtube-url";

interface PlayerResponseLike {
  videoDetails?: {
    videoId?: string;
    id?: string;
    title?: string;
    author?: string;
    channelId?: string;
  };
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
}

export interface YouTubeExtractionInput {
  jobId: string;
  pageUrl: string;
  playerResponse: PlayerResponseLike;
  requestedTrack?: RequestedCaptionTrack;
  pot?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export async function extractYouTube(
  input: YouTubeExtractionInput,
): Promise<ExtractionResult> {
  const normalized = parseYouTubeUrl(input.pageUrl);
  if (!normalized) throw new Error("Неподдерживаемая ссылка YouTube");

  assertFreshPlayerResponse(normalized.videoId, input.playerResponse);

  const details = input.playerResponse.videoDetails;
  const actualVideoId = getPlayerVideoId(input.playerResponse);
  if (!actualVideoId) throw new Error("В данных проигрывателя отсутствует videoId");

  const tracks =
    input.playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const selectedTrack = selectCaptionTrack(tracks, input.requestedTrack);
  if (!selectedTrack) throw new Error("Для этого видео нет доступных субтитров");

  const fetchOptions: TranscriptFetchOptions = {
    pot: input.pot,
    signal: input.signal,
    fetchImpl: input.fetchImpl,
  };
  const segments = await fetchTranscript(selectedTrack, fetchOptions);
  const transcript = normalizeTranscript(segments.map((segment) => segment.text).join("\n\n"));
  if (!transcript) throw new Error("После очистки расшифровка оказалась пустой");

  return buildYouTubeExtractionResult({
    jobId: input.jobId,
    title: details?.title?.trim() || "YouTube Video",
    channel: details?.author?.trim() || undefined,
    sourceUrl: normalized.normalizedUrl,
    videoId: actualVideoId,
    languageName: getCaptionTrackName(selectedTrack),
    isAutomatic: isAutomaticCaptionTrack(selectedTrack),
    transcript,
    warnings:
      input.requestedTrack && selectedTrack.languageCode !== input.requestedTrack.languageCode
        ? ["Запрошенная дорожка недоступна; использована ближайшая подходящая"]
        : [],
  });
}

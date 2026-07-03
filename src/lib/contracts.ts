/**
 * Shared type contracts for cpdown.
 * This file has ZERO runtime dependencies — types only.
 *
 * ⚠️ PRIVACY PROHIBITION:
 * DiagnosticEvent must NEVER contain: page URL, tab title, page text,
 * subtitles/captions, HTML source, auth tokens, or YouTube API responses.
 * Only the fields defined below (code, area, occurredAt) are allowed.
 */

export type Result<T, E extends string> =
  | { ok: true; value: T }
  | { ok: false; code: E; detail?: string };

export interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  languageName: string;
  kind: "manual" | "asr" | "unknown";
  isTranslatable: boolean;
}

export type DiagnosticCode =
  | "TAB_RELOAD_REQUIRED"
  | "PAGE_RESTRICTED"
  | "YOUTUBE_NO_CAPTIONS"
  | "YOUTUBE_PLAYER_TIMEOUT"
  | "YOUTUBE_TRACK_NOT_FOUND"
  | "YOUTUBE_TIMEDTEXT_EMPTY"
  | "YOUTUBE_TIMEDTEXT_REQUEST_FAILED"
  | "YOUTUBE_STALE_RESPONSE"
  | "YOUTUBE_BRIDGE_INVALID_MESSAGE"
  | "XCOM_NOT_FOUND"
  | "COPY_FAILED"
  | "STORAGE_FAILED";

export interface DiagnosticEvent {
  code: DiagnosticCode;
  area: "page" | "selection" | "xcom" | "youtube" | "storage";
  occurredAt: string;
}

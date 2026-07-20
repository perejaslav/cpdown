import type { CaptionTrack, RequestedCaptionTrack } from "./caption-track-selector";

export interface SelectedCaptionTrackDescriptor extends RequestedCaptionTrack {
  name?: string;
  automatic?: boolean;
}

export interface PlayerCaptionState {
  videoId: string;
  selectedTrack?: SelectedCaptionTrackDescriptor;
  playerResponse: unknown;
  pot?: string;
}

export function toSelectedTrackDescriptor(
  track: CaptionTrack | null | undefined,
): SelectedCaptionTrackDescriptor | undefined {
  if (!track) return undefined;

  const name =
    track.name?.simpleText ||
    track.name?.runs?.map((run) => run.text || "").join("") ||
    track.languageCode;

  return {
    languageCode: track.languageCode,
    vssId: track.vssId,
    kind: track.kind,
    name,
    automatic: track.kind === "asr" || track.vssId?.startsWith("a.") === true,
  };
}

export function findSelectedTrackBySettings(
  tracks: CaptionTrack[],
  settings: Record<string, unknown> | null | undefined,
): CaptionTrack | null {
  if (!tracks.length || !settings) return null;

  const preferredVssId =
    typeof settings.vssId === "string"
      ? settings.vssId
      : typeof settings.captionTrack === "string"
        ? settings.captionTrack
        : undefined;

  if (preferredVssId) {
    const exact = tracks.find((track) => track.vssId === preferredVssId);
    if (exact) return exact;
  }

  const languageCode =
    typeof settings.languageCode === "string"
      ? settings.languageCode
      : typeof settings.language === "string"
        ? settings.language
        : undefined;

  if (languageCode) {
    const kind = typeof settings.kind === "string" ? settings.kind : undefined;
    const exactLanguageAndKind = tracks.find(
      (track) => track.languageCode === languageCode && (track.kind || "") === (kind || ""),
    );
    if (exactLanguageAndKind) return exactLanguageAndKind;

    return tracks.find((track) => track.languageCode === languageCode) || null;
  }

  return null;
}

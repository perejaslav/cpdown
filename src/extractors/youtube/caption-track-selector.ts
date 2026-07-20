export interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  vssId?: string;
  kind?: string;
  name?: { simpleText?: string; runs?: Array<{ text?: string }> };
  isTranslatable?: boolean;
}

export interface RequestedCaptionTrack {
  languageCode?: string;
  vssId?: string;
  kind?: string;
}

function sameKind(track: CaptionTrack, requested: RequestedCaptionTrack): boolean {
  return (track.kind || "") === (requested.kind || "");
}

export function selectCaptionTrack(
  tracks: CaptionTrack[],
  requested?: RequestedCaptionTrack,
): CaptionTrack | null {
  if (!tracks.length) return null;

  if (requested?.vssId) {
    const exactVssId = tracks.find((track) => track.vssId === requested.vssId);
    if (exactVssId) return exactVssId;
  }

  if (requested?.languageCode) {
    const exactLanguageAndKind = tracks.find(
      (track) => track.languageCode === requested.languageCode && sameKind(track, requested),
    );
    if (exactLanguageAndKind) return exactLanguageAndKind;

    const exactLanguage = tracks.find((track) => track.languageCode === requested.languageCode);
    if (exactLanguage) return exactLanguage;
  }

  const defaultManual = tracks.find((track) => track.kind !== "asr");
  return defaultManual || tracks[0] || null;
}

export function getCaptionTrackName(track: CaptionTrack): string {
  return (
    track.name?.simpleText ||
    track.name?.runs?.map((run) => run.text || "").join("") ||
    track.languageCode ||
    "Неизвестный язык"
  );
}

export function isAutomaticCaptionTrack(track: CaptionTrack): boolean {
  return track.kind === "asr" || track.vssId?.startsWith("a.") === true;
}

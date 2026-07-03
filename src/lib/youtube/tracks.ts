/**
 * Pure logic for YouTube caption track selection.
 * ZERO runtime dependencies.
 */

import type { CaptionTrack } from "../contracts";

export function normalizeLanguageTag(tag: string): string {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, " ");
}

export function baseLanguage(tag: string): string {
  return normalizeLanguageTag(tag).split("-")[0] ?? "";
}

export function selectTrack(
  tracks: readonly CaptionTrack[],
  preferredLanguages: readonly string[],
): CaptionTrack | null {
  if (!tracks.length) return null;

  const normalized = preferredLanguages.map(normalizeLanguageTag);
  const bases = normalized.map(baseLanguage);

  // 1. manual + exact
  for (const lang of normalized) {
    const found = tracks.find(
      (t) =>
        t.kind === "manual" && normalizeLanguageTag(t.languageCode) === lang,
    );
    if (found) return found;
  }

  // 2. ASR + exact
  for (const lang of normalized) {
    const found = tracks.find(
      (t) =>
        t.kind === "asr" && normalizeLanguageTag(t.languageCode) === lang,
    );
    if (found) return found;
  }

  // 3. manual + base
  for (const base of bases) {
    const found = tracks.find(
      (t) => t.kind === "manual" && baseLanguage(t.languageCode) === base,
    );
    if (found) return found;
  }

  // 4. ASR + base
  for (const base of bases) {
    const found = tracks.find(
      (t) => t.kind === "asr" && baseLanguage(t.languageCode) === base,
    );
    if (found) return found;
  }

  // 5. first manual
  const firstManual = tracks.find((t) => t.kind === "manual");
  if (firstManual) return firstManual;

  // 6. first available (any kind)
  const firstAny = tracks[0];
  if (firstAny) return firstAny;

  // 7. null
  return null;
}

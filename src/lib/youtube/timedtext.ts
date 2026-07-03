/**
 * Pure logic for timedtext URL construction and SRT parsing.
 * ZERO runtime dependencies.
 */

import type { CaptionTrack } from "../contracts";

export interface TimedtextConfig {
  track: CaptionTrack;
  pot: string | null;
}

export function buildTimedtextUrl(config: TimedtextConfig): string {
  let url = config.track.baseUrl + "&fmt=srt&c=WEB";
  if (config.pot) {
    url += "&pot=" + encodeURIComponent(config.pot);
  }
  return url;
}

export function parseSrt(srtText: string): string {
  const lines = String(srtText || "").split("\n");
  const textLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\d+$/.test(trimmed)) continue;
    if (trimmed.includes("-->")) continue;
    textLines.push(trimmed);
  }
  return textLines.join("\n");
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(String(text || "").length / 4);
}

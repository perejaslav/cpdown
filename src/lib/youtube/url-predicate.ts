/**
 * Pure URL matching for YouTube network interception.
 * ZERO DOM/runtime dependencies.
 */

const PLAYER_PATH_PATTERN = /\/youtubei\/v1\/player/;
const TIMEDTEXT_PATH_PATTERN = /\/api\/timedtext/;

export function isPlayerRequest(url: string): boolean {
  try {
    const u = new URL(url);
    return PLAYER_PATH_PATTERN.test(u.pathname);
  } catch {
    return false;
  }
}

export function isTimedTextRequest(url: string): boolean {
  try {
    const u = new URL(url);
    return TIMEDTEXT_PATH_PATTERN.test(u.pathname);
  } catch {
    return false;
  }
}

export function isYouTubeRelevant(url: string): boolean {
  return isPlayerRequest(url) || isTimedTextRequest(url);
}

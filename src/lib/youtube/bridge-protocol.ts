/**
 * Bridge message types and validation.
 * Pure functions — zero runtime dependencies.
 * Used by both MAIN-world bridge and isolated-world bridge client.
 */

export const BRIDGE_CHANNEL = "cpdown-youtube-bridge";

export interface BridgeMessage {
  channel: string;
  type: "BRIDGE_READY" | "PLAYER_RESPONSE" | "TIMEDTEXT_URL";
  navigationId: string;
  videoId?: string;
  requestId?: string;
  payload?: unknown;
  pot?: string | null;
}

export interface PlayerResponsePayload {
  videoId: string;
  captionTracks: Array<{
    baseUrl: string;
    languageCode: string;
    languageName: string;
    kind?: string;
    isTranslatable: boolean;
  }>;
}

export function isValidBridgeMessage(data: unknown): data is BridgeMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  if (msg.channel !== BRIDGE_CHANNEL) return false;
  if (!["BRIDGE_READY", "PLAYER_RESPONSE", "TIMEDTEXT_URL"].includes(String(msg.type))) return false;
  if (typeof msg.navigationId !== "string") return false;
  return true;
}

export function matchesNavigation(msg: BridgeMessage, currentNavigation: string): boolean {
  return msg.navigationId === currentNavigation;
}

export function matchesRequestId(msg: BridgeMessage, expectedRequestId: string): boolean {
  return msg.requestId === expectedRequestId;
}

export function matchesVideoId(msg: BridgeMessage, expectedVideoId: string): boolean {
  return !!(msg.videoId && msg.videoId === expectedVideoId);
}

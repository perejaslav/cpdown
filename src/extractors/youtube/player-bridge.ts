import type { PlayerCaptionState } from "./selected-track";

export const YOUTUBE_BRIDGE_REQUEST = "CPDOWN_YOUTUBE_PLAYER_REQUEST";
export const YOUTUBE_BRIDGE_RESPONSE = "CPDOWN_YOUTUBE_PLAYER_RESPONSE";

export interface YouTubeBridgeRequest {
  type: typeof YOUTUBE_BRIDGE_REQUEST;
  requestId: string;
}

export interface YouTubeBridgeResponse {
  type: typeof YOUTUBE_BRIDGE_RESPONSE;
  requestId: string;
  ok: boolean;
  data?: PlayerCaptionState;
  error?: string;
}

export function isBridgeRequest(value: unknown): value is YouTubeBridgeRequest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.type === YOUTUBE_BRIDGE_REQUEST && typeof record.requestId === "string";
}

export function isBridgeResponse(value: unknown): value is YouTubeBridgeResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === YOUTUBE_BRIDGE_RESPONSE &&
    typeof record.requestId === "string" &&
    typeof record.ok === "boolean"
  );
}

export function createBridgeRequest(requestId: string): YouTubeBridgeRequest {
  return { type: YOUTUBE_BRIDGE_REQUEST, requestId };
}

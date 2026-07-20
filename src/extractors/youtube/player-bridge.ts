import { readPlayerCaptionState } from './player-state-reader';
import type { PlayerCaptionState } from './selected-track';

export const YOUTUBE_BRIDGE_REQUEST = 'CPDOWN_YOUTUBE_PLAYER_REQUEST';
export const YOUTUBE_BRIDGE_RESPONSE = 'CPDOWN_YOUTUBE_PLAYER_RESPONSE';

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

interface YouTubeWindow extends Window {
  ytInitialPlayerResponse?: unknown;
  movie_player?: {
    getPlayerResponse?: () => unknown;
    getOption?: (namespace: string, key: string) => unknown;
  };
}

export function isBridgeRequest(value: unknown): value is YouTubeBridgeRequest {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.type === YOUTUBE_BRIDGE_REQUEST && typeof record.requestId === 'string';
}

export function isBridgeResponse(value: unknown): value is YouTubeBridgeResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    record.type === YOUTUBE_BRIDGE_RESPONSE &&
    typeof record.requestId === 'string' &&
    typeof record.ok === 'boolean'
  );
}

export function createBridgeRequest(requestId: string): YouTubeBridgeRequest {
  return { type: YOUTUBE_BRIDGE_REQUEST, requestId };
}

function getCurrentPlayerResponse(target: YouTubeWindow): unknown {
  return target.movie_player?.getPlayerResponse?.() || target.ytInitialPlayerResponse || null;
}

function getCaptionSettings(target: YouTubeWindow): Record<string, unknown> | null {
  const settings = target.movie_player?.getOption?.('captions', 'track');
  return settings && typeof settings === 'object' ? (settings as Record<string, unknown>) : null;
}

export function installPlayerBridge(target: YouTubeWindow = window as YouTubeWindow): () => void {
  const handler = (event: MessageEvent<unknown>) => {
    if (event.source !== target || !isBridgeRequest(event.data)) return;

    const response: YouTubeBridgeResponse = {
      type: YOUTUBE_BRIDGE_RESPONSE,
      requestId: event.data.requestId,
      ok: false,
    };

    try {
      const playerResponse = getCurrentPlayerResponse(target);
      if (!playerResponse || typeof playerResponse !== 'object') {
        throw new Error('Не удалось получить актуальные данные проигрывателя YouTube');
      }

      response.data = readPlayerCaptionState({
        playerResponse,
        captionSettings: getCaptionSettings(target),
      });
      response.ok = true;
    } catch (error) {
      response.error = error instanceof Error ? error.message : 'Неизвестная ошибка проигрывателя YouTube';
    }

    target.postMessage(response, target.location.origin);
  };

  target.addEventListener('message', handler as EventListener);
  return () => target.removeEventListener('message', handler as EventListener);
}

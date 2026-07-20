import { createJobId } from "../../jobs/job-id";
import {
  createBridgeRequest,
  isBridgeResponse,
  type YouTubeBridgeResponse,
} from "./player-bridge";
import type { PlayerCaptionState } from "./selected-track";

export interface MessageEventTarget {
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  postMessage(message: unknown, targetOrigin: string): void;
}

export function requestPlayerCaptionState(
  target: MessageEventTarget,
  timeoutMs = 5_000,
): Promise<PlayerCaptionState> {
  const requestId = createJobId("yt_bridge");

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      target.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const onMessage = (event: MessageEvent) => {
      const response = event.data as YouTubeBridgeResponse;
      if (!isBridgeResponse(response) || response.requestId !== requestId) return;

      finish(() => {
        if (!response.ok || !response.data) {
          reject(new Error(response.error || "Не удалось получить данные проигрывателя YouTube"));
          return;
        }
        resolve(response.data);
      });
    };

    const timer = setTimeout(() => {
      finish(() => reject(new Error("Истекло время ожидания данных проигрывателя YouTube")));
    }, timeoutMs);

    target.addEventListener("message", onMessage);
    target.postMessage(createBridgeRequest(requestId), "*");
  });
}

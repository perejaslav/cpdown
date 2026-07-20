import { describe, expect, it } from "vitest";
import { requestPlayerCaptionState } from "../../src/extractors/youtube/player-bridge-client";
import { YOUTUBE_BRIDGE_RESPONSE } from "../../src/extractors/youtube/player-bridge";

class FakeTarget {
  private listeners = new Set<(event: MessageEvent) => void>();

  addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "message", listener: (event: MessageEvent) => void) {
    this.listeners.delete(listener);
  }

  postMessage(message: unknown) {
    const request = message as { requestId: string };

    for (const listener of this.listeners) {
      listener({
        data: {
          type: YOUTUBE_BRIDGE_RESPONSE,
          requestId: "wrong-request",
          ok: true,
          data: { videoId: "wrong", playerResponse: {} },
        },
      } as MessageEvent);
    }

    queueMicrotask(() => {
      for (const listener of this.listeners) {
        listener({
          data: {
            type: YOUTUBE_BRIDGE_RESPONSE,
            requestId: request.requestId,
            ok: true,
            data: { videoId: "correct", playerResponse: {} },
          },
        } as MessageEvent);
      }
    });
  }
}

describe("requestPlayerCaptionState", () => {
  it("ignores responses for another request", async () => {
    await expect(requestPlayerCaptionState(new FakeTarget(), 100)).resolves.toMatchObject({
      videoId: "correct",
    });
  });

  it("rejects on timeout", async () => {
    const target = new FakeTarget();
    target.postMessage = () => undefined;

    await expect(requestPlayerCaptionState(target, 1)).rejects.toThrow(/время ожидания/);
  });
});

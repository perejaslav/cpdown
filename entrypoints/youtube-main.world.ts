/**
 * MAIN-world bridge for YouTube network interception.
 * Installed on YouTube pages to capture player response and timedtext.
 * Communicates with isolated world via window.postMessage.
 *
 * PRIVACY: Only extracts videoId, captionTracks, and pot from timedtext URLs.
 * Does NOT read or forward entire network responses.
 */

import { isPlayerRequest, isTimedTextRequest } from "../src/lib/youtube/url-predicate";
import { parsePlayerCaptions } from "../src/lib/youtube/parse-player-response";
import { parsePotFromTimedTextUrl } from "../src/lib/youtube/pot";

const CPDOWN_CHANNEL = "cpdown-youtube-bridge";

// Guard against double installation
if (!(window as any).__cpdownYoutubeBridgeInstalled) {
  (window as any).__cpdownYoutubeBridgeInstalled = true;

  const currentNavigationId = (): string => {
    try {
      return `${location.pathname}${location.search}${location.hash}`;
    } catch {
      return "";
    }
  };

  // ---- Shared state ----
  let capturedPot: string | null = null;
  let playerResponseReceived = false;

  // ---- fetch interception ----
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : input instanceof URL
            ? input.href
            : "";

    if (isPlayerRequest(url)) {
      const response = await originalFetch(input, init);
      // Clone so we can read the body without consuming the original
      const clone = response.clone();
      try {
        const json = await clone.json();
        const parsed = parsePlayerCaptions(json);
        if (parsed && parsed.captionTracks.length > 0) {
          playerResponseReceived = true;
          window.postMessage(
            {
              channel: CPDOWN_CHANNEL,
              type: "PLAYER_RESPONSE" as const,
              navigationId: currentNavigationId(),
              videoId: parsed.videoId,
              payload: {
                captionTracks: parsed.captionTracks,
                videoId: parsed.videoId,
              },
              pot: capturedPot,
            },
            "*",
          );
        }
      } catch {
        // Silently ignore parse errors — the response is still returned intact
      }
      return response;
    }

    if (isTimedTextRequest(url)) {
      // Capture pot from timedtext URL
      const pot = parsePotFromTimedTextUrl(url);
      if (pot !== null) {
        capturedPot = pot;
        window.postMessage(
          {
            channel: CPDOWN_CHANNEL,
            type: "TIMEDTEXT_URL" as const,
            navigationId: currentNavigationId(),
            payload: { url },
            pot,
          },
          "*",
        );
      }
    }

    return originalFetch(input, init);
  };

  // ---- XHR interception ----
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    user?: string | null,
    password?: string | null,
  ): void {
    const urlStr =
      typeof url === "string"
        ? url
        : url instanceof URL
          ? url.href
          : "";
    (this as any).__cpdownUrl = urlStr;
    return originalXHROpen.call(
      this,
      method,
      url,
      async ?? true,
      user ?? null,
      password ?? null,
    );
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const url = ((this as any).__cpdownUrl as string) || "";

    if (isTimedTextRequest(url)) {
      const pot = parsePotFromTimedTextUrl(url);
      if (pot !== null) {
        capturedPot = pot;
      }
    }

    if (isPlayerRequest(url)) {
      this.addEventListener("load", () => {
        try {
          const json = JSON.parse(this.responseText);
          const parsed = parsePlayerCaptions(json);
          if (parsed && parsed.captionTracks.length > 0) {
            playerResponseReceived = true;
            window.postMessage(
              {
                channel: CPDOWN_CHANNEL,
                type: "PLAYER_RESPONSE" as const,
                navigationId: currentNavigationId(),
                videoId: parsed.videoId,
                payload: {
                  captionTracks: parsed.captionTracks,
                  videoId: parsed.videoId,
                },
                pot: capturedPot,
              },
              "*",
            );
          }
        } catch {
          // Silently ignore parse errors
        }
      });
    }

    return originalXHRSend.call(this, body);
  };

  // Signal ready
  window.postMessage(
    {
      channel: CPDOWN_CHANNEL,
      type: "BRIDGE_READY" as const,
      navigationId: currentNavigationId(),
      videoId: "",
    },
    "*",
  );
}

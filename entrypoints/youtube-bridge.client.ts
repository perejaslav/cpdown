/**
 * Isolated-world YouTube bridge client.
 * Listens to MAIN-world bridge messages, selects caption tracks, fetches timedtext.
 */

import { selectTrack } from "../src/lib/youtube/tracks";
import { parsePotFromTimedTextUrl } from "../src/lib/youtube/pot";
import type { CaptionTrack } from "../src/lib/contracts";
import { BRIDGE_CHANNEL, isValidBridgeMessage, matchesNavigation, matchesRequestId, matchesVideoId } from "../src/lib/youtube/bridge-protocol";

const TIMEOUT_MS = 8000;
const RETRY_TIMEOUT_MS = 8000;

interface State {
  channel: string;
  navigationId: string;
  videoId: string;
  pot: string | null;
  bridgeReady: boolean;
}

let state: State = {
  channel: "",
  navigationId: currentNavigation(),
  videoId: currentVideoId(),
  pot: null,
  bridgeReady: false,
};

function currentNavigation(): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

function currentVideoId(): string {
  try {
    return new URLSearchParams(location.search).get("v") || "";
  } catch {
    return "";
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseSrt(text: string): string {
  const lines = text.split("\n");
  const textLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^\d+$/.test(trimmed) || trimmed.includes("-->")) continue;
    textLines.push(trimmed);
  }
  return textLines.join("\n");
}

function extractTimedTextUrl(track: CaptionTrack, pot: string | null): string {
  let url = track.baseUrl + "&fmt=srt&c=WEB";
  if (pot) url += "&pot=" + encodeURIComponent(pot);
  return url;
}

async function fetchTimedtext(url: string): Promise<{ ok: true; text: string } | { ok: false; code: string }> {
  try {
    const response = await fetch(url);
    if (!response.ok) return { ok: false, code: "YOUTUBE_TIMEDTEXT_REQUEST_FAILED" };
    const text = await response.text();
    if (!text.trim()) return { ok: false, code: "YOUTUBE_TIMEDTEXT_EMPTY" };
    return { ok: true, text };
  } catch {
    return { ok: false, code: "YOUTUBE_TIMEDTEXT_REQUEST_FAILED" };
  }
}

async function waitForPlayerResponse(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!isValidBridgeMessage(data)) return;
      if (!matchesNavigation(data, state.navigationId)) return;
      if (data.type !== "PLAYER_RESPONSE") return;

      clearTimeout(timer);
      window.removeEventListener("message", handler);

      const payload = data.payload as any;
      if (!payload?.captionTracks?.length) {
        chrome.runtime.sendMessage({
          type: "TRANSCRIPT_RESULT",
          payload: { error: null, diagnosticCode: "YOUTUBE_NO_CAPTIONS" },
        });
        resolve(false);
        return;
      }

      const tracks: CaptionTrack[] = payload.captionTracks.map((t: any) => ({
        baseUrl: t.baseUrl,
        languageCode: t.languageCode,
        languageName: t.languageName,
        kind: t.kind || "unknown",
        isTranslatable: !!t.isTranslatable,
      }));

      const selected = selectTrack(tracks, navigator.languages);

      if (!selected) {
        chrome.runtime.sendMessage({
          type: "TRANSCRIPT_RESULT",
          payload: { error: null, diagnosticCode: "YOUTUBE_TRACK_NOT_FOUND" },
        });
        resolve(false);
        return;
      }

      // Fetch timedtext
      const timedtextUrl = extractTimedTextUrl(selected, data.pot || state.pot);
      fetchTimedtext(timedtextUrl).then((result) => {
        if (!result.ok) {
          chrome.runtime.sendMessage({
            type: "TRANSCRIPT_RESULT",
            payload: { error: null, diagnosticCode: result.code },
          });
          resolve(false);
          return;
        }

        const plainText = parseSrt(result.text);
        const markdown = `# ${payload.videoId}\n\n${plainText}`;
        const tokenCount = Math.ceil(markdown.length / 4);

        chrome.runtime.sendMessage({
          type: "TRANSCRIPT_RESULT",
          payload: { markdown, tokenCount, videoId: payload.videoId },
        });
        resolve(true);
      });

      resolve(true);
    };

    window.addEventListener("message", handler);
  });
}

function listenForBridgeReady(): Promise<void> {
  return new Promise((resolve) => {
    if (state.bridgeReady) {
      resolve();
      return;
    }

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!isValidBridgeMessage(data)) return;
      if (data.type !== "BRIDGE_READY") return;
      if (!matchesNavigation(data, state.navigationId)) return;

      window.removeEventListener("message", handler);
      state.bridgeReady = true;
      state.channel = data.channel || BRIDGE_CHANNEL;
      resolve();
    };

    window.addEventListener("message", handler);

    // Timeout — resolve anyway, bridge might already have data
    setTimeout(() => resolve(), 3000);
  });
}

export async function extractTranscript(): Promise<void> {
  const nav = currentNavigation();
  const vid = currentVideoId();

  if (state.navigationId !== nav) {
    // SPA navigation — reset state
    state.navigationId = nav;
    state.videoId = vid;
    state.bridgeReady = false;
  }

  state.videoId = vid;

  await listenForBridgeReady();

  const success = await waitForPlayerResponse(TIMEOUT_MS);

  if (!success) {
    // One retry after SPA navigation update
    state.navigationId = currentNavigation();
    state.videoId = currentVideoId();
    const retrySuccess = await waitForPlayerResponse(RETRY_TIMEOUT_MS);

    if (!retrySuccess) {
      chrome.runtime.sendMessage({
        type: "TRANSCRIPT_RESULT",
        payload: { error: null, diagnosticCode: "YOUTUBE_PLAYER_TIMEOUT" },
      });
    }
  }
}

// Listen for extraction trigger
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EXTRACT_YOUTUBE_TRANSCRIPT") {
    extractTranscript().catch((err) => {
      chrome.runtime.sendMessage({
        type: "TRANSCRIPT_RESULT",
        payload: { error: "Internal error", diagnosticCode: "YOUTUBE_BRIDGE_INVALID_MESSAGE" },
      });
    });
    sendResponse({ ok: true });
  }
});

import { describe, it, expect } from "vitest";
import { isValidBridgeMessage, matchesNavigation, matchesRequestId, matchesVideoId, BRIDGE_CHANNEL } from "../../../src/lib/youtube/bridge-protocol";

describe("isValidBridgeMessage", () => {
  it("accepts valid BRIDGE_READY", () => {
    expect(isValidBridgeMessage({ channel: BRIDGE_CHANNEL, type: "BRIDGE_READY", navigationId: "/watch?v=abc" })).toBe(true);
  });

  it("accepts valid PLAYER_RESPONSE", () => {
    expect(isValidBridgeMessage({ channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE", navigationId: "/watch?v=abc", requestId: "r1", videoId: "abc" })).toBe(true);
  });

  it("rejects message with wrong channel", () => {
    expect(isValidBridgeMessage({ channel: "other", type: "BRIDGE_READY", navigationId: "nav" })).toBe(false);
  });

  it("rejects message with unknown type", () => {
    expect(isValidBridgeMessage({ channel: BRIDGE_CHANNEL, type: "UNKNOWN", navigationId: "nav" })).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidBridgeMessage("string")).toBe(false);
    expect(isValidBridgeMessage(null)).toBe(false);
  });

  it("rejects message missing navigationId", () => {
    expect(isValidBridgeMessage({ channel: BRIDGE_CHANNEL, type: "BRIDGE_READY" })).toBe(false);
  });
});

describe("matchesNavigation", () => {
  it("returns true when navigation matches", () => {
    const msg = { channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE" as const, navigationId: "/watch?v=abc", requestId: "r1" };
    expect(matchesNavigation(msg, "/watch?v=abc")).toBe(true);
  });

  it("returns false when navigation differs", () => {
    const msg = { channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE" as const, navigationId: "/watch?v=old" };
    expect(matchesNavigation(msg, "/watch?v=new")).toBe(false);
  });
});

describe("matchesRequestId", () => {
  it("returns true when requestId matches", () => {
    const msg = { channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE" as const, navigationId: "nav", requestId: "r1" };
    expect(matchesRequestId(msg, "r1")).toBe(true);
  });

  it("returns false when requestId differs", () => {
    const msg = { channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE" as const, navigationId: "nav", requestId: "r1" };
    expect(matchesRequestId(msg, "r2")).toBe(false);
  });
});

describe("matchesVideoId", () => {
  it("returns true when videoId matches", () => {
    const msg = { channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE" as const, navigationId: "nav", videoId: "abc" };
    expect(matchesVideoId(msg, "abc")).toBe(true);
  });

  it("returns false when videoId differs", () => {
    const msg = { channel: BRIDGE_CHANNEL, type: "PLAYER_RESPONSE" as const, navigationId: "nav", videoId: "abc" };
    expect(matchesVideoId(msg, "xyz")).toBe(false);
  });
});

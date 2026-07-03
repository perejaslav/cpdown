import { describe, it, expect } from "vitest";

// Tests that verify the module imports work and types are consistent
describe("YouTube capture flow module integrity", () => {
  it("all youtube lib modules can be imported without errors", async () => {
    await expect(import("../../../src/lib/youtube/pot")).resolves.toBeDefined();
    await expect(import("../../../src/lib/youtube/tracks")).resolves.toBeDefined();
    await expect(import("../../../src/lib/youtube/timedtext")).resolves.toBeDefined();
    await expect(import("../../../src/lib/youtube/url-predicate")).resolves.toBeDefined();
    await expect(import("../../../src/lib/youtube/parse-player-response")).resolves.toBeDefined();
    await expect(import("../../../src/lib/youtube/bridge-protocol")).resolves.toBeDefined();
  });
});

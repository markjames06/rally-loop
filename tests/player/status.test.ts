import { describe, expect, it } from "vitest";

import { getPlayerSessionStatusLabel } from "../../shared/player/status";

describe("player current-session status", () => {
  it("shows the player's queue position when it is available", () => {
    expect(
      getPlayerSessionStatusLabel({
        queuePosition: 3,
        queueStatus: "waiting",
        queueUnavailable: false,
      }),
    ).toBe("You are number 3 in line");
  });

  it("shows an in-progress match ahead of queue details", () => {
    expect(
      getPlayerSessionStatusLabel({
        matchStatus: "in_progress",
        queuePosition: null,
        queueStatus: "assigned",
        queueUnavailable: false,
      }),
    ).toBe("Match in progress");
  });

  it("does not describe a missing queue snapshot as an empty queue", () => {
    expect(
      getPlayerSessionStatusLabel({
        queuePosition: null,
        queueStatus: "waiting",
        queueUnavailable: true,
      }),
    ).toBe("Queue status unavailable");
  });

  it("reports an assigned entry when match details could not be loaded", () => {
    expect(
      getPlayerSessionStatusLabel({
        queuePosition: null,
        queueStatus: "assigned",
        queueUnavailable: false,
      }),
    ).toBe("Match details unavailable");
  });
});

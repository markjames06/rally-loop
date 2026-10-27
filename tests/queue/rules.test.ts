import { describe, expect, it } from "vitest";

import {
  canJoinQueue,
  canRejoinQueue,
  canWithdrawEntry,
  validateSkipReason,
} from "../../shared/queue/rules";

describe("queue lifecycle rules", () => {
  it("only allows joining an open session", () => {
    expect(canJoinQueue("open")).toBe(true);
    expect(canJoinQueue("draft")).toBe(false);
    expect(canJoinQueue("paused")).toBe(false);
    expect(canJoinQueue("closed")).toBe(false);
    expect(canJoinQueue("completed")).toBe(false);
  });

  it("allows players to withdraw only waiting entries", () => {
    expect(canWithdrawEntry("waiting")).toBe(true);
    expect(canWithdrawEntry("assigned")).toBe(false);
    expect(canWithdrawEntry("withdrawn")).toBe(false);
    expect(canWithdrawEntry("skipped")).toBe(false);
  });

  it("allows a new entry after a previous entry is terminal", () => {
    expect(canRejoinQueue("withdrawn")).toBe(true);
    expect(canRejoinQueue("skipped")).toBe(true);
    expect(canRejoinQueue("played")).toBe(true);
    expect(canRejoinQueue("waiting")).toBe(false);
    expect(canRejoinQueue("assigned")).toBe(false);
  });

  it("requires a short, meaningful staff skip reason", () => {
    expect(validateSkipReason("Please wait for next round")).toBeNull();
    expect(validateSkipReason("  no ")).not.toBeNull();
    expect(validateSkipReason("x".repeat(501))).not.toBeNull();
  });
});

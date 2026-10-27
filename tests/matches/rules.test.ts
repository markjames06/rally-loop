import { describe, expect, it } from "vitest";

import {
  canAssignMatch,
  canCancelMatch,
  canCompleteMatch,
  canStartMatch,
  validateCancellationReason,
  validateMatchNotes,
} from "../../shared/matches/rules";

describe("match lifecycle rules", () => {
  it("only assigns a match to an available court in an open session", () => {
    expect(canAssignMatch("open", "available")).toBe(true);
    expect(canAssignMatch("paused", "available")).toBe(false);
    expect(canAssignMatch("open", "occupied")).toBe(false);
    expect(canAssignMatch("open", "inactive")).toBe(false);
  });

  it("only starts an assigned match in an open or paused session", () => {
    expect(canStartMatch("assigned", "open")).toBe(true);
    expect(canStartMatch("assigned", "paused")).toBe(true);
    expect(canStartMatch("assigned", "closed")).toBe(false);
    expect(canStartMatch("in_progress", "open")).toBe(false);
  });

  it("only completes in-progress matches and cancels active matches", () => {
    expect(canCompleteMatch("in_progress")).toBe(true);
    expect(canCompleteMatch("assigned")).toBe(false);
    expect(canCancelMatch("assigned")).toBe(true);
    expect(canCancelMatch("in_progress")).toBe(true);
    expect(canCancelMatch("completed")).toBe(false);
    expect(canCancelMatch("cancelled")).toBe(false);
  });

  it("validates optional match notes", () => {
    expect(validateMatchNotes("")).toBeNull();
    expect(validateMatchNotes("A fair game")).toBeNull();
    expect(validateMatchNotes("x".repeat(501))).not.toBeNull();
  });

  it("requires a meaningful cancellation reason", () => {
    expect(validateCancellationReason("Court maintenance")).toBeNull();
    expect(validateCancellationReason("  no ")).not.toBeNull();
    expect(validateCancellationReason("x".repeat(501))).not.toBeNull();
  });
});

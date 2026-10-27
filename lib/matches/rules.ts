import type {
  CourtStatus,
  MatchStatus,
  SessionStatus,
} from "@/types/database";

export function canAssignMatch(
  sessionStatus: SessionStatus,
  courtStatus: CourtStatus,
): boolean {
  return sessionStatus === "open" && courtStatus === "available";
}

export function canStartMatch(
  status: MatchStatus,
  sessionStatus: SessionStatus,
): boolean {
  return (
    status === "assigned" &&
    (sessionStatus === "open" || sessionStatus === "paused")
  );
}

export function canCompleteMatch(status: MatchStatus): boolean {
  return status === "in_progress";
}

export function canCancelMatch(status: MatchStatus): boolean {
  return status === "assigned" || status === "in_progress";
}

export function validateMatchNotes(notes: string): string | null {
  if (notes.trim().length > 500) {
    return "Match notes cannot exceed 500 characters.";
  }
  return null;
}

export function validateCancellationReason(reason: string): string | null {
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3 || trimmedReason.length > 500) {
    return "Enter a cancellation reason between 3 and 500 characters.";
  }
  return null;
}

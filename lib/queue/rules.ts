import type { QueueEntryStatus, SessionStatus } from "@/types/database";

export function canJoinQueue(status: SessionStatus): boolean {
  return status === "open";
}

export function validateSkipReason(reason: string): string | null {
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3 || trimmedReason.length > 500) {
    return "Enter a reason between 3 and 500 characters.";
  }

  return null;
}
export function canWithdrawEntry(status: QueueEntryStatus): boolean {
  return status === "waiting";
}

export function canRejoinQueue(status: QueueEntryStatus): boolean {
  return (
    status === "withdrawn" ||
    status === "skipped" ||
    status === "played"
  );
}

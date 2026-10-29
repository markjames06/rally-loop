import type { MatchStatus, QueueEntryStatus } from "@/shared/types/database";

type PlayerSessionStatusInput = {
  matchStatus?: MatchStatus;
  queueStatus?: QueueEntryStatus;
  queuePosition: number | null;
  queueUnavailable: boolean;
};

export function getPlayerSessionStatusLabel({
  matchStatus,
  queueStatus,
  queuePosition,
  queueUnavailable,
}: PlayerSessionStatusInput): string {
  if (matchStatus === "in_progress") return "Match in progress";
  if (matchStatus === "assigned") return "Court assigned";
  if (queueStatus === "assigned") return "Match details unavailable";
  if (queueUnavailable) return "Queue status unavailable";
  if (queuePosition !== null) return `You are number ${queuePosition} in line`;
  return "You are in this session queue";
}

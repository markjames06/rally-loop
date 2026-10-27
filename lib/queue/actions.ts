"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser, requireFacilityRole } from "@/lib/auth/guards";
import { isUuid } from "@/lib/facilities/validation";
import { validateSkipReason } from "@/lib/queue/rules";
import { createClient } from "@/lib/supabase/server";

export type QueueActionState = {
  error?: string;
  notice?: string;
};

function revalidateQueuePaths(sessionId: string): void {
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/sessions");
  revalidatePath("/player");
}

function queueErrorMessage(
  operation: "join" | "leave" | "skip",
  code: string,
  message: string,
): string {
  if (code === "23505") {
    return "You already have an active place in this queue.";
  }
  if (code === "42501") {
    return "You are not authorized to perform this queue action.";
  }
  if (message.includes("not open for queue joins")) {
    return "This session is not open for queue joins.";
  }
  if (message.includes("Only a waiting queue entry can be withdrawn")) {
    return "Only a waiting queue entry can be withdrawn.";
  }
  if (message.includes("do not have an active queue place")) {
    return "You do not have an active place in this queue.";
  }
  if (message.includes("Only a waiting queue entry can be skipped")) {
    return "Only a waiting queue entry can be skipped.";
  }
  if (message.includes("Enter a reason between")) {
    return "Enter a reason between 3 and 500 characters.";
  }

  return operation === "skip"
    ? "Queue entry could not be skipped. Refresh and try again."
    : operation === "leave"
      ? "Queue entry could not be withdrawn. Refresh and try again."
      : "Could not join this queue. Refresh and try again.";
}

export async function joinQueueAction(
  sessionId: string,
  previousState: QueueActionState,
  formData: FormData,
): Promise<QueueActionState> {
  void previousState;
  void formData;

  if (!isUuid(sessionId)) {
    return { error: "This session could not be found." };
  }

  await requireAuthenticatedUser(`/sessions/${sessionId}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_queue", {
    _session_id: sessionId,
  });

  if (error) {
    console.error("Could not join session queue.", error.code);
    return {
      error: queueErrorMessage("join", error.code, error.message),
    };
  }
  if (!data) {
    return { error: "Could not confirm your place in the queue. Refresh and try again." };
  }

  revalidateQueuePaths(sessionId);
  return { notice: "You joined the queue." };
}

export async function leaveQueueAction(
  sessionId: string,
  previousState: QueueActionState,
  formData: FormData,
): Promise<QueueActionState> {
  void previousState;
  void formData;

  if (!isUuid(sessionId)) {
    return { error: "This session could not be found." };
  }

  await requireAuthenticatedUser(`/sessions/${sessionId}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("leave_queue", {
    _session_id: sessionId,
  });

  if (error) {
    console.error("Could not leave session queue.", error.code);
    return {
      error: queueErrorMessage("leave", error.code, error.message),
    };
  }
  if (!data) {
    return { error: "Could not confirm your queue withdrawal. Refresh and try again." };
  }

  revalidateQueuePaths(sessionId);
  return { notice: "You left the queue." };
}

export async function skipQueueEntryAction(
  facilityId: string,
  sessionId: string,
  entryId: string,
  _previousState: QueueActionState,
  formData: FormData,
): Promise<QueueActionState> {
  if (!isUuid(facilityId) || !isUuid(sessionId) || !isUuid(entryId)) {
    return { error: "This queue entry could not be found." };
  }

  await requireFacilityRole(
    facilityId,
    ["admin", "staff"],
    `/management/${facilityId}`,
  );

  const reasonValue = formData.get("reason");
  const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";
  const validationError = validateSkipReason(reason);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("skip_queue_entry", {
    _session_id: sessionId,
    _entry_id: entryId,
    _reason: reason,
  });

  if (error) {
    console.error("Could not skip queue entry.", error.code);
    return {
      error: queueErrorMessage("skip", error.code, error.message),
    };
  }
  if (!data) {
    return { error: "Could not confirm the queue change. Refresh and try again." };
  }

  revalidatePath(`/management/${facilityId}`);
  revalidateQueuePaths(sessionId);
  return { notice: "Player skipped and the reason was recorded." };
}

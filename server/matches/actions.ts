"use server";

import { revalidatePath } from "next/cache";

import { requireFacilityRole } from "@/server/auth/guards";
import { isUuid } from "@/shared/facilities/validation";
import {
  validateCancellationReason,
  validateMatchNotes,
} from "@/shared/matches/rules";
import { createClient } from "@/server/supabase/server";

export type MatchActionState = {
  error?: string;
  notice?: string;
};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateMatchPaths(facilityId: string, sessionId: string): void {
  revalidatePath(`/management/${facilityId}`);
  revalidatePath(`/management/${facilityId}/sessions`);
  revalidatePath(`/management/${facilityId}/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/player");
}

function matchErrorMessage(message: string): string {
  if (message.includes("Not enough eligible waiting players")) {
    return "Not enough eligible players are waiting to fill this match.";
  }
  if (message.includes("active match")) {
    return "A selected player already has an active match. Refresh and try again.";
  }
  if (message.includes("available court")) {
    return "That court is no longer available. Refresh and choose another court.";
  }
  if (message.includes("assigned to this session")) {
    return "Choose a court assigned to this session.";
  }
  if (message.includes("Only an assigned match can be started")) {
    return "Only an assigned match can be started.";
  }
  if (message.includes("Only an in-progress match can be completed")) {
    return "Only an in-progress match can be completed.";
  }
  if (message.includes("Only an active match can be cancelled")) {
    return "This match is no longer active.";
  }
  if (message.includes("cancellation reason")) {
    return "Enter a cancellation reason between 3 and 500 characters.";
  }
  if (message.includes("Match notes cannot exceed")) {
    return "Match notes cannot exceed 500 characters.";
  }
  if (message.includes("staff access is required")) {
    return "Facility staff access is required for this action.";
  }
  if (message.includes("open session")) {
    return "Matches can only be assigned while the session is open.";
  }
  if (message.includes("can only start while")) {
    return "A match can only start while the session is open or paused.";
  }
  if (message.includes("was not found")) {
    return "The match, session, or court could not be found.";
  }
  if (message.includes("42501")) {
    return "You are not authorized to perform this match action.";
  }
  return "The match action could not be completed. Refresh and try again.";
}

async function runMatchAction(
  facilityId: string,
  sessionId: string,
  operation: "assign" | "start" | "complete" | "cancel",
  action: (
    supabase: Awaited<ReturnType<typeof createClient>>,
  ) => Promise<{ data: string | null; error: { code: string; message: string } | null }>,
): Promise<MatchActionState> {
  if (!isUuid(facilityId) || !isUuid(sessionId)) {
    return { error: "This session could not be found." };
  }

  await requireFacilityRole(
    facilityId,
    ["admin", "staff"],
    `/management/${facilityId}`,
  );

  const supabase = await createClient();
  const { data, error } = await action(supabase);

  if (error) {
    console.error(`Could not ${operation} match.`, error.code);
    return { error: matchErrorMessage(error.message) };
  }
  if (!data) {
    return { error: "The match change could not be confirmed. Refresh and try again." };
  }

  revalidateMatchPaths(facilityId, sessionId);
  const notices = {
    assign: "Players assigned to the court.",
    start: "Match started.",
    complete: "Match completed and court released.",
    cancel: "Match cancelled; players returned to the queue.",
  } satisfies Record<typeof operation, string>;
  return { notice: notices[operation] };
}

export async function assignNextMatchAction(
  facilityId: string,
  sessionId: string,
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  const courtId = getString(formData, "court_id");
  const notes = getString(formData, "notes");
  if (!isUuid(courtId)) {
    return { error: "Choose an available court for this session." };
  }
  const validationError = validateMatchNotes(notes);
  if (validationError) {
    return { error: validationError };
  }

  return runMatchAction(
    facilityId,
    sessionId,
    "assign",
    async (supabase) =>
      await supabase.rpc("assign_next_match", {
        _session_id: sessionId,
        _court_id: courtId,
        _notes: notes || null,
      }),
  );
}

export async function startMatchAction(
  facilityId: string,
  sessionId: string,
  matchId: string,
  _previousState: MatchActionState,
  _formData: FormData,
): Promise<MatchActionState> {
  void _previousState;
  void _formData;

  if (!isUuid(matchId)) {
    return { error: "This match could not be found." };
  }
  return runMatchAction(
    facilityId,
    sessionId,
    "start",
    async (supabase) =>
      await supabase.rpc("start_match", {
        _session_id: sessionId,
        _match_id: matchId,
      }),
  );
}

export async function completeMatchAction(
  facilityId: string,
  sessionId: string,
  matchId: string,
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  if (!isUuid(matchId)) {
    return { error: "This match could not be found." };
  }
  const notes = getString(formData, "notes");
  const validationError = validateMatchNotes(notes);
  if (validationError) {
    return { error: validationError };
  }

  return runMatchAction(
    facilityId,
    sessionId,
    "complete",
    async (supabase) =>
      await supabase.rpc("complete_match", {
        _session_id: sessionId,
        _match_id: matchId,
        _notes: notes || null,
      }),
  );
}

export async function cancelMatchAction(
  facilityId: string,
  sessionId: string,
  matchId: string,
  _previousState: MatchActionState,
  formData: FormData,
): Promise<MatchActionState> {
  if (!isUuid(matchId)) {
    return { error: "This match could not be found." };
  }
  const reason = getString(formData, "reason");
  const validationError = validateCancellationReason(reason);
  if (validationError) {
    return { error: validationError };
  }

  return runMatchAction(
    facilityId,
    sessionId,
    "cancel",
    async (supabase) =>
      await supabase.rpc("cancel_match", {
        _session_id: sessionId,
        _match_id: matchId,
        _reason: reason,
      }),
  );
}

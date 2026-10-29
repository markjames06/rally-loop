"use server";

import { revalidatePath } from "next/cache";

import { requireFacilityRole } from "@/server/auth/guards";
import {
  isCourtStatus,
  isSessionStatus,
  isUuid,
  validateCourtInput,
  validateFacilitySettings,
  validateSessionInput,
} from "@/shared/facilities/validation";
import { createClient } from "@/server/supabase/server";

export type FacilityActionState = {
  error?: string;
  notice?: string;
};

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateFacilityPages(facilityId: string): void {
  revalidatePath(`/management/${facilityId}`);
  revalidatePath(`/management/${facilityId}/sessions`);
  revalidatePath(`/management/${facilityId}/courts`);
  revalidatePath(`/management/${facilityId}/details`);
  revalidatePath(`/management/${facilityId}/sessions/[sessionId]`, "page");
  revalidatePath("/player");
  revalidatePath("/sessions");
}

export async function updateFacilityAction(
  facilityId: string,
  _previousState: FacilityActionState,
  formData: FormData,
): Promise<FacilityActionState> {
  await requireFacilityRole(
    facilityId,
    ["admin"],
    `/management/${facilityId}`,
  );

  const facility = {
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    address: getString(formData, "address") || null,
    timezone: getString(formData, "timezone"),
  };
  const validationError = validateFacilitySettings(facility);

  if (validationError) {
    return { error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facilities")
    .update(facility)
    .eq("id", facilityId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not update facility settings.", error.code);
    return {
      error:
        error.code === "23505"
          ? "That facility URL is already in use."
          : "Facility settings could not be saved. Check your entries and try again.",
    };
  }
  if (!data) {
    return { error: "This facility could not be found or updated." };
  }

  revalidateFacilityPages(facilityId);
  return { notice: "Facility settings saved." };
}

export async function saveCourtAction(
  facilityId: string,
  courtId: string | null,
  _previousState: FacilityActionState,
  formData: FormData,
): Promise<FacilityActionState> {
  await requireFacilityRole(
    facilityId,
    ["admin"],
    `/management/${facilityId}`,
  );

  const name = getString(formData, "name");
  const sportId = getString(formData, "sport_id");
  const rawStatus = getString(formData, "status");
  const status = courtId === null ? "available" : rawStatus;
  const validationError = validateCourtInput(
    name,
    sportId,
    courtId === null ? undefined : status,
  );

  if (validationError || !isCourtStatus(status)) {
    return { error: validationError ?? "Choose a valid court status." };
  }
  if (courtId !== null && !isUuid(courtId)) {
    return { error: "This court could not be found." };
  }

  const supabase = await createClient();
  const { data: sport, error: sportError } = await supabase
    .from("sports")
    .select("id")
    .eq("id", sportId)
    .eq("is_active", true)
    .maybeSingle();

  if (sportError) {
    console.error("Could not verify the selected sport.", sportError.code);
    return { error: "Sports could not be loaded. Please try again." };
  }
  if (!sport) {
    return { error: "Choose an active sport." };
  }

  const result =
    courtId === null
      ? await supabase
          .from("courts")
          .insert({
            facility_id: facilityId,
            name,
            sport_id: sportId,
            status: "available",
          })
          .select("id")
          .maybeSingle()
      : await supabase
          .from("courts")
          .update({ name, sport_id: sportId, status })
          .eq("id", courtId)
          .eq("facility_id", facilityId)
          .select("id")
          .maybeSingle();

  if (result.error) {
    console.error("Could not save court settings.", result.error.code);
    return {
      error:
        result.error.message.includes("active match")
          ? "This court is reserved by an active match. Finish or cancel the match first."
          : result.error.message.includes("matches_court_id_fkey")
            ? "This court has match history and cannot be deleted."
          : result.error.code === "23505"
          ? "A court with that name already exists at this facility."
          : result.error.code === "23503"
            ? "Remove this court from its sessions before changing its sport."
          : result.error.code === "P0001"
            ? "Close linked open sessions before making this court unavailable."
          : "Court settings could not be saved. Check your entries and try again.",
    };
  }
  if (!result.data) {
    return { error: "This court could not be found or updated." };
  }

  revalidateFacilityPages(facilityId);
  return { notice: courtId === null ? "Court added." : "Court updated." };
}

export async function deleteCourtAction(
  facilityId: string,
  courtId: string,
): Promise<FacilityActionState> {
  await requireFacilityRole(
    facilityId,
    ["admin"],
    `/management/${facilityId}`,
  );

  if (!isUuid(courtId)) {
    return { error: "This court could not be found." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courts")
    .delete()
    .eq("id", courtId)
    .eq("facility_id", facilityId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not delete court.", error.code);
    return {
      error:
        error.code === "23503"
          ? "This court is linked to a session and cannot be deleted."
          : "Court could not be deleted. Please try again.",
    };
  }
  if (!data) {
    return { error: "This court could not be found." };
  }

  revalidateFacilityPages(facilityId);
  return { notice: "Court deleted." };
}

export async function saveSessionAction(
  facilityId: string,
  sessionId: string | null,
  _previousState: FacilityActionState,
  formData: FormData,
): Promise<FacilityActionState> {
  await requireFacilityRole(
    facilityId,
    ["admin"],
    `/management/${facilityId}`,
  );

  if (sessionId !== null && !isUuid(sessionId)) {
    return { error: "This session could not be found." };
  }

  const rawCourtIds = formData.getAll("court_ids");
  const courtIds: string[] = [];
  for (const value of rawCourtIds) {
    if (typeof value !== "string") {
      return { error: "Choose valid courts for the session." };
    }
    courtIds.push(value);
  }

  const rawStatus = getString(formData, "status");
  const input = {
    sportId: getString(formData, "sport_id"),
    name: getString(formData, "name"),
    startsAtLocal: getString(formData, "starts_at_local"),
    endsAtLocal: getString(formData, "ends_at_local") || null,
    status: rawStatus,
    playersPerMatch: Number(getString(formData, "players_per_match")),
    courtIds,
  };
  const validationError = validateSessionInput(input);

  if (validationError || !isSessionStatus(rawStatus)) {
    return { error: validationError ?? "Choose a valid session status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_session", {
    _session_id: sessionId,
    _facility_id: facilityId,
    _sport_id: input.sportId,
    _name: input.name,
    _starts_at_local: input.startsAtLocal,
    _ends_at_local: input.endsAtLocal,
    _status: rawStatus,
    _players_per_match: input.playersPerMatch,
    _queue_policy: "fifo",
    _court_ids: input.courtIds,
  });

  if (error) {
    console.error("Could not save session.", error.code);
    return {
      error:
        error.message.includes("active match")
          ? "Finish or cancel active matches before changing this session's courts or setup."
          : error.code === "23505"
          ? "A session with those details already exists."
          : "Session could not be saved. Check its sport, times, status, and courts.",
    };
  }
  if (!data) {
    return { error: "Session could not be saved. Please try again." };
  }

  revalidateFacilityPages(facilityId);
  revalidatePath(`/sessions/${data}`);
  return { notice: sessionId === null ? "Session created." : "Session updated." };
}

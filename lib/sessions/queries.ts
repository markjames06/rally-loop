import { createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/facilities/validation";
import type { Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type SessionRow = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  | "id"
  | "facility_id"
  | "sport_id"
  | "name"
  | "starts_at"
  | "ends_at"
  | "status"
  | "players_per_match"
  | "queue_policy"
>;
type CourtRow = Pick<
  Database["public"]["Tables"]["courts"]["Row"],
  "id" | "facility_id" | "name" | "sport_id" | "status"
>;
type FacilityRow = Pick<
  Database["public"]["Tables"]["facilities"]["Row"],
  "id" | "name" | "slug" | "address" | "timezone"
>;
type SportRow = Pick<
  Database["public"]["Tables"]["sports"]["Row"],
  "id" | "name" | "slug"
>;

export type SessionSummary = {
  session: SessionRow;
  facility: FacilityRow;
  sport: SportRow;
  courts: CourtRow[];
};

type SessionLoadResult = {
  data: SessionSummary[] | null;
  notFound?: boolean;
};

export async function loadOpenSessions(
  supabase: SupabaseClient,
): Promise<SessionLoadResult> {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      "id, facility_id, sport_id, name, starts_at, ends_at, status, players_per_match, queue_policy",
    )
    .eq("status", "open")
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Could not load open sessions.", error.code);
    return { data: null };
  }

  if (!sessions.length) {
    return { data: [] };
  }

  return loadSessionDetails(supabase, sessions);
}

export async function loadOpenSession(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<SessionLoadResult> {
  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      "id, facility_id, sport_id, name, starts_at, ends_at, status, players_per_match, queue_policy",
    )
    .eq("id", sessionId)
    .eq("status", "open")
    .maybeSingle();

  if (error) {
    console.error("Could not load the requested open session.", error.code);
    return { data: null };
  }
  if (!session) {
    return { data: [], notFound: true };
  }

  return loadSessionDetails(supabase, [session]);
}

async function loadSessionDetails(
  supabase: SupabaseClient,
  sessions: SessionRow[],
): Promise<SessionLoadResult> {
  const sessionIds = sessions.map((session) => session.id);
  const facilityIds = [...new Set(sessions.map((session) => session.facility_id))];
  const sportIds = [...new Set(sessions.map((session) => session.sport_id))];
  const [
    { data: facilities, error: facilityError },
    { data: sports, error: sportError },
    { data: links, error: linksError },
  ] = await Promise.all([
    supabase
      .from("facilities")
      .select("id, name, slug, address, timezone")
      .in("id", facilityIds),
    supabase.from("sports").select("id, name, slug").in("id", sportIds),
    supabase
      .from("session_courts")
      .select("session_id, court_id, facility_id, sport_id")
      .in("session_id", sessionIds),
  ]);

  if (facilityError) {
    console.error("Could not load session facilities.", facilityError.code);
  }
  if (sportError) {
    console.error("Could not load session sports.", sportError.code);
  }
  if (linksError) {
    console.error("Could not load session court links.", linksError.code);
  }
  if (facilityError || sportError || linksError) {
    return { data: null };
  }
  if ((facilities ?? []).some((facility) => !isValidTimezone(facility.timezone))) {
    console.error("An open session has an invalid facility timezone.");
    return { data: null };
  }

  const courtIds = [...new Set((links ?? []).map((link) => link.court_id))];
  const courtResult = courtIds.length
    ? await supabase
        .from("courts")
        .select("id, facility_id, name, sport_id, status")
        .in("id", courtIds)
    : { data: [], error: null };

  if (courtResult.error) {
    console.error("Could not load session courts.", courtResult.error.code);
    return { data: null };
  }

  const facilityById = new Map(
    (facilities ?? []).map((facility) => [facility.id, facility]),
  );
  const sportById = new Map(
    (sports ?? []).map((sport) => [sport.id, sport]),
  );
  const courtsById = new Map<string, CourtRow>(
    (courtResult.data ?? []).map((court) => [court.id, court]),
  );

  const summaries: SessionSummary[] = [];
  for (const session of sessions) {
    const facility = facilityById.get(session.facility_id);
    const sport = sportById.get(session.sport_id);
    const sessionLinks = (links ?? []).filter(
      (link) => link.session_id === session.id,
    );
    const sessionCourts = sessionLinks
      .map((link) => courtsById.get(link.court_id))
      .filter((court): court is CourtRow => court !== undefined);

    if (!facility || !sport || sessionCourts.length !== sessionLinks.length) {
      console.error("Open session data is missing a related facility, sport, or court.", {
        sessionId: session.id,
      });
      return { data: null };
    }

    summaries.push({ session, facility, sport, courts: sessionCourts });
  }

  return { data: summaries };
}

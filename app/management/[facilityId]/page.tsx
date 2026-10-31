import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FacilityHub } from "@/components/facilities/facility-hub";
import { requireFacilityRole } from "@/server/auth/guards";
import { createClient } from "@/server/supabase/server";
import { loadSessionMatches } from "@/server/matches/queries";
import { loadSessionQueue } from "@/server/queue/queries";

export const dynamic = "force-dynamic";

type ManagementPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function ManagementPage({ params }: ManagementPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    ["admin", "staff"],
    `/management/${facilityId}`,
  );

  const supabase = await createClient();
  const [facilityResult, sportsResult, courtsResult, sessionsResult, linksResult] =
    await Promise.all([
      supabase
        .from("facilities")
        .select("id, name, slug, address, timezone")
        .eq("id", facilityId)
        .maybeSingle(),
      supabase
        .from("sports")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("courts")
        .select("id, facility_id, name, sport_id, status")
        .eq("facility_id", facilityId)
        .order("name"),
      supabase
        .from("sessions")
        .select("id, facility_id, sport_id, name, starts_at, ends_at, status, players_per_match, queue_policy")
        .eq("facility_id", facilityId)
        .order("starts_at", { ascending: false }),
      supabase
        .from("session_courts")
        .select("session_id, court_id")
        .eq("facility_id", facilityId),
    ]);

  if (facilityResult.error) console.error("Could not load facility.", facilityResult.error.code);
  if (sportsResult.error) console.error("Could not load sports.", sportsResult.error.code);
  if (courtsResult.error) console.error("Could not load courts.", courtsResult.error.code);
  if (sessionsResult.error) console.error("Could not load sessions.", sessionsResult.error.code);
  if (linksResult.error) console.error("Could not load session court links.", linksResult.error.code);

  if (!facilityResult.data && !facilityResult.error) {
    notFound();
  }

  const facility = facilityResult.data;
  const sessions = sessionsResult.data ?? [];
  const courts = courtsResult.data ?? [];
  const sports = sportsResult.data ?? [];
  const sessionCourts = linksResult.data ?? [];

  // Find active session (open or paused) to provide immediate live operational controls
  const primarySession =
    sessions.find((s) => s.status === "open") ??
    sessions.find((s) => s.status === "paused") ??
    null;
  const primarySessionCourtIds = primarySession
    ? sessionCourts
        .filter((link) => link.session_id === primarySession.id)
        .map((l) => l.court_id)
    : [];

  const [queueResult, matchesResult] = primarySession
    ? await Promise.all([
        loadSessionQueue(supabase, primarySession.id, user.id),
        loadSessionMatches(supabase, primarySession.id),
      ])
    : [{ data: null }, { data: null }];

  const loadError = Boolean(
    facilityResult.error || sportsResult.error || courtsResult.error || sessionsResult.error,
  );

  return (
    <AppShell
      facilityName={facility?.name}
      managementHref={`/management/${facilityId}`}
      managementRole={role}
      user={{ email: user.email }}
    >
      {facility ? (
        <FacilityHub
          activeSession={primarySession}
          activeSessionCourtIds={primarySessionCourtIds}
          courts={courts}
          editable={role === "admin"}
          facility={facility}
          loadError={loadError}
          matches={matchesResult.data}
          queueEntries={queueResult.data?.entries ?? null}
          sessions={sessions}
          sports={sports}
        />
      ) : (
        <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-xs" role="alert">
            Facility information could not be loaded. Refresh the page to try again.
          </div>
        </main>
      )}
    </AppShell>
  );
}

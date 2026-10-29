import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FacilitySessionOperations, type SessionWithCourts } from "@/components/facilities/facility-setup";
import { SessionRealtime } from "@/components/realtime/session-realtime";
import { requireFacilityRole } from "@/server/auth/guards";
import { loadSessionMatches } from "@/server/matches/queries";
import { loadSessionQueue } from "@/server/queue/queries";
import { createClient } from "@/server/supabase/server";
import { formatFacilityDateTime, toLocalDateTimeInput } from "@/shared/facilities/datetime";
import { isUuid, isValidTimezone } from "@/shared/facilities/validation";

export const dynamic = "force-dynamic";

type SessionOperationsPageProps = {
  params: Promise<{ facilityId: string; sessionId: string }>;
};

export default async function SessionOperationsPage({ params }: SessionOperationsPageProps) {
  const { facilityId, sessionId } = await params;
  const returnPath = `/management/${facilityId}/sessions/${sessionId}`;
  const { user, role } = await requireFacilityRole(facilityId, ["admin", "staff"], returnPath);
  if (!isUuid(sessionId)) notFound();

  const supabase = await createClient();
  const [facilityResult, sessionResult, sportsResult, courtsResult, linksResult] = await Promise.all([
    supabase.from("facilities").select("id, name, timezone").eq("id", facilityId).maybeSingle(),
    supabase.from("sessions").select("id, facility_id, sport_id, name, starts_at, ends_at, status, players_per_match, queue_policy").eq("id", sessionId).eq("facility_id", facilityId).maybeSingle(),
    supabase.from("sports").select("id, name, slug").eq("is_active", true).order("name"),
    supabase.from("courts").select("id, facility_id, name, sport_id, status").eq("facility_id", facilityId).order("name"),
    supabase.from("session_courts").select("session_id, court_id").eq("facility_id", facilityId).eq("session_id", sessionId),
  ]);

  if (facilityResult.error) console.error("Could not load facility information.", facilityResult.error.code);
  if (sessionResult.error) console.error("Could not load the requested facility session.", sessionResult.error.code);
  if (sportsResult.error) console.error("Could not load active sports.", sportsResult.error.code);
  if (courtsResult.error) console.error("Could not load facility courts.", courtsResult.error.code);
  if (linksResult.error) console.error("Could not load session courts.", linksResult.error.code);
  if (!sessionResult.data && !sessionResult.error) notFound();

  const coreLoadError = Boolean(
    facilityResult.error || sessionResult.error || sportsResult.error || courtsResult.error || linksResult.error,
  );
  const facility = facilityResult.data;
  const session = sessionResult.data;
  const timezoneValid = facility ? isValidTimezone(facility.timezone) : false;
  const [queueResult, matchesResult] = session && !coreLoadError
    ? await Promise.all([
        loadSessionQueue(supabase, session.id, user.id),
        loadSessionMatches(supabase, session.id),
      ])
    : [{ data: null }, { data: null }];
  const sessionWithCourts: SessionWithCourts | null = session
    ? {
        session,
        courtIds: (linksResult.data ?? []).map((link) => link.court_id),
      }
    : null;

  return (
    <AppShell
      facilityName={facility?.name}
      managementHref={`/management/${facilityId}`}
      managementRole={role}
      user={{ email: user.email }}
    >
      <main className="app-page management-page mx-auto min-h-screen max-w-7xl px-1 sm:px-4">
        <section className="management-route-page">
          <Link className="management-back-link" href={`/management/${facilityId}/sessions`}><ArrowLeft aria-hidden="true" className="size-4" /> All facility sessions</Link>
          <div className="mt-5">
            <SessionRealtime sessionIds={session && ["open", "paused"].includes(session.status) ? [session.id] : []} />
          </div>
          {coreLoadError || !facility || !sessionWithCourts ? (
            <p className="player-feedback player-feedback-error mt-5" role="alert">This facility session could not be loaded. Refresh the page to try again.</p>
          ) : !timezoneValid ? (
            <p className="player-feedback player-feedback-error mt-5" role="alert">
              The facility timezone is invalid. Ask an administrator to correct it before managing this session.
            </p>
          ) : (
              <FacilitySessionOperations
                courts={courtsResult.data ?? []}
                defaultStartValue={toLocalDateTimeInput(new Date().toISOString(), facility.timezone)}
                editable={role === "admin"}
                facilityId={facilityId}
                facilityTimezone={facility.timezone}
                matches={matchesResult.data}
                queueEntries={queueResult.data?.entries ?? null}
                session={sessionWithCourts}
                sessionTimeLabel={`${formatFacilityDateTime(sessionWithCourts.session.starts_at, facility.timezone)}${sessionWithCourts.session.ends_at ? ` � ${formatFacilityDateTime(sessionWithCourts.session.ends_at, facility.timezone)}` : ""}`}
                sports={sportsResult.data ?? []}
              />
          )}
        </section>
      </main>
    </AppShell>
  );
}

import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { FacilitySetup, type SessionWithCourts } from "@/components/facilities/facility-setup";
import { requireFacilityRole } from "@/server/auth/guards";
import { toLocalDateTimeInput } from "@/shared/facilities/datetime";
import { isValidTimezone } from "@/shared/facilities/validation";
import { createClient } from "@/server/supabase/server";

export const dynamic = "force-dynamic";

type SessionsPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function FacilitySessionsPage({ params }: SessionsPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    ["admin", "staff"],
    `/management/${facilityId}/sessions`,
  );
  const supabase = await createClient();
  const [facilityResult, sportsResult, courtsResult, sessionsResult, linksResult] = await Promise.all([
    supabase.from("facilities").select("id, name, slug, address, timezone").eq("id", facilityId).maybeSingle(),
    supabase.from("sports").select("id, name, slug").eq("is_active", true).order("name"),
    supabase.from("courts").select("id, facility_id, name, sport_id, status").eq("facility_id", facilityId).order("name"),
    supabase.from("sessions").select("id, facility_id, sport_id, name, starts_at, ends_at, status, players_per_match, queue_policy").eq("facility_id", facilityId).order("starts_at", { ascending: false }),
    supabase.from("session_courts").select("session_id, court_id").eq("facility_id", facilityId),
  ]);

  if (facilityResult.error) console.error("Could not load facility details.", facilityResult.error.code);
  if (sportsResult.error) console.error("Could not load active sports.", sportsResult.error.code);
  if (courtsResult.error) console.error("Could not load facility courts.", courtsResult.error.code);
  if (sessionsResult.error) console.error("Could not load facility sessions.", sessionsResult.error.code);
  if (linksResult.error) console.error("Could not load session courts.", linksResult.error.code);
  if (!facilityResult.data && !facilityResult.error) notFound();

  const failed = Boolean(facilityResult.error || sportsResult.error || courtsResult.error || sessionsResult.error || linksResult.error);
  const facility = facilityResult.data;
  const timezoneValid = facility ? isValidTimezone(facility.timezone) : false;
  const sessions: SessionWithCourts[] = (sessionsResult.data ?? []).map((session) => ({
    session,
    courtIds: (linksResult.data ?? []).filter((link) => link.session_id === session.id).map((link) => link.court_id),
  }));

  return (
    <AppShell
      facilityName={facility?.name}
      managementHref={`/management/${facilityId}`}
      managementRole={role}
      user={{ email: user.email }}
    >
      <main className="app-page management-page mx-auto min-h-screen max-w-7xl px-1 sm:px-4">
        <section className="management-route-page">
          <Link className="management-back-link" href={`/management/${facilityId}`}><ArrowLeft aria-hidden="true" className="size-4" /> Facility overview</Link>
          <header className="management-route-heading">
            <div><p>Facility workspace</p><h1>Sessions</h1><span>Open an individual session to manage its queue and matches.</span></div>
            <span className="management-route-count">{sessions.length} {sessions.length === 1 ? "session" : "sessions"}</span>
          </header>
          {failed || !facility ? (
            <p className="player-feedback player-feedback-error" role="alert">Facility sessions could not be loaded. Refresh the page to try again.</p>
          ) : (
            <FacilitySetup
              courts={courtsResult.data ?? []}
              defaultStartValue={timezoneValid ? toLocalDateTimeInput(new Date().toISOString(), facility.timezone) : ""}
              editable={role === "admin"}
              facility={facility}
              section="sessions"
              sessionOperationsBaseHref={`/management/${facilityId}/sessions`}
              sessions={sessions}
              sports={sportsResult.data ?? []}
              timezoneValid={timezoneValid}
            />
          )}
          <div className="management-route-note"><CalendarDays aria-hidden="true" className="size-4" /> Queue and match tools are kept inside each session.</div>
        </section>
      </main>
    </AppShell>
  );
}

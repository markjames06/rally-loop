import Link from "next/link";
import { notFound } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { FacilitySetup } from "@/components/facilities/facility-setup";
import { requireFacilityRole } from "@/lib/auth/guards";
import { toLocalDateTimeInput } from "@/lib/facilities/datetime";
import { isValidTimezone } from "@/lib/facilities/validation";
import { loadSessionMatches } from "@/lib/matches/queries";
import { loadSessionQueue } from "@/lib/queue/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ManagementPageProps = {
  params: Promise<{ facilityId: string }>;
};

export default async function ManagementPage({
  params,
}: ManagementPageProps) {
  const { facilityId } = await params;
  const { user, role } = await requireFacilityRole(
    facilityId,
    ["admin", "staff"],
    `/management/${facilityId}`,
  );
  const supabase = await createClient();
  const [
    { data: facility, error: facilityError },
    { data: sports, error: sportsError },
    { data: courts, error: courtsError },
    { data: sessions, error: sessionsError },
    { data: sessionCourts, error: sessionCourtsError },
  ] = await Promise.all([
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
      .select(
        "id, facility_id, sport_id, name, starts_at, ends_at, status, players_per_match, queue_policy",
      )
      .eq("facility_id", facilityId)
      .order("starts_at", { ascending: false }),
    supabase
      .from("session_courts")
      .select("session_id, court_id, facility_id, sport_id")
      .eq("facility_id", facilityId),
  ]);

  if (facilityError) {
    console.error("Could not load facility details.", facilityError.code);
  }
  if (sportsError) {
    console.error("Could not load active sports.", sportsError.code);
  }
  if (courtsError) {
    console.error("Could not load facility courts.", courtsError.code);
  }
  if (sessionsError) {
    console.error("Could not load facility sessions.", sessionsError.code);
  }
  if (sessionCourtsError) {
    console.error("Could not load session court links.", sessionCourtsError.code);
  }

  if (!facility && !facilityError) {
    notFound();
  }

  const loadError =
    facilityError ||
    sportsError ||
    courtsError ||
    sessionsError ||
    sessionCourtsError;
  const queueResults =
    role === "admin" || role === "staff"
      ? await Promise.all(
          (sessions ?? []).map(async (session) => {
            const [queueResult, matchesResult] = await Promise.all([
              loadSessionQueue(supabase, session.id, user.id),
              loadSessionMatches(supabase, session.id),
            ]);
            return {
              sessionId: session.id,
              queueResult,
              matchesResult,
            };
          }),
        )
      : [];
  const queuesBySessionId = new Map(
    queueResults.map(({ sessionId, queueResult }) => [
      sessionId,
      queueResult.data?.entries ?? null,
    ]),
  );
  const matchesBySessionId = new Map(
    queueResults.map(({ sessionId, matchesResult }) => [
      sessionId,
      matchesResult.data,
    ]),
  );
  const timezoneValid = facility
    ? isValidTimezone(facility.timezone)
    : false;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex items-center justify-between border-b border-white/10 pb-6">
        <Link className="text-xl font-extrabold tracking-tight" href="/">
          Rally<span className="text-lime-300">Loop</span>
        </Link>
        <SignOutButton />
      </header>

      <section className="py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
              Facility management
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {facility?.name ?? "Facility setup"}
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              Your {role} access was verified on the server
              {role === "admin" ? ". Configure details, courts, and sessions." : "."}
            </p>
          </div>
          <Link
            className="text-sm font-bold text-lime-300 hover:text-lime-200"
            href="/sessions"
          >
            Browse open sessions
          </Link>
        </div>

        {loadError ? (
          <p
            className="rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Facility setup could not be loaded. Refresh the page to try again.
          </p>
        ) : facility ? (
          <FacilitySetup
            courts={courts ?? []}
            defaultStartValue={
              timezoneValid
                ? toLocalDateTimeInput(new Date().toISOString(), facility.timezone)
                : ""
            }
            editable={role === "admin"}
            facility={facility}
            sessions={(sessions ?? []).map((session) => ({
              session,
              courtIds: (sessionCourts ?? [])
                .filter((link) => link.session_id === session.id)
                .map((link) => link.court_id),
              queueEntries: queuesBySessionId.get(session.id) ?? null,
              matches: matchesBySessionId.get(session.id) ?? null,
            }))}
            sports={sports ?? []}
            timezoneValid={timezoneValid}
          />
        ) : null}
      </section>

      <footer className="border-t border-white/10 py-6 text-sm text-slate-400">
        Signed in as {user.email ?? "your account"}.{" "}
        <Link className="font-semibold text-lime-300" href="/player">
          Return to player space
        </Link>
      </footer>
    </main>
  );
}

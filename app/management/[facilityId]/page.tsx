import Link from "next/link";
import { ArrowRight, CircleDot } from "lucide-react";
import { notFound } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { FacilitySetup } from "@/components/facilities/facility-setup";
import { SessionRealtime } from "@/components/realtime/session-realtime";
import { requireFacilityRole } from "@/server/auth/guards";
import { toLocalDateTimeInput } from "@/shared/facilities/datetime";
import { isValidTimezone } from "@/shared/facilities/validation";
import { loadSessionMatches } from "@/server/matches/queries";
import { loadSessionQueue } from "@/server/queue/queries";
import { createClient } from "@/server/supabase/server";

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
    <main className="app-page mx-auto min-h-screen max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between border-b border-white/10 pb-5">
        <Link
          aria-label="RallyLoop home"
          className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight"
          href="/"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#c4e65d] text-[#19251e]">
            <CircleDot aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </span>
          RallyLoop
        </Link>
        <SignOutButton />
      </header>

      <div className="mt-6">
        <SessionRealtime
          sessionIds={(sessions ?? [])
            .filter((session) => session.status === "open")
            .map((session) => session.id)}
        />
      </div>

      <section className="py-8 sm:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-lime-300">
              Facility management
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {facility?.name ?? "Facility setup"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {role === "admin"
                ? "Manage the facility, keep courts ready, and move every open session forward."
                : "Keep an eye on the queue, matches, and court activity at your facility."}
            </p>
          </div>
            <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d6ddcd] bg-white px-4 text-sm font-bold text-[#365323] transition hover:bg-[#f5f8ee]"
            href="/sessions"
          >
            Browse open sessions
              <ArrowRight aria-hidden="true" className="size-4" />
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

      <footer className="flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <span>Signed in as {user.email ?? "your account"}.</span>
        <Link className="inline-flex items-center gap-2 font-semibold text-lime-300" href="/player">
          Return to player space
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </footer>
    </main>
  );
}

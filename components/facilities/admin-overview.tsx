import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import type { Database } from "@/shared/types/database";

type Facility = Pick<
  Database["public"]["Tables"]["facilities"]["Row"],
  "id" | "name" | "address" | "timezone"
>;
type Session = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  "id" | "name" | "status" | "starts_at"
>;
type Court = Pick<
  Database["public"]["Tables"]["courts"]["Row"],
  "id" | "status"
>;

export function AdminFacilityOverview({
  facility,
  sessions,
  courts,
  loadError,
  reason,
}: {
  facility: Facility | null;
  sessions: Session[];
  courts: Court[];
  loadError: boolean;
  reason?: string;
}) {
  const managementHref = facility ? `/management/${facility.id}` : "/player";
  const activeSessions = sessions.filter(
    (session) => session.status === "open" || session.status === "paused",
  );
  const availableCourts = courts.filter((court) => court.status === "available").length;
  const occupiedCourts = courts.filter((court) => court.status === "occupied").length;
  const inactiveCourts = courts.filter((court) => court.status === "inactive").length;
  const activeSessionCount = activeSessions.length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-8">
        {reason === "authorization" || reason === "signout" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            {reason === "authorization"
              ? "Facility access could not be verified. Please try again."
              : "Sign-out did not complete. Please try again."}
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-sm font-medium text-emerald-800">Facility overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {facility?.name ?? "Your facility"}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Court availability, sessions in motion, and facility setup.
            </p>
          </div>
          {facility ? (
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700"
              href={managementHref}
            >
              Manage facility <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-xs" role="alert">
            Facility information could not load. Refresh the page to try again.
          </div>
        ) : !facility ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
            <h2 className="text-lg font-bold text-slate-900">Facility details are unavailable</h2>
            <p className="mt-2 text-xs text-slate-500">Ask a facility administrator to check your access.</p>
          </div>
        ) : (
          <>
            <section aria-labelledby="admin-home-courts-heading" className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900" id="admin-home-courts-heading">Court availability</h2>
                  <p className="text-xs text-slate-500">{courts.length} {courts.length === 1 ? "court" : "courts"} configured at this facility.</p>
                </div>
                <Link
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                  href={`${managementHref}/courts`}
                >
                  Manage courts <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>

              <dl aria-label="Court availability summary" className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <dt className="text-sm font-medium text-emerald-800">Available</dt>
                  <dd className="mt-2 text-3xl font-extrabold text-emerald-900">{availableCourts}</dd>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                  <dt className="text-sm font-medium text-amber-800">Occupied</dt>
                  <dd className="mt-2 text-3xl font-extrabold text-amber-900">{occupiedCourts}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <dt className="text-sm font-medium text-slate-600">Inactive</dt>
                  <dd className="mt-2 text-3xl font-extrabold text-slate-800">{inactiveCourts}</dd>
                </div>
              </dl>

              {!courts.length ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                  <p>No courts set up yet. Add courts when your facility is ready.</p>
                </div>
              ) : null}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section aria-labelledby="admin-home-sessions-heading" className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900" id="admin-home-sessions-heading">Sessions in motion</h2>
                      <p className="text-xs text-slate-500">{activeSessionCount} open or paused {activeSessionCount === 1 ? "session" : "sessions"}.</p>
                    </div>
                    <Link
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                      href={`${managementHref}/sessions`}
                    >
                      Manage sessions <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  </div>
                  {activeSessions.length ? (
                    <ul className="mt-4 space-y-3">
                      {activeSessions.slice(0, 5).map((session) => (
                        <li
                          key={session.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:bg-slate-50"
                        >
                          <div>
                            <strong className="block text-sm font-semibold text-slate-900">{session.name}</strong>
                            <span className="text-xs text-slate-500">
                              {formatFacilityDateTime(session.starts_at, facility.timezone)}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              session.status === "open"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                session.status === "open" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              aria-hidden="true"
                            />
                            {session.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                      <CalendarDays aria-hidden="true" className="size-6 text-slate-400" />
                      <p className="mt-2 text-xs">No open sessions. Create one when your courts are ready.</p>
                    </div>
                  )}
                </div>
              </section>

              <section aria-labelledby="admin-home-facility-heading" className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900" id="admin-home-facility-heading">Facility details</h2>
                      <p className="text-xs text-slate-500">Location and local time for your sessions.</p>
                    </div>
                    <Link
                      aria-label="Edit facility details"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                      href={`${managementHref}/details`}
                    >
                      Edit <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  </div>
                  <dl className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <dt className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                        <MapPin aria-hidden="true" className="size-3.5" /> Address
                      </dt>
                      <dd className="mt-1 font-semibold text-slate-900">{facility.address || "Address not set"}</dd>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <dt className="text-sm font-medium text-slate-500">Timezone</dt>
                      <dd className="mt-1 font-semibold text-slate-900">{facility.timezone}</dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

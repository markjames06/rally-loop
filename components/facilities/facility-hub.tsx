import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
  PanelsTopLeft,
} from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import { isValidTimezone } from "@/shared/facilities/validation";
import type { Database } from "@/shared/types/database";
import { CourtFormDialog, FacilitySettingsForm } from "@/components/facilities/facility-setup";
import { MatchManager } from "@/components/matches/match-manager";
import type { SessionMatchRecord } from "@/server/matches/queries";
import type { WaitingQueueEntry } from "@/server/queue/queries";

type Facility = Pick<
  Database["public"]["Tables"]["facilities"]["Row"],
  "id" | "name" | "slug" | "address" | "timezone"
>;
type Session = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  "id" | "name" | "status" | "starts_at" | "players_per_match"
>;
type Court = Pick<
  Database["public"]["Tables"]["courts"]["Row"],
  "id" | "facility_id" | "name" | "sport_id" | "status"
>;
type Sport = Pick<
  Database["public"]["Tables"]["sports"]["Row"],
  "id" | "name" | "slug"
>;

export function FacilityHub({
  facility,
  sessions,
  courts,
  sports = [],
  activeSession = null,
  activeSessionCourtIds = [],
  matches = null,
  editable = false,
  loadError,
}: {
  facility: Facility;
  sessions: Session[];
  courts: Court[];
  sports?: Sport[];
  activeSession?: Session | null;
  activeSessionCourtIds?: string[];
  queueEntries?: WaitingQueueEntry[] | null;
  matches?: SessionMatchRecord[] | null;
  editable?: boolean;
  loadError: boolean;
}) {
  const base = `/management/${facility.id}`;
  const activeSessions = sessions.filter(
    (session) => session.status === "open" || session.status === "paused",
  );
  const openSessions = activeSessions.filter((session) => session.status === "open");
  const availableCourts = courts.filter((court) => court.status === "available").length;
  const timezoneValid = isValidTimezone(facility.timezone);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="space-y-8">
        {/* Executive Header */}
        <header className="flex flex-col justify-between gap-5 rounded-md border p-6 sm:flex-row sm:items-center sm:p-8" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--accent-ink)' }}>Facility workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: 'var(--text)' }}>
              {facility.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
              {facility.address ? (
                <>
                  <MapPin aria-hidden="true" className="size-3.5" style={{ color: 'var(--control)' }} />
                  <span>{facility.address}</span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span>{facility.timezone}</span>
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'var(--accent)' }}
            href={`${base}/sessions`}
          >
            View sessions <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>

        {loadError ? (
          <div className="rounded-md border p-6 text-sm" style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }} role="alert">
            Facility overview data could not be loaded. Refresh the page to try again.
          </div>
        ) : (
          <>
            {/* KPI Strip - following accent-ladder: one container split by dividers */}
            <div className="flex divide-x" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }} aria-label="Facility status">
              <div className="flex-1 p-5">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Open sessions</span>
                <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{openSessions.length}</p>
              </div>
              <div className="flex-1 p-5">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Courts available</span>
                <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {availableCourts}
                  <span className="text-base font-medium" style={{ color: 'var(--muted)' }}> / {courts.length}</span>
                </p>
              </div>
              <div className="flex-1 p-5">
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Open or paused</span>
                <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{activeSessions.length}</p>
              </div>
            </div>

            {/* Live Operational Cockpit if an active session exists */}
            {activeSession && matches !== null ? (
              <div className="rounded-md border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--rule)' }}>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Live session controls</span>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>{activeSession.name}</h2>
                  </div>
                  <Link
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--accent-ink)' }}
                    href={`${base}/sessions/${activeSession.id}`}
                  >
                    Open dedicated cockpit <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
                <MatchManager
                  courts={courts
                    .filter((court) => activeSessionCourtIds.includes(court.id))
                    .map(({ id, name, status }) => ({ id, name, status }))}
                  facilityId={facility.id}
                  matches={matches}
                  playersPerMatch={activeSession.players_per_match ?? 2}
                  sessionId={activeSession.id}
                  sessionStatus={activeSession.status as "draft" | "open" | "paused" | "closed" | "completed"}
                  timezone={facility.timezone}
                />
              </div>
            ) : null}

            {/* Hub Areas Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sessions Overview Card */}
              <section className="flex flex-col justify-between rounded-md border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }} aria-labelledby="hub-sessions-heading">
                <div>
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--rule)' }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-md" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
                        <CalendarDays aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }} id="hub-sessions-heading">Sessions</h2>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Review schedules and manage live play.</p>
                      </div>
                    </div>
                    <Link
                      className="rounded-md p-2 transition"
                      style={{ color: 'var(--control)' }}
                      href={`${base}/sessions`}
                      aria-label="Open sessions"
                    >
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>

                  {activeSessions.length ? (
                    <ul className="mt-4 space-y-3">
                      {activeSessions.slice(0, 4).map((session) => (
                        <li
                          key={session.id}
                          className="flex items-center justify-between rounded-md border px-3.5 py-2.5 transition"
                          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
                        >
                          <div>
                            <Link
                              className="text-sm font-semibold hover:underline"
                              style={{ color: 'var(--text)' }}
                              href={`${base}/sessions/${session.id}`}
                            >
                              {session.name}
                            </Link>
                            <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                              {timezoneValid
                                ? formatFacilityDateTime(session.starts_at, facility.timezone)
                                : "Time unavailable · timezone needs correction"}
                            </p>
                          </div>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                            style={{
                              backgroundColor: session.status === "open" ? 'var(--pill-positive-bg)' : 'var(--pill-warning-bg)',
                              color: session.status === "open" ? 'var(--pill-positive-ink)' : 'var(--pill-warning-ink)'
                            }}
                          >
                            {session.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>No open sessions. Create one from the Sessions screen.</p>
                  )}
                </div>

                <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
                  <Link
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--accent-ink)' }}
                    href={`${base}/sessions`}
                  >
                    All sessions <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
              </section>

              {/* Courts Management & Quick Add */}
              <section className="flex flex-col justify-between rounded-md border p-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <div>
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--rule)' }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-md" style={{ backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
                        <PanelsTopLeft aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Courts</h2>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {courts.length} configured · {availableCourts} available
                        </p>
                      </div>
                    </div>
                    {editable ? (
                      <CourtFormDialog facilityId={facility.id} sports={sports} />
                    ) : (
                      <Link
                        className="rounded-md p-2 transition"
                        style={{ color: 'var(--control)' }}
                        href={`${base}/courts`}
                      >
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {courts.slice(0, 4).map((court) => (
                      <div
                        key={court.id}
                        className="flex items-center justify-between rounded-md border px-3.5 py-2.5 text-xs"
                        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}
                      >
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>{court.name}</span>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold capitalize"
                          style={{
                            backgroundColor: court.status === "available" ? 'var(--pill-positive-bg)' : court.status === "occupied" ? 'var(--pill-warning-bg)' : 'var(--pill-neutral-bg)',
                            color: court.status === "available" ? 'var(--pill-positive-ink)' : court.status === "occupied" ? 'var(--pill-warning-ink)' : 'var(--pill-neutral-ink)'
                          }}
                        >
                          {court.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
                  <Link
                    className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--text)' }}
                    href={`${base}/courts`}
                  >
                    Manage courts <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </div>
              </section>

              {/* Facility Details Configuration Section */}
              <section className="flex flex-col justify-between rounded-md border p-6 lg:col-span-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <div>
                  <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--rule)' }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-md" style={{ backgroundColor: 'var(--raised)', color: 'var(--muted)' }}>
                        <Building2 aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Facility details</h2>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Address, name, and timezone configuration</p>
                      </div>
                    </div>
                    <Link
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--muted)' }}
                      href={`${base}/details`}
                    >
                      Review details <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  </div>

                  <div className="mt-6">
                    {editable ? (
                      <FacilitySettingsForm facility={facility} />
                    ) : (
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="rounded-md border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}>
                          <dt className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Address</dt>
                          <dd className="mt-1 font-semibold" style={{ color: 'var(--text)' }}>{facility.address ?? "Address not set"}</dd>
                        </div>
                        <div className="rounded-md border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--raised)' }}>
                          <dt className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Timezone</dt>
                          <dd className="mt-1 font-semibold" style={{ color: 'var(--text)' }}>{facility.timezone}</dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

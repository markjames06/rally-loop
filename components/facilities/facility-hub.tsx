import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin, PanelsTopLeft } from "lucide-react";

import { formatFacilityDateTime } from "@/shared/facilities/datetime";
import { isValidTimezone } from "@/shared/facilities/validation";
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

export function FacilityHub({
  facility,
  sessions,
  courts,
  loadError,
}: {
  facility: Facility;
  sessions: Session[];
  courts: Court[];
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
    <main className="app-page facility-hub-page mx-auto min-h-screen max-w-7xl px-1 sm:px-4">
      <section className="facility-hub">
        <header className="facility-hub-heading">
          <div>
            <p className="facility-hub-eyebrow">Facility workspace</p>
            <h1>{facility.name}</h1>
            <p className="facility-hub-location">
              {facility.address ? <><MapPin aria-hidden="true" className="size-4" />{facility.address}<span aria-hidden="true">·</span></> : null}
              {facility.timezone}
            </p>
          </div>
          <Link className="facility-hub-primary" href={`${base}/sessions`}>
            View sessions <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </header>

        {loadError ? (
          <p className="player-feedback player-feedback-error" role="alert">
            Facility overview data could not be loaded. Refresh the page to try again.
          </p>
        ) : (
          <>
        <div className="facility-hub-stats" aria-label="Facility status">
          <div><span>Open sessions</span><strong>{openSessions.length}</strong></div>
          <div><span>Courts available</span><strong>{availableCourts}<small> / {courts.length}</small></strong></div>
          <div><span>Open or paused</span><strong>{activeSessions.length}</strong></div>
        </div>

        <div className="facility-hub-grid">
          <section className="facility-hub-area" aria-labelledby="hub-sessions-heading">
            <div className="facility-hub-area-heading">
              <CalendarDays aria-hidden="true" className="size-5" />
              <div><h2 id="hub-sessions-heading">Sessions</h2><p>Review schedules and manage live play.</p></div>
              <Link href={`${base}/sessions`} aria-label="Open sessions"><ArrowRight aria-hidden="true" className="size-4" /></Link>
            </div>
            {activeSessions.length ? (
              <ul className="facility-hub-session-list">
                {activeSessions.slice(0, 3).map((session) => (
                  <li key={session.id}>
                    <div><Link className="facility-hub-session-link" href={`${base}/sessions/${session.id}`}>{session.name}</Link><span>{timezoneValid ? formatFacilityDateTime(session.starts_at, facility.timezone) : "Time unavailable · timezone needs correction"}</span></div>
                    <span className={`management-status is-${session.status}`}>{session.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="facility-hub-empty">No open sessions. Create one from the Sessions screen.</p>
            )}
            <Link className="facility-hub-text-link" href={`${base}/sessions`}>All sessions <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </section>

          <Link className="facility-hub-area facility-hub-shortcut" href={`${base}/courts`}>
            <div className="facility-hub-area-heading">
              <PanelsTopLeft aria-hidden="true" className="size-5" />
              <div><h2>Courts</h2><p>{courts.length} configured · {availableCourts} available</p></div>
              <ArrowRight aria-hidden="true" className="size-4" />
            </div>
            <span className="facility-hub-shortcut-label">Manage courts</span>
          </Link>

          <Link className="facility-hub-area facility-hub-shortcut" href={`${base}/details`}>
            <div className="facility-hub-area-heading">
              <Building2 aria-hidden="true" className="size-5" />
              <div><h2>Facility details</h2><p>Address, name, and timezone</p></div>
              <ArrowRight aria-hidden="true" className="size-4" />
            </div>
            <span className="facility-hub-shortcut-label">Review details</span>
          </Link>
        </div>
          </>
        )}
      </section>
    </main>
  );
}

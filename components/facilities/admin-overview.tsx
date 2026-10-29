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

  return (
    <main className="app-page admin-home-page mx-auto min-h-screen max-w-6xl px-1 sm:px-4">
      <section className="admin-home">
        {reason === "authorization" || reason === "signout" ? (
          <p className="player-feedback player-feedback-error mb-5" role="alert">
            {reason === "authorization"
              ? "Facility access could not be verified. Please try again."
              : "Sign-out did not complete. Please try again."}
          </p>
        ) : null}
        <div className="admin-home-heading">
          <div>
            <p className="admin-home-kicker">Facility overview</p>
            <h1>{facility?.name ?? "Your facility"}</h1>
            <p className="admin-home-description">
              A quick read on today’s play, court availability, and facility setup.
            </p>
          </div>
          {facility ? (
            <Link className="player-primary-action" href={managementHref}>
              Manage facility <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </div>

        {loadError ? (
          <p className="player-feedback player-feedback-error" role="alert">
            Facility information could not load. Refresh the page to try again.
          </p>
        ) : !facility ? (
          <div className="admin-home-empty">
            <h2>Facility details are unavailable</h2>
            <p>Ask a facility administrator to check your access.</p>
          </div>
        ) : (
          <>
            <div className="admin-home-facts" aria-label="Facility activity summary">
              <div>
                <span>Live sessions</span>
                <strong>{activeSessions.filter((session) => session.status === "open").length}</strong>
              </div>
              <div>
                <span>Available courts</span>
                <strong>{availableCourts}</strong>
              </div>
              <div>
                <span>Courts in play</span>
                <strong>{occupiedCourts}</strong>
              </div>
              <div>
                <span>Inactive courts</span>
                <strong>{inactiveCourts}</strong>
              </div>
            </div>

            <div className="admin-home-grid">
              <section aria-labelledby="admin-home-sessions-heading" className="admin-home-block">
                <div className="admin-home-block-heading">
                  <div>
                    <h2 id="admin-home-sessions-heading">Sessions in motion</h2>
                    <p>Open and paused sessions at your facility.</p>
                  </div>
                  <Link href={`${managementHref}/sessions`}>
                    Manage <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
                {activeSessions.length ? (
                  <ul className="admin-home-session-list">
                    {activeSessions.slice(0, 5).map((session) => (
                      <li key={session.id}>
                        <div>
                          <strong>{session.name}</strong>
                          <span>
                            {formatFacilityDateTime(session.starts_at, facility.timezone)}
                          </span>
                        </div>
                        <span className={`management-status is-${session.status}`}>
                          {session.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="admin-home-empty">
                    <CalendarDays aria-hidden="true" className="size-5" />
                    <p>No open sessions. Create one when your courts are ready.</p>
                  </div>
                )}
              </section>

              <section aria-labelledby="admin-home-facility-heading" className="admin-home-block admin-home-facility">
                <div className="admin-home-block-heading">
                  <div>
                    <h2 id="admin-home-facility-heading">Facility details</h2>
                    <p>Location and local time for your sessions.</p>
                  </div>
                  <Link aria-label="Edit facility details" href={`${managementHref}/details`}>
                    Edit <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </div>
                <dl>
                  <div>
                    <dt><MapPin aria-hidden="true" className="size-4" /> Address</dt>
                    <dd>{facility.address || "Address not set"}</dd>
                  </div>
                  <div>
                    <dt>Timezone</dt>
                    <dd>{facility.timezone}</dd>
                  </div>
                </dl>
                <Link className="admin-home-courts-link" href={`${managementHref}/courts`}>
                  Court setup <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

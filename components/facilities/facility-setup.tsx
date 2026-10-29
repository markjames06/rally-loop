"use client";

import {
  ArrowRight,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  MapPin,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MatchManager } from "@/components/matches/match-manager";
import { StaffQueueManager } from "@/components/queue/queue-panel";
import { useActionToast } from "@/components/ui/toast";
import {
  deleteCourtAction,
  saveCourtAction,
  saveSessionAction,
  updateFacilityAction,
  type FacilityActionState,
} from "@/server/facilities/actions";
import {
  formatFacilityDateTime,
  toLocalDateTimeInput,
} from "@/shared/facilities/datetime";
import type { Database } from "@/shared/types/database";
import type { WaitingQueueEntry } from "@/server/queue/queries";
import type { SessionMatchRecord } from "@/server/matches/queries";

type FacilityRow = Pick<
  Database["public"]["Tables"]["facilities"]["Row"],
  "id" | "name" | "slug" | "address" | "timezone"
>;
type CourtRow = Pick<
  Database["public"]["Tables"]["courts"]["Row"],
  "id" | "facility_id" | "name" | "sport_id" | "status"
>;
type SportRow = Pick<
  Database["public"]["Tables"]["sports"]["Row"],
  "id" | "name" | "slug"
>;
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

export type SessionWithCourts = {
  session: SessionRow;
  courtIds: string[];
};

const initialState: FacilityActionState = {};

function ActionMessage({ state }: { state: FacilityActionState }) {
  if (state.error) {
    return (
      <p className="inline-flex items-start gap-2 text-sm text-rose-800" role="alert">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p className="inline-flex items-start gap-2 text-sm text-[#39764d]" role="status">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {state.notice}
      </p>
    );
  }
  return null;
}

function FacilitySettingsForm({ facility }: { facility: FacilityRow }) {
  const action = updateFacilityAction.bind(null, facility.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="facility-name">Facility name</Label>
        <Input
          autoComplete="organization"
          defaultValue={facility.name}
          id="facility-name"
          maxLength={120}
          minLength={2}
          name="name"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="facility-slug">URL slug</Label>
        <Input
          defaultValue={facility.slug}
          id="facility-slug"
          maxLength={80}
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="facility-address">Address</Label>
        <Input
          autoComplete="street-address"
          defaultValue={facility.address ?? ""}
          id="facility-address"
          maxLength={240}
          name="address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="facility-timezone">IANA timezone</Label>
        <Input
          defaultValue={facility.timezone}
          id="facility-timezone"
          maxLength={100}
          name="timezone"
          placeholder="America/Los_Angeles"
          required
        />
        <p className="text-xs text-[#657268]">
          Session dates and times use this timezone.
        </p>
      </div>
      <div className="flex flex-col justify-end gap-3">
        <Button className="w-full sm:w-fit" disabled={pending} type="submit">
          {pending ? (
            "Saving..."
          ) : (
            <>
              <Save aria-hidden="true" className="size-4" />
              Save facility
            </>
          )}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function CourtForm({
  facilityId,
  sports,
  court,
}: {
  facilityId: string;
  sports: SportRow[];
  court?: CourtRow;
}) {
  const action = saveCourtAction.bind(null, facilityId, court?.id ?? null);
  const [state, formAction, pending] = useActionState(action, initialState);
  useActionToast(state);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-2xl border border-[#dce3d8] bg-white p-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <div className="space-y-2">
        <Label htmlFor={`court-name-${court?.id ?? "new"}`}>Court name</Label>
        <Input
          defaultValue={court?.name ?? ""}
          id={`court-name-${court?.id ?? "new"}`}
          maxLength={80}
          name="name"
          placeholder="Court 1"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`court-sport-${court?.id ?? "new"}`}>Sport</Label>
        <select
          className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20352a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue={court?.sport_id ?? ""}
          id={`court-sport-${court?.id ?? "new"}`}
          name="sport_id"
          required
        >
          <option value="">Choose a sport</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>
      {court ? (
        <div className="space-y-2">
          <Label htmlFor={`court-status-${court.id}`}>Court status</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20352a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue={court.status}
            id={`court-status-${court.id}`}
            name="status"
          >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      ) : null}
      <div className="flex flex-col justify-end gap-3">
        <Button disabled={pending || sports.length === 0} type="submit">
          {pending ? (
            "Saving..."
          ) : court ? (
            <>
              <Save aria-hidden="true" className="size-4" />
              Save court
            </>
          ) : (
            <>
              <Plus aria-hidden="true" className="size-4" />
              Add court
            </>
          )}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function CourtFormDialog({
  facilityId,
  sports,
  court,
}: {
  facilityId: string;
  sports: SportRow[];
  court?: CourtRow;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant={court ? "outline" : "default"}>
        {court ? "Edit court" : <><Plus aria-hidden="true" /> Add court</>}
      </Button>
      <Dialog
        description={court ? "Update the court name, sport, and availability." : "Add a court to this facility. You can assign it to compatible sessions."}
        onOpenChange={setOpen}
        open={open}
        title={court ? `Edit ${court.name}` : "Add a court"}
      >
        <CourtForm court={court} facilityId={facilityId} sports={sports} />
      </Dialog>
    </>
  );
}

function DeleteCourtButton({
  facilityId,
  court,
}: {
  facilityId: string;
  court: CourtRow;
}) {
  const action = deleteCourtAction.bind(null, facilityId, court.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [dialogOpen, setDialogOpen] = useState(false);
  useActionToast(state);

  return (
    <>
      <Button
        className="border-[#e8c8bc] text-[#973f31] hover:bg-[#fff2ed] hover:text-[#87372c]"
        onClick={() => setDialogOpen(true)}
        type="button"
        variant="outline"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Delete court
      </Button>
      <Dialog
        description="Deleting a court cannot be undone. Sessions that use this court may no longer be able to assign matches."
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title={`Delete ${court.name}?`}
      >
        <form action={formAction} className="space-y-4">
          <div className="rounded-xl border border-[#f0c4b8] bg-[#fff2ed] p-4 text-sm leading-6 text-[#87372c]">
            This court will be removed from the facility. You can cancel if
            you&apos;re not sure.
          </div>
          <ActionMessage state={state} />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button
              onClick={() => setDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Keep court
            </Button>
            <Button
              className="bg-[#a33d31] text-[#20352a] hover:bg-[#8e342b]"
              disabled={pending}
              type="submit"
            >
              {pending ? "Deleting..." : "Delete court"}
            </Button>
          </div>
        </form>
      </Dialog>
      {!dialogOpen ? (
        <div className="mt-2">
          <ActionMessage state={state} />
        </div>
      ) : null}
    </>
  );
}

function SessionForm({
  facilityId,
  timezone,
  defaultStartValue,
  sports,
  courts,
  value,
}: {
  facilityId: string;
  timezone: string;
  defaultStartValue: string;
  sports: SportRow[];
  courts: CourtRow[];
  value?: SessionWithCourts;
}) {
  const session = value?.session;
  const action = saveSessionAction.bind(null, facilityId, session?.id ?? null);
  const [state, formAction, pending] = useActionState(action, initialState);
  useActionToast(state);
  const [selectedSportId, setSelectedSportId] = useState(
    session?.sport_id ?? "",
  );
  const selectedCourtIds = new Set(value?.courtIds ?? []);
  const startValue = session
    ? toLocalDateTimeInput(session.starts_at, timezone)
    : defaultStartValue;
  const endValue = toLocalDateTimeInput(session?.ends_at ?? null, timezone);
  const availableCourts = courts.filter(
    (court) =>
      court.sport_id === selectedSportId &&
      (court.status === "available" || selectedCourtIds.has(court.id)),
  );

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-[#dce3d8] bg-white p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`session-name-${session?.id ?? "new"}`}>
            Session name
          </Label>
          <Input
            defaultValue={session?.name ?? ""}
            id={`session-name-${session?.id ?? "new"}`}
            maxLength={120}
            name="name"
            placeholder="Open play"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`session-sport-${session?.id ?? "new"}`}>Sport</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20352a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue={session?.sport_id ?? ""}
            id={`session-sport-${session?.id ?? "new"}`}
            name="sport_id"
            onChange={(event) => setSelectedSportId(event.target.value)}
            required
          >
            <option value="">Choose a sport</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`session-start-${session?.id ?? "new"}`}>
            Starts at ({timezone})
          </Label>
          <Input
            defaultValue={startValue}
            id={`session-start-${session?.id ?? "new"}`}
            name="starts_at_local"
            required
            step={60}
            type="datetime-local"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`session-end-${session?.id ?? "new"}`}>
            Ends at ({timezone}, optional)
          </Label>
          <Input
            defaultValue={endValue}
            id={`session-end-${session?.id ?? "new"}`}
            name="ends_at_local"
            step={60}
            type="datetime-local"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`session-status-${session?.id ?? "new"}`}>
            Session status
          </Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm text-[#20352a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue={session?.status ?? "draft"}
            id={`session-status-${session?.id ?? "new"}`}
            name="status"
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`session-match-size-${session?.id ?? "new"}`}>
            Players per match
          </Label>
          <Input
            defaultValue={session?.players_per_match ?? 2}
            id={`session-match-size-${session?.id ?? "new"}`}
            min={1}
            name="players_per_match"
            required
            type="number"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Courts for this session</legend>
        {availableCourts.length === 0 ? (
          <p className="text-sm text-[#657268]">
            {selectedSportId
              ? "No available court supports this sport. Add or activate a compatible court."
              : "Choose a sport to see compatible available courts."}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {availableCourts.map((court) => (
              <label
                className="flex items-center gap-3 rounded-xl border border-[#dce3d8] px-3 py-2 text-sm text-[#34483b]"
                key={court.id}
              >
                <input
                  defaultChecked={selectedCourtIds.has(court.id)}
                  name="court_ids"
                  type="checkbox"
                  value={court.id}
                />
                <span>{court.name}</span>
                <span className="ml-auto text-xs text-[#657268]">
                  {sports.find((sport) => sport.id === court.sport_id)?.name ??
                    "Unknown sport"}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-3">
        <Button disabled={pending || sports.length === 0} type="submit">
          {pending
            ? "Saving..."
            : session
              ? (
                <>
                  <Save aria-hidden="true" className="size-4" />
                  Save session
                </>
              )
              : (
                <>
                  <Plus aria-hidden="true" className="size-4" />
                  Create session
                </>
              )}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function SessionFormDialog({
  facilityId,
  timezone,
  defaultStartValue,
  sports,
  courts,
  value,
}: {
  facilityId: string;
  timezone: string;
  defaultStartValue: string;
  sports: SportRow[];
  courts: CourtRow[];
  value?: SessionWithCourts;
}) {
  const [open, setOpen] = useState(false);
  const session = value?.session;

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant={session ? "outline" : "default"}>
        {session ? "Edit settings" : <><Plus aria-hidden="true" /> New session</>}
      </Button>
      <Dialog
        description={session ? "Update session timing, queue settings, and courts." : "Choose a sport, time, match size, and courts for play."}
        onOpenChange={setOpen}
        open={open}
        title={session ? `Edit ${session.name}` : "Create a session"}
      >
        <SessionForm
          courts={courts}
          defaultStartValue={defaultStartValue}
          facilityId={facilityId}
          sports={sports}
          timezone={timezone}
          value={value}
        />
      </Dialog>
    </>
  );
}

export function FacilitySetup({
  facility,
  sports,
  courts,
  sessions,
  editable,
  defaultStartValue,
  timezoneValid,
  section,
  sessionOperationsBaseHref,
}: {
  facility: FacilityRow;
  sports: SportRow[];
  courts: CourtRow[];
  sessions: SessionWithCourts[];
  editable: boolean;
  defaultStartValue: string;
  timezoneValid: boolean;
  section: "sessions" | "courts" | "details";
  sessionOperationsBaseHref: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      {section === "sessions" ? (
      <section
        aria-labelledby="sessions-heading"
        id="management-sessions"
        tabIndex={-1}
        className="rounded-3xl border border-[#dce3d8] bg-white p-5 sm:p-7"
      >
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold" id="sessions-heading">
          <CalendarDays aria-hidden="true" className="size-4 text-[#657268]" />
          Sessions
        </h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-[#657268]">
          Keep the queue moving first. Session settings and court assignment
          stay close by when you need them. Times use {facility.timezone}.
        </p>
        {!timezoneValid ? (
          <p
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
          >
            The facility timezone is invalid.{" "}
            {editable
              ? "Save a valid IANA timezone in Facility details before editing session times."
              : "Ask a facility administrator to correct it."}
          </p>
        ) : sessions.length === 0 ? (
          <p className="mb-5 text-sm text-[#657268]">
            {editable
              ? "No sessions yet. Create a draft or open session."
              : "No sessions have been configured for this facility."}
          </p>
        ) : (
          <div className="mb-6 space-y-4">
            {sessions.map((item) => (
              <article
                className="rounded-2xl border border-[#dce3d8] bg-[#fbfcf8] p-4 sm:p-5"
                key={item.session.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.session.name}</p>
                    <p className="mt-1 text-sm text-[#657268]">
                  {item.session.status} ·{" "}
                  {formatFacilityDateTime(
                    item.session.starts_at,
                    facility.timezone,
                  )}
                    </p>
                  </div>
                  <span className={`management-status is-${item.session.status}`}>
                    {item.session.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="management-session-actions">
                  <Link href={`${sessionOperationsBaseHref}/${item.session.id}`}>
                    Queue and match controls <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                  {editable ? (
                    <SessionFormDialog
                      courts={courts}
                      defaultStartValue={defaultStartValue}
                      facilityId={facility.id}
                      sports={sports}
                      timezone={facility.timezone}
                      value={item}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
        {editable && timezoneValid ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#dfe6db] pt-5">
            <p className="text-sm text-[#657268]">
              Set the sport, time, match size, and courts for a new session.
            </p>
            <SessionFormDialog
              courts={courts}
              facilityId={facility.id}
              sports={sports}
              timezone={facility.timezone}
              defaultStartValue={defaultStartValue}
            />
          </div>
        ) : null}
      </section>
      ) : null}

      {section === "courts" ? (
      <section
        aria-labelledby="courts-heading"
        id="management-courts"
        tabIndex={-1}
        className="rounded-3xl border border-[#dce3d8] bg-white p-5 sm:p-7"
      >
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold" id="courts-heading">
          <MapPin aria-hidden="true" className="size-4 text-[#657268]" />
          Courts
        </h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-[#657268]">
          Courts can only be used by sessions for the same sport.
        </p>
        <div className="space-y-4">
          {courts.length === 0 ? (
            <p className="text-sm text-[#657268]">
              {editable
                ? "No courts yet. Add the first court for this facility."
                : "No courts have been configured for this facility."}
            </p>
          ) : (
            courts.map((court) => (
              <div className="management-court-row" key={court.id}>
                <div>
                  <p className="font-semibold">{court.name}</p>
                  <p className="mt-1 text-sm text-[#657268]">
                    {sports.find((sport) => sport.id === court.sport_id)?.name ?? "Unknown sport"}
                  </p>
                </div>
                <span className={`management-status is-${court.status}`}>{court.status}</span>
                {editable ? (
                  <div className="management-row-actions">
                    <CourtFormDialog court={court} facilityId={facility.id} sports={sports} />
                    <DeleteCourtButton court={court} facilityId={facility.id} />
                  </div>
                ) : <span />}
              </div>
            ))
          )}
          {editable ? <CourtFormDialog facilityId={facility.id} sports={sports} /> : null}
        </div>
      </section>
      ) : null}

      {section === "details" ? (
      <section
        aria-labelledby="facility-details-heading"
        id="management-details"
        tabIndex={-1}
        className="rounded-3xl border border-[#dce3d8] bg-white p-5 sm:p-7"
      >
        <h2 className="inline-flex items-center gap-2 text-lg font-semibold" id="facility-details-heading">
          <Building2 aria-hidden="true" className="size-4 text-[#657268]" />
          Facility details
        </h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-[#657268]">
          Update the facility information players see with open sessions.
        </p>
        {editable ? (
          <FacilitySettingsForm facility={facility} />
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[#657268]">Address</dt>
              <dd className="mt-1 text-[#20352a]">{facility.address ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-[#657268]">Timezone</dt>
              <dd className="mt-1 text-[#20352a]">{facility.timezone}</dd>
            </div>
          </dl>
        )}
      </section>
      ) : null}
    </div>
  );
}

export function FacilitySessionOperations({
  facilityId,
  facilityTimezone,
  sessionTimeLabel,
  session,
  courts,
  queueEntries,
  matches,
  editable,
  sports,
  defaultStartValue,
}: {
  facilityId: string;
  facilityTimezone: string;
  sessionTimeLabel: string;
  session: SessionWithCourts;
  courts: CourtRow[];
  queueEntries: WaitingQueueEntry[] | null;
  matches: SessionMatchRecord[] | null;
  editable: boolean;
  sports: SportRow[];
  defaultStartValue: string;
}) {
  return (
    <section className="facility-session-operations">
      <header className="facility-session-operations-heading">
        <div>
          <span className={`management-status is-${session.session.status}`}>
            {session.session.status}
          </span>
          <h1>{session.session.name}</h1>
          <p>{sessionTimeLabel}</p>
          {queueEntries !== null ? (
            <p className="facility-operations-finding">
              {courts.filter((court) => court.status === "available" && session.courtIds.includes(court.id)).length} courts free, {queueEntries.length} waiting
            </p>
          ) : null}
        </div>
        {editable ? (
          <SessionFormDialog
            courts={courts}
            defaultStartValue={defaultStartValue}
            facilityId={facilityId}
            sports={sports}
            timezone={facilityTimezone}
            value={session}
          />
        ) : null}
      </header>
      {queueEntries === null ? (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          This session&apos;s queue could not be loaded. Refresh the page to try again.
        </p>
      ) : (
        <StaffQueueManager entries={queueEntries} facilityId={facilityId} sessionId={session.session.id} />
      )}
      {matches === null ? (
        <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          This session&apos;s matches could not be loaded. Refresh the page to try again.
        </p>
      ) : (
        <MatchManager
          courts={courts
            .filter((court) => session.courtIds.includes(court.id))
            .map(({ id, name, status }) => ({ id, name, status }))}
          facilityId={facilityId}
          matches={matches}
          playersPerMatch={session.session.players_per_match}
          sessionId={session.session.id}
          sessionStatus={session.session.status}
          timezone={facilityTimezone}
        />
      )}
    </section>
  );
}

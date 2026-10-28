"use client";

import {
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

type SessionWithCourts = {
  session: SessionRow;
  courtIds: string[];
  queueEntries: WaitingQueueEntry[] | null;
  matches: SessionMatchRecord[] | null;
};

const initialState: FacilityActionState = {};

function ActionMessage({ state }: { state: FacilityActionState }) {
  if (state.error) {
    return (
      <p className="inline-flex items-start gap-2 text-sm text-rose-200" role="alert">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p className="inline-flex items-start gap-2 text-sm text-lime-200" role="status">
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
        <p className="text-xs text-slate-400">
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
      className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
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
          className="h-9 w-full rounded-md border border-input bg-slate-950 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            className="h-9 w-full rounded-md border border-input bg-slate-950 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="bg-[#a33d31] text-white hover:bg-[#8e342b]"
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
      className="space-y-5 rounded-2xl border border-white/10 bg-slate-950/40 p-5"
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
            className="h-9 w-full rounded-md border border-input bg-slate-950 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            className="h-9 w-full rounded-md border border-input bg-slate-950 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          <p className="text-sm text-slate-400">
            {selectedSportId
              ? "No available court supports this sport. Add or activate a compatible court."
              : "Choose a sport to see compatible available courts."}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {availableCourts.map((court) => (
              <label
                className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200"
                key={court.id}
              >
                <input
                  defaultChecked={selectedCourtIds.has(court.id)}
                  name="court_ids"
                  type="checkbox"
                  value={court.id}
                />
                <span>{court.name}</span>
                <span className="ml-auto text-xs text-slate-400">
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

export function FacilitySetup({
  facility,
  sports,
  courts,
  sessions,
  editable,
  defaultStartValue,
  timezoneValid,
}: {
  facility: FacilityRow;
  sports: SportRow[];
  courts: CourtRow[];
  sessions: SessionWithCourts[];
  editable: boolean;
  defaultStartValue: string;
  timezoneValid: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="facility-details-heading"
        className="order-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_14px_42px_rgba(27,45,31,0.05)] sm:p-7"
      >
        <h2
          className="inline-flex items-center gap-3 text-xl font-bold"
          id="facility-details-heading"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#e6edd9] text-[#45602c]">
            <Building2 aria-hidden="true" className="size-5" />
          </span>
          Facility details
        </h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Update the facility information players see with open sessions.
        </p>
        {editable ? (
          <FacilitySettingsForm facility={facility} />
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Address</dt>
              <dd className="mt-1 text-slate-100">{facility.address ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Timezone</dt>
              <dd className="mt-1 text-slate-100">{facility.timezone}</dd>
            </div>
          </dl>
        )}
      </section>

      <section
        aria-labelledby="courts-heading"
        className="order-2 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_14px_42px_rgba(27,45,31,0.05)] sm:p-7"
      >
        <h2
          className="inline-flex items-center gap-3 text-xl font-bold"
          id="courts-heading"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#e6edd9] text-[#45602c]">
            <MapPin aria-hidden="true" className="size-5" />
          </span>
          Courts
        </h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Courts can only be used by sessions for the same sport.
        </p>
        <div className="space-y-4">
          {courts.length === 0 ? (
            <p className="text-sm text-slate-400">
              {editable
                ? "No courts yet. Add the first court for this facility."
                : "No courts have been configured for this facility."}
            </p>
          ) : editable ? (
            courts.map((court) => (
              <div className="space-y-3" key={court.id}>
                <CourtForm court={court} facilityId={facility.id} sports={sports} />
                <DeleteCourtButton court={court} facilityId={facility.id} />
              </div>
            ))
          ) : (
            <ul className="space-y-2">
              {courts.map((court) => (
                <li
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm"
                  key={court.id}
                >
                  {court.name} ·{" "}
                  {sports.find((sport) => sport.id === court.sport_id)?.name ??
                    "Unknown sport"}{" "}
                  · {court.status}
                </li>
              ))}
            </ul>
          )}
          {editable ? (
            <CourtForm facilityId={facility.id} sports={sports} />
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="sessions-heading"
        className="order-1 rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-[0_14px_42px_rgba(27,45,31,0.05)] sm:p-7"
      >
        <h2
          className="inline-flex items-center gap-3 text-xl font-bold"
          id="sessions-heading"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#e6edd9] text-[#45602c]">
            <CalendarDays aria-hidden="true" className="size-5" />
          </span>
          Sessions
        </h2>
        <p className="mb-6 mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Keep the queue moving first. Session settings and court assignment
          stay close by when you need them. Times use {facility.timezone}.
        </p>
        {!timezoneValid ? (
          <p
            className="mb-5 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            The facility timezone is invalid.{" "}
            {editable
              ? "Save a valid IANA timezone in Facility details before editing session times."
              : "Ask a facility administrator to correct it."}
          </p>
        ) : sessions.length === 0 ? (
          <p className="mb-5 text-sm text-slate-400">
            {editable
              ? "No sessions yet. Create a draft or open session."
              : "No sessions have been configured for this facility."}
          </p>
        ) : (
          <div className="mb-6 space-y-4">
            {sessions.map((item) => (
              <article
                className="rounded-2xl border border-white/10 bg-[#fbfcf8] p-4 sm:p-5"
                key={item.session.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.session.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                  {item.session.status} ·{" "}
                  {formatFacilityDateTime(
                    item.session.starts_at,
                    facility.timezone,
                  )}
                    </p>
                  </div>
                  {item.session.status === "open" ? (
                    <span className="rounded-full bg-[#e8f1db] px-3 py-1 text-xs font-bold capitalize text-[#416028]">
                      Live session
                    </span>
                  ) : null}
                </div>
                {item.queueEntries === null ? (
                  <p className="mt-4 text-sm text-rose-200" role="alert">
                    This session&apos;s queue could not be loaded.
                  </p>
                ) : (
                  <StaffQueueManager
                    entries={item.queueEntries}
                    facilityId={facility.id}
                    sessionId={item.session.id}
                  />
                )}
                {item.matches === null ? (
                  <p className="mt-4 text-sm text-rose-200" role="alert">
                    This session&apos;s matches could not be loaded.
                  </p>
                ) : (
                  <MatchManager
                    courts={courts
                      .filter((court) => item.courtIds.includes(court.id))
                      .map((court) => ({
                        id: court.id,
                        name: court.name,
                        status: court.status,
                      }))}
                    facilityId={facility.id}
                    matches={item.matches}
                    playersPerMatch={item.session.players_per_match}
                    sessionId={item.session.id}
                    sessionStatus={item.session.status}
                    timezone={facility.timezone}
                  />
                )}
                {editable ? (
                  <details className="mt-4 rounded-xl border border-white/10 bg-[#f7f8f3]">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-[#3d4b42] marker:hidden">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays
                          aria-hidden="true"
                          className="size-4 text-[#52732f]"
                        />
                        Session settings
                      </span>
                      <span aria-hidden="true" className="text-lg leading-none">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-[#e1e6dc] p-3 sm:p-4">
                      <SessionForm
                        courts={courts}
                        facilityId={facility.id}
                        sports={sports}
                        timezone={facility.timezone}
                        defaultStartValue={defaultStartValue}
                        value={item}
                      />
                    </div>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        )}
        {editable && timezoneValid ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#cbd5c1] bg-[#f7f8f3] p-4 sm:p-5">
            <h3 className="inline-flex items-center gap-2 font-bold">
              <Plus aria-hidden="true" className="size-4 text-[#52732f]" />
              Create a session
            </h3>
            <p className="mb-4 mt-1 text-sm text-slate-400">
              Set the sport, time, match size, and courts to open play.
            </p>
            <SessionForm
              courts={courts}
              facilityId={facility.id}
              sports={sports}
              timezone={facility.timezone}
              defaultStartValue={defaultStartValue}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

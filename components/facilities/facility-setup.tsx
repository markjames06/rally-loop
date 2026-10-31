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
      <div className="inline-flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium" style={{ borderColor: 'var(--negative)', backgroundColor: 'var(--pill-negative-bg)', color: 'var(--pill-negative-ink)' }} role="alert">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--negative)' }} />
        {state.error}
      </div>
    );
  }
  if (state.notice) {
    return (
      <div className="inline-flex items-start gap-2 rounded-md border px-3 py-2 text-xs font-medium" style={{ borderColor: 'var(--positive)', backgroundColor: 'var(--pill-positive-bg)', color: 'var(--pill-positive-ink)' }} role="status">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--positive)' }} />
        {state.notice}
      </div>
    );
  }
  return null;
}

export function FacilitySettingsForm({ facility }: { facility: FacilityRow }) {
  const action = updateFacilityAction.bind(null, facility.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700" htmlFor="facility-name">Facility name</Label>
        <Input
          autoComplete="organization"
          className="h-10 rounded-md border bg-white font-medium text-slate-900 focus-visible:ring-emerald-500"
          defaultValue={facility.name}
          id="facility-name"
          maxLength={120}
          minLength={2}
          name="name"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700" htmlFor="facility-slug">URL slug</Label>
        <Input
          className="h-10 rounded-md border bg-white font-medium text-slate-900 focus-visible:ring-emerald-500"
          defaultValue={facility.slug}
          id="facility-slug"
          maxLength={80}
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs font-semibold text-slate-700" htmlFor="facility-address">Address</Label>
        <Input
          autoComplete="street-address"
          className="h-10 rounded-md border bg-white font-medium text-slate-900 focus-visible:ring-emerald-500"
          defaultValue={facility.address ?? ""}
          id="facility-address"
          maxLength={240}
          name="address"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700" htmlFor="facility-timezone">IANA timezone</Label>
        <Input
          className="h-10 rounded-md border bg-white font-medium text-slate-900 focus-visible:ring-emerald-500"
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
        <Button
          className="h-10 w-full rounded-md bg-emerald-600 font-semibold text-white shadow-xs transition hover:bg-emerald-700 sm:w-fit"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            "Saving..."
          ) : (
            <>
              <Save aria-hidden="true" className="mr-1.5 size-4" />
              Save facility
            </>
          )}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function CourtForm({
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
      className="grid gap-4 rounded-md border border bg-white p-5 lg:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700" htmlFor={`court-name-${court?.id ?? "new"}`}>Court name</Label>
        <Input
          className="h-10 rounded-md border bg-white font-medium text-slate-900 focus-visible:ring-emerald-500"
          defaultValue={court?.name ?? ""}
          id={`court-name-${court?.id ?? "new"}`}
          maxLength={80}
          name="name"
          placeholder="Court 1"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-700" htmlFor={`court-sport-${court?.id ?? "new"}`}>Sport</Label>
        <select
          className="h-10 w-full rounded-md border border bg-white px-3 text-sm font-medium text-slate-800 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700" htmlFor={`court-status-${court.id}`}>Court status</Label>
          <select
            className="h-10 w-full rounded-md border border bg-white px-3 text-sm font-medium text-slate-800 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
        <Button
          className="h-10 rounded-md bg-emerald-600 font-semibold text-white shadow-xs transition hover:bg-emerald-700"
          disabled={pending || sports.length === 0}
          type="submit"
        >
          {pending ? (
            "Saving..."
          ) : court ? (
            <>
              <Save aria-hidden="true" className="mr-1.5 size-4" />
              Save court
            </>
          ) : (
            <>
              <Plus aria-hidden="true" className="mr-1.5 size-4" />
              Add court
            </>
          )}
        </Button>
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function CourtFormDialog({
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
      <Button
        className={court ? "rounded-md" : "rounded-md bg-emerald-600 font-semibold text-white shadow-xs hover:bg-emerald-700"}
        onClick={() => setOpen(true)}
        type="button"
        variant={court ? "outline" : "default"}
      >
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

export function DeleteCourtButton({
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
        className="rounded-md border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
        onClick={() => setDialogOpen(true)}
        type="button"
        variant="outline"
      >
        <Trash2 aria-hidden="true" className="mr-1.5 size-4" />
        Delete court
      </Button>
      <Dialog
        description="Deleting a court cannot be undone. Sessions that use this court may no longer be able to assign matches."
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title={`Delete ${court.name}?`}
      >
        <form action={formAction} className="space-y-4">
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
            This court will be removed from the facility. You can cancel if
            you&apos;re not sure.
          </div>
          <ActionMessage state={state} />
          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button
              className="rounded-md"
              onClick={() => setDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Keep court
            </Button>
            <Button
              className="rounded-md bg-rose-600 text-white hover:bg-rose-700"
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
      className="space-y-5 rounded-md border border-[#dce3d8] bg-white p-5"
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
                className="flex items-center gap-3 rounded-md border border-[#dce3d8] px-3 py-2 text-sm text-[#34483b]"
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
          className="rounded-md border p-6 sm:p-8"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--rule)' }}>
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-5" style={{ color: 'var(--accent)' }} />
                <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }} id="sessions-heading">
                  Sessions
                </h2>
              </div>
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Keep the queue moving first. Session settings and court assignment stay close by. Times use {facility.timezone}.
              </p>
            </div>
            {editable && timezoneValid ? (
              <SessionFormDialog
                courts={courts}
                defaultStartValue={defaultStartValue}
                facilityId={facility.id}
                sports={sports}
                timezone={facility.timezone}
              />
            ) : null}
          </div>

          {!timezoneValid ? (
            <div
              className="mt-6 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
              role="alert"
            >
              The facility timezone is invalid.{" "}
              {editable
                ? "Save a valid IANA timezone in Facility details before editing session times."
                : "Ask a facility administrator to correct it."}
            </div>
          ) : sessions.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              {editable
                ? "No sessions yet. Create a draft or open session."
                : "No sessions have been configured for this facility."}
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {sessions.map((item) => {
                const isOpen = item.session.status === "open";
                const isPaused = item.session.status === "paused";
                return (
                  <article
                    className="flex flex-col justify-between gap-4 rounded-md border border/90 bg-white p-5 shadow-xs transition hover:border-slate-300 sm:flex-row sm:items-center"
                    key={item.session.id}
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <p className="font-bold text-slate-900">{item.session.name}</p>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                            isOpen
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                              : isPaused
                                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                : "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isOpen ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-slate-400"
                            }`}
                            aria-hidden="true"
                          />
                          {item.session.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFacilityDateTime(item.session.starts_at, facility.timezone)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
                        href={`${sessionOperationsBaseHref}/${item.session.id}`}
                      >
                        Queue and match controls
                        <ArrowRight aria-hidden="true" className="size-3.5" />
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
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {section === "courts" ? (
        <section
          aria-labelledby="courts-heading"
          id="management-courts"
          tabIndex={-1}
          className="rounded-md border p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
            <div>
              <div className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="size-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-slate-900" id="courts-heading">
                  Courts
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Courts can only be used by sessions for the same sport.
              </p>
            </div>
            {editable ? <CourtFormDialog facilityId={facility.id} sports={sports} /> : null}
          </div>

          <div className="mt-6 space-y-3">
            {courts.length === 0 ? (
              <p className="text-sm text-slate-500">
                {editable
                  ? "No courts yet. Add the first court for this facility."
                  : "No courts have been configured for this facility."}
              </p>
            ) : (
              courts.map((court) => {
                const isAvailable = court.status === "available";
                const isOccupied = court.status === "occupied";
                return (
                  <div
                    key={court.id}
                    className="flex flex-col justify-between gap-3 rounded-md border border/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{court.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {sports.find((sport) => sport.id === court.sport_id)?.name ?? "Unknown sport"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          isAvailable
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                            : isOccupied
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                              : "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isAvailable ? "bg-emerald-500" : isOccupied ? "bg-amber-500" : "bg-slate-400"
                          }`}
                          aria-hidden="true"
                        />
                        {court.status}
                      </span>

                      {editable ? (
                        <div className="flex items-center gap-2">
                          <CourtFormDialog court={court} facilityId={facility.id} sports={sports} />
                          <DeleteCourtButton court={court} facilityId={facility.id} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      {section === "details" ? (
        <section
          aria-labelledby="facility-details-heading"
          id="management-details"
          tabIndex={-1}
          className="rounded-md border p-6 sm:p-8"
        >
          <div className="border-b pb-5">
            <div className="flex items-center gap-2">
              <Building2 aria-hidden="true" className="size-5 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900" id="facility-details-heading">
                Facility details
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Update the facility information players see with open sessions.
            </p>
          </div>

          <div className="mt-6">
            {editable ? (
              <FacilitySettingsForm facility={facility} />
            ) : (
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                <div className="rounded-md border border-slate-100 bg-slate-50/70 p-4">
                  <dt className="text-sm font-medium text-slate-500">Address</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{facility.address ?? "Not set"}</dd>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50/70 p-4">
                  <dt className="text-sm font-medium text-slate-500">Timezone</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{facility.timezone}</dd>
                </div>
              </dl>
            )}
          </div>
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
  const isOpen = session.session.status === "open";
  const isPaused = session.session.status === "paused";
  const freeCourts = courts.filter(
    (court) => court.status === "available" && session.courtIds.includes(court.id),
  ).length;

  return (
    <section className="space-y-8">
      {/* Cockpit Command Header */}
      <header className="flex flex-col justify-between gap-5 rounded-3xl border border/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                isOpen
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                  : isPaused
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                    : "bg-slate-100 text-slate-700 ring-1 ring-slate-600/20"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  isOpen ? "bg-emerald-600" : isPaused ? "bg-amber-500" : "bg-slate-400"
                }`}
                aria-hidden="true"
              />
              {session.session.status}
            </span>
            <span className="text-xs font-medium text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">{sessionTimeLabel}</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {session.session.name}
          </h1>

          {queueEntries !== null ? (
            <p className="facility-operations-finding inline-flex items-center gap-2 rounded-full bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200/80">
              {freeCourts} courts free, {queueEntries.length} waiting
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

      {/* Dual-Pane Operations Cockpit */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Pane: Staff Queue Manager (FIFO queue + skip management) */}
        <div className="lg:col-span-5 space-y-6">
          {queueEntries === null ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
              This session&apos;s queue could not be loaded. Refresh the page to try again.
            </div>
          ) : (
            <StaffQueueManager entries={queueEntries} facilityId={facilityId} sessionId={session.session.id} />
          )}
        </div>

        {/* Right Pane: Match Manager (Assignment + Active Matches + History) */}
        <div className="lg:col-span-7 space-y-6">
          {matches === null ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
              This session&apos;s matches could not be loaded. Refresh the page to try again.
            </div>
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
        </div>
      </div>
    </section>
  );
}

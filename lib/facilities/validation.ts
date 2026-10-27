import type { CourtStatus, SessionStatus } from "@/types/database";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const localDateTimePattern =
  /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})$/;

const sessionStatuses: readonly SessionStatus[] = [
  "draft",
  "open",
  "paused",
  "closed",
  "completed",
];
const courtStatuses: readonly CourtStatus[] = [
  "available",
  "occupied",
  "inactive",
];

export type FacilitySettings = {
  name: string;
  slug: string;
  address: string | null;
  timezone: string;
};

export type SessionInput = {
  sportId: string;
  name: string;
  startsAtLocal: string;
  endsAtLocal: string | null;
  status: string;
  playersPerMatch: number;
  courtIds: string[];
};

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function isCourtStatus(value: string): value is CourtStatus {
  return courtStatuses.some((status) => status === value);
}

export function isSessionStatus(value: string): value is SessionStatus {
  return sessionStatuses.some((status) => status === value);
}

export function validateFacilitySettings(
  input: FacilitySettings,
): string | null {
  if (input.name.length < 2 || input.name.length > 120) {
    return "Facility name must be between 2 and 120 characters.";
  }
  if (input.slug.length > 80 || !slugPattern.test(input.slug)) {
    return "Use a lowercase URL slug with letters, numbers, and single hyphens.";
  }
  if (input.address && input.address.length > 240) {
    return "Facility address must be 240 characters or fewer.";
  }
  if (!isValidTimezone(input.timezone)) {
    return "Enter a valid IANA timezone, such as America/Los_Angeles.";
  }

  return null;
}

export function validateCourtInput(
  name: string,
  sportId: string,
  status?: string,
): string | null {
  if (name.length < 1 || name.length > 80) {
    return "Court name must be between 1 and 80 characters.";
  }
  if (!isUuid(sportId)) {
    return "Choose a valid sport.";
  }
  if (status !== undefined && !isCourtStatus(status)) {
    return "Choose a valid court status.";
  }

  return null;
}

export function validateSessionInput(
  input: SessionInput,
): string | null {
  if (input.name.length < 1 || input.name.length > 120) {
    return "Session name must be between 1 and 120 characters.";
  }
  if (!isUuid(input.sportId)) {
    return "Choose a valid sport.";
  }
  if (!isValidLocalDateTime(input.startsAtLocal)) {
    return "Enter a valid session start date and time.";
  }
  if (
    input.endsAtLocal !== null &&
    !isValidLocalDateTime(input.endsAtLocal)
  ) {
    return "Enter a valid session end date and time.";
  }
  if (
    input.endsAtLocal !== null &&
    input.endsAtLocal <= input.startsAtLocal
  ) {
    return "The session end time must be after its start time.";
  }
  if (!isSessionStatus(input.status)) {
    return "Choose a valid session status.";
  }
  if (
    !Number.isSafeInteger(input.playersPerMatch) ||
    input.playersPerMatch < 1
  ) {
    return "Players per match must be a positive whole number.";
  }
  if (input.courtIds.some((id) => !isUuid(id))) {
    return "Choose valid courts for the session.";
  }
  if (new Set(input.courtIds).size !== input.courtIds.length) {
    return "Choose each court only once.";
  }
  if (input.status === "open" && input.courtIds.length === 0) {
    return "An open session must use at least one court.";
  }

  return null;
}

export function isValidTimezone(timezone: string): boolean {
  if (timezone.length < 1 || timezone.length > 100) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch (error) {
    if (error instanceof RangeError) {
      return false;
    }

    throw error;
  }
}

function isValidLocalDateTime(value: string): boolean {
  const match = localDateTimePattern.exec(value);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (year < 1 || month < 1 || month > 12 || hour > 23 || minute > 59) {
    return false;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, 0, 0);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

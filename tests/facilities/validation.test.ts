import { describe, expect, it } from "vitest";

import {
  isCourtStatus,
  isSessionStatus,
  validateCourtInput,
  validateFacilitySettings,
  validateSessionInput,
  type SessionInput,
} from "../../lib/facilities/validation";

const sportId = "8f8c7d10-3d57-4f4e-9af7-6aa49942e6a1";
const courtId = "d1f4b280-7d54-4bfc-8b10-a785f90d1849";

describe("facility settings validation", () => {
  it("accepts valid details and rejects malformed slugs and timezones", () => {
    expect(
      validateFacilitySettings({
        name: "Rally Court",
        slug: "rally-court",
        address: "100 Court Road",
        timezone: "America/Los_Angeles",
      }),
    ).toBeNull();
    expect(
      validateFacilitySettings({
        name: "Rally Court",
        slug: "Rally Court",
        address: null,
        timezone: "Not/A_Timezone",
      }),
    ).not.toBeNull();
  });
});

describe("court validation", () => {
  it("requires a name, a valid sport id, and a supported status", () => {
    expect(validateCourtInput("Court 1", sportId, "available")).toBeNull();
    expect(validateCourtInput("", sportId)).not.toBeNull();
    expect(validateCourtInput("Court 1", "unknown", "available")).not.toBeNull();
    expect(validateCourtInput("Court 1", sportId, "broken")).not.toBeNull();
  });

  it("recognizes only supported court states", () => {
    expect(isCourtStatus("available")).toBe(true);
    expect(isCourtStatus("broken")).toBe(false);
  });
});

describe("session validation", () => {
  const validSession: SessionInput = {
    sportId,
    name: "Saturday open play",
    startsAtLocal: "2026-10-28T09:30",
    endsAtLocal: "2026-10-28T11:30",
    status: "open",
    playersPerMatch: 4,
    courtIds: [courtId],
  };

  it("accepts open sessions with a compatible court selection", () => {
    expect(validateSessionInput(validSession)).toBeNull();
    expect(isSessionStatus("open")).toBe(true);
    expect(isSessionStatus("active")).toBe(false);
  });

  it("allows draft sessions without courts", () => {
    expect(
      validateSessionInput({
        ...validSession,
        status: "draft",
        courtIds: [],
        endsAtLocal: null,
      }),
    ).toBeNull();
  });

  it.each([
    {
      ...validSession,
      startsAtLocal: "2026-02-30T09:30",
    },
    {
      ...validSession,
      endsAtLocal: "2026-10-28T08:30",
    },
    {
      ...validSession,
      status: "open",
      courtIds: [],
    },
    {
      ...validSession,
      courtIds: [courtId, courtId],
    },
    {
      ...validSession,
      playersPerMatch: 0,
    },
    {
      ...validSession,
      status: "unknown",
    },
  ])("rejects invalid session data", (session) => {
    expect(validateSessionInput(session)).not.toBeNull();
  });
});

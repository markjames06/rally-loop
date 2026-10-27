import { describe, expect, it } from "vitest";

import {
  formatFacilityDateTime,
  toLocalDateTimeInput,
} from "../../lib/facilities/datetime";

describe("facility timezone display", () => {
  it("formats stored UTC timestamps as facility-local date-time input", () => {
    expect(
      toLocalDateTimeInput(
        "2026-10-28T17:30:00.000Z",
        "America/Los_Angeles",
      ),
    ).toBe("2026-10-28T10:30");
  });

  it("formats session times in the facility timezone", () => {
    expect(
      formatFacilityDateTime(
        "2026-10-28T17:30:00.000Z",
        "America/Los_Angeles",
      ),
    ).toContain("10:30 AM");
  });

  it("returns an empty datetime-local value for an unset end time", () => {
    expect(toLocalDateTimeInput(null, "UTC")).toBe("");
  });
});

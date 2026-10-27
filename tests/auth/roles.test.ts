import { describe, expect, it } from "vitest";

import {
  facilityRoles,
  isAllowedRedirectPath,
  isFacilityRole,
  isPublishableSupabaseKey,
  isValidSupabaseProjectUrl,
  validateCredentials,
  validateDisplayName,
} from "../../lib/auth/roles";

describe("facility roles", () => {
  it("recognizes only the database-supported staff roles", () => {
    expect(facilityRoles).toEqual(["admin", "staff"]);
    expect(isFacilityRole("admin")).toBe(true);
    expect(isFacilityRole("staff")).toBe(true);
    expect(isFacilityRole("player")).toBe(false);
    expect(isFacilityRole("owner")).toBe(false);
  });
});

describe("post-authentication redirect paths", () => {
  it("accepts local application paths", () => {
    expect(isAllowedRedirectPath("/player", "/")).toBe("/player");
    expect(
      isAllowedRedirectPath(
        "/management/8f8c7d10-3d57-4f4e-9af7-6aa49942e6a1",
        "/",
      ),
    ).toBe("/management/8f8c7d10-3d57-4f4e-9af7-6aa49942e6a1");
  });

  it.each([
    null,
    "",
    "https://example.com",
    "//example.com",
    "\\\\example.com",
    "/\\example.com",
  ])("falls back for unsafe redirect input %s", (path) => {
    expect(isAllowedRedirectPath(path, "/player")).toBe("/player");
  });
});

describe("sign-up input validation", () => {
  it("requires a trimmed display name of 2 to 80 characters", () => {
    expect(validateDisplayName("  Rally Player  ")).toBeNull();
    expect(validateDisplayName(" ")).not.toBeNull();
    expect(validateDisplayName("x".repeat(81))).not.toBeNull();
  });

  it("requires a valid email and an 8 to 128 character password", () => {
    expect(validateCredentials("player@example.com", "rallyloop123")).toBeNull();
    expect(validateCredentials("not-an-email", "rallyloop123")).not.toBeNull();
    expect(validateCredentials("player@example.com", "short")).not.toBeNull();
    expect(
      validateCredentials("player@example.com", "x".repeat(129)),
    ).not.toBeNull();
  });
});

describe("Supabase project URL validation", () => {
  it("accepts HTTPS project URLs and local development URLs", () => {
    expect(
      isValidSupabaseProjectUrl("https://rallyloop.supabase.co"),
    ).toBe(true);
    expect(isValidSupabaseProjectUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isValidSupabaseProjectUrl("http://localhost:54321")).toBe(true);
  });

  it.each([
    undefined,
    "",
    "not-a-url",
    "http://rallyloop.supabase.co",
    "https://rallyloop.supabase.co/rest/v1",
    "https://user:password@rallyloop.supabase.co",
    "https://rallyloop.supabase.co?apikey=key",
  ])("rejects a non-project Supabase URL: %s", (url) => {
    expect(isValidSupabaseProjectUrl(url)).toBe(false);
  });
});

describe("Supabase publishable key validation", () => {
  it("accepts only the public publishable-key format", () => {
    expect(isPublishableSupabaseKey("sb_publishable_example")).toBe(true);
    expect(isPublishableSupabaseKey("sb_secret_example")).toBe(false);
    expect(isPublishableSupabaseKey("")).toBe(false);
    expect(isPublishableSupabaseKey(undefined)).toBe(false);
  });
});

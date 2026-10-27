export const facilityRoles = ["admin", "staff"] as const;

export type FacilityRole = (typeof facilityRoles)[number];

export function isFacilityRole(value: string): value is FacilityRole {
  return facilityRoles.some((role) => role === value);
}

export function isAllowedRedirectPath(
  value: string | null,
  fallback: string,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  const origin = "https://rallyloop.invalid";
  const target = new URL(value, origin);

  if (target.origin !== origin || target.pathname.startsWith("//")) {
    return fallback;
  }

  return `${target.pathname}${target.search}${target.hash}`;
}

export function validateDisplayName(value: string): string | null {
  const displayName = value.trim();

  if (displayName.length < 2 || displayName.length > 80) {
    return "Enter a display name between 2 and 80 characters.";
  }

  return null;
}

export function validateCredentials(
  email: string,
  password: string,
): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }

  if (password.length < 8 || password.length > 128) {
    return "Your password must be between 8 and 128 characters.";
  }

  return null;
}

export function isValidSupabaseProjectUrl(value: string | undefined): boolean {
  if (!value || !URL.canParse(value)) {
    return false;
  }

  const url = new URL(value);
  const validProtocol =
    url.protocol === "https:" ||
    (url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1"));

  return (
    validProtocol &&
    !url.username &&
    !url.password &&
    url.pathname === "/" &&
    !url.search &&
    !url.hash
  );
}

export function isPublishableSupabaseKey(value: string | undefined): boolean {
  return value?.startsWith("sb_publishable_") ?? false;
}

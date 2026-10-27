export function toLocalDateTimeInput(
  value: string | null,
  timezone: string,
): string {
  if (!value) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));

  const getPart = (type: Intl.DateTimeFormatPartTypes): string => {
    const part = parts.find((item) => item.type === type);
    if (!part) {
      throw new Error(`Missing ${type} date-time component.`);
    }

    return part.value;
  };

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}

export function formatFacilityDateTime(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

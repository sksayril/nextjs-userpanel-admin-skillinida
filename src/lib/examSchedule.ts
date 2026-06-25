export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
export const APP_TIMEZONE_LABEL = process.env.APP_TIMEZONE_LABEL || "IST";

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function getTimezoneOffsetForDate(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(utcDate);

  const offset = parts.find((part) => part.type === "timeZoneName")?.value || "GMT+05:30";
  const match = offset.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);

  if (!match) {
    return "+05:30";
  }

  const sign = match[1];
  const hours = match[2].padStart(2, "0");
  const minutes = (match[3] || "00").padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

export function toDatetimeLocalValue(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function parseScheduledAt(value?: string | Date | null): Date {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return new Date();
  }

  if (trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const match = trimmed.match(DATETIME_LOCAL_PATTERN);
  if (!match) {
    return new Date(trimmed);
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const offset = getTimezoneOffsetForDate(
    APP_TIMEZONE,
    year,
    month,
    day,
    hour,
    minute
  );

  return new Date(
    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offset}`
  );
}

export function formatExamSchedule(
  value?: string | Date | null,
  timeZone: string = APP_TIMEZONE
): string {
  if (!value) {
    return "Now";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${formatted} (${APP_TIMEZONE_LABEL})`;
}

export function formatExamSchedule24h(
  value?: string | Date | null,
  timeZone: string = APP_TIMEZONE
): string {
  if (!value) {
    return "Now";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  const formatted = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${formatted} (${APP_TIMEZONE_LABEL})`;
}

export function isExamNotStarted(
  scheduledAt?: string | Date | null,
  now: Date = new Date()
): boolean {
  if (!scheduledAt) {
    return false;
  }

  const startTime = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
  if (Number.isNaN(startTime.getTime())) {
    return false;
  }

  return startTime.getTime() > now.getTime();
}

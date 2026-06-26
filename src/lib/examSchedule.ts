export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";
export const APP_TIMEZONE_LABEL = process.env.APP_TIMEZONE_LABEL || "IST";
export const APP_TIMEZONE_OFFSET = process.env.APP_TIMEZONE_OFFSET || "+05:30";

const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

function pad(value: number | string): string {
  return String(value).padStart(2, "0");
}

function getTimezoneOffsetForApp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): string {
  if (APP_TIMEZONE === "Asia/Kolkata") {
    return APP_TIMEZONE_OFFSET;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    timeZoneName: "longOffset",
  }).formatToParts(utcDate);

  const offset = parts.find((part) => part.type === "timeZoneName")?.value || "GMT+05:30";
  const match = offset.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);

  if (!match) {
    return APP_TIMEZONE_OFFSET;
  }

  return `${match[1]}${match[2].padStart(2, "0")}:${(match[3] || "00").padStart(2, "0")}`;
}

export function toScheduledAtDate(value?: string | Date | null): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
  const offset = getTimezoneOffsetForApp(year, month, day, hour, minute);

  return new Date(
    `${pad(year)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${offset}`
  );
}

export function toScheduledAtIstIso(value?: string | Date | null): string | null {
  const date = toScheduledAtDate(value);
  if (!date) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${APP_TIMEZONE_OFFSET}`;
}

export function enrichQuizWithSchedule<T extends Record<string, unknown>>(quiz: T) {
  const scheduledDate = toScheduledAtDate(quiz.scheduledAt as string | Date | null);
  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const questionCount =
    typeof quiz.questionCount === "number" ? quiz.questionCount : questions.length;

  const enriched = {
    ...quiz,
    questionCount,
  };

  if (!scheduledDate) {
    return enriched;
  }

  return {
    ...enriched,
    scheduledAt: toScheduledAtIstIso(scheduledDate),
    scheduledAtUtc: scheduledDate.toISOString(),
    scheduledAtDisplay: formatExamSchedule(scheduledDate),
  };
}

export function formatExamSchedule(
  value?: string | Date | null,
  timeZone: string = APP_TIMEZONE
): string {
  if (!value) {
    return "Now";
  }

  const date = toScheduledAtDate(value);
  if (!date) {
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

  const date = toScheduledAtDate(value);
  if (!date) {
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

  const startTime = toScheduledAtDate(scheduledAt);
  if (!startTime) {
    return false;
  }

  return startTime.getTime() > now.getTime();
}

export function getExamWindowEnd(
  scheduledAt?: string | Date | null,
  durationMinutes = 30
): Date | null {
  const startTime = toScheduledAtDate(scheduledAt);
  if (!startTime) {
    return null;
  }

  return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
}

export function isExamWindowClosed(
  scheduledAt?: string | Date | null,
  durationMinutes = 30,
  now: Date = new Date()
): boolean {
  const windowEnd = getExamWindowEnd(scheduledAt, durationMinutes);
  if (!windowEnd) {
    return false;
  }

  return now.getTime() >= windowEnd.getTime();
}

export function isExamActive(
  scheduledAt?: string | Date | null,
  durationMinutes = 30,
  now: Date = new Date()
): boolean {
  return !isExamNotStarted(scheduledAt, now) && !isExamWindowClosed(scheduledAt, durationMinutes, now);
}

export function getExamRemainingSeconds(
  scheduledAt?: string | Date | null,
  durationMinutes = 30,
  now: Date = new Date()
): number {
  const windowEnd = getExamWindowEnd(scheduledAt, durationMinutes);
  if (!windowEnd || isExamNotStarted(scheduledAt, now)) {
    return 0;
  }

  const remainingMs = windowEnd.getTime() - now.getTime();
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function formatExamWindowEnd(
  scheduledAt?: string | Date | null,
  durationMinutes = 30
): string {
  const windowEnd = getExamWindowEnd(scheduledAt, durationMinutes);
  if (!windowEnd) {
    return "N/A";
  }

  return formatExamSchedule(windowEnd);
}

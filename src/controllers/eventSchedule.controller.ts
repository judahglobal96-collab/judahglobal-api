import type { Request, Response } from "express";
import { db } from "../config/db";

type ScheduleType = "one_time" | "recurring_weekly" | "recurring_monthly";
type WeekdayCode = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";
type MonthlyMode = "day_of_month" | "nth_weekday";

type SchedulePayload = {
  event_type?: ScheduleType;
  schedule_type?: ScheduleType;
  start_date?: string;
  start_time?: string;
  end_date?: string | null;
  end_time?: string | null;
  schedule_timezone?: string;
  recurrence_interval?: number | string;
  recurrence_days?: WeekdayCode[];
  monthly_mode?: MonthlyMode;
  monthly_day?: number | string | null;
  monthly_week?: number | string | null;
  monthly_weekday?: WeekdayCode | null;
  recurrence_until?: string | null;
};

type ValidatedScheduleData = {
  scheduleType: ScheduleType;
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
  timezone: string;
  recurrenceInterval: number;
  recurrenceDays: WeekdayCode[];
  monthlyMode: MonthlyMode | null;
  monthlyDay: number | null;
  monthlyWeek: number | null;
  monthlyWeekday: WeekdayCode | null;
  recurrenceUntil: string | null;
};

type ValidationSuccess = {
  ok: true;
  data: ValidatedScheduleData;
};

type ValidationFailure = {
  ok: false;
  message: string;
};

type ValidationResult = ValidationSuccess | ValidationFailure;

const VALID_WEEKDAYS: WeekdayCode[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function isValidDate(value?: string | null): boolean {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value?: string | null): boolean {
  if (!value) return false;
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function normalizeTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function normalizeScheduleType(payload: SchedulePayload): ScheduleType {
  return (payload.schedule_type || payload.event_type || "one_time") as ScheduleType;
}

function toPositiveInt(value: unknown, fallback = 1): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

function cleanWeekdays(days?: string[] | null): WeekdayCode[] {
  if (!Array.isArray(days)) return [];
  return days
    .map((d) => String(d).toUpperCase())
    .filter((d): d is WeekdayCode => VALID_WEEKDAYS.includes(d as WeekdayCode));
}

function buildRRule(args: {
  scheduleType: ScheduleType;
  interval: number;
  recurrenceDays: WeekdayCode[];
  monthlyMode?: MonthlyMode | null;
  monthlyDay?: number | null;
  monthlyWeek?: number | null;
  monthlyWeekday?: WeekdayCode | null;
  recurrenceUntil?: string | null;
}): string | null {
  const {
    scheduleType,
    interval,
    recurrenceDays,
    monthlyMode,
    monthlyDay,
    monthlyWeek,
    monthlyWeekday,
    recurrenceUntil,
  } = args;

  if (scheduleType === "one_time") return null;

  const parts: string[] = [];

  if (scheduleType === "recurring_weekly") {
    parts.push("FREQ=WEEKLY");
    parts.push(`INTERVAL=${interval}`);
    parts.push(`BYDAY=${recurrenceDays.join(",")}`);
  }

  if (scheduleType === "recurring_monthly") {
    parts.push("FREQ=MONTHLY");
    parts.push(`INTERVAL=${interval}`);

    if (monthlyMode === "day_of_month" && monthlyDay) {
      parts.push(`BYMONTHDAY=${monthlyDay}`);
    }

    if (monthlyMode === "nth_weekday" && monthlyWeek && monthlyWeekday) {
      parts.push(`BYDAY=${monthlyWeek}${monthlyWeekday}`);
    }
  }

  if (recurrenceUntil) {
    parts.push(`UNTIL=${recurrenceUntil.replace(/-/g, "")}T235959Z`);
  }

  return parts.join(";");
}

function validateChronology(args: {
  startDate: string;
  startTime: string;
  endDate: string | null;
  endTime: string | null;
}): ValidationFailure | null {
  const { startDate, startTime, endDate, endTime } = args;

  if (endDate && endDate < startDate) {
    return {
      ok: false,
      message: "End date cannot be earlier than start date.",
    };
  }

  if (endDate && endDate === startDate && endTime && endTime < startTime) {
    return {
      ok: false,
      message: "End time cannot be earlier than start time on the same day.",
    };
  }

  return null;
}

function validateSchedule(payload: SchedulePayload): ValidationResult {
  const scheduleType = normalizeScheduleType(payload);
  const startDate = payload.start_date;
  const startTime = payload.start_time;
  const endDate = payload.end_date || null;
  const endTime = payload.end_time || null;
  const timezone = payload.schedule_timezone;
  const recurrenceInterval = toPositiveInt(payload.recurrence_interval, 1);
  const recurrenceDays = cleanWeekdays(payload.recurrence_days);
  const monthlyMode = payload.monthly_mode || null;
  const monthlyDay =
    payload.monthly_day === null || payload.monthly_day === undefined
      ? null
      : Number(payload.monthly_day);
  const monthlyWeek =
    payload.monthly_week === null || payload.monthly_week === undefined
      ? null
      : Number(payload.monthly_week);
  const monthlyWeekday = payload.monthly_weekday || null;
  const recurrenceUntil = payload.recurrence_until || null;

  if (!["one_time", "recurring_weekly", "recurring_monthly"].includes(scheduleType)) {
    return { ok: false, message: "Invalid schedule type." };
  }

  if (!isValidDate(startDate)) {
    return { ok: false, message: "A valid start date is required." };
  }

  if (!isValidTime(startTime)) {
    return { ok: false, message: "A valid start time is required." };
  }

  if (!timezone) {
    return { ok: false, message: "A schedule timezone is required." };
  }

  if (endDate && !isValidDate(endDate)) {
    return { ok: false, message: "End date is invalid." };
  }

  if (endTime && !isValidTime(endTime)) {
    return { ok: false, message: "End time is invalid." };
  }

  const normalizedStartTime = normalizeTime(startTime!);
  const normalizedEndTime = endTime ? normalizeTime(endTime) : null;

  const chronologyError = validateChronology({
    startDate: startDate!,
    startTime: normalizedStartTime,
    endDate,
    endTime: normalizedEndTime,
  });

  if (chronologyError) {
    return chronologyError;
  }

  if (scheduleType === "one_time") {
    return {
      ok: true,
      data: {
        scheduleType,
        startDate: startDate!,
        startTime: normalizedStartTime,
        endDate,
        endTime: normalizedEndTime,
        timezone: timezone!,
        recurrenceInterval: 1,
        recurrenceDays: [],
        monthlyMode: null,
        monthlyDay: null,
        monthlyWeek: null,
        monthlyWeekday: null,
        recurrenceUntil: null,
      },
    };
  }

  if (!recurrenceUntil || !isValidDate(recurrenceUntil)) {
    return { ok: false, message: "A valid recurrence end date is required." };
  }

  if (recurrenceUntil < startDate!) {
    return {
      ok: false,
      message: "Recurrence end date cannot be earlier than start date.",
    };
  }

  if (scheduleType === "recurring_weekly") {
    if (!recurrenceDays.length) {
      return { ok: false, message: "Select at least one weekday for weekly recurrence." };
    }

    return {
      ok: true,
      data: {
        scheduleType,
        startDate: startDate!,
        startTime: normalizedStartTime,
        endDate,
        endTime: normalizedEndTime,
        timezone: timezone!,
        recurrenceInterval,
        recurrenceDays,
        monthlyMode: null,
        monthlyDay: null,
        monthlyWeek: null,
        monthlyWeekday: null,
        recurrenceUntil: recurrenceUntil!,
      },
    };
  }

  if (scheduleType === "recurring_monthly") {
    if (!monthlyMode || !["day_of_month", "nth_weekday"].includes(monthlyMode)) {
      return { ok: false, message: "Monthly recurrence mode is required." };
    }

    if (monthlyMode === "day_of_month") {
      if (!monthlyDay || monthlyDay < 1 || monthlyDay > 31) {
        return { ok: false, message: "Monthly day must be between 1 and 31." };
      }
    }

    if (monthlyMode === "nth_weekday") {
      if (
        monthlyWeek === null ||
        ![-1, 1, 2, 3, 4, 5].includes(monthlyWeek) ||
        !monthlyWeekday ||
        !VALID_WEEKDAYS.includes(monthlyWeekday)
      ) {
        return { ok: false, message: "Monthly week and weekday are required." };
      }
    }

    return {
      ok: true,
      data: {
        scheduleType,
        startDate: startDate!,
        startTime: normalizedStartTime,
        endDate,
        endTime: normalizedEndTime,
        timezone: timezone!,
        recurrenceInterval,
        recurrenceDays: [],
        monthlyMode,
        monthlyDay: monthlyMode === "day_of_month" ? monthlyDay : null,
        monthlyWeek: monthlyMode === "nth_weekday" ? monthlyWeek : null,
        monthlyWeekday: monthlyMode === "nth_weekday" ? monthlyWeekday : null,
        recurrenceUntil: recurrenceUntil!,
      },
    };
  }

  return { ok: false, message: "Invalid schedule payload." };
}

export async function saveEventSchedule(req: Request, res: Response) {
  const eventId = req.params.eventId;
  const payload = req.body as SchedulePayload;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required." });
  }

  const validated = validateSchedule(payload);

  if (!validated.ok) {
    return res.status(400).json({ error: validated.message });
  }

  const data = validated.data;

  const recurrenceRule = buildRRule({
    scheduleType: data.scheduleType,
    interval: data.recurrenceInterval,
    recurrenceDays: data.recurrenceDays,
    monthlyMode: data.monthlyMode,
    monthlyDay: data.monthlyDay,
    monthlyWeek: data.monthlyWeek,
    monthlyWeekday: data.monthlyWeekday,
    recurrenceUntil: data.recurrenceUntil,
  });

  try {
    await db.query(
      `
      INSERT INTO event_schedules (
        event_id,
        schedule_type,
        timezone,
        start_date,
        start_time,
        end_date,
        end_time,
        schedule_timezone,
        recurrence_interval,
        recurrence_days,
        monthly_mode,
        monthly_day,
        monthly_week,
        monthly_weekday,
        recurrence_until,
        recurrence_rule,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      )
      ON CONFLICT (event_id)
      DO UPDATE SET
        schedule_type = EXCLUDED.schedule_type,
        timezone = EXCLUDED.timezone,
        start_date = EXCLUDED.start_date,
        start_time = EXCLUDED.start_time,
        end_date = EXCLUDED.end_date,
        end_time = EXCLUDED.end_time,
        schedule_timezone = EXCLUDED.schedule_timezone,
        recurrence_interval = EXCLUDED.recurrence_interval,
        recurrence_days = EXCLUDED.recurrence_days,
        monthly_mode = EXCLUDED.monthly_mode,
        monthly_day = EXCLUDED.monthly_day,
        monthly_week = EXCLUDED.monthly_week,
        monthly_weekday = EXCLUDED.monthly_weekday,
        recurrence_until = EXCLUDED.recurrence_until,
        recurrence_rule = EXCLUDED.recurrence_rule,
        updated_at = NOW()
      `,
      [
        eventId,
        data.scheduleType,
        data.timezone,
        data.startDate,
        data.startTime,
        data.endDate,
        data.endTime,
        data.timezone,
        data.recurrenceInterval,
        data.recurrenceDays.length ? data.recurrenceDays : null,
        data.monthlyMode,
        data.monthlyDay,
        data.monthlyWeek,
        data.monthlyWeekday,
        data.recurrenceUntil,
        recurrenceRule,
      ]
    );

    return res.status(200).json({
      success: true,
      schedule: {
        event_id: eventId,
        schedule_type: data.scheduleType,
        start_date: data.startDate,
        start_time: data.startTime,
        end_date: data.endDate,
        end_time: data.endTime,
        schedule_timezone: data.timezone,
        recurrence_interval: data.recurrenceInterval,
        recurrence_days: data.recurrenceDays,
        monthly_mode: data.monthlyMode,
        monthly_day: data.monthlyDay,
        monthly_week: data.monthlyWeek,
        monthly_weekday: data.monthlyWeekday,
        recurrence_until: data.recurrenceUntil,
        recurrence_rule: recurrenceRule,
      },
    });
  } catch (error) {
    console.error("saveEventSchedule error:", error);
    return res.status(500).json({ error: "Unable to save schedule right now." });
  }
}
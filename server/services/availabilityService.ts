/**
 * Availability Service
 *
 * Calculates linguist availability based on busy slots from calendar providers.
 * This service is provider-agnostic - it works with any source of busy slots.
 */

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */

import {
  addDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isWeekend,
  parseISO,
  formatISO,
} from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type {
  BusySlot,
  AvailabilityRequest,
  AvailabilityResult,
} from "@linguistnow/shared";
import { AVAILABILITY_DEFAULTS } from "@linguistnow/shared";

/**
 * Service interface for availability calculation
 */
export interface IAvailabilityService {
  calculateFreeSlots(
    busySlots: BusySlot[],
    timeMin: string,
    timeMax: string,
  ): BusySlot[];
  excludeWeekends(slots: BusySlot[], timezone: string): BusySlot[];
  excludeNonWorkingHours(
    slots: BusySlot[],
    options: Required<
      Pick<
        AvailabilityRequest,
        "timezone" | "workingHoursStart" | "workingHoursEnd"
      >
    >,
  ): BusySlot[];
  calculateAvailability(
    busySlots: BusySlot[],
    options: AvailabilityRequest,
  ): AvailabilityResult;
}

/**
 * Get default start date (tomorrow at start of day in the target timezone)
 *
 * Bug fix: Convert to timezone FIRST, then add days, to correctly handle
 * timezone boundaries and DST transitions.
 */
export function getDefaultStartDate(timezone: string): string {
  const now = new Date();
  // Step 1: Convert current time to target timezone
  const zonedNow = toZonedTime(now, timezone);
  // Step 2: Add days in the zoned space (correct date arithmetic)
  const zonedTomorrow = addDays(zonedNow, 1);
  // Step 3: Get start of day in zoned space
  const startOfTomorrow = startOfDay(zonedTomorrow);
  // Step 4: Convert back to UTC
  return fromZonedTime(startOfTomorrow, timezone).toISOString();
}

/**
 * Get default end date (7 days from now at end of day in the target timezone)
 *
 * Bug fix: Convert to timezone FIRST, then add days, to correctly handle
 * timezone boundaries and DST transitions.
 */
export function getDefaultEndDate(timezone: string): string {
  const now = new Date();
  // Step 1: Convert current time to target timezone
  const zonedNow = toZonedTime(now, timezone);
  // Step 2: Add days in the zoned space
  const zonedWeekFromNow = addDays(zonedNow, 7);
  // Step 3: Get end of day in zoned space
  const endOfDate = endOfDay(zonedWeekFromNow);
  // Step 4: Convert back to UTC
  return fromZonedTime(endOfDate, timezone).toISOString();
}

/**
 * Calculate free time slots from busy slots within a time window
 *
 * Bug fix from n8n: Handles empty busy slots array correctly
 */
export function calculateFreeSlots(
  busySlots: BusySlot[],
  timeMin: string,
  timeMax: string,
): BusySlot[] {
  const freeSlots: BusySlot[] = [];
  const startTime = new Date(timeMin);
  const endTime = new Date(timeMax);

  // Handle empty busy slots - entire window is free
  if (busySlots.length === 0) {
    return [{ start: timeMin, end: timeMax }];
  }

  // Sort busy slots by start time
  const sortedBusy = [...busySlots].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  let lastEnd = startTime;

  for (const slot of sortedBusy) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);

    // If there's a gap between last end and this slot's start, it's free time
    if (lastEnd < slotStart) {
      freeSlots.push({
        start: lastEnd.toISOString(),
        end: slotStart.toISOString(),
      });
    }

    // Update lastEnd to the later of current lastEnd or this slot's end
    if (slotEnd > lastEnd) {
      lastEnd = slotEnd;
    }
  }

  // Add final free slot if there's time after the last busy slot
  if (lastEnd < endTime) {
    freeSlots.push({
      start: lastEnd.toISOString(),
      end: endTime.toISOString(),
    });
  }

  return freeSlots;
}

/**
 * Filter out slots that fall on weekends
 *
 * Bug fix from n8n: Proper handling of slots spanning multiple days
 */
export function excludeWeekends(
  slots: BusySlot[],
  timezone: string,
): BusySlot[] {
  const result: BusySlot[] = [];

  for (const slot of slots) {
    const startDate = toZonedTime(parseISO(slot.start), timezone);
    const endDate = toZonedTime(parseISO(slot.end), timezone);

    // Get all days this slot spans
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Process each day
    days.forEach((day, i) => {
      if (isWeekend(day)) {
        return; // Skip weekend days
      }

      // Calculate the portion of the slot for this day
      const dayStart = i === 0 ? startDate : startOfDay(day);
      const dayEnd = i === days.length - 1 ? endDate : endOfDay(day);

      // Only add if there's actual time in this portion
      if (dayStart < dayEnd) {
        result.push({
          start: fromZonedTime(dayStart, timezone).toISOString(),
          end: fromZonedTime(dayEnd, timezone).toISOString(),
        });
      }
    });
  }

  return result;
}

/**
 * Helper to extract hour from a date in a specific timezone
 * Uses formatInTimeZone to correctly get timezone-aware hours
 */
function getHourInTimezone(date: Date, timezone: string): number {
  return parseInt(formatInTimeZone(date, timezone, "H"), 10);
}

/**
 * Helper to get minute from a date in a specific timezone
 */
function getMinuteInTimezone(date: Date, timezone: string): number {
  return parseInt(formatInTimeZone(date, timezone, "m"), 10);
}

/**
 * Create a date at a specific hour in the target timezone, on the same day
 * as the reference date.
 *
 * This works by:
 * 1. Getting the date (year, month, day) in the target timezone
 * 2. Constructing a Date at the desired hour in that timezone
 * 3. Converting back to UTC using fromZonedTime
 */
function createDateAtHourInTimezone(
  referenceDate: Date,
  hour: number,
  timezone: string,
): Date {
  // Get date components in the target timezone using formatInTimeZone
  const year = parseInt(formatInTimeZone(referenceDate, timezone, "yyyy"), 10);
  const month =
    parseInt(formatInTimeZone(referenceDate, timezone, "M"), 10) - 1; // 0-indexed
  const day = parseInt(formatInTimeZone(referenceDate, timezone, "d"), 10);

  // Create a "fake" local date with the wall-clock time we want
  // This Date's internal UTC time is wrong, but we'll fix it with fromZonedTime
  const fakeLocalDate = new Date(year, month, day, hour, 0, 0, 0);

  // Convert from the target timezone to UTC
  // This treats fakeLocalDate's "local" representation as if it were in the target timezone
  return fromZonedTime(fakeLocalDate, timezone);
}

/**
 * Filter slots to only include working hours
 *
 * Bug fix: Uses timezone-aware hour extraction (formatInTimeZone) and constructs
 * new dates properly in the target timezone instead of using setHours()
 * which operates in system local time.
 */
export function excludeNonWorkingHours(
  slots: BusySlot[],
  options: Required<
    Pick<
      AvailabilityRequest,
      "timezone" | "workingHoursStart" | "workingHoursEnd"
    >
  >,
): BusySlot[] {
  const { timezone, workingHoursStart, workingHoursEnd } = options;
  const result: BusySlot[] = [];

  for (const slot of slots) {
    const slotStart = parseISO(slot.start);
    const slotEnd = parseISO(slot.end);

    // Get hours and minutes in the target timezone
    const startHour = getHourInTimezone(slotStart, timezone);
    const startMinute = getMinuteInTimezone(slotStart, timezone);
    const endHour = getHourInTimezone(slotEnd, timezone);
    const endMinute = getMinuteInTimezone(slotEnd, timezone);

    // Calculate effective hours (with fractional minutes)
    const startEffective = startHour + startMinute / 60;
    const endEffective = endHour + endMinute / 60;

    // Skip slot entirely if it ends before or at working hours start
    if (endEffective <= workingHoursStart) {
      continue;
    }

    // Skip slot entirely if it starts at or after working hours end
    if (startEffective >= workingHoursEnd) {
      continue;
    }

    // Adjust start to working hours if before
    let adjustedStart = slotStart;
    if (startHour < workingHoursStart) {
      adjustedStart = createDateAtHourInTimezone(
        slotStart,
        workingHoursStart,
        timezone,
      );
    }

    // Adjust end to working hours if after
    let adjustedEnd = slotEnd;
    if (
      endHour >= workingHoursEnd ||
      (endHour === workingHoursEnd && endMinute > 0)
    ) {
      adjustedEnd = createDateAtHourInTimezone(
        slotEnd,
        workingHoursEnd,
        timezone,
      );
    }

    // Only add if adjusted start is before adjusted end
    if (adjustedStart < adjustedEnd) {
      result.push({
        start: adjustedStart.toISOString(),
        end: adjustedEnd.toISOString(),
      });
    }
  }

  return result;
}

/**
 * Calculate availability based on busy slots and options
 *
 * Bug fix from n8n: Checks ALL expected working days, not just days with slots
 */
export function calculateAvailability(
  busySlots: BusySlot[],
  options: AvailabilityRequest,
): AvailabilityResult {
  const timezone = options.timezone ?? AVAILABILITY_DEFAULTS.timezone;
  const workingHoursStart =
    options.workingHoursStart ?? AVAILABILITY_DEFAULTS.workingHoursStart;
  const workingHoursEnd =
    options.workingHoursEnd ?? AVAILABILITY_DEFAULTS.workingHoursEnd;
  const minHoursPerDay =
    options.minHoursPerDay ?? AVAILABILITY_DEFAULTS.minHoursPerDay;
  const excludeWeekendsFlag =
    options.excludeWeekends ?? AVAILABILITY_DEFAULTS.excludeWeekends;

  const startDate = options.startDate ?? getDefaultStartDate(timezone);
  const endDate = options.endDate ?? getDefaultEndDate(timezone);

  // Step 1: Calculate free slots from busy slots
  let freeSlots = calculateFreeSlots(busySlots, startDate, endDate);

  // Step 2: Exclude weekends if configured
  if (excludeWeekendsFlag) {
    freeSlots = excludeWeekends(freeSlots, timezone);
  }

  // Step 3: Exclude non-working hours
  freeSlots = excludeNonWorkingHours(freeSlots, {
    timezone,
    workingHoursStart,
    workingHoursEnd,
  });

  // Step 4: Calculate hours per day
  const hoursPerDay: Record<string, number> = {};

  for (const slot of freeSlots) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const zonedStart = toZonedTime(slotStart, timezone);
    const dateKey = formatISO(zonedStart, { representation: "date" });

    // Use milliseconds for more accurate calculation
    const hours = (slotEnd.getTime() - slotStart.getTime()) / (1000 * 60 * 60);
    hoursPerDay[dateKey] = (hoursPerDay[dateKey] ?? 0) + hours;
  }

  // Step 5: Get all expected working days in the range
  const startZoned = toZonedTime(parseISO(startDate), timezone);
  const endZoned = toZonedTime(parseISO(endDate), timezone);
  const allDays = eachDayOfInterval({ start: startZoned, end: endZoned });

  const expectedWorkingDays = excludeWeekendsFlag
    ? allDays.filter((day) => !isWeekend(day))
    : allDays;

  // Step 6: Check if each working day has minimum hours
  // Bug fix: Check ALL expected days, not just days that have slots
  let isAvailable = true;
  for (const day of expectedWorkingDays) {
    const dateKey = formatISO(day, { representation: "date" });
    const hoursForDay = hoursPerDay[dateKey] ?? 0;

    if (hoursForDay < minHoursPerDay) {
      isAvailable = false;
      break;
    }
  }

  // Calculate totals
  const totalFreeHours = Object.values(hoursPerDay).reduce(
    (sum, hours) => sum + hours,
    0,
  );

  return {
    isAvailable,
    freeSlots,
    totalFreeHours,
    workingDays: expectedWorkingDays.length,
    hoursPerDay,
  };
}

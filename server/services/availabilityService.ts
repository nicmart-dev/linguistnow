/**
 * Availability Service
 *
 * Calculates linguist availability based on busy slots from calendar providers.
 * This service is provider-agnostic - it works with any source of busy slots.
 */

import {
  addDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
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
 * Parse ISO 8601 time string (HH:mm) to hours as decimal number
 * @param time - Time string in HH:mm format
 * @returns Hours as decimal (e.g., "08:30" -> 8.5, "18:00" -> 18)
 */
function parseTimeToHours(time: string | undefined): number {
  if (!time) {
    return 0;
  }

  // Parse HH:mm format
  const [hours, minutes] = time.split(":");
  const hoursNum = parseInt(hours, 10);
  const minutesNum = parseInt(minutes, 10);

  if (isNaN(hoursNum) || isNaN(minutesNum)) {
    return 0;
  }

  return hoursNum + minutesNum / 60;
}

/**
 * Service interface for availability calculation
 */
export interface IAvailabilityService {
  calculateFreeSlots(
    busySlots: BusySlot[],
    timeMin: string,
    timeMax: string,
  ): BusySlot[];
  excludeOffDays(
    slots: BusySlot[],
    offDays: number[],
    timezone: string,
  ): BusySlot[];
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
 * Filter out slots that fall on off-days (configurable days of the week)
 *
 * @param slots - Array of time slots to filter
 * @param offDays - Array of day numbers to exclude (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param timezone - IANA timezone string
 * @returns Filtered slots excluding off-days
 */
export function excludeOffDays(
  slots: BusySlot[],
  offDays: number[],
  timezone: string,
): BusySlot[] {
  const result: BusySlot[] = [];

  // Helper to check if a day is an off-day
  const isOffDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    return offDays.includes(dayOfWeek);
  };

  for (const slot of slots) {
    const startDate = toZonedTime(parseISO(slot.start), timezone);
    const endDate = toZonedTime(parseISO(slot.end), timezone);

    // Get all days this slot spans
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Process each day
    days.forEach((day, i) => {
      if (isOffDay(day)) {
        return; // Skip off-days
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

  // Parse time strings to hours (with backward compatibility for numbers)
  const startHours = parseTimeToHours(workingHoursStart);
  const endHours = parseTimeToHours(workingHoursEnd);

  // Extract hour and minute from parsed hours
  const startHour = Math.floor(startHours);
  const startMinute = Math.round((startHours - startHour) * 60);
  const endHour = Math.floor(endHours);
  const endMinute = Math.round((endHours - endHour) * 60);

  for (const slot of slots) {
    const slotStart = parseISO(slot.start);
    const slotEnd = parseISO(slot.end);

    // Get hours and minutes in the target timezone
    const slotStartHour = getHourInTimezone(slotStart, timezone);
    const slotStartMinute = getMinuteInTimezone(slotStart, timezone);
    const slotEndHour = getHourInTimezone(slotEnd, timezone);
    const slotEndMinute = getMinuteInTimezone(slotEnd, timezone);

    // Calculate effective hours (with fractional minutes)
    const startEffective = slotStartHour + slotStartMinute / 60;
    const endEffective = slotEndHour + slotEndMinute / 60;

    // Skip slot entirely if it ends before or at working hours start
    if (endEffective <= startHours) {
      continue;
    }

    // Skip slot entirely if it starts at or after working hours end
    if (startEffective >= endHours) {
      continue;
    }

    // Adjust start to working hours if before
    let adjustedStart = slotStart;
    if (
      slotStartHour < startHour ||
      (slotStartHour === startHour && slotStartMinute < startMinute)
    ) {
      adjustedStart = createDateAtHourInTimezone(
        slotStart,
        startHour,
        timezone,
      );
      // Adjust minutes if needed
      if (startMinute > 0) {
        adjustedStart = new Date(
          adjustedStart.getTime() + startMinute * 60 * 1000,
        );
      }
    }

    // Adjust end to working hours if after
    let adjustedEnd = slotEnd;
    if (
      slotEndHour > endHour ||
      (slotEndHour === endHour && slotEndMinute > endMinute)
    ) {
      adjustedEnd = createDateAtHourInTimezone(slotEnd, endHour, timezone);
      // Adjust minutes if needed
      if (endMinute > 0) {
        adjustedEnd = new Date(adjustedEnd.getTime() + endMinute * 60 * 1000);
      }
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

  // Determine off-days: prefer offDays array, fallback to excludeWeekends for backward compatibility
  let offDays: number[];
  if (options.offDays !== undefined) {
    offDays = options.offDays;
  } else if (options.excludeWeekends === false) {
    // Explicitly set to false means no off-days
    offDays = [];
  } else {
    // Default or excludeWeekends === true means weekends are off-days
    offDays = AVAILABILITY_DEFAULTS.offDays;
  }

  // IMPORTANT: startDate and endDate are calendar dates (YYYY-MM-DD) selected by the PM from their timezone.
  // We need to convert these to the linguist's timezone to determine which calendar days to check.
  // Example: PM in Vancouver selects "Jan 4" at 4pm. In France it's already "Jan 5" at 1am.
  // So for the French linguist, we check "Jan 5", not "Jan 4".

  // Get PM's timezone from options (if provided), otherwise assume dates are already in linguist's timezone
  const pmTimezone = options.pmTimezone ?? timezone;

  let startDate = options.startDate ?? getDefaultStartDate(timezone);
  let endDate = options.endDate ?? getDefaultEndDate(timezone);

  // Validate date strings are strings before processing
  if (typeof startDate !== "string") {
    throw new Error("startDate must be a string");
  }
  if (typeof endDate !== "string") {
    throw new Error("endDate must be a string");
  }

  // Convert PM's calendar dates to linguist's calendar dates
  if (!startDate.includes("T") && pmTimezone !== timezone) {
    // Parse PM's calendar date and find what calendar day it is in linguist's timezone
    // Validate date format (YYYY-MM-DD) before parsing
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      throw new Error(`Invalid date format: ${startDate}. Expected YYYY-MM-DD`);
    }
    const startDateParts = startDate.split("-").map(Number);
    // Create date at start of day in PM's timezone
    const pmStartFakeLocal = new Date(
      startDateParts[0],
      startDateParts[1] - 1,
      startDateParts[2],
      0,
      0,
      0,
      0,
    );
    const pmStartUTC = fromZonedTime(pmStartFakeLocal, pmTimezone);
    // Convert to linguist's timezone to get the calendar date
    const linguistStart = toZonedTime(pmStartUTC, timezone);
    startDate = formatISO(linguistStart, { representation: "date" });
  }

  if (!endDate.includes("T") && pmTimezone !== timezone) {
    // Parse PM's calendar date and find what calendar day it is in linguist's timezone
    // Validate date format (YYYY-MM-DD) before parsing
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(endDate)) {
      throw new Error(`Invalid date format: ${endDate}. Expected YYYY-MM-DD`);
    }
    const endDateParts = endDate.split("-").map(Number);
    // Create date at end of day in PM's timezone
    const pmEndFakeLocal = new Date(
      endDateParts[0],
      endDateParts[1] - 1,
      endDateParts[2],
      23,
      59,
      59,
      999,
    );
    const pmEndUTC = fromZonedTime(pmEndFakeLocal, pmTimezone);
    // Convert to linguist's timezone to get the calendar date
    const linguistEnd = toZonedTime(pmEndUTC, timezone);
    endDate = formatISO(linguistEnd, { representation: "date" });
  }

  // Step 1: Calculate free slots from busy slots
  // Convert date strings (YYYY-MM-DD) to ISO timestamps in the linguist's timezone
  // Now startDate and endDate are calendar dates in the linguist's timezone
  let timeMin: string;
  let timeMax: string;

  if (startDate.includes("T")) {
    timeMin = startDate;
  } else {
    // Parse as calendar date and create start of day in linguist's timezone
    // Validate date format (YYYY-MM-DD) before parsing
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      throw new Error(`Invalid date format: ${startDate}. Expected YYYY-MM-DD`);
    }
    const startDateParts = startDate.split("-").map(Number);
    const startFakeLocal = new Date(
      startDateParts[0],
      startDateParts[1] - 1,
      startDateParts[2],
      0,
      0,
      0,
      0,
    );
    const startUTC = fromZonedTime(startFakeLocal, timezone);
    timeMin = startUTC.toISOString();
  }

  if (endDate.includes("T")) {
    timeMax = endDate;
  } else {
    // Parse as calendar date and create end of day in linguist's timezone
    // Validate date format (YYYY-MM-DD) before parsing
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(endDate)) {
      throw new Error(`Invalid date format: ${endDate}. Expected YYYY-MM-DD`);
    }
    const endDateParts = endDate.split("-").map(Number);
    const endFakeLocal = new Date(
      endDateParts[0],
      endDateParts[1] - 1,
      endDateParts[2],
      23,
      59,
      59,
      999,
    );
    const endUTC = fromZonedTime(endFakeLocal, timezone);
    timeMax = endUTC.toISOString();
  }

  let freeSlots = calculateFreeSlots(busySlots, timeMin, timeMax);

  // Step 2: Exclude off-days if configured
  if (offDays.length > 0) {
    freeSlots = excludeOffDays(freeSlots, offDays, timezone);
  }

  // Step 3: Exclude non-working hours
  freeSlots = excludeNonWorkingHours(freeSlots, {
    timezone,
    workingHoursStart: workingHoursStart,
    workingHoursEnd: workingHoursEnd,
  });

  // Step 4: Calculate hours per day
  // IMPORTANT: Slots may span multiple days, so we need to split them correctly
  // Note: freeSlots have already been filtered to working hours by excludeNonWorkingHours
  const hoursPerDay: Record<string, number> = {};

  // Parse working hours for capping day boundaries
  const startHours = parseTimeToHours(workingHoursStart);
  const endHours = parseTimeToHours(workingHoursEnd);
  const startHour = Math.floor(startHours);
  const startMinute = Math.round((startHours - startHour) * 60);
  const endHour = Math.floor(endHours);
  const endMinute = Math.round((endHours - endHour) * 60);

  for (const slot of freeSlots) {
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);

    // Get all days this slot spans in the linguist's timezone
    const zonedStart = toZonedTime(slotStart, timezone);
    const zonedEnd = toZonedTime(slotEnd, timezone);
    const daysInSlot = eachDayOfInterval({
      start: startOfDay(zonedStart),
      end: startOfDay(zonedEnd),
    });

    // Split the slot across days, capping each day to working hours
    daysInSlot.forEach((day, i) => {
      // For the first day, use the actual slot start
      // For subsequent days, use start of working hours
      let dayStart: Date;
      if (i === 0) {
        dayStart = zonedStart;
      } else {
        // Start of working hours for this day
        dayStart = createDateAtHourInTimezone(day, startHour, timezone);
        if (startMinute > 0) {
          dayStart = new Date(dayStart.getTime() + startMinute * 60 * 1000);
        }
      }

      // For the last day, use the actual slot end
      // For previous days, use end of working hours
      let dayEnd: Date;
      if (i === daysInSlot.length - 1) {
        dayEnd = zonedEnd;
      } else {
        // End of working hours for this day
        dayEnd = createDateAtHourInTimezone(day, endHour, timezone);
        if (endMinute > 0) {
          dayEnd = new Date(dayEnd.getTime() + endMinute * 60 * 1000);
        }
      }

      // Only count hours if dayStart < dayEnd (slot overlaps with this day's working hours)
      if (dayStart < dayEnd) {
        const dateKey = formatISO(day, { representation: "date" });
        const hours =
          (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60);
        hoursPerDay[dateKey] = (hoursPerDay[dateKey] ?? 0) + hours;
      }
    });
  }

  // Step 5: Get all expected working days in the range
  // IMPORTANT: startDate and endDate are now calendar dates (YYYY-MM-DD) in the linguist's timezone.
  // They were converted from the PM's calendar dates in Step 1 above.
  // Example: PM in Vancouver selects "2026-01-04" at 4pm. In France it's already "2026-01-05" at 1am.
  // So startDate was converted to "2026-01-05" for the French linguist.
  const startDateParts = startDate.split("-").map(Number);
  const endDateParts = endDate.split("-").map(Number);

  // Create dates representing the calendar date at midnight in the linguist's timezone
  // Use the same pattern as createDateAtHourInTimezone: parse date components and use fromZonedTime
  const startYear = startDateParts[0];
  const startMonth = startDateParts[1] - 1; // 0-indexed
  const startDay = startDateParts[2];
  const endYear = endDateParts[0];
  const endMonth = endDateParts[1] - 1; // 0-indexed
  const endDay = endDateParts[2];

  // Create "fake" local dates with the calendar components (these are in system timezone, but we'll fix that)
  const startFakeLocal = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);
  const endFakeLocal = new Date(endYear, endMonth, endDay, 23, 59, 59, 999); // End of day to ensure inclusion

  // fromZonedTime treats the Date as if it's in the target timezone and converts to UTC
  // Then toZonedTime converts back to the target timezone, giving us the correct date
  const startZoned = startOfDay(
    toZonedTime(fromZonedTime(startFakeLocal, timezone), timezone),
  );
  const endZoned = endOfDay(
    toZonedTime(fromZonedTime(endFakeLocal, timezone), timezone),
  );
  const allDays = eachDayOfInterval({ start: startZoned, end: endZoned });

  // Helper to check if a day is an off-day
  const isOffDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    return offDays.includes(dayOfWeek);
  };

  const expectedWorkingDays =
    offDays.length > 0 ? allDays.filter((day) => !isOffDay(day)) : allDays;

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

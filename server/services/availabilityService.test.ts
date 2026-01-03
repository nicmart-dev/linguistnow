/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-non-null-assertion */
import { describe, it, expect } from "vitest";
import {
  calculateFreeSlots,
  excludeOffDays,
  excludeNonWorkingHours,
  calculateAvailability,
  getDefaultStartDate,
  getDefaultEndDate,
} from "./availabilityService.js";
import type { BusySlot, AvailabilityRequest } from "@linguistnow/shared";

describe("availabilityService", () => {
  const TEST_TIMEZONE = "America/Los_Angeles";

  describe("calculateFreeSlots", () => {
    it("should return entire window as free when no busy slots", () => {
      const timeMin = "2024-01-15T00:00:00Z";
      const timeMax = "2024-01-16T00:00:00Z";
      const busySlots: BusySlot[] = [];

      const result = calculateFreeSlots(busySlots, timeMin, timeMax);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ start: timeMin, end: timeMax });
    });

    it("should calculate free slots between busy slots", () => {
      const timeMin = "2024-01-15T08:00:00Z";
      const timeMax = "2024-01-15T18:00:00Z";
      const busySlots: BusySlot[] = [
        { start: "2024-01-15T09:00:00Z", end: "2024-01-15T10:00:00Z" },
        { start: "2024-01-15T14:00:00Z", end: "2024-01-15T15:00:00Z" },
      ];

      const result = calculateFreeSlots(busySlots, timeMin, timeMax);

      expect(result).toHaveLength(3);
      // Check start/end times exist and are correct (ignoring .000Z vs Z format)
      const slot0 = result[0]!;
      const slot1 = result[1]!;
      const slot2 = result[2]!;
      expect(new Date(slot0.start).getTime()).toBe(
        new Date("2024-01-15T08:00:00Z").getTime(),
      );
      expect(new Date(slot0.end).getTime()).toBe(
        new Date("2024-01-15T09:00:00Z").getTime(),
      );
      expect(new Date(slot1.start).getTime()).toBe(
        new Date("2024-01-15T10:00:00Z").getTime(),
      );
      expect(new Date(slot1.end).getTime()).toBe(
        new Date("2024-01-15T14:00:00Z").getTime(),
      );
      expect(new Date(slot2.start).getTime()).toBe(
        new Date("2024-01-15T15:00:00Z").getTime(),
      );
      expect(new Date(slot2.end).getTime()).toBe(
        new Date("2024-01-15T18:00:00Z").getTime(),
      );
    });

    it("should handle overlapping busy slots", () => {
      const timeMin = "2024-01-15T08:00:00Z";
      const timeMax = "2024-01-15T18:00:00Z";
      const busySlots: BusySlot[] = [
        { start: "2024-01-15T09:00:00Z", end: "2024-01-15T11:00:00Z" },
        { start: "2024-01-15T10:00:00Z", end: "2024-01-15T12:00:00Z" }, // Overlaps
      ];

      const result = calculateFreeSlots(busySlots, timeMin, timeMax);

      expect(result).toHaveLength(2);
      const slot0 = result[0]!;
      const slot1 = result[1]!;
      expect(new Date(slot0.start).getTime()).toBe(
        new Date("2024-01-15T08:00:00Z").getTime(),
      );
      expect(new Date(slot0.end).getTime()).toBe(
        new Date("2024-01-15T09:00:00Z").getTime(),
      );
      expect(new Date(slot1.start).getTime()).toBe(
        new Date("2024-01-15T12:00:00Z").getTime(),
      );
      expect(new Date(slot1.end).getTime()).toBe(
        new Date("2024-01-15T18:00:00Z").getTime(),
      );
    });

    it("should handle busy slot that covers entire window", () => {
      const timeMin = "2024-01-15T08:00:00Z";
      const timeMax = "2024-01-15T18:00:00Z";
      const busySlots: BusySlot[] = [
        { start: "2024-01-15T07:00:00Z", end: "2024-01-15T19:00:00Z" },
      ];

      const result = calculateFreeSlots(busySlots, timeMin, timeMax);

      expect(result).toHaveLength(0);
    });
  });

  describe("excludeOffDays", () => {
    it("should filter out Saturday slots", () => {
      // 2024-01-13 is a Saturday (day 6)
      const slots: BusySlot[] = [
        { start: "2024-01-13T08:00:00Z", end: "2024-01-13T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [6], TEST_TIMEZONE);

      expect(result).toHaveLength(0);
    });

    it("should filter out Sunday slots", () => {
      // 2024-01-14 is a Sunday (day 0)
      const slots: BusySlot[] = [
        { start: "2024-01-14T08:00:00Z", end: "2024-01-14T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [0], TEST_TIMEZONE);

      expect(result).toHaveLength(0);
    });

    it("should filter out weekends (Saturday and Sunday)", () => {
      // 2024-01-13 is a Saturday, 2024-01-14 is a Sunday
      const slots: BusySlot[] = [
        { start: "2024-01-13T08:00:00Z", end: "2024-01-14T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [0, 6], TEST_TIMEZONE);

      expect(result).toHaveLength(0);
    });

    it("should keep weekday slots", () => {
      // 2024-01-15 is a Monday
      const slots: BusySlot[] = [
        { start: "2024-01-15T08:00:00Z", end: "2024-01-15T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [0, 6], TEST_TIMEZONE);

      expect(result).toHaveLength(1);
    });

    it("should filter out Friday and Saturday (Middle East weekend)", () => {
      // 2024-01-12 is a Friday, 2024-01-13 is a Saturday
      const slots: BusySlot[] = [
        { start: "2024-01-12T08:00:00Z", end: "2024-01-13T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [5, 6], TEST_TIMEZONE);

      expect(result).toHaveLength(0);
    });

    it("should split slots spanning off-days", () => {
      // Friday to Monday (2024-01-12 is Friday, 2024-01-15 is Monday)
      const slots: BusySlot[] = [
        { start: "2024-01-12T08:00:00Z", end: "2024-01-15T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [0, 6], TEST_TIMEZONE);

      // Should have Friday and Monday portions
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle empty off-days array (no filtering)", () => {
      const slots: BusySlot[] = [
        { start: "2024-01-13T08:00:00Z", end: "2024-01-13T18:00:00Z" },
      ];

      const result = excludeOffDays(slots, [], TEST_TIMEZONE);

      expect(result).toHaveLength(1);
    });
  });

  describe("excludeNonWorkingHours", () => {
    const options = {
      timezone: TEST_TIMEZONE,
      workingHoursStart: "08:00",
      workingHoursEnd: "18:00",
    };

    it("should trim slots to working hours", () => {
      // Slot from 6am to 8pm PST (need to convert to UTC)
      // PST is UTC-8, so 6am PST = 14:00 UTC, 8pm PST = 04:00 UTC next day
      const slots: BusySlot[] = [
        { start: "2024-01-15T14:00:00Z", end: "2024-01-16T04:00:00Z" },
      ];

      const result = excludeNonWorkingHours(slots, options);

      expect(result).toHaveLength(1);
      // Should be trimmed to 8am-6pm PST (16:00-02:00 UTC)
    });

    it("should exclude slots entirely outside working hours", () => {
      // Slot from 2am to 6am PST (entirely before working hours)
      // PST is UTC-8, so 2am PST = 10:00 UTC, 6am PST = 14:00 UTC
      const slots: BusySlot[] = [
        { start: "2024-01-15T10:00:00Z", end: "2024-01-15T14:00:00Z" },
      ];

      const result = excludeNonWorkingHours(slots, options);

      // Slot is entirely before working hours, should be excluded
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateAvailability", () => {
    it("should return isAvailable=true when user has no busy slots", () => {
      const busySlots: BusySlot[] = [];
      // Use UTC timezone for simpler testing
      const options: AvailabilityRequest = {
        calendarIds: ["cal1"],
        userEmail: "test@example.com",
        startDate: "2024-01-15T00:00:00Z", // Monday
        endDate: "2024-01-19T23:59:59Z", // Friday
        timezone: "UTC",
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
        minHoursPerDay: 8,
        offDays: [0, 6],
      };

      const result = calculateAvailability(busySlots, options);

      expect(result.isAvailable).toBe(true);
      expect(result.totalFreeHours).toBeGreaterThan(0);
      expect(result.workingDays).toBe(5); // Mon-Fri
    });

    it("should return isAvailable=false when user is fully booked", () => {
      // User busy 8am-6pm every day (10 hours per day)
      const busySlots: BusySlot[] = [
        // Monday - PST 8am = UTC 4pm (16:00), 6pm = UTC 2am next day
        { start: "2024-01-15T16:00:00Z", end: "2024-01-16T02:00:00Z" },
        { start: "2024-01-16T16:00:00Z", end: "2024-01-17T02:00:00Z" },
        { start: "2024-01-17T16:00:00Z", end: "2024-01-18T02:00:00Z" },
        { start: "2024-01-18T16:00:00Z", end: "2024-01-19T02:00:00Z" },
        { start: "2024-01-19T16:00:00Z", end: "2024-01-20T02:00:00Z" },
      ];
      const options: AvailabilityRequest = {
        calendarIds: ["cal1"],
        userEmail: "test@example.com",
        startDate: "2024-01-15T00:00:00Z",
        endDate: "2024-01-19T23:59:59Z",
        timezone: TEST_TIMEZONE,
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
        minHoursPerDay: 8,
        offDays: [0, 6],
      };

      const result = calculateAvailability(busySlots, options);

      expect(result.isAvailable).toBe(false);
      expect(result.totalFreeHours).toBe(0);
    });

    it("should return isAvailable=false when less than 8 hours free on any day", () => {
      // User has 6 hours of meetings on Monday (only 4 hours free)
      const busySlots: BusySlot[] = [
        // Monday 8am-2pm busy (6 hours) - PST 8am = UTC 4pm
        { start: "2024-01-15T16:00:00Z", end: "2024-01-15T22:00:00Z" },
      ];
      const options: AvailabilityRequest = {
        calendarIds: ["cal1"],
        userEmail: "test@example.com",
        startDate: "2024-01-15T00:00:00Z",
        endDate: "2024-01-15T23:59:59Z", // Just Monday
        timezone: TEST_TIMEZONE,
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
        minHoursPerDay: 8,
        offDays: [0, 6],
      };

      const result = calculateAvailability(busySlots, options);

      expect(result.isAvailable).toBe(false);
    });

    it("should return isAvailable=true when exactly 8 hours free", () => {
      // User has 2 hours of meetings (8 hours free out of 10 working hours)
      // Using UTC for simpler testing: busy 8am-10am UTC
      const busySlots: BusySlot[] = [
        { start: "2024-01-15T08:00:00Z", end: "2024-01-15T10:00:00Z" },
      ];
      const options: AvailabilityRequest = {
        calendarIds: ["cal1"],
        userEmail: "test@example.com",
        startDate: "2024-01-15T00:00:00Z",
        endDate: "2024-01-15T23:59:59Z",
        timezone: "UTC",
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
        minHoursPerDay: 8,
        offDays: [0, 6],
      };

      const result = calculateAvailability(busySlots, options);

      expect(result.isAvailable).toBe(true);
      expect(result.hoursPerDay["2024-01-15"]).toBe(8);
    });

    it("should handle multiple calendars with merged busy slots", () => {
      // Busy slots from multiple calendars - using UTC
      // 2 hours of meetings: 9-10am and 2-3pm
      const busySlots: BusySlot[] = [
        { start: "2024-01-15T09:00:00Z", end: "2024-01-15T10:00:00Z" }, // Calendar 1
        { start: "2024-01-15T14:00:00Z", end: "2024-01-15T15:00:00Z" }, // Calendar 2
      ];
      const options: AvailabilityRequest = {
        calendarIds: ["cal1", "cal2"],
        userEmail: "test@example.com",
        startDate: "2024-01-15T00:00:00Z",
        endDate: "2024-01-15T23:59:59Z",
        timezone: "UTC",
        workingHoursStart: "08:00",
        workingHoursEnd: "18:00",
        minHoursPerDay: 8,
        offDays: [0, 6],
      };

      const result = calculateAvailability(busySlots, options);

      // 10 working hours - 2 hours busy = 8 hours free
      expect(result.isAvailable).toBe(true);
      expect(result.hoursPerDay["2024-01-15"]).toBe(8);
    });

    it("should use default values when options not provided", () => {
      const busySlots: BusySlot[] = [];
      const options: AvailabilityRequest = {
        calendarIds: ["cal1"],
        userEmail: "test@example.com",
        // No other options - should use defaults
      };

      const result = calculateAvailability(busySlots, options);

      // Should not throw and should return valid result
      expect(result).toHaveProperty("isAvailable");
      expect(result).toHaveProperty("freeSlots");
      expect(result).toHaveProperty("totalFreeHours");
      expect(result).toHaveProperty("workingDays");
      expect(result).toHaveProperty("hoursPerDay");
    });
  });

  describe("getDefaultStartDate", () => {
    it("should return tomorrow's date", () => {
      const result = getDefaultStartDate(TEST_TIMEZONE);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const resultDate = new Date(result);
      expect(resultDate.getDate()).toBe(tomorrow.getDate());
    });
  });

  describe("getDefaultEndDate", () => {
    it("should return date 7 days from now", () => {
      const result = getDefaultEndDate(TEST_TIMEZONE);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const resultDate = new Date(result);
      expect(resultDate.getDate()).toBe(weekFromNow.getDate());
    });
  });
});

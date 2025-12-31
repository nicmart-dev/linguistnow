import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  getFreeBusy,
  GoogleCalendarError,
  GoogleCalendarErrorCodes,
} from "./googleCalendarClient.js";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("googleCalendarClient", () => {
  const TEST_ACCESS_TOKEN = "test-access-token";
  const TEST_CALENDAR_IDS = ["calendar1@google.com", "calendar2@google.com"];
  const TEST_TIME_MIN = "2024-01-15T00:00:00Z";
  const TEST_TIME_MAX = "2024-01-22T00:00:00Z";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFreeBusy", () => {
    it("should return flattened busy slots from all calendars", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          kind: "calendar#freeBusy",
          timeMin: TEST_TIME_MIN,
          timeMax: TEST_TIME_MAX,
          calendars: {
            "calendar1@google.com": {
              busy: [
                { start: "2024-01-15T09:00:00Z", end: "2024-01-15T10:00:00Z" },
              ],
            },
            "calendar2@google.com": {
              busy: [
                { start: "2024-01-15T14:00:00Z", end: "2024-01-15T15:00:00Z" },
              ],
            },
          },
        },
      });

      const result = await getFreeBusy(
        TEST_ACCESS_TOKEN,
        TEST_CALENDAR_IDS,
        TEST_TIME_MIN,
        TEST_TIME_MAX,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        start: "2024-01-15T09:00:00Z",
        end: "2024-01-15T10:00:00Z",
      });
      expect(result[1]).toEqual({
        start: "2024-01-15T14:00:00Z",
        end: "2024-01-15T15:00:00Z",
      });

      // Verify axios was called correctly
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://www.googleapis.com/calendar/v3/freeBusy",
        {
          timeMin: TEST_TIME_MIN,
          timeMax: TEST_TIME_MAX,
          items: [
            { id: "calendar1@google.com" },
            { id: "calendar2@google.com" },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );
    });

    it("should return empty array when no busy slots", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          kind: "calendar#freeBusy",
          timeMin: TEST_TIME_MIN,
          timeMax: TEST_TIME_MAX,
          calendars: {
            "calendar1@google.com": {
              busy: [],
            },
          },
        },
      });

      const result = await getFreeBusy(
        TEST_ACCESS_TOKEN,
        ["calendar1@google.com"],
        TEST_TIME_MIN,
        TEST_TIME_MAX,
      );

      expect(result).toHaveLength(0);
    });

    it("should sort busy slots by start time", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          kind: "calendar#freeBusy",
          timeMin: TEST_TIME_MIN,
          timeMax: TEST_TIME_MAX,
          calendars: {
            "calendar1@google.com": {
              busy: [
                { start: "2024-01-15T14:00:00Z", end: "2024-01-15T15:00:00Z" },
                { start: "2024-01-15T09:00:00Z", end: "2024-01-15T10:00:00Z" },
              ],
            },
          },
        },
      });

      const result = await getFreeBusy(
        TEST_ACCESS_TOKEN,
        ["calendar1@google.com"],
        TEST_TIME_MIN,
        TEST_TIME_MAX,
      );

      expect(result[0].start).toBe("2024-01-15T09:00:00Z");
      expect(result[1].start).toBe("2024-01-15T14:00:00Z");
    });

    it("should throw TOKEN_EXPIRED error on 401 response", async () => {
      const axiosError = new Error("Request failed") as Error & {
        isAxiosError: boolean;
        response: { status: number; data: { error: { message: string } } };
      };
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 401,
        data: {
          error: {
            message: "Invalid Credentials",
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      try {
        await getFreeBusy(
          TEST_ACCESS_TOKEN,
          TEST_CALENDAR_IDS,
          TEST_TIME_MIN,
          TEST_TIME_MAX,
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GoogleCalendarError);
        expect((error as GoogleCalendarError).code).toBe(
          GoogleCalendarErrorCodes.TOKEN_EXPIRED,
        );
        expect((error as GoogleCalendarError).statusCode).toBe(401);
      }
    });

    it("should throw GOOGLE_API_ERROR on other API errors", async () => {
      const axiosError = new Error("Request failed") as Error & {
        isAxiosError: boolean;
        response: { status: number; data: { error: { message: string } } };
      };
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 403,
        data: {
          error: {
            message: "Access denied",
          },
        },
      };

      mockedAxios.post.mockRejectedValueOnce(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      try {
        await getFreeBusy(
          TEST_ACCESS_TOKEN,
          TEST_CALENDAR_IDS,
          TEST_TIME_MIN,
          TEST_TIME_MAX,
        );
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(GoogleCalendarError);
        expect((error as GoogleCalendarError).code).toBe(
          GoogleCalendarErrorCodes.GOOGLE_API_ERROR,
        );
        expect((error as GoogleCalendarError).statusCode).toBe(403);
      }
    });

    it("should handle per-calendar errors gracefully", async () => {
      // Simulate one calendar having an error but another working
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          kind: "calendar#freeBusy",
          timeMin: TEST_TIME_MIN,
          timeMax: TEST_TIME_MAX,
          calendars: {
            "calendar1@google.com": {
              busy: [
                { start: "2024-01-15T09:00:00Z", end: "2024-01-15T10:00:00Z" },
              ],
            },
            "calendar2@google.com": {
              errors: [{ domain: "calendar", reason: "notFound" }],
              busy: [],
            },
          },
        },
      });

      const result = await getFreeBusy(
        TEST_ACCESS_TOKEN,
        TEST_CALENDAR_IDS,
        TEST_TIME_MIN,
        TEST_TIME_MAX,
      );

      // Should still return busy slots from working calendar
      expect(result).toHaveLength(1);
      expect(result[0].start).toBe("2024-01-15T09:00:00Z");
    });
  });
});

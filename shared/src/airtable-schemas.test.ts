import { describe, it, expect } from "vitest";
import {
  parseArrayField,
  parseUserPreferences,
  AirtableUserFieldsSchema,
  parseAirtableUserFields,
  parseAirtableUserFieldsStrict,
} from "./airtable-schemas";

describe("airtable-schemas", () => {
  describe("parseArrayField", () => {
    it("should parse array values", () => {
      expect(parseArrayField(["EN-FR", "EN-ES"])).toEqual(["EN-FR", "EN-ES"]);
    });

    it("should parse comma-separated strings", () => {
      expect(parseArrayField("EN-FR, EN-ES, EN-DE")).toEqual([
        "EN-FR",
        "EN-ES",
        "EN-DE",
      ]);
    });

    it("should return empty array for null", () => {
      expect(parseArrayField(null)).toEqual([]);
    });

    it("should return empty array for undefined", () => {
      expect(parseArrayField(undefined)).toEqual([]);
    });

    it("should filter empty strings from comma-separated values", () => {
      expect(parseArrayField("EN-FR, , EN-ES")).toEqual(["EN-FR", "EN-ES"]);
    });
  });

  describe("parseUserPreferences", () => {
    it("should parse full preferences", () => {
      const fields = {
        Timezone: "Europe/Paris",
        "Working Hours Start": "09:00",
        "Working Hours End": "17:00",
        "Off Days": ["Saturday", "Sunday"],
      };
      const result = parseUserPreferences(fields);
      expect(result).toEqual({
        timezone: "Europe/Paris",
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        offDays: [6, 0],
      });
    });

    it("should return defaults for empty fields", () => {
      const result = parseUserPreferences({});
      expect(result).toEqual({
        timezone: undefined,
        workingHoursStart: undefined,
        workingHoursEnd: undefined,
        offDays: [],
      });
    });

    it("should handle partial preferences", () => {
      const fields = {
        Timezone: "America/New_York",
      };
      const result = parseUserPreferences(fields);
      expect(result.timezone).toBe("America/New_York");
      expect(result.offDays).toEqual([]);
    });

    it("should convert day names to numbers", () => {
      const fields = {
        "Off Days": ["Monday", "Friday"],
      };
      const result = parseUserPreferences(fields);
      expect(result.offDays).toEqual([1, 5]);
    });
  });

  describe("AirtableUserFieldsSchema", () => {
    it("should parse valid user fields", () => {
      const fields = {
        Email: "user@example.com",
        Name: "John Doe",
        Role: "Linguist",
        Languages: ["EN-FR", "EN-ES"],
        Specialization: ["Legal", "Medical"],
        "Hourly Rate": 50,
        Currency: "USD",
        Rating: 4,
      };
      const result = AirtableUserFieldsSchema.safeParse(fields);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Email).toBe("user@example.com");
        expect(result.data.Languages).toEqual(["EN-FR", "EN-ES"]);
      }
    });

    it("should handle comma-separated languages", () => {
      const fields = {
        Languages: "EN-FR, EN-ES",
      };
      const result = AirtableUserFieldsSchema.safeParse(fields);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Languages).toEqual(["EN-FR", "EN-ES"]);
      }
    });

    it("should handle null values", () => {
      const fields = {
        Email: "user@example.com",
        Picture: null,
        Languages: null,
        Rating: null,
      };
      const result = AirtableUserFieldsSchema.safeParse(fields);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Picture).toBeNull();
        expect(result.data.Languages).toEqual([]);
      }
    });
  });

  describe("parseAirtableUserFields", () => {
    it("should return parsed data for valid input", () => {
      const fields = {
        Email: "user@example.com",
        Name: "Test User",
      };
      const result = parseAirtableUserFields(fields);
      expect(result).toBeDefined();
      expect(result?.Email).toBe("user@example.com");
    });

    it("should return undefined for invalid email", () => {
      const fields = {
        Email: "not-an-email",
      };
      const result = parseAirtableUserFields(fields);
      expect(result).toBeUndefined();
    });
  });

  describe("parseAirtableUserFieldsStrict", () => {
    it("should return parsed data for valid input", () => {
      const fields = {
        Email: "user@example.com",
      };
      const result = parseAirtableUserFieldsStrict(fields);
      expect(result.Email).toBe("user@example.com");
    });

    it("should throw for invalid input", () => {
      const fields = {
        Email: "not-an-email",
      };
      expect(() => parseAirtableUserFieldsStrict(fields)).toThrow();
    });
  });
});

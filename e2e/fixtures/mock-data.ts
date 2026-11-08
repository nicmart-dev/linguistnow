import {
  AirtableUserFieldsSchema,
  DayNameSchema,
  LinguistWithAvailabilitySchema,
  UserRoleSchema,
  type FilterOptionsResponse,
  type LinguistWithAvailability,
  type SearchLinguistsQuery,
  type SearchLinguistsResponse,
} from "@linguistnow/shared";
import { z } from "zod";

export const LinguistSearchItemSchema = LinguistWithAvailabilitySchema.extend({
  hourlyRateConverted: z.number().optional(),
  displayCurrency: z.string().optional(),
});

export const FilterOptionsSchema = z.object({
  languages: z.array(z.string()),
  specializations: z.array(z.string()),
  rateRange: z.object({ min: z.number(), max: z.number() }),
  ratingRange: z.object({ min: z.number(), max: z.number() }),
});

export const SearchLinguistsResponseSchema = z.object({
  linguists: z.array(LinguistSearchItemSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
  filters: z.record(z.string(), z.unknown()),
});

export const AirtableUserRecordSchema = AirtableUserFieldsSchema.extend({
  Email: z.email(),
  Name: z.string().min(1),
  Role: UserRoleSchema,
});

export const MockRawAirtableUserSchema = z.object({
  Email: z.email(),
  Name: z.string().min(1),
  Picture: z.url().optional().nullable(),
  Role: UserRoleSchema,
  "Calendar IDs": z.string().optional(),
  Timezone: z.string().optional(),
  "Working Hours Start": z.string().optional(),
  "Working Hours End": z.string().optional(),
  "Off Days": z.array(DayNameSchema).optional(),
  Languages: z.array(z.string()).optional(),
  Specialization: z.array(z.string()).optional(),
  "Hourly Rate": z.number().optional(),
  Currency: z.string().optional(),
  Rating: z.number().min(1).max(5).optional().nullable(),
});

export type MockAirtableUser = z.infer<typeof MockRawAirtableUserSchema>;

export function validateMockRawAirtableUser(raw: unknown): MockAirtableUser {
  const validated = MockRawAirtableUserSchema.parse(raw);
  // Ensure the raw Airtable wire shape remains compatible with the shared parser
  AirtableUserRecordSchema.parse(validated);
  return validated;
}

export const PM_EMAIL = "pm@example.com";
export const LINGUIST_EMAIL = "linguist@example.com";

export function createMockUsers(): Record<
  string,
  MockAirtableUser | undefined
> {
  const pmUser = validateMockRawAirtableUser({
    Email: PM_EMAIL,
    Name: "Morgan Taylor",
    Picture: "https://example.com/pm-avatar.png",
    Role: "Project Manager",
    "Calendar IDs": "primary",
    Timezone: "America/Los_Angeles",
    "Working Hours Start": "09:00",
    "Working Hours End": "17:00",
    "Off Days": ["Sunday", "Saturday"],
  });

  const linguistUser = validateMockRawAirtableUser({
    Email: LINGUIST_EMAIL,
    Name: "Alice Moreau",
    Picture: "https://example.com/linguist-avatar.png",
    Role: "Linguist",
    "Calendar IDs": "primary",
    Timezone: "America/Los_Angeles",
    "Working Hours Start": "08:00",
    "Working Hours End": "18:00",
    "Off Days": ["Sunday", "Saturday"],
    "Hourly Rate": 55,
    Currency: "USD",
    Languages: ["EN-FR", "EN-ES"],
    Specialization: ["Legal"],
    Rating: 5,
  });

  return {
    [PM_EMAIL]: pmUser,
    [LINGUIST_EMAIL]: linguistUser,
  };
}

export function createMockCalendars(): Array<{ id: string; summary: string }> {
  return [
    { id: "primary", summary: "Primary Calendar" },
    { id: "work@group.calendar.google.com", summary: "Work Schedule" },
    { id: "personal@group.calendar.google.com", summary: "Personal Blocked" },
  ];
}

const RAW_LINGUISTS: LinguistWithAvailability[] = [
  {
    id: "rec01",
    email: "alice@example.com",
    name: "Alice Moreau",
    languages: ["EN-FR", "FR-EN"],
    specialization: ["Legal"],
    hourlyRate: 50,
    currency: "USD",
    timezone: "Europe/Paris",
    rating: 5,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T09:00:00Z", end: "2026-11-10T17:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
  {
    id: "rec02",
    email: "carlos@example.com",
    name: "Carlos Ruiz",
    languages: ["EN-ES", "ES-EN"],
    specialization: ["Medical"],
    hourlyRate: 60,
    currency: "EUR",
    timezone: "Europe/Madrid",
    rating: 4,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T09:00:00Z", end: "2026-11-10T17:00:00Z" },
      ],
      totalFreeHours: 32,
    },
  },
  {
    id: "rec03",
    email: "yuki@example.com",
    name: "Yuki Sato",
    languages: ["EN-JA"],
    specialization: ["Technical"],
    hourlyRate: 7000,
    currency: "JPY",
    timezone: "Asia/Tokyo",
    rating: 4,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: false,
      freeSlots: [
        { start: "2026-11-10T01:00:00Z", end: "2026-11-10T05:00:00Z" },
      ],
      totalFreeHours: 12,
    },
  },
  {
    id: "rec04",
    email: "lars@example.com",
    name: "Lars Vega",
    languages: ["EN-DE"],
    specialization: ["Financial"],
    hourlyRate: 45,
    currency: "USD",
    timezone: "Europe/Berlin",
    rating: 3,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: false,
      freeSlots: [],
      totalFreeHours: 0,
    },
  },
  {
    id: "rec05",
    email: "nadia@example.com",
    name: "Nadia Mansour",
    languages: ["EN-AR"],
    specialization: ["Marketing"],
    hourlyRate: 55,
    currency: "USD",
    timezone: "Africa/Cairo",
    rating: 4,
    setupStatus: {
      isComplete: false,
      missingItems: ["calendars", "working_hours"],
    },
    availability: null,
  },
  {
    id: "rec06",
    email: "omar@example.com",
    name: "Omar Haddad",
    languages: ["EN-FR"],
    specialization: ["Academic"],
    hourlyRate: 52,
    currency: "USD",
    timezone: "Europe/London",
    rating: 4,
    setupStatus: {
      isComplete: true,
      missingItems: [],
      tokenExpired: true,
    },
    availability: null,
  },
  {
    id: "rec07",
    email: "mei@example.com",
    name: "Mei Chen",
    languages: ["EN-ZH"],
    specialization: ["Technical"],
    hourlyRate: 48,
    currency: "USD",
    timezone: "Asia/Shanghai",
    rating: 5,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T02:00:00Z", end: "2026-11-10T10:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
  {
    id: "rec08",
    email: "sofia@example.com",
    name: "Sofia Conti",
    languages: ["EN-IT"],
    specialization: ["Marketing"],
    hourlyRate: 54,
    currency: "EUR",
    timezone: "Europe/Rome",
    rating: 4,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T08:00:00Z", end: "2026-11-10T16:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
  {
    id: "rec09",
    email: "elena@example.com",
    name: "Elena Volkov",
    languages: ["EN-RU"],
    specialization: ["Legal"],
    hourlyRate: 65,
    currency: "USD",
    timezone: "Europe/Moscow",
    rating: 5,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T07:00:00Z", end: "2026-11-10T15:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
  {
    id: "rec10",
    email: "kenji@example.com",
    name: "Kenji Park",
    languages: ["EN-KO"],
    specialization: ["Technical"],
    hourlyRate: 58,
    currency: "USD",
    timezone: "Asia/Seoul",
    rating: 4,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T01:00:00Z", end: "2026-11-10T09:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
  {
    id: "rec11",
    email: "paula@example.com",
    name: "Paula Silva",
    languages: ["EN-PT"],
    specialization: ["Medical"],
    hourlyRate: 49,
    currency: "USD",
    timezone: "America/Sao_Paulo",
    rating: 4,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T11:00:00Z", end: "2026-11-10T19:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
  {
    id: "rec12",
    email: "david@example.com",
    name: "David Mueller",
    languages: ["EN-DE", "EN-FR"],
    specialization: ["Financial"],
    hourlyRate: 70,
    currency: "USD",
    timezone: "Europe/Zurich",
    rating: 5,
    setupStatus: { isComplete: true, missingItems: [] },
    availability: {
      isAvailable: true,
      freeSlots: [
        { start: "2026-11-10T08:00:00Z", end: "2026-11-10T16:00:00Z" },
      ],
      totalFreeHours: 40,
    },
  },
];

export function createMockLinguists(): LinguistWithAvailability[] {
  return RAW_LINGUISTS.map((item) =>
    LinguistWithAvailabilitySchema.parse(item),
  );
}

export function createMockFilterOptions(): FilterOptionsResponse {
  return FilterOptionsSchema.parse({
    languages: [
      "EN-AR",
      "EN-DE",
      "EN-ES",
      "EN-FR",
      "EN-IT",
      "EN-JA",
      "EN-KO",
      "EN-PT",
      "EN-RU",
      "EN-ZH",
      "ES-EN",
      "FR-EN",
    ],
    specializations: [
      "Academic",
      "Financial",
      "Legal",
      "Marketing",
      "Medical",
      "Technical",
    ],
    rateRange: { min: 20, max: 150 },
    ratingRange: { min: 1, max: 5 },
  });
}

const FX_FROM_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150,
  CAD: 1.38,
};

export function buildSearchResponse(
  linguists: LinguistWithAvailability[],
  query: SearchLinguistsQuery,
  options: { simulateCurrencyFailure?: boolean } = {},
): SearchLinguistsResponse {
  let filtered = [...linguists];

  if (query.languages) {
    const wanted = query.languages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    filtered = filtered.filter((l) =>
      wanted.some((lang) => l.languages?.includes(lang)),
    );
  }

  if (query.specialization) {
    const wanted = query.specialization
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    filtered = filtered.filter((l) =>
      wanted.some((spec) => l.specialization?.includes(spec)),
    );
  }

  if (query.minRate !== undefined) {
    const minRate = query.minRate;
    filtered = filtered.filter(
      (l) => l.hourlyRate !== undefined && l.hourlyRate >= minRate,
    );
  }

  if (query.maxRate !== undefined) {
    const maxRate = query.maxRate;
    filtered = filtered.filter(
      (l) => l.hourlyRate !== undefined && l.hourlyRate <= maxRate,
    );
  }

  if (query.minRating !== undefined) {
    const minRating = query.minRating;
    filtered = filtered.filter(
      (l) => l.rating !== undefined && l.rating >= minRating,
    );
  }

  if (query.availableOnly) {
    filtered = filtered.filter((l) => l.availability?.isAvailable === true);
  }

  const displayCurrency = query.displayCurrency?.toUpperCase();
  const mapped = filtered.map((l) => {
    if (
      displayCurrency &&
      !options.simulateCurrencyFailure &&
      l.hourlyRate !== undefined
    ) {
      const fromRate = FX_FROM_USD[l.currency || "USD"] ?? 1;
      const toRate = FX_FROM_USD[displayCurrency] ?? 1;
      const converted =
        Math.round((l.hourlyRate / fromRate) * toRate * 100) / 100;
      return {
        ...l,
        hourlyRateConverted: converted,
        displayCurrency,
      };
    }
    return l;
  });

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = mapped.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const slice = mapped.slice((page - 1) * limit, page * limit);

  return SearchLinguistsResponseSchema.parse({
    linguists: slice,
    total,
    page,
    totalPages,
    filters: { ...query },
  });
}

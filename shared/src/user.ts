/**
 * User-related types shared between client and server
 */

export type UserRole = "Project Manager" | "Linguist";

/**
 * Availability preferences for linguists
 */
export interface AvailabilityPreferences {
  timezone?: string; // IANA timezone (e.g., "Europe/Paris")
  workingHoursStart?: string; // Start of workday in ISO 8601 time format (HH:mm, e.g., "08:00")
  workingHoursEnd?: string; // End of workday in ISO 8601 time format (HH:mm, e.g., "18:00")
  offDays?: number[]; // Days off (0=Sunday, 1=Monday, ..., 6=Saturday)
  // Note: minHoursPerDay is not a linguist preference - it's a PM requirement set in availability requests
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  googleCalendarId?: string;
  createdAt?: string;
  updatedAt?: string;
  availabilityPreferences?: AvailabilityPreferences;
  // Linguist profile fields
  languages?: string[]; // e.g., ["EN-FR", "EN-ES"]
  specialization?: string[]; // e.g., ["Legal", "Medical"]
  hourlyRate?: number;
  rating?: number;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: UserRole;
  googleCalendarId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  googleCalendarId?: string;
  calendarIds?: string[];
  availabilityPreferences?: AvailabilityPreferences;
  languages?: string[];
  specialization?: string[];
  hourlyRate?: number;
  rating?: number;
}

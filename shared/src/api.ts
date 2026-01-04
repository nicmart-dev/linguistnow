/**
 * API request/response types shared between client and server
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Linguist search request query parameters
 */
export interface SearchLinguistsQuery {
  languages?: string; // Comma-separated language pairs (e.g., "EN-FR,EN-ES")
  specialization?: string; // Comma-separated specializations (e.g., "Legal,Medical")
  minRate?: number;
  maxRate?: number;
  minRating?: number;
  availableOnly?: boolean;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  requiredHours?: number; // Project size in hours
  timezone?: string; // IANA timezone
  page?: number;
  limit?: number;
}

/**
 * Setup status for linguist profile
 */
export interface SetupStatus {
  isComplete: boolean;
  missingItems: string[]; // e.g., ["calendars", "timezone", "working_hours"]
}

/**
 * Linguist with availability information
 */
export interface LinguistWithAvailability {
  id: string;
  email: string;
  name: string;
  picture?: string;
  languages?: string[];
  specialization?: string[];
  hourlyRate?: number;
  currency?: string;
  timezone?: string;
  rating?: number;
  setupStatus: SetupStatus;
  availability: {
    isAvailable: boolean;
    freeSlots: Array<{ start: string; end: string }>;
    totalFreeHours: number;
  } | null; // null if setup incomplete
}

/**
 * Search linguists response
 */
export interface SearchLinguistsResponse {
  linguists: LinguistWithAvailability[];
  total: number;
  page: number;
  totalPages: number;
  filters: SearchLinguistsQuery; // Echo back applied filters
}

/**
 * Filter options response
 */
export interface FilterOptionsResponse {
  languages: string[]; // All language pairs in system
  specializations: string[]; // All specialization options
  rateRange: { min: number; max: number };
  ratingRange: { min: number; max: number };
}

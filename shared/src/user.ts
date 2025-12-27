/**
 * User-related types shared between client and server
 */

export type UserRole = 'Project Manager' | 'Linguist';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  googleCalendarId?: string;
  createdAt?: string;
  updatedAt?: string;
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
}


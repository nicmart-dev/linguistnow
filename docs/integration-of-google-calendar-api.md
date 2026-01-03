# Integration of Google Calendar API

## Overview

The integration of the Google Calendar API allows linguists to select their calendars, and project managers to view linguist availability.

**Architecture:**

- Availability checks handled **directly by Express** (no n8n)
- OAuth tokens stored in **HashiCorp Vault**
- Only calendar IDs stored in Airtable

## Calendar Integration Flow

```mermaid
sequenceDiagram
    participant Linguist
    participant Settings as Account Settings
    participant Server as Express Server
    participant Vault as HashiCorp Vault
    participant Google as Google Calendar API
    participant Airtable as Airtable DB
    participant PM as Project Manager
    participant Dashboard

    Note over Linguist,Airtable: Calendar Selection Flow
    Linguist->>Settings: Navigate to Settings
    Settings->>Server: GET /api/calendars/list/{email}
    Server->>Vault: Read access token
    Vault->>Server: { accessToken, refreshToken }
    Server->>Google: GET calendarList
    Google->>Server: List of calendars
    Server->>Settings: Calendar list
    Settings->>Linguist: Display calendars
    Linguist->>Settings: Select calendars
    Settings->>Server: PUT /api/users/{email}
    Server->>Airtable: Save Calendar IDs

    Note over PM,Dashboard: Availability Check Flow (Express Direct)
    PM->>Dashboard: View linguists
    Dashboard->>Server: GET /api/tokens/list
    Server->>Vault: List token keys
    Vault->>Server: [emails with tokens]
    Dashboard->>Airtable: Fetch linguists + Calendar IDs
    Dashboard->>Server: POST /api/calendars/availability<br/>{ calendarIds, userEmail }
    Server->>Vault: Read access token
    Vault->>Server: { accessToken, refreshToken }
    Server->>Google: POST freeBusy query
    Google->>Server: Busy time slots
    Server->>Server: calculateAvailability()
    Server->>Dashboard: { isAvailable, freeSlots, ... }
    Dashboard->>PM: Display available linguists
```

## Availability Calculation

The `availabilityService.ts` determines if a linguist is available:

| Parameter           | Default             | Description                                    |
| ------------------- | ------------------- | ---------------------------------------------- |
| `timezone`          | America/Los_Angeles | IANA timezone for working hours                |
| `workingHoursStart` | "08:00"             | Start of working day (ISO 8601 HH:mm format)   |
| `workingHoursEnd`   | "18:00"             | End of working day (ISO 8601 HH:mm format)     |
| `minHoursPerDay`    | 8                   | Minimum free hours required per day            |
| `offDays`           | [0, 6]              | Days off (0=Sunday, 1=Monday, ..., 6=Saturday) |
| `excludeWeekends`   | true                | Deprecated - use `offDays` instead             |
| `startDate`         | tomorrow            | Start of availability window                   |
| `endDate`           | +7 days             | End of availability window                     |

**Rule:** A linguist is **available** if they have ≥ `minHoursPerDay` free hours on **every** working day.

## Express Server Architecture

```mermaid
flowchart TB
    subgraph Express["Express Server"]
        Controller["calendarController<br/>checkAvailability()"]
        Client["googleCalendarClient.ts<br/>getFreeBusy(token, ids)"]
        Service["availabilityService.ts<br/>calculateFreeSlots()<br/>excludeOffDays()<br/>excludeNonWorkingHours()<br/>calculateAvailability()"]
        Vault["vaultClient.ts<br/>readToken(userEmail)"]
    end

    Google["Google Calendar API<br/>freeBusy endpoint"]

    Controller --> Client
    Controller --> Service
    Controller --> Vault
    Client --> Google
```

## API Reference

### Check Availability

**Endpoint:** `POST /api/calendars/availability`

**Request:**

```json
{
  "calendarIds": ["primary", "work@group.calendar.google.com"],
  "userEmail": "linguist@example.com",
  "timezone": "America/Los_Angeles",
  "workingHoursStart": "08:00",
  "workingHoursEnd": "18:00",
  "minHoursPerDay": 8,
  "offDays": [0, 6]
}
```

**Response (200):**

```json
{
  "isAvailable": true,
  "freeSlots": [
    { "start": "2024-01-15T16:00:00Z", "end": "2024-01-16T02:00:00Z" }
  ],
  "totalFreeHours": 40,
  "workingDays": 5,
  "hoursPerDay": { "2024-01-15": 10, "2024-01-16": 8 }
}
```

**Errors:** `400` validation | `401` token expired | `404` no token | `503` Vault unavailable

## Related

- [Vault Integration Guide](./vault-integration-guide.md) - Token storage
- [Google Authentication](./google-authentication.md) - OAuth flow
- [n8n Workflow Integration](./n8n-workflow-integration.md) - Token refresh schedule

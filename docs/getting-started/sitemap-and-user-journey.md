# User journey

1. Linguist signs in with Google account.
2. Linguist selects one or more calendars.
3. Project Manager signs in with Google account.
4. Application checks live for available time slots on selected calendars.
5. Application filters users based on availability and returns the list of available users for the project.

<img width="700" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/5b1feab5-73e8-4303-92e6-a589fe8dea07">

# Live sandbox

You can login to https://linguistnow.nicmart.dev and use test accounts below:

- Linguist: `PokemonTest784@gmail.com`
- PM: `pokemontest525@gmail.com`
- Password for both: `!PokemonTest1$`

Note: Don't mind the Google warnings during sign-in, app approval is still in progress.

# Site map with screenshots

## Login

![Login page](https://github.com/nicmart-dev/linguistnow/assets/10499747/5c748b19-ee8b-48dc-b364-5368c23753b4)

## Project Manager Dashboard

### Find available linguist

![Project Manager Dashboard](https://github.com/nicmart-dev/linguistnow/assets/10499747/5d5d69d3-9bec-4e95-b06f-9d4fa1cb4335)

**📋 For detailed technical documentation, see [Dashboard Design Document](../architecture/dashboard-design.md)**

The dashboard provides a comprehensive interface for project managers to:

- **Search and filter linguists** by languages, specialization, rates, ratings, and availability
- **Select date ranges** for future project planning with locale-aware calendar picker
- **View results** in list (table) or card (grid) format
- **Book linguists** directly with calendar invite generation

Key features include real-time availability checking via Google Calendar integration, advanced filtering options, and a booking workflow that generates ICS files for calendar integration.

## Linguist Settings

### Connect with Google Calendar (Linguist only)

![Linguist Settings - Calendar Selection](https://github.com/nicmart-dev/linguistnow/assets/10499747/ae15b2f0-d93f-4acf-bedd-1684b3db9f42)

## Navigation bar

### Responsive design

![Responsive Navigation Bar](https://github.com/nicmart-dev/linguistnow/assets/10499747/3501ac3d-c2af-4824-bfb8-3ed91e196819)

### Change language

![Language Selector](https://github.com/nicmart-dev/linguistnow/assets/10499747/8490844d-038e-49d9-ae93-c8ba7e8e2237)

### Logout

<img width="314" alt="Logout menu" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/880a1c4f-60b7-4c4f-94e2-a285409a2293">

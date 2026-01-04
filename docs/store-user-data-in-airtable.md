# Store User Data in Airtable

## Table of Contents

- [Overview](#overview)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Airtable Configuration](#airtable-configuration)
  - [Airtable Data Structure](#airtable-data-structure)
  - [Airtable Environment](#airtable-environment)
- [Why Airtable?](#why-airtable)
- [Appendix: Manual Field Creation](#appendix-manual-field-creation)

---

## Overview

Airtable is used in the app to store and manage user data efficiently and effortlessly.

Access the base at https://airtable.com/ after [creating it](./install-instructions.md#airtable-database).

> **Note**: OAuth tokens (Access Token and Refresh Token) are stored in **HashiCorp Vault**, not Airtable. See [Vault Integration Guide](./vault-integration-guide.md) for details.

Below are the key steps and components involved in this implementation:

### Frontend

- **Login Component:**
  - Upon successful login, fetches user data from Google.
  - Checks if the user exists in Airtable and creates a new user if not found.
  - Tokens are stored in Vault by the backend (not in Airtable).

- **Account Settings Component:**
  - Utilizes the CalendarSelector component to manage user's calendar selections.
  - Saves selected calendar IDs in Airtable.
  - Fetches calendar list via backend API (which reads tokens from Vault).
  - Utilizes the AvailabilitySettings component to manage availability preferences (timezone, working hours, days off).
  - Saves availability preferences in Airtable with automatic debounced saving.

### Backend

- **Express Routes:**
  - Defined routes to handle CRUD operations on user records.
  - Implemented routes for fetching all users, fetching a single user, creating a new user, updating user information, and deleting a user.
  - The DELETE endpoint accepts email addresses and removes users from both Airtable and Vault, allowing linguists to remove themselves from the database.
  - Calendar routes fetch tokens from Vault for Google API calls.

- **Users Controller:**
  - Utilized official [Airtable API](https://airtable.com/developers/web/api/introduction) Node.js client to interact with the Airtable database.
  - Implemented functions for fetching, creating, updating, and deleting user records.
  - Securely handled API key and implemented error handling for robustness.
  - **Note**: Token fields have been removed from Airtable - tokens are stored in Vault.

- **Schema Management:**
  - Schema definition is centralized in `server/airtable/schema.ts` for type safety and documentation.
  - Schema validation script (`server/airtable/validate-schema.ts`) ensures Airtable structure matches the expected schema.
  - Schema sync script (`server/airtable/sync-schema.ts`) automatically creates missing fields in Airtable using the Meta API.
  - Run `cd server && npm run airtable:validate` to validate the schema against the actual Airtable base.
  - Run `cd server && npm run airtable:sync` to automatically create missing fields (requires Airtable Enterprise plan with Meta API access).

## Airtable Configuration

### Airtable Data Structure

The Airtable schema is defined in `server/airtable/schema.ts` and validated using `server/airtable/validate-schema.ts`. The structure uses appropriate [field types](https://support.airtable.com/docs/supported-field-types-in-airtable-overview):

#### Core User Fields

| Field        | Type             | Required | Description                         |
| ------------ | ---------------- | -------- | ----------------------------------- |
| Email        | Email            | Yes      | User's email address (primary key)  |
| Name         | Single line text | Yes      | User's full name                    |
| Picture      | URL              | No       | Profile picture URL from Google     |
| Role         | Single select    | No       | `Linguist` or `Project Manager`     |
| Calendar IDs | Single line text | No       | Comma-separated Google Calendar IDs |

#### Availability Preferences Fields

| Field               | Type             | Required | Description                                                     |
| ------------------- | ---------------- | -------- | --------------------------------------------------------------- |
| Timezone            | Single line text | No       | IANA timezone identifier (e.g., `America/New_York`)             |
| Working Hours Start | Single line text | No       | Start of workday in ISO 8601 time format (HH:mm, e.g., `08:00`) |
| Working Hours End   | Single line text | No       | End of workday in ISO 8601 time format (HH:mm, e.g., `18:00`)   |
| Off Days            | Multiple selects | No       | Days off as array of day names (Sunday, Monday, ..., Saturday)  |

> **Note**: The `Off Days` field stores day names (e.g., "Sunday", "Monday") in Airtable's multiple selects dropdown, but can also accept comma-separated day numbers (0-6) for backward compatibility.

#### Linguist Profile Fields

These fields are defined in the schema but may not be fully implemented in all features:

| Field          | Type                             | Required | Description                                        |
| -------------- | -------------------------------- | -------- | -------------------------------------------------- |
| Languages      | Multiple selects                 | No       | Language pairs the linguist can translate          |
| Specialization | Multiple selects                 | No       | Domain expertise areas                             |
| Hourly Rate    | Currency (recommended) or Number | No       | Hourly rate in USD (2 decimal precision)           |
| Rating         | Rating (recommended) or Number   | No       | Average rating from 1-5 (Rating displays as stars) |

**Language Pair Options**: EN-FR, EN-ES, EN-DE, EN-ZH, EN-JA, EN-KO, EN-AR, EN-RU, EN-IT, EN-PT, FR-EN, ES-EN, DE-EN, ZH-EN, JA-EN, KO-EN, AR-EN, RU-EN, IT-EN, PT-EN

**Specialization Options**: Legal, Medical, Technical, Marketing, Financial, Literary, Academic, General

> **Note**: The `Access Token` and `Refresh Token` columns have been **deprecated** and removed. OAuth tokens are now stored securely in [HashiCorp Vault](./vault-integration-guide.md).

> **Schema Validation**: The schema is validated using `npm run airtable:validate` which compares the actual Airtable structure against the schema definition in `server/airtable/schema.ts`.

> **Schema Synchronization**: Missing fields can be automatically created using `npm run airtable:sync`. This uses the Airtable Meta API to create fields defined in the schema but missing in Airtable. **Note**: This requires an Airtable Enterprise plan with Meta API access. If you don't have Enterprise plan access, see the [Manual Field Creation](#appendix-manual-field-creation) appendix below for step-by-step instructions to create fields manually. The sync script will only create missing fields; it cannot modify existing field types or delete fields.

### Airtable Environment

- Created personal access token https://airtable.com/developers/web/guides/personal-access-tokens
- Stored that token and base ID securely as environment variables:
  - `AIRTABLE_PERSONAL_ACCESS_TOKEN` - Your personal access token (starts with `pat`)
  - `AIRTABLE_BASE_ID` - Your Airtable base ID (starts with `app`)
- These are configured in `server/.env` and passed to Docker containers via `docker-compose.yml`

## Why Airtable?

I decided to go for [Airtable](https://airtable.com/) due to its ease of use, flexibility, free tier [pricing](https://airtable.com/pricing), and highly recognized solution in the automation space.
Also there is an existing [tutorial](https://chinarajames.com/getting-started-with-the-airtable-api/) on setting it up with Node.js

<details>
  <summary>Click to show comparison between Airtable and MySQL</summary>

When deciding between Airtable and MySQL for a web development capstone project, consider the following factors:

**Reasons to Choose Airtable**

1. **Ease of Use**: Airtable offers a user-friendly interface, making it ideal for those less familiar with database management.

2. **Flexibility**: Its flexible structure allows easy organization and customization of data, suitable for projects with diverse data types.

3. **Collaboration**: Built-in collaboration features facilitate real-time teamwork on the same database.

4. **Integration**: Airtable integrates seamlessly with various tools and services, enabling workflow automation.

**Reasons to Choose MySQL**

1. **Scalability**: MySQL handles large data volumes and high traffic, making it suitable for projects needing scalability.

2. **Performance**: It provides faster query response times, especially for complex queries and large datasets.

3. **Control**: Full control over database infrastructure allows fine-tuning of performance, security, and customization.

4. **Customization**: MySQL offers extensive control over database design and optimization, tailoring it to project requirements.

Ultimately, the choice depends on project requirements, familiarity with technologies, and preferences for ease of use vs. control and customization.

</details>

## Appendix: Manual Field Creation

Since the Airtable Meta API requires an Enterprise plan, fields must be created manually in Airtable if you don't have Enterprise access. This section provides step-by-step instructions for creating fields defined in `server/airtable/schema.ts`.

### Access Your Airtable Base

1. Go to https://airtable.com/
2. Open your base (Base ID: `apps6wMV6ppYNZO2L`)
3. Navigate to the **Users** table

### Creating Fields

For each field, follow these steps:

1. Click the **"+"** button at the top right of the field list
2. Enter the field name exactly as shown (case-sensitive)
3. Select the field type
4. Configure the options (if applicable)
5. Click **"Save"**

### Fields to Create

#### Languages (Multiple Selects)

**Field Name:** `Languages`

**Field Type:** Multiple select

**Options to Add:**

- EN-FR, EN-ES, EN-DE, EN-ZH, EN-JA, EN-KO, EN-AR, EN-RU, EN-IT, EN-PT
- FR-EN, ES-EN, DE-EN, ZH-EN, JA-EN, KO-EN, AR-EN, RU-EN, IT-EN, PT-EN

#### Specialization (Multiple Selects)

**Field Name:** `Specialization`

**Field Type:** Multiple select

**Options to Add:**

- Legal, Medical, Technical, Marketing, Financial, Literary, Academic, General

#### Hourly Rate (Currency)

**Field Name:** `Hourly Rate`

**Field Type:** Currency (recommended) or Number

**Settings:**

- **Currency type:** Select USD (United States Dollar), precision defaults to 2 decimals
- **Number type:** Set precision to 2 decimal places, optionally format as currency

**Note:** Currency type is recommended as it displays with $ symbol and stores as a number (API compatible).

#### Rating (Rating)

**Field Name:** `Rating`

**Field Type:** Rating (recommended) or Number

**Settings:**

- **Rating type:** Defaults to 5-star rating (perfect for 1-5 scale)
- **Number type:** Set precision to 1 decimal place, optionally set min=1, max=5

**Note:** Rating type is recommended as it displays as stars and stores as a number 1-5 (API compatible).

### Verification

After creating all fields, verify they exist by running:

```bash
cd server && npm run airtable:validate
```

This will check that all fields from the schema exist in your Airtable base.

### Important Notes

- Field names are **case-sensitive** and must match exactly (including spaces)
- For multiple select fields, option names must match exactly (case-sensitive)
- Number fields should have the correct precision settings
- All linguist profile fields are optional (not required)
- If a field already exists with a different type, you'll need to delete and recreate it (⚠️ this deletes all data in that field)

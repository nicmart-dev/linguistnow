# Store User Data in Airtable

## Table of Contents

- [Overview](#overview)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Airtable Configuration](#airtable-configuration)
  - [Airtable Data Structure](#airtable-data-structure)
  - [Airtable Environment](#airtable-environment)
- [Why Airtable?](#why-airtable)

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

### Backend

- **Express Routes:**
  - Defined routes to handle CRUD operations on user records.
  - Implemented routes for fetching all users, fetching a single user, creating a new user, updating user information, and deleting a user.
  - Calendar routes fetch tokens from Vault for Google API calls.

- **Users Controller:**
  - Utilized official [Airtable API](https://airtable.com/developers/web/api/introduction) Node.js client to interact with the Airtable database.
  - Implemented functions for fetching, creating, updating, and deleting user records.
  - Securely handled API key and implemented error handling for robustness.
  - **Note**: Token fields have been removed from Airtable - tokens are stored in Vault.

## Airtable Configuration

### Airtable Data Structure

A simple structure was retained to store the data with appropriate [field types](https://support.airtable.com/docs/supported-field-types-in-airtable-overview):

| Field        | Type             | Description                         |
| ------------ | ---------------- | ----------------------------------- |
| Email        | Email            | User's email address (primary key)  |
| Name         | Single line text | User's display name                 |
| Picture      | URL              | Profile picture URL from Google     |
| Role         | Single select    | `Linguist` or `Project Manager`     |
| Calendar IDs | Long text        | Comma-separated Google Calendar IDs |

> **Note**: The `Access Token` and `Refresh Token` columns have been **deprecated** and removed. OAuth tokens are now stored securely in [HashiCorp Vault](./vault-integration-guide.md).

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

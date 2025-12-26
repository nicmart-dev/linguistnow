## Overview:

Airtable is used is the app to store and manage user data efficiently and effortlessly.

Access the base at https://airtable.com/ after [creating it](./install-instructions.md#airtable-database).

Below are the key steps and components involved in this implementation:

### Frontend:

- **Login Component:**

  - Upon successful login, fetches user data from Google.
  - Checks if the user exists in Airtable and creates a new user if not found.
  - Updates user details and tokens in Airtable.

- **Account Settings Component:**
  - Utilizes the CalendarSelector component to manage user's calendar selections.
  - Saves selected calendars and Google tokens in Airtable.
  - Validates user existence before updating their information.

### Backend:

- **Express Routes:**

  - Defined routes to handle CRUD operations on user records.
  - Implemented routes for fetching all users, fetching a single user, creating a new user, updating user information, and deleting a user.

- **Users Controller:**
  - Utilized official [Airtable API](https://airtable.com/developers/web/api/introduction) Node.js client to interact with the Airtable database.
  - Implemented functions for fetching, creating, updating, and deleting user records.
  - Securely handled API key and implemented error handling for robustness.

## Airtable configuration

### Airtable data structure

A simple structure was retained to store the data with appropriate [field types](https://support.airtable.com/docs/supported-field-types-in-airtable-overview), with:

- Email an `Email` field type,
- Picture a `URL`,
- Name a `single line text`,
- Role a `Single select`, and
- all 3 others `Long text`.

<img alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/3fc40dd9-b868-45bb-89c9-30998d2282fb">

### Airtable environment

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

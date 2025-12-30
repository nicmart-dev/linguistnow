# Install

To install and run the LinguistNow application, you have two options:

1. **Local Development** - Install and run each component separately (described below)
2. **Docker Deployment** - Use Docker Compose for a containerized setup (see [Docker Quick Start](#docker-quick-start))

## Table of Contents

- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
- [Install front-end and backend](#install-front-end-and-backend)
  - [Server](#server)
  - [React app (Vite)](#react-app-vite)
  - [Airtable Database](#airtable-database)
  - [HashiCorp Vault](#hashicorp-vault)
  - [n8n](#n8n)
    - [Configure workflow](#configure-workflow)
- [Google OAuth setup](#google-oauth-setup)
- [Start our app](#start-our-app)
- [Set up new users](#set-up-new-users)
- [Docker Quick Start](#docker-quick-start)
  - [Prerequisites](#prerequisites-1)
  - [Steps](#steps)
  - [Useful Commands](#useful-commands)

## Local Development Setup

Follow these steps in order:

### Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** - This project uses pnpm workspaces for package management
  ```bash
  npm install -g pnpm
  ```

## Install front-end and backend

From the **root directory**, install all dependencies for both client and server:

```bash
pnpm install
```

This uses pnpm workspaces to install dependencies for all packages (client, server, n8n).

### Server

1. Navigate to the `server` directory.

2. Copy file `example.env` naming it `.env`

Note: We will start our Express server after setting up Google credentials below.

### React app (Vite)

1. Navigate to the `client` directory.

2. Copy file `example.env` naming it `.env`

**Note:** The application uses **Vite** (migrated from Create React App) for faster development and builds. All frontend environment variables must use the `VITE_` prefix.

**Environment Variables:**

- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_API_URL` - Backend API URL (e.g., `http://localhost:8080`)

Note: We will start our app after setting up Google credentials below.

### Airtable Database

1. Click on Airtable share link https://airtable.com/apps6wMV6ppYNZO2L/shriM67YiDaTMkebK

Note: It will say "No visible records" which is fine.

2. Click "Use this data". This should create your own empty database with the same schema.

3. Navigate back to `server` and in the `.env` variable `AIRTABLE_BASE_ID` with the url part that starts with "app"

4. Create a personal access token https://airtable.com/create/tokens

5. In that same `.env` variable, update `AIRTABLE_PERSONAL_ACCESS_TOKEN` with your token id (begins with `pat`)

### HashiCorp Vault

LinguistNow uses HashiCorp Vault to securely store OAuth tokens. You have two options:

#### Option A: Use Local Vault (via Docker Compose)

If you're using `docker-compose.yml`, Vault is included and starts automatically. Just set these in your `server/.env`:

```env
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=dev-token
```

No additional setup required - dev mode is preconfigured.

#### Option B: Use External Vault

If you have Vault running elsewhere (e.g., on a Synology NAS or cloud), point to it:

```env
VAULT_ADDR=http://your-vault-host:8200
VAULT_TOKEN=your-vault-token
```

For dev/testing, you can use `dev-token` (the root token). For production, create a scoped token with minimal permissions.

> **For detailed Vault setup and production configuration**, see [Vault Integration Guide](./n8n-vault-integration-guide.md).

### n8n

n8n handles the calendar availability workflow. Choose one deployment method:

#### Option A: Use Docker Compose (Recommended)

If using `docker-compose.yml`, n8n is included automatically. Skip to [Configure workflow](#configure-workflow).

#### Option B: Install via npm (Standalone)

For development without Docker:

1. Ensure you have Node.js installed on your system.

2. Install n8n globally (this is a standalone tool, not part of the pnpm workspace).

   ```bash
   npm install -g n8n
   ```

3. Start n8n.

   ```bash
   n8n start
   ```

4. Set in your `server/.env`:

   ```env
   N8N_BASE_URL=http://localhost:5678
   ```

> **For production deployment**, see [n8n Workflow Integration - Deploy n8n](./n8n-workflow-integration.md#3-deploy-n8n).

#### Configure workflow

1. Access n8n at `http://localhost:5678`

2. **Install the HashiCorp Vault community node:**
   - Go to **Settings** → **Community Nodes**
   - Click **Install a community node**
   - Enter: `n8n-nodes-hashi-vault`
   - Click **Install** and restart n8n if prompted

3. **Create HashiCorp Vault credential:**
   - Go to **Credentials** → **Add Credential**
   - Search for **HashiCorp Vault API**
   - Configure:
     - **Vault URL**: `http://vault:8200` (for local Docker) or `http://shared-vault:8200` (for production)
     - **Token**: `dev-token` (development) or your scoped token (production)
   - Click **Save**

4. **Import the workflow:**
   - In the first workflow that displays, remove the initial "Trigger node"
   - Click Workflow menu icon → [Import from file](https://docs.n8n.io/courses/level-one/chapter-6)
   - Select `n8n/Determine_Google_Calendar_availability.json`

5. **Connect the credential:**
   - Open the **"Fetch Token from Vault"** node
   - Select the HashiCorp Vault credential you created in step 3
   - Click **Save**

6. **Activate the workflow** using the toggle in the top right

> **For detailed Vault setup and production configuration**, see [Vault Integration Guide](./n8n-vault-integration-guide.md#set-up-n8n-workflow).

## Google OAuth setup

Follow steps in [Set up OAuth in Google Cloud](./set-up-oauth-in-google-cloud.md)

## Start our app

1. Navigate back to the root directory.

2. If you haven't already, install dependencies:

   ```bash
   pnpm install
   ```

3. Run the development servers:

   **Recommended for development (with hot reload):**

   ```bash
   pnpm dev
   ```

   **Or for production-like mode (no hot reload):**

   ```bash
   pnpm start
   ```

   **Development Servers:**
   - Frontend: `http://localhost:3000` (Vite dev server with HMR)
   - Backend: `http://localhost:8080` (Express server with hot reload in dev mode)

   **Note:** The `dev` command uses `concurrently` to run both services with colored output for easier debugging. Individual services can also be run separately:
   - `pnpm client` - Frontend only
   - `pnpm server` - Backend only

Note: After following these steps, you should have the LinguistNow application up and running, along with the n8n workflow automation tool.

## Set up new users

By default when you run the app `http://localhost:3000/` and first sign in with Google, you'll be logged in as a linguist.
We recommend you have two Google accounts so the other can be used to sign in as a Project Manager too and you can then follow the [user journey](./sitemap-and-user-journey.md).

To do this:

1. Log in to the app with each Google, account, so the corresponding user row is created in Airtable.

2. Change one of the accounts to have Project Manager role, by logging in to [Airtable](./store-user-data-in-airtable.md) and then changing role for corresponding user from `Linguist` to `Project Manager`.

---

## Docker Quick Start

For a containerized setup using Docker Compose:

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Google OAuth credentials (see [Set up OAuth in Google Cloud](./set-up-oauth-in-google-cloud.md))
- Airtable database set up (see [Airtable Database](#airtable-database) above)

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/nicmart-dev/linguistnow.git
   cd linguistnow
   ```

2. **Configure environment variables**

   ```bash
   cp example.env .env
   ```

   Edit `.env` with your configuration:

   ```bash
   # Required
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token
   AIRTABLE_BASE_ID=your_base_id

   # URLs (defaults work for local development)
   FRONTEND_URL=http://localhost:3000
   VITE_API_URL=http://localhost:5000

   # Vault (use dev-token for local development)
   VAULT_TOKEN=dev-token
   ```

3. **Build and start all services**

   ```bash
   docker-compose up -d --build
   ```

4. **Configure n8n workflow**
   - Access n8n at `http://localhost:5678`
   - Import the workflow from `n8n/Determine_Google_Calendar_availability.json`
   - Configure credentials and activate the workflow (see [Configure workflow](#configure-workflow))

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - n8n: `http://localhost:5678`
   - Vault: `http://localhost:8200` (login with `dev-token`)

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Check container health
docker-compose ps
```

For production deployment on a NAS or server, see [Deploy app to production](./deploy-app-to-production.md).

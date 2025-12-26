# Install

To install and run the LinguistNow application, you have two options:

1. **Local Development** - Install and run each component separately (described below)
2. **Docker Deployment** - Use Docker Compose for a containerized setup (see [Docker Quick Start](#docker-quick-start))

## Local Development Setup

Follow these steps in order:


## Install front-end and backend

### Server

1. Navigate to the `server` directory.

2. Install dependencies using npm.

   ```
   npm install
   ```

3. Copy file `example.env` naming it `.env`


Note: We will start our Express server after setting up Google credentials below. 


### React app (Vite)

1. Navigate to the `client` directory.

2. Install dependencies using npm.

   ```
   npm install
   ```

3. Copy file `example.env` naming it `.env`

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


### n8n

#### Install through npm

1. Ensure you have Node.js and npm installed on your system.

2. Install n8n globally.

   ```
   npm install n8n -g
   ```

3. Start n8n.

   ```
   n8n start
   ```


#### Configure workflow

1. In the app that opened in your browser, in the first workflow that displays, remove the initial "Trigger node" in an otherwise empty canvas.

2. import n8n workflow configuration from `n8n\Determine_Google_Calendar_availability.json` by clicking the Workflow menu icon > [Import from file](https://docs.n8n.io/courses/level-one/chapter-6).

3. Notice `Check if busy` node has a warning icon. Double click on it and select _Create new credential_ in _Header Auth_ field:
  <img width="200" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/b9582144-2692-4f90-9b08-a42337af5152">

4. Enter any name such as "Authorization", and as value click _Expression_ (in toggle that appears on field mouse over) paste in below code, and click _Save_:
`{{ $('Webhook').item.json["headers"]["authorization"] }}`

  <img alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/dd4abf2e-dd9e-47ff-bc6b-4328d772eb53">


5. Toggle to activate workflow:
  <img alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/56daf938-f827-4d81-91c4-9b1f7195ba84">


## Google OAuth setup

Follow steps in [Set up OAuth in Google Cloud](./set-up-oauth-in-google-cloud.md)


## Start our app

1. Navigate back to the root directory.

2. Install dependencies using npm.

   ```
   npm install
   ```
3. Run `npm start` which will start both React app client (Vite dev server) and Express server using the `npm-run-all` library.

**Development Servers:**
- Frontend: `http://localhost:3000` (Vite dev server with HMR)
- Backend: `http://localhost:8080` (Express server) 

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
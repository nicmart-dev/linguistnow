# Install

To install and run the LinguistNow application, follow these steps in order listed below:


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
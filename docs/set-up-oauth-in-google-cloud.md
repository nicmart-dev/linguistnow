The React app and Express server use OAuth 2.0 Client ID and secret created for [Google authentication](./google-authentication.md)

The client ID and secret can always be accessed from Credentials in APIs & Services
https://console.cloud.google.com/apis/credentials

# Google API client ID setup instructions

## Create project

1. Go to https://console.cloud.google.com/apis/dashboard

2. Click `CREATE PROJECT` button, choose any name

## Configure consent screen

1. Click `CONFIGURE CONSENT SCREEN` button or go to your OAuth Consent Screen https://console.cloud.google.com/apis/credentials/consent

2. Select `External` and click `CREATE` button

3. Fill in mandatory fields and click `SAVE AND CONTINUE` button, and click that button again in the `Scopes` screen

4. Add your account email as test user with `ADD USERS` button, click `SAVE AND CONTINUE` button

Note: please set up at least 2 Google accounts to use as test users, one of which we will later [set up in Airtable](./install-instructions.md#set-up-new-users) with `Project Manager` role (the other being created automatically upon first login in the app with `Linguist` role.

## Create credentials

1. Go to Credentials page https://console.cloud.google.com/apis/credentials

2. Click `Create credentials` button and select `OAuth client ID`

3. In the Application type dropdown, select `Web application` and give it a recognizable name like `google-auth-library`

4. Under `Authorized redirect URIs`, select + ADD URI. Paste in `http://localhost:3000`.
   **Important**: The redirect URI must be `http://localhost:3000` (the frontend URL), not the backend URL.
   You may also want to set `http://localhost:3000`, `http://localhost:8080`, `http://localhost` in `Authorized JavaScript origins` field too.

5. Select `CREATE` button

6. In the OAuth client created modal that appears, click `DOWNLOAD JSON`

## Configure to use the client id and secret in our app

Prerequisite: complete [install](./install-instructions.md#install-front-end-and-backend) of React app and server.

1. Download JSON from `google-auth-library` credential (which you downloaded from an earlier step, or from https://console.cloud.google.com/apis/credentials) to `server\config\oauth2.keys.json`

2. Navigate to `server` and `client` directories, and copy `example.env` as `.env` file in each case

3. Extract the `client_id` and `client_secret` from `oauth2.keys.json`:
   - For `client\.env`: Set `VITE_GOOGLE_CLIENT_ID` to the `client_id` value
   - For `server\.env`: Set `GOOGLE_CLIENT_ID` to the `client_id` value and `GOOGLE_CLIENT_SECRET` to the `client_secret` value
   - For `server\.env`: Set `FRONTEND_URL=http://localhost:3000` (this must match the redirect URI configured in Google Cloud Console)
   - For `server\.env`: Set `GOOGLE_REDIRECT_URI=${FRONTEND_URL}` or `GOOGLE_REDIRECT_URI=http://localhost:3000`

**Important**: The `GOOGLE_REDIRECT_URI` in the server `.env` file must match the `Authorized redirect URIs` configured in Google Cloud Console (which should be `http://localhost:3000`, the frontend URL).

The Node Express `server` folder has been deployed to Render on https://linguistnow.onrender.com/. The React app to Netlify https://linguistnow.netlify.app/dashboard, and the n8n workflow was deployed on my local NAS on https://n8n.nicmart.synology.me/

# Update OAuth2 configuration to production

Prerequisite: [set up OAuth2](./set-up-oauth-in-google-cloud.md) in Google Cloud console.

We will need to adjust the consent screen settings and credentials to use the production url of our React app eg. https://linguistnow.netlify.app

1. Go to OAuth consent screen https://console.cloud.google.com/apis/credentials/consent

2. Click _Edit app_ button

3. Provide relevant information. For example:

  <img alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/84953fff-048b-486b-b426-3f5ec95d6561">

4. Go to credentials screen at https://console.cloud.google.com/apis/credentials and add production URL in _Authorized redirect URIs_, and _Authorized JavaScript origins_ sections, for example below:

  <img width="245" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/600cb2eb-b70c-471a-8b65-6b017880179a">


5. Download updated `oauth2.keys.json`, go to Renders environment variables and edit the secret file, making sure the production url is the first or only one in the list:

  <img width="400" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/e75ace4e-4686-4508-9b69-c9d63a2126b1">

6. This file content will be set as secret file when we deploy Render below.

# Deploy Node Express server on Render

## Create web service on Render

A new [Web Service](https://dashboard.render.com/create?type=web) was created on Render, choosing to _Build and deploy from a Git repository_, and `server` folder on our repo chosen as the [root folder](https://docs.render.com/monorepo-support#root-directory) to deploy from.

<img width="429" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/ae8f5a75-251d-4b13-87a9-e7528f8f05c8">

###  Loading credentials from secret file

Added the `oauth2.keys.json` file as [secret file](https://docs.render.com/configure-environment-variables#secret-files.) on Render

<img width="319" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/d98db459-e290-4e4b-81f1-36b8f0ecdbe8">

Render mounts secret files into a special directory at runtime `/etc/secrets`. To access this directory when deployed, and a different one when running locally, here's how the `authController.js` code was [adjusted](https://github.com/nicmart-dev/linguistnow/commit/35a082a46719779abecc5998f6fdd8749fe0ff98) to read the oauth2.keys.json file from those different paths.

<details>
  <summary>Click to show code</summary>

```js 
const fs = require('fs');
const path = require('path');

// Define the possible paths
const localPath = path.join(__dirname, '../config/oauth2.keys.json');
const hostingProviderPath = path.join('/etc/secrets', 'oauth2.keys.json');

// Determine which path to use for OAuth2 configuration from Google Developers Console
const secretFilePath = fs.existsSync(localPath) ? localPath : hostingProviderPath;

console.log(`Using secret file path: ${secretFilePath}`);

const keys = require(secretFilePath);

// Create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
// which should be downloaded from the Google Developers Console.
const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
);
```
</details>

## Set environment variables

The `.env` variable was copied over to the _Environment_ section on the Render server, per [this help guide](https://docs.render.com/configure-environment-variables).
Airtable variables were set per [install instructions](./install-instructions.md#airtable-database), and the rest from the [example.env](https://github.com/nicmart-dev/linguistnow/blob/main/server/example.env) file.

<img width="291" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/a5e6a62e-6452-4bcb-a24c-18f0563fecd9">

Then waited 1-2min for Render deployment to complete:

  <img alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/75213d27-578b-49b2-ad45-b498b454c474">

# Deploy n8n

## Install n8n Docker container on NAS

Deploying [n8n docker image](https://registry.hub.docker.com/r/n8nio/n8n/) to local NAS was chosen as I already own a Synology DS218, so running n8n at no additional cost.
After installing the image, [configured the container](https://mariushosting.com/how-to-install-n8n-on-your-synology-nas/) and added [Synology firewall rules](https://mariushosting.com/synology-how-to-correctly-set-up-firewall-on-dsm-7/#:~:text=RULE%206) so n8n could access the PostgreSQL db.

<details>
  <summary>Why not Heroku?</summary>

As it costs $7 per month for web plan (basic dynos) and $5 for Heroku Postgres addon.

That said it's [officially supported](https://docs.n8n.io/hosting/installation/server-setups/heroku/) by n8n with a 1-click [Deploy to Heroku](https://dashboard.heroku.com/new?template=https://github.com/n8n-io/n8n-heroku/tree/main) template that creates a Docker image.
</details>

<details>
  <summary>Why not using Render?</summary>

Render is not officially supported by n8n unlike Heroku. Also, even though there is a [docker blueprint](https://github.com/ready4mars/n8n-render) that can be imported to Render, deploying it requires a $7/month minimum plan to deploy the Docker image, so more expensive than Heroku.

</details>

<details>
  <summary>Why not directly deploy n8n in the cloud?</summary>

Because it costs a minimum of €20 a month https://n8n.io/pricing/

</details>

## Configure n8n instance

Prerequisite: follow n8n steps to [configure your workflow](./install-instructions.md#configure-workflow).

1. Open your Webhook starting node, toggle to Production URL and copy webhook url
  <img width="266" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/d6a89488-b731-4f69-94fb-f3037fbf7bce">

2. Open your Render dashboard again, back to the [environment variables](https://docs.render.com/configure-environment-variables) section, and add new variable to allow our Node Express server to connect to our n8n workflow, with key `N8N_WEBHOOK_URL` and value be what you copied in previous step removing `/calendar-check` so it ends in `/webhook`

  <img width="428" alt="image" src="https://github.com/nicmart-dev/linguistnow/assets/10499747/9ebbcd26-db61-48f1-a3cd-9409f1dbcd74">


3. Don't forget to click _Save Changes_ button

# Deploy React app on Netlify

1. Choose to create new repo https://app.netlify.com/start/repos and select _GitHub_

2. Select your repo

3. Click [Build Settings](https://docs.netlify.com/configure-builds/overview/#basic-build-settings)

4. Set Base directory field to `client`

5. Change the "Build command" to `CI=false npm run build` (to ignore any warnings in the code)

6. Set _Publish directory_ field to `client/build`

7. Click _Add environment variables_ button

8. Create 4 keys below:
  * Create key `REACT_APP_BASE_URL` and set value to your published Netlify site. eg. https://linguistnow.netlify.app

  * Create keys `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_CLIENT_SECRET` with values from the [Google OAuth2 credentials](./set-up-oauth-in-google-cloud.md#configure-to-use-the-client-id-and-secret-in-our-app) you set up.

  * Create key `REACT_APP_API_URL` and set value to deployed Render server without trailing (eg. https://linguistnow.onrender.com). Make sure to remove trailing forward slash.

9. Click the _Deploy to Netlify_ button

10. Change app name in your site configuration under https://app.netlify.com/sites and enjoy eg. https://linguistnow.netlify.app/


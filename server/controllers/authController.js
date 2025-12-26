const { OAuth2Client } = require('google-auth-library');

// Get OAuth credentials from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || process.env.BACKEND_URL;

// Validate required environment variables
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.error('Missing required environment variables for Google OAuth:');
    if (!GOOGLE_CLIENT_ID) console.error('  - GOOGLE_CLIENT_ID is required');
    if (!GOOGLE_CLIENT_SECRET) console.error('  - GOOGLE_CLIENT_SECRET is required');
    if (!GOOGLE_REDIRECT_URI) console.error('  - GOOGLE_REDIRECT_URI or BACKEND_URL is required');
    process.exit(1);
}

console.log('Using Google OAuth credentials from environment variables');
console.log(`Redirect URI: ${GOOGLE_REDIRECT_URI}`);

// Create an oAuth client to authorize the API call. Secrets are kept in environment variables.
const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);


/* Route for exchanging authorization code for access token and refresh token */
const exchangeCodeForToken = async (req, res) => {
    try {
        const { code } = req.body;
        console.log(`Code is ${code}`); /* Sample code: 4/0AdLIrYf_Xzy7olraIi3029a4w37TYz... */

        // Exchange the authorization code for access token and refresh token
        const { tokens } = await oAuth2Client.getToken({
            code,
            redirect_uri: GOOGLE_REDIRECT_URI // Ensure this matches the registered redirect URI
        });
        // Set the refresh token
        oAuth2Client.setCredentials({
            refresh_token: tokens.refresh_token,
        });
        res.json({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    } catch (error) {
        console.error('Error during token exchange:', error);
        res.status(500).json({ error: 'Failed to exchange code for token' });
    }
};


/* Route for fetching user info from Google People API 
*/
const getUserInfo = async (req, res) => {
    try {
        const { accessToken } = req.body;
        /* Sample request body:
         { "accessToken": "ya29.A0ARrdaM8CQjQI5CZ6AB9tVbh7jvW..." } */

        // Set the access token
        oAuth2Client.setCredentials({
            access_token: accessToken,
        });

        // You can use this info to get user information too.
        const url = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos';
        const response = await oAuth2Client.request({ url });

        const userInfo = {
            email: response.data.emailAddresses[0].value,
            name: response.data.names[0].displayName,
            picture: response.data.photos[0].url,
        };

        console.log('User Info:', userInfo);
        res.json({ userInfo });
        /* Sample response body:
      {
          "userInfo": {
              "email": "nicmart@gmail.com",
              "name": "Nicolas Martinez",
              "picture": "https://lh3.googleusercontent.com/a/ACg8ocJyVz9ROm3HrVEUuXn1SgDyqx6iwms5nxnOgFDKyujfVQdJ-1HKLA=s96-c",
          }
      }
      */
    } catch (error) {
        console.error('Error during fetching user info:', error);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
};


module.exports = {
    exchangeCodeForToken,
    getUserInfo,
};

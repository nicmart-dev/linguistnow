const { OAuth2Client } = require('google-auth-library');


// Download your OAuth2 configuration from Google Developers Console
const keys = require('../config/oauth2.keys.json');

// Create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
// which should be downloaded from the Google Developers Console.
const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
);


/* Route for exchanging authorization code for access token and refresh token */
const exchangeCodeForToken = async (req, res) => {
    try {
        const { code } = req.body;
        console.log(`Code is ${code}`); /* Sample code: 4/0AdLIrYf_Xzy7olraIi3029a4w37TYz... */

        // Exchange the authorization code for access token and refresh token
        const { tokens } = await oAuth2Client.getToken({
            code,
            redirect_uri: keys.web.redirect_uris[0] // Ensure this matches the registered redirect URI
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
TODO: can use this to store user info in DB
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
            given_name: response.data.names[0].givenName,
            family_name: response.data.names[0].familyName,
        };

        console.log('User Info:', userInfo);
        res.json({ userInfo });
        /* Sample response body:
      {
          "userInfo": {
              "email": "nicmart@gmail.com",
              "name": "Nicolas Martinez",
              "picture": "https://lh3.googleusercontent.com/a/ACg8ocJyVz9ROm3HrVEUuXn1SgDyqx6iwms5nxnOgFDKyujfVQdJ-1HKLA=s96-c",
              "given_name": "Nicolas",
              "family_name": "Martinez"
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

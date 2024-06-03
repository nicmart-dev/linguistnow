const { OAuth2Client } = require('google-auth-library');
const { UserRefreshClient } = require('google-auth-library');

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
);

/* Route for exchanging JWT ID token for access token 
used to access Google Calendar API */
const getAccessToken = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        /* Sample input:
        code: '4/0AdLIrYfw1_czOdlcrCJ6d99Q...' */
        const { code } = req.body;
        const { tokens } = await oAuth2Client.getToken(code);
        console.log('Access tokens:', tokens);
        /* Sample tokens returned: {
            access_token: 'ya29.a0AXooCgs_ghFp3vO...',
            refresh_token: '1//06W96awgn_LGDCgYIARAAGAYSN...',
            scope: 'https://www.googleapis.com/auth/calendar.events openid https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            token_type: 'Bearer',
            id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
            expiry_date: 1717438079525 *
         }
          */
        res.json(tokens);
    } catch (error) {
        console.error('Error obtaining access token:', error);
        res.status(500).json({ error: 'Failed to obtain access token' });
    }
};

/* Route used to refresh user's token */
const refreshToken = async (req, res) => {
    try {
        const user = new UserRefreshClient(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            req.body.refreshToken,
        );
        const { credentials } = await user.refreshAccessToken();
        res.json(credentials);
    } catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(500).json({ error: 'Failed to refresh access token' });
    }
};

module.exports = {
    getAccessToken,
    refreshToken,
};

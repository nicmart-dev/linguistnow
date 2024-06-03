const { OAuth2Client } = require('google-auth-library');
const { UserRefreshClient } = require('google-auth-library');

const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'postmessage',
);

/* Route for exchanging JWT ID token for access token 
used to access Google Calendar API */
const getAccessToken = async (req, res) => {
    try {
        const { code } = req.body;
        const { tokens } = await oAuth2Client.getToken(code);
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

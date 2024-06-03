const express = require('express');
const app = express();

require('dotenv').config(); // load environment variables from a .env file into process.env
const PORT = process.env.PORT || 5000; // Define the port number, use environment variable if available

const cors = require('cors');

const authController = require('./controllers/authController');
const { OAuth2Client } = require('google-auth-library'); // needed to get access token from Google
const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
);

const usersController = require('./controllers/usersController');

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // allow * / all to access our api. All domains, ips, ports


// Default route
app.get('/', (req, res) => {
    res.send('Welcome to LinguistNow API server!');
});

// Use the routes defined in the controller
app.use('/users', usersController);

// Use routes to handle Google OAuth
app.post('/auth/google', authController.getAccessToken);
app.post('/auth/google/refresh-token', authController.refreshToken);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

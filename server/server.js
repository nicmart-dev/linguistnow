const express = require('express');
const app = express();

require('dotenv').config(); // load environment variables from a .env file into process.env
const PORT = process.env.PORT || 5000; // Define the port number, use environment variable if available

const cors = require('cors');

const authController = require('./controllers/authController');
const usersController = require("./controllers/usersController");

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // allow * / all to access our api. All domains, ips, ports

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to LinguistNow API server!');
});

// Use routes to handle Google OAuth and fetch user info
app.post('/auth/google/code', authController.exchangeCodeForToken);
app.post('/auth/google/userInfo', authController.getUserInfo);


// Use routes to handle user data
app.use("/users", usersController);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

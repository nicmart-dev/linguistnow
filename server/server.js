const express = require('express');
const app = express();

require('dotenv').config(); // load environment variables from a .env file into process.env
const PORT = process.env.PORT || 5000; // Define the port number, use environment variable if available

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req, res) => {
    res.send('Server is up and running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

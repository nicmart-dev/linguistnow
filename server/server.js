const express = require('express');
const app = express();

// load environment variables from a .env file into process.env
const dotenv = require('dotenv')
const envConfig = dotenv.config()

// Expand environment variables for nested variables
const dotenvExpand = require('dotenv-expand')
dotenvExpand.expand(envConfig)

const PORT = process.env.PORT || 5000; // Define the port number, use environment variable if available

const cors = require('cors');

/* Import routes */
const calendarRoutes = require('./routes/calendarRoutes');
const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // allow * / all to access our api. All domains, ips, ports

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to LinguistNow API server!');
});

// Health check endpoint for container orchestration (Docker, Portainer)
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Use routes to handle Google OAuth and fetch user info
app.use('/api/auth', authRoutes);

// Use routes to handle user data
app.use('/api/users', usersRoutes);

// Route to manage Google calendar user data handling
app.use('/api/calendars', calendarRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

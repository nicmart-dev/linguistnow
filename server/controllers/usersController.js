const express = require('express');
const router = express.Router();

// GET /users
router.get('/', (req, res) => {
    // Handle logic to fetch all users from the database
    res.send('Get all users');
});

// GET /users/:id
router.get('/:id', (req, res) => {
    const userId = req.params.id;
    // Handle logic to fetch user by ID from the database
    res.send(`Get user with ID ${userId}`);
});

// POST /users
router.post('/', (req, res) => {
    // Handle logic to create a new user in the database
    res.send('Create a new user');
});

// PUT /users/:id
router.put('/:id', (req, res) => {
    const userId = req.params.id;
    // Handle logic to update user by ID in the database
    res.send(`Update user with ID ${userId}`);
});

// DELETE /users/:id
router.delete('/:id', (req, res) => {
    const userId = req.params.id;
    // Handle logic to delete user by ID from the database
    res.send(`Delete user with ID ${userId}`);
});

module.exports = router;

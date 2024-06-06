const express = require('express');
const router = express.Router();

/* Configure Airtable DB using token, created using https://airtable.com/create/tokens
and connecting to associated base ID https://support.airtable.com/docs/finding-airtable-ids
*/
const Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID);


// GET /users
const getAll = (req, res) => {
    // Handle logic to fetch all users from the database
    res.send('Get all users');
};

// GET /users/:id
const getOne = (req, res) => {
    const userId = req.params.id;
    // Handle logic to fetch user by ID from the database
    res.send(`Get user with ID ${userId}`);
};

// POST /users
const create = (req, res) => {
    // Handle logic to create a new user in the database
    res.send('Create a new user');
};

// PUT /users/:id
const update = (req, res) => {
    const userId = req.params.id;
    // Handle logic to update user by ID in the database
    res.send(`Update user with ID ${userId}`);
};

// DELETE /users/:id
const remove = (req, res) => {
    const userId = req.params.id;
    // Handle logic to delete user by ID from the database
    res.send(`Delete user with ID ${userId}`);
};

module.exports = {
    getAll,
    getOne,
    create,
    update,
    remove
};

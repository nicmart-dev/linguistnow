const express = require('express');
const router = express.Router();

/* Configure Airtable DB using token, created using https://airtable.com/create/tokens
and connecting to associated base ID https://support.airtable.com/docs/finding-airtable-ids
*/
const Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID);


// GET /users
const getAll = async (req, res) => {
    try {
        const records = await base('Users').select().all();
        const users = records.map(record => record.fields);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// GET /users/:id
const getOne = async (req, res) => {
    const userId = req.params.id;
    try {
        const record = await base('Users').find(userId);
        res.json(record.fields);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

// POST /users
const create = async (req, res) => {
    const { email, name, picture_url, given_name, family_name, role = 'Linguist' } = req.body;
    try {
        const createdRecord = await base('Users').create({
            Email: email,
            Name: name,
            Picture: picture_url,
            Role: role
        });
        res.json(createdRecord.fields);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// PUT /users/:id
const update = async (req, res) => {
    const userId = req.params.id;
    const { calendarIds, accessToken, refreshToken } = req.body;
    try {
        const updatedRecord = await base('Users').update(userId, {
            'Calendar IDs': calendarIds.join(','),
            'Access Token': accessToken,
            'Refresh Token': refreshToken
        });
        res.json(updatedRecord.fields);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
};

// DELETE /users/:id
const remove = async (req, res) => {
    const userId = req.params.id;
    try {
        await base('Users').destroy(userId);
        res.send(`Deleted user with ID ${userId}`);
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

module.exports = {
    getAll,
    getOne,
    create,
    update,
    remove
};

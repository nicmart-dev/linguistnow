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
        console.log("Error getting users", error)
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// GET /users/:id
const getOne = async (req, res) => {
    const userEmail = req.params.id;
    /* Sample input: http://localhost:8080/api/users/john@gmail.com
     */
    try {
        const records = await base('Users').select({
            filterByFormula: `{Email} = '${userEmail}'`,
            maxRecords: 1
        }).firstPage();

        if (records.length > 0) {
            const record = records[0];
            res.json(record.fields);
            /* Sample return
            {
            "Role": "Linguist",
            "Picture": "https://lh3.googleusercontent.com/a/ACg8ocJyVz9ROm3HrVEUuXn1SgDyqx6iwms5nxnOgFDKyujfVQdJ-1HKLA=s96-c",
            "Email": "john@gmail.com",
            "Name": "John Doe"
            } */
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.log("Error getting single user", error)
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
        console.log("Error creating user", error)
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// PUT /users/:id
const update = async (req, res) => {
    const userEmail = req.params.id;
    const { calendarIds, googleAccessToken, googleRefreshToken } = req.body;
    try {
        // Find the record with the matching email address
        const records = await base('Users').select({
            filterByFormula: `{Email} = '${userEmail}'`,
            maxRecords: 1
        }).firstPage();

        if (records.length > 0) {
            const recordId = records[0].id;

            // Update the found record
            const updatedRecord = await base('Users').update(recordId, {
                'Calendar IDs': calendarIds.join(','), // Convert array to comma-separated string
                'Access Token': googleAccessToken,
                'Refresh Token': googleRefreshToken
            });

            res.json(updatedRecord.fields);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.log("Error updating user", error)
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
        console.log("Error deleting user", error)
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

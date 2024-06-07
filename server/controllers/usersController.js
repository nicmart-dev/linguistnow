const express = require('express');
const router = express.Router();

/* Configure Airtable DB using token, created using https://airtable.com/create/tokens
and connecting to associated base ID https://support.airtable.com/docs/finding-airtable-ids
*/
const Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN }).base(process.env.AIRTABLE_BASE_ID);


/* GET /users
Get all users from Airtable alongside all their fields */
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

/* GET /users/:id
Get a single user details based on their email address, set as primary key in Airtable */
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
                "Refresh Token": "1//0678v4x9toSLZCgYIARA[redacted]",
                "Picture": "https://lh3.googleusercontent.com/a/ACg8ocKHlwJUpk6cYZAH2WfJBUmyvWEP3UOeIlzxGvFwhomNAU1bLQ=s96-c",
                "Calendar IDs": "family04987092414361716379@group.calendar.google.com",
                "Access Token": "ya29.a0AXooCgvDaeOHh_jXF32d4M3JIf9Ids[redacted]",
                "Email": "pokemontest734@gmail.com",
                "Name": "Pokemon Test2"
            } */
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.log("Error getting single user", error)
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

/* POST /users
Create new user upon first log in based on information from Google User API */
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

/* PUT /users/:id
Update lists of calendars, and Google oAuth2 tokens for a user.
Used when user selects calendars and saves them in the account settings, 
or when the access token is refreshed. */
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
            const fieldsToUpdate = {};

            // Update the fields if provided
            if (calendarIds) fieldsToUpdate['Calendar IDs'] = calendarIds.join(',');
            if (googleAccessToken) fieldsToUpdate['Access Token'] = googleAccessToken;
            if (googleRefreshToken) fieldsToUpdate['Refresh Token'] = googleRefreshToken;

            // Check if any fields to update
            if (Object.keys(fieldsToUpdate).length > 0) {
                // Update the found record
                const updatedRecord = await base('Users').update(recordId, fieldsToUpdate);
                res.json(updatedRecord.fields);
            } else {
                res.status(400).json({ error: 'No fields provided for update' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.log("Error updating user", error)
        res.status(500).json({ error: 'Failed to update user' });
    }
};



/* DELETE /users/:id
TODO: not currently used */
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

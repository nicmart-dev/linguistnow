const axios = require('axios');

/* Check if given user is available against calendars they specified */
const triggerN8nWorkflow = async (calendarIds, accessToken) => {
    try {
        // URL of N8n webhook per https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.webhook
        const webhookUrl = `${process.env.N8N_WEBHOOK_URL}/calendar-check`;

        const response = await axios.post(webhookUrl, { calendarIds }, {
            headers: {
                Authorization: `Bearer ${accessToken}` // Pass access token in the header
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error triggering n8n workflow:', error);
        throw error;
    }
};

/* Save selected calendars
TODO: refactor so calendars are stored in DB, and 
n8n workflow triger only when PM search for available linguists
*/
const saveSelectedCalendars = async (req, res) => {
    const { calendarIds, googleAccessToken } = req.body; // Receive calendar ids list and access token from the front-end

    try {
        const result = await triggerN8nWorkflow(calendarIds, googleAccessToken); // Pass those to n8n workflow
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger n8n workflow' });
    }
};

module.exports = {
    saveSelectedCalendars,
};

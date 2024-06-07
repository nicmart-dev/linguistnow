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


module.exports = {
    triggerN8nWorkflow
};

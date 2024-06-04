const axios = require('axios');

const triggerN8nWorkflow = async (calendarIds) => {
    try {
        // URL of N8n webhook per https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.webhook
        const webhookUrl = `${process.env.N8N_WEBHOOK_URL_TEST}/calendar-check`;

        const response = await axios.post(webhookUrl, { calendarIds });
        return response.data;
    } catch (error) {
        console.error('Error triggering n8n workflow:', error);
        throw error;
    }
};

const saveSelectedCalendars = async (req, res) => {
    const { calendarIds } = req.body;

    try {
        const result = await triggerN8nWorkflow(calendarIds);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger n8n workflow' });
    }
};

module.exports = {
    saveSelectedCalendars,
};

const axios = require('axios');

/* Check if given user is available against calendars they specified */
// POST /api/calendars/free
const isUserFree = async (req, res) => {
    const { calendarIds, accessToken, userEmail } = req.body; // Receive calendar ids list, access token, and optionally user email from the front-end

    try {
        // URL of N8n webhook per https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.webhook
        // Construct webhook URL from base URL and path
        // Note: n8n automatically prefixes webhook paths with /webhook/
        // If workflow path is "calendar-check", the full path becomes /webhook/calendar-check
        const n8nBaseUrl = process.env.N8N_BASE_URL;
        const webhookPath = process.env.N8N_WEBHOOK_PATH || '/webhook/calendar-check';

        if (!n8nBaseUrl) {
            return res.status(500).json({ error: 'N8N_BASE_URL environment variable is not set' });
        }

        // Clean base URL: remove trailing slash and any existing /webhook/ path
        let baseUrl = n8nBaseUrl.replace(/\/$/, '');
        // Remove /webhook/calendar-check if it's already in the base URL to prevent duplication
        baseUrl = baseUrl.replace(/\/webhook\/calendar-check\/?$/, '');

        // Ensure webhook path starts with slash
        const cleanWebhookPath = webhookPath.startsWith('/') ? webhookPath : `/${webhookPath}`;
        const webhookUrl = `${baseUrl}${cleanWebhookPath}`;

        console.log(`Calling n8n webhook: ${webhookUrl}`);

        // Set timeout to 90 seconds (n8n default is 60s, but we want to catch timeouts gracefully)
        const response = await axios.post(webhookUrl, { calendarIds }, {
            headers: {
                Authorization: `Bearer ${accessToken}` // Pass access token in the header
            },
            timeout: 90000 // 90 seconds timeout
        });

        // Send the response back to the client
        res.status(200).json(response.data);
    } catch (error) {
        // Send error response back to the client with more details
        console.error('Error triggering n8n workflow:', error);

        // Provide more specific error messages
        if (error.response) {
            // n8n returned an error response
            const status = error.response.status;
            const data = error.response.data;

            if (status === 404) {
                return res.status(404).json({
                    error: 'n8n webhook not found',
                    details: data.message || 'The workflow may not be active. Please activate the workflow in n8n.',
                    hint: data.hint || 'Make sure the workflow is active in n8n for production URLs to work.',
                    userEmail: userEmail || null,
                    code: 'N8N_WEBHOOK_NOT_FOUND'
                });
            }

            return res.status(status).json({
                error: 'n8n workflow error',
                details: data.message || data.error || 'Unknown error from n8n workflow',
                userEmail: userEmail || null,
                code: 'N8N_WORKFLOW_ERROR'
            });
        }

        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            // Request timed out
            return res.status(504).json({
                error: 'n8n workflow timeout',
                details: 'The n8n workflow took too long to execute (exceeded 90 seconds). The workflow may be stuck or processing too much data.',
                hint: 'Check the n8n workflow execution logs. The "Stringify calendar list" node may be timing out.',
                userEmail: userEmail || null,
                code: 'N8N_WORKFLOW_TIMEOUT'
            });
        }

        if (error.request) {
            // Request was made but no response received
            return res.status(503).json({
                error: 'Cannot reach n8n workflow',
                details: 'The n8n service may be down or unreachable. Check N8N_BASE_URL configuration.',
                userEmail: userEmail || null,
                code: 'N8N_SERVICE_UNAVAILABLE'
            });
        }

        // Other errors
        res.status(500).json({
            error: 'Error triggering n8n workflow',
            details: error.message,
            userEmail: userEmail || null,
            code: 'N8N_UNKNOWN_ERROR'
        });
    }
};


module.exports = {
    isUserFree
};

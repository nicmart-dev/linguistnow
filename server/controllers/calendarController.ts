import axios from "axios";
import type { Request, Response } from "express";
import { env } from "../env.js";

interface CalendarCheckRequest {
  calendarIds: string[];
  accessToken: string;
  userEmail?: string;
}

/* Check if given user is available against calendars they specified */
// POST /api/calendars/free
export const isUserFree = async (
  req: Request<
    Record<string, never>,
    Record<string, never>,
    CalendarCheckRequest
  >,
  res: Response,
) => {
  const { calendarIds, accessToken, userEmail } = req.body; // Receive calendar ids list, access token, and optionally user email from the front-end

  try {
    // URL of N8n webhook per https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.webhook
    // Construct webhook URL from base URL and path
    // Note: n8n automatically prefixes webhook paths with /webhook/
    // If workflow path is "calendar-check", the full path becomes /webhook/calendar-check
    const n8nBaseUrl = env.N8N_BASE_URL || process.env.N8N_BASE_URL;
    const webhookPath =
      process.env.N8N_WEBHOOK_PATH || "/webhook/calendar-check";

    if (!n8nBaseUrl) {
      return res
        .status(500)
        .json({ error: "N8N_BASE_URL environment variable is not set" });
    }

    // Clean base URL: remove trailing slash and any existing /webhook/ path
    let baseUrl = n8nBaseUrl.replace(/\/$/, "");
    // Remove /webhook/calendar-check if it's already in the base URL to prevent duplication
    baseUrl = baseUrl.replace(/\/webhook\/calendar-check\/?$/, "");

    // Ensure webhook path starts with slash
    const cleanWebhookPath = webhookPath.startsWith("/")
      ? webhookPath
      : `/${webhookPath}`;
    const webhookUrl = `${baseUrl}${cleanWebhookPath}`;

    console.log(`Calling n8n webhook: ${webhookUrl}`);

    // Set timeout to 90 seconds (n8n default is 60s, but we want to catch timeouts gracefully)
    const response = await axios.post(
      webhookUrl,
      { calendarIds },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Pass access token in the header
        },
        timeout: 90000, // 90 seconds timeout
      },
    );

    // Send the response back to the client
    res.status(200).json(response.data);
  } catch (error: unknown) {
    // Send error response back to the client with more details
    console.error("Error triggering n8n workflow:", error);

    // Provide more specific error messages
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string; hint?: string };
        };
      };
      // n8n returned an error response
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      if (status === 404) {
        return res.status(404).json({
          error: "n8n webhook not found",
          details:
            data?.message ||
            "The workflow may not be active. Please activate the workflow in n8n.",
          hint:
            data?.hint ||
            "Make sure the workflow is active in n8n for production URLs to work.",
          userEmail: userEmail || null,
          code: "N8N_WEBHOOK_NOT_FOUND",
        });
      }

      return res.status(status || 500).json({
        error: "n8n workflow error",
        details:
          data?.message || data?.error || "Unknown error from n8n workflow",
        userEmail: userEmail || null,
        code: "N8N_WORKFLOW_ERROR",
      });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : undefined;

    if (errorCode === "ECONNABORTED" || errorMessage.includes("timeout")) {
      // Request timed out
      return res.status(504).json({
        error: "n8n workflow timeout",
        details:
          "The n8n workflow took too long to execute (exceeded 90 seconds). The workflow may be stuck or processing too much data.",
        hint: 'Check the n8n workflow execution logs. The "Stringify calendar list" node may be timing out.',
        userEmail: userEmail || null,
        code: "N8N_WORKFLOW_TIMEOUT",
      });
    }

    if (error && typeof error === "object" && "request" in error) {
      // Request was made but no response received
      return res.status(503).json({
        error: "Cannot reach n8n workflow",
        details:
          "The n8n service may be down or unreachable. Check N8N_BASE_URL configuration.",
        userEmail: userEmail || null,
        code: "N8N_SERVICE_UNAVAILABLE",
      });
    }

    // Other errors
    res.status(500).json({
      error: "Error triggering n8n workflow",
      details: errorMessage,
      userEmail: userEmail || null,
      code: "N8N_UNKNOWN_ERROR",
    });
  }
};

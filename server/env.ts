import { z } from "zod";
import "dotenv/config";

const envSchema = z
  .object({
    PORT: z.coerce.number().default(5000),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    FRONTEND_URL: z.url().optional(),
    AIRTABLE_PERSONAL_ACCESS_TOKEN: z.string().min(1).optional(),
    AIRTABLE_API_KEY: z.string().min(1).optional(),
    AIRTABLE_BASE_ID: z.string().min(1),
    N8N_BASE_URL: z.url().optional(),
    N8N_WEBHOOK_PATH: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.url().optional(),
    BACKEND_URL: z.url().optional(),
  })
  .refine(
    (data) => data.AIRTABLE_PERSONAL_ACCESS_TOKEN || data.AIRTABLE_API_KEY,
    {
      message:
        "Either AIRTABLE_PERSONAL_ACCESS_TOKEN or AIRTABLE_API_KEY must be set",
    },
  );

export const env = envSchema.parse(process.env);
